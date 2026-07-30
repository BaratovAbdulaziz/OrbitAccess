# API Design

## 1. Overview

The SMB Access Manager API follows RESTful conventions. All endpoints are prefixed with `/api/v1`. Responses are JSON. Authentication is session-based via cookies.

## 2. Purpose

Defines every endpoint required for the MVP. No endpoint should be implemented before this document is finalized.

## 3. Functional Requirements

*Covered in `03-functional-requirements.md`.*

## 4. Non-functional Requirements

- All responses under 200ms (p95) for non-provisioning endpoints
- Rate limited: 10 req/min/IP on auth, 60 req/min/IP on other endpoints
- Consistent error format: `{ "error": { "code": "...", "message": "...", "details": {...} } }`

## 5. Technical Design

### Standard Headers

| Header | Description |
|---|---|
| `Content-Type: application/json` | Request and response format |
| `X-CSRF-Token: <token>` | Required for state-changing requests |
| `X-Request-ID: <uuid>` | Optional correlation ID |

### Standard Error Format

```json
{
  "error": {
    "code": "VALIDATION_ERROR",
    "message": "Email is required",
    "details": {
      "field": "email"
    }
  },
  "request_id": "uuid"
}
```

### Error Codes

| Code | HTTP Status | Description |
|---|---|---|
| VALIDATION_ERROR | 422 | Request body validation failed |
| NOT_FOUND | 404 | Resource not found |
| CONFLICT | 409 | Resource already exists |
| UNAUTHORIZED | 401 | Not authenticated |
| FORBIDDEN | 403 | Not authorized |
| RATE_LIMITED | 429 | Too many requests |
| INTEGRATION_ERROR | 502 | External service error |
| PROVISIONING_IN_PROGRESS | 409 | Cannot modify while provisioning |
| INVALID_STATE | 400 | Invalid state transition |

---

### Endpoint Index

| Method | Route | Purpose |
|---|---|---|
| POST | /api/v1/auth/signup | Create organization and owner account |
| POST | /api/v1/auth/login | Authenticate and create session |
| POST | /api/v1/auth/logout | Destroy session |
| POST | /api/v1/auth/accept-invitation | Accept admin invitation |
| POST | /api/v1/auth/forgot-password | Request password reset |
| POST | /api/v1/auth/reset-password | Reset password with token |
| GET | /api/v1/organizations/me | Get current organization |
| PATCH | /api/v1/organizations/me | Update organization |
| DELETE | /api/v1/organizations/me | Delete organization |
| GET | /api/v1/admins | List administrators |
| POST | /api/v1/admins/invite | Invite administrator |
| DELETE | /api/v1/admins/{id} | Remove administrator |
| GET | /api/v1/integrations | List integrations |
| GET | /api/v1/integrations/github/auth-url | Get GitHub OAuth URL |
| GET | /api/v1/integrations/github/callback | GitHub OAuth callback |
| POST | /api/v1/integrations/github/disconnect | Disconnect GitHub |
| GET | /api/v1/integrations/notion/auth-url | Get Notion OAuth URL |
| GET | /api/v1/integrations/notion/callback | Notion OAuth callback |
| POST | /api/v1/integrations/notion/disconnect | Disconnect Notion |
| GET | /api/v1/roles | List roles |
| POST | /api/v1/roles | Create role |
| GET | /api/v1/roles/{id} | Get role |
| PATCH | /api/v1/roles/{id} | Update role |
| DELETE | /api/v1/roles/{id} | Delete role |
| GET | /api/v1/employees | List employees |
| POST | /api/v1/employees | Create employee |
| GET | /api/v1/employees/{id} | Get employee |
| PATCH | /api/v1/employees/{id} | Update employee |
| POST | /api/v1/employees/{id}/offboard | Offboard employee |
| GET | /api/v1/activity-logs | List activity logs |

---

### POST /api/v1/auth/signup

**Purpose**: Create a new organization and the owner account.

**Request**:
```json
{
  "organization_name": "Acme Corp",
  "email": "alex@acme.com",
  "password": "SecureP@ss1",
  "display_name": "Alex Chen"
}
```

**Validation**:
- organization_name: required, 1–255 chars
- email: required, valid email, unique
- password: required, min 8 chars, must contain uppercase, lowercase, number
- display_name: required, 1–255 chars

**Response** (201):
```json
{
  "organization": { "id": "uuid", "name": "Acme Corp", "slug": "acme-corp" },
  "user": { "id": "uuid", "email": "alex@acme.com", "role": "owner" },
  "session_token": "..."
}
```

