---
title: Configuration
description: Every environment variable Orbit Access reads from .env.
section: Setup
order: 3
---

# Configuration

All settings come from a `.env` file in the project root (loaded by `lib/config.js`; real environment variables take precedence).

## Keys

| Key | Required | Description |
|---|---|---|
| `GITHUB_CLIENT_ID` | Yes | OAuth App client ID from [github.com/settings/developers](https://github.com/settings/developers). |
| `GITHUB_CLIENT_SECRET` | Yes | Matching client secret. Server-side only — never sent to the browser. |
| `NOTION_CLIENT_ID` | For Notion | Public integration client ID (a UUID) from notion.so/my-integrations → OAuth & Services. |
| `NOTION_CLIENT_SECRET` | For Notion | Integration secret (`secret_…`). |
| `NOTION_REDIRECT_URI` | No | Defaults to `http://localhost:3000/notion/callback`. Must exactly match a URI registered on the integration — set this when deploying to another host. |
| `PORT` | No | Listen port. Defaults to `3000`. |

## Notes

- Missing GitHub keys → `/login` renders a "Configuration missing" page instead of redirecting.
- Missing Notion keys → `/login/notion` renders setup instructions instead of redirecting; everything else keeps working.
- `.env` values are read **once at boot** — restart after changing them.
- The Notion redirect URI is baked into both the authorize redirect and the token exchange, so a mismatch surfaces as an error on callback, not at startup.
