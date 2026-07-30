# Database Design

## 1. Overview

PostgreSQL 16 database with 7 core tables, support for soft-delete, and an append-only activity log. Designed for the MVP scope (GitHub + Notion integrations) with extensibility for future integration types.

## 2. Purpose

Provides a single source of truth for all product data. The schema is intentionally minimal to keep the MVP simple while supporting future expansion.

## 3. Functional Requirements

- Store organizations, users (admins/employees), roles, integrations, provisioning jobs, and activity logs
- Support soft-delete for all customer-facing entities
- Ensure audit trail immutability

## 4. Non-functional Requirements

- Indexes on all foreign keys and frequently queried columns
- JSONB for flexible integration configuration
- Timestamp with timezone throughout

## 5. Technical Design

### Entity Relationship Diagram (Text)

```
organizations
    │
    ├──< users (admins belong to org)
    │
    ├──< roles (org-defined roles)
    │     │
    │     └──< role_integrations (which integrations a role uses)
    │
    ├──< employees (people being provisioned)
    │     │
    │     ├──< employee_integration_status (per-integration provisioning state)
    │     │
    │     └──> roles (assigned role)
    │
    ├──< integrations (connected GitHub/Notion accounts)
    │
    ├──< provisioning_jobs
    │
    └──< activity_logs (append-only)
```

### Table: organizations

| Column | Type | Constraints | Description |
|---|---|---|---|
| id | UUID | PK, default gen_random_uuid() | Unique identifier |
| name | VARCHAR(255) | NOT NULL | Organization name |
| slug | VARCHAR(100) | UNIQUE, NOT NULL | URL-friendly identifier |
| email | VARCHAR(255) | NOT NULL | Contact email |
| is_active | BOOLEAN | NOT NULL, DEFAULT true | Soft delete flag |
| verified_at | TIMESTAMPTZ | | When org email was verified |
| created_at | TIMESTAMPTZ | NOT NULL, DEFAULT now() | |
| updated_at | TIMESTAMPTZ | NOT NULL, DEFAULT now() | |

**Why**: Root entity. All other entities belong to an organization.

### Table: users

| Column | Type | Constraints | Description |
|---|---|---|---|
| id | UUID | PK | |
| organization_id | UUID | FK → organizations.id, NOT NULL | |
| email | VARCHAR(255) | NOT NULL | Login email |
| password_hash | VARCHAR(255) | | NULL for pending invitations |
| display_name | VARCHAR(255) | NOT NULL | |
| role | VARCHAR(20) | NOT NULL, CHECK IN ('owner', 'admin') | Permission level |
| status | VARCHAR(20) | NOT NULL, DEFAULT 'pending' | pending, active, disabled |
| invitation_token | VARCHAR(255) | | Magic link token |
| invitation_sent_at | TIMESTAMPTZ | | |
| invitation_expires_at | TIMESTAMPTZ | | |
| last_login_at | TIMESTAMPTZ | | |
| is_active | BOOLEAN | NOT NULL, DEFAULT true | Soft delete |
| created_at | TIMESTAMPTZ | NOT NULL | |
| updated_at | TIMESTAMPTZ | NOT NULL | |

**Indexes**: UNIQUE(organization_id, email), INDEX(organization_id), INDEX(invitation_token)

**Why**: Represents administrators who log into the dashboard. Employees are a separate entity because they have different attributes and lifecycle.

### Table: roles

| Column | Type | Constraints | Description |
|---|---|---|---|
| id | UUID | PK | |
| organization_id | UUID | FK → organizations.id, NOT NULL | |
| name | VARCHAR(255) | NOT NULL | e.g. "Engineer", "Designer" |
| description | TEXT | | |
| is_active | BOOLEAN | NOT NULL, DEFAULT true | Soft delete |
| created_at | TIMESTAMPTZ | NOT NULL | |
| updated_at | TIMESTAMPTZ | NOT NULL | |

**Indexes**: UNIQUE(organization_id, name), INDEX(organization_id)

**Why**: Roles are the core abstraction linking employees to integrations. An employee gets a role, and the role defines what access they receive.

### Table: role_integrations

