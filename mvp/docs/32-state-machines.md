# State Machines

## 1. Overview

Defines the formal state machines for all domain entities that have lifecycle states. Each state machine specifies valid states, transitions, and transition rules.

## 2. Purpose

Prevent invalid state transitions in code. Serve as the single source of truth for state logic used by services, workers, and tests.

## 3. Functional Requirements

- Employees must follow a defined lifecycle
- Provisioning jobs must track execution state
- Integrations must have health status
- All state transitions must be valid (no illegal transitions)

## 4. Non-functional Requirements

- State machines must be enforceable at the application layer
- Invalid transitions must fail with clear error messages

## 5. Technical Design

### Employee State Machine

```
                  ┌─────────────────────────────────────┐
                  │           OFFBOARDED                │
                  │  (final state; can be re-added)     │
                  └─────────────────────────────────────┘
                      ▲
                      │ offboarding completes
                      │
┌─────────┐    ┌──────┴───────┐    ┌──────────────────┐
│ PENDING │───▶│ PROVISIONING │───▶│      ACTIVE      │
│         │    │              │    │                  │
│ Just    │    │ Background   │    │ Fully            │
│ created │    │ job running  │    │ provisioned      │
└─────────┘    └──────┬───────┘    └────────┬─────────┘
                      │                     │
                      │ provisioning fails  │ offboard initiated
                      ▼                     ▼
                ┌──────────┐        ┌──────────────────┐
                │  FAILED  │        │   OFFBOARDING    │
                │          │        │                  │
                │ Retry or │        │ Background job   │
                │ re-add   │        │ running          │
                └──────────┘        └────────┬─────────┘
                      ▲                      │
                      │ offboarding fails    │
                      └──────────────────────┘
```

| From | To | Trigger | Notes |
|---|---|---|---|
| PENDING | PROVISIONING | Worker picks up job | Automatic |
| PROVISIONING | ACTIVE | All integrations succeed | Automatic |
| PROVISIONING | FAILED | Any integration fails after retries | Automatic |
| ACTIVE | OFFBOARDING | Admin clicks offboard | Manual |
| OFFBOARDING | OFFBOARDED | All integrations removed | Automatic |
| OFFBOARDING | FAILED | Any removal fails after retries | Automatic |
| FAILED | PENDING | Admin re-adds employee | Manual (full re-provision) |
| OFFBOARDED | PENDING | Admin re-adds employee | Manual (full re-provision) |

**Invalid transitions**:
- PENDING → ACTIVE (must go through PROVISIONING)
- ACTIVE → PENDING (no rollback — must offboard and re-add)
- FAILED → ACTIVE (must retry or re-add)

### ProvisioningJob State Machine

```
┌────────┐    ┌─────────┐    ┌───────────┐
│ QUEUED │───▶│ RUNNING │───▶│ COMPLETED │
└────────┘    └─────────┘    └───────────┘
                  │
                  ▼
              ┌────────┐
              │ FAILED │◀──── (up to 3 retries → re-enter RUNNING)
              └────────┘
```

| From | To | Trigger |
|---|---|---|
| QUEUED | RUNNING | Worker dequeues job |
| RUNNING | COMPLETED | All operations succeed |
| RUNNING | FAILED | Operation fails, no retries remaining |
| FAILED | RUNNING | Retry (if attempts < max_attempts) |

### Integration State Machine

```
┌────────┐    ┌──────────┐    ┌──────────────┐
│ ACTIVE │───▶│  ERROR   │───▶│ DISCONNECTED │
└────────┘    └──────────┘    └──────────────┘
    ▲                            │
    │                            │
    └────────────────────────────┘
    (reconnect clears error)
```

| From | To | Trigger |
|---|---|---|
| ACTIVE | ERROR | Token expired, API unreachable, or permission error |
| ERROR | ACTIVE | Admin successfully reconnects / reauthorizes |
| ACTIVE | DISCONNECTED | Admin clicks disconnect |
| ERROR | DISCONNECTED | Admin clicks disconnect |
| DISCONNECTED | ACTIVE | Admin reconnects (new OAuth flow) |

