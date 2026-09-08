namespace OrbitAccess.Models;

public class Session
{
    public string? Token { get; set; }
    public GitHubUser? User { get; set; }
    public List<GitHubRepo> OwnPublic { get; set; } = new();
    public List<GitHubRepo> OwnPrivate { get; set; } = new();
    public List<GitHubOrg> Orgs { get; set; } = new();
    public NotionData? Notion { get; set; }
}

public class NotionData
{
    public string? Token { get; set; }
    public List<NotionItem> Items { get; set; } = new();
    public string? WorkspaceName { get; set; }
    public string? WorkspaceIcon { get; set; }
}

public class NotionItem
{
    public string? Object { get; set; }
    public string? Id { get; set; }
    public string? Url { get; set; }
    public string? Title { get; set; }
    public string? Icon { get; set; }
    public string? Parent { get; set; }
    public string? Edited { get; set; }
}

public class NotionGrant
{
    public string? Level { get; set; }
    public string? GrantedAt { get; set; }
    public string? GrantedBy { get; set; }
}

public class NotionShareLink
{
    public string? PageId { get; set; }
    public string? CreatedAt { get; set; }
    public string? CreatedBy { get; set; }
}
