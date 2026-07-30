# Open Questions

## 1. Overview

This document tracks unresolved questions and decisions that affect the MVP design. Each question is categorized by domain and marked with the role responsible for resolving it.

## 2. Purpose

Ensure open questions are not forgotten and are resolved before they block implementation.

## 3. Functional Requirements

*Covered in `03-functional-requirements.md`.*

## 4. Non-functional Requirements

*Covered in `04-non-functional-requirements.md`.*

## 5. Technical Design

### Open Questions

#### Product

| # | Question | Options | Decision | Owner |
|---|---|---|---|---|
| Q-001 | Should employees receive an email notification when they are provisioned? | (a) Yes — email with list of services provisioned (b) No — admin notifies them manually | Pending | Product |
| Q-002 | Should the free tier include unlimited employees or be capped? | (a) Cap at 10 employees free (b) Cap at 25 employees free (c) Unlimited during beta | Pending | Product |
| Q-003 | Should we support manual provisioning override (admin clicks "Provision Now" on a pending employee)? | (a) Yes — useful for retry (b) No — auto-provisioning is sufficient | Pending | Product |
| Q-004 | What is the branding/color scheme for the MVP? | (a) Use default Tailwind colors (b) Custom brand package needed | Pending | Design |
| Q-005 | Should we build a public landing/marketing page as part of MVP? | (a) Yes — separate marketing site (b) No — just the app (c) Yes — built into the app | Pending | Product |

#### Technical

| # | Question | Options | Decision | Owner |
|---|---|---|---|---|
| Q-010 | Should we use a managed email service (SendGrid, Mailgun, Resend) or self-hosted SMTP? | (a) Self-hosted SMTP via Docker (b) Managed service (recommended for deliverability) | Pending | Engineering |
| Q-011 | Should we store sessions in Redis or PostgreSQL? | (a) Redis — faster, TTL-based expiry (b) PostgreSQL — no extra dependency | Tentative: Redis | Engineering |
| Q-012 | Should we use ARQ or plain Redis pub/sub for background jobs? | (a) ARQ — job management built-in (b) Plain Redis — simpler | Tentative: ARQ | Engineering |
| Q-013 | What is the strategy for handling GitHub's requirement that users accept org invitations before team membership works? | (a) Poll invitation status and retry (b) Pre-invite to teams immediately (may partially work) (c) Accept on user's behalf (not possible via API) | Pending | Engineering |
| Q-014 | Should we maintain a refresh token strategy for Notion? Notion tokens don't expire — is this a risk? | (a) Accept risk — tokens are encrypted (b) Implement token rotation anyway (c) Provide admin token revocation UI | Pending | Engineering |
| Q-015 | Should we use a migration-based or state-based approach for CSS? | (a) Tailwind CDN (simplest for MVP) (b) Tailwind CLI build step (c) Full build pipeline | Tentative: CDN for MVP | Engineering |
| Q-016 | What is the backup encryption strategy? | (a) Encrypted backups to S3 (b) Unencrypted local backups (c) No backups for MVP | Pending | Engineering |
| Q-017 | Should we implement account email verification or skip for MVP? | (a) Required — prevents spam orgs (b) Optional — email verified flag but no block (c) Skip for MVP | Pending | Engineering |

#### Integration

| # | Question | Options | Decision | Owner |
|---|---|---|---|---|
| Q-020 | GitHub App vs GitHub OAuth App for integration? | (a) OAuth App — simpler setup (b) GitHub App — more granular permissions, webhooks | Tentative: OAuth App for MVP | Engineering |
| Q-021 | Should we support multiple GitHub organizations per workspace? | (a) One per org for MVP (b) Multiple from day one | Tentative: One per org | Product |
| Q-022 | Notion guest users vs full members? | (a) Full members only for MVP (b) Guest support included | Tentative: Full members only | Product |

#### Operations

| # | Question | Options | Decision | Owner |
|---|---|---|---|---|
| Q-030 | What VPS provider for MVP hosting? | (a) DigitalOcean (b) Hetzner (c) AWS Lightsail (d) Railway/Render (PaaS) | Pending | Ops |
| Q-031 | What domain name will the app use? | (a) orbitaccess.com (b) app.orbitaccess.com (c) Alternative name | Pending | Product |
| Q-032 | Should we set up staging environment? | (a) Yes — same as prod, smaller instance (b) No — dev environment only | Tentative: Yes | Ops |
| Q-033 | Who will be the beta testers? | (a) Internal team only (b) Select customer partners (c) Public beta | Pending | Product |

### Resolution Process

1. Question identified → added to this document
2. Owner assigned → researches options
3. Decision made → recorded in table, rationale added below
4. If decision affects architecture → new ADR created
5. Question moved to "Resolved" section below

### Resolved Questions

(To be filled as decisions are made.)

### Decision Rationale

Decisions recorded here when they require explanation beyond yes/no.

*(To be filled as decisions are made.)*

## 6. Data Model

No changes — pending decisions may affect schema.

## 7. API Changes

Pending decisions may affect API design.

## 8. UI Changes

Pending decisions may affect UI design.

## 9. Security Considerations

- Q-014: Notion token non-expiry means a leaked token is valid indefinitely. Encryption at rest is critical.
- Q-017: Skipping email verification means anyone can create an org with any email. Acceptable for beta but must be addressed for production.

## 10. Error Handling

No changes.

## 11. Edge Cases

No changes.

## 12. Testing Strategy

No changes.

## 13. Acceptance Criteria

All P0 questions resolved before Phase 1 development begins.

## 14. Future Improvements

- Automated tracking of open questions linked to implementation tickets
- Weekly review of open questions in team sync
- Decision deadline enforcement for blocking questions
