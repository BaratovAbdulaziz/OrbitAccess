# ADR-004: Database Choice

**Status**: Accepted

**Context**: We need a relational database with JSON support, strong consistency, and good async Python support.

**Decision**: Use PostgreSQL 16 with SQLAlchemy 2.0 (async) and Alembic for migrations.

**Consequences**:
- Positive: JSONB columns for flexible integration configuration
- Positive: Partial unique indexes for soft-delete pattern (`WHERE is_active = true`)
- Positive: Mature async support via asyncpg driver
- Positive: Rich index types (GIN for JSONB, partial indexes)
- Negative: More complex to operate than SQLite (acceptable for production)
- Negative: JSONB queries less performant than normalized tables for structured data

**Rationale**: PostgreSQL is the most capable open-source relational database. JSONB support is critical for storing integration-specific configuration without schema changes for each new integration type. Partial unique indexes enable clean soft-delete with unique constraint enforcement on active records only.
