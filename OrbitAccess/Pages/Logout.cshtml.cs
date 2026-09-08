using Microsoft.AspNetCore.Mvc;
using Microsoft.AspNetCore.Mvc.RazorPages;
using OrbitAccess.Services;

namespace OrbitAccess.Pages;

public class LogoutModel : PageModel
{
    private readonly SessionService _sessions;
    private readonly JsonFileStore _store;

    public LogoutModel(SessionService sessions, JsonFileStore store)
    {
        _sessions = sessions;
        _store = store;
    }

    public async Task<IActionResult> OnGetAsync()
    {
        var sid = Request.Cookies["sid"];
        await _sessions.DeleteAsync(sid ?? "");

        var nid = Request.Cookies["nid"];
        if (!string.IsNullOrEmpty(nid)) await _store.DelAsync("notion", nid);

        Response.Cookies.Delete("sid");
        Response.Cookies.Delete("nid");
        return Redirect("/");
    }
}