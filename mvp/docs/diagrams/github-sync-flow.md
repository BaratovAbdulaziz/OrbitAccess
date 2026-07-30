# GitHub Integration Sync Flow

```mermaid
sequenceDiagram
    participant Admin as Admin
    participant App as SMB Access Manager
    participant GitHub as GitHub API
    
    Note over Admin,GitHub: Connection Flow
    Admin->>App: Click "Connect GitHub"
    App->>App: Generate state param (UUID)
    App-->>Admin: Redirect to GitHub OAuth
    Admin->>GitHub: Authorize OAuth (admin:org scope)
    GitHub-->>Admin: Redirect with code + state
    Admin->>App: GET /integrations/github/callback<br/>code + state
    App->>App: Validate state param
    App->>GitHub: POST /login/oauth/access_token<br/>code + client_secret
    GitHub-->>App: access_token
    App->>GitHub: GET /user/orgs
    GitHub-->>App: Org list
    App->>App: Store encrypted token
    App-->>Admin: Integration connected ✓
    
    Note over Admin,GitHub: Provisioning Flow
    App->>GitHub: POST /orgs/{org}/invitations<br/>{email: employee@...}
    GitHub-->>App: 201 Created
    App->>GitHub: PUT /orgs/{org}/teams/{slug}/memberships/{user}
    GitHub-->>App: 200 OK
    Note over App,GitHub: (Poll for invitation acceptance)
    App->>GitHub: GET /orgs/{org}/memberships/{user}
    GitHub-->>App: Membership details
    
    Note over Admin,GitHub: Deprovisioning Flow
    App->>GitHub: DELETE /orgs/{org}/teams/{slug}/memberships/{user}
    GitHub-->>App: 204 No Content
    App->>GitHub: DELETE /orgs/{org}/members/{user}
    GitHub-->>App: 204 No Content
```

## Key Details

| Aspect | Implementation |
|---|---|
| OAuth Scopes | `admin:org` — manage org membership and teams |
| Token Storage | Fernet-encrypted at rest, decrypted in memory for API calls |
| Rate Limits | 5,000 req/hr authenticated; monitor X-RateLimit-Remaining header |
| Retry Strategy | 429: wait for reset; 5xx: exponential backoff (1s, 2s, 4s) |
| Idempotency | Re-inviting existing member returns 422 → treated as success |
