using Microsoft.AspNetCore.Mvc;
using OrbitAccess.Models;
using OrbitAccess.Services;

namespace OrbitAccess.Controllers;

[ApiController]
public class ApiController : ControllerBase
{
    private readonly SessionService _sessions;
    private readonly GitHubService _github;
    private readonly NotionAccessService _notionAccess;
    private readonly RateLimiter _rateLimiter;
    private readonly ILogger<ApiController> _logger;

    public ApiController(SessionService sessions, GitHubService github, NotionAccessService notionAccess, RateLimiter rateLimiter, ILogger<ApiController> logger)
    {
        _sessions = sessions;
        _github = github;
        _notionAccess = notionAccess;
        _rateLimiter = rateLimiter;
        _logger = logger;
    }

    private string? SidCookie => Request.Cookies["sid"];

    private async Task<Session?> ResolveSessionAsync()
        => SidCookie != null ? await _sessions.ResolveAsync(SidCookie) : null;

    /* ── GitHub repo access control ── */

    [HttpGet("/api/access/{owner}/{repo}")]
    public async Task<IActionResult> ListCollaborators(string owner, string repo)
    {
        var session = await ResolveSessionAsync();
        if (session?.Token == null)
            return Unauthorized(new { error = "unauthorized" });

        var (_, _, collaborators) = await _github.GetCollaboratorsAsync(session.Token, owner, repo);
        if (collaborators == null)
            return Ok(new { error = 403 });
        return Ok(collaborators);
    }

    [HttpPost("/api/access/{owner}/{repo}")]
    public async Task<IActionResult> InviteCollaborator(string owner, string repo, [FromBody] JsonElement body)
    {
        var session = await ResolveSessionAsync();
        if (session?.Token == null || session.User == null)
            return Unauthorized(new { error = "unauthorized" });

        if (!_rateLimiter.Allow($"api:{session.User.Login}", 10, 60_000))
            return StatusCode(429, new { ok = false, message = "Rate limit exceeded. Try again in a minute." });

        var input = body.GetString("user")?.Trim() ?? "";
        var permissionRaw = body.GetString("permission") ?? "push";
        var permission = new[] { "pull", "triage", "push", "maintain", "admin" }.Contains(permissionRaw) ? permissionRaw : "push";

        if (input.Length == 0)
            return Ok(new { ok = false, message = "Enter a GitHub username or email." });

        var username = await _github.ResolveUserAsync(session.Token, input);
        if (username == null)
            return Ok(new { ok = false, message = $"Couldn't resolve \"{input}\" to a GitHub account." });

        var (ok, message) = await _github.AddCollaboratorAsync(session.Token, owner, repo, username, permission);
        return Ok(new
        {
            ok,
            message = ok ? $"{username} invited with {permission} access." : (message ?? "GitHub refused this invite."),
            reload = ok,
        });
    }

    /* ── Notion access control ── */

    private async Task<(Session? Session, bool HasNotion, bool HasUser)> NotionContextAsync()
    {
        var session = await ResolveSessionAsync();
        if (session?.Notion?.Token == null)
            return (new Session(), false, false);
        return (session, true, session.User != null);
    }

    [HttpGet("/api/notion/access")]
    public async Task<IActionResult> GetNotionAccess([FromQuery] string? pageId)
    {
        var (session, hasNotion, hasUser) = await NotionContextAsync();
        if (!hasNotion) return Unauthorized(new { error = "notion_not_connected" });
        if (!hasUser) return Unauthorized(new { error = "unauthorized" });

        if (!string.IsNullOrEmpty(pageId))
        {
            var grants = await _notionAccess.GetGrantsAsync(pageId);
            var list = grants.Select(g => new
            {
                email = g.Key,
                level = g.Value.Level,
                grantedAt = g.Value.GrantedAt,
                grantedBy = g.Value.GrantedBy,
            });
            var link = await _notionAccess.GetLinkForPageAsync(pageId);
            return Ok(new
            {
                ok = true,
                grants = list,
                link = link.HasValue ? new { token = link.Value.Token, url = $"{Request.Scheme}://{Request.Host}/share/{link.Value.Token}" } : (object?)null,
            });
        }

        var all = await _notionAccess.GetAllGrantsAsync();
        return Ok(new { ok = true, grants = all });
    }