### EmployeeIntegrationStatus State Machine

```
┌─────────┐    ┌──────────────┐    ┌────────┐
│ PENDING │───▶│ PROVISIONING │───▶│ ACTIVE │
└─────────┘    └──────────────┘    └───┬────┘
                                        │
                                        ▼
                                  ┌──────────┐
                                  │  REMOVED │
                                  └──────────┘
```

| From | To | Trigger |
|---|---|---|
| PENDING | PROVISIONING | Provisioning job starts integration operation |
| PROVISIONING | ACTIVE | Integration operation succeeds |
| PROVISIONING | FAILED | Integration operation fails after retries |
| ACTIVE | REMOVED | Deprovisioning job removes access |
| FAILED | PROVISIONING | Retry |

### State Machine Enforcement

```python
from enum import Enum

class EmployeeStatus(str, Enum):
    PENDING = "pending"
    PROVISIONING = "provisioning"
    ACTIVE = "active"
    OFFBOARDING = "offboarding"
    OFFBOARDED = "offboarded"
    FAILED = "failed"

    def can_transition_to(self, new_status: "EmployeeStatus") -> bool:
        return new_status in VALID_TRANSITIONS[self]

VALID_TRANSITIONS = {
    EmployeeStatus.PENDING: {EmployeeStatus.PROVISIONING, EmployeeStatus.OFFBOARDED},
    EmployeeStatus.PROVISIONING: {EmployeeStatus.ACTIVE, EmployeeStatus.FAILED},
    EmployeeStatus.ACTIVE: {EmployeeStatus.OFFBOARDING},
    EmployeeStatus.OFFBOARDING: {EmployeeStatus.OFFBOARDED, EmployeeStatus.FAILED},
    EmployeeStatus.OFFBOARDED: set(),  # Terminal — must re-add
    EmployeeStatus.FAILED: {EmployeeStatus.PENDING},  # Retry/re-add
}
```

## 6. Data Model

- `employees.status`: VARCHAR(20), CHECK constraint for valid values
- `provisioning_jobs.status`: VARCHAR(20), CHECK constraint for valid values
- `integrations.status`: VARCHAR(20), CHECK constraint for valid values
- `employee_integration_status.status`: VARCHAR(20), CHECK constraint for valid values

## 7. API Changes

Endpoints enforce state machine rules before performing actions:
- Offboarding an already-offboarded employee → 400
- Disconnecting an already-disconnected integration → 400

## 8. UI Changes

- Buttons disabled when transition not possible (e.g., no "Offboard" on offboarded employees)
- Status badges consistent with state machine values

## 9. Security Considerations

- State validation prevents race conditions (e.g., double offboarding)
- Status set to FAILED preserves system integrity when external services fail

## 10. Error Handling

- Invalid transition → `InvalidStateException` (400) with explanation
- "Cannot offboard employee in status 'offboarded'"
- "Cannot disconnect integration in status 'disconnected'"

## 11. Edge Cases

- Employee in FAILED status on both provisioning → offboarding should succeed (skips integration steps)
- Concurrent state changes → database-level optimistic locking prevents races
- Worker crash mid-transition → status preserved; manual recovery on restart

## 12. Testing Strategy

- Test every valid transition
- Test every invalid transition returns error
- Test concurrent transitions race safely
- Test state machine enforcement in service layer, not just API

## 13. Acceptance Criteria

- All state transitions documented and enforced
- No invalid transitions possible through API
- Status changes are always logged as activity log entries

## 14. Future Improvements

- Finite state machine library (e.g., `transitions` or `state-machine`)
- State machine visualization in admin dashboard
- Timed transitions (auto-retry FAILED after cooldown)
- Webhook events on state transitions
