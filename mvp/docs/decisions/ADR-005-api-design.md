# ADR-005: API Design

**Status**: Accepted

**Context**: We need a consistent API design that supports both JSON API responses and server-rendered HTML pages from the same backend.

**Decision**: RESTful API under `/api/v1/` for data operations, with the same FastAPI instance serving Jinja2 templates for page rendering. JSON is the primary response format for API endpoints.

**Consequences**:
- Positive: Single backend serves both API and UI needs
- Positive: HTMX can call API endpoints directly for dynamic updates
- Positive: OpenAPI docs generated automatically for API endpoints
- Negative: API and UI concerns are in the same codebase (acceptable for MVP)
- Negative: Endpoints must handle both JSON and HTML responses or be clearly separated

**Rationale**: FastAPI can serve both JSON responses and HTML templates from the same application. This avoids the complexity of a separate BFF (Backend for Frontend) while the MVP is small. API routes are clearly namespaced under `/api/v1/` to distinguish them from page routes.
