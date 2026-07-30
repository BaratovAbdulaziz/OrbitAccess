# Release Plan

## 1. Overview

Defines the release plan for the SMB Access Manager MVP, including milestones, timeline, and release criteria.

## 2. Purpose

Provide a clear roadmap from development start to MVP launch, with defined checkpoints and quality gates.

## 3. Functional Requirements

*Covered in `03-functional-requirements.md`.*

## 4. Non-functional Requirements

*Covered in `04-non-functional-requirements.md`.*

## 5. Technical Design

### Release Phases

```
Phase 0: Foundation ───────────────── Week 1
  ├── Project setup (repo, Docker, CI)
  ├── Database schema + migrations
  ├── Config management
  └── Basic app skeleton

Phase 1: Auth + Org ───────────────── Weeks 2–3
  ├── Auth (signup, login, logout)
  ├── Session management
  ├── Admin invitation flow
  └── Organization CRUD

Phase 2: Integrations ─────────────── Weeks 4–5
  ├── GitHub OAuth + API integration
  ├── Notion OAuth + API integration
  └── Integration management UI

Phase 3: Roles ────────────────────── Week 6
  ├── Role CRUD
  ├── Role-integration config
  └── Role management UI

Phase 4: Employees ────────────────── Weeks 7–8
  ├── Employee CRUD
  ├── Role assignment
  ├── Background job system (ARQ)
  ├── Provisioning orchestration
  └── Employee management UI

Phase 5: Offboarding ──────────────── Week 9
  ├── Deprovisioning orchestration
  ├── Confirmation flow
  └── Status tracking

Phase 6: Activity Log ─────────────── Week 10
  ├── Log creation on all actions
  ├── Log query + filter API
  └── Activity log UI

Phase 7: Dashboard + Polish ───────── Week 11
  ├── Dashboard with stats
  ├── Error handling review
  ├── UI polish
  └── Performance optimization

Phase 8: Testing + Launch ─────────── Week 12
  ├── E2E tests
  ├── Load tests
  ├── Security review
  ├── Documentation finalization
  └── Production deployment
```

### Milestones

| Milestone | Target | Deliverable |
|---|---|---|
| M0: Foundation | Week 1 end | Running app skeleton with DB, Redis, CI passing |
| M1: Auth Complete | Week 3 end | Users can sign up, log in, invite admins |
| M2: Integrations | Week 5 end | GitHub and Notion connected and verified |
| M3: Roles | Week 6 end | Roles created with integration config |
| M4: Onboarding | Week 8 end | Employee added → provisioned automatically |
| M5: Offboarding | Week 9 end | Employee offboarded → access revoked |
| M6: Audit | Week 10 end | Complete activity log with filters |
| M7: MVP Ready | Week 11 end | Full feature complete, tested, documented |
| M8: Launch | Week 12 end | Deployed to production |

### Release Criteria

Each milestone must pass:

1. **Code Review**: All code reviewed and approved
2. **Tests**: All tests passing (≥80% coverage)
3. **Docs**: Relevant documentation updated
4. **Manual Verification**: Feature verified in staging environment

### Go/No-Go Decision for Launch

| Criterion | Pass/Fail |
|---|---|
| All P0 functional requirements implemented and tested | Required |
| No known P0 or P1 bugs | Required |
| E2E onboarding flow passes | Required |
| E2E offboarding flow passes | Required |
| Security review completed | Required |
| Load test passes (10 concurrent users) | Required |
| Documentation complete | Required |
| Production infrastructure provisioned | Required |
| Backup/restore procedure tested | Required |

### Post-Launch

- **Week 13**: Bug fix period — address issues found in first week of production
- **Week 14–16**: Gather user feedback, prioritize improvements
- **Month 2**: Begin planning V1 (next major iteration)

### Deployment Strategy

- Staging environment always deployed from `main` branch
- Production deployment: manual approval after staging verification
- Rollback plan: `git revert` + `docker compose up --build` with previous image tag

### Communication

- Weekly status updates to stakeholders
- Milestone demo at each M point
- Launch announcement to beta users

## 6. Data Model

Finalized before Phase 0 ends. Schema changes after Phase 0 require migration approvals.

## 7. API Changes

API contract finalized before Phase 1 implementation. Changes after Phase 1 require approval.

## 8. UI Changes

UI finalized in Phase 7 based on feedback from earlier phases.

## 9. Security Considerations

- Security review before launch (Phase 8)
- Penetration testing of auth flows
- Dependency audit for known vulnerabilities

## 10. Error Handling

Error handling reviewed in Phase 7 and continuously improved.

## 11. Edge Cases

Edge cases for each feature covered during development phase.

## 12. Testing Strategy

- Tests written alongside code (TDD where practical)
- All PRs require passing tests
- Code review requires test coverage verification

## 13. Acceptance Criteria

- MVP launched within 12 weeks
- All P0 requirements met
- No known P0/P1 bugs at launch

## 14. Future Improvements

- Shorter release cycles after MVP (bi-weekly)
- Automated regression test suite
- Feature flags for gradual rollout
- Beta program for early access feedback
- Public changelog and release notes
