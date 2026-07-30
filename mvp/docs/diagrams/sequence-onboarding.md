# Onboarding Sequence Diagram

```mermaid
sequenceDiagram
    participant Admin as Admin (Browser)
    participant App as FastAPI App
    participant DB as PostgreSQL
    participant R as Redis/ARQ
    participant GH as GitHub API
    participant NT as Notion API
    
    Admin->>App: POST /api/v1/employees<br/>{email, name, role_id}
    App->>DB: INSERT employee (status: pending)
    DB-->>App: Employee created
    App->>DB: INSERT provisioning_job (status: queued)
    DB-->>App: Job created
    App->>R: Enqueue provision_employee job
    App-->>Admin: 201 Created<br/>{employee, job}
    
    Note over Admin,NT: Background job executes
    
    R->>App: Dequeue job
    App->>DB: UPDATE employee (status: provisioning)
    App->>DB: UPDATE job (status: running)
    
    par GitHub Provisioning
        App->>GH: POST /orgs/{org}/invitations<br/>{email}
        GH-->>App: 201 Invitation sent
        App->>GH: PUT /orgs/{org}/teams/{team}/memberships/{user}
        GH-->>App: 200 Added to team
        App->>DB: UPSERT employee_integration_status<br/>{type: github, status: active}
    and Notion Provisioning
        App->>NT: POST /v1/users/invite<br/>{email, name, type: "member"}
        NT-->>App: 200 User invited
        App->>DB: UPSERT employee_integration_status<br/>{type: notion, status: active}
    end
    
    App->>DB: UPDATE employee (status: active, provisioned_at: now())
    App->>DB: UPDATE job (status: completed)
    App->>DB: INSERT activity_log<br/>{action: employee.provisioning.completed}
    
    Note over Admin,NT: Admin sees updated status via HTMX poll
    
    Admin->>App: GET /api/v1/employees/{id} (polling)
    App-->>Admin: {status: "active", ...}
```

## Timing

| Step | Expected Duration |
|---|---|
| API request | <100ms |
| Job enqueue | <10ms |
| GitHub provisioning | 5–30s (depends on invitation acceptance) |
| Notion provisioning | 2–10s |
| Total | <60s |

## Error Handling

| Failure Point | Action |
|---|---|
| GitHub invitation fails | Retry (3x), then mark GitHub as failed, continue with Notion |
| Notion invitation fails | Retry (3x), then mark Notion as failed |
| Both fail | Employee status: failed; admin notified |
| Database error during job | Job retried (DB may have recovered) |
