using Microsoft.AspNetCore.Mvc;
using Microsoft.AspNetCore.Mvc.RazorPages;
using OrbitAccess.Services;

namespace OrbitAccess.Pages;

public class LoginModel : PageModel
{
    private readonly GitHubService _github;
    private readonly ILogger<LoginModel> _logger;

    public LoginModel(GitHubService github, ILogger<LoginModel> logger)
    {
        _github = github;
        _logger = logger;
    }

    public IActionResult OnGet()
    {
        if (string.IsNullOrEmpty(_github.ClientId) || string.IsNullOrEmpty(_github.ClientSecret))
        {
            ViewData["MessageHeading"] = "Configuration missing";
            ViewData["MessageBody"] = "GITHUB_CLIENT_ID / GITHUB_CLIENT_SECRET are not set. Add them to your environment and restart.";
            ViewData["MessageError"] = true;
            Response.StatusCode = 500;
            return Page();
        }

        var state = SessionService.RandomHex(16);
        var url = _github.AuthorizeUrl(state);
        Response.Cookies.Append("oauth_state", state, new CookieOptions
        {
            HttpOnly = true,
            Path = "/",
            SameSite = SameSiteMode.Lax,
            MaxAge = TimeSpan.FromMinutes(10),
        });
        return Redirect(url);
    }
}