# Project Structure

## 1. Overview

Defines the directory layout and file naming conventions for the SMB Access Manager codebase.

## 2. Purpose

Establish a consistent project structure so every developer knows where to find and place code.

## 3. Functional Requirements

*Covered in `03-functional-requirements.md`.*

## 4. Non-functional Requirements

- Predictable module layout
- Clear separation of concerns (API → Service → Repository)

## 5. Technical Design

### Root Layout

```
/
├── app/
│   ├── __init__.py
│   ├── main.py                 # FastAPI app factory, lifespan, middleware registration
│   ├── config.py               # pydantic-settings configuration
│   ├── db/
│   │   ├── __init__.py
│   │   ├── engine.py           # AsyncEngine, AsyncSession factory
│   │   ├── base.py             # DeclarativeBase
│   │   └── models/
│   │       ├── __init__.py
│   │       ├── organization.py
│   │       ├── user.py
│   │       ├── role.py
│   │       ├── employee.py
│   │       ├── integration.py
│   │       ├── employee_integration_status.py
│   │       ├── provisioning_job.py
│   │       └── activity_log.py
│   ├── api/
│   │   ├── __init__.py
│   │   ├── deps.py             # FastAPI dependencies (get_db, current_user, etc.)
│   │   ├── errors.py           # Exception handlers, error responses
│   │   ├── v1/
│   │   │   ├── __init__.py
│   │   │   ├── router.py       # Aggregates all v1 routers
│   │   │   ├── auth.py
│   │   │   ├── organizations.py
│   │   │   ├── admins.py
│   │   │   ├── integrations.py
│   │   │   ├── roles.py
│   │   │   ├── employees.py
│   │   │   └── activity_logs.py
│   │   └── deps.py
│   ├── services/
│   │   ├── __init__.py
│   │   ├── auth.py
│   │   ├── organization.py
│   │   ├── admin.py
│   │   ├── role.py
│   │   ├── employee.py
│   │   ├── provisioning.py
│   │   ├── github.py
│   │   ├── notion.py
│   │   └── activity_log.py
│   ├── workers/
│   │   ├── __init__.py
│   │   ├── worker.py           # ARQ worker creation
│   │   └── tasks.py            # Background task functions
│   ├── templates/
│   │   ├── base.html           # Base layout template
│   │   ├── dashboard.html
│   │   ├── employees/
│   │   │   ├── list.html
│   │   │   ├── detail.html
│   │   │   └── form.html
│   │   ├── roles/
│   │   │   ├── list.html
│   │   │   ├── detail.html
│   │   │   └── form.html
│   │   ├── integrations/
│   │   │   └── index.html
│   │   ├── activity_logs/
│   │   │   └── index.html
│   │   ├── auth/
│   │   │   ├── login.html
│   │   │   ├── signup.html
│   │   │   ├── accept-invitation.html
│   │   │   ├── forgot-password.html
│   │   │   └── reset-password.html
│   │   └── components/         # Reusable template fragments
│   │       ├── navbar.html
│   │       ├── stats_cards.html
│   │       ├── status_badge.html
│   │       ├── employee_row.html
│   │       └── pagination.html
│   ├── static/
│   │   ├── css/
│   │   │   └── output.css      # Tailwind CSS output
│   │   └── js/
│   │       └── app.js          # Alpine.js components and HTMX config
│   └── utils/
│       ├── __init__.py
│       ├── encryption.py       # Fernet encrypt/decrypt
│       ├── email.py            # Email sending
│       └── rate_limit.py       # Rate limiting logic
├── tests/
│   ├── __init__.py
│   ├── conftest.py             # Global fixtures
│   ├── factories.py            # Test data factories
│   ├── unit/
│   │   ├── test_auth.py
│   │   ├── test_encryption.py
│   │   ├── test_roles.py
│   │   └── test_employees.py
│   ├── integration/
│   │   ├── test_api_auth.py
│   │   ├── test_api_orgs.py
│   │   ├── test_api_employees.py
│   │   ├── test_api_roles.py
│   │   ├── test_api_integrations.py
│   │   ├── test_api_activity_logs.py
│   │   └── test_provisioning.py
│   ├── e2e/
│   │   ├── test_onboarding_flow.py
│   │   └── test_offboarding_flow.py
│   └── mocks/
│       ├── github_api.py
│       └── notion_api.py
├── migrations/
│   ├── env.py
│   ├── alembic.ini
│   └── versions/               # Migration files
├── scripts/
│   ├── seed.py                 # Development seed data
│   └── backup.sh               # Database backup script
├── docker/
│   ├── Dockerfile
│   └── nginx.conf
├── docker-compose.yml
├── requirements.txt
├── requirements-dev.txt
├── pyproject.toml
├── .env.example
├── .gitignore
└── README.md
```

### File Naming Conventions

| Type | Convention | Example |
|---|---|---|
| Python files | snake_case | `activity_log.py` |
| HTML templates | kebab-case | `reset-password.html` |
| Test files | `test_<name>.py` | `test_api_auth.py` |
| Migration files | `<revision>_<description>.py` | `a1b2c3d4_add_employee_table.py` |

### Module Responsibilities

| Module | Responsibility |
|---|---|
| `api/v1/*.py` | Route definitions, request parsing, response formatting, auth/authorization enforcement |
| `services/*.py` | Business logic, orchestration, external API calls |
| `db/models/*.py` | SQLAlchemy model definitions, table metadata |
| `workers/*.py` | Background job processing (provisioning/deprovisioning) |
| `utils/*.py` | Cross-cutting utilities (encryption, email, rate limiting) |

## 6. Data Model

No changes.

## 7. API Changes

No changes.

## 8. UI Changes

No changes.

## 9. Security Considerations

- Template directory outside app root prevents path traversal
- Static files served via Nginx, not FastAPI (in production)

## 10. Error Handling

No changes.

## 11. Edge Cases

- Migration files must be ordered by revision ID (timestamp-based)
- Circular imports between services prevented by service → repository → model dependency direction

## 12. Testing Strategy

- Test files mirror `app/` structure under `tests/`
- `conftest.py` at root level for global fixtures
- Factory Boy for test data generation

## 13. Acceptance Criteria

- All files follow the defined structure
- `from app.main import create_app` works
- `pytest` discovers all tests
- No circular imports

## 14. Future Improvements

- `src/` layout for clearer import management (when project grows)
- Domain-driven modules instead of technical layers (when complexity justifies it)
- Monorepo structure with packages (if services are extracted)
