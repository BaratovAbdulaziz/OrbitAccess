# Database ERD

## Entity Relationship Diagram

```
┌─────────────────┐       ┌─────────────────┐       ┌──────────────────┐
│  organizations   │       │     users       │       │     roles        │
├─────────────────┤       ├─────────────────┤       ├──────────────────┤
│ PK id (UUID)    │◄──────│ FK org_id       │       │ PK id (UUID)     │
│ name             │       │ email            │       │ FK org_id        │
│ slug             │       │ password_hash    │       │ name             │
│ email            │       │ display_name     │       │ description      │
│ is_active        │       │ role (owner/admin)│      │ is_active        │
│ verified_at      │       │ status           │       │ created_at       │
│ created_at       │       │ is_active        │       │ updated_at       │
│ updated_at       │       │ invitation_token │       └────────┬─────────┘
└─────────────────┘       │ created_at       │                 │
        │                  │ updated_at       │                 │
        │                  └─────────────────┘                 │
        │                                                      │
        │                  ┌──────────────────┐                │
        │                  │ role_integrations│                │
        │                  ├──────────────────┤                │
        │                  │ PK id (UUID)     │                │
        │                  │ FK role_id       │◄───────────────┘
        │                  │ integration_type │
        │                  │ config (JSONB)   │
        │                  └──────────────────┘
        │
        │                  ┌──────────────────┐       ┌──────────────────┐
        │                  │   employees       │       │  integrations    │
        │                  ├──────────────────┤       ├──────────────────┤
        │◄────────────────│ FK org_id         │       │ PK id (UUID)     │
        │                  │ FK role_id        │◄──────│ FK org_id        │
        │                  │ email             │       │ integration_type │
        │                  │ display_name      │       │ display_name     │
        │                  │ status            │       │ access_token...  │
        │                  │ is_active         │       │ external_id       │
        │                  │ provisioned_at    │       │ status           │
        │                  │ offboarded_at     │       │ is_active        │
        │                  │ created_at        │       │ created_at       │
        │                  │ updated_at        │       │ updated_at       │
        └─────────────────┴──────────────────┘       └──────────────────┘
                                               ▲
        ┌──────────────────────────────┐        │
        │ employee_integration_status  │        │
        ├──────────────────────────────┤        │
        │ PK id (UUID)                 │        │
        │ FK employee_id               │        │
        │ FK integration_id            │◄───────┘
        │ status                       │
        │ external_identity            │
        │ last_error                   │
        │ created_at                   │
        │ updated_at                   │
        └──────────────────────────────┘

┌─────────────────────┐       ┌──────────────────────┐
│  provisioning_jobs   │       │   activity_logs      │
├─────────────────────┤       ├──────────────────────┤
│ PK id (UUID)        │       │ PK id (BIGSERIAL)    │
│ FK org_id           │       │ FK org_id            │
│ FK employee_id      │       │ FK actor_id          │
│ action              │       │ actor_name            │
│ status              │       │ action                │
│ attempts            │       │ target_type           │
│ max_attempts        │       │ target_id             │
│ last_error          │       │ target_name           │
│ result (JSONB)      │       │ details (JSONB)       │
│ enqueued_at         │       │ ip_address            │
│ started_at          │       │ created_at            │
│ completed_at        │       └──────────────────────┘
│ created_at          │
└─────────────────────┘
