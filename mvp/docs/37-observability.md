# Observability

## 1. Overview

Defines the observability strategy covering metrics, structured logging, distributed tracing, health checks, and alerting for the MVP.

## 2. Purpose

Ensure operators can understand system behavior, diagnose problems, and measure performance without requiring access to production infrastructure.

## 3. Functional Requirements

- Health check endpoint for monitoring
- Structured JSON logging for log aggregation
- Request correlation IDs for tracing
- Provisioning job metrics for visibility

## 4. Non-functional Requirements

- Health check responds <100ms
- Log volume <100MB/day at MVP scale
- Metrics overhead <1% CPU

## 5. Technical Design

### Three Pillars

| Pillar | MVP Implementation | Future Implementation |
|---|---|---|
| **Metrics** | Application-level counters in code, exposed via health endpoint | Prometheus + Grafana |
| **Logs** | Structured JSON to stdout via structlog | Loki / ELK / Datadog |
| **Tracing** | Request ID propagation in logs | OpenTelemetry / Jaeger |

### Structured Logging

Implementation via `structlog`:

```python
import structlog

logger = structlog.get_logger()

# In a service method
logger.info(
    "employee.provisioning.started",
    employee_id=str(employee.id),
    organization_id=str(employee.organization_id),
    role=role.name,
    integrations=["github", "notion"],
)

# Output:
# {"event": "employee.provisioning.started", "employee_id": "...", "timestamp": "...", "level": "info", ...}
```

Log enrichment via middleware:

```python
@app.middleware("http")
async def add_context(request: Request, call_next):
    request_id = request.headers.get("X-Request-ID", str(uuid.uuid4()))
    request.state.request_id = request_id
    with structlog.contextvars.bind_contextvars(
        request_id=request_id,
        method=request.method,
        path=request.url.path,
    ):
        response = await call_next(request)
        response.headers["X-Request-ID"] = request_id
        return response
```

### Metrics (MVP)

For the MVP, metrics are kept lightweight — no separate metrics server:

| Metric | Type | Source | Purpose |
|---|---|---|---|
| Employee count by status | Gauge | DB query | Dashboard stats |
| Provisioning duration | Timer | Job start/end time | Performance monitoring |
| Provisioning success/failure | Counter | Job completion status | Reliability monitoring |
| Integration health status | Gauge | Integration status | Integration monitoring |
| Active sessions | Gauge | Redis | Capacity monitoring |

These are exposed via the health endpoint and dashboard rather than a dedicated metrics system.

```python
# Simple in-memory metrics collector
class MetricsCollector:
    def __init__(self):
        self._counters: dict[str, int] = {}
        self._timers: dict[str, list[float]] = {}

    def increment(self, name: str):
        self._counters[name] = self._counters.get(name, 0) + 1

    def record_timing(self, name: str, duration_ms: float):
        if name not in self._timers:
            self._timers[name] = []
        self._timers[name].append(duration_ms)
        # Keep last 1000 samples
        if len(self._timers[name]) > 1000:
            self._timers[name].pop(0)

metrics = MetricsCollector()
```

### Health Check Endpoint

```json
GET /health
{
  "status": "ok",
  "version": "1.0.0",
  "uptime_seconds": 3600,
  "database": {
    "status": "ok",
    "latency_ms": 2,
    "pool_size": 5,
    "active_connections": 2
  },
  "redis": {
    "status": "ok",
    "latency_ms": 1,
    "used_memory_mb": 12
  },
  "integrations": {
    "github": "active",
    "notion": "active"
  },
  "queue": {
    "queued_jobs": 0,
    "running_jobs": 1,
    "failed_jobs_24h": 0
  }
}
```

### Alerting (MVP)

| Condition | Detection | Notification | Severity |
|---|---|---|---|
| Health check fails 3+ consecutive checks | UptimeRobot (5-min intervals) | Email to ops | Critical |
| Provisioning failure rate > 20% (24h) | Dashboard query | In-app warning banner | Warning |
| Integration in error state | Integration status check | In-app warning on dashboard | Warning |
| SSL certificate expires < 14 days | Certbot auto-renewal | Email from certbot | Warning |
| Disk usage > 85% | Cron check | Email to ops | Warning |

### Dashboard for Operators

For MVP, operational visibility comes from:

1. **Docker logs**: `docker compose logs -f app` — real-time log tailing
2. **Health endpoint**: `curl https://app.orbitaccess.com/health` — quick status check
3. **In-app admin dashboard**: Provisioning status, integration health
4. **UptimeRobot**: External uptime monitoring with email alerts

### Request Lifecycle Tracing

Every request carries an `X-Request-ID` header (generated server-side if not provided by client):

```
Browser                          FastAPI                          PostgreSQL/Redis/GitHub/Notion
  │                                │                                │
  │  GET /api/v1/employees         │                                │
  │  X-Request-ID: abc-123        │                                │
  │──────────────────────────────▶│                                │
  │                                │  SELECT employees (request ID  │
  │                                │  propagated to log context)    │
  │                                │──────────────────────────────▶│
  │                                │◀──────────────────────────────│
  │◀──────────────────────────────│                                │
  │  X-Request-ID: abc-123        │                                │
```

## 6. Data Model

No changes — observability data is stored in logs (stdout) and in-memory metrics, not in the database.

## 7. API Changes

- GET /health — health check endpoint

## 8. UI Changes

- Integration health indicators in dashboard
- Provisioning status badges with timing

## 9. Security Considerations

- Health endpoint does not expose internal network details, secrets, or user data
- Logs never contain passwords, tokens, or PII beyond email addresses (acceptable for MVP)
- In-memory metrics are not persisted — lost on restart

## 10. Error Handling

- Logging failure must not crash the application (fire-and-forget)
- Health check returns degraded status (not 500) if one dependency is down
- Metrics collection is best-effort — failures silently ignored

## 11. Edge Cases

- High log volume during provisioning burst → structured JSON is parseable at any volume
- Health endpoint under load → responds immediately with cached status
- All dependencies down → health check returns status: "down" with details
- Clock drift → all timestamps use UTC from server clock; activity log uses DB now()

## 12. Testing Strategy

- Test health endpoint with all dependencies healthy
- Test health endpoint with database down (expected: degraded)
- Test log output format is valid JSON
- Test request ID propagation

## 13. Acceptance Criteria

- Health endpoint functional and monitored
- All logs are structured JSON with required fields
- Request ID present in all responses and logs
- Provisioning duration and success/failure tracked
- Integration health visible in admin dashboard

## 14. Future Improvements

- Prometheus metrics endpoint for scraping
- Grafana dashboards for key metrics
- Structured error tracking (Sentry)
- Centralized log aggregation (Loki / ELK)
- Distributed tracing (OpenTelemetry)
- SLO monitoring and burn-rate alerts
- Anomaly detection on provisioning metrics
- Synthetic monitoring for critical user flows