**Error Responses**:
- 409: Email already registered
- 422: Validation error

**Authorization**: None (public)

---

### POST /api/v1/auth/login

**Purpose**: Authenticate and create a session.

**Request**:
```json
{
  "email": "alex@acme.com",
  "password": "SecureP@ss1"
}
```

**Response** (200):
```json
{
  "user": { "id": "uuid", "email": "alex@acme.com", "display_name": "Alex Chen", "role": "owner" },
  "organization": { "id": "uuid", "name": "Acme Corp" }
}
```

**Error Responses**:
- 401: Invalid credentials
- 401: Account locked (after 5 failed attempts)

**Authorization**: None (public)

---

### POST /api/v1/auth/logout

**Purpose**: Destroy current session.

**Request**: Empty body (CSRF token in header)

**Response** (200): `{ "message": "Logged out" }`

**Authorization**: Authenticated

---

### POST /api/v1/auth/accept-invitation

**Purpose**: Accept admin invitation and set password.

**Request**:
```json
{
  "token": "invitation-token-uuid",
  "password": "SecureP@ss1",
  "display_name": "Jordan Taylor"
}
```

**Response** (200):
```json
{
  "user": { "id": "uuid", "email": "jordan@acme.com", "role": "admin" },
  "organization": { "id": "uuid", "name": "Acme Corp" }
}
```

**Error Responses**:
- 404: Invalid or expired token
- 422: Validation error

**Authorization**: None (valid token required)

---

### POST /api/v1/auth/forgot-password

**Purpose**: Send password reset email.

**Request**:
```json
{
  "email": "alex@acme.com"
}
```

**Response** (200): `{ "message": "If email exists, reset link sent" }`

**Note**: Always returns 200 to prevent email enumeration.

**Authorization**: None (public)

---

### POST /api/v1/auth/reset-password

**Purpose**: Reset password with token from email.

**Request**:
```json
{
  "token": "reset-token-uuid",
  "password": "NewSecureP@ss1"
}
```

**Response** (200): `{ "message": "Password reset successful" }`

**Error Responses**:
- 404: Invalid or expired token

**Authorization**: None (valid token required)

---

### GET /api/v1/organizations/me

**Purpose**: Get current organization details.

**Response** (200):
```json
{
  "id": "uuid",
  "name": "Acme Corp",
  "slug": "acme-corp",
  "email": "alex@acme.com",
  "verified_at": "2025-06-01T10:00:00Z",
  "created_at": "2025-06-01T10:00:00Z"
}
```

**Authorization**: Authenticated (owner or admin)

---

### PATCH /api/v1/organizations/me

**Purpose**: Update organization name or email.

**Request**:
```json
{
  "name": "Acme Corp Updated",
  "email": "admin@acme.com"
}
```

**Response** (200): Updated organization object

**Authorization**: Authenticated (owner only)

---

### DELETE /api/v1/organizations/me

**Purpose**: Permanently delete organization and all data.

**Request**:
```json
{
  "confirmation": "DELETE"
}
```

**Response** (200): `{ "message": "Organization deleted" }`

**Authorization**: Authenticated (owner only)

---

### GET /api/v1/admins

**Purpose**: List all administrators in the organization.

**Response** (200):
```json
{
  "admins": [
    {
      "id": "uuid",
      "email": "jordan@acme.com",
      "display_name": "Jordan Taylor",
      "role": "admin",
      "status": "active",
      "last_login_at": "2025-06-10T14:00:00Z",
      "created_at": "2025-06-05T10:00:00Z"
    }
  ],
  "total": 2
}
```

**Authorization**: Authenticated (owner only)

---

### POST /api/v1/admins/invite

**Purpose**: Invite a new administrator.

**Request**:
```json
{
  "email": "jordan@acme.com",
  "display_name": "Jordan Taylor"
}
```

**Response** (201):
```json
{
  "id": "uuid",
  "email": "jordan@acme.com",
  "display_name": "Jordan Taylor",
  "role": "admin",
  "status": "pending"
}
```

**Authorization**: Authenticated (owner only)

---

### DELETE /api/v1/admins/{id}

**Purpose**: Remove an administrator (or revoke pending invitation).

**Response** (200): `{ "message": "Admin removed" }`

**Error Responses**:
- 403: Cannot remove the last owner
- 404: Admin not found

**Authorization**: Authenticated (owner only)

---

### GET /api/v1/integrations

**Purpose**: List all connected integrations for the organization.

