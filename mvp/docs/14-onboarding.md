# Onboarding

## 1. Overview

Onboarding is the process of adding an employee and automatically provisioning their access across all connected integrations. This is the primary value proposition of SMB Access Manager.

## 2. Purpose

Automate the manual process of inviting employees to each service individually.

## 3. Functional Requirements

- Trigger onboarding when an employee is added with a role
- Provision access to GitHub Organization (invite + team membership)
- Provision access to Notion workspace (invite)
- Handle partial provisioning (some integrations succeed, some fail)
- Log all provisioning actions

## 4. Non-functional Requirements

- Onboarding provisioning completes within 60 seconds
- Admin is notified of provisioning completion (success or failure)
- Provisioning is idempotent (safe to retry)

## 5. Technical Design

### Onboarding Flow (Detailed)

```
Admin adds employee
  → POST /api/v1/employees
  → Employee created (status: pending)
  → ProvisioningJob created (status: queued, action: provision)
  → ARQ enqueues background job
  → Worker picks up job:
      For each connected integration in the employee's role:
        1. GitHub:
            a. Check if user exists in GitHub (by email)
            b. If not: POST /orgs/{org}/invitations { email }
            c. For each team in role config:
               PUT /orgs/{org}/teams/{slug}/memberships/{username}
            d. Update employee_integration_status (status: active)
        2. Notion:
            a. POST /v1/users/invite { email, name, type: "member" }
            b. Update employee_integration_status (status: active)
      → On all success: employee status → active
      → On partial failure: employee status → failed
      → Update ProvisioningJob (status: completed/failed)
      → Write ActivityLog entry
```

### Provisioning Job States

```
┌─────────┐    ┌─────────┐    ┌───────────┐
│ Queued  │───▶│ Running │───▶│ Completed │
└─────────┘    └─────────┘    └───────────┘
                    │
                    ▼
               ┌─────────┐    ┌─────────┐
               │ Failed  │───▶│ Queued  │ (retry)
               └─────────┘    └─────────┘
```

### Retry Logic

- Max 3 attempts per provisioning job
- Exponential backoff: 5s, 15s, 45s
- After 3 failures: job marked as failed permanently
- Admin can manually retry from UI

### Idempotency

Each integration operation is designed to be idempotent:
- GitHub: inviting an existing member returns 422 → treated as success
- GitHub: adding to team if already member → PUT is idempotent
- Notion: inviting existing member → treated as success

### UI Feedback

- Employee list: status badge updates via HTMX polling (every 5s while provisioning)
- Employee detail: per-integration status visible
- Activity log: each provisioning step recorded

## 6. Data Model

- Employee status transitions: pending → provisioning → active / failed
- employee_integration_status per integration
- ProvisioningJob tracks each attempt

## 7. API Changes

- POST /api/v1/employees triggers onboarding
- GET /api/v1/employees/{id} shows current provisioning state
- POST /api/v1/employees/{id}/retry-provisioning (if failed)

## 8. UI Changes

- Status badge with spinner during provisioning
- Per-integration status in employee detail
- Retry button for failed provisioning

## 9. Security Considerations

- Provisioning uses stored OAuth tokens (encrypted at rest)
- No employee data sent to external services beyond required email/name
- All provisioning actions logged for audit

## 10. Error Handling

- GitHub invitation fails → retry; if permanent failure, mark GitHub integration as failed, continue with other integrations
- Notion invitation fails → retry; if permanent failure, mark Notion as failed
- Network timeout → retry with backoff
- Token expired → mark integration as error, skip provisioning for that integration, notify admin

## 11. Edge Cases

- Employee added before any integration connected → provisioning jobs queued but skip integrations; employee stays "pending" until integrations connected
- Integration disconnected during provisioning → in-flight job fails gracefully for that integration
- Employee added with role that has no integrations → immediate "active" status (nothing to provision)
- Concurrent provisioning for same employee → serialized by employee ID (one job at a time)
- Employee email bounces from GitHub → no mechanism to detect; admin must verify manually

## 12. Testing Strategy

- Test complete provisioning flow with mocked integrations
- Test partial failure (GitHub succeeds, Notion fails)
- Test retry behavior
- Test idempotency (run provisioning twice)
- Test provisioning with no integrations configured
- Test email validation

## 13. Acceptance Criteria

- Adding an employee triggers automatic provisioning
- Provisioning completes within 60 seconds for GitHub + Notion
- Partial failures are handled gracefully
- Admin can see provisioning status in real-time
- Activity log records each provisioning step

## 14. Future Improvements

- Real-time provisioning status via WebSockets (vs. polling)
- Pre-onboarding checklist (employee must accept invitation first)
- Onboarding template (pre-set role + integrations)
- Scheduled onboarding (future start date)
- Employee self-onboarding (employee fills in their own details)
