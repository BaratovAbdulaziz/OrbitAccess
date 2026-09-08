using Microsoft.AspNetCore.Mvc;
using Microsoft.AspNetCore.Mvc.RazorPages;
using OrbitAccess.Models;
using OrbitAccess.Services;

namespace OrbitAccess.Pages;

public class NotionCallbackModel : PageModel
{
    private readonly NotionService _notion;
    private readonly JsonFileStore _store;
    private readonly SessionService _sessions;
    private readonly IConfiguration _config;
    private readonly ILogger<NotionCallbackModel> _logger;

    public NotionCallbackModel(NotionService notion, JsonFileStore store, SessionService sessions, IConfiguration config, ILogger<NotionCallbackModel> logger)
    {
        _notion = notion;
        _store = store;
        _sessions = sessions;
        _config = config;
        _logger = logger;
    }

    public async Task<IActionResult> OnGetAsync(string? code, string? state)
    {
        var expected = Request.Cookies["notion_state"];
        if (string.IsNullOrEmpty(code) || code.Length == 0 || expected == null || state != expected)
        {
            ViewData["MessageHeading"] = "Notion connection failed";
            ViewData["MessageBody"] = "The request could not be verified (invalid state). Please try connecting again.";
            ViewData["MessageError"] = true;
            Response.StatusCode = 400;
            return Page();
        }

        try
        {
            var redirect = _config["NOTION_REDIRECT_URI"] ?? "http://localhost:3000/notion/callback";
            var (token, workspaceName, workspaceIcon) = await _notion.ExchangeCodeAsync(code, redirect);
            var items = new List<NotionItem>();
            try { items = await _notion.SearchAsync(token); }
            catch (Exception ex) { _logger.LogWarning(ex, "Notion search failed"); }

            var payload = new NotionData
            {
                Token = token,
                Items = items,
                WorkspaceName = workspaceName,
                WorkspaceIcon = workspaceIcon,
            };

            var nid = SessionService.RandomHex(16);
            await _store.SetAsync("notion", nid, payload);

            var oldNid = Request.Cookies["nid"];
            if (oldNid != null && oldNid != nid) await _store.DelAsync("notion", oldNid);

            var sid = Request.Cookies["sid"];
            var session = sid != null ? await _sessions.ResolveAsync(sid) : null;
            if (session != null)
            {
                session.Notion = payload;
                await _sessions.SaveAsync(sid!, session);
            }
            else
            {
                // Notion-only session
                var newSid = SessionService.RandomHex(32);
                await _sessions.SaveAsync(newSid, new Session { Notion = payload });
                sid = newSid;
            }

            Response.Cookies.Append("nid", nid, new CookieOptions { HttpOnly = true, Path = "/", SameSite = SameSiteMode.Lax, MaxAge = TimeSpan.FromDays(365) });
            if (sid != null)
                Response.Cookies.Append("sid", sid, new CookieOptions { HttpOnly = true, Path = "/", SameSite = SameSiteMode.Lax, MaxAge = TimeSpan.FromDays(30) });
            Response.Cookies.Delete("notion_state");
            return Redirect("/notion");
        }
        catch (Exception ex)
        {
            _logger.LogError(ex, "Notion OAuth callback failed");
            ViewData["MessageHeading"] = "Notion connection failed";
            ViewData["MessageBody"] = "Notion rejected the code or the API hiccuped. Please try again.";
            ViewData["MessageError"] = true;
            Response.StatusCode = 500;
            return Page();
        }
    }
}