using System.Text;
using OrbitAccess.Models;

namespace OrbitAccess;

/// <summary>
/// Server-side HTML-string builders that mirror the original view functions
/// (views/panel.js accTile/sectionHead, views/landing.js homeLoggedOut, pages.js ntTile).
/// </summary>
public static class Rendering
{
    public static string SectionHead(string title, string sub, string metaHref, string metaLabel)
    {
        var meta = string.IsNullOrEmpty(metaHref)
            ? ""
            : $"<a class=\"text-link caption-link\" href=\"{System.Net.WebUtility.HtmlEncode(metaHref)}\" target=\"_blank\" rel=\"noopener\">{System.Net.WebUtility.HtmlEncode(metaLabel)}</a>";
        return $"<div class=\"section-head-row\"><div class=\"section-head\"><h2 class=\"display-sm\">{title}</h2><p class=\"body-md\">{sub}</p></div>{meta}</div>";
    }

    public static string AccTile(GitHubRepo repo)
    {
        var color = ViewHelpers.LangColor(repo.Language);
        var lang = repo.Language != null
            ? $"<span class=\"lang-dot\"{(color.Length > 0 ? $" style=\"background:{System.Net.WebUtility.HtmlEncode(color)}\"" : "")}></span>{System.Net.WebUtility.HtmlEncode(repo.Language)}"
            : "";
        var pushed = ViewHelpers.ShortDate(repo.PushedAt);
        return $@"
  <div class=""acc-tile"">
    <button class=""acc-head"" type=""button"" data-owner=""{System.Net.WebUtility.HtmlEncode(repo.OwnerLogin)}"" data-repo=""{System.Net.WebUtility.HtmlEncode(repo.Name)}"" aria-expanded=""false"">
      <svg class=""chev"" viewBox=""0 0 16 16"" width=""14"" height=""14"" fill=""currentColor"" aria-hidden=""true""><path d=""M6.22 3.22a.75.75 0 0 1 1.06 0l4.25 4.25a.75.75 0 0 1 0 1.06l-4.25 4.25a.75.75 0 0 1-1.06-1.06L9.94 8 6.22 4.28a.75.75 0 0 1 0-1.06Z""/></svg>
      <span class=""acc-id"">
        <span class=""acc-name"">{System.Net.WebUtility.HtmlEncode(repo.Name)}{(repo.Private ? ViewHelpers.LockIcon : "")}</span>
        <span class=""acc-sub"">{lang}<span>{ViewHelpers.StarIcon}{repo.StargazersCount}</span><span class=""acc-date"">Pushed {pushed}</span></span>
      </span>
    </button>
    <div class=""acc-body"" hidden>
      <div class=""acc-skel""><span class=""sk-avatar""></span><span class=""sk-bar""></span></div>
      <div class=""acc-skel""><span class=""sk-avatar""></span><span class=""sk-bar""></span></div>
    </div>
    <div class=""acc-foot"">
      <label class=""caption"" for=""perm-{repo.Id}"">New members get</label>
      <select class=""perm-select"" id=""perm-{repo.Id}"">
        <option selected>Read</option><option>Triage</option><option>Write</option><option>Maintain</option><option>Admin</option>
      </select>
    </div>
  </div>";
    }

    public static string Feature(OrbitAccess.IconAndText f)
    {
        return $@"<div class=""feature-card{(f.Dark ? " feature-card--dark" : "")}"">
    <div class=""feature-icon"">{f.Icon}</div>
    <h3 class=""title-md"">{f.Title}</h3>
    <p class=""body-md"">{f.Body}</p>
  </div>";
    }

    public static string OrbitObject()
    {
        var sb = new StringBuilder();
        sb.AppendLine("""
<div class="hero-stage oo-root" data-orbit-object>
  <div class="oo-stage">
    <svg class="oo-arcs" aria-hidden="true">
      <path class="oo-arc" stroke="var(--primary)" stroke-width="1.5" fill="none" stroke-dasharray="8 12" stroke-dashoffset="0"/>
      <path class="oo-arc" stroke="var(--teal)" stroke-width="1.5" fill="none" stroke-dasharray="8 12" stroke-dashoffset="0"/>
    </svg>
    <div class="oo-node oo-node--gh" aria-hidden="true" style="--node-color: var(--primary);">GITHUB_MARK</div>
    <div class="oo-node oo-node--nt" aria-hidden="true" style="--node-color: var(--teal);">NOTION_ICON</div>
    <button type="button" class="oo-hub" aria-expanded="false" aria-controls="oo-panel" aria-label="Toggle Orbit preview">
      <span class="oo-hub-glow" aria-hidden="true"></span>
      <span class="oo-hub-core" aria-hidden="true">SPIKE</span>
      <span class="oo-hub-ring" aria-hidden="true"></span>
      <span class="oo-hub-ring oo-hub-ring--2" aria-hidden="true"></span>
    </button>
    <div class="oo-panel" id="oo-panel" hidden>
      <div class="oo-panel-inner">
        <header class="oo-panel-head">
          <h2 class="oo-panel-title">Your sources, one orbit</h2>
          <button type="button" class="oo-close" aria-label="Collapse Orbit">&times;</button>
        </header>
        <div class="oo-panel-body">
          <div class="oo-col oo-col--gh">
            <div class="oo-col-icon" style="color: var(--primary);" aria-hidden="true">GITHUB_MARK</div>
            <h3 class="oo-col-title">GitHub</h3>
            <ul class="oo-col-list">
              <li><span class="oo-count" data-count="24">0</span> repositories</li>
              <li><span class="oo-count" data-count="6">0</span> organizations</li>
              <li><span class="oo-count" data-count="128">0</span> stars</li>
            </ul>
          </div>
          <div class="oo-merge" aria-hidden="true"><span class="oo-merge-arrow">&rarr;</span></div>
          <div class="oo-col oo-col--nt">
            <div class="oo-col-icon" style="color: var(--teal);" aria-hidden="true">NOTION_ICON</div>
            <h3 class="oo-col-title">Notion</h3>
            <ul class="oo-col-list">
              <li><span class="oo-count" data-count="42">0</span> pages</li>
              <li><span class="oo-count" data-count="8">0</span> databases</li>
              <li><span class="oo-count" data-count="15">0</span> workspaces</li>
            </ul>
          </div>
        </div>
        <footer class="oo-panel-foot">
          <div class="oo-result" aria-hidden="true">
            <span class="oo-result-icon">SPIKE</span>
            <span class="oo-result-text">One dashboard</span>
          </div>
          <p class="oo-note">Sign in with GitHub &middot; connect Notion once</p>
        </footer>
      </div>
    </div>
  </div>
</div>
<script src="/orbit-object.js" defer></script>
""");
        return sb.ToString()
            .Replace("GITHUB_MARK", Icons.GitHubMark)
            .Replace("NOTION_ICON", ViewHelpers.NotionIcon)
            .Replace("SPIKE", Icons.Spike);
    }
}