# Notion Integration Sync Flow

```mermaid
sequenceDiagram
    participant Admin as Admin
    participant App as SMB Access Manager
    participant Notion as Notion API
    
    Note over Admin,Notion: Connection Flow
    Admin->>App: Click "Connect Notion"
    App->>App: Generate state param (UUID)
    App-->>Admin: Redirect to Notion OAuth
    Admin->>Notion: Authorize OAuth
    Notion-->>Admin: Redirect with code + state
    Admin->>App: GET /integrations/notion/callback<br/>code + state
    App->>App: Validate state param
    App->>Notion: POST /v1/oauth/token<br/>code + client_secret
    Notion-->>App: access_token, workspace_id, workspace_name
    App->>App: Store encrypted token
    App-->>Admin: Integration connected ✓
    
    Note over Admin,Notion: Provisioning Flow
    App->>Notion: POST /v1/users/invite<br/>{email, name, type: "member"}
    Notion-->>App: 200 OK (user_id)
    App->>App: Store external_identity (Notion user ID)
    
    Note over Admin,Notion: Deprovisioning Flow
    App->>Notion: PATCH /v1/users/{user_id}<br/>{type: "removed"}
    Notion-->>App: 200 OK
```

## Key Details

| Aspect | Implementation |
|---|---|
| OAuth Capabilities | `read:user`, `read:workspace`, `write:user` |
| Token Lifespan | Notion tokens do not expire — no refresh flow needed |
| Token Storage | Fernet-encrypted at rest |
| Rate Limits | 3 req/sec per integration; token bucket throttling |
| Retry Strategy | 429: respect Retry-After header; 5xx: exponential backoff (1s, 2s, 4s) |
| Idempotency | Re-inviting existing member returns success (idempotent) |
| User Removal | Notion sets user type to "removed" — data remains orphaned |
