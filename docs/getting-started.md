---
title: Getting started
description: From zero to running Orbit Access locally in under five minutes.
section: Setup
order: 2
---

# Getting started

## Prerequisites

- **Node.js ≥ 18** (global `fetch` is required). Developed on v24.
- A **GitHub OAuth App** — free at [github.com/settings/developers](https://github.com/settings/developers).
- *(Optional)* a **Notion public integration** for the Notion panel — [notion.so/profile/integrations](https://www.notion.so/profile/integrations).

## 1. GitHub app

1. Create an **OAuth App** (not a GitHub App). Homepage URL can be anything; callback URL too — Orbit Access accepts GitHub's reply on any path.
2. Copy the **Client ID** and **Client Secret**.

## 2. Notion integration (optional)

1. New integration → type **Public**.
2. Fill company name, support email, privacy policy URL, terms URL (any reachable `https://` links work), tick the agreement.
3. In **OAuth & Services**, register the redirect URI **exactly**:

   ```
   http://localhost:3000/notion/callback
   ```

4. Copy the OAuth **client ID** and **client secret** (the secret starts with `secret_`).

## 3. Configure `.env`

Create `.env` next to `server.js`:

```ini
GITHUB_CLIENT_ID=your_github_client_id
GITHUB_CLIENT_SECRET=your_github_client_secret

NOTION_CLIENT_ID=your_notion_client_id
NOTION_CLIENT_SECRET=secret_xxxxxxxxxxxx
NOTION_REDIRECT_URI=http://localhost:3000/notion/callback
```

See [Configuration](configuration.md) for every key.

## 4. Run

```bash
npm start        # or: node server.js
```

Open <http://localhost:3000> and sign in with GitHub. The nav switches between the **GitHub** and **Notion** panels; **Docs** renders the in-app reference at `/docs`.

> Sessions are held in memory — restarting the server signs everyone out by design until persistent storage ships ([Roadmap](roadmap.md)).
