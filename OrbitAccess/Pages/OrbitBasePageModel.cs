using Microsoft.AspNetCore.Mvc;
using Microsoft.AspNetCore.Mvc.RazorPages;
using OrbitAccess.Models;
using OrbitAccess.Services;

namespace OrbitAccess.Pages;

public abstract class OrbitBasePageModel : PageModel
{
    private readonly SessionService? _sessions;

    public Session? Session { get; protected set; }

    protected OrbitBasePageModel() { }

    protected OrbitBasePageModel(SessionService sessions)
    {
        _sessions = sessions;
    }

    protected string? Sid => Request.Cookies["sid"];
    protected string? Nid => Request.Cookies["nid"];

    /// <summary>
    /// Resolve the session from the sid/nid cookies; merge a Notion connection from the
    /// configured default token if present. Mirrors lib/routes.js resolveSession.
    /// </summary>
    protected async Task ResolveSessionAsync()
    {
        var session = _sessions is null ? null : await _sessions.ResolveAsync(Sid);

        if (session == null && _sessions is not null && _sessions.Memory.TryGetValue(Sid ?? "", out var mem))
            session = mem;

        if (session == null)
        {
            var notionStore = HttpContext.RequestServices.GetService<JsonFileStore>();
            if (notionStore is not null && !string.IsNullOrEmpty(Nid))
                session = await LoadNotionSessionAsync(notionStore, null);

            if (session == null)
                session = new Session();
        }

        var notionService = HttpContext.RequestServices.GetService<NotionService>();
        if (session.Notion == null && notionService?.ConfiguredToken != null)
        {
            session.Notion = new NotionData { Token = notionService.ConfiguredToken };
        }

        Session = session;
        ViewData["Session"] = session;
    }

    private async Task<Session> LoadNotionSessionAsync(JsonFileStore notionStore, Session? github)
    {
        var saved = await notionStore.GetAsync<Models.NotionData>("notion", Nid!);
        if (saved == null) return github ?? new Session();
        return new Session
        {
            User = github?.User,
            OwnPublic = github?.OwnPublic ?? new List<GitHubRepo>(),
            OwnPrivate = github?.OwnPrivate ?? new List<GitHubRepo>(),
            Orgs = github?.Orgs ?? new List<GitHubOrg>(),
            Token = github?.Token,
            Notion = saved,
        };
    }

    /// <summary>Redirect with a 302 and set the given cookies.</summary>
    protected IActionResult RedirectWithCookies(string path, params (string Name, string Value)[] cookies)
    {
        foreach (var c in cookies)
        {
            Response.Cookies.Append(c.Name, c.Value, new CookieOptions
            {
                HttpOnly = true,
                Path = "/",
                SameSite = SameSiteMode.Lax,
                Secure = Request.IsHttps,
            });
        }
        return Redirect(path);
    }

    protected string RandomHex(int bytes) => SessionService.RandomHex(bytes);
}