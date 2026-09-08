using System.Text.Json.Serialization;

namespace OrbitAccess.Models;

public class GitHubRepo
{
    public long Id { get; set; }
    public string? Name { get; set; }
    public bool Private { get; set; }
    public string? Language { get; set; }
    public int StargazersCount { get; set; }
    public string? PushedAt { get; set; }
    public int OwnerId { get; set; }
    public string? OwnerLogin { get; set; }
}

public class GitHubOrg
{
    public string? Login { get; set; }
    public string? AvatarUrl { get; set; }
    public long Id { get; set; }
    public List<GitHubRepo> Repos { get; set; } = new();
}

public class GitHubCollaborator
{
    public string? Login { get; set; }
    public string? AvatarUrl { get; set; }
    public string? HtmlUrl { get; set; }
    public string? RoleName { get; set; }
}
