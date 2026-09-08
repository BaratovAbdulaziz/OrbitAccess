using Microsoft.AspNetCore.Mvc;
using Microsoft.AspNetCore.Mvc.RazorPages;
using OrbitAccess.Models;
using OrbitAccess.Services;

namespace OrbitAccess.Pages;

public class RefreshNotionModel : PageModel
{
    private readonly JsonFileStore _store;
    private readonly NotionService _notion;
    private readonly SessionService _sessions;
    private readonly ILogger<RefreshNotionModel> _logger;

    public RefreshNotionModel(JsonFileStore store, NotionService notion, SessionService sessions, ILogger<RefreshNotionModel> logger)
    {
        _store = store;
        _notion = notion;
        _sessions = sessions;
        _logger = logger;
    }

    public async Task<IActionResult> OnGetAsync()
    {
        var nid = Request.Cookies["nid"];
        var sid = Request.Cookies["sid"];

        NotionData? notion = null;
        if (!string.IsNullOrEmpty(nid))
            notion = await _store.GetAsync<NotionData>("notion", nid);
        if (notion == null)
        {
            var session = sid != null ? await _sessions.ResolveAsync(sid) : null;
            notion = session?.Notion;
        }

        if (notion?.Token != null)
        {
            try
            {
                notion.Items = await _notion.SearchAsync(notion.Token);
                if (!string.IsNullOrEmpty(nid)) await _store.SetAsync("notion", nid, notion);
                if (sid != null)
                {
                    var session = await _sessions.ResolveAsync(sid);
                    if (session != null)
                    {
                        session.Notion = notion;
                        await _sessions.SaveAsync(sid, session);
                    }
                }
            }
            catch (Exception ex)
            {
                _logger.LogWarning(ex, "Notion refresh failed");
            }
        }
        return Redirect("/notion");
    }
}