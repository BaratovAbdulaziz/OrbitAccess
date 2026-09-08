namespace OrbitAccess.Models;

public class GitHubUser
{
    public string? Login { get; set; }
    public long Id { get; set; }
    public string? Name { get; set; }
    public string? Email { get; set; }
    public string? AvatarUrl { get; set; }
    public string? HtmlUrl { get; set; }
    public string? Location { get; set; }
    public int Followers { get; set; }

    public static GitHubUser FromJson(JsonElement e)
    {
        return new GitHubUser
        {
            Login = e.GetString("login"),
            Id = e.GetInt64("id"),
            Name = e.GetString("name"),
            Email = e.GetString("email"),
            AvatarUrl = e.GetString("avatar_url"),
            HtmlUrl = e.GetString("html_url"),
            Location = e.GetString("location"),
            Followers = e.TryGetProperty("followers", out var f) && f.ValueKind == JsonValueKind.Number ? f.GetInt32() : 0,
        };
    }
}
