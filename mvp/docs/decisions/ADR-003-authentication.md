# ADR-003: Authentication Strategy

**Status**: Accepted

**Context**: We need an authentication approach that works naturally with server-rendered HTML and doesn't require client-side token management.

**Decision**: Use session-based authentication with server-side session storage in Redis. HTTP-only cookies carry the session ID. No JWTs.

**Consequences**:
- Positive: No client-side token storage (safer against XSS)
- Positive: Session revocation is instant (delete from Redis)
- Positive: Natural fit for server-rendered HTML
- Positive: CSRF protection via double-submit cookie pattern
- Negative: Requires sticky sessions or shared session store for multi-instance (not needed for MVP)
- Negative: Higher server-side storage vs. stateless JWT

**Rationale**: For a server-rendered application where the frontend is not a separate SPA, session-based auth is simpler and more secure than JWT. JWTs would require JavaScript to manage tokens and handle refresh, adding complexity with no benefit for this architecture.
