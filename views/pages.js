const { esc } = require("../lib/util");
const { GITHUB_MARK } = require("./icons");
const notionAccess = require("../lib/notionAccess");

function messagePage(heading, body, { error = false, showLoginButton = false } = {}) {
  const button = error
    ? `<a class="btn btn-secondary" href="/">Back home</a>`
    : showLoginButton
      ? `<a class="btn btn-primary" href="/login">${GITHUB_MARK}<span>Sign in with GitHub</span></a>`
      : "";
  return `
<section class="message-page">
  <div class="message-card">
    <h1 class="display-sm ${error ? "error-text" : ""}">${heading}</h1>
    <p class="body-md">${body}</p>
    ${button}
  </div>
</section>`;
}

const STATIC_PAGES = {
  "/about": ["About", [
    ["What this is", "A team access control panel for GitHub. Connect with your GitHub account to audit exactly who has access to every repository you can reach — personal, private, and across all your organizations — and invite new members with the right permission level in seconds."],
    ["How sign-in works", "Clicking “Sign in with GitHub” sends you to github.com to authorize this app. GitHub redirects back with a one-time code that is exchanged server-side for an access token. Your identity, repositories, and organizations are then read from the GitHub API."],
    ["Design", "Interface follows the Claude-inspired design system shipped in DESIGN.md — warm canvas, serif display type, coral accents, and hairline borders. Light and dark themes are both first-class."],
  ]],
  "/privacy": ["Privacy Policy", [
    ["What we access", "With your authorization we request the OAuth scopes read:user, repo, and read:org. We fetch your basic profile, your recently pushed public and private repositories, your organizations and their recent repos. When you expand a repository we fetch its collaborator list; when you use the invite form we send a collaboration invite on your behalf."],
    ["Where data lives", "GitHub data is held in server memory for the lifetime of the process. Your Notion connection token is cached on the server's local disk (.data/, git-ignored) so you stay connected across restarts. Nothing is logged and there are no analytics trackers."],
    ["Your control", "Log out at any time to destroy your session immediately. You can also revoke this application entirely from your GitHub account under Settings → Applications → Authorized OAuth Apps."],
  ]],
  "/terms": ["Terms of Use", [
    ["Scope", "This project is a starting point for building GitHub-connected team tooling. It is provided as-is, without warranty of any kind."],
    ["Acceptable use", "Use it lawfully and in accordance with GitHub's Terms of Service. You are responsible for how you deploy and extend it."],
    ["No liability", "The authors are not liable for any damages arising from use of this software. Review the code before running it anywhere that matters."],
  ]],
};

function staticPage(title, sections) {
  return `
<section class="page-band">
  <div class="container">
    <article class="page-prose">
      <span class="badge-pill">app</span>
      <h1 class="display-lg">${title}</h1>
      ${sections.map(([h, p]) => `<h2 class="title-md">${h}</h2><p class="body-md">${p}</p>`).join("")}
    </article>
  </div>
</section>`;
}

const ROUTES = [
  ["GET", "/", "Landing page when signed out; your access control panel once a session cookie is present."],
  ["GET", "/docs", "This page."],
  ["GET", "/notion", "Notion integration page — status, setup guide, and (soon) workspace connection."],
  ["GET", "/login", "Start GitHub OAuth (state cookie, 10 min)."],
  ["ANY", "/*?code=&state=", "GitHub OAuth reply — accepted on any path so whatever callback URL is registered works."],
  ["GET", "/login/notion", "Start Notion OAuth. Requires NOTION_CLIENT_ID / NOTION_CLIENT_SECRET in .env and a registered redirect URI."],
  ["GET", "/notion/callback", "Notion OAuth reply. Verifies state, exchanges the code for an integration token, links the workspace to your session."],
  ["GET", "/logout/notion", "Unlinks the Notion workspace from your session (GitHub session untouched)."],
  ["GET", "/refresh", "Re-fetches profile, repositories and organizations using the stored access token — no re-login required."],
  ["GET", "/logout", "Destroys the server-side session and clears the sid cookie."],
  ["GET", "/about · /privacy · /terms", "Legal & about pages."],
];

