# Performance

## 1. Overview

Defines performance targets, optimization strategies, and measurement approach for SMB Access Manager MVP.

## 2. Purpose

Ensure the system meets response time and throughput requirements under expected load conditions.

## 3. Functional Requirements

*Covered in `03-functional-requirements.md`.*

## 4. Non-functional Requirements

| Metric | Target | Measurement |
|---|---|---|
| API response time (p95) | <200ms | Synthetic monitoring |
| Provisioning time (p95) | <60s | Job duration tracking |
| Dashboard load time (p95) | <1s | Browser metrics |
| Activity log query (p95) | <500ms | Synthetic monitoring |
| Concurrent users supported | 10 simultaneous admins | Load test |
| Organizations per instance | 100 | Capacity test |

## 5. Technical Design

### Optimization Strategies

#### Database

| Strategy | Implementation | Impact |
|---|---|---|
| Indexing | All foreign keys, frequently filtered columns, covering indexes for activity log queries | Ensures sub-ms lookups |
| Connection pooling | SQLAlchemy pool (5–20 connections) | Prevents connection storms |
| Pagination | Limit/offset for all list endpoints | Bounded response size |
| JSONB for configs | Flexible schema without joins | Fewer tables, faster reads |
| Partial indexes | Unique constraints on active records only | Smaller index size |

#### Application

| Strategy | Implementation | Impact |
|---|---|---|
| Async I/O | FastAPI + asyncpg + httpx | Non-blocking during external API calls |
| Caching | Session cache (Redis); future: role cache | Reduced DB load |
| Lazy loading avoided | Eager loading of relationships via selectinload | No N+1 queries |
| Background jobs | Provisioning offloaded to ARQ | API responds immediately |
| Static files | Nginx serves /static/ with cache headers | Reduced app server load |

#### Network

| Strategy | Implementation | Impact |
|---|---|---|
| Keep-alive | HTTP connection reuse via httpx | Reduced connection overhead |
| Compression | Nginx gzip for HTML responses | Smaller payloads |
| CDN | Future: CloudFlare or similar | Edge-cached static assets |

### N+1 Query Prevention

```python
# BAD: N+1 queries
employee = await session.get(Employee, id)
for status in employee.integration_statuses:  # Each access triggers a query
    print(status.status)

# GOOD: Eager loading
stmt = (
    select(Employee)
    .options(selectinload(Employee.integration_statuses))
    .where(Employee.id == id)
)
result = await session.execute(stmt)
employee = result.scalar_one()
```

### Database Query Profiling

```python
import logging
from sqlalchemy import event

@event.listens_for(Engine, "before_cursor_execute")
def before_cursor_execute(conn, cursor, statement, parameters, context, executemany):
    conn.info["query_start"] = time.time()

@event.listens_for(Engine, "after_cursor_execute")
def after_cursor_execute(conn, cursor, statement, parameters, context, executemany):
    total = time.time() - conn.info["query_start"]
    if total > 0.1:  # Log slow queries (>100ms)
        logger.warning("Slow query", duration=total, statement=statement[:200])
```

### Load Testing

- Tool: `locust` or `k6`
- Target: 10 concurrent users, each performing typical admin workflows
- Scenarios:
  1. Login → view dashboard → view employees
  2. Add employee (creates provisioning job)
  3. View activity log with filters
  4. Offboard employee

### Caching Strategy (MVP)

| Cache | What | TTL | Invalidation |
|---|---|---|---|
| Session | User sessions | 24h from last activity | On logout |
| Integration status | Integration health | 60s | On status change |
| Role list | Roles + employee count | 30s | On role CRUD |

For MVP, aggressive caching is not required — the data set is small enough that DB queries are fast.

## 6. Data Model

Indexes defined in `06-database-design.md`.

## 7. API Changes

- Pagination parameters on all list endpoints: `page`, `per_page`
- `X-Response-Time` header on all responses for client-side measurement

## 8. UI Changes

- Skeleton loading states during data fetch
- Debounced search (300ms)
- HTMX polling interval tuned for each component (5s provisioning, 30s dashboard stats)

## 9. Security Considerations

- Rate limiting prevents abuse that could degrade performance
- Pagination prevents unbounded response sizes
- Query timeout set at database layer (10s max per query)

## 10. Error Handling

- Slow queries logged as warnings (not errors)
- Timeout errors return 504 Gateway Timeout
- Rate limit exceeded returns 429

## 11. Edge Cases

- Activity log with 100K+ entries → index on (org_id, created_at DESC) ensures fast pagination
- Employee list with search during high load → search is indexed via partial text match
- Provisioning burst (10+ employees at once) → ARQ processes concurrently; rate limits on GitHub/Notion apply

## 12. Testing Strategy

- Load test with 10 concurrent users
- Database query profiling in test suite (flag slow queries)
- Monitor provisioning job duration in CI

## 13. Acceptance Criteria

- API responses <200ms (p95) for non-provisioning endpoints
- Dashboard loads <1s
- Provisioning completes <60s
- Activity log queries <500ms with 10K entries

## 14. Future Improvements

- Read replicas for activity log queries
- Redis caching for frequently accessed data (roles, employee counts)
- Query result caching for slow aggregations
- CDN for static assets
- Database query performance monitoring via pg_stat_statements
- Connection pooling tuning based on production metrics