**Response** (200):
```json
{
  "integrations": [
    {
      "id": "uuid",
      "integration_type": "github",
      "display_name": "acme-org",
      "status": "active",
      "config": { "avatar_url": "..." },
      "created_at": "2025-06-01T10:00:00Z"
    },
    {
      "id": "uuid",
      "integration_type": "notion",
      "display_name": "Acme Workspace",
      "status": "active",
      "config": {},
      "created_at": "2025-06-01T11:00:00Z"
    }
  ]
}
```

**Authorization**: Authenticated (owner or admin)

---

### GET /api/v1/integrations/github/auth-url

**Purpose**: Get the GitHub OAuth authorization URL.

**Query Parameters**: `redirect_url` — URL to return to after auth

**Response** (200):
```json
{
  "auth_url": "https://github.com/login/oauth/authorize?client_id=...&state=...&redirect_uri=..."
}
```

**Authorization**: Authenticated (owner or admin)

---

### GET /api/v1/integrations/github/callback

**Purpose**: Handle GitHub OAuth callback.

**Query Parameters**: `code`, `state`

**Response** (200):
```json
{
  "integration": {
    "id": "uuid",
    "integration_type": "github",
    "display_name": "acme-org",
    "status": "active"
  }
}
```

**Error Responses**:
- 400: Invalid state parameter
- 502: GitHub API error

**Authorization**: Authenticated (owner or admin)

---

### POST /api/v1/integrations/github/disconnect

**Purpose**: Disconnect GitHub integration.

**Response** (200): `{ "message": "GitHub integration disconnected" }`

**Authorization**: Authenticated (owner or admin)

---

### GET /api/v1/integrations/notion/auth-url

**Purpose**: Get the Notion OAuth authorization URL.

**Query Parameters**: `redirect_url`

**Response** (200):
```json
{
  "auth_url": "https://api.notion.com/v1/oauth/authorize?client_id=...&state=..."
}
```

**Authorization**: Authenticated (owner or admin)

---

### GET /api/v1/integrations/notion/callback

**Purpose**: Handle Notion OAuth callback.

**Query Parameters**: `code`, `state`

**Response** (200): Same structure as GitHub callback

**Authorization**: Authenticated (owner or admin)

---

### POST /api/v1/integrations/notion/disconnect

**Purpose**: Disconnect Notion integration.

**Response** (200): `{ "message": "Notion integration disconnected" }`

**Authorization**: Authenticated (owner or admin)

---

### GET /api/v1/roles

**Purpose**: List all roles in the organization.

**Response** (200):
```json
{
  "roles": [
    {
      "id": "uuid",
      "name": "Engineer",
      "description": "Software engineering team",
      "integration_configs": [
        {
          "integration_type": "github",
          "config": {
            "teams": [{"id": 123, "name": "Engineering"}],
            "access_level": "member"
          }
        },
        {
          "integration_type": "notion",
          "config": {
            "permission_level": "member"
          }
        }
      ],
      "employee_count": 5,
      "created_at": "2025-06-01T10:00:00Z"
    }
  ],
  "total": 3
}
```

**Authorization**: Authenticated (owner or admin)

---

### POST /api/v1/roles

**Purpose**: Create a new role.

**Request**:
```json
{
  "name": "Engineer",
  "description": "Software engineering team",
  "integrations": [
    {
      "integration_type": "github",
      "config": {
        "teams": [{"id": 123, "name": "Engineering"}],
        "access_level": "member"
      }
    },
    {
      "integration_type": "notion",
      "config": {
        "permission_level": "member"
      }
    }
  ]
}
```

**Response** (201): Full role object

**Authorization**: Authenticated (owner or admin)

---

### GET /api/v1/roles/{id}

**Purpose**: Get role details including assigned employees.

**Response** (200): Full role object + `employees` array (id, name, email, status)

**Authorization**: Authenticated (owner or admin)

---

### PATCH /api/v1/roles/{id}

**Purpose**: Update role name, description, or integration configs.

**Request**: Same structure as create, all fields optional

**Response** (200): Updated role object

**Authorization**: Authenticated (owner or admin)

---

### DELETE /api/v1/roles/{id}

**Purpose**: Delete a role. Must not be assigned to any active employee.

**Error Responses**:
- 409: Role is assigned to active employees

**Response** (200): `{ "message": "Role deleted" }`

**Authorization**: Authenticated (owner or admin)

---

### GET /api/v1/employees

**Purpose**: List employees with optional search/filter.

**Query Parameters**: `search` (name/email), `status`, `role_id`, `page`, `per_page`

