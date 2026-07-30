# Domain Model

## 1. Overview

Defines the core business entities, their relationships, and the domain language used throughout the system. This is the authoritative reference for what each concept means and how entities relate.

## 2. Purpose

Establish a shared understanding of the domain vocabulary so developers, product managers, and stakeholders communicate precisely.

## 3. Functional Requirements

*Covered in `03-functional-requirements.md`.*

## 4. Non-functional Requirements

- Domain language must be consistently used in code, APIs, and documentation

## 5. Technical Design

### Entity Overview

```
┌──────────────┐     ┌──────────────┐     ┌────────────────┐
│ Organization │────▶│     User     │     │     Role       │
│              │     │  (Admin)     │     │                │
│ Root entity  │     │              │     │ Access pattern │
│ Owns all     │     │ Logs in,     │     │ Defines what   │
│ data         │     │ manages      │     │ access an      │
│              │     │ employees    │     │ employee gets  │
└──────────────┘     └──────────────┘     └───────┬────────┘
        │                                         │
        │                                         │
        ▼                                         ▼
┌──────────────┐     ┌──────────────┐     ┌────────────────┐
│ Integration  │     │  Employee    │────▶│RoleIntegration  │
│              │     │              │     │                │
│ Connected    │     │ Subject of   │     │ Per-integration│
│ external     │     │ provisioning │     │ config within  │
│ service      │     │              │     │ a role         │
└──────────────┘     └──────────────┘     └────────────────┘
        │                    │
        │                    ▼
        │         ┌──────────────────────┐
        │         │EmployeeIntegration   │
        └────────▶│Status                │
                  │                      │
                  │ Per-employee,        │
                  │ per-integration      │
                  │ provisioning state   │
                  └──────────────────────┘
                              │
                              ▼
                  ┌──────────────────────┐
                  │  ProvisioningJob     │
                  │                      │
                  │ Tracks provisioning  │
                  │ or deprovisioning    │
                  │ execution            │
                  └──────────────────────┘
                              │
                              ▼
                  ┌──────────────────────┐
                  │   ActivityLog        │
                  │                      │
                  │ Immutable audit      │
                  │ trail of all         │
                  │ domain actions       │
                  └──────────────────────┘
```

### Entity Definitions

#### Organization

The top-level entity. Represents a company or team that uses SMB Access Manager. Owns all other entities.

- **Identity**: UUID
- **Lifecycle**: Created during signup → verified via email → active until deleted
- **Constraints**: Email must be unique across all organizations
- **Soft-delete**: Cascades to all child entities

#### User (Administrator)

A person who logs into the admin dashboard and manages the organization.

- **Identity**: UUID
- **Types**: `owner` (full control), `admin` (operational control)
- **Lifecycle**: Invited → accepts invitation → active → disabled/removed
- **Constraints**: At least one owner must always exist; email unique per org

#### Employee

A person employed by the organization who needs access to tools. Employees do not log into the platform.

- **Identity**: UUID
- **Lifecycle**: Created → provisioning → active → offboarding → offboarded
- **Constraints**: Email unique per org (including offboarded employees)
- **Role**: Optional — an employee may have no role (no access provisioned)

#### Role

A named set of access permissions (integration configs) that can be assigned to employees.

- **Identity**: UUID
- **Lifecycle**: Created → active → deleted (soft)
- **Constraints**: Name unique per org; cannot delete if actively assigned
- **Composition**: Contains 0+ RoleIntegration configs

#### RoleIntegration

Configures what access a role grants for a specific integration type.

- **Identity**: UUID (owned by Role)
- **Contents**: Integration-specific JSON config (teams, permission levels)
- **Lifecycle**: Created/updated/deleted with the Role
- **Constraints**: One per integration type per role

#### Integration

A connection to an external service (GitHub Organization or Notion workspace).

- **Identity**: UUID
- **Types**: `github`, `notion`
- **Lifecycle**: OAuth flow → active → error → disconnected
- **Constraints**: One per type per organization
- **Security**: OAuth token encrypted at rest

#### EmployeeIntegrationStatus

Tracks the provisioning state for a single employee on a single integration.

- **Identity**: UUID
- **Lifecycle**: pending → provisioning → active → removed
- **Purpose**: Allows partial provisioning visibility (GitHub done, Notion pending)

#### ProvisioningJob

Represents an attempt to provision or deprovision an employee.

- **Identity**: UUID
- **Actions**: `provision`, `deprovision`
- **Lifecycle**: queued → running → completed / failed (with retries)
- **Purpose**: Provides execution tracking, retry logic, and failure diagnostics

#### ActivityLog

An immutable record of a domain event for audit purposes.

- **Identity**: BIGSERIAL (sequential)
- **Properties**: Actor, action, target, timestamp, IP address, metadata
- **Immutability**: No UPDATE or DELETE at database level

## 6. Data Model

*Covered in `06-database-design.md`.*

## 7. API Changes

All API endpoints map directly to domain entities (CRUD + actions).

## 8. UI Changes

UI screens map to domain entities: Organizations (settings), Employees, Roles, Integrations, Activity Logs.

## 9. Security Considerations

- Organization boundary is the security boundary — no cross-org data access
- User types (owner/admin) control access within the org boundary
- Employee entities have no authentication (they don't log in)

## 10. Error Handling

Domain validation errors map to API error codes (e.g., duplicate email → CONFLICT).

## 11. Edge Cases

- Employee without a role: valid state, no provisioning occurs
- Role with zero integration configs: valid, employees assigned get nothing provisioned
- Organization with zero integrations: provisioning always completes as no-op
- Employee offboarded and re-added: new lifecycle starts fresh

## 12. Testing Strategy

- Unit tests for domain logic (status transitions, validation)
- Integration tests for entity persistence and relationships

## 13. Acceptance Criteria

- All domain entities defined with clear lifecycle and constraints
- Relationships between entities documented
- Domain language consistently used across all documentation

## 14. Future Improvements

- Add `Department` or `Team` entity for grouping employees
- Add `AccessPolicy` entity for fine-grained permission rules
- Add `WebhookEndpoint` entity for event subscriptions
- Add `BillingAccount` entity for subscription management
