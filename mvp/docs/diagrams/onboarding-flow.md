# Onboarding Flow Diagram

```mermaid
flowchart TD
    Start([Admin adds employee]) --> Create[POST /api/v1/employees]
    Create --> StatusPending[Employee status: pending]
    StatusPending --> Enqueue[Enqueue provisioning job]
    Enqueue --> JobQueued[Job status: queued]
    JobQueued --> WorkerPickup[Worker picks up job]
    WorkerPickup --> JobRunning[Job status: running]
    JobRunning --> StatusProvisioning[Employee status: provisioning]
    
    StatusProvisioning --> CheckIntegrations{Any integrations<br/>configured?}
    CheckIntegrations -->|No| ImmediateActive[Employee status: active]
    CheckIntegrations -->|Yes| ProvisionLoop
    
    subgraph ProvisionLoop[For each integration in role]
        direction TB
        GitHub[GitHub: invite to org + add to teams]
        Notion[Notion: invite to workspace]
    end
    
    ProvisionLoop --> AllSuccess{All integrations<br/>succeeded?}
    AllSuccess -->|Yes| StatusActive[Employee status: active]
    AllSuccess -->|No| StatusFailed[Employee status: failed]
    
    JobRunning --> Complete[Job status: completed]
    StatusFailed --> JobFailed[Job status: failed]
    
    StatusActive --> Log[Activity log: employee.provisioning.completed]
    StatusFailed --> LogFailed[Activity log: employee.provisioning.failed]
    
    style Start fill:#e8f5e9
    style StatusActive fill:#c8e6c9
    style StatusFailed fill:#ffcdd2
    style JobFailed fill:#ffcdd2
```

## Key Decisions

| Decision | Rationale |
|---|---|
| Serialized per employee | Prevents race conditions from rapid role changes |
| Retry up to 3 times | Transient failures (rate limit, network) are common |
| Partial success handled | One integration failing shouldn't affect others |
| Status polling via HTMX | Real-time feedback without WebSocket complexity |
