# User Flows

## 1. Overview

This document describes the primary user flows for the SMB Access Manager MVP. Each flow traces a complete interaction from start to finish, including decision points, error states, and system actions.

## 2. Purpose

Mapping user flows ensures complete coverage of the product experience before implementation begins. Flows are referenced by API and UI design documents.

## 3. Functional Requirements

- Flows must handle success and failure paths
- Flows must account for system actions (background provisioning)
- All state transitions must be logged

## 4. Non-functional Requirements

- Flows should complete in under 60 seconds for synchronous steps
- Background provisioning should show progress feedback

## 5. Technical Design

### Flow 1: Organization Signup

```
User visits /signup
  → Enters email, password, organization name
  → System creates Organization (unverified)
  → System creates User (role=owner)
  → System sends verification email
  → User clicks verification link
  → Organization becomes active
  → User redirected to dashboard
```

### Flow 2: Invite Administrator

```
Owner navigates to Settings → Administrators → "Invite Admin"
  → Enters admin email address
  → System creates User with role=admin (status=pending)
  → System sends invitation email with magic link
  → Admin clicks link
  → Admin sets password
  → Admin redirected to dashboard
```

### Flow 3: Connect GitHub

```
Admin navigates to Integrations → GitHub → "Connect"
  → Redirected to GitHub OAuth authorization page
  → Admin grants Org permissions
  → GitHub redirects back to callback URL
  → System stores encrypted access token
  → System verifies org membership
  → Integration marked as active
  → Admin sees connected org details
```

### Flow 4: Connect Notion

```
Admin navigates to Integrations → Notion → "Connect"
  → Redirected to Notion OAuth authorization page
  → Admin grants workspace access
  → Notion redirects back to callback URL
  → System stores encrypted access token
  → Integration marked as active
  → Admin sees connected workspace details
```

### Flow 5: Create Role

```
Admin navigates to Roles → "Create Role"
  → Enters role name (e.g., "Engineer")
  → Selects connected integrations
  → For GitHub: selects team(s) and permission level
  → For Notion: selects workspace permission level
  → System creates Role
  → Role appears in role list
```

### Flow 6: Add Employee & Assign Role

```
Admin navigates to Employees → "Add Employee"
  → Enters employee name, email
  → Selects role from dropdown
  → System creates Employee (status=pending)
  → System triggers provisioning job:
      1. GitHub: invite to org, add to teams
      2. Notion: invite to workspace
  → Employee status → provisioning
  → On success: Employee status → active
  → On failure: Employee status → failed, error logged
  → Admin sees status in employee list
```

### Flow 7: Offboard Employee

```
Admin navigates to Employees → selects employee → "Offboard"
  → Confirmation dialog appears
  → Admin confirms
  → System triggers deprovisioning job:
      1. GitHub: remove from teams, remove from org
      2. Notion: remove from workspace
  → Employee status → offboarding
  → On success: Employee status → offboarded
  → On failure: status → offboarding_failed, error logged
  → Activity log records all actions
```

### Flow 8: View Activity Log

```
Admin navigates to Activity Log
  → System fetches paginated log entries
  → Entries show: timestamp, actor, action, target, status
  → Admin can filter by action type, date range, actor
  → Admin can view detailed entry
```

## 6. Data Model

- Employee has status: `pending`, `provisioning`, `active`, `offboarding`, `offboarded`, `failed`
- ProvisioningJob has status: `queued`, `running`, `completed`, `failed`
- ActivityLog records action type, actor ID, target type, target ID, metadata, timestamp

## 7. API Changes

- `POST /api/organizations` — signup
- `POST /api/organizations/{id}/invite-admin` — invite admin
- `GET /api/integrations/github/auth-url` — start OAuth
- `GET /api/integrations/github/callback` — OAuth callback
- `GET /api/integrations/notion/auth-url` — start OAuth
- `GET /api/integrations/notion/callback` — OAuth callback
- `POST /api/roles` — create role
- `POST /api/employees` — add employee
- `POST /api/employees/{id}/offboard` — offboard
- `GET /api/activity-logs` — list logs

## 8. UI Changes

*Covered in full in screen-specific documents (12–16).*

## 9. Security Considerations

- OAuth flow must use state parameter to prevent CSRF
- Invitation links must expire (48 hours)
- Offboarding must require explicit confirmation

## 10. Error Handling

- OAuth flow failure → redirect to integrations page with error banner
- Provisioning failure → retry 3 times, then mark as failed, log error
- Email delivery failure → admin can resend invitation from UI

## 11. Edge Cases

- Employee added before integration connected → provisioning queued; auto-runs when integration connects
- Employee already exists in GitHub → system detects and skips invitation
- Offboarding employee who was never fully provisioned → skip provisioning steps, mark as offboarded

## 12. Testing Strategy

- End-to-end test for complete add → provision → offboard flow
- Test OAuth callback with invalid state parameter
- Test provisioning retry behavior

## 13. Acceptance Criteria

- All flows complete without manual intervention
- Provisioning completes within 60 seconds
- Activity log records every flow with complete detail

## 14. Future Improvements

- Bulk import employees via CSV
- Scheduled offboarding (future departure date)
- Self-service onboarding with employee accepting invitation
- Approval workflows for provisioning