const JSON_API = [
  ["GET", "/api/access/:owner/:repo", "Live JSON list of everyone with access to a repository — login, avatar URL, profile URL and role_name per person. Requires a session; returns { error: \"unauthorized\" } with 401 otherwise. Repositories you don't administer return GitHub's status code in { error: 403 | 404 }."],
  ["POST", "/api/access/:owner/:repo", "Invite a collaborator. JSON body: { user, permission } where user is a GitHub username or email address and permission is one of read | triage | write | maintain | admin. Emails are resolved through GitHub user search first. Responds { ok: true } on success or { ok: false, message }."],
];

const SCOPES = [
  ["read:user", "Basic profile: name, avatar, follower counts, account age."],
  ["repo", "Full read of public AND private repositories you can access (yours and your orgs'), plus collaborator lists and the ability to send invitations on repos you administer."],
  ["read:org", "Organization memberships, so org sections can be listed with their recent repos."],
];

const ENV_KEYS = [
  ["GITHUB_CLIENT_ID", "Required", "From your OAuth App at github.com/settings/developers."],
  ["GITHUB_CLIENT_SECRET", "Required", "The matching client secret. Server-side only — never shipped to the browser."],
  ["NOTION_CLIENT_ID", "For Notion", "From a public integration at notion.so/my-integrations (OAuth & Services tab)."],
  ["NOTION_CLIENT_SECRET", "For Notion", "The matching integration secret."],
  ["NOTION_REDIRECT_URI", "Optional", "Defaults to http://localhost:3000/notion/callback. Must match a URI registered on the integration."],
  ["PORT", "Optional", "Defaults to 3000."],
];

function docRows(rows) {
  return `<div class="doc-list">
    ${rows.map(([method, path, desc]) => `
    <div class="doc-row">
      <span class="chip-method">${esc(method)}</span>
      <code class="doc-path">${esc(path)}</code>
      <p class="body-md doc-desc">${desc}</p>
    </div>`).join("")}
  </div>`;
}

function scopeRows() {
  return `<div class="doc-list">
    ${SCOPES.map(([scope, desc]) => `
    <div class="doc-row">
      <code class="doc-path scope">${esc(scope)}</code>
      <p class="body-md doc-desc">${desc}</p>
    </div>`).join("")}
  </div>`;
}

function envRows() {
  return `<div class="doc-list">
    ${ENV_KEYS.map(([key, req, desc]) => `
    <div class="doc-row">
      <code class="doc-path">${esc(key)}</code>
      <span class="chip-method">${esc(req)}</span>
      <p class="body-md doc-desc">${desc}</p>
    </div>`).join("")}
  </div>`;
}

