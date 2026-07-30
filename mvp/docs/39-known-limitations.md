# Known Limitations

## 1. Overview

Explicitly documents the known limitations and constraints of the SMB Access Manager MVP. These are deliberate trade-offs made to ship quickly, not oversights.

## 2. Purpose

Set clear expectations for stakeholders, beta testers, and future developers about what the MVP does and does not do.

## 3. Functional Requirements

*Covered in `03-functional-requirements.md`.*

## 4. Non-functional Requirements

*Covered in `04-non-functional-requirements.md`.*

## 5. Technical Design

### Functional Limitations

| # | Limitation | Rationale | Future Work |
|---|---|---|---|
| L-001 | **Only two integrations** (GitHub Organizations + Notion workspaces) | Core workflow validation — additional integrations add complexity without proving the model | Add Slack, Google Workspace, Microsoft 365, etc. |
| L-002 | **No employee self-service portal** — employees cannot log in, view their access, or request changes | Not required for core onboarding/offboarding workflow | Employee-facing portal for V1 |
| L-003 | **No bulk operations** — employees must be added one at a time | Bulk operations add UI and validation complexity; not needed for 5–100 employee orgs | CSV import, bulk offboarding |
| L-004 | **No role templates / marketplace** | Each org defines roles from scratch | Role marketplace with pre-built templates |
| L-005 | **No approval workflows** | Provisioning is immediate on employee creation | Manager approval gate before provisioning |
| L-006 | **No scheduled offboarding** | Offboarding is always immediate | Set future departure date |
| L-007 | **No SSO/SAML** | Adds significant complexity (IdP integration, metadata exchange, certificate management) | SSO for V1 |
| L-008 | **No SCIM provisioning** | SCIM is an enterprise feature; adds server-side implementation complexity | SCIM for V2 |
| L-009 | **No webhook events** | Webhook delivery system adds queue management, retry, and delivery tracking complexity | Webhooks for V1 |
| L-010 | **No API tokens for programmatic access** | All API access is via browser session | Developer API for V1 |

### Technical Limitations

| # | Limitation | Rationale | Future Work |
|---|---|---|---|
| L-011 | **Single server deployment** — no HA, no auto-scaling | HA adds significant infrastructure and application complexity; MVP traffic is low | Kubernetes / multi-instance deployment |
| L-012 | **No zero-downtime deployments** | Rolling deployments require load balancer, health check gating, and migration safety | Blue-green or rolling deployments |
| L-013 | **No read replicas** | Single database handles MVP load; read replicas add replication lag management | Read replicas for activity log queries |
| L-014 | **No CDN for static assets** | Static assets served by Nginx on the application server | CDN for global performance |
| L-015 | **No database connection pooling (PgBouncer)** | SQLAlchemy pool is sufficient for single-instance load | PgBouncer for connection management |
| L-016 | **No database WAL archiving / PITR** | Point-in-time recovery requires WAL archiving setup | Managed PostgreSQL with automated PITR |
| L-017 | **In-memory metrics only** — lost on restart | Separate metrics infrastructure adds operational complexity | Prometheus + Grafana |
| L-018 | **No structured error tracking (Sentry)** | Adds integration dependency | Sentry for error tracking |
| L-019 | **No automated performance regression testing** | Performance testing infrastructure adds setup time | k6 / Locust in CI |
| L-020 | **No database migration automation beyond Alembic** | Manual migration review and testing process | Automated migration testing in CI |

### UX Limitations

| # | Limitation | Rationale | Future Work |
|---|---|---|---|
| L-021 | **No mobile-responsive admin dashboard** | Admins primarily use desktop; responsive design adds frontend complexity | Responsive UI for V1 |
| L-022 | **No dark mode** | Not a priority for MVP | Theming support |
| L-023 | **No keyboard shortcuts** | Power-user feature; not needed for MVP | Keyboard navigation |
| L-024 | **No multi-language support** | MVP in English only | i18n framework |
| L-025 | **No accessibility audit** | WCAG compliance adds testing and remediation effort | Accessibility review |

### Operational Limitations

| # | Limitation | Rationale | Future Work |
|---|---|---|---|
| L-026 | **No SLA guarantee** | MVP is best-effort; no formal uptime commitment | SLA for paid tiers |
| L-027 | **No dedicated support** | Support via email only; no in-app chat or phone | Support tiers |
| L-028 | **No usage/billing system** | MVP is free during beta | Subscription management |
| L-029 | **No audit report export** | Activity log is in-app only | CSV/PDF export |
| L-030 | **No team collaboration features** | Comments, notes, assignments not included | Collaboration tools |

### Data Limitations

| # | Limitation | Rationale | Future Work |
|---|---|---|---|
| L-031 | **Soft-delete preserves data indefinitely** | No purge policy for MVP | Data retention policies |
| L-032 | **Activity logs retained indefinitely** | No archiving or rotation for MVP | Log retention policies |
| L-033 | **No data export for customers** | Customers cannot download their data | Self-service data export |
| L-034 | **No GDPR/CCPA compliance tooling** | Not addressed for MVP | Compliance features |

### Integration-Specific Limitations

| # | Limitation | Rationale | Future Work |
|---|---|---|---|
| L-035 | **GitHub: requires user to accept org invitation** | GitHub API limitation; polling works but adds delay | Webhook-based acceptance detection |
| L-036 | **Notion: no page-level permission management** | Role grants workspace access, not page-level | Page-level permissions |
| L-037 | **Notion: removed users' content remains orphaned** | Notion API limitation | Content reassignment on offboarding |
| L-038 | **No integration health monitoring (proactive)** | Integration health checked on use, not proactively | Proactive health checks |

## 6. Data Model

No changes — limitations are product/operational, not data model.

## 7. API Changes

No changes.

## 8. UI Changes

No changes.

## 9. Security Considerations

- L-018 (no Sentry): Error monitoring gap — rely on structured logs
- L-016 (no PITR): Recovery limited to last daily backup
- L-026 (no SLA): Communicate best-effort basis to beta users

## 10. Error Handling

No changes — limitations document constraints, not error behavior.

## 11. Edge Cases

No changes.

## 12. Testing Strategy

Known limitations are tested as expected behavior (e.g., tests verify that bulk operations are not available).

## 13. Acceptance Criteria

- All known limitations are documented and communicated to stakeholders
- No undocumented limitations exist
- Limitations are tracked for future roadmap prioritization

## 14. Future Improvements

This document exists to track what will be improved. Each limitation links to a future milestone.
