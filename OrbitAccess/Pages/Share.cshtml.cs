using Microsoft.AspNetCore.Mvc;
using Microsoft.AspNetCore.Mvc.RazorPages;
using OrbitAccess.Services;

namespace OrbitAccess.Pages;

public class ShareModel : PageModel
{
    private readonly NotionAccessService _notionAccess;
    private readonly SessionService _sessions;

    public ShareModel(NotionAccessService notionAccess, SessionService sessions)
    {
        _notionAccess = notionAccess;
        _sessions = sessions;
    }

    public async Task<IActionResult> OnGetAsync(string token)
    {
        var link = await _notionAccess.GetLinkAsync(token);
        if (link == null)
        {
            ViewData["MessageHeading"] = "Link not found";
            ViewData["MessageBody"] = "This share link is invalid or has been revoked.";
            ViewData["MessageError"] = true;
            Response.StatusCode = 404;
            return Page();
        }

        var sid = Request.Cookies["sid"];
        var session = sid != null ? await _sessions.ResolveAsync(sid) : null;
        if (session?.User?.Email != null)
        {
            await _notionAccess.GrantAsync(link.PageId!, session.User.Email, "read", "share-link");
        }

        var notionItem = session?.Notion?.Items.FirstOrDefault(i => i.Id == link.PageId);
        var target = notionItem?.Url != null ? notionItem.Url : "/notion";
        return Redirect(target);
    }
}