function docsPage() {
  return `
<section class="page-band">
  <div class="container">
    <article class="page-prose">
      <span class="badge-pill">Documentation</span>
      <h1 class="display-lg">Docs</h1>
      <p class="body-md">Everything this app does, how to run it, and how it works inside. Zero dependencies — pure Node.js standard library plus the GitHub REST API.</p>

      <h2 class="title-md">Quick start</h2>
      <ol class="steps-ol body-md">
        <li>Create an OAuth App at <a class="text-link" href="https://github.com/settings/developers" target="_blank" rel="noopener">github.com/settings/developers</a>. Any homepage/callback URL works — the app accepts GitHub's reply on every path.</li>
        <li>Put your credentials in a <code>.env</code> file next to <code>server.js</code> (see Configuration below).</li>
        <li>Run <code>npm start</code> and open <code>http://localhost:3000</code>.</li>
      </ol>

      <h2 class="title-md">Configuration</h2>
      ${envRows()}
      <pre class="doc-pre"># .env
GITHUB_CLIENT_ID=your_client_id
GITHUB_CLIENT_SECRET=your_client_secret

# optional — enables Notion connection
NOTION_CLIENT_ID=your_notion_client_id
NOTION_CLIENT_SECRET=your_notion_secret</pre>

      <h2 class="title-md">How sign-in works</h2>
      <ol class="steps-ol body-md">
        <li><strong>Authorize</strong> — /login redirects you to github.com with a random state value stored in a short-lived HttpOnly cookie.</li>
        <li><strong>Exchange</strong> — GitHub returns a one-time code on any path; the server verifies state, then swaps code + client secret for an access token.</li>
        <li><strong>Session</strong> — a random session id cookie is issued; token, profile and repo data live server-side only. The browser never sees the token.</li>
      </ol>

      <h2 class="title-md">Routes</h2>
      ${docRows(ROUTES)}

      <h2 class="title-md">JSON API</h2>
      ${docRows(JSON_API)}
      <pre class="doc-pre"># list everyone with access
curl http://localhost:3000/api/access/octocat/hello-world

# invite someone with write access
curl -X POST http://localhost:3000/api/access/octocat/hello-world \\
  -H "Content-Type: application/json" \\
  -d '{"user":"teammate@company.com","permission":"write"}'</pre>

      <h2 class="title-md">OAuth scopes</h2>
      ${scopeRows()}

      <h2 class="title-md">Project structure</h2>
      <pre class="doc-pre">├── server.js        entry point & router
├── style.css        design system (light + dark)
├── lib/
│   ├── config.js     .env loader & settings
│   ├── github.js     GitHub REST API calls
│   ├── sessions.js   in-memory session store
│   └── util.js       escaping, cookies, body parsing
└── views/
    ├── icons.js      inline SVG marks
    ├── shell.js      page frame, nav & theme toggle
    ├── landing.js    marketing page
    ├── panel.js      access control panel
    └── pages.js      docs, legal & Notion pages</pre>

      <h2 class="title-md">Security notes</h2>
      <ul class="steps-ol body-md">
        <li>Access tokens and all GitHub data stay in server memory — never in the browser, never on disk. The Notion connection token is the one exception: it is cached on local disk so reconnects aren't needed after a restart.</li>
        <li>The OAuth state parameter is verified on every callback (CSRF protection).</li>
        <li>All dynamic output is HTML-escaped; the JSON API path segments are URL-encoded before hitting GitHub.</li>
        <li>Sessions are lost on restart by design until persistent storage ships.</li>
      </ul>

      <h2 class="title-md">Roadmap</h2>
      <ol class="steps-ol body-md">
        <li>Persistent sessions (file-backed store) so restarts don't log everyone out.</li>
        <li>Notion page picker — choose exactly which pages/databases new members can open.</li>
        <li>Bulk onboarding: paste a list of teammates, get role rules applied across many repos.</li>
        <li>Audit log of who invited whom, where, and when.</li>
      </ol>

      <p class="body-md caption-note">Questions? Everything is ~800 lines of readable code — start at server.js.</p>
    </article>
  </div>
</section>`;
}

function ntDate(iso) {
  try {
    return new Date(iso).toLocaleDateString("en-US", { month: "short", day: "numeric" });
  } catch {
    return "";
  }
}

const DB_IC = `<svg viewBox="0 0 16 16" width="14" height="14" fill="currentColor" aria-hidden="true"><path d="M8 1.5c-3.6 0-6.5 1-6.5 2.25v8.5C1.5 13.5 4.4 14.5 8 14.5s6.5-1 6.5-2.25v-8.5C14.5 2.5 11.6 1.5 8 1.5Zm5 10.75c0 .35-1.7 1.25-5 1.25s-5-.9-5-1.25V9.86c1.2.62 3.03 1.02 5 1.02s3.8-.4 5-1.02v2.39Zm0-4c0 .35-1.7 1.25-5 1.25S3 8.6 3 8.25V5.86c1.2.62 3.03 1.02 5 1.02s3.8-.4 5-1.02v2.39Z"/></svg>`;
const PAGE_IC = `<svg viewBox="0 0 16 16" width="14" height="14" fill="currentColor" aria-hidden="true"><path d="M4 1.5A1.5 1.5 0 0 0 2.5 3v10A1.5 1.5 0 0 0 4 14.5h8a1.5 1.5 0 0 0 1.5-1.5V5.62L9.88 1.5H4Zm5.5 1.81L12.19 6H9.5V3.31Z"/></svg>`;