| Column | Type | Constraints | Description |
|---|---|---|---|
| id | UUID | PK | |
| role_id | UUID | FK → roles.id, NOT NULL, ON DELETE CASCADE | |
| integration_type | VARCHAR(50) | NOT NULL | 'github' or 'notion' |
| config | JSONB | NOT NULL, DEFAULT '{}' | Integration-specific configuration |

**Config structure**:
- GitHub: `{ "teams": [{"id": 123, "name": "Engineering"}], "access_level": "member" }`
- Notion: `{ "permission_level": "member" }`

**Indexes**: UNIQUE(role_id, integration_type), INDEX(role_id)

**Why**: Separated from roles table to allow flexible configuration per integration type without nullable columns.

### Table: employees

| Column | Type | Constraints | Description |
|---|---|---|---|
| id | UUID | PK | |
| organization_id | UUID | FK → organizations.id, NOT NULL | |
| role_id | UUID | FK → roles.id | Currently assigned role |
| email | VARCHAR(255) | NOT NULL | Employee's email |
| display_name | VARCHAR(255) | NOT NULL | |
| status | VARCHAR(20) | NOT NULL, DEFAULT 'pending' | pending, provisioning, active, offboarding, offboarded, failed |
| provisioned_at | TIMESTAMPTZ | | When fully provisioned |
| offboarded_at | TIMESTAMPTZ | | When offboarded |
| is_active | BOOLEAN | NOT NULL, DEFAULT true | Soft delete |
| created_at | TIMESTAMPTZ | NOT NULL | |
| updated_at | TIMESTAMPTZ | NOT NULL | |

**Indexes**: UNIQUE(organization_id, email), INDEX(organization_id), INDEX(role_id), INDEX(status)

**Why**: Separate from users because employees don't log in. They are subjects of provisioning actions.

### Table: integrations

| Column | Type | Constraints | Description |
|---|---|---|---|
| id | UUID | PK | |
| organization_id | UUID | FK → organizations.id, NOT NULL | |
| integration_type | VARCHAR(50) | NOT NULL | 'github' or 'notion' |
| display_name | VARCHAR(255) | NOT NULL | Human-readable name (org name, workspace name) |
| access_token_encrypted | TEXT | NOT NULL | Fernet-encrypted OAuth token |
| refresh_token_encrypted | TEXT | | Encrypted refresh token if applicable |
| token_expires_at | TIMESTAMPTZ | | |
| external_id | VARCHAR(255) | | GitHub org ID or Notion workspace ID |
| config | JSONB | NOT NULL, DEFAULT '{}' | Extra integration-specific metadata |
| status | VARCHAR(20) | NOT NULL, DEFAULT 'active' | active, error, disconnected |
| last_error | TEXT | | Last error message |
| is_active | BOOLEAN | NOT NULL, DEFAULT true | Soft delete |
| created_at | TIMESTAMPTZ | NOT NULL | |
| updated_at | TIMESTAMPTZ | NOT NULL | |

**Indexes**: UNIQUE(organization_id, integration_type), INDEX(organization_id)

**Why**: Each organization can have one GitHub and one Notion connection. Tokens must be encrypted. Config stores metadata like GitHub org avatar URL.

### Table: employee_integration_status

| Column | Type | Constraints | Description |
|---|---|---|---|
| id | UUID | PK | |
| employee_id | UUID | FK → employees.id, NOT NULL, ON DELETE CASCADE | |
| integration_id | UUID | FK → integrations.id, NOT NULL, ON DELETE CASCADE | |
| status | VARCHAR(20) | NOT NULL, DEFAULT 'pending' | pending, provisioning, active, failed, removed |
| external_identity | VARCHAR(255) | | GitHub user ID or Notion user ID |
| last_error | TEXT | | |
| created_at | TIMESTAMPTZ | NOT NULL | |
| updated_at | TIMESTAMPTZ | NOT NULL | |

**Indexes**: UNIQUE(employee_id, integration_id), INDEX(integration_id)

**Why**: Tracks provisioning state per integration per employee. Allows partial provisioning (e.g., GitHub succeeded, Notion failed).

### Table: provisioning_jobs

