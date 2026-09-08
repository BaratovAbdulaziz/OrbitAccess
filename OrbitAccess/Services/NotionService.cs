using System.Text;
using OrbitAccess.Models;

namespace OrbitAccess.Services;

/// <summary>
/// Notion OAuth + search client. Mirrors lib/notion.js.
/// </summary>
public class NotionService
{
    private const string Version = "2022-06-28";
    private readonly IHttpClientFactory _http;
    private readonly IConfiguration _config;
    private readonly ILogger<NotionService> _logger;

    public NotionService(IHttpClientFactory http, IConfiguration config, ILogger<NotionService> logger)
    {
        _http = http;
        _config = config;
        _logger = logger;
    }

    public string? ClientId => _config["NOTION_CLIENT_ID"];
    public string? ClientSecret => _config["NOTION_CLIENT_SECRET"];
    public string? ConfiguredToken => _config["NOTION_TOKEN"];

    public string AuthorizeUrl(string redirectUri, string state)
    {
        var q = new Dictionary<string, string>
        {
            ["client_id"] = ClientId!,
            ["response_type"] = "code",
            ["owner"] = "user",
            ["redirect_uri"] = redirectUri,
            ["state"] = state,
        };
        return $"https://api.notion.com/v1/oauth/authorize?{string.Join("&", q.Select(kv => $"{kv.Key}={Uri.EscapeDataString(kv.Value)}"))}";
    }

    public async Task<(string AccessToken, string? WorkspaceName, string? WorkspaceIcon)> ExchangeCodeAsync(string code, string redirectUri)
    {
        var basic = Convert.ToBase64String(Encoding.UTF8.GetBytes($"{ClientId}:{ClientSecret}"));
        var client = _http.CreateClient();
        var request = new HttpRequestMessage(HttpMethod.Post, "https://api.notion.com/v1/oauth/token");
        request.Headers.Authorization = new System.Net.Http.Headers.AuthenticationHeaderValue("Basic", basic);
        request.Headers.Add("Notion-Version", Version);
        request.Content = JsonContent.Create(new { grant_type = "authorization_code", code, redirect_uri = redirectUri });
        var response = await client.SendAsync(request);
        if (!response.IsSuccessStatusCode)
        {
            var detail = await response.Content.ReadAsStringAsync();
            throw new InvalidOperationException($"Notion token exchange failed ({(int)response.StatusCode}) {detail}".Trim());
        }
        using var doc = await JsonDocument.ParseAsync(await response.Content.ReadAsStreamAsync());
        var root = doc.RootElement;
        var token = root.GetString("access_token")!;
        string? workspaceName = null, workspaceIcon = null;
        if (root.TryGetProperty("workspace_name", out var wn)) workspaceName = wn.GetString();
        if (root.TryGetProperty("workspace_icon", out var wi)) workspaceIcon = wi.GetString();
        return (token, workspaceName, workspaceIcon);
    }

    public async Task<List<NotionItem>> SearchAsync(string token)
    {
        var client = _http.CreateClient();
        var request = new HttpRequestMessage(HttpMethod.Post, "https://api.notion.com/v1/search");
        request.Headers.Authorization = new System.Net.Http.Headers.AuthenticationHeaderValue("Bearer", token);
        request.Headers.Add("Notion-Version", Version);
        request.Content = JsonContent.Create(new { page_size = 100 });
        var response = await client.SendAsync(request);
        if (!response.IsSuccessStatusCode) throw new InvalidOperationException($"Notion search failed ({(int)response.StatusCode})");
        using var doc = await JsonDocument.ParseAsync(await response.Content.ReadAsStreamAsync());
        var items = new List<NotionItem>();
        if (!doc.RootElement.TryGetProperty("results", out var results)) return items;
        foreach (var e in results.EnumerateArray())
        {
            var parentType = e.TryGetProperty("parent", out var parent)
                ? parent.GetString("type")
                : null;
            items.Add(new NotionItem
            {
                Object = e.GetString("object"),
                Id = e.GetString("id"),
                Url = e.GetString("url"),
                Title = PlainTitle(e) ?? "Untitled",
                Icon = e.TryGetProperty("icon", out var icon) && icon.GetString("type") == "emoji"
                    ? icon.TryGetProperty("emoji", out var emoji) ? emoji.GetString() : null
                    : null,
                Parent = parentType switch
                {
                    "database_id" => "In a database",
                    "page_id" => "Sub-page",
                    "block_id" => "Nested block",
                    "workspace" => "Top level",
                    _ => "Workspace",
                },
                Edited = e.GetString("last_edited_time"),
            });
        }
        return items
            .OrderByDescending(i => i.Edited ?? "")
            .ToList();
    }

    private static string? PlainTitle(JsonElement item)
    {
        if (item.GetString("object") == "database" && item.TryGetProperty("title", out var titleArr))
            return JoinPlainText(titleArr);
        if (item.TryGetProperty("properties", out var props))
        {
            foreach (var prop in props.EnumerateObject())
            {
                if (prop.Value.GetString("type") == "title" && prop.Value.TryGetProperty("title", out var t))
                    return JoinPlainText(t);
            }
        }
        return null;
    }

    private static string JoinPlainText(JsonElement arr)
    {
        var sb = new StringBuilder();
        if (arr.ValueKind != JsonValueKind.Array) return "";
        foreach (var e in arr.EnumerateArray())
        {
            if (e.TryGetProperty("plain_text", out var t)) sb.Append(t.GetString());
        }
        return sb.ToString().Trim();
    }
}
