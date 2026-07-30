# Activity Logs

## 1. Overview

The activity log provides an immutable, searchable audit trail of every significant action performed within the system. It is the source of truth for "who did what and when."

## 2. Purpose

Provide administrators with visibility into all provisioning and management actions for security auditing and operational troubleshooting.

## 3. Functional Requirements

- Record all provisioning and deprovisioning actions
- Record all employee management actions
- Record integration connection/disconnection
- Record admin management actions
- Support paginated viewing
- Support filtering by action type, date range, and actor
- Entries are append-only and immutable

## 4. Non-functional Requirements

- Queries return in under 500ms for paginated results
- Log retention: minimum 1 year (or indefinite for MVP)
- No DELETE or UPDATE operations permitted on log entries

## 5. Technical Design

### Log Entry Structure

Each log entry captures:
- **id**: BIGSERIAL (sequential, unique)
- **organization_id**: FK to organizations
- **actor_id**: UUID of the admin who performed the action
- **actor_name**: Denormalized admin name (survives admin deletion)
- **action**: Machine-readable action key
- **target_type**: Type of resource affected
- **target_id**: UUID of the affected resource
- **target_name**: Denormalized resource name (survives deletion)
- **details**: JSONB with action-specific metadata
- **ip_address**: Request origin IP
- **created_at**: Timestamp

### Action Types

| Action Key | Description |
|---|---|
| `organization.created` | Organization signup |
| `organization.updated` | Organization settings changed |
| `organization.deleted` | Organization deleted |
| `admin.invited` | Admin invitation sent |
| `admin.accepted` | Admin accepted invitation |
| `admin.removed` | Admin removed from organization |
| `integration.connected` | Integration connected (GitHub/Notion) |
| `integration.disconnected` | Integration disconnected |
| `integration.error` | Integration entered error state |
| `role.created` | Role created |
| `role.updated` | Role updated |
| `role.deleted` | Role deleted |
| `employee.added` | Employee added (onboarding started) |
| `employee.updated` | Employee details changed |
| `employee.role_changed` | Employee role reassigned |
| `employee.provisioning.completed` | Provisioning succeeded |
| `employee.provisioning.failed` | Provisioning failed |
| `employee.offboarding.started` | Offboarding initiated |
| `employee.offboarding.completed` | Offboarding succeeded |
| `employee.offboarding.failed` | Offboarding failed |

### Append-Only Enforcement

At the application layer:
- `activity_logs` table has no UPDATE or DELETE routes
- Repository layer only implements `insert` and `select` methods
- Database permissions: application DB user has INSERT and SELECT only on this table

At the database layer:
- `REVOKE UPDATE, DELETE ON activity_logs FROM app_user;`
- Trigger to prevent UPDATE/DELETE (defense in depth)

### Activity Log Screen

```
┌──────────────────────────────────────────────┐
│  Activity Log                    [Export]     │
├──────────────────────────────────────────────┤
│  [Action: All ▼]  [From: _____] [To: _____]  │
│  [Actor: All ▼]                    [Apply]   │
├──────────────────────────────────────────────┤
│  Time              Actor         Action       │
│  ─────────────────────────────────────────── │
│  2025-06-10 10:00  Alex Chen    Added        │
│                                  Sam Rivera   │
│  2025-06-10 09:45  Jordan T.    Offboarded   │
│                                  Jane Doe     │
│  2025-06-10 09:30  Alex Chen    Connected    │
│                                  GitHub Org   │
│  ...                                          │
├──────────────────────────────────────────────┤
│  Page 1 of 25  [<] [1] [2] [3] ... [25] [>]  │
└──────────────────────────────────────────────┘
```

### Components

| Component | Description | States |
|---|---|---|
| FilterBar | Action type dropdown, date range picker, actor dropdown | — |
| LogTable | Paginated table of log entries | Loading, empty, loaded |
| LogRow | Timestamp, actor, action, target, expandable details | — |
| DetailPanel | Expanded view showing full JSON details | Expanded, collapsed |

### States

- **Loading**: Skeleton rows
- **Empty**: "No activity logged yet. Actions will appear here as you manage your organization."
- **Filtered empty**: "No activity matches your filters. Try adjusting your search criteria."

## 6. Data Model

- `activity_logs` table (see `06-database-design.md`)
- Indexed on (organization_id, created_at DESC) for efficient queries
- Indexed on (organization_id, action) for filtered queries

## 7. API Changes

- GET /api/v1/activity-logs — list with pagination and filters

## 8. UI Changes

This document defines the activity log screen.

## 9. Security Considerations

- Logs are append-only; tampering is detectable
- IP addresses logged for forensic purposes
- Only within-organization logs visible to admins
- Owner can view all logs; admin can view all logs (no restriction)

## 10. Error Handling

- Database error fetching logs → error banner with retry
- Invalid date range → inline validation error
- Rate limit exceeded on log query → 429 response

## 11. Edge Cases

- Organization with 100K+ log entries → pagination ensures reasonable response times
- Actor deleted → actor_name still visible (denormalized)
- Target deleted → target_name still visible (denormalized)
- Clock skew → created_at uses database time (now()) for consistency
- Concurrent log writes → sequential BIGSERIAL IDs ensure ordering

## 12. Testing Strategy

- Test that all actions generate log entries
- Test log queries with various filter combinations
- Test pagination
- Verify append-only enforcement (attempt UPDATE/DELETE)
- Test log query performance with large datasets

## 13. Acceptance Criteria

- Every significant action recorded in activity log
- Log entries are immutable (no delete/modify)
- Admin can browse logs with pagination
- Admin can filter by action, date range, and actor
- Log entries show actor, action, target, and timestamp

## 14. Future Improvements

- CSV/PDF export
- Log retention policies (auto-archive after N months)
- Structured log viewer with JSON syntax highlighting
- Webhook events for log entries (SIEM integration)
- Log entry annotations (admin can add notes)
- Realtime log streaming via Server-Sent Events