| Column | Type | Constraints | Description |
|---|---|---|---|
| id | UUID | PK | |
| organization_id | UUID | FK → organizations.id, NOT NULL | |
| employee_id | UUID | FK → employees.id, NOT NULL | |
| action | VARCHAR(20) | NOT NULL | 'provision' or 'deprovision' |
| status | VARCHAR(20) | NOT NULL, DEFAULT 'queued' | queued, running, completed, failed |
| attempts | INTEGER | NOT NULL, DEFAULT 0 | |
| max_attempts | INTEGER | NOT NULL, DEFAULT 3 | |
| last_error | TEXT | | |
| result | JSONB | | Final result details |
| enqueued_at | TIMESTAMPTZ | NOT NULL, DEFAULT now() | |
| started_at | TIMESTAMPTZ | | |
| completed_at | TIMESTAMPTZ | | |
| created_at | TIMESTAMPTZ | NOT NULL | |

**Indexes**: INDEX(organization_id), INDEX(employee_id), INDEX(status), INDEX(enqueued_at)

**Why**: Provides visibility into provisioning progress. Supports retry logic with attempt counting.

### Table: activity_logs

| Column | Type | Constraints | Description |
|---|---|---|---|
| id | BIGSERIAL | PK | Sequential for ordering |
| organization_id | UUID | FK → organizations.id, NOT NULL | |
| actor_id | UUID | FK → users.id | Admin who performed the action |
| actor_name | VARCHAR(255) | NOT NULL | Denormalized for log permanence |
| action | VARCHAR(50) | NOT NULL | e.g. 'employee.added', 'employee.offboarded', 'integration.connected' |
| target_type | VARCHAR(50) | | 'employee', 'integration', 'role', 'organization' |
| target_id | UUID | | |
| target_name | VARCHAR(255) | | Denormalized target name |
| details | JSONB | | Action-specific details |
| ip_address | INET | | Request origin IP |
| created_at | TIMESTAMPTZ | NOT NULL, DEFAULT now() | |

**Indexes**: INDEX(organization_id, created_at DESC), INDEX(organization_id, action), INDEX(organization_id, actor_id)

**Why**: Append-only audit trail. Denormalized actor and target names survive record deletion. BIGSERIAL prevents ID reuse.

### Soft Delete Strategy

All customer-facing entities (`organizations`, `users`, `roles`, `employees`, `integrations`) use an `is_active` boolean flag. When "deleted":
- `is_active` set to `false`
- `updated_at` timestamp updated
- Unique constraints may need to allow duplicates for deleted records → use partial unique indexes

**Example partial unique index for employees**:
```sql
CREATE UNIQUE INDEX idx_employees_active_email
ON employees (organization_id, email)
WHERE is_active = true;
```

### Audit Logging

The `activity_logs` table is append-only. No UPDATE or DELETE operations are permitted at the application level. This provides a tamper-evident audit trail.

### Migration Strategy

- Alembic for schema migrations
- Each migration is a single file with upgrade() and downgrade()
- Migrations are tested in CI before deployment
- Zero-downtime migrations preferred (add columns before using them)

## 6. Data Model

Covered above.

## 7. API Changes

N/A — this is the data model definition.

## 8. UI Changes

N/A

## 9. Security Considerations

- OAuth tokens encrypted with Fernet (AES-256-CBC + HMAC)
- Password hashes use bcrypt with cost factor 12
- Activity log IP addresses are logged for forensic purposes
- No plaintext secrets stored anywhere

## 10. Error Handling

- Database connection failures return 503
- Unique constraint violations return 409 with descriptive message
- Foreign key violations return 422

## 11. Edge Cases

- Deleting a role assigned to employees: set role_id to NULL on employees, mark role as inactive, allow re-creation
- Disconnecting an integration: mark as disconnected, cancel pending provisioning jobs for that integration
- Organization deletion cascades logically (soft-delete all child entities)

## 12. Testing Strategy

- Test unique constraints (duplicate email within org)
- Test cascade behavior
- Test soft delete preserves data
- Test partial unique index allows reusing deleted email

## 13. Acceptance Criteria

- All tables created via Alembic migration
- Foreign keys enforce referential integrity
- Soft-delete works correctly for all entities
- Activity log is truly append-only

## 14. Future Improvements

- Add `integrations.config` for connection metadata
- Add `employee_integration_status.metadata` for extra provisioning details
- Add table for webhook events
- Add table for billing/subscriptions
- Partition `activity_logs` by time for performance
