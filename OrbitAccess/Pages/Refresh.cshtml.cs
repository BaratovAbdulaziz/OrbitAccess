using Microsoft.AspNetCore.Mvc;
using Microsoft.AspNetCore.Mvc.RazorPages;
using OrbitAccess.Services;

namespace OrbitAccess.Pages;

public class RefreshModel : PageModel
{
    private readonly SessionService _sessions;
    private readonly GitHubService _github;
    private readonly ILogger<RefreshModel> _logger;

    public RefreshModel(SessionService sessions, GitHubService github, ILogger<RefreshModel> logger)
    {
        _sessions = sessions;
        _github = github;
        _logger = logger;
    }

    public async Task<IActionResult> OnGetAsync()
    {
        var sid = Request.Cookies["sid"];
        var session = sid != null ? await _sessions.ResolveAsync(sid) : null;
        if (session != null && session.Token != null)
        {
            try
            {
                session.User = await _github.GetUserAsync(session.Token);
                session.OwnPublic = await _github.GetReposAsync(session.Token, "public");
                session.OwnPrivate = await _github.GetReposAsync(session.Token, "private");
                session.Orgs = await _github.GetOrgsAsync(session.Token);
                await _sessions.SaveAsync(sid!, session);
            }
            catch (Exception ex)
            {
                _logger.LogWarning(ex, "Refresh failed");
            }
        }
        return Redirect("/");
    }
}