# Orbit Access — team access control for GitHub & Notion

Give every new team member the right access on day one. Sign in with GitHub, audit
exactly who has access to every repository (personal, private, and across your
organizations), and invite collaborators with the right permission level in seconds.
Connect Notion to browse every page and database your workspace shares with the
integration in the same panel UI.

Zero dependencies — pure Node.js standard library plus the GitHub & Notion REST APIs.

> Full documentation lives in [`docs/`](docs/index.md) — start there.

## Quick start

1. Create an OAuth App at https://github.com/settings/developers
   (any homepage/callback URL works — the app accepts the reply on every path).
2. Create a `.env` file next to `server.js`:

   ```
   GITHUB_CLIENT_ID=your_client_id
   GITHUB_CLIENT_SECRET=your_client_secret

   # optional — enables the Notion connection
   NOTION_CLIENT_ID=your_notion_client_id
   NOTION_CLIENT_SECRET=your_notion_secret
   ```

3. `npm start` → http://localhost:3000

Requires Node 18+ (uses global `fetch`).

For Notion: create a **public** integration at notion.so/my-integrations and
register the redirect URI `http://localhost:3000/notion/callback`
(override with `NOTION_REDIRECT_URI`).

## What you get

- **Landing page** (`/`, signed out) — product overview + OAuth explainer.
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
| GET | `/` | Landing page or access panel |
| GET | `/login` | Start OAuth (state cookie, 10 min) |
| ANY | `/*?code=&state=` | OAuth callback — accepted on any path |
| GET | `/login/notion` | Start Notion OAuth (public integration required) |
| GET | `/notion/callback` | Notion OAuth callback — links workspace to session |
| GET | `/logout/notion` | Unlink Notion workspace |
| GET | `/refresh` | Re-sync profile/repos/orgs with stored token |
| GET | `/logout` | Destroy session |
| GET | `/docs`, `/notion`, `/about`, `/privacy`, `/terms` | Pages |
| GET | `/api/access/:owner/:repo` | JSON list of collaborators |
| POST | `/api/access/:owner/:repo` | Invite collaborator `{ user, permission }` |

Scopes requested: `read:user repo read:org`.

## Project structure

```
├── server.js        entry point & router
├── style.css        design system (light + dark)
├── docs/            open-format documentation (Markdown + frontmatter)
├── lib/
│   ├── config.js     .env loader & settings
│   ├── github.js     GitHub REST API calls
│   ├── notion.js     Notion OAuth + content listing
│   ├── sessions.js   in-memory session store
│   └── util.js       escaping, cookies, body parsing
└── views/
    ├── icons.js      inline SVG marks
    ├── shell.js      page frame, nav switcher & theme toggle
    ├── landing.js    marketing page
    ├── panel.js      GitHub access control panel
    └── pages.js      docs, legal, message & Notion pages
```

## Security notes

- Access tokens and all GitHub data stay in server memory — never sent to the browser.
- CSRF-protected callback via verified random state parameter.
- All dynamic HTML output is escaped; API path segments are URL-encoded.
- Sessions are currently lost on restart; persistence is on the roadmap.
