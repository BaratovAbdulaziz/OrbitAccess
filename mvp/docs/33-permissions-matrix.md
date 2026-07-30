# Permissions Matrix

## 1. Overview

Defines the authorization model for the SMB Access Manager MVP. Maps user roles to actions and resources.

## 2. Purpose

Provide a single reference for what each user role can do. Enforce consistently at API and UI levels.

## 3. Functional Requirements

- Owner has full access to all resources
- Admin has operational access but cannot manage other admins or delete the organization
- Roles are enforced at the API layer (not just UI)

## 4. Non-functional Requirements

- Permission check overhead <5ms per request
- Permission logic must be centralized (not duplicated across routes)

## 5. Technical Design

### Role Definitions

| Role | Scope | Description |
|---|---|---|
| `owner` | Organization | Full control. Created during signup. Can manage admins, delete org. |
| `admin` | Organization | Operational control. Can manage employees, roles, integrations, view logs. |

### Permissions Matrix

| Action | Resource | Owner | Admin |
|---|---|---|---|
| **Organization** | | | |
| View | Organization | ✅ | ✅ |
| Update name/email | Organization | ✅ | ❌ |
| Delete | Organization | ✅ | ❌ |
| **Admins** | | | |
| List | Admins | ✅ | ❌ |
| Invite | Admins | ✅ | ❌ |
| Remove | Admins | ✅ | ❌ |
| **Integrations** | | | |
| List | Integrations | ✅ | ✅ |
| Connect | Integration | ✅ | ✅ |
| Disconnect | Integration | ✅ | ✅ |
| **Roles** | | | |
| List | Roles | ✅ | ✅ |
| View | Role | ✅ | ✅ |
| Create | Role | ✅ | ✅ |
| Update | Role | ✅ | ✅ |
| Delete | Role | ✅ | ✅ |
| **Employees** | | | |
| List | Employees | ✅ | ✅ |
| View | Employee | ✅ | ✅ |
| Create | Employee | ✅ | ✅ |
| Update | Employee | ✅ | ✅ |
| Offboard | Employee | ✅ | ✅ |
| **Activity Logs** | | | |
| View | Activity Logs | ✅ | ✅ |
| Export | Activity Logs | ✅ | ✅ |

### Permission Enforcement

```python
# app/api/deps.py

async def require_owner(
    current_user: User = Depends(require_auth),
) -> User:
    if current_user.role != UserRole.OWNER:
        raise ForbiddenException("Only organization owners can perform this action")
    return current_user

async def require_admin_or_owner(
    current_user: User = Depends(require_auth),
) -> User:
    # All authenticated non-employee users have at least admin role
    return current_user
```

### Route-Level Usage

```python
# Owner-only endpoints
@router.delete("/organizations/me")
async def delete_organization(
    org_service: OrganizationService = Depends(),
    current_user: User = Depends(require_owner),
):
    ...

# Admin-accessible endpoints
@router.get("/employees")
async def list_employees(
    org_service: OrganizationService = Depends(),
    current_user: User = Depends(require_admin_or_owner),
):
    ...
```

### UI Enforcement

- Owner-only actions (Delete Organization, Manage Admins) only rendered for owner users
- Admin users see grayed-out or hidden buttons for restricted actions
- API enforcement is the source of truth — UI hiding is UX convenience, not security

### Data Isolation

- All queries are scoped to `organization_id`
- Cross-organization access is impossible by design
- Organization ID is derived from the authenticated user's session, not from request parameters

```python
# All service methods filter by organization_id from the authenticated user
async def list_employees(
    self,
    organization_id: uuid.UUID,  # From current_user.organization_id
    ...
):
    stmt = select(Employee).where(
        Employee.organization_id == organization_id,
        Employee.is_active == True,
    )
```

## 6. Data Model

Users table has `role` column: `owner` or `admin`.

## 7. API Changes

- Owner-only endpoints return 403 FORBIDDEN for admin users
- Owner-only UI sections hidden/disabled for admin users

## 8. UI Changes

- Owner sees "Danger Zone" section in Settings (Delete Organization)
- Owner sees "Administrators" menu item
- Admin sees "Admins" option as read-only or hidden

## 9. Security Considerations

- Authorization is enforced at the API layer (not just UI)
- Default-deny: if a permission is not explicitly granted, it is denied
- Organization ID is never taken from user input — always from authenticated session

## 10. Error Handling

- Forbidden → 403 with `FORBIDDEN` code and "You do not have permission to perform this action"
- No indication of whether the resource exists (prevents enumeration attacks)

## 11. Edge Cases

- Admin cannot remove the last owner (protected in service layer)
- Owner cannot demote themselves to admin (must transfer ownership first — future feature)
- Offboarding an employee does not require special permissions beyond admin

## 12. Testing Strategy

- Test every permission for both owner and admin roles
- Test that unauthenticated requests return 401 (not 403)
- Test that admin cannot access owner-only endpoints
- Test cross-organization isolation

## 13. Acceptance Criteria

- Owner has full access to all features
- Admin has operational access but cannot manage admins or delete org
- All permission checks pass
- Cross-org data access returns 404 (not 403) to prevent enumeration

## 14. Future Improvements

- Granular admin permissions (read-only, billing admin, integrations admin)
- Role-based access for API tokens
- Audit log for permission changes
- Temporary permission elevation (break-glass)
