# Technology Stack

## 1. Overview

Defines the full technology stack for SMB Access Manager MVP, including language, frameworks, libraries, infrastructure, and tooling.

## 2. Purpose

Establish a single source of truth for technology choices so all developers use the same tools and versions.

## 3. Functional Requirements

*Covered in `03-functional-requirements.md`.*

## 4. Non-functional Requirements

*Covered in `04-non-functional-requirements.md`.*

## 5. Technical Design

### Stack Summary

| Layer | Technology | Version | Purpose |
|---|---|---|---|
| **Runtime** | Python | 3.12+ | Application language |
| **Web Framework** | FastAPI | 0.110+ | REST API + server-rendered HTML |
| **ASGI Server** | Uvicorn | 0.29+ | Production ASGI server |
| **ORM** | SQLAlchemy | 2.0+ (async) | Database access |
| **Migrations** | Alembic | 1.13+ | Schema migrations |
| **Validation** | Pydantic | 2.6+ | Request/response validation |
| **Settings** | pydantic-settings | — | Environment config management |
| **Database** | PostgreSQL | 16 | Primary data store |
| **Cache/Queue** | Redis | 7 | Session store, job queue |
| **Job Queue** | ARQ | 0.26+ | Background task processing |
| **Templating** | Jinja2 | 3.1+ | Server-side HTML rendering |
| **Frontend** | HTMX | 1.9+ | Dynamic HTML interactions |
| **Frontend** | Alpine.js | 3.13+ | Rich client-side interactions |
| **CSS** | Tailwind CSS | 3.4+ (CDN) | Utility-first styling |
| **Auth** | bcrypt | 4.1+ | Password hashing |
| **Encryption** | cryptography (Fernet) | 42+ | OAuth token encryption |
| **HTTP Client** | httpx | 0.27+ | External API calls (GitHub, Notion) |
| **Email** | email-validator + smtplib | — | Email validation and sending |
| **Testing** | pytest | 8+ | Test framework |
| **Test Client** | httpx (AsyncClient) | — | API test client |
| **Mocking** | pytest-mock | — | External API mocking |
| **Coverage** | pytest-cov | — | Test coverage |
| **E2E** | Playwright | 1.44+ | Browser automation tests |
| **Container** | Docker | 24+ | Application packaging |
| **Orchestration** | Docker Compose | 2.24+ | Local dev & prod deployment |
| **Proxy** | Nginx | 1.24+ | TLS termination, static files |
| **CI/CD** | GitHub Actions | — | Automated testing & deployment |

### Library Justification

| Library | Why not alternative |
|---|---|
| **FastAPI over Flask** | Native async, automatic OpenAPI docs, Pydantic integration, type safety |
| **SQLAlchemy over Django ORM** | Already using FastAPI (not Django); SQLAlchemy is the standard async ORM for Python |
| **ARQ over Celery** | Native async, Redis-only (simpler), lighter weight; Celery is overkill for MVP |
| **HTMX over React/Vue** | Server-rendered means no SPA complexity; HTMX provides dynamic updates with zero JS build step |
| **Tailwind over custom CSS** | Utility-first speeds up development; consistent design without writing custom CSS |
| **httpx over requests** | Native async support for use in FastAPI async endpoints |
| **cryptography over pycrypto** | Actively maintained, Fernet provides simple authenticated encryption |
| **PostgreSQL over MySQL** | Better JSONB, partial unique indexes, mature async support |

### Development Environment

- **OS**: macOS / Linux / WSL2
- **Editor**: Any (no IDE lock-in)
- **Python Version Manager**: pyenv or uv
- **Package Manager**: pip + requirements.txt (or uv for speed)
- **Linter**: ruff
- **Formatter**: ruff format
- **Type Checker**: mypy (optional for MVP, recommended)
- **Pre-commit**: pre-commit hooks for linting + formatting

## 6. Data Model

No changes — stack is agnostic to data model.

## 7. API Changes

No changes — stack supports the API design.

## 8. UI Changes

No changes — stack supports UI requirements.

## 9. Security Considerations

- `cryptography` library is FIPS-140-2 validated (via OpenSSL)
- bcrypt with cost 12 resists brute-force
- httpx validates TLS certificates by default

## 10. Error Handling

- FastAPI provides built-in validation error handling
- httpx raises exceptions for HTTP errors (wrapped by service layer)

## 11. Edge Cases

- Python 3.12 required (f-string improvements, type parameter syntax)
- PostgreSQL 16 required for partial unique index support
- Redis 7 required for ARQ compatibility

## 12. Testing Strategy

- Test with same database engine (PostgreSQL in test container)
- Use pytest-asyncio for async test support
- Mock external APIs with pytest-mock + respx

## 13. Acceptance Criteria

- `pip install -r requirements.txt` installs all dependencies
- `docker compose up` starts all services
- `pytest` discovers and runs all tests
- Pre-commit hooks pass on every commit

## 14. Future Improvements

- uv / rye for faster dependency management
- Ruff replaces all linting/formatting tools
- Mypy strict mode for type safety
- Sentry for error tracking
- Prometheus + Grafana for monitoring
