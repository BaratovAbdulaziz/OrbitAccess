# System Architecture

## 1. Overview

SMB Access Manager follows a **monolith-first architecture** with clear internal module boundaries. The entire application runs as a single process, with background jobs handled by an in-process worker pool. This keeps deployment simple (single Docker container, single database) while maintaining the option to extract services later.

## 2. Purpose

This document describes the overall system architecture, including the technology stack, module layout, data flow, and rationale for every major architectural decision.

## 3. Functional Requirements

*Covered in `03-functional-requirements.md`.*

## 4. Non-functional Requirements

*Covered in `04-non-functional-requirements.md`.*

## 5. Technical Design

### Technology Stack

| Layer | Technology | Rationale |
|---|---|---|
| **Backend** | Python 3.12+ with FastAPI | Rapid development, excellent async support, automatic OpenAPI docs, strong typing via Pydantic |
| **Database** | PostgreSQL 16 | Mature, reliable, excellent JSON support, strong concurrency |
| **Cache / Queue** | Redis 7 | Lightweight, fast, ARQ for background job queue |
| **Frontend** | Jinja2 templates + HTMX + Alpine.js | Server-rendered HTML keeps architecture simple; HTMX provides dynamic updates without a JS framework build step; Alpine.js for rich interactions |
| **CSS** | Tailwind CSS (CDN for MVP) | Utility-first, rapid UI development |
| **Deployment** | Docker Compose on single VPS | Single host deployment; containers for app, db, redis |
| **Task Queue** | ARQ (Redis-backed) | Lightweight async job queue; native FastAPI async support |
| **ORM** | SQLAlchemy 2.0 (async) | Mature, well-documented, supports async patterns |
| **Migrations** | Alembic | Standard for SQLAlchemy projects |
| **Auth** | Session-based with httponly cookies | Simpler than JWT for server-rendered app; no token management on client |

### Module Layout

```
app/
├── main.py                    # FastAPI app creation, lifespan, middleware
├── config.py                  # Settings via pydantic-settings
├── db/
│   ├── engine.py              # Async engine, session factory
│   ├── base.py                # SQLAlchemy declarative base
│   └── models/                # SQLAlchemy model files
│       ├── organization.py
│       ├── user.py
│       ├── role.py
│       ├── employee.py
│       ├── integration.py
│       ├── provisioning_job.py
│       └── activity_log.py
├── api/
│   ├── deps.py                # Dependency injection (get_db, get_current_user, etc.)
│   ├── errors.py              # Exception handlers
│   ├── v1/
│   │   ├── router.py          # V1 router aggregation
│   │   ├── auth.py            # Login, logout, signup
│   │   ├── organizations.py   # Organization CRUD
│   │   ├── admins.py          # Admin invitations
│   │   ├── integrations.py    # OAuth flows
│   │   ├── roles.py           # Role CRUD
│   │   ├── employees.py       # Employee CRUD
│   │   └── activity_logs.py   # Activity log queries
│   └── deps.py
├── services/
│   ├── organization.py        # Org business logic
│   ├── auth.py                # Authentication logic
│   ├── role.py                # Role logic
│   ├── employee.py            # Employee lifecycle
│   ├── provisioning.py        # Provisioning orchestration
│   ├── github.py              # GitHub API client
│   ├── notion.py              # Notion API client
│   └── activity_log.py        # Logging service
├── workers/
│   ├── worker.py              # ARQ worker definition
│   └── tasks.py               # Background task functions
├── templates/                 # Jinja2 templates
├── static/                    # CSS, JS, images
└── utils/
    ├── encryption.py          # Fernet encryption for tokens
    ├── email.py               # Email sending
    └── rate_limit.py          # Rate limiting logic
```

### Architecture Diagram (Text)

```
┌──────────────┐     ┌─────────────────────────────────────────────┐
│   Browser    │────▶│              FastAPI App                     │
│  (HTMX/JS)   │     │                                             │
└──────────────┘     │  ┌─────────┐  ┌──────────┐  ┌────────────┐ │
                     │  │ API     │  │ Services │  │ Workers    │ │
                     │  │ Routes  │──│(Business │──│ (ARQ)      │ │
                     │  │ (V1)    │  │  Logic)  │  │            │ │
                     │  └─────────┘  └──────────┘  └─────┬──────┘ │
                     │                         │          │        │
                     └─────────────────────────┼──────────┼────────┘
                                               │          │
                                     ┌─────────▼──────────▼───────┐
                                     │         PostgreSQL          │
                                     │  + Redis                   │
                                     └─────────────────────────────┘
                                               │
                            ┌──────────────────┼──────────────────┐
                            ▼                  ▼                  ▼
                     ┌────────────┐    ┌──────────────┐    ┌──────────────┐
                     │  GitHub    │    │   Notion     │    │   SMTP       │
                     │  API       │    │   API        │    │   (Email)    │
                     └────────────┘    └──────────────┘    └──────────────┘
```

### Data Flow

1. **User Request**: Browser makes request → FastAPI route handler
2. **Authentication**: Middleware validates session → populates request.user
3. **Authorization**: Route checks user permissions
4. **Business Logic**: Route calls service layer
5. **Data Access**: Service calls repository (SQLAlchemy)
6. **External Actions**: Service calls integration adapters or enqueues background job
7. **Response**: Route returns JSON or renders template

### Background Job Flow

1. API route enqueues job via ARQ (Redis)
2. Worker picks up job and executes
3. Worker calls integration service (GitHub/Notion API)
4. Worker updates provisioning_job status
5. Worker updates employee status
6. Worker writes activity log entry
7. On failure: retry up to 3 times with exponential backoff

### Authentication Flow

1. User submits email + password
2. Service verifies credentials
3. Session created (server-side session store in Redis/DB)
4. Session cookie set (httponly, secure, samesite)
5. Subsequent requests validated via session middleware
6. Session expires after 24h inactivity

## 6. Data Model

*Covered in full in `06-database-design.md`.*

## 7. API Changes

*Covered in full in `07-api-design.md`.*

## 8. UI Changes

*Covered in screen-specific documents.*

## 9. Security Considerations

- Session-based auth avoids client-side token storage vulnerabilities
- Encrypted OAuth tokens at rest (Fernet AES-256)
- All external API calls made server-side; no API keys exposed to browser
- CORS configured restrictively

## 10. Error Handling

- Global exception handler returns structured JSON errors
- Service layer raises domain-specific exceptions
- Background jobs capture and store error details
- Dead letter queue after 3 failed retries

## 11. Edge Cases

- Both Redis and DB required; app health check monitors both
- If Redis is down, background jobs are not accepted; API returns 503 for provisioning endpoints
- If DB is down, entire app returns 503

## 12. Testing Strategy

- Unit tests for services with mocked repositories
- Integration tests for API routes with test database
- Worker tests with mocked external APIs

## 13. Acceptance Criteria

- System deploys with `docker compose up`
- All API endpoints functional
- Background jobs process provisioning correctly
- Activity log records all state changes

## 14. Future Improvements

- Extract provisioning worker into separate service for independent scaling
- Add message broker (RabbitMQ / NATS) for higher reliability than Redis
- Add API gateway for rate limiting, auth at edge
- Kubernetes deployment for multi-region HA
