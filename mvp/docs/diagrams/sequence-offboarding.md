# Offboarding Sequence Diagram

```mermaid
sequenceDiagram
    participant Admin as Admin (Browser)
    participant App as FastAPI App
    participant DB as PostgreSQL
    participant R as Redis/ARQ
    participant GH as GitHub API
    participant NT as Notion API
    
    Admin->>App: POST /api/v1/employees/{id}/offboard
    App->>App: Validate employee exists and is active
    App->>DB: UPDATE employee (status: offboarding)
    App->>DB: INSERT provisioning_job (status: queued, action: deprovision)
    App->>R: Enqueue deprovision_employee job
    App-->>Admin: 200 OK<br/>{employee, job}
    
    Note over Admin,NT: Background job executes
    
    R->>App: Dequeue job
    App->>DB: UPDATE job (status: running)
    
    par GitHub Deprovisioning
        App->>GH: DELETE /orgs/{org}/teams/{team}/memberships/{user}
        GH-->>App: 204 Team membership removed
        App->>GH: DELETE /orgs/{org}/members/{user}
        GH-->>App: 204 Org membership removed
        App->>DB: UPDATE employee_integration_status<br/>{type: github, status: removed}
    and Notion Deprovisioning
        App->>NT: PATCH /v1/users/{user_id}<br/>{type: "removed"}
        NT-->>App: 200 User access removed
        App->>DB: UPDATE employee_integration_status<br/>{type: notion, status: removed}
    end
    
    App->>DB: UPDATE employee (status: offboarded, offboarded_at: now())
    App->>DB: UPDATE job (status: completed)
    App->>DB: INSERT activity_log<br/>{action: employee.offboarding.completed}
    
    Note over Admin,NT: Admin sees updated status
    
    Admin->>App: GET /api/v1/employees/{id}
    App-->>Admin: {status: "offboarded", offboarded_at: ...}
```

## GitHub Deprovisioning Details

```
Step 1: Remove from teams
  DELETE /orgs/{org}/teams/{engineering}/memberships/{username}
  → 204: Removed successfully
  → 404: Not a member (treat as success)

Step 2: Remove from organization
  DELETE /orgs/{org}/members/{username}
  → 204: Removed successfully
  → 404: Not a member (treat as success)
```

## Edge Case Handling

| Scenario | Behavior |
|---|---|
| Employee not fully provisioned | Skip integration steps, mark as offboarded |
| Integration disconnected | Skip that integration, continue others |
| Employee already removed from GitHub | 404 → treated as success (idempotent) |
| GitHub account deleted | 404 → treated as success |
| Notion user already removed | PATCH succeeds → treated as success |
| Network timeout | Retry with backoff, eventually fail with clear error |