**Response** (200):
```json
{
  "employees": [
    {
      "id": "uuid",
      "email": "sam@acme.com",
      "display_name": "Sam Rivera",
      "status": "active",
      "role": {
        "id": "uuid",
        "name": "Engineer"
      },
      "integration_statuses": [
        { "integration_type": "github", "status": "active" },
        { "integration_type": "notion", "status": "active" }
      ],
      "provisioned_at": "2025-06-10T10:00:00Z",
      "created_at": "2025-06-10T10:00:00Z"
    }
  ],
  "total": 15,
  "page": 1,
  "per_page": 20
}
```

**Authorization**: Authenticated (owner or admin)

---

### POST /api/v1/employees

**Purpose**: Add an employee and trigger provisioning.

**Request**:
```json
{
  "email": "sam@acme.com",
  "display_name": "Sam Rivera",
  "role_id": "uuid"
}
```

**Response** (201):
```json
{
  "employee": {
    "id": "uuid",
    "email": "sam@acme.com",
    "display_name": "Sam Rivera",
    "status": "provisioning",
    "role": { "id": "uuid", "name": "Engineer" }
  },
  "provisioning_job": {
    "id": "uuid",
    "status": "queued"
  }
}
```

**Authorization**: Authenticated (owner or admin)

---

### GET /api/v1/employees/{id}

**Purpose**: Get employee details including provisioning history.

**Response** (200): Full employee object with provisioning jobs

**Authorization**: Authenticated (owner or admin)

---

### PATCH /api/v1/employees/{id}

**Purpose**: Update employee name, email, or re-assign role.

**Request**:
```json
{
  "display_name": "Sam Rivera Updated",
  "email": "sam.new@acme.com",
  "role_id": "new-role-uuid"
}
```

**Note**: Changing role_id triggers re-provisioning.

**Authorization**: Authenticated (owner or admin)

---

### POST /api/v1/employees/{id}/offboard

**Purpose**: Start offboarding process.

**Request**: Empty body or `{}`

**Response** (200):
```json
{
  "employee": {
    "id": "uuid",
    "status": "offboarding"
  },
  "deprovisioning_job": {
    "id": "uuid",
    "status": "queued"
  }
}
```

**Error Responses**:
- 400: Employee already offboarded
- 409: Offboarding already in progress

**Authorization**: Authenticated (owner or admin)

---

### GET /api/v1/activity-logs

**Purpose**: Query activity logs with pagination and filters.

**Query Parameters**: `action`, `actor_id`, `target_type`, `date_from`, `date_to`, `page`, `per_page`

**Response** (200):
```json
{
  "logs": [
    {
      "id": 1,
      "action": "employee.added",
      "actor_name": "Alex Chen",
      "target_type": "employee",
      "target_name": "Sam Rivera",
      "details": {
        "role": "Engineer",
        "integration": "github"
      },
      "created_at": "2025-06-10T10:00:00Z"
    }
  ],
  "total": 50,
  "page": 1,
  "per_page": 20
}
```

**Authorization**: Authenticated (owner or admin)

---

## 6. Data Model

*Covered in `06-database-design.md`.*

## 7. API Changes

This document is the API specification — no further changes until review.

## 8. UI Changes

*Covered in screen-specific documents.*

## 9. Security Considerations

- CSRF protection via double-submit cookie pattern or header-based token
- Session cookie: HttpOnly, Secure, SameSite=Strict
- Rate limiting on auth endpoints
- State parameter in OAuth flows prevents CSRF on callbacks
- Input validation via Pydantic models

## 10. Error Handling

- All errors return structured JSON with error code and message
- 500 errors are logged server-side with request ID for debugging
- Validation errors include field-level details

## 11. Edge Cases

- Concurrent offboard requests → first succeeds, subsequent return 409
- Employee creation with duplicate email → 409 CONFLICT
- Role deletion while assigned → 409 CONFLICT with details
- OAuth callback with invalid/expired state → 400 with retry instructions

## 12. Testing Strategy

- Every endpoint has a positive and negative test
- Authentication/authorization tests for each endpoint
- Rate limiting tests for auth endpoints
- CSRF token validation tests

## 13. Acceptance Criteria

- All endpoints return correct responses for valid requests
- All endpoints return appropriate errors for invalid requests
- Authentication enforced on all protected endpoints
- Role-based access control enforced (owner vs admin)

## 14. Future Improvements

- Bulk employee creation (POST /api/v1/employees/bulk)
- CSV export for employees and activity logs
- Webhook endpoints for event notifications
- PATCH /api/v1/employees/bulk/offboard for batch offboarding
- Pagination metadata standardization (cursor-based for large datasets)
