---
title: Architecture
description: How Orbit Access is wired — modules, request lifecycle, and session model.
section: Internals
order: 4
---

# Architecture

## Design rules

1. **Zero dependencies.** `node:http`, global `fetch`, `node:crypto`. Nothing else.
2. **Thin router.** `server.js` only matches paths and delegates; all logic lives in named functions or modules.
3. **Tokens never leave server memory.** The browser holds one opaque `sid` cookie.

## Module map

```
├── server.js          entry point & router (~230 lines)
├── style.css          design system (light + dark)
├── lib/
│   ├── config.js      .env loader & settings
│   ├── github.js      GitHub REST calls (token, user, repos, orgs, collaborators)
│   ├── notion.js      Notion OAuth + /search listing
│   ├── sessions.js    in-memory session Map
│   └── util.js        esc, send, cookies, JSON body reader
└── views/
    ├── icons.js       inline SVG marks (spike, GitHub mark, sun/moon)
    ├── shell.js       HTML frame, nav switcher, theme toggle
    ├── landing.js     logged-out marketing page
    ├── panel.js       GitHub access panel (+ lazy-load client script)
    └── pages.js       docs, legal, message & Notion pages
```

## Request lifecycle

### GitHub sign-in

```
GET /login
  └─ random state → oauth_state cookie (10 min) → 302 github.com/oauth/authorize

GitHub replies ?code=&state= on ANY path
  ├─ state must equal cookie            (CSRF guard)
  ├─ code → POST login/oauth/access_token
  ├─ fetch user + public repos + private repos + orgs (parallel)
  └─ new sid cookie, session stored, 302 /
```

The catch-all callback branch is checked **after** `/notion/callback` but **before** `/`, so whatever callback URL your GitHub App registers will work.

### Notion connect

```
GET /login/notion
  └─ state → notion_state cookie → 302 api.notion.com/v1/oauth/authorize

GET /notion/callback?code=&state=
  ├─ state must equal cookie
  ├─ code → POST /v1/oauth/token   (Basic auth: client_id:secret)
  ├─ token → POST /v1/search       (list reachable pages/databases)
  └─ merged into current session (or standalone session), 302 /notion
```

## Session shape

```js
sessions.get(sid) = {
  token:       "<github oauth token>",
  user:        { login, name, avatar_url, html_url, followers, … },
  ownPublic:   [repo…], ownPrivate: [repo…],
  orgs:        [{ org, repos: [repo…] }],
  notion?: {
    access_token, workspace_name, workspace_icon, owner,
    items: [{ object, id, url, title, icon, parent, edited }]
  }
}
```

`notion.items` is refreshed by `GET /refresh/notion` and captured fresh at every connect.

## Route-order gotchas

- `/style.css` first (static).
- `/notion/callback` **before** the GitHub catch-all — otherwise Notion's reply would be eaten by the GitHub branch.
- `/logout/notion`, `/refresh/notion`, `/refresh` are plain redirects with side effects.
