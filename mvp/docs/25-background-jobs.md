# Background Jobs

## 1. Overview

Background jobs handle asynchronous operations that should not block API responses — primarily provisioning and deprovisioning employees across connected integrations.

## 2. Purpose

Ensure the API remains responsive while long-running integration operations execute asynchronously.

## 3. Functional Requirements

- Provision employee across GitHub and Notion
- Deprovision employee from GitHub and Notion
- Retry failed operations with exponential backoff
- Track job status and progress
- Handle integration errors gracefully

## 4. Non-functional Requirements

- Jobs process within 60 seconds
- Max 3 retry attempts per job
- Serialized per employee (one job at a time per employee)
- Concurrent jobs across different employees allowed

## 5. Technical Design

### Job Queue Architecture

```
API Route
  │
  ▼
ARQ enqueue (Redis)
  │
  ▼
ARQ Worker (in-process or separate process)
  │
  ├── ProvisioningJob created (status: queued)
  ├── Execute integration operations
  │   ├── GitHub: invite / add to teams
  │   └── Notion: invite to workspace
  ├── On success: update statuses, write activity log
  └── On failure: retry or mark failed
```

### Worker Setup

```python
# app/workers/worker.py
from arq import create_pool
from arq.connections import RedisSettings

async def startup(ctx):
    ctx["db_session"] = await create_async_session()
    ctx["github_client"] = GitHubClient()
    ctx["notion_client"] = NotionClient()

async def shutdown(ctx):
    await ctx["db_session"].close()

class WorkerSettings:
    functions = ["app.workers.tasks"]
    redis_settings = RedisSettings.from_dsn(REDIS_URL)
    on_startup = startup
    on_shutdown = shutdown
    keep_result = 3600  # Keep job results for 1 hour
    timeout = 120       # Job timeout
```

### Task Definitions

```python
# app/workers/tasks.py

async def provision_employee(ctx, employee_id: uuid.UUID):
    """Provision an employee across all connected integrations."""
    db = ctx["db_session"]
    employee = await employee_service.get_by_id(db, employee_id)
    role = await role_service.get_by_id(db, employee.role_id)
    integrations = await integration_service.get_active(db, employee.organization_id)

    for integration in integrations:
        integration_config = next(
            ic for ic in role.integration_configs
            if ic.integration_type == integration.integration_type
        )
        try:
            if integration.integration_type == "github":
                await provision_github(db, employee, integration, integration_config)
            elif integration.integration_type == "notion":
                await provision_notion(db, employee, integration, integration_config)
        except Exception as e:
            await mark_integration_failed(db, employee, integration, str(e))
            raise  # ARQ handles retry

    await mark_employee_active(db, employee)
    await activity_log_service.log(db, "employee.provisioning.completed", ...)


async def deprovision_employee(ctx, employee_id: uuid.UUID):
    """Deprovision an employee from all connected integrations."""
    # Similar structure to provision_employee
    # Removes from teams first, then from org/workspace
```

### Job Lifecycle

```
enqueue ──▶ queued ──▶ running ──▶ completed
                          │
                          ▼
                       failed ──▶ (retry) ──▶ running
                          │
                          ▼ (max retries exceeded)
                       failed (permanent)
```

### Retry Strategy

| Attempt | Backoff | Total Wait |
|---|---|---|
| 1 | 5 seconds | 5s |
| 2 | 15 seconds | 20s |
| 3 | 45 seconds | 65s |

After 3rd failure:
- Job status set to `failed`
- Employee status set to `failed` (if provisioning) or `offboarding_failed` (if offboarding)
- Integration status set to `failed` for affected integrations
- Activity log entry created with error details

### Job Serialization

Provisioning jobs for the same employee are serialized:
- Check for existing `queued` or `running` jobs for the same employee before enqueueing
- If exists, return existing job ID instead of creating duplicate
- This prevents race conditions from rapid role changes

### Queue Monitoring

- Job result stored in Redis for 1 hour (configurable)
- Failed jobs visible in employee detail screen
- No separate dead letter queue for MVP (failed jobs stay in DB)

## 6. Data Model

- `provisioning_jobs` table tracks all jobs (not Redis-only for persistence)
- `employee_integration_status` per integration tracks provisioning state

## 7. API Changes

- POST /api/v1/employees — enqueues provisioning job
- POST /api/v1/employees/{id}/offboard — enqueues deprovisioning job
- GET /api/v1/employees/{id} — returns job status

## 8. UI Changes

- Status badges reflect job progress in real-time (HTMX polling)
- Failed jobs show retry button
- Provisioning history in employee detail

## 9. Security Considerations

- Jobs execute with stored OAuth tokens (decrypted in memory only)
- Job parameters reference employee/integration IDs — no sensitive data in queue
- Worker runs in same security context as the application

## 10. Error Handling

- Integration API errors → caught, logged, retried
- Database errors during job → job retried (DB may have recovered)
- Worker crash → job remains `queued` and picked up on restart
- Redis down → enqueue fails; API returns 503 for provisioning endpoints

## 11. Edge Cases

- Integration disconnected mid-job → mark that integration as failed, continue others
- Employee deleted during active job → check employee still exists before each operation
- OAuth token expires during job → mark integration as error, fail gracefully
- Worker restarts during job → job stays `running`; manual cleanup or timeout
- Concurrent org-wide provisioning burst (10+ employees) → ARQ processes concurrently; rate limits apply

## 12. Testing Strategy

- Unit test task functions with mocked integrations
- Integration test full job lifecycle (enqueue → process → complete)
- Test retry logic with simulated failures
- Test serialization (same employee, concurrent enqueue)
- Test edge cases (disconnected integration, deleted employee)

## 13. Acceptance Criteria

- Provisioning job processes within 60 seconds
- Failed jobs retry up to 3 times
- Job status visible in employee detail
- Serialization prevents duplicate jobs for same employee

## 14. Future Improvements

- Separate worker process for horizontal scaling
- Dead letter queue for permanently failed jobs
- Admin UI for manual job retry/cancellation
- Job metrics (queue depth, processing time, failure rate)
- Scheduled jobs (future-dated provisioning)
- Webhook-driven jobs for real-time sync