function ntTile(item) {
  const isDb = item.object === "database";
  const glyph = item.icon || (isDb ? "&#128451;" : "&#128196;");
  const grants = notionAccess.getGrants(item.id);
  const grantCount = Object.keys(grants).length;
  const link = notionAccess.getLinkForPage(item.id);
  return `
  <div class="acc-tile">
    <div class="acc-head nt-static">
      <span class="nt-emoji">${glyph}</span>
      <span class="acc-id">
        <span class="acc-name">${esc(item.title)}</span>
        <span class="acc-sub"><span>${esc(item.parent)}</span><span class="acc-date">Edited ${ntDate(item.edited)}</span></span>
      </span>
      <span class="badge-pill">${isDb ? `${DB_IC} database` : `${PAGE_IC} page`}</span>
    </div>
    <div class="acc-foot">
      ${grantCount > 0 ? `<span class="nt-grant-count" title="${grantCount} user(s) with access">${grantCount} shared</span>` : ""}
      ${link ? `<span class="nt-link-badge" title="Share link active">&#128279; link</span>` : ""}
      <button class="btn btn-secondary btn-sm nt-share-btn" data-page-id="${esc(item.id)}" data-page-title="${esc(item.title)}">Share</button>
      <a class="text-link caption-link" href="${esc(item.url)}" target="_blank" rel="noopener">Open in Notion &#8599;</a>
    </div>
  </div>`;
}

function shareModal() {
  return `
<div id="nt-share-modal" class="nt-modal" style="display:none">
  <div class="nt-modal-backdrop"></div>
  <div class="nt-modal-content">
    <div class="nt-modal-header">
      <h3 class="title-md" id="nt-share-title">Share page</h3>
      <button class="nt-modal-close" id="nt-modal-close" type="button">&times;</button>
    </div>
    <div class="nt-modal-body">
      <div class="nt-link-section">
        <h4 class="caption">Share by link</h4>
        <div class="nt-link-row" id="nt-link-row">
          <button class="btn btn-secondary btn-sm" id="nt-link-create" type="button">Create link</button>
        </div>
        <p class="nt-share-msg caption-note" id="nt-link-msg"></p>
      </div>
      <div class="nt-share-form">
        <h4 class="caption">Invite by email</h4>
        <div class="nt-input-row">
          <input type="email" id="nt-share-email" class="acc-input" placeholder="teammate@gmail.com" autocomplete="email">
          <select id="nt-share-level" class="perm-select">
            <option value="read">Read</option>
            <option value="write">Write</option>
            <option value="admin">Admin</option>
          </select>
          <button class="btn btn-primary btn-sm" id="nt-share-submit" type="button">Grant</button>
        </div>
        <p class="nt-share-msg caption-note" id="nt-share-msg"></p>
      </div>
      <div class="nt-access-list" id="nt-access-list">
        <h4 class="caption">People with access</h4>
        <div class="nt-access-items" id="nt-access-items"></div>
      </div>
    </div>
  </div>
</div>`;
}

function notionPage(session) {
  const notion = session?.notion;
  if (!notion?.token) {
    return `
<section class="page-band">
  <div class="container">
    <article class="page-prose">
      <span class="badge-pill" style="background: rgba(232,165,90,.18); color: var(--ink);">&#9679; Notion not connected</span>
      <h1 class="display-lg">Notion access</h1>
      <p class="body-md">Connect your workspace to see every page and database the integration can reach — then grant teammates access alongside their repository roles.</p>
      <a class="btn btn-primary" href="/login/notion"><span>Connect Notion workspace</span></a>

      <h2 class="title-md">What connecting does</h2>
      <ol class="steps-ol body-md">
        <li>You approve access on notion.so — we never see your Notion password.</li>
        <li>The server exchanges a one-time code for an integration token, kept server-side and cached locally so your connection survives restarts.</li>
        <li>The panel lists exactly which pages and databases are reachable; nothing else is touched.</li>
      </ol>
      <p class="caption-note">Notion API credentials stay server-side, exactly like the GitHub token.</p>
    </article>
  </div>
</section>`;
  }

  const items = Array.isArray(notion.items) ? notion.items : [];
  const dbs = items.filter((i) => i.object === "database");
  const pgs = items.filter((i) => i.object === "page");
  const owner = notion.owner?.user;
  const ownerName = owner?.name || owner?.person?.name || "";
  const wsIcon = typeof notion.workspace_icon === "string"
    ? (notion.workspace_icon.startsWith("data:")
      ? `<img class="avatar-lg" src="${esc(notion.workspace_icon)}" alt="">`
      : `<span class="avatar-lg nt-ws">${esc(notion.workspace_icon)}</span>`)
    : `<span class="avatar-lg nt-ws">N</span>`;
  const emptyBanner = `
<div class="note-banner" style="margin-bottom: var(--s-xl);">
  <strong>No shared content yet.</strong> In Notion, open a page or database, click <code>&bull;&bull;&bull;</code> &rarr;
  <strong>Connections</strong>, and select this integration. It appears here after you
  <a class="text-link" href="/refresh/notion">re-sync</a>.
</div>`;

  return `
<section class="dash-band">
  <div class="container">
    <div class="dash-head">
      ${wsIcon}
      <div class="dash-copy">
        <span class="badge-pill" style="background: rgba(93,184,166,.16); color: var(--ink);">&#9679; Notion connected</span>
        <h1 class="display-lg">${esc(notion.workspace_name || "Workspace")}</h1>
        <p class="body-md">Everything the integration can currently reach.${ownerName ? ` Connected by ${esc(ownerName)}.` : ""} &middot; <a class="text-link" style="font-size:16px" href="/refresh/notion">Re-sync</a></p>
      </div>
    </div>
    <div class="stat-tiles four">
      <a class="connector-tile stat-link" href="#databases"><span class="stat-num">${dbs.length}</span><span class="caption">Databases</span></a>
      <a class="connector-tile stat-link" href="#pages"><span class="stat-num">${pgs.length}</span><span class="caption">Pages</span></a>
      <a class="connector-tile stat-link" href="#pages"><span class="stat-num">${items.length}</span><span class="caption">Shared objects</span></a>
      <a class="connector-tile stat-link" href="https://www.notion.so" target="_blank" rel="noopener"><span class="stat-num">&#8599;</span><span class="caption">Open workspace</span></a>
    </div>
    <div class="dash-actions">
      <a class="btn btn-secondary btn-sm" href="/refresh/notion">Re-sync now</a>
      <a class="btn btn-secondary btn-sm" href="/logout/notion">Disconnect workspace</a>
    </div>
  </div>
</section>
${items.length === 0 ? `
<section class="repos-band"><div class="container">${emptyBanner}</div></section>` : `
<section class="repos-band">
  <div class="container" id="databases">
    <div class="section-head-row"><div class="section-head"><h2 class="display-sm">Databases</h2><p class="body-md">Structured data the workspace shares with Orbit Access.</p></div></div>
    ${dbs.length ? `<div class="repo-grid">${dbs.map(ntTile).join("")}</div>`
      : `<p class="empty-note body-md">No databases shared with the integration yet.</p>`}
  </div>
</section>
<section class="repos-band">
  <div class="container" id="pages">
    <div class="section-head-row"><div class="section-head"><h2 class="display-sm">Pages</h2><p class="body-md">Docs and wikis reachable through the connection.</p></div></div>
    ${pgs.length ? `<div class="repo-grid">${pgs.map(ntTile).join("")}</div>`
      : `<p class="empty-note body-md">No pages shared with the integration yet.</p>`}
  </div>
</section>`}
${shareModal()}
`;
}

module.exports = { messagePage, STATIC_PAGES, staticPage, docsPage, notionPage };
