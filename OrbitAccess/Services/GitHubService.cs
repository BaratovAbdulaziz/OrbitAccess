using OrbitAccess.Models;

namespace OrbitAccess.Services;

/// <summary>
/// GitHub REST + OAuth client. Mirrors lib/github.js.
/// </summary>
public class GitHubService
{
    private readonly IHttpClientFactory _http;
    private readonly IConfiguration _config;
    private readonly ILogger<GitHubService> _logger;

    public GitHubService(IHttpClientFactory http, IConfiguration config, ILogger<GitHubService> logger)
    {
        _http = http;
        _config = config;
        _logger = logger;
    }

    public string? ClientId => _config["GITHUB_CLIENT_ID"];
    public string? ClientSecret => _config["GITHUB_CLIENT_SECRET"];

    public string RedirectUri =>
        _config["GITHUB_REDIRECT_URI"] ?? $"http://localhost:{_config["PORT"] ?? "3000"}/";

    public string AuthorizeUrl(string state)
    {
        var q = new Dictionary<string, string>
        {
            ["client_id"] = ClientId!,
            ["redirect_uri"] = RedirectUri,
            ["scope"] = "read:user repo read:org",
            ["state"] = state,
        };
        return $"https://github.com/login/oauth/authorize?{string.Join("&", q.Select(kv => $"{kv.Key}={Uri.EscapeDataString(kv.Value)}"))}";
    }

    public async Task<string> ExchangeCodeAsync(string code)
    {
        var client = _http.CreateClient();
        var response = await client.PostAsJsonAsync("https://github.com/login/oauth/access_token", new
        {
            client_id = ClientId,
            client_secret = ClientSecret,
            code
        });
        var data = await response.Content.ReadFromJsonAsync<JsonElement>();
        if (!data.TryGetProperty("access_token", out var t))
        {
            var desc = data.GetString("error_description") ?? "Token exchange failed";
            throw new InvalidOperationException(desc);
        }
        return t.GetString()!;
    }

    public async Task<GitHubUser> GetUserAsync(string token)
    {
        using var doc = await ApiCallAsync(token, "GET", "/user");
        return GitHubUser.FromJson(doc.RootElement);
    }

    public async Task<List<GitHubRepo>> GetReposAsync(string token, string visibility)
    {
        var repos = new List<GitHubRepo>();
        using var doc = await TryApiCallAsync(token, "GET", $"/user/repos?visibility={visibility}&sort=pushed&direction=desc&per_page=6");
        if (doc == null) return repos;
        foreach (var e in doc.RootElement.EnumerateArray())
        {
            repos.Add(new GitHubRepo
            {
                Id = e.GetInt64("id"),
                Name = e.GetString("name"),
                Private = e.GetBool("private"),
                Language = e.GetString("language"),
                StargazersCount = e.GetInt("stargazers_count"),
                PushedAt = e.GetString("pushed_at"),
                OwnerId = e.TryGetProperty("owner", out var owner) ? owner.GetInt("id") : 0,
                OwnerLogin = e.TryGetProperty("owner", out owner) ? owner.GetString("login") : null,
            });
        }
        return repos;
    }

    public async Task<List<GitHubOrg>> GetOrgsAsync(string token)
    {
        var orgs = new List<GitHubOrg>();
        using var doc = await TryApiCallAsync(token, "GET", "/user/orgs?per_page=8");
        if (doc == null) return orgs;
        foreach (var e in doc.RootElement.EnumerateArray())
        {
            orgs.Add(new GitHubOrg
            {
                Login = e.GetString("login"),
                AvatarUrl = e.GetString("avatar_url"),
                Id = e.GetInt64("id"),
                Repos = await GetOrgReposAsync(token, e.GetString("login")!),
            });
        }
        return orgs;
    }

    private async Task<List<GitHubRepo>> GetOrgReposAsync(string token, string login)
    {
        var repos = new List<GitHubRepo>();
        using var doc = await TryApiCallAsync(token, "GET", $"/orgs/{Uri.EscapeDataString(login)}/repos?sort=pushed&direction=desc&per_page=6");
        if (doc == null) return repos;
        foreach (var e in doc.RootElement.EnumerateArray())
        {
            repos.Add(new GitHubRepo
            {
                Id = e.GetInt64("id"),
                Name = e.GetString("name"),
                Private = e.GetBool("private"),
                Language = e.GetString("language"),
                StargazersCount = e.GetInt("stargazers_count"),
                PushedAt = e.GetString("pushed_at"),
                OwnerId = e.TryGetProperty("owner", out var owner) ? owner.GetInt("id") : 0,
                OwnerLogin = e.TryGetProperty("owner", out owner) ? owner.GetString("login") : null,
            });
        }
        return repos;
    }