    [HttpPost("/api/notion/access")]
    public async Task<IActionResult> GrantNotionAccess([FromBody] JsonElement body)
    {
        var (session, hasNotion, hasUser) = await NotionContextAsync();
        if (!hasNotion) return Unauthorized(new { error = "notion_not_connected" });
        if (!hasUser) return Unauthorized(new { error = "unauthorized" });

        if (!_rateLimiter.Allow($"notion:{session!.User!.Login}", 15, 60_000))
            return StatusCode(429, new { ok = false, message = "Rate limit exceeded. Try again in a minute." });

        var pageId = body.GetString("pageId") ?? "";
        var email = body.GetString("email") ?? "";
        var level = body.GetString("level") ?? "read";
        if (string.IsNullOrEmpty(pageId) || string.IsNullOrEmpty(email))
            return Ok(new { ok = false, message = "pageId and email are required." });

        var ok = await _notionAccess.GrantAsync(pageId, email, level, session.User.Login);
        if (!ok)
            return Ok(new { ok = false, message = "Invalid email format." });

        return Ok(new { ok = true, message = $"Access granted to {email} with {level} level." });
    }

    [HttpDelete("/api/notion/access")]
    public async Task<IActionResult> RevokeNotionAccess([FromBody] JsonElement body)
    {
        var (session, hasNotion, hasUser) = await NotionContextAsync();
        if (!hasNotion) return Unauthorized(new { error = "notion_not_connected" });
        if (!hasUser) return Unauthorized(new { error = "unauthorized" });

        var pageId = body.GetString("pageId") ?? "";
        var email = body.GetString("email") ?? "";
        if (string.IsNullOrEmpty(pageId) || string.IsNullOrEmpty(email))
            return Ok(new { ok = false, message = "pageId and email are required." });

        var ok = await _notionAccess.RevokeAsync(pageId, email);
        return Ok(new { ok, message = ok ? $"Access revoked for {email}." : "No grant found." });
    }

    [HttpGet("/api/notion/access/link")]
    public async Task<IActionResult> GetNotionLink([FromQuery] string? pageId)
    {
        var (session, hasNotion, hasUser) = await NotionContextAsync();
        if (!hasNotion) return Unauthorized(new { error = "notion_not_connected" });
        if (!hasUser) return Unauthorized(new { error = "unauthorized" });

        if (!string.IsNullOrEmpty(pageId))
        {
            var link = await _notionAccess.GetLinkForPageAsync(pageId);
            if (link.HasValue)
                return Ok(new { ok = true, token = link.Value.Token, url = $"{Request.Scheme}://{Request.Host}/share/{link.Value.Token}", createdAt = link.Value.Link.CreatedAt });
            return Ok(new { ok = false, message = "No share link for this page." });
        }

        var all = await _notionAccess.GetAllLinksAsync();
        return Ok(new { ok = true, links = all });
    }

    [HttpPost("/api/notion/access/link")]
    public async Task<IActionResult> CreateNotionLink([FromBody] JsonElement body)
    {
        var (session, hasNotion, hasUser) = await NotionContextAsync();
        if (!hasNotion) return Unauthorized(new { error = "notion_not_connected" });
        if (!hasUser) return Unauthorized(new { error = "unauthorized" });

        if (!_rateLimiter.Allow($"notion:{session!.User!.Login}", 15, 60_000))
            return StatusCode(429, new { ok = false, message = "Rate limit exceeded. Try again in a minute." });

        var pageId = body.GetString("pageId") ?? "";
        if (string.IsNullOrEmpty(pageId))
            return Ok(new { ok = false, message = "pageId is required." });

        var existing = await _notionAccess.GetLinkForPageAsync(pageId);
        if (existing.HasValue)
            return Ok(new { ok = true, token = existing.Value.Token, url = $"{Request.Scheme}://{Request.Host}/share/{existing.Value.Token}", message = "Share link already exists." });

        var token = await _notionAccess.CreateLinkAsync(pageId, session.User.Login);
        return Ok(new { ok = true, token, url = $"{Request.Scheme}://{Request.Host}/share/{token}", message = "Share link created." });
    }

    [HttpDelete("/api/notion/access/link")]
    public async Task<IActionResult> RevokeNotionLink([FromBody] JsonElement body)
    {
        var (session, hasNotion, hasUser) = await NotionContextAsync();
        if (!hasNotion) return Unauthorized(new { error = "notion_not_connected" });
        if (!hasUser) return Unauthorized(new { error = "unauthorized" });

        var token = body.GetString("token");
        var pageId = body.GetString("pageId");
        if (!string.IsNullOrEmpty(token))
        {
            var ok = await _notionAccess.RevokeLinkAsync(token);
            return Ok(new { ok, message = ok ? "Share link revoked." : "Link not found." });
        }
        if (!string.IsNullOrEmpty(pageId))
        {
            var ok = await _notionAccess.RevokeLinkByPageAsync(pageId);
            return Ok(new { ok, message = ok ? "Share link revoked." : "No link found for this page." });
        }
        return Ok(new { ok = false, message = "token or pageId is required." });
    }
}