# Launch Checklist

## 1. Overview

Production readiness checklist for the SMB Access Manager MVP launch. Every item must be verified before the launch go/no-go decision.

## 2. Purpose

Ensure nothing is forgotten before going live. Provide a structured sign-off process for all stakeholders.

## 3. Functional Requirements

*Covered in `03-functional-requirements.md`.*

## 4. Non-functional Requirements

*Covered in `04-non-functional-requirements.md`.*

## 5. Technical Design

### Pre-Launch Verification

#### Functional Readiness

| # | Item | Owner | Status | Notes |
|---|---|---|---|---|
| F-001 | Organization signup flow works end-to-end | Engineering | ☐ | |
| F-002 | Email verification sent and clickable link works | Engineering | ☐ | |
| F-003 | Login/logout flow functional | Engineering | ☐ | |
| F-004 | Password reset flow works end-to-end | Engineering | ☐ | |
| F-005 | Admin invitation flow works (invite → accept → access) | Engineering | ☐ | |
| F-006 | GitHub OAuth connection works | Engineering | ☐ | |
| F-007 | Notion OAuth connection works | Engineering | ☐ | |
| F-008 | Role CRUD complete | Engineering | ☐ | |
| F-009 | Employee creation triggers provisioning | Engineering | ☐ | |
| F-010 | GitHub provisioning succeeds (invite + team membership) | Engineering | ☐ | |
| F-011 | Notion provisioning succeeds (workspace invite) | Engineering | ☐ | |
| F-012 | Offboarding removes GitHub access | Engineering | ☐ | |
| F-013 | Offboarding removes Notion access | Engineering | ☐ | |
| F-014 | Activity log records all actions | Engineering | ☐ | |
| F-015 | Activity log filtering works | Engineering | ☐ | |
| F-016 | Dashboard displays correct stats | Engineering | ☐ | |

#### Non-Functional Readiness

| # | Item | Owner | Status | Notes |
|---|---|---|---|---|
| N-001 | API responses <200ms (p95) on staging load test | Engineering | ☐ | |
| N-002 | Provisioning completes <60s for GitHub + Notion | Engineering | ☐ | |
| N-003 | Rate limiting functional on auth endpoints | Engineering | ☐ | |
| N-004 | All API responses include rate limit headers | Engineering | ☐ | |
| N-005 | Session timeout functional (24h inactivity) | Engineering | ☐ | |
| N-006 | Account lockout after 5 failed attempts | Engineering | ☐ | |
| N-007 | All API traffic over TLS (HTTPS enforced) | Engineering | ☐ | |
| N-008 | Health check endpoint returns correct status | Engineering | ☐ | |

#### Security Readiness

| # | Item | Owner | Status | Notes |
|---|---|---|---|---|
| S-001 | OAuth tokens encrypted at rest (Fernet) | Engineering | ☐ | Verify in DB |
| S-002 | Passwords hashed with bcrypt cost 12 | Engineering | ☐ | |
| S-003 | Session cookies set with HttpOnly, Secure, SameSite | Engineering | ☐ | |
| S-004 | CSRF protection enabled on all state-changing endpoints | Engineering | ☐ | |
| S-005 | CORS configured restrictively (not `*`) | Engineering | ☐ | |
| S-006 | Security headers set (CSP, HSTS, X-Content-Type-Options) | Engineering | ☐ | |
| S-007 | Rate limiting enforced on auth (10 req/min) | Engineering | ☐ | |
| S-008 | No secrets in code, logs, or error responses | Engineering | ☐ | |
| S-009 | Database connection uses non-root user with least privilege | Engineering | ☐ | |
| S-010 | Dependency audit clean (no known vulnerabilities) | Engineering | ☐ | `pip-audit` or `safety` |

#### Testing Readiness

| # | Item | Owner | Status | Notes |
|---|---|---|---|---|
| T-001 | Unit test coverage ≥80% for business logic | Engineering | ☐ | |
| T-002 | All P0 endpoints have integration tests | Engineering | ☐ | |
| T-003 | E2E onboarding flow test passes | Engineering | ☐ | |
| T-004 | E2E offboarding flow test passes | Engineering | ☐ | |
| T-005 | Tests run in CI on every PR | Engineering | ☐ | |
| T-006 | No P0 or P1 bugs open | Engineering | ☐ | |

#### Deployment Readiness

