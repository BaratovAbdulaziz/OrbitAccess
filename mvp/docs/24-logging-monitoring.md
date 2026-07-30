# Logging and Monitoring

## 1. Overview

Defines the logging strategy and monitoring approach for SMB Access Manager MVP. Covers application logging, audit logging, health monitoring, and alerting.

## 2. Purpose

Ensure the system is observable in production. Operators can diagnose issues, track down errors, and understand system behavior.

## 3. Functional Requirements

- Structured application logging
- Request correlation IDs
- Health check endpoint
- Integration health status visible in dashboard

## 4. Non-functional Requirements

- Logs stored for 30 days (or rotated)
- Health check responds <100ms
- Log volume <100MB/day for MVP scale

## 5. Technical Design

### Logging Strategy

| Aspect | Decision |
|---|---|
| Library | `structlog` (structured logging) |
| Format | JSON (production), colored console (development) |
| Level | INFO (production), DEBUG (development) |
| Output | stdout (Docker logs) |
| Correlation | Request ID in every log entry |

### Log Entry Structure

```json
{
  "timestamp": "2025-06-10T10:00:00.123456Z",
  "level": "INFO",
  "logger": "app.services.employee",
  "request_id": "abc-123-def",
  "organization_id": "org-uuid",
  "user_id": "user-uuid",
  "message": "Employee created",
  "extra": {
    "employee_id": "emp-uuid",
    "role_id": "role-uuid"
  }
}
```

### Log Categories

| Category | Events | Level |
|---|---|---|
| Request lifecycle | Incoming request, response status, duration | INFO |
| Authentication | Login, logout, failed login, account lockout | INFO/WARNING |
| CRUD operations | Employee/role/integration created, updated, deleted | INFO |
| Provisioning | Job queued, started, completed, failed | INFO/ERROR |
| Integration API | Outgoing API calls to GitHub/Notion | DEBUG |
| Security | CSRF failures, rate limit exceeded, invalid sessions | WARNING |
| System | Startup, shutdown, DB connection, migration | INFO |

### Request ID Middleware

```python
@app.middleware("http")
async def add_request_id(request: Request, call_next):
    request_id = request.headers.get("X-Request-ID", str(uuid.uuid4()))
    request.state.request_id = request_id
    with structlog.contextvars.bind_contextvars(request_id=request_id):
        response = await call_next(request)
        response.headers["X-Request-ID"] = request_id
        return response
```

### Health Check

```python
@app.get("/health")
async def health_check():
    db_ok = await check_db_connection()
    redis_ok = await check_redis_connection()
    status_code = 200 if (db_ok and redis_ok) else 503
    return JSONResponse(
        status_code=status_code,
        content={
            "status": "ok" if status_code == 200 else "degraded",
            "database": "ok" if db_ok else "error",
            "redis": "ok" if redis_ok else "error",
            "timestamp": datetime.now(timezone.utc).isoformat(),
        },
    )
```

### Monitoring (MVP)

| Tool | Purpose | Cost |
|---|---|---|
| Docker logs | Application log access | Free |
| Docker restart policy | Basic process monitoring | Free |
| UptimeRobot | External uptime monitoring (5-min intervals) | Free |
| Health check endpoint | Internal health monitoring | Built-in |

### Alerting (MVP)

| Condition | Action |
|---|---|
| Health check fails for 5+ minutes | Email to admin |
| Provisioning failure rate > 10% (per hour) | Dashboard warning |
| Integration enters error state | Dashboard warning |

For MVP, alerts are visual in-dashboard rather than active notifications. Email alerting via UptimeRobot for downtime.

### Activity Log vs Application Log

| Aspect | Activity Log | Application Log |
|---|---|---|
| Purpose | Audit trail for admins | Debugging for operators |
| Storage | Database (activity_logs table) | stdout (Docker logs) |
| Retention | Indefinite | 30 days log rotation |
| Access | In-app activity log screen | `docker compose logs` |
| Immutable | Yes (append-only DB table) | No (rotated) |

## 6. Data Model

No changes. Activity log table already defined.

## 7. API Changes

- GET /health — health check endpoint

## 8. UI Changes

- Integration health status visible in dashboard
- Provisioning failure warnings

## 9. Security Considerations

- Logs never contain passwords, tokens, or secrets
- Request ID does not encode any user information
- Health check endpoint does not expose internal state details

## 10. Error Handling

- Logging failures should not crash the application (fire-and-forget)
- If `structlog` initialization fails, fall back to `print()` for critical startup errors

## 11. Edge Cases

- Log volume spike during provisioning burst → structured JSON keeps parsing efficient
- Health check fails while app still serving → degraded status allows graceful handling
- Multiple instances logging to stdout → Docker Compose aggregates by service name

## 12. Testing Strategy

- Test health check endpoint returns correct status
- Test request ID is set on all responses
- Test that sensitive data is not logged

## 13. Acceptance Criteria

- Health check endpoint functional
- All log entries are JSON with required fields
- Request ID present in all responses and logs
- Integration health visible in dashboard

## 14. Future Improvements

- Centralized logging (Loki, ELK, or Datadog)
- Structured error tracking (Sentry)
- Grafana dashboards for key metrics
- Prometheus metrics endpoint
- Log retention policies with S3 archiving
- Anomaly detection on provisioning errors
