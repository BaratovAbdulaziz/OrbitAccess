# API Error Codes

## 1. Overview

Complete catalog of all API error codes used by SMB Access Manager. Every error response follows a consistent JSON structure.

## 2. Purpose

Enable API consumers (frontend, integrations, future API users) to handle errors predictably and programmatically.

## 3. Functional Requirements

- Every API error returns a machine-readable code
- Every API error returns a human-readable message
- Validation errors include field-level detail

## 4. Non-functional Requirements

- Error codes are stable (do not change between versions)
- New error codes are added, never removed or repurposed

## 5. Technical Design

### Response Format

```json
{
  "error": {
    "code": "VALIDATION_ERROR",
    "message": "Request validation failed",
    "details": {
      "fields": [
        {"field": "email", "message": "value is not a valid email address"}
      ]
    }
  },
  "request_id": "abc-123-def-456"
}
```

### Error Code Catalog

#### 4xx Client Errors

| Code | HTTP Status | Description | When It Occurs |
|---|---|---|---|
| `VALIDATION_ERROR` | 422 | Request body or query parameters failed validation | Missing required field, invalid format, wrong type |
| `NOT_FOUND` | 404 | The requested resource does not exist | Invalid ID, deleted resource, wrong org |
| `CONFLICT` | 409 | Resource already exists or state conflict | Duplicate email, duplicate role name |
| `UNAUTHORIZED` | 401 | Authentication required or failed | Missing session, invalid credentials, expired session |
| `FORBIDDEN` | 403 | Authenticated but insufficient permissions | Admin accessing owner endpoint |
| `RATE_LIMITED` | 429 | Too many requests | Auth endpoint rate limit exceeded |
| `INVALID_STATE` | 400 | Resource is in an invalid state for the requested operation | Offboarding already-offboarded employee |
| `PROVISIONING_IN_PROGRESS` | 409 | Cannot modify resource while provisioning is active | Updating employee during provisioning |
| `PAYLOAD_TOO_LARGE` | 413 | Request body exceeds maximum size | Uploading large payload |
| `UNSUPPORTED_MEDIA_TYPE` | 415 | Invalid Content-Type header | Sending non-JSON body to JSON endpoint |
| `MISSING_PARAMETER` | 422 | Required query parameter missing | Pagination parameter omitted |
| `INVALID_PARAMETER` | 422 | Query parameter has invalid value | Invalid date format in filter |
| `INTEGRATION_DISCONNECTED` | 400 | Referenced integration is not connected | Creating role with disconnected integration |
| `EMPLOYEE_ALREADY_OFFBOARDED` | 400 | Employee has already been offboarded | Attempting to offboard offboarded employee |
| `ROLE_IN_USE` | 409 | Role is assigned to active employees | Attempting to delete assigned role |
| `LAST_OWNER` | 403 | Cannot remove the last organization owner | Attempting to delete or demote last owner |

#### 5xx Server Errors

| Code | HTTP Status | Description | When It Occurs |
|---|---|---|---|
| `INTERNAL_ERROR` | 500 | Unexpected server error | Unhandled exception, null pointer, unexpected state |
| `DATABASE_ERROR` | 503 | Database connection or query failure | DB down, connection pool exhausted |
| `CACHE_ERROR` | 503 | Redis/cache connection failure | Redis down during session check |
| `INTEGRATION_ERROR` | 502 | External integration API error | GitHub/Notion API returns error |
| `INTEGRATION_TIMEOUT` | 504 | External integration API timeout | GitHub/Notion API does not respond |
| `SERVICE_UNAVAILABLE` | 503 | Application cannot serve requests | Health check fails, maintenance mode |

### Error Code Hierarchy

```
VALIDATION_ERROR (422)
├── MISSING_PARAMETER
├── INVALID_PARAMETER
└── (field-level validation details)

NOT_FOUND (404)

CONFLICT (409)
├── ROLE_IN_USE
└── (duplicate resource)

UNAUTHORIZED (401)

FORBIDDEN (403)
├── LAST_OWNER
└── (insufficient permissions)

RATE_LIMITED (429)

INVALID_STATE (400)
├── PROVISIONING_IN_PROGRESS
├── INTEGRATION_DISCONNECTED
└── EMPLOYEE_ALREADY_OFFBOARDED

INTEGRATION_ERROR (502)
└── INTEGRATION_TIMEOUT (504)
```

### Error Response Headers

| Header | Description | Present On |
|---|---|---|
| `X-Request-ID` | Correlation ID for the request | All responses |
| `X-RateLimit-Limit` | Maximum requests per window | All responses |
| `X-RateLimit-Remaining` | Remaining requests in current window | All responses |
| `X-RateLimit-Reset` | Unix timestamp when the window resets | All responses |
| `Retry-After` | Seconds to wait before retrying | 429, 503 |

### UI Error Mapping

| Error Code | UI Treatment |
|---|---|
| `VALIDATION_ERROR` | Inline field errors + toast with summary |
| `NOT_FOUND` | Error toast: "Resource not found" |
| `CONFLICT` | Error toast: resource-specific message |
| `UNAUTHORIZED` | Redirect to login page |
| `FORBIDDEN` | Error toast: "You don't have permission" |
| `RATE_LIMITED` | Error toast: "Too many requests, please wait" |
| `INVALID_STATE` | Error toast: descriptive message |
| `INTEGRATION_ERROR` | Warning banner: "GitHub/Notion is having issues" |
| `INTERNAL_ERROR` | Error toast: "Something went wrong. [Request ID]" |

## 6. Data Model

No changes — errors are response-only.

## 7. API Changes

All endpoints use the standardized error format defined here.

## 8. UI Changes

UI components interpret error codes to display appropriate messages.

## 9. Security Considerations

- `INTERNAL_ERROR` never exposes stack traces or internal state
- `NOT_FOUND` does not distinguish between "doesn't exist" and "exists but forbidden"
- `UNAUTHORIZED` does not reveal whether the email exists (prevents enumeration)

## 10. Error Handling

This document is the error handling specification.

## 11. Edge Cases

- Multiple validation errors → all returned in the `fields` array
- Rate limit and another error simultaneously → rate limit takes precedence
- Database error during error handling → log the failure, return generic 500

## 12. Testing Strategy

- Test that every endpoint returns the correct error code for each failure scenario
- Test error format compliance for all responses
- Test that unexpected exceptions return INTERNAL_ERROR (not stack traces)

## 13. Acceptance Criteria

- All error responses follow the defined JSON format
- Every documented error code appears in at least one endpoint
- No undocumented error codes are used

## 14. Future Improvements

- OpenAPI extensions documenting per-endpoint error codes
- Error code deprecation policy for API versioning
- Admin dashboard for error rate monitoring
- Machine-readable error code schema (JSON Schema)
