---
title: Routes
description: Every HTTP route Orbit Access serves, including the JSON API.
section: Reference
order: 5
---

# Routes

## Pages & flows

| Method | Path | What it does |
|---|---|---|
| GET | `/` | Landing page signed out; GitHub access control panel once a session exists. |
| GET | `/docs` | In-app documentation (same content family as these files). |
| GET | `/login` | Starts GitHub OAuth — sets `oauth_state` cookie, redirects to github.com. |
| ANY | `/*?code=&state=` | GitHub's reply, accepted on any path so any registered callback URL works. Verifies state, builds the session, redirects to `/`. |
| GET | `/login/notion` | Starts Notion OAuth — requires `NOTION_CLIENT_ID/SECRET`; renders setup help if missing. |
| GET | `/notion/callback` | Notion's reply. Verifies state, exchanges code for token, snapshots shared content, redirects to `/notion`. |
| GET | `/notion` | Notion panel — connect prompt or workspace dashboard. |
| GET | `/refresh` | Re-fetches GitHub profile/repos/orgs into the current session. |
| GET | `/refresh/notion` | Re-runs the Notion content snapshot. |
| GET | `/logout/notion` | Unlinks the Notion workspace only. |
| GET | `/logout` | Destroys the whole session and clears `sid`. |
| GET | `/about` · `/privacy` · `/terms` | Static pages. |

## JSON API

### `GET /api/access/:owner/:repo`

Live collaborator list: `[{ login, avatar_url, html_url, role_name }]`.

- No/expired session → `401 { "error": "unauthorized" }`
- Repo you don't administer → `{ "error": 403 }` or `{ "error": 404 }`

```bash
curl http://localhost:3000/api/access/octocat/hello-world
```

### `POST /api/access/:owner/:repo`

Invite a collaborator.

```json
{ "user": "teammate@company.com", "permission": "write" }
```

- `user`: username or email (emails resolved via GitHub search first)
- `permission`: `read | triage | write | maintain | admin` *(default `write`)*

Success → `{ "ok": true, "reload": true, "message": "…" }`;
failure → `{ "ok": false, "message": "why" }`.

```bash
curl -X POST http://localhost:3000/api/access/octocat/hello-world \
  -H "Content-Type: application/json" \
  -d '{"user":"teammate@company.com","permission":"write"}'
```

Bodies are capped at 10 KB and parsed as JSON.
