using Microsoft.AspNetCore.Mvc;
using Microsoft.AspNetCore.Mvc.RazorPages;
using OrbitAccess.Models;
using OrbitAccess.Services;

namespace OrbitAccess.Pages;

public class NotionModel : OrbitBasePageModel
{
    private readonly NotionService _notion;
    private readonly JsonFileStore _store;
    private readonly NotionAccessService _notionAccess;
    private readonly ILogger<NotionModel> _logger;

    public NotionModel(SessionService sessions, NotionService notion, JsonFileStore store, NotionAccessService notionAccess, ILogger<NotionModel> logger)
        : base(sessions)
    {
        _notion = notion;
        _store = store;
        _notionAccess = notionAccess;
        _logger = logger;
    }

    public List<NotionItem> Items { get; private set; } = new();
    public List<NotionItem> Databases { get; private set; } = new();
    public List<NotionItem> Pages { get; private set; } = new();
    public bool Connected { get; private set; }
    public Dictionary<string, int> GrantCounts { get; private set; } = new();
    public HashSet<string> LinkedPageIds { get; private set; } = new();

    public async Task<IActionResult> OnGetAsync()
    {
        await ResolveSessionAsync();
        var notion = Session?.Notion;
        Connected = notion?.Token != null;

        if (Connected)
        {
            var nid = Request.Cookies["nid"];
            if (!string.IsNullOrEmpty(nid) && notion is { Items.Count: 0 })
            {
                try
                {
                    var items = await _notion.SearchAsync(notion!.Token!);
                    notion.Items = items;
                    await _store.SetAsync("notion", nid, notion);
                }
                catch (Exception ex)
                {
                    _logger.LogWarning(ex, "Notion search failed on page load");
                    notion.Items = new List<NotionItem>();
                }
            }

            Items = notion?.Items ?? new List<NotionItem>();
            Databases = Items.Where(i => i.Object == "database").ToList();
            Pages = Items.Where(i => i.Object == "page").ToList();

            var allGrants = await _notionAccess.GetAllGrantsAsync();
            foreach (var item in Items)
            {
                GrantCounts[item.Id!] = allGrants.TryGetValue(item.Id!, out var g) ? g.Count : 0;
            }
            var allLinks = await _notionAccess.GetAllLinksAsync();
            foreach (var link in allLinks.Values) LinkedPageIds.Add(link.PageId!);
        }

        return Page();
    }
}