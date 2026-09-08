using Microsoft.AspNetCore.Mvc;
using Microsoft.AspNetCore.Mvc.RazorPages;
using OrbitAccess.Services;

namespace OrbitAccess.Pages;

public class NotionLoginModel : PageModel
{
    private readonly NotionService _notion;
    private readonly IConfiguration _config;

    public NotionLoginModel(NotionService notion, IConfiguration config)
    {
        _notion = notion;
        _config = config;
    }

    public IActionResult OnGet()
    {
        if (string.IsNullOrEmpty(_notion.ClientId) || string.IsNullOrEmpty(_notion.ClientSecret))
        {
            ViewData["MessageHeading"] = "Notion integration not configured";
            ViewData["MessageBody"] = "Create a public integration at notion.so/my-integrations, register the redirect URI <code>http://localhost:3000/notion/callback</code>, then add NOTION_CLIENT_ID and NOTION_CLIENT_SECRET to your environment and restart.";
            ViewData["MessageError"] = false;
            return Page();
        }

        var state = SessionService.RandomHex(16);
        var redirect = _config["NOTION_REDIRECT_URI"] ?? "http://localhost:3000/notion/callback";
        var url = _notion.AuthorizeUrl(redirect, state);
        Response.Cookies.Append("notion_state", state, new CookieOptions
        {
            HttpOnly = true,
            Path = "/",
            SameSite = SameSiteMode.Lax,
            MaxAge = TimeSpan.FromMinutes(10),
        });
        return Redirect(url);
    }
}