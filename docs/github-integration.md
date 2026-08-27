---
title: GitHub integration
description: Scopes, endpoints, and the collaborator invite flow behind the GitHub panel.
section: Integrations
order: 6
---

# GitHub integration

## OAuth scopes

| Scope | Unlocks |
|---|---|
| `read:user` | Profile: name, avatar, followers, profile URL. |
| `repo` | Public **and** private repos (personal + org), collaborator lists, sending invitations. |
| `read:org` | Organization memberships and org repo listings. |

No admin or delete scopes are requested — the app can read access metadata and *invite* collaborators on repos you administer; it cannot change settings or push code.

## Endpoints used

| Call | Purpose |
|---|---|
| `POST /login/oauth/access_token` | Exchange one-time code for token. |
| `GET /user` | Signed-in profile shown in the panel header. |
| `GET /user/repos?sort=pushed&per_page=100&visibility=public\|private` | Personal repos, split by visibility. |
| `GET /user/orgs` + `GET /orgs/:org/repos?sort=pushed` | Org sections. |
| `GET /repos/:owner/:repo/collaborators` | Powers the expandable per-repo list and the JSON API. |
| `GET /search/users?q=email+in:email` | Resolves an email input to a username before inviting. |
| `PUT /repos/:owner/:repo/collaborators/:username` | Sends the invite with the chosen permission. |

## Invite flow

1. User expands a repo tile → client fetches `/api/access/:owner/:repo`.
2. Admin-only guard: a non-array response means "not your call to make" — the form is hidden and an explanation is shown instead.
3. Input accepts `@username` or any email tied to a public GitHub account.
4. Permission select maps UI labels to GitHub's API values:

   | UI | GitHub permission |
   |---|---|
   | Read | `pull` |
   | Triage | `triage` |
   | Write *(default)* | `push` |
   | Maintain | `maintain` |
   | Admin | `admin` |

5. Success auto-reloads the list so the new collaborator appears immediately.
