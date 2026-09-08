using Microsoft.AspNetCore.Mvc;
using Microsoft.AspNetCore.Mvc.RazorPages;
using OrbitAccess.Services;

namespace OrbitAccess.Pages;

public class LogoutNotionModel : PageModel
{
    private readonly JsonFileStore _store;
    private readonly SessionService _sessions;

    public LogoutNotionModel(JsonFileStore store, SessionService sessions)
    {
        _store = store;
        _sessions = sessions;
    }

    public async Task<IActionResult> OnGetAsync()
    {
        var sid = Request.Cookies["sid"];
        var session = sid != null ? await _sessions.ResolveAsync(sid) : null;
        if (session != null) session.Notion = null;

        var nid = Request.Cookies["nid"];
        if (!string.IsNullOrEmpty(nid)) await _store.DelAsync("notion", nid);

        Response.Cookies.Delete("nid");
        return Redirect("/notion");
    }
}