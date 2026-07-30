# User Personas

## 1. Overview

This document defines the user personas for the SMB Access Manager MVP. Two primary personas exist: the Organization Owner and the Administrator. A third indirect persona is the Employee, who does not interact with the platform directly but is affected by it.

## 2. Purpose

Understanding user personas ensures the product is designed around real user needs, workflows, and constraints.

## 3. Functional Requirements

- Distinguish between Owner and Admin permissions
- Provide appropriate UI for each role
- Support multi-admin collaboration

## 4. Non-functional Requirements

- Role-based access control must be enforced at API and UI levels
- Owner actions should be protected with confirmation dialogs

## 5. Technical Design

### Persona 1: Organization Owner

| Attribute | Detail |
|---|---|
| Name | Alex Chen |
| Role | IT Director / Office Manager |
| Tech Skill | Moderate |
| Organization | 30-person design consultancy |
| Pain Points | Manual onboarding takes 2 hours per new hire; often forgets to revoke access |
| Goals | Automate onboarding and offboarding; gain visibility into who has access to what |
| MVP Tasks | Create org, invite admins, connect integrations, view audit log, delete organization |

### Persona 2: Administrator

| Attribute | Detail |
|---|---|
| Name | Jordan Taylor |
| Role | Operations Manager |
| Tech Skill | Moderate-High |
| Organization | 60-person engineering firm |
| Pain Points | Spends hours each week managing invitations across GitHub and Notion |
| Goals | Manage day-to-day employee access without involving IT Director |
| MVP Tasks | Add employees, assign roles, trigger onboarding/offboarding, view activity logs |

### Persona 3: Employee

| Attribute | Detail |
|---|---|
| Name | Sam Rivera |
| Role | Engineer / Designer |
| Tech Skill | Varies |
| Organization | Any |
| Pain Points | Waiting for access to be provisioned; unclear who to contact |
| Goals | Get access to tools immediately on day one |
| MVP Tasks | None (passive recipient of provisioning actions) |

## 6. Data Model

Users table with `role` enum: `owner`, `admin`, `employee`.

## 7. API Changes

- Owner-only endpoints: DELETE organization, manage other admins
- Admin endpoints: CRUD employees, trigger provisioning
- No employee-facing API in MVP

## 8. UI Changes

- Owner sees "Danger Zone" section with delete organization
- Admin sees employee management and provisioning controls
- No login portal for employees in MVP

## 9. Security Considerations

- Owner cannot be demoted or deleted without transferring ownership
- At least one owner must always exist

## 10. Error Handling

- If last owner tries to delete their account, block with error message
- If owner deletes organization, all active provisioning jobs are cancelled

## 11. Edge Cases

- Owner leaves company → manual transfer of ownership via support (future: transfer flow)
- Admin accidentally offboards wrong employee → activity log provides traceability; manual re-onboarding

## 12. Testing Strategy

- Test that non-owner cannot access owner endpoints
- Test that employee users cannot log into admin dashboard

## 13. Acceptance Criteria

- Owner can invite and remove admins
- Admin cannot delete organization or remove other admins
- Employee has no login to the platform

## 14. Future Improvements

- Granular permission sets (read-only admin, billing admin)
- Employee self-service portal to view their own access
- Role delegation per integration
