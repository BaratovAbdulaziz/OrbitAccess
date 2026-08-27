---
title: Security
description: What Orbit Access protects, how, and what you should still do yourself.
section: Reference
order: 9
---

# Security

## Built in

- **CSRF-guarded OAuth on both flows** — every callback requires `state` to match a short-lived (10 min) HttpOnly cookie; mismatches render an error instead of proceeding.
- **Tokens never touch the browser** — GitHub and Notion tokens live only in the server's memory, keyed by an opaque random `sid` cookie (`HttpOnly`, `SameSite=Lax`).
- **XSS-safe output** — all dynamic strings pass through HTML escaping; the client-side panel builds DOM nodes with `textContent`, never `innerHTML` with user data.
- **Hardened inputs** — JSON request bodies are capped at 10 KB; path segments are URL-encoded before hitting upstream APIs.
- **Least privilege** — GitHub scopes are limited to `read:user repo read:org`; no admin/org-admin scopes. Notion access is bounded by what you explicitly share with the integration.
- **Nothing persists** — no disk writes, no logs of secrets, no analytics. Restart or logout destroys everything.

## Honest limits

- In-memory sessions mean a server crash loses logins — that's the trade until persistent storage ships.
- Anyone with the `.env` file owns both integrations: keep it out of version control and **rotate any secret that has been shared in chats, screenshots, or commits**.
- The app trusts GitHub/Notion over HTTPS; run it behind TLS if you expose it beyond localhost.

## Revoking

- GitHub: Settings → Applications → Authorized OAuth Apps → revoke.
- Notion: integration settings → remove the connection, or disconnect from the panel first.
