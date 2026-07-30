# ADR-002: Technology Stack

**Status**: Accepted

**Context**: We need to select a technology stack that enables rapid MVP development while supporting future growth.

**Decision**: Use Python (FastAPI) for the backend, PostgreSQL for the database, Redis for caching/queues, and server-rendered HTML with HTMX + Alpine.js for the frontend.

**Consequences**:
- Positive: FastAPI provides native async, automatic OpenAPI docs, and Pydantic validation
- Positive: Server-rendered HTML eliminates SPA build complexity and separate frontend deployment
- Positive: Python ecosystem is familiar and has mature libraries for all required functionality
- Negative: HTMX has a ceiling for complex UI interactions (acceptable for MVP)
- Negative: Single-language stack means we can't leverage specialized frontend ecosystems

**Rationale**: Python + FastAPI maximizes development speed for a team focused on backend logic. Server-rendered HTML avoids the overhead of maintaining a separate frontend application. PostgreSQL and Redis are industry standards with excellent Python support.