| # | Item | Owner | Status | Notes |
|---|---|---|---|---|
| D-001 | Production VPS provisioned | Ops | ☐ | |
| D-002 | Docker Compose stack runs successfully | Engineering | ☐ | |
| D-003 | Database migrations run on first startup | Engineering | ☐ | |
| D-004 | TLS certificate issued and auto-renewal configured | Ops | ☐ | Let's Encrypt |
| D-005 | DNS configured for app domain | Ops | ☐ | |
| D-006 | Environment variables set on production | Engineering | ☐ | |
| D-007 | GitHub OAuth app configured (production callback URL) | Engineering | ☐ | |
| D-008 | Notion integration configured (production callback URL) | Engineering | ☐ | |
| D-009 | SMTP/email service configured and tested | Engineering | ☐ | |
| D-010 | CI/CD pipeline deploying to production | Engineering | ☐ | |
| D-011 | Health check passes on production | Engineering | ☐ | |
| D-012 | Backup cron job configured and tested | Ops | ☐ | |
| D-013 | Log rotation configured (Docker) | Ops | ☐ | |
| D-014 | Docker containers run as non-root user | Engineering | ☐ | |

#### Documentation Readiness

| # | Item | Owner | Status | Notes |
|---|---|---|---|---|
| DOC-01 | All documentation reviewed and approved | All | ☐ | |
| DOC-02 | API documentation up to date | Engineering | ☐ | |
| DOC-03 | Deployment runbook documented | Operations | ☐ | |
| DOC-04 | Recovery procedure documented and tested | Operations | ☐ | |
| DOC-05 | Known limitations communicated to stakeholders | Product | ☐ | |
| DOC-06 | Beta user onboarding guide created | Product | ☐ | |

#### Operations Readiness

| # | Item | Owner | Status | Notes |
|---|---|---|---|---|
| O-001 | Uptime monitoring configured (UptimeRobot or similar) | Ops | ☐ | |
| O-002 | On-call contact established for critical issues | Ops | ☐ | |
| O-003 | Incident response process documented | Ops | ☐ | |
| O-004 | Stakeholder communication plan ready | Product | ☐ | |
| O-005 | Beta feedback channel established | Product | ☐ | |
| O-006 | Rollback plan documented | Engineering | ☐ | |

### Launch Day Checklist

| Time | Item | Owner |
|---|---|---|
| T-24h | Final staging verification | Engineering |
| T-12h | Code freeze (no more PRs merged) | Engineering |
| T-6h | Production deploy | Engineering |
| T-4h | Smoke test all P0 flows on production | Engineering |
| T-2h | Monitor health check + error logs | Engineering |
| T-1h | Verify backup cron runs | Ops |
| T-0 | Flip DNS / announce launch | Product |
| T+1h | Monitor dashboard + logs | Engineering |
| T+4h | Check for issues, plan any hotfixes | Engineering |
| T+24h | Launch retrospective | All |

### Rollback Plan

If critical issues are found after launch:

1. **If DNS not yet propagated**: Revert DNS to maintenance page
2. **If traffic is live**: Deploy previous Docker image version
3. **If database migration needs rollback**: Run Alembic downgrade
4. **If data corruption**: Restore from most recent backup

```bash
# Rollback commands
git checkout <previous-tag>
docker compose up -d --build
docker compose exec app alembic downgrade -1  # if needed
```

### Post-Launch (First Week)

| Day | Activity | Owner |
|---|---|---|
| Day 1 | Monitor for critical issues, address hotfixes | Engineering |
| Day 2 | Review first batch of beta user feedback | Product |
| Day 3 | Performance review (load metrics, response times) | Engineering |
| Day 5 | Bug triage and prioritization | All |
| Day 7 | Launch retrospective meeting | All |

### Go/No-Go Sign-Off

| Role | Name | Sign-Off | Date |
|---|---|---|---|
| Engineering Lead | ________ | ☐ Yes / ☐ No | ____ |
| Product Manager | ________ | ☐ Yes / ☐ No | ____ |
| Operations Lead | ________ | ☐ Yes / ☐ No | ____ |
| Security Reviewer | ________ | ☐ Yes / ☐ No | ____ |

**Launch Decision**: ☐ Go / ☐ No-Go

**If No-Go, blocking items**: ___________________________________________

## 6. Data Model

No changes.

## 7. API Changes

No changes.

## 8. UI Changes

No changes.

## 9. Security Considerations

Security checklist items (S-001 through S-010) must all pass before go decision.

## 10. Error Handling

Error handling reviewed as part of functional readiness (F-001 through F-016).

## 11. Edge Cases

Edge case testing covered in E2E test suite (T-003, T-004).

## 12. Testing Strategy

All testing checklist items (T-001 through T-006) must pass before go decision.

## 13. Acceptance Criteria

All checklist items marked complete. Go/no-go decision signed off by all stakeholders.

## 14. Future Improvements

- Automated launch checklist verification (script that checks each item)
- Progressive rollout (enable for beta users, then gradually increase)
- Feature flags for toggling features post-launch
- Automated canary analysis for deployment safety
