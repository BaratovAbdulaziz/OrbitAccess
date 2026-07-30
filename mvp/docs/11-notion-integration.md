# Notion Integration

## 1. Overview

The Notion integration allows SMB Access Manager to connect to a Notion workspace and invite/remove members automatically based on employee roles.

## 2. Purpose

Notion is widely used by small businesses for documentation, project management, and knowledge bases. Automating workspace membership ensures employees have access to company information from day one.

## 3. Functional Requirements

- OAuth 2.0 authentication with Notion
- Connect to a Notion workspace
- Invite members to the workspace
- Remove members from the workspace
- Handle token expiration
- Disconnect integration

## 4. Non-functional Requirements

- Respect Notion API rate limits (3 req/sec per integration)
- Operation timeout after 30 seconds per API call
- Retry with exponential backoff on 429/5xx errors

## 5. Technical Design

### OAuth Flow

1. Admin clicks "Connect Notion"
2. Backend generates state parameter (random UUID, stored in Redis, TTL 10 min)
3. Redirect to Notion OAuth authorize URL:
   ```
   GET https://api.notion.com/v1/oauth/authorize
     ?client_id={CLIENT_ID}
     &redirect_uri={CALLBACK_URL}
     &state={STATE}
     &owner=user
   ```
4. Admin authorizes → Notion redirects to callback with `code` and `state`
5. Backend validates state
6. Backend exchanges `code` for tokens:
   ```
   POST https://api.notion.com/v1/oauth/token
     grant_type=authorization_code
     code={CODE}
     redirect_uri={CALLBACK_URL}
   ```
7. Notion returns `access_token`, `duplicated_template_id`, `workspace_id`, `workspace_name`
8. Backend stores encrypted token and workspace details
9. Integration marked as active

### Required Capabilities

| Capability | Reason |
|---|---|
| `read:user` | Read user email for mapping |
| `read:workspace` | Read workspace details |
| `write:user` | Invite and remove members |

### API Operations

**Invite Member to Workspace**
```
POST https://api.notion.com/v1/users/invite
Authorization: Bearer {access_token}
{
  "external_id": "sam@acme.com",
  "email": "sam@acme.com",
  "name": "Sam Rivera",
  "type": "member"
}
```
Used during provisioning.

**List Workspace Users**
```
GET https://api.notion.com/v1/users?page_size=100
```
Used to verify membership and find user IDs.

**Remove Member from Workspace**
```
PATCH https://api.notion.com/v1/users/{user_id}
{
  "type": "removed"
}
```
Used during offboarding. Note: Notion doesn't truly "delete" users; it removes their access.

**Get Workspace Details**
```
GET https://api.notion.com/v1/workspace
```
Used during OAuth callback to display workspace name.

### Rate Limiting

- Notion rate limit: 3 requests per second per integration
- Implement request throttling: max 3 requests/second with token bucket
- Exponential backoff on 429: 1s, 2s, 4s, 8s — max 3 retries

### Retry Strategy

| Error Type | Retry? | Backoff |
|---|---|---|
| 429 (rate limit) | Yes | Respect Retry-After header |
| 5xx | Yes | Exponential: 1s, 2s, 4s |
| 401 (unauthorized) | No | Token invalid; mark integration as error |
| 404 (workspace deleted) | No | Fail; mark integration as error |
| 409 (conflict) | Yes | Retry once after 1s |
| 400 (invalid request) | No | Fail with validation error |

## 6. Data Model

- `integrations` table: `integration_type='notion'`, `access_token_encrypted`, `external_id` (Notion workspace ID), `config` (workspace name, icon)
- `employee_integration_status` table: `integration_type='notion'`, `external_identity` (Notion user ID)

## 7. API Changes

- GET /api/v1/integrations/notion/auth-url
- GET /api/v1/integrations/notion/callback
- POST /api/v1/integrations/notion/disconnect

## 8. UI Changes

- Integration card with "Connect Notion" button
- Connected state shows workspace name, status
- Disconnect button with confirmation
- Error state if token expired or API unreachable

## 9. Security Considerations

- OAuth state parameter prevents CSRF on callback
- Access token encrypted at rest with Fernet
- Token never exposed to client browser
- OAuth client secret stored in server environment variable
- Notion access tokens do not expire (no refresh flow for MVP)

## 10. Error Handling

- OAuth callback with invalid state → return error, redirect to integrations page
- Token invalid → background job fails, integration status set to "error", admin must reconnect
- Rate limit hit → throttle requests; queue delays automatically
- Workspace not found → integration status set to "error" with message
- Network timeout → retry with backoff, eventually fail

## 11. Edge Cases

- User already in workspace → Notion invite endpoint returns success (idempotent)
- User removed from workspace manually → system detects on next membership check
- Notion user is already "removed" type → treat as not provisioned; re-invite
- Workspace owner cannot be removed (Notion restriction) → gracefully handle 400 if attempting
- Notion internal users vs. guest users → MVP only supports internal members

## 12. Testing Strategy

- Unit tests with mocked Notion API responses
- Test OAuth flow with valid and invalid state
- Test rate limit throttling behavior
- Test invite and remove operations
- Test error handling for invalid tokens

## 13. Acceptance Criteria

- Admin can connect Notion workspace
- Adding employee with Notion role sends workspace invite
- Offboarding removes employee from workspace
- Invalid token marks integration as error
- Disconnecting removes integration

## 14. Future Improvements

- Guest user support
- Page-level permission management (grant access to specific pages/databases per role)
- Notion template duplication for new employees (auto-create workspace pages)
- Webhook-based sync for workspace changes
- Notion API v2 endpoints when stable
