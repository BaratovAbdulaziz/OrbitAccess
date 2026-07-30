# ADR-007: Deployment Strategy

**Status**: Accepted

**Context**: We need a simple, cost-effective deployment strategy for the MVP that can be operated by a single developer.

**Decision**: Deploy as a Docker Compose stack on a single VPS. Nginx as a reverse proxy for TLS termination. PostgreSQL and Redis as sibling containers. GitHub Actions for CI/CD.

**Consequences**:
- Positive: Simple deployment — single `docker compose up` command
- Positive: Low cost — $10–$20/month VPS
- Positive: Reproducible environment across dev/staging/prod
- Positive: Easy to migrate to larger infrastructure later (same Docker images)
- Negative: No high availability or zero-downtime deployments (acceptable for MVP)
- Negative: Single point of failure (VPS goes down → app goes down)
- Negative: Manual scaling when load exceeds capacity

**Rationale**: For an MVP targeting 5–100 employee organizations with modest traffic, a single VPS with Docker Compose provides the best balance of simplicity, cost, and reliability. The Docker-based approach ensures the application can be migrated to Kubernetes or a container orchestration platform without code changes when scaling becomes necessary.
