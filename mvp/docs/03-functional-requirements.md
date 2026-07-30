# Functional Requirements

## 1. Overview

This document enumerates every functional requirement for the SMB Access Manager MVP. Requirements are grouped by domain and numbered for traceability.

## 2. Purpose

Provides a complete specification that can be traced to implementation, tests, and acceptance criteria.

## 3. Functional Requirements

### Organization Management

| ID | Requirement | Priority |
|---|---|---|
| F-ORG-01 | System shall allow a user to create an organization with name and email | P0 |
| F-ORG-02 | System shall send a verification email after organization creation | P0 |
| F-ORG-03 | System shall allow the owner to view organization settings | P0 |
| F-ORG-04 | System shall allow the owner to update organization name | P1 |
| F-ORG-05 | System shall allow the owner to delete the organization and all associated data | P0 |
| F-ORG-06 | System shall require confirmation before organization deletion | P0 |

### Administrator Management

| ID | Requirement | Priority |
|---|---|---|
| F-ADM-01 | System shall allow the owner to invite an administrator by email | P0 |
| F-ADM-02 | System shall send an invitation email with a magic link | P0 |
| F-ADM-03 | Invitation links shall expire after 48 hours | P0 |
| F-ADM-04 | System shall allow the owner to revoke an admin invitation | P1 |
| F-ADM-05 | System shall allow the owner to remove an administrator | P0 |
| F-ADM-06 | System shall not allow removal of the last owner | P0 |

### Authentication

| ID | Requirement | Priority |
|---|---|---|
| F-AUTH-01 | System shall authenticate users via email and password | P0 |
| F-AUTH-02 | System shall support session-based authentication | P0 |
| F-AUTH-03 | System shall allow password reset via email | P1 |
| F-AUTH-04 | Sessions shall expire after 24 hours of inactivity | P0 |
| F-AUTH-05 | System shall lock account after 5 failed login attempts (15 min cooldown) | P1 |

### GitHub Integration

| ID | Requirement | Priority |
|---|---|---|
| F-GH-01 | System shall support OAuth 2.0 to connect a GitHub Organization | P0 |
| F-GH-02 | System shall store the OAuth token encrypted at rest | P0 |
| F-GH-03 | System shall display the connected GitHub organization name | P0 |
| F-GH-04 | System shall allow disconnecting GitHub integration | P0 |
| F-GH-05 | System shall invite an employee to the GitHub Organization as a member | P0 |
| F-GH-06 | System shall add an employee to specified GitHub Teams | P0 |
| F-GH-07 | System shall remove an employee from GitHub Teams on role change | P1 |
| F-GH-08 | System shall remove an employee from the GitHub Organization on offboarding | P0 |
| F-GH-09 | System shall detect when OAuth token is invalid and mark integration as error | P0 |

### Notion Integration

| ID | Requirement | Priority |
|---|---|---|
| F-NT-01 | System shall support OAuth 2.0 to connect a Notion workspace | P0 |
| F-NT-02 | System shall store the OAuth token encrypted at rest | P0 |
| F-NT-03 | System shall display the connected Notion workspace name | P0 |
| F-NT-04 | System shall allow disconnecting Notion integration | P0 |
| F-NT-05 | System shall invite an employee to the Notion workspace as a member | P0 |
| F-NT-06 | System shall assign appropriate permission level to the employee | P1 |
| F-NT-07 | System shall remove an employee from the Notion workspace on offboarding | P0 |

### Role Management

| ID | Requirement | Priority |
|---|---|---|
| F-ROL-01 | System shall allow an admin to create a role with a name | P0 |
| F-ROL-02 | System shall allow associating integrations with a role | P0 |
| F-ROL-03 | For GitHub, roles shall specify team(s) and access level | P0 |
| F-ROL-04 | For Notion, roles shall specify workspace permission level | P0 |
| F-ROL-05 | System shall allow editing a role | P1 |
| F-ROL-06 | System shall allow deleting a role not assigned to any employee | P1 |
| F-ROL-07 | System shall prevent deletion of a role that is currently assigned | P1 |

### Employee Management

| ID | Requirement | Priority |
|---|---|---|
| F-EMP-01 | System shall allow an admin to add an employee by name and email | P0 |
| F-EMP-02 | System shall allow assigning a role to an employee at creation | P0 |
| F-EMP-03 | System shall display employee status (pending, provisioning, active, failed) | P0 |
| F-EMP-04 | System shall allow changing an employee's role | P1 |
| F-EMP-05 | System shall allow removing/offboarding an employee | P0 |
| F-EMP-06 | System shall allow editing employee name and email | P1 |
| F-EMP-07 | System shall display a list of all employees with search/filter | P0 |

### Provisioning

| ID | Requirement | Priority |
|---|---|---|
| F-PROV-01 | Adding an employee shall trigger automatic provisioning to all connected integrations | P0 |
| F-PROV-02 | Offboarding an employee shall trigger automatic deprovisioning from all connected integrations | P0 |
| F-PROV-03 | Provisioning jobs shall run with retry (max 3 attempts) | P0 |
| F-PROV-04 | Provisioning failures shall be logged and surfaced to admin | P0 |
| F-PROV-05 | System shall process provisioning jobs asynchronously | P0 |
| F-PROV-06 | Provisioning jobs shall be serialized per employee (one at a time) | P1 |

### Activity Logging

| ID | Requirement | Priority |
|---|---|---|
| F-LOG-01 | System shall log all provisioning and deprovisioning actions | P0 |
| F-LOG-02 | Log entries shall include: timestamp, actor, action, target, status, details | P0 |
| F-LOG-03 | System shall display paginated activity log | P0 |
| F-LOG-04 | System shall support filtering logs by action type, date range, and actor | P1 |
| F-LOG-05 | Log entries shall be append-only and immutable | P0 |

## 4. Non-functional Requirements

*Covered in `04-non-functional-requirements.md`.*

## 5. Technical Design

*Covered in `05-system-architecture.md`.*

## 6. Data Model

*Covered in `06-database-design.md`.*

## 7. API Changes

*Covered in `07-api-design.md`.*

## 8. UI Changes

*Covered in screen-specific documents.*

## 9. Security Considerations

- Email verification prevents org creation with fake emails
- Session timeout limits exposure from unattended sessions
- OAuth token encryption limits damage from database breach

## 10. Error Handling

- Every requirement that involves an external service must handle timeout, auth failure, and rate limit errors
- Provisioning failures are always surfaced to the admin

## 11. Edge Cases

- Duplicate email for employee → return error with message that employee already exists
- Integration disconnected during provisioning → mark provisioning as failed with clear message
- Role deleted while employees assigned → employees retain role reference; role marked as deleted

## 12. Testing Strategy

- Each requirement has at least one corresponding test
- Critical flows (F-PROV-01, F-PROV-02) have end-to-end tests

## 13. Acceptance Criteria

- All P0 requirements pass verification
- P1 requirements are documented but may be deferred

## 14. Future Improvements

- Webhook-triggered provisioning for real-time sync
- Bulk operations (import/export employees)
- Scheduled provisioning (future-dated activation)
