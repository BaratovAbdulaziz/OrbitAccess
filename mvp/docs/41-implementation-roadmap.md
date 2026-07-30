# Implementation Roadmap

## 1. Overview

This document is the daily reference for developers implementing the SMB Access Manager MVP. It defines the development order, milestones, branch strategy, code review requirements, and effort estimates for every phase.

## 2. Purpose

Provide a single source of truth for what to build, in what order, and to what standard. Replace context-switching between multiple docs with a sequenced execution plan.

## 3. Functional Requirements

*Covered in `03-functional-requirements.md`.*

## 4. Non-functional Requirements

*Covered in `04-non-functional-requirements.md`.*

## 5. Technical Design

### Dependency Graph

```
Phase 1: Foundation
  ├── Database Schema ─────────────────────┐
  ├── Config / Settings ───────────────────┤
  ├── Auth (signup, login, session) ───────┤
  └── Organization model ──────────────────┤
                                           ▼
Phase 2: Core Domain                ┌──────────────┐
  ├── Role CRUD ──────────────────▶│ Phase 2       │
  ├── Employee CRUD ──────────────▶│ depends on    │
  ├── Activity Log ───────────────▶│ Phase 1       │
  └── Permissions ────────────────▶└──────────────┘
                                           │
                                           ▼
Phase 3: GitHub Integration         ┌──────────────┐
  ├── OAuth flow ──────────────────▶│ Phase 3       │
  ├── Org connection ──────────────▶│ depends on    │
  ├── Member invite ───────────────▶│ Phase 1, 2    │
  └── Member remove ───────────────▶└──────────────┘
                                           │
                                           ▼
Phase 4: Notion Integration         ┌──────────────┐
  ├── OAuth flow ──────────────────▶│ Phase 4       │
  ├── Workspace connection ────────▶│ depends on    │
  ├── User provision ──────────────▶│ Phase 1, 2    │
  └── User removal ────────────────▶└──────────────┘
                                           │
                                           ▼
Phase 5: Automation                 ┌──────────────┐
  ├── ARQ worker setup ────────────▶│ Phase 5       │
  ├── Onboarding orchestration ────▶│ depends on    │
  ├── Offboarding orchestration ───▶│ Phase 3, 4    │
  └── Retry logic ─────────────────▶└──────────────┘
                                           │
                                           ▼
Phase 6: Frontend                   ┌──────────────┐
  ├── Login / Signup pages ────────▶│ Phase 6       │
  ├── Dashboard ───────────────────▶│ depends on    │
  ├── Employee pages ───────────────▶│ ALL previous  │
  ├── Role pages ──────────────────▶│ phases        │
  ├── Integration pages ───────────▶│               │
  └── Activity log pages ──────────▶└──────────────┘
                                           │
                                           ▼
Phase 7: Testing                    ┌──────────────┐
  ├── Unit tests ───────────────────▶│ Runs          │
  ├── Integration tests ────────────▶│ throughout    │
  ├── E2E tests ────────────────────▶│ all phases    │
  └── Load tests ───────────────────▶└──────────────┘
                                           │
                                           ▼
Phase 8: Production                 ┌──────────────┐
  ├── Deployment ───────────────────▶│ Final phase   │
  ├── Monitoring ───────────────────▶│ after all     │
  ├── Backup verification ──────────▶│ code complete │
  └── Beta release ─────────────────▶└──────────────┘
```

### Phase Breakdown

---

### Phase 1: Foundation (Estimated: 5 days)

**Goal**: Running app skeleton with database, auth, and CI/CD.

| Day | Tasks | Deliverables |
|---|---|---|
| 1 | Repository setup, Docker Compose, CI pipeline, project skeleton | `docker compose up` starts all services; CI passes |
| 2 | Database schema (all tables + indexes + migrations) | `alembic upgrade head` creates all tables |
| 3 | Configuration management (pydantic-settings), encryption utils, email utils | Config loads from env; Fernet encrypt/decrypt roundtrip |
| 4 | Auth: signup, login, logout, session management | POST /auth/signup, /login, /logout functional |
| 5 | Organization CRUD, email verification flow, admin invitation flow | Owner can create org, invite admin, admin accepts |

