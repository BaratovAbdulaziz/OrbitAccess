# Employee Management

## 1. Overview

The employee management screens allow administrators to view, add, edit, and offboard employees. This is the primary day-to-day interface for admins.

## 2. Purpose

Provide a complete interface for managing the employee lifecycle.

## 3. Functional Requirements

- List all employees with search and filter
- Add new employee with name, email, and role
- View employee details including provisioning status per integration
- Edit employee details
- Offboard employee with confirmation
- View provisioning history for an employee

## 4. Non-functional Requirements

- Employee list pagination (20 per page)
- Search debounced (300ms)
- Real-time status updates via HTMX polling for in-progress provisioning

## 5. Technical Design

### Employee List Screen

```
┌─────────────────────────────────────────────────┐
│  Employees                          [+ Add]     │
├─────────────────────────────────────────────────┤
│  [Search...]    [Filter: All]    [Role: All]     │
├─────────────────────────────────────────────────┤
│  Name            Email          Status    Role   │
│  ─────────────────────────────────────────────  │
│  Sam Rivera   sam@acme.com   ● Active   Eng    │
│  Jane Doe     jane@acme.com  ○ Pending  Design │
│  Bob Smith    bob@acme.com   ◐ Prov..   Eng    │  ← with spinner
│  ...                                            │
├─────────────────────────────────────────────────┤
│  Page 1 of 5  [<] [1] [2] [3] [4] [5] [>]      │
└─────────────────────────────────────────────────┘
```

### Components

| Component | Description | States |
|---|---|---|
| EmployeeTable | Table with sortable columns | Loading, empty, loaded |
| EmployeeRow | Name, email, status badge, role, actions | Active, pending, provisioning, failed, offboarded |
| StatusBadge | Color-coded status indicator | ● Active (green), ○ Pending (gray), ◐ Provisioning (blue/spinner), ✕ Failed (red), ○ Offboarded (gray) |
| AddEmployeeModal | Form with name, email, role dropdown | Open, submitting, validation error, server error |
| SearchBar | Text input with debounce | Empty, has query |
| FilterDropdown | Filter by status or role | — |

### States

- **Loading**: Skeleton table rows
- **Empty**: "No employees yet. Add your first employee to get started."
- **Loaded**: Table with employee data
- **Error**: Error banner with retry

### Add Employee Modal

```
┌─────────────────────────────────┐
│  Add Employee                   │
├─────────────────────────────────┤
│  Full Name   [________________] │
│  Email       [________________] │
│  Role        [Engineer       ▼] │
│  ─────────────────────────────  │
│  [Cancel]           [Add Employee] │
└─────────────────────────────────┘
```

- Name: required, 1–255 chars
- Email: required, valid email format
- Role: required, dropdown of active roles
- [Add Employee] button disabled until all required fields filled
- On submit: button shows loading spinner
- On success: modal closes, table refreshes, new employee shown with provisioning status

### Employee Detail Screen

```
┌──────────────────────────────────────────┐
│  Sam Rivera                   [Edit] [⋮] │
├──────────────────────────────────────────┤
│  Email:    sam@acme.com                  │
│  Role:     Engineer                      │
│  Status:   ● Active                      │
│  Created:  2025-06-10                    │
│                                          │
│  Integration Status                      │
│  ┌────────────────────────────────┐     │
│  │ GitHub  ● Active   acme-org   │     │
│  │ Notion  ● Active   Workspace  │     │
│  └────────────────────────────────┘     │
│                                          │
│  Provisioning History                    │
│  ┌────────────────────────────────┐     │
│  │ 10:00 Provision → Completed    │     │
│  │ 09:55 Provision → Started      │     │
│  │ 09:50 Provision → Queued       │     │
│  └────────────────────────────────┘     │
└──────────────────────────────────────────┘
```

### Offboarding Flow

1. Admin clicks "Offboard" from employee detail or row menu
2. Confirmation dialog appears:
   ```
   ┌──────────────────────────────────────┐
   │  Offboard Sam Rivera?                │
   │                                      │
   │  This will remove access from:       │
   │  • GitHub Organization (acme-org)    │
   │  • Notion Workspace                  │
   │                                      │
   │  [Cancel]    [Confirm Offboard]      │
   └──────────────────────────────────────┘
   ```
3. On confirm: employee status → "offboarding", API called
4. UI updates to show offboarding in progress

## 6. Data Model

- employees table with status field
- employee_integration_status for per-integration provisioning state
- provisioning_jobs for history

## 7. API Changes

- GET /api/v1/employees — list with search, filter, pagination
- POST /api/v1/employees — create + trigger provisioning
- GET /api/v1/employees/{id} — detail
- PATCH /api/v1/employees/{id} — update
- POST /api/v1/employees/{id}/offboard — offboard

## 8. UI Changes

This document defines the employee management screens.

## 9. Security Considerations

- Offboarding requires explicit confirmation
- Employee data isolated per organization

## 10. Error Handling

- Add employee → server validation errors shown inline
- Provisioning failure → status badge shows "Failed" with tooltip showing error
- Offboard failure → status shows "Offboarding Failed" with retry option

## 11. Edge Cases

- Employee added with unverified email → provisioning proceeds (email is for the service, not for login)
- Duplicate email in same org → inline error: "An employee with this email already exists"
- Role deleted while employee has it → employee shows role as "Unknown" with warning
- Employee already offboarded → offboard button hidden; status says "Offboarded on 2025-06-10"

## 12. Testing Strategy

- Employee CRUD operations
- Search and filter behavior
- Status transitions (pending → provisioning → active → offboarding → offboarded)
- Offboarding confirmation flow
- Error handling for duplicate email

## 13. Acceptance Criteria

- Admin can view employee list with search and filter
- Admin can add employee with role
- Employee status updates in real-time during provisioning
- Admin can offboard with confirmation
- Employee detail shows per-integration status

## 14. Future Improvements

- Bulk employee import (CSV)
- Bulk offboarding
- Employee self-service portal
- Department/team grouping beyond roles
- Employee notes/tags
