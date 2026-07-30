# Offboarding

## 1. Overview

Offboarding is the process of revoking an employee's access across all connected integrations. It is triggered manually by an administrator and is designed to be complete and irreversible.

## 2. Purpose

Ensure that departing employees lose access to company resources immediately, reducing security risk.

## 3. Functional Requirements

- Remove employee from GitHub Organization
- Remove employee from GitHub Teams
- Remove employee from Notion workspace
- Handle partial deprovisioning
- Log all deprovisioning actions
- Prevent accidental offboarding with confirmation dialog

## 4. Non-functional Requirements

- Offboarding completes within 60 seconds
- Offboarding is idempotent (safe to retry)
- Cannot be undone (employee must be re-added manually)

## 5. Technical Design

### Offboarding Flow (Detailed)

```
Admin clicks "Offboard" on employee
  → Confirmation dialog
  → Admin confirms
  → POST /api/v1/employees/{id}/offboard
  → Employee status → offboarding
  → DeprovisioningJob created (status: queued, action: deprovision)
  → ARQ enqueues background job
  → Worker picks up job:
      For each connected integration in the employee's role:
        1. GitHub:
            a. For each team: DELETE /orgs/{org}/teams/{slug}/memberships/{username}
            b. DELETE /orgs/{org}/members/{username}
            c. Update employee_integration_status (status: removed)
        2. Notion:
            a. PATCH /v1/users/{user_id} { type: "removed" }
            b. Update employee_integration_status (status: removed)
      → On all success: employee status → offboarded
      → On partial failure: employee status → offboarding_failed
      → Update DeprovisioningJob (status: completed/failed)
      → Write ActivityLog entry
```

### GitHub Deprovisioning Order

1. Remove from teams first (fine-grained)
2. Remove from organization last (coarse-grained)

This ensures that if removing from the org fails, the user is at least removed from teams.

### Notion Deprovisioning

Notion uses a "removed" user type rather than true deletion. The user will no longer have access to the workspace. Their content remains but is orphaned.

### Employee Status After Offboarding

- Status set to `offboarded`
- Employee record retained for audit purposes
- All active provisioning jobs cancelled
- Employee no longer appears in "active" counts

### Offboarding Verification

After deprovisioning operations, worker verifies:
- GitHub: GET /orgs/{org}/members/{username} → expects 404
- Notion: GET /v1/users/{user_id} → expects type: "removed"

## 6. Data Model

- Employee status: offboarding → offboarded / offboarding_failed
- Employee.offboarded_at timestamp set on completion
- employee_integration_status per integration set to "removed"

## 7. API Changes

- POST /api/v1/employees/{id}/offboard — trigger offboarding
- Retry endpoint: POST /api/v1/employees/{id}/retry-offboarding (if failed)

## 8. UI Changes

- Offboard button with confirmation dialog
- Offboarding in-progress spinner
- Offboarding failed status with retry button
- Offboarded employees shown in list with "Offboarded" badge (filterable)
- Offboarded employee detail shows offboarded date and per-integration removal status

## 9. Security Considerations

- Confirmation dialog prevents accidental offboarding
- Offboarding cannot be cancelled once started (design decision for security)
- Only owners and admins can offboard
- Offboarding is irreversible by design

## 10. Error Handling

- GitHub API error during removal → retry; if permanent, mark as offboarding_failed
- Notion API error → retry; if permanent, mark as offboarding_failed
- Employee already offboarded → return 400 with "Employee already offboarded"
- Offboarding already in progress → return 409

## 11. Edge Cases

- Employee never fully provisioned (status: pending or failed) → offboarding skips integration steps, marks as offboarded
- Integration disconnected → skip that integration, continue with others
- Employee already removed from GitHub manually → GitHub returns 404 on remove; treat as success
- Employee's GitHub account deleted → GitHub returns 404; treat as success (already removed)
- Offboarding the last active admin → allowed; only protects owner from removal via admin management

## 12. Testing Strategy

- Test complete offboarding flow with mocked integrations
- Test offboarding a partially-provisioned employee
- Test offboarding with disconnected integration
- Test offboarding confirmation dialog
- Test retry of failed offboarding

## 13. Acceptance Criteria

- Offboarding removes employee from GitHub Organization and teams
- Offboarding removes employee from Notion workspace
- Offboarding completes within 60 seconds
- Activity log records all offboarding actions
- Employee can be re-added after offboarding

## 14. Future Improvements

- Scheduled offboarding (set departure date in advance)
- Offboarding checklist (tasks beyond access revocation)
- Offboarding report (summary of what was revoked)
- Data export before offboarding (download employee's content)
- Manager notification on offboarding completion
