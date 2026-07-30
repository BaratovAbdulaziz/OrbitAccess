# GitHub Integration

## 1. Overview

The GitHub integration allows SMB Access Manager to connect to a GitHub Organization, manage team membership, and invite/remove members automatically based on employee roles.

## 2. Purpose

Automate GitHub Organization access management — the most common tool small businesses use for code collaboration.

## 3. Functional Requirements

- OAuth 2.0 authentication with GitHub
- Connect to a GitHub Organization
- List organization teams
- Invite members to the organization
- Add/remove members from teams
- Remove members from organization
- Handle token refresh/expiration
- Disconnect integration

## 4. Non-functional Requirements

- All GitHub API calls respect rate limits (5,000 req/hr authenticated)
- Retry with exponential backoff on 429/5xx errors
- Operation timeout after 30 seconds per API call

## 5. Technical Design

### OAuth Flow

1. Admin clicks "Connect GitHub"
2. Backend generates state parameter (random UUID, stored temporarily in Redis, TTL 10 min)
3. Redirect to GitHub OAuth authorize URL:
   ```
   GET https://github.com/login/oauth/authorize
     ?client_id={CLIENT_ID}
     &redirect_uri={CALLBACK_URL}
     &state={STATE}
     &scope=admin:org,admin:org_hook
   ```
4. Admin authorizes → GitHub redirects to callback with `code` and `state`
5. Backend validates state matches stored value
6. Backend exchanges `code` for access token:
   ```
   POST https://github.com/login/oauth/access_token
     ?client_id={CLIENT_ID}
     &client_secret={CLIENT_SECRET}
     &code={CODE}
   ```
7. Backend stores encrypted token and fetches org details
8. Integration marked as active

### Required Scopes

| Scope | Reason |
|---|---|
| `admin:org` | Manage organization membership and teams |
| `admin:org_hook` | (Future) Set up webhooks for org events |

### API Operations

**Get Authenticated User's Organizations**
```
GET /user/orgs
```
Used during OAuth callback to verify the user has admin access to the org.

**List Organization Teams**
```
GET /orgs/{org}/teams?per_page=100
```
Pagination handled automatically; used in role creation UI to show available teams.

**Invite Member to Organization**
```
POST /orgs/{org}/invitations
{
  "email": "sam@acme.com",
  "role": "direct_member"
}
```
Used during provisioning. Returns 201 on success, 422 if already a member.

**Add Member to Team**
```
PUT /orgs/{org}/teams/{team_slug}/memberships/{username}
{
  "role": "member"
}
```
Used during provisioning after org invitation is accepted (note: GitHub may require the user to accept the org invitation first — handled via polling).

**List Organization Invitations**
```
GET /orgs/{org}/invitations
```
Used to check if a pending invitation already exists.

**Remove Member from Organization**
```
DELETE /orgs/{org}/members/{username}
```
Used during offboarding.

**Remove Member from Team**
```
DELETE /orgs/{org}/teams/{team_slug}/memberships/{username}
```
Used during role change or offboarding.

### Rate Limiting

- GitHub authenticated rate limit: 5,000 requests per hour
- Monitor `X-RateLimit-Remaining` header in responses
- When approaching limit, queue remaining operations
- Implement exponential backoff: 1s, 2s, 4s, 8s — max 3 retries

### Retry Strategy

| Error Type | Retry? | Backoff |
|---|---|---|
| 429 (rate limit) | Yes | Wait for `X-RateLimit-Reset` header |
| 5xx | Yes | Exponential: 1s, 2s, 4s |
| 401 (token expired) | No | Mark integration as error |
| 404 (org/team deleted) | No | Fail with descriptive error |
| 422 (already member) | No | Treat as success (idempotent) |

## 6. Data Model

- `integrations` table: `integration_type='github'`, `access_token_encrypted`, `external_id` (GitHub org ID), `config` (org name, avatar URL)
- `employee_integration_status` table: `integration_type='github'`, `external_identity` (GitHub username)

## 7. API Changes

- GET /api/v1/integrations/github/auth-url
- GET /api/v1/integrations/github/callback
- POST /api/v1/integrations/github/disconnect

## 8. UI Changes

- Integration card with "Connect GitHub" button
- Connected state shows org name, avatar, status
- Disconnect button with confirmation
- Error state if token expired or API unreachable

## 9. Security Considerations

- OAuth state parameter prevents CSRF on callback
- Access token encrypted at rest with Fernet
- Token never exposed to client browser
- OAuth client secret stored in server environment variable
- Only `admin:org` scope requested (least privilege)

## 10. Error Handling

- OAuth callback with invalid state → return error, redirect to integrations page
- Token expired → background job fails, integration status set to "error", admin must reconnect
- Rate limit hit → job pauses, waits for reset, retries
- Org not found → integration status set to "error" with message
- Network timeout → retry with backoff, eventually fail

## 11. Edge Cases

- GitHub invites require user to accept before team membership works → poll for acceptance status
- User already in org but not in correct teams → add to teams (team membership is additive)
- User removed from org manually outside the platform → system detects 404 on team membership check
- GitHub team renamed → config stored by team ID, not name; lookup by ID handles renames
- User's GitHub username may differ from their email → use GitHub's user search by email to find username

## 12. Testing Strategy

- Unit tests with mocked GitHub API responses
- Integration test with a test GitHub Organization (CI)
- Test OAuth flow with valid and invalid state
- Test rate limit handling with mock responses
- Test retry logic with simulated 429/5xx
- Test token encryption and decryption

## 13. Acceptance Criteria

- Admin can connect GitHub Organization
- System lists organization teams
- Adding employee with GitHub role provisions org membership + team membership
- Offboarding removes employee from org
- Invalid token marks integration as error
- Disconnecting removes integration

## 14. Future Improvements

- Webhook-based real-time sync (org events pushed instead of polled)
- GitHub team creation from within SMB Access Manager
- Fine-grained PAT (Personal Access Token) support as alternative to OAuth
- SAML SSO org support
- Audit log events from GitHub webhooks
- Handle GitHub Enterprise Server