**Files to create**:
- `app/main.py`, `app/config.py`, `app/db/engine.py`, `app/db/base.py`
- All 8 model files under `app/db/models/`
- `app/api/v1/auth.py`, `app/api/v1/organizations.py`, `app/api/v1/admins.py`
- `app/services/auth.py`, `app/services/organization.py`, `app/services/admin.py`
- `app/utils/encryption.py`, `app/utils/email.py`, `app/utils/rate_limit.py`
- `app/api/deps.py`, `app/api/errors.py`
- `migrations/versions/` (initial migration)
- `docker-compose.yml`, `Dockerfile`, `docker/nginx.conf`
- `.env.example`, `requirements.txt`, `pyproject.toml`
- `tests/conftest.py`, `tests/factories.py`
- `tests/integration/test_api_auth.py`

---

### Phase 2: Core Domain (Estimated: 5 days)

**Goal**: Employees, roles, activity logs with full CRUD and permission enforcement.

| Day | Tasks | Deliverables |
|---|---|---|
| 1 | Role CRUD (create, read, update, delete with protection) | POST/GET/PATCH/DELETE /roles functional |
| 2 | Employee CRUD (create, read, update, offboard) | POST/GET/PATCH /employees functional |
| 3 | Permission enforcement middleware, owner/admin distinction | Admin blocked from owner endpoints |
| 4 | Activity log service, automatic logging on all domain actions | All actions create log entries |
| 5 | Employee detail with integration status (scaffold), validation tightening | GET /employees/{id} shows full state |

**Files to create**:
- `app/services/role.py`, `app/services/employee.py`, `app/services/activity_log.py`
- `app/api/v1/roles.py`, `app/api/v1/employees.py`, `app/api/v1/activity_logs.py`
- `tests/unit/test_roles.py`, `tests/unit/test_employees.py`
- `tests/integration/test_api_roles.py`, `tests/integration/test_api_employees.py`
- `tests/integration/test_api_activity_logs.py`

---

### Phase 3: GitHub Integration (Estimated: 4 days)

**Goal**: Connect GitHub Organization, invite and remove members.

| Day | Tasks | Deliverables |
|---|---|---|
| 1 | GitHub OAuth flow (auth URL, callback, token storage) | OAuth complete; token encrypted and stored |
| 2 | GitHub API client: list orgs, list teams | Integration shows org name and team list |
| 3 | Provisioning: invite to org, add to teams | Employee creation triggers GitHub invite |
| 4 | Deprovisioning: remove from teams, remove from org | Offboarding removes GitHub access |

**Files to create**:
- `app/services/github.py` (GitHub API client with rate limiting, retry)
- `app/api/v1/integrations.py` (OAuth routes)
- `app/workers/worker.py`, `app/workers/tasks.py` (ARQ setup + provision/deprovision tasks)
- `tests/mocks/github_api.py`
- `tests/integration/test_api_integrations.py`
- `tests/integration/test_provisioning.py`

---

### Phase 4: Notion Integration (Estimated: 3 days)

**Goal**: Connect Notion workspace, invite and remove members.

| Day | Tasks | Deliverables |
|---|---|---|
| 1 | Notion OAuth flow (auth URL, callback, token storage) | OAuth complete; token encrypted and stored |
| 2 | Notion API client: invite user, remove user | Provisioning and deprovisioning functional |
| 3 | Integration health checks, disconnect flows | Integration status tracked; disconnect works |

**Files to create**:
- `app/services/notion.py`
- `tests/mocks/notion_api.py`

---

### Phase 5: Automation (Estimated: 4 days)

**Goal**: Reliable background job processing with retry logic and status tracking.

| Day | Tasks | Deliverables |
|---|---|---|
| 1 | ARQ worker setup, job enqueue/deprovision flow | Background jobs process in worker process |
| 2 | Provisioning orchestration (iterate role configs, call integrations) | Full provisioning pipeline working |
| 3 | Retry logic (exponential backoff, max 3 attempts), error capture | Failed jobs retry; errors stored |
| 4 | Provisioning job history, employee status updates via worker | Employee status transitions correctly |

