# Offboarding Flow Diagram

```mermaid
flowchart TD
    Start([Admin clicks Offboard]) --> Confirm[Confirmation dialog]
    Confirm -->|Cancel| Canceled([Offboarding canceled])
    Confirm -->|Confirm| API[POST /api/v1/employees/{id}/offboard]
    API --> StatusOffboarding[Employee status: offboarding]
    StatusOffboarding --> Enqueue[Enqueue deprovisioning job]
    Enqueue --> JobQueued[Job status: queued]
    JobQueued --> WorkerPickup[Worker picks up job]
    WorkerPickup --> JobRunning[Job status: running]
    
    JobRunning --> DeprovisionLoop
    
    subgraph DeprovisionLoop[For each integration in role]
        direction TB
        GitHubTeams[GitHub: remove from teams]
        GitHubTeams --> GitHubOrg[GitHub: remove from org]
        Notion[Notion: set user type to removed]
    end
    
    DeprovisionLoop --> AllSuccess{All integrations<br/>succeeded?}
    AllSuccess -->|Yes| StatusOffboarded[Employee status: offboarded]
    AllSuccess -->|No| StatusFailed[Employee status: offboarding_failed]
    
    StatusOffboarded --> Log[Activity log: employee.offboarding.completed]
    StatusFailed --> LogFailed[Activity log: employee.offboarding.failed]
    StatusOffboarded --> SetTimestamp[Set offboarded_at timestamp]
    
    style Start fill:#e8f5e9
    style Canceled fill:#fff9c4
    style StatusOffboarded fill:#c8e6c9
    style StatusFailed fill:#ffcdd2
```

## Deprovisioning Order

| Step | Action | Why This Order |
|---|---|---|
| 1 | Remove from GitHub teams | Granular first — if step 2 fails, team access is still revoked |
| 2 | Remove from GitHub org | Coarse-grained — full access removal |
| 3 | Remove from Notion workspace | Independent of GitHub — can be done in parallel |

## Irreversibility

Offboarding is intentionally irreversible by design:
- No "undo" button after confirmation
- Employee must be re-added manually with a new provisioning flow
- This prevents security gaps from accidental rollbacks
