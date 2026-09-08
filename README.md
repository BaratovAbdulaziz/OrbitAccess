# Orbit Access — team access control for GitHub & Notion

Give every new team member the right access on day one. Sign in with GitHub, audit
exactly who has access to every repository (personal, private, and across your
organizations), and invite collaborators with the right permission level in seconds.
Connect Notion to browse every page and database your workspace shares with the
integration in the same panel UI.

Built on **ASP.NET Core (C#)** — one codebase, no external dependencies beyond the
GitHub & Notion REST APIs. The React landing page shipped by this app is served as a
pre-built static bundle (no Node runtime required to run the app).

> Full documentation lives in [`docs/`](docs/index.md) — start there.

## Quick start

1. Create an OAuth App at https://github.com/settings/developers
   (any homepage/callback URL works — the app accepts the reply on every path).
2. The credentials live in `OrbitAccess/.env` (already populated):

   ```
   GITHUB_CLIENT_ID=your_client_id
   GITHUB_CLIENT_SECRET=your_client_secret

   # optional — enables the Notion connection
   NOTION_CLIENT_ID=your_notion_client_id
   NOTION_CLIENT_SECRET=your_notion_secret
   NOTION_TOKEN=your_configured_notion_token (optional)
   ```

3. `dotnet run --project OrbitAccess` → http://localhost:3000

Requires the **.NET 10 SDK** (`Microsoft.AspNetCore.Mvc.Razor.RuntimeCompilation` is
the only NuGet package).

For Notion: create a **public** integration at notion.so/my-integrations and
register the redirect URI `http://localhost:3000/notion/callback`
(override with `NOTION_REDIRECT_URI`).

## What you get

- **Landing page** (`/`, signed out) — React build if present (`wwwroot/app`), otherwise
  a server-rendered Razor landing.
- **Access control panel** (`/`, signed in) — stat tiles, then every repository
  grouped into Public / Private / Organizations. Expand any repository to see
  everyone who has access (avatar, handle, role chip) and invite new people by
  **username or email** with a permission picker (read / triage / write / maintain / admin).
- **Notion panel** (`/notion`) — OAuth workspace connect, then a twin control
  panel listing shared databases & pages with Re-sync / Disconnect.
- **Docs** (`/docs`), About / Privacy / Terms, dark & light themes.

## Routes

| Method | Path | Purpose |
| --- | --- | --- |
| GET | `/` | Landing page or access panel (GitHub callback accepted here too) |
| GET | `/login` | Start OAuth (state cookie, 10 min) |
| GET | `/login/notion` | Start Notion OAuth (public integration required) |
| GET | `/notion/callback` | Notion OAuth callback — links workspace to session |
| GET | `/logout/notion` | Unlink Notion workspace |
| GET | `/refresh` | Re-sync profile/repos/orgs with stored token |
| GET | `/logout` | Destroy session |
| GET | `/docs`, `/notion`, `/about`, `/privacy`, `/terms` | Pages |
| GET | `/share/{token}` | Resolve a Notion share link to its workspace item |
| GET | `/api/access/{owner}/{repo}` | JSON list of collaborators |
| POST | `/api/access/{owner}/{repo}` | Invite collaborator `{ user, permission }` |
| GET/POST/DELETE | `/api/notion/access` | Grant / revoke Notion page access by email |
| GET/POST/DELETE | `/api/notion/access/link` | Create / revoke share links |

Scopes requested: `read:user repo read:org`.

## Project structure

```
├── OrbitAccess/                 ASP.NET Core app
│   ├── Program.cs               entry point & pipeline (Kestrel, Razor Pages, controllers)
│   ├── appsettings.json         runtime config (DataDir, listen URL)
│   ├── .env                     OAuth client credentials (gitignored)
│   ├── Controllers/ApiController.cs   JSON API (GitHub + Notion access control)
│   ├── Pages/                   Razor Pages: Index, Login, Notion, Docs, legal, Share
│   ├── Pages/Shared/            _Layout + shared partials (dashboard, landing, message)
│   ├── Services/                GitHubService, NotionService, NotionAccessService,
│   │                            SessionService, JsonFileStore, RateLimiter
│   ├── Models/                  Session, GitHubUser/Repo/Org, NotionData, grants, links
│   ├── Middleware/              SecurityHeadersMiddleware (CSP, HSTS, click-jacking)
│   └── wwwroot/                 style.css, landing.js, orbit-object.js, React build
├── app/                         (optional) React landing page source — rebuild target
├── docs/                        open-format documentation (Markdown + frontmatter)
└── style.css                    design system (light + dark)
```

## Security notes

- Sessions are HttpOnly cookies backed by an in-memory cache + durable JSON store
  (`OrbitAccess/.data/`) with a 30-day TTL.
- CSRF-protected callback via verified random state parameter.
- All dynamic HTML output is escaped; API path segments are URL-encoded.
- Security headers (CSP, frame/sniffing protections) set by a middleware on every response.