**Files to create/update**:
- `app/services/provisioning.py` (orchestration, status tracking)
- Update `app/workers/tasks.py` (complete task implementations)
- `tests/unit/test_provisioning.py`

---

### Phase 6: Frontend (Estimated: 8 days)

**Goal**: Complete admin dashboard UI.

| Day | Tasks | Deliverables |
|---|---|---|
| 1 | Base template (layout, nav, Tailwind setup), login/signup pages | Login page functional; session-based redirect |
| 2 | Dashboard page (stats cards, integration status, recent activity) | Dashboard shows real data |
| 3 | Employee list page (table, search, filter, pagination) | Employee list with all states |
| 4 | Employee detail page, add employee modal, offboard confirmation | Full employee management UI |
| 5 | Role list page, role create/edit form | Role management UI |
| 6 | Integration pages (connect, connected status, disconnect) | Integration management UI |
| 7 | Activity log page (table, filters, pagination, detail expand) | Activity log with all filters |
| 8 | Settings page (org settings, admin management), invitations | Settings functional |

**Files to create**:
- `app/templates/base.html`, `app/templates/components/*.html`
- `app/templates/auth/*.html` (5 pages)
- `app/templates/dashboard.html`
- `app/templates/employees/*.html` (3 pages)
- `app/templates/roles/*.html` (3 pages)
- `app/templates/integrations/index.html`
- `app/templates/activity_logs/index.html`
- `app/static/css/output.css`, `app/static/js/app.js`

---

### Phase 7: Testing (Estimated: 4 days, run throughout)

**Goal**: Comprehensive test coverage. Tests should be written alongside code in earlier phases; this phase focuses on filling gaps and adding E2E tests.

| Day | Tasks | Deliverables |
|---|---|---|
| 1 | Unit test coverage audit and gap-filling (target ≥80% business logic) | Coverage report passes threshold |
| 2 | Integration test completion (all error scenarios, edge cases) | All API endpoints tested |
| 3 | E2E tests (Playwright): onboarding flow, offboarding flow | E2E tests pass in CI |
| 4 | Load test (locust/k6): 10 concurrent users, measure p95 | Performance targets met |

**Files to create**:
- `tests/e2e/test_onboarding_flow.py`
- `tests/e2e/test_offboarding_flow.py`
- Locustfile or k6 script in `scripts/`

---

### Phase 8: Production (Estimated: 4 days)

**Goal**: Deploy to production, verify all systems operational.

