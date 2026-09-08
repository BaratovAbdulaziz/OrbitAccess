using Microsoft.AspNetCore.Mvc;
using Microsoft.AspNetCore.Mvc.RazorPages;
using OrbitAccess.Models;
using OrbitAccess.Services;

namespace OrbitAccess.Pages;

public class IndexModel : OrbitBasePageModel
{
    private readonly SessionService _sessions;
    private readonly GitHubService _github;
    private readonly JsonFileStore _store;
    private readonly NotionService _notion;
    private readonly IWebHostEnvironment _env;
    private readonly ILogger<IndexModel> _logger;

    public IndexModel(SessionService sessions, GitHubService github, JsonFileStore store, NotionService notion, IWebHostEnvironment env, ILogger<IndexModel> logger)
        : base(sessions)
    {
        _sessions = sessions;
        _github = github;
        _store = store;
        _notion = notion;
        _env = env;
        _logger = logger;
    }

    public bool LoggedIn { get; private set; }
    public string? ReactAppHtml { get; private set; }

    public async Task<IActionResult> OnGetAsync(string? code, string? state)
    {
        // GitHub OAuth callback — accepts code+state on the root path ("/").
        if (!string.IsNullOrEmpty(code) && !string.IsNullOrEmpty(state))
        {
            return await HandleGithubCallbackAsync(code, state);
        }

        await ResolveSessionAsync();
        LoggedIn = Session?.User != null;

        if (LoggedIn) return Page();

        // Serve the React build landing page if present, else the Razor landing.
        var appHtml = Path.Combine(_env.WebRootPath, "app", "index.html");
        if (System.IO.File.Exists(appHtml))
        {
            ReactAppHtml = await System.IO.File.ReadAllTextAsync(appHtml);
            return Content(ReactAppHtml, "text/html; charset=utf-8");
        }

        return Page();
    }

    private async Task<IActionResult> HandleGithubCallbackAsync(string code, string state)
    {
        var expected = Request.Cookies["oauth_state"];
        if (string.IsNullOrEmpty(code) || expected == null || state != expected)
        {
            return StatusCodePage(
                "Sign-in failed",
                "The request could not be verified (invalid state). This can happen if the link expired — please try again.",
                error: true, statusCode: 400);
        }

        try
        {
            var token = await _github.ExchangeCodeAsync(code);
            var user = await _github.GetUserAsync(token);
            var ownPublic = await _github.GetReposAsync(token, "public");
            var ownPrivate = await _github.GetReposAsync(token, "private");
            var orgs = await _github.GetOrgsAsync(token);

            var sid = SessionService.RandomHex(32);
            var nid = Request.Cookies["nid"];
            NotionData? savedNotion = null;
            if (!string.IsNullOrEmpty(nid))
                savedNotion = await _store.GetAsync<NotionData>("notion", nid);

            var session = new Session
            {
                Token = token,
                User = user,
                OwnPublic = ownPublic,
                OwnPrivate = ownPrivate,
                Orgs = orgs,
                Notion = savedNotion,
            };

            await _sessions.SaveAsync(sid, session);

            Response.Cookies.Append("sid", sid, new CookieOptions { HttpOnly = true, Path = "/", SameSite = SameSiteMode.Lax, MaxAge = TimeSpan.FromDays(30) });
            Response.Cookies.Delete("oauth_state");
            return Redirect("/");
        }
        catch (Exception ex)
        {
            _logger.LogError(ex, "GitHub OAuth callback failed");
            return StatusCodePage("Sign-in failed", "GitHub rejected the code or the API hiccuped. Please try again.", error: true, statusCode: 500);
        }
    }

    private IActionResult StatusCodePage(string heading, string body, bool error, int statusCode)
    {
        ModelState.Clear();
        ViewData["MessageHeading"] = heading;
        ViewData["MessageBody"] = body;
        ViewData["MessageError"] = error;
        Response.StatusCode = statusCode;
        return Page();
    }
}