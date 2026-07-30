# Testing Strategy

## 1. Overview

The testing strategy follows the Test Pyramid with an emphasis on unit tests for business logic, integration tests for API endpoints, and end-to-end tests for critical user flows.

## 2. Purpose

Ensure the MVP is reliable, regression-safe, and deployable with confidence.

## 3. Functional Requirements

*Covered in `03-functional-requirements.md`.* Each requirement maps to at least one test.

## 4. Non-functional Requirements

- Business logic test coverage ≥80%
- All P0 endpoints have integration tests
- Critical flows have E2E tests

## 5. Technical Design

### Test Pyramid

```
        ╱╲
       ╱  ╲         E2E Tests (5–10)
      ╱    ╲        Critical user flows
     ╱──────╲
    ╱        ╲      Integration Tests (30–50)
   ╱          ╲     API endpoints, database, auth
  ╱────────────╲
 ╱              ╲   Unit Tests (100+)
╱                ╲  Services, models, utils
```

### Test Tools

| Layer | Tool | Rationale |
|---|---|---|
| Unit tests | pytest | Standard Python test framework |
| Integration tests | pytest + httpx.AsyncClient | FastAPI test client |
| Database tests | pytest + test database (PostgreSQL) | Alembic migrations applied |
| Mocking | pytest-mock / unittest.mock | Mock external APIs |
| E2E tests | Playwright (Python) | Browser automation |
| Coverage | pytest-cov | Coverage reporting |
| Fixtures | pytest fixtures | Reusable test setup |

### Test Structure

```
tests/
├── conftest.py              # Global fixtures (app, db session, client)
├── factories.py             # Test data factories (using Factory Boy)
├── unit/
│   ├── test_auth.py         # Password hashing, session logic
│   ├── test_encryption.py   # Fernet encrypt/decrypt
│   ├── test_roles.py        # Role logic
│   └── test_employees.py    # Employee status transitions
├── integration/
│   ├── test_api_auth.py     # Auth endpoints
│   ├── test_api_orgs.py     # Organization endpoints
│   ├── test_api_employees.py# Employee endpoints
│   ├── test_api_roles.py    # Role endpoints
│   ├── test_api_integrations.py
│   ├── test_api_activity_logs.py
│   └── test_provisioning.py # Provisioning job processing
├── e2e/
│   ├── test_onboarding_flow.py
│   └── test_offboarding_flow.py
└── mocks/
    ├── github_api.py        # Mock GitHub API responses
    └── notion_api.py        # Mock Notion API responses
```

### Unit Tests

| Test Area | What to Test |
|---|---|
| Auth | Password hashing, session creation/validation, account lockout logic |
| Encryption | Fernet encrypt/decrypt round-trip, invalid key handling |
| Roles | Role CRUD, employee count, deletion protection |
| Employees | Status transitions, role assignment, validation |
| Provisioning | Job creation, retry logic, status transitions |
| Activity Log | Entry creation, append-only enforcement |

### Integration Tests

| Test Area | What to Test |
|---|---|
| Auth endpoints | Signup, login, logout, accept invitation, password reset |
| Organization endpoints | CRUD, authorization (owner only for delete) |
| Employee endpoints | CRUD, offboarding, status changes |
| Role endpoints | CRUD, deletion protection |
| Integration endpoints | OAuth URL generation, callback handling, disconnect |
| Activity log endpoints | List, filter, pagination |
| Authorization | Admin accessing owner endpoints → 403 |
| Cross-org isolation | Org A admin cannot access Org B data |

### End-to-End Tests

| Flow | Steps |
|---|---|
| Complete Onboarding | Login → connect GitHub → create role → add employee → verify provisioning |
| Complete Offboarding | Login → offboard employee → verify deprovisioning |
| Full Lifecycle | Add employee → provision → change role → re-provision → offboard |

E2E tests use a test GitHub Organization and test Notion workspace, or mock at the HTTP level with Playwright route interception.

### Test Fixtures

```python
# conftest.py
@pytest.fixture
async def db_session():
    # Create test database, run migrations, yield session, drop database

@pytest.fixture
async def client(db_session):
    # FastAPI test client with authenticated session

@pytest.fixture
async def org(db_session):
    # Create test organization

@pytest.fixture
async def owner(db_session, org):
    # Create owner user

@pytest.fixture
async def admin(db_session, org):
    # Create admin user

@pytest.fixture
async def role(db_session, org):
    # Create test role with GitHub and Notion config
```

### CI/CD Integration

```
GitHub Actions:
  - Run unit + integration tests on every PR
  - Run E2E tests on merge to main
  - Enforce coverage threshold (≥80%)
  - Security scan (dependency audit)
```

## 6. Data Model

Tests use a separate test database with the same schema (via Alembic migrations).

## 7. API Changes

No API changes — tests validate the API contract.

## 8. UI Changes

No UI changes — E2E tests validate UI behavior.

## 9. Security Considerations

- Test database credentials are separate from production
- E2E tests use test GitHub/Notion accounts, not real ones
- No production data used in tests

## 10. Error Handling

- Test that error responses match the documented format
- Test edge case error scenarios (invalid data, missing fields, expired tokens)

## 11. Edge Cases

Test the following edge cases:
- Empty organization (no employees, no integrations)
- Employee with no role assigned
- Re-adding an offboarded employee
- Concurrent provisioning requests
- Expired session accessing protected endpoint
- Invalid OAuth callback state parameter
- Rate limit exceeded

## 12. Testing Strategy

This document is the testing strategy.

## 13. Acceptance Criteria

- All P0 functional requirements have passing tests
- Code coverage ≥80% for business logic
- E2E onboarding and offboarding flows pass
- Tests run in CI on every PR

## 14. Future Improvements

- Property-based testing (Hypothesis) for complex logic
- Performance/load testing (k6 or Locust)
- Fuzz testing for input validation
- Visual regression testing for UI
- API contract testing (Pact)
- Chaos engineering for resilience testing
