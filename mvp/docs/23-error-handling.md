# Error Handling

## 1. Overview

Defines the error handling strategy for SMB Access Manager, including error types, response format, exception hierarchy, and handling patterns.

## 2. Purpose

Ensure consistent, predictable error responses across all API endpoints and background jobs.

## 3. Functional Requirements

- All API errors return structured JSON
- Background job failures are captured and stored
- Validation errors include field-level detail
- Unexpected errors are logged with correlation IDs

## 4. Non-functional Requirements

- Error responses <100ms overhead
- No sensitive information leaked in error messages
- Correlation IDs for all error responses

## 5. Technical Design

### Error Response Format

All API errors follow this structure:

```json
{
  "error": {
    "code": "VALIDATION_ERROR",
    "message": "Human-readable description",
    "details": {}
  },
  "request_id": "uuid"
}
```

### Exception Hierarchy

```
Exception
├── AppException (base)
│   ├── NotFoundException
│   ├── ConflictException
│   ├── UnauthorizedException
│   ├── ForbiddenException
│   ├── ValidationException
│   ├── RateLimitException
│   └── IntegrationException
│       ├── GitHubException
│       └── NotionException
└── (standard Python exceptions)
```

### Error Code Mapping

| Exception | HTTP Status | Error Code |
|---|---|---|
| `ValidationException` | 422 | `VALIDATION_ERROR` |
| `NotFoundException` | 404 | `NOT_FOUND` |
| `ConflictException` | 409 | `CONFLICT` |
| `UnauthorizedException` | 401 | `UNAUTHORIZED` |
| `ForbiddenException` | 403 | `FORBIDDEN` |
| `RateLimitException` | 429 | `RATE_LIMITED` |
| `IntegrationException` | 502 | `INTEGRATION_ERROR` |
| `ProvisioningInProgress` | 409 | `PROVISIONING_IN_PROGRESS` |
| `InvalidStateException` | 400 | `INVALID_STATE` |
| Unexpected exception | 500 | `INTERNAL_ERROR` |

### Exception Handler Registration

```python
# app/api/errors.py

@app.exception_handler(AppException)
async def app_exception_handler(request, exc):
    return JSONResponse(
        status_code=exc.status_code,
        content={
            "error": {
                "code": exc.code,
                "message": exc.message,
                "details": exc.details or {},
            },
            "request_id": str(request.state.request_id),
        },
    )

@app.exception_handler(Exception)
async def unhandled_exception_handler(request, exc):
    logger.error("Unhandled exception", exc_info=exc, request_id=request.state.request_id)
    return JSONResponse(
        status_code=500,
        content={
            "error": {
                "code": "INTERNAL_ERROR",
                "message": "An unexpected error occurred",
            },
            "request_id": str(request.state.request_id),
        },
    )
```

### Validation Errors

Pydantic validation errors are caught by FastAPI and reformatted:

```json
{
  "error": {
    "code": "VALIDATION_ERROR",
    "message": "Request validation failed",
    "details": {
      "fields": [
        {
          "field": "email",
          "message": "value is not a valid email address"
        }
      ]
    }
  },
  "request_id": "uuid"
}
```

### Background Job Errors

Provisioning/deprovisioning errors:

1. Error caught within the job
2. Error details stored in `provisioning_jobs.last_error` and `provisioning_jobs.result`
3. Retry count incremented
4. If max retries exceeded: job marked `failed`, employee status set to `failed`
5. Activity log entry created with error details
6. In-app notification (UI polling detects failed status)

## 6. Data Model

- `provisioning_jobs.last_error: TEXT` — stores error message
- `provisioning_jobs.result: JSONB` — stores error details
- `employee_integration_status.last_error: TEXT` — stores per-integration error

## 7. API Changes

All endpoints return the standardized error format.

## 8. UI Changes

- Error banners for API failures
- Inline validation errors on form fields
- Failed provisioning status with error tooltip

## 9. Security Considerations

- 500 errors never expose stack traces or internal details
- Validation errors expose field names but not constraints or internal logic
- Authentication errors are intentionally vague to prevent user enumeration

## 10. Error Handling

This document defines the error handling strategy.

## 11. Edge Cases

- Database connection failure → 503 with `DATABASE_ERROR`
- Redis connection failure → 503 with `CACHE_ERROR` for session-dependent endpoints
- Both DB and Redis down → 503 with `SERVICE_UNAVAILABLE`
- Request body too large → 413 with `PAYLOAD_TOO_LARGE`
- Invalid content type → 415 with `UNSUPPORTED_MEDIA_TYPE`

## 12. Testing Strategy

- Test each error code returns correct status and format
- Test validation error field-level detail
- Test background job error capture and retry
- Test that 500 errors don't leak internals

## 13. Acceptance Criteria

- All API errors return structured JSON with error code and message
- Validation errors include field-level detail
- Background job errors are captured and visible to admin
- Unexpected errors return 500 without leaking internals

## 14. Future Improvements

- Error code documentation generated from code (OpenAPI extension)
- Admin notification on error thresholds exceeded
- Error aggregation dashboard for support team
