# Non-functional Requirements

## 1. Overview

This document defines the non-functional requirements (quality attributes) for the SMB Access Manager MVP. These requirements constrain how the system is built and how it behaves under various conditions.

## 2. Purpose

Non-functional requirements guide architectural decisions, technology choices, and operational practices. They are as important as functional requirements for production readiness.

## 3. Functional Requirements

N/A — this document is about non-functional attributes.

## 4. Non-functional Requirements

### Performance

| ID | Requirement | Target | Priority |
|---|---|---|---|
| NF-PERF-01 | Provisioning operations shall complete within 60 seconds | ≤60s p95 | P0 |
| NF-PERF-02 | API response time (excluding provisioning) shall be under 200ms | ≤200ms p95 | P0 |
| NF-PERF-03 | Page load time for dashboard shall be under 1 second | ≤1s p95 | P1 |
| NF-PERF-04 | Activity log queries (paginated) shall return in under 500ms | ≤500ms p95 | P1 |

### Availability

| ID | Requirement | Target | Priority |
|---|---|---|---|
| NF-AVAIL-01 | System shall achieve 99.5% uptime during business hours (8am–8pm local) | 99.5% | P0 |
| NF-AVAIL-02 | Planned maintenance window shall be announced 48 hours in advance | — | P1 |

### Scalability

| ID | Requirement | Target | Priority |
|---|---|---|---|
| NF-SCAL-01 | System shall support up to 100 organizations per single instance | 100 | P0 |
| NF-SCAL-02 | System shall support up to 100 employees per organization | 100 | P0 |
| NF-SCAL-03 | System shall handle 10 concurrent provisioning jobs without degradation | 10 | P1 |

### Security

| ID | Requirement | Target | Priority |
|---|---|---|---|
| NF-SEC-01 | All API traffic shall be encrypted via TLS 1.2+ | Enforced | P0 |
| NF-SEC-02 | OAuth tokens shall be encrypted at rest using AES-256 | Enforced | P0 |
| NF-SEC-03 | Passwords shall be hashed using bcrypt (cost factor ≥12) | Enforced | P0 |
| NF-SEC-04 | Session cookies shall have HttpOnly, Secure, SameSite=Strict flags | Enforced | P0 |
| NF-SEC-05 | Rate limiting shall be applied to authentication endpoints (10 req/min/IP) | Enforced | P0 |

### Data Integrity

| ID | Requirement | Target | Priority |
|---|---|---|---|
| NF-DATA-01 | Activity log shall be append-only; no deletion or modification allowed | Enforced | P0 |
| NF-DATA-02 | Database backups shall be taken daily | Automated | P1 |
| NF-DATA-03 | Soft-delete shall be used for all customer-facing entities | Enforced | P0 |

### Maintainability

| ID | Requirement | Target | Priority |
|---|---|---|---|
| NF-MAINT-01 | Codebase shall follow a consistent module structure (controller → service → repository) | Enforced | P0 |
| NF-MAINT-02 | All external service integrations shall be behind an abstract interface | Enforced | P0 |
| NF-MAINT-03 | Test coverage shall be ≥80% for business logic | ≥80% | P0 |
| NF-MAINT-04 | Documentation shall be updated within the same PR as code changes | Policy | P1 |

### Reliability

| ID | Requirement | Target | Priority |
|---|---|---|---|
| NF-REL-01 | Provisioning jobs shall retry up to 3 times on failure | 3 retries | P0 |
| NF-REL-02 | System shall gracefully handle third-party API outages without data loss | Graceful | P0 |
| NF-REL-03 | Database connection pooling shall prevent connection exhaustion | Pooled | P1 |

### Observability

| ID | Requirement | Target | Priority |
|---|---|---|---|
| NF-OBS-01 | Application logs shall be structured JSON | Structured | P1 |
| NF-OBS-02 | Failed provisioning jobs shall trigger an in-app notification | Notify | P0 |
| NF-OBS-03 | Integration health status shall be visible in the dashboard | Visible | P0 |

## 5. Technical Design

- FastAPI with async workers for handling concurrent provisioning
- PostgreSQL with connection pooling via PgBouncer or built-in pool
- Background tasks processed via ARQ (Redis-backed job queue)
- Structured logging with structlog
- Prometheus metrics endpoint for monitoring (future)

## 6. Data Model

N/A

## 7. API Changes

- Rate limit headers included in all API responses (X-RateLimit-*)
- Error responses include correlation IDs for debugging

## 8. UI Changes

- Loading states for all async operations
- Error banners for integration health issues
- Progress indicators for long-running provisioning

## 9. Security Considerations

- Rate limiting prevents brute-force attacks on login
- TLS enforcement prevents man-in-the-middle attacks
- Append-only logs provide tamper-evident audit trail

## 10. Error Handling

- Circuit breaker pattern for third-party API calls
- Graceful degradation: if Notion is down, GitHub provisioning still works
- Correlation IDs in all error responses for debugging

## 11. Edge Cases

- Redis goes down → background jobs are lost; system should queue jobs in PostgreSQL as fallback
- Database connection lost → API returns 503; health check endpoint monitors DB connectivity
- Third-party API rate limits hit → back off and retry with exponential backoff

## 12. Testing Strategy

- Load test provisioning endpoints with 10 concurrent requests
- Test behavior under database connection loss
- Test rate limiting enforcement

## 13. Acceptance Criteria

- API responds within 200ms for all non-provisioning endpoints under normal load
- Provisioning completes within 60 seconds for a single employee with GitHub + Notion
- 99.5% uptime over a 30-day observation period

## 14. Future Improvements

- Horizontal scaling with multiple application instances
- Read replicas for activity log queries
- CDN for static assets
- Auto-scaling based on queue depth
