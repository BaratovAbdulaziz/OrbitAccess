---
title: Notion integration
description: How the Notion OAuth handshake works, what gets listed, and the sharing model's one catch.
section: Integrations
order: 7
---

# Notion integration

## The handshake

```
/login/notion ──► https://api.notion.com/v1/oauth/authorize
                  client_id, redirect_uri, response_type=code,
                  owner=user, state (cookie-backed CSRF guard)

/notion/callback ◄─ code + state
   POST /v1/oauth/token
     Authorization: Basic base64(client_id:client_secret)
     { grant_type: "authorization_code", code, redirect_uri }
   → access_token, workspace_name, workspace_icon, owner, bot
```

- `redirect_uri` defaults to `http://localhost:3000/notion/callback` and must match the integration's registered URI **character-for-character** (override with `NOTION_REDIRECT_URI`).
- The token is merged into your existing session if you're signed in with GitHub; otherwise a standalone session is created — both panels work independently.

## What the panel shows

Right after connecting (and on every **Re-sync**), Orbit Access calls:

```http
POST https://api.notion.com/v1/search        page_size: 100
Authorization: Bearer <access_token>
Notion-Version: 2022-06-28
```

Results are flattened into `{ object, id, url, title, icon, parent, edited }`, sorted by `last_edited_time`, and split into **Databases** and **Pages** sections mirroring the GitHub panel's card layout.

## The one catch: sharing

The search API only returns content **explicitly shared with the integration**. If the panel says "No shared content yet":

1. Open the page/database in Notion.
2. Click `•••` → **Connections** → select your Orbit Access integration.
3. Hit **Re-sync** in the panel.

This is Notion's security model, not a limitation of the app — the integration can never enumerate content you haven't granted.

## Disconnecting

`GET /logout/notion` removes the workspace link from the session. Your GitHub login stays intact. To revoke fully, delete the connection from Notion's integration settings too.
