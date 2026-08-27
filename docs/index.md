---
title: Orbit Access
description: One control panel for everything your team can reach — GitHub repositories and Notion workspaces side by side.
section: Overview
order: 1
---

# Orbit Access

**Orbit Access** is a zero-dependency Node.js web app that turns access review into a single panel. Sign in with GitHub to audit exactly who can reach every repository you control — personal, private, and organization-wide — and invite teammates with the right permission in seconds. Connect Notion to see every page and database your workspace shares with the integration, right next to your repo roles.

## Highlights

- **GitHub control panel** — every repo you own or can reach in your orgs, expandable to a live collaborator list with role chips.
- **One-click invites** — add collaborators by username *or* email with a permission dropdown (Read → Admin).
- **Notion panel** — connect a workspace via OAuth and browse shared databases and pages with the same card UI.
- **Honest UI** — skeleton loading states, inline session-expiry recovery, empty states that explain what to do next.
- **Light + dark themes**, warm editorial design system (see [Design System](design-system.md)).
- **Zero dependencies** — pure Node.js standard library plus the GitHub & Notion REST APIs.

## Documentation map

| Doc | What it covers |
|---|---|
| [Getting started](getting-started.md) | Prerequisites, OAuth apps, first run |
| [Configuration](configuration.md) | Every `.env` key |
| [Architecture](architecture.md) | Module map, request lifecycle, session model |
| [Routes](routes.md) | All HTTP routes + JSON API with curl examples |
| [GitHub integration](github-integration.md) | Scopes, endpoints used, invite flow |
| [Notion integration](notion-integration.md) | OAuth handshake, sharing model, sync |
| [Design system](design-system.md) | Tokens, type, components |
| [Security](security.md) | Threat model notes and mitigations |
| [Roadmap](roadmap.md) | What ships next |

## Quick start

```bash
npm start          # http://localhost:3000
```

Credentials live in `.env` — see [Getting started](getting-started.md).
