# Event Catalog

## 1. Overview

Catalog of all domain events emitted by SMB Access Manager. Events are used for activity logging and (in future) webhook notifications.

## 2. Purpose

Define the event schema for every significant state change. Ensure consistent event naming and structure.

## 3. Functional Requirements

- All domain state changes emit events
- Events recorded in the activity log
- Event structure is consistent across all event types

## 4. Non-functional Requirements

- Events are immutable once recorded
- Event schema is backward-compatible (additive changes only)

## 5. Technical Design

### Event Structure

```json
{
  "id": "evt_uuid",
  "organization_id": "uuid",
  "actor": {
    "id": "uuid",
    "type": "user",
    "name": "Alex Chen"
  },
  "action": "employee.added",
  "target": {
    "type": "employee",
    "id": "uuid",
    "name": "Sam Rivera"
  },
  "timestamp": "2025-06-10T10:00:00.000Z",
  "metadata": {},
  "request_id": "req_uuid",
  "ip_address": "203.0.113.1"
}
```

### Event Catalog

#### Organization Events

| Action | Trigger | Metadata |
|---|---|---|
| `organization.created` | Signup completes | — |
| `organization.updated` | Name or email changed | `{ "changed_fields": ["name"] }` |
| `organization.verified` | Email verified | — |
| `organization.deleted` | Owner deletes org | `{ "employee_count": 15, "integration_count": 2 }` |

#### Admin Events

| Action | Trigger | Metadata |
|---|---|---|
| `admin.invited` | Owner invites admin | `{ "invitation_email": "jordan@..." }` |
| `admin.invitation.accepted` | Admin accepts invitation | — |
| `admin.invitation.expired` | Invitation TTL passes (48h) | `{ "expired_at": "..." }` |
| `admin.removed` | Owner removes admin | — |
| `admin.login` | Admin logs in | `{ "ip": "..." }` |
| `admin.login.failed` | Failed login attempt | `{ "attempt": 3, "max_attempts": 5 }` |
| `admin.account.locked` | 5 failed attempts | `{ "cooldown_until": "..." }` |

#### Integration Events

| Action | Trigger | Metadata |
|---|---|---|
| `integration.connected` | OAuth flow completes | `{ "type": "github", "display_name": "acme-org" }` |
| `integration.disconnected` | Admin disconnects | `{ "type": "notion" }` |
| `integration.error` | Integration enters error state | `{ "type": "github", "error": "token_expired" }` |
| `integration.reconnected` | Admin re-authorizes | `{ "type": "github" }` |

#### Role Events

| Action | Trigger | Metadata |
|---|---|---|
| `role.created` | Role created | `{ "name": "Engineer", "integrations": ["github", "notion"] }` |
| `role.updated` | Role updated | `{ "changed_fields": ["integrations"] }` |
| `role.deleted` | Role soft-deleted | `{ "name": "Engineer", "was_assigned_to": 3 }` |

#### Employee Events

| Action | Trigger | Metadata |
|---|---|---|
| `employee.added` | Employee created | `{ "role": "Engineer", "email": "sam@..." }` |
| `employee.updated` | Name or email changed | `{ "changed_fields": ["email"] }` |
| `employee.role.changed` | Role reassigned | `{ "old_role": "Designer", "new_role": "Engineer" }` |
| `employee.provisioning.started` | Worker begins provisioning | `{ "job_id": "uuid" }` |
| `employee.provisioning.completed` | All integrations provisioned | `{ "duration_ms": 15000 }` |
| `employee.provisioning.failed` | Provisioning failed after retries | `{ "failed_integrations": ["github"], "error": "..." }` |
| `employee.provisioning.retrying` | Failed, retry scheduled | `{ "attempt": 2, "next_retry_at": "..." }` |
| `employee.offboarding.started` | Offboard initiated | `{ "job_id": "uuid" }` |
| `employee.offboarding.completed` | All integrations removed | `{ "duration_ms": 12000 }` |
| `employee.offboarding.failed` | Offboarding failed after retries | `{ "failed_integrations": ["notion"], "error": "..." }` |

#### Integration Sync Events (Per-Employee-Per-Integration)

| Action | Trigger | Metadata |
|---|---|---|
| `integration.sync.started` | Worker begins single integration | `{ "type": "github" }` |
| `integration.sync.completed` | Single integration succeeds | `{ "type": "github", "duration_ms": 5000 }` |
| `integration.sync.failed` | Single integration fails | `{ "type": "github", "error": "..." }` |
| `integration.sync.skipped` | Integration skipped (disconnected) | `{ "type": "notion", "reason": "integration_disconnected" }` |

### Event Naming Convention

`<entity>.<action>[.<result>]`

- `employee.added` — entity.verb (past tense)
- `employee.provisioning.completed` — entity.gerund.result
- `admin.login.failed` — entity.verb.result

### Event Usage

| Consumer | Events Used |
|---|---|
| Activity Log | All events (stored in activity_logs table) |
| Dashboard UI | Recent events displayed in activity log screen |
| Notifications (future) | Provisioning failure events → email/Slack notification |
| Webhooks (future) | Configurable subset of events pushed to external URLs |

## 6. Data Model

- `activity_logs.action` stores the event action string
- `activity_logs.details` stores the event metadata (JSONB)

## 7. API Changes

- GET /api/v1/activity-logs returns events with action, actor, target, metadata

## 8. UI Changes

- Activity log screen displays events with human-readable formatting
- Event metadata shown in expandable detail view

## 9. Security Considerations

- Events never contain sensitive data (passwords, tokens, secrets)
- IP addresses logged for security auditing
- Event metadata scoped to what's useful for audit, not internal implementation

## 10. Error Handling

- Event recording failure must not block the main operation (fire-and-forget)
- If activity log insert fails, the primary operation still completes but warning is logged

## 11. Edge Cases

- Event with large metadata → JSONB efficiently handles variable-size data
- Bulk operations (future: CSV import) → batch event creation
- Event ordering → BIGSERIAL ID and created_at timestamp provide ordering

## 12. Testing Strategy

- Test that every action generates the correct event
- Test event metadata correctness
- Test event creation is fire-and-forget (doesn't block on failure)

## 13. Acceptance Criteria

- Every documented event is emitted for the corresponding action
- Event structure is consistent across all event types
- Activity log contains all events with correct metadata

## 14. Future Improvements

- Webhook delivery system (push events to external URLs)
- Event replay for recovery
- Event schema registry for API consumers
- Dead letter queue for failed webhook deliveries
- Event retention policies