| Day | Tasks | Deliverables |
|---|---|---|
| 1 | Production VPS provisioning, Docker Compose deploy | App accessible at production URL |
| 2 | SSL (Let's Encrypt), DNS, CORS hardening | HTTPS enforced |
| 3 | Backup cron, monitoring (UptimeRobot), log rotation | Backup verified; health check monitored |
| 4 | Final smoke test, launch checklist sign-off, beta release | Go/no-go decision |

---

### Effort Summary

| Phase | Estimated Days | Cumulative |
|---|---|---|
| Phase 1: Foundation | 5 | 5 |
| Phase 2: Core Domain | 5 | 10 |
| Phase 3: GitHub Integration | 4 | 14 |
| Phase 4: Notion Integration | 3 | 17 |
| Phase 5: Automation | 4 | 21 |
| Phase 6: Frontend | 8 | 29 |
| Phase 7: Testing | 4 | 33 |
| Phase 8: Production | 4 | 37 |
| **Total** | **37 days** | **~8 weeks** |

### Branch Strategy

```
main
  └── develop
        ├── phase/1-foundation
        ├── phase/2-core-domain
        ├── phase/3-github
        ├── phase/4-notion
        ├── phase/5-automation
        ├── phase/6-frontend
        ├── phase/7-testing
        └── phase/8-production
              │
Feature branches created from the active phase branch:
              │
              └── feature/<short-description>
              └── fix/<short-description>
```

**Rules**:
- `main` is always deployable
- `develop` is the integration branch
- Phase branches merge to `develop` when complete
- Feature branches merge to the active phase branch
- No direct commits to `main` or `develop`

### Definition of Done

A feature or phase is "done" when:

1. **Code**: All implementation code written and merged
2. **Tests**: Unit tests pass (≥80% coverage), integration tests pass, E2E tests pass
3. **Docs**: All relevant documentation updated in the same PR
4. **Style**: Code passes `ruff check` and `ruff format`
5. **Review**: PR approved by at least one reviewer
6. **Integration**: Branch merged to target without conflicts
7. **CI**: All CI checks pass
8. **Manual verification**: Feature verified in development environment (staging for Phase 8)

### PR Requirements

Every PR must include:

| Requirement | Description |
|---|---|
| **Title** | `<type>(<scope>): <description>` (e.g., `feat(auth): add login endpoint`) |
| **Description** | What changed, why, how to verify |
| **Related docs** | Links to relevant documentation files |
| **Screenshots** | For UI changes |
| **Migration notes** | Any DB migrations included |
| **Breaking changes** | Any API contract changes |
| **Test evidence** | Coverage report or test output |

**Types**: `feat`, `fix`, `docs`, `refactor`, `test`, `chore`, `perf`

### Code Review Checklist

Reviewers verify:

- [ ] Code follows coding standards (`ruff check` passes)
- [ ] Type hints present on all function signatures
- [ ] No TODO, FIXME, or debug code left in
- [ ] Error handling covers failure paths
- [ ] Input validation on all public endpoints
- [ ] Permissions enforced for protected endpoints
- [ ] Sensitive data not logged or exposed
- [ ] Tests cover positive and negative cases
- [ ] Tests are readable and maintainable
- [ ] Migration has `downgrade()` defined
- [ ] Documentation updated in the same PR
- [ ] No secrets or credentials in code

### Definition of MVP Complete

The MVP is complete when ALL the following are true:

| # | Criterion | Verification |
|---|---|---|
| 1 | Organization creation and email verification | E2E test passes |
| 2 | Admin invitation and acceptance | E2E test passes |
| 3 | Secure authentication (login/logout/session) | E2E test + security review |
| 4 | GitHub OAuth connection | Integration test passes |
| 5 | Notion OAuth connection | Integration test passes |
| 6 | Role creation with integration configs | Integration test passes |
| 7 | Employee creation triggers provisioning | E2E test passes |
| 8 | GitHub provisioning succeeds (invite + teams) | Integration test passes |
| 9 | Notion provisioning succeeds (workspace invite) | Integration test passes |
| 10 | Offboarding removes all access | E2E test passes |
| 11 | Activity log records all actions | Integration test passes |
| 12 | All API endpoints respond correctly | Integration test suite passes |
| 13 | Business logic test coverage ≥80% | Coverage report |
| 14 | No P0 or P1 bugs | Bug tracker |
| 15 | Deployment is repeatable (CI/CD) | Deploy from CI succeeds |
| 16 | Health check and monitoring operational | Health endpoint verified |
| 17 | Backups running and tested | Restore test passes |
| 18 | Documentation matches implementation | Docs review |

When all criteria are met, tag `v1.0.0` and begin beta.

## 6. Data Model

Covered in `06-database-design.md`. Schema changes during implementation must update that document.

## 7. API Changes

Covered in `07-api-design.md`. Endpoint changes during implementation must update that document.

## 8. UI Changes

Covered in `12-admin-dashboard.md` through `16-activity-logs.md`. UI changes during implementation must update those documents.

## 9. Security Considerations

- Phase 1 must implement auth securely before any other feature
- Integration tokens are encrypted from Phase 3/4
- Permission enforcement added in Phase 2 before employee management

## 10. Error Handling

Error handling patterns established in Phase 1 and refined throughout. See `23-error-handling.md` and `34-api-error-codes.md`.

## 11. Edge Cases

Edge cases for each feature handled during its implementation phase. See individual feature documents for details.

## 12. Testing Strategy

Tests are written alongside code (not deferred). Phase 7 closes coverage gaps. See `17-testing.md`.

## 13. Acceptance Criteria

Covered in the "Definition of MVP Complete" table above.

## 14. Future Improvements

- V1 planning begins after MVP launch
- Prioritization based on beta user feedback
- Integration provider API for third-party extensions