    public async Task<(int Status, string? Error, List<GitHubCollaborator>? Collaborators)> GetCollaboratorsAsync(string token, string owner, string repo)
    {
        var client = _http.CreateClient();
        var request = new HttpRequestMessage(HttpMethod.Get,
            $"https://api.github.com/repos/{Uri.EscapeDataString(owner)}/{Uri.EscapeDataString(repo)}/collaborators?per_page=100");
        request.Headers.Authorization = new System.Net.Http.Headers.AuthenticationHeaderValue("Bearer", token);
        request.Headers.Accept.Add(new System.Net.Http.Headers.MediaTypeWithQualityHeaderValue("application/vnd.github+json"));
        var response = await client.SendAsync(request);
        if (!response.IsSuccessStatusCode) return ((int)response.StatusCode, null, null);
        var list = new List<GitHubCollaborator>();
        using var doc = await JsonDocument.ParseAsync(await response.Content.ReadAsStreamAsync());
        foreach (var e in doc.RootElement.EnumerateArray())
        {
            list.Add(new GitHubCollaborator
            {
                Login = e.GetString("login"),
                AvatarUrl = e.GetString("avatar_url"),
                HtmlUrl = e.GetString("html_url"),
                RoleName = e.GetString("role_name"),
            });
        }
        return (200, null, list);
    }

    public async Task<string?> ResolveUserAsync(string token, string input)
    {
        if (!input.Contains('@')) return input;
        var client = _http.CreateClient();
        var q = Uri.EscapeDataString($"{input} in:email");
        var request = new HttpRequestMessage(HttpMethod.Get, $"https://api.github.com/search/users?q={q}&per_page=1");
        request.Headers.Authorization = new System.Net.Http.Headers.AuthenticationHeaderValue("Bearer", token);
        request.Headers.Accept.Add(new System.Net.Http.Headers.MediaTypeWithQualityHeaderValue("application/vnd.github+json"));
        var response = await client.SendAsync(request);
        if (!response.IsSuccessStatusCode) return null;
        using var doc = await JsonDocument.ParseAsync(await response.Content.ReadAsStreamAsync());
        if (doc.RootElement.TryGetProperty("items", out var items) && items.GetArrayLength() > 0)
        {
            return items[0].GetString("login");
        }
        return null;
    }

    public async Task<(bool Ok, string? Message)> AddCollaboratorAsync(string token, string owner, string repo, string username, string permission)
    {
        var client = _http.CreateClient();
        var request = new HttpRequestMessage(HttpMethod.Put,
            $"https://api.github.com/repos/{Uri.EscapeDataString(owner)}/{Uri.EscapeDataString(repo)}/collaborators/{Uri.EscapeDataString(username)}");
        request.Headers.Authorization = new System.Net.Http.Headers.AuthenticationHeaderValue("Bearer", token);
        request.Headers.Accept.Add(new System.Net.Http.Headers.MediaTypeWithQualityHeaderValue("application/vnd.github+json"));
        request.Content = JsonContent.Create(new { permission });
        var response = await client.SendAsync(request);
        if (response.StatusCode == System.Net.HttpStatusCode.Created || response.StatusCode == System.Net.HttpStatusCode.NoContent)
            return (true, null);
        string message = "GitHub refused this invite.";
        try
        {
            using var doc = await JsonDocument.ParseAsync(await response.Content.ReadAsStreamAsync());
            message = doc.RootElement.GetString("message") ?? message;
        }
        catch { }
        return (false, message);
    }

    private async Task<JsonDocument> ApiCallAsync(string token, string method, string path)
    {
        var client = _http.CreateClient();
        var request = new HttpRequestMessage(new HttpMethod(method), $"https://api.github.com{path}");
        request.Headers.Authorization = new System.Net.Http.Headers.AuthenticationHeaderValue("Bearer", token);
        request.Headers.Accept.Add(new System.Net.Http.Headers.MediaTypeWithQualityHeaderValue("application/vnd.github+json"));
        var response = await client.SendAsync(request);
        if (!response.IsSuccessStatusCode) throw new HttpRequestException($"GitHub API error {(int)response.StatusCode}");
        return await JsonDocument.ParseAsync(await response.Content.ReadAsStreamAsync());
    }

    private async Task<JsonDocument?> TryApiCallAsync(string token, string method, string path)
    {
        try { return await ApiCallAsync(token, method, path); }
        catch (Exception ex) { _logger.LogWarning(ex, "GitHub API call failed: {Path}", path); return null; }
    }
}
