# Role System

## 1. Overview

The role system is the core abstraction of SMB Access Manager. Roles define what access an employee receives across connected integrations. When an employee is assigned a role, the system provisions the corresponding access automatically.

## 2. Purpose

Roles decouple the concept of "who the employee is" from "what access they get." This allows administrators to define access patterns once and apply them consistently.

## 3. Functional Requirements

- Create, read, update, and delete roles
- Associate integration configs with roles (which services, what permissions)
- Assign a role to employees
- Re-assign a role (triggers re-provisioning)
- Prevent deletion of roles assigned to active employees

## 4. Non-functional Requirements

- Role lookup must be <100ms
- Role changes that affect active employees should be clearly communicated in UI

## 5. Technical Design

### Role Structure

```
Role "Engineer"
├── GitHub Integration
│   ├── Teams: ["Engineering", "Core-Dev"]
│   └── Access Level: "member"
└── Notion Integration
    └── Permission Level: "member"
```

### Permission Levels

For MVP, each integration type has a fixed set of permission levels:

| Integration | Permission Levels | Description |
|---|---|---|
| GitHub | member | Standard org member; can be added to teams |
| GitHub | admin | Org owner (not used for employees; reserved) |
| Notion | member | Standard workspace member |

Future integrations will define their own permission levels.

### Provisioning on Role Change

When an employee's role changes:
1. Deprovision old role's access (remove from old GitHub teams)
2. Provision new role's access (add to new GitHub teams)
3. If integration config unchanged between old and new role, skip that integration

### Role Deletion Protection

- Roles assigned to active employees cannot be deleted
- Admin must re-assign or offboard those employees first
- API returns 409 CONFLICT with list of affected employees

## 6. Data Model

### roles table
- id, organization_id, name, description, is_active

### role_integrations table
- id, role_id, integration_type, config (JSONB)

### employees.role_id
- Foreign key to roles.id (nullable)

## 7. API Changes

- GET /api/v1/roles — list roles (with employee count)
- POST /api/v1/roles — create role
- GET /api/v1/roles/{id} — get role details
- PATCH /api/v1/roles/{id} — update role
- DELETE /api/v1/roles/{id} — delete role (with protection)

## 8. UI Changes

- Roles list page with employee count per role
- Role creation form with dynamic integration config fields
- Role edit page
- Role deletion with confirmation and error if assigned
- Role selector on employee creation/edit form

## 9. Security Considerations

- Admins can only create/assign roles within their own organization
- Role data is isolated per organization
- Deleted roles (soft-delete) cannot be assigned to new employees

## 10. Error Handling

- Delete role assigned to active employees → 409 with employee list
- Create role with duplicate name → 409 CONFLICT
- Update role to empty integrations → 422 VALIDATION_ERROR
- Assign role from different organization → 404 (role not found)

## 11. Edge Cases

- Role renamed → existing employees inherit new name (no re-provisioning needed)
- Integration disconnected → role still has the config; provisioning for that integration fails with clear error
- Role deleted while employee is offboarding → offboarding still proceeds; employee's role_id set to NULL
- Role config references a GitHub team that was deleted → provisioning fails; admin must update role

## 12. Testing Strategy

- CRUD operations for roles
- Role deletion protection with active employees
- Role re-assignment triggers correct provisioning/deprovisioning
- Duplicate role name within organization
- Role with no integrations (valid but no-op)

## 13. Acceptance Criteria

- Admin can create a role with GitHub and Notion integration config
- Admin can assign role to employee and provisioning uses the role config
- Admin cannot delete a role that is actively assigned
- Admin can edit a role and changes take effect on next provisioning
- Role list shows employee count

## 14. Future Improvements

- Role templates (predefined roles for common patterns)
- Role hierarchy / inheritance
- Permission level granularity (read-only, read-write, admin per integration)
- Role cloning
- Bulk role assignment
- Role versioning with change history
