# Authentication

## 1. Overview

SMB Access Manager uses session-based authentication. Sessions are managed server-side with HTTP-only cookies. No JWTs or client-side tokens are used in the MVP.

## 2. Purpose

Secure, simple authentication that works naturally with server-rendered HTML (Jinja2 + HTMX) and requires no client-side token management.

## 3. Functional Requirements

- Email + password login
- Session management (create, validate, destroy)
- Password hashing with bcrypt
- Account lockout after failed attempts
- Password reset via email
- Invitation acceptance flow

## 4. Non-functional Requirements

- Session timeout after 24 hours of inactivity
- Maximum 5 failed login attempts before 15-minute lockout
- Password minimum strength requirements

## 5. Technical Design

### Session Storage

Sessions are stored in Redis:
```
Key: session:{session_id}
Value: { user_id, organization_id, role, created_at, last_activity }
TTL: 86400 seconds (24h), refreshed on each request
```

### Login Flow

1. User submits email + password
2. Look up user by email (scoped to active users only)
3. Verify password with bcrypt
4. Check account lockout (failed_attempts >= 5 and within cooldown)
5. On success: reset failed_attempts, create session, set cookie
6. On failure: increment failed_attempts, return 401

### Session Validation Middleware

On every protected request:
1. Read session cookie
2. Look up session in Redis
3. If valid: extend TTL, attach user to request
4. If invalid/expired: return 401

### Password Policy

- Minimum 8 characters
- Must contain uppercase, lowercase, and digit
- Hashed with bcrypt (cost factor 12)

### Invitation Flow

1. Owner invites admin → creates user with status=pending, generates token
2. Email sent with magic link: `https://app.acme.com/accept-invitation?token=uuid`
3. Admin clicks link, sets password, account activated
4. Token expires after 48 hours

### Password Reset Flow

1. User requests reset → generates reset token (TTL: 1 hour)
2. Email sent with reset link
3. User clicks link, enters new password
4. Token invalidated after use

## 6. Data Model

Users table (see `06-database-design.md`):
- password_hash
- status (pending, active, disabled)
- invitation_token, invitation_expires_at
- last_login_at

Redis:
- Session data (TTL-based)
- Failed login attempts counter (TTL: 15 min for cooldown)

## 7. API Changes

- POST /api/v1/auth/signup
- POST /api/v1/auth/login
- POST /api/v1/auth/logout
- POST /api/v1/auth/accept-invitation
- POST /api/v1/auth/forgot-password
- POST /api/v1/auth/reset-password

## 8. UI Changes

- Login page with email/password form
- Signup page
- Accept invitation page
- Forgot password page
- Reset password page
- Password strength indicator

## 9. Security Considerations

- Passwords never returned in API responses
- bcrypt with cost factor 12 resists brute-force
- Account lockout prevents online brute-force
- Session cookie flags: HttpOnly, Secure, SameSite=Strict
- CSRF protection on all state-changing requests
- Invitation tokens are UUIDv4 (cryptographically random)
- Reset tokens expire after 1 hour
- Always return 200 on forgot-password (prevent email enumeration)

## 10. Error Handling

- Invalid credentials → 401 with generic message
- Account locked → 401 with lockout remaining time
- Expired invitation → 404 with "invitation expired, contact admin"
- Expired reset token → 404 with "link expired, request again"

## 11. Edge Cases

- User deleted while logged in → session invalidated on next request
- Multiple simultaneous login attempts → serialized by Redis atomicity
- Session cookie tampered → treated as invalid session
- Browser closes → session persists until TTL expiry
- User logs in on multiple devices → separate sessions, each independently managed

## 12. Testing Strategy

- Test password hashing and verification
- Test session creation and validation
- Test account lockout after 5 failures
- Test lockout cooldown expiry
- Test invitation token expiration
- Test reset token expiration
- Test concurrent session management
- Test CSRF token validation

## 13. Acceptance Criteria

- User can sign up, login, and logout
- Session persists for 24 hours of activity
- Account locks after 5 failed login attempts
- Invitation flow works end-to-end
- Password reset flow works end-to-end
- All auth endpoints properly rate limited

## 14. Future Improvements

- OAuth/Social login (Google, GitHub)
- Multi-factor authentication (TOTP)
- WebAuthn / Passkeys
- Session management UI (view/revoke active sessions)
- Remember-me extended sessions (30 days)
- SSO (SAML/OIDC) for enterprise customers
