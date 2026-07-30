# API Overview Diagram

```mermaid
graph LR
    subgraph Auth["Authentication"]
        Signup["POST /auth/signup"]
        Login["POST /auth/login"]
        Logout["POST /auth/logout"]
        AcceptInvitation["POST /auth/accept-invitation"]
        ForgotPassword["POST /auth/forgot-password"]
        ResetPassword["POST /auth/reset-password"]
    end
    
    subgraph Organization["Organization Management"]
        GetOrg["GET /organizations/me"]
        UpdateOrg["PATCH /organizations/me"]
        DeleteOrg["DELETE /organizations/me"]
    end
    
    subgraph Admins["Admin Management"]
        ListAdmins["GET /admins"]
        InviteAdmin["POST /admins/invite"]
        RemoveAdmin["DELETE /admins/{id}"]
    end
    
    subgraph Integrations["Integrations"]
        ListIntegrations["GET /integrations"]
        GitHubAuth["GET /integrations/github/auth-url"]
        GitHubCallback["GET /integrations/github/callback"]
        GitHubDisconnect["POST /integrations/github/disconnect"]
        NotionAuth["GET /integrations/notion/auth-url"]
        NotionCallback["GET /integrations/notion/callback"]
        NotionDisconnect["POST /integrations/notion/disconnect"]
    end
    
    subgraph Roles["Role Management"]
        ListRoles["GET /roles"]
        CreateRole["POST /roles"]
        GetRole["GET /roles/{id}"]
        UpdateRole["PATCH /roles/{id}"]
        DeleteRole["DELETE /roles/{id}"]
    end
    
    subgraph Employees["Employee Management"]
        ListEmployees["GET /employees"]
        CreateEmployee["POST /employees"]
        GetEmployee["GET /employees/{id}"]
        UpdateEmployee["PATCH /employees/{id}"]
        OffboardEmployee["POST /employees/{id}/offboard"]
    end
    
    subgraph Activity["Activity Logs"]
        ListLogs["GET /activity-logs"]
    end
    
    Login --> GetOrg
    CreateEmployee --> GitHubAuth
    CreateEmployee --> NotionAuth
    CreateRole --> ListIntegrations
    OffboardEmployee --> ListIntegrations
```

## Endpoint Summary

| Category | Endpoints | Auth Required | Owner Only |
|---|---|---|---|
| Auth | 6 | Varies | No |
| Organization | 3 | Yes | Update/Delete |
| Admins | 3 | Yes | Yes |
| Integrations | 7 | Yes | No |
| Roles | 5 | Yes | No |
| Employees | 5 | Yes | No |
| Activity Logs | 1 | Yes | No |
| **Total** | **30** | | |

## Authentication Requirements

| Endpoint Category | Auth Requirement | Notes |
|---|---|---|
| POST /auth/signup | Public | Creates org + owner |
| POST /auth/login | Public | Rate limited |
| POST /auth/logout | Authenticated | — |
| POST /auth/accept-invitation | Token | Valid invitation token |
| POST /auth/forgot-password | Public | Rate limited |
| POST /auth/reset-password | Token | Valid reset token |
| All other endpoints | Authenticated | Session required |

## Common Query Parameters

| Parameter | Type | Used By |
|---|---|---|
| `page` | integer (default: 1) | All list endpoints |
| `per_page` | integer (default: 20, max: 100) | All list endpoints |
| `search` | string | GET /employees |
| `status` | string | GET /employees |
| `role_id` | UUID | GET /employees |
| `action` | string | GET /activity-logs |
| `date_from` | ISO datetime | GET /activity-logs |
| `date_to` | ISO datetime | GET /activity-logs |
| `actor_id` | UUID | GET /activity-logs |
