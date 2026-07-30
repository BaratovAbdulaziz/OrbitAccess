# Security

## 1. Overview

Security is a first-class concern for SMB Access Manager. The system handles OAuth tokens (which grant access to third-party services) and employee data. This document covers the complete security model.

## 2. Purpose

Define security controls, threat model, and compliance considerations for the MVP.

## 3. Functional Requirements

- Authentication (session-based)
- Authorization (role-based access control)
- OAuth token encryption at rest
- Secure communication (TLS)
- Input validation
- Rate limiting
- Audit logging

## 4. Non-functional Requirements

- All API traffic over TLS 1.2+
- Passwords hashed with bcrypt (cost ≥12)
- Session cookies with HttpOnly, Secure, SameSite=Strict
- Rate limiting: 10 req/min/IP on auth, 60 req/min/IP on API
- Account lockout after 5 failed attempts

## 5. Technical Design

### Threat Model

| Threat | Mitigation |
|---|---|
| Brute-force login | Account lockout + rate limiting |
| Session hijacking | HttpOnly + Secure cookies; session bound to IP (optional) |
| CSRF | Double-submit cookie pattern |
| XSS | Input sanitization; CSP headers |
| SQL injection | Parameterized queries via SQLAlchemy |
| OAuth token theft | Encryption at rest (Fernet) |
| Man-in-the-middle | TLS 1.2+ enforced |
| Insider threat (admin) | Append-only audit logs; least privilege |
| Data breach (DB) | Encrypted tokens; no plaintext secrets |
| Replay attack (OAuth) | State parameter (single-use) |

### Authentication

*Detailed in `08-authentication.md`.*

Key controls:
- Session TTL: 24h inactivity timeout
- Password policy: 8+ chars, upper+lower+digit
- bcrypt cost factor: 12
- Account lockout: 5 failures → 15 min cooldown

### Authorization Model

| Role | Organization | Employees | Roles | Integrations | Activity Log | Admins |
|---|---|---|---|---|---|---|
| Owner | Read/Write | Read/Write | Read/Write | Read/Write | Read | Read/Write |
| Admin | Read | Read/Write | Read/Write | Read/Write | Read | Read |

Note: Only the Owner can:
- Delete the organization
- Invite/remove other admins
- Change organization settings

### Secrets Management

| Secret | Storage | Encryption |
|---|---|---|
| User passwords | Database (bcrypt hash) | One-way hash |
| GitHub OAuth token | Database (integrations.access_token_encrypted) | Fernet (AES-256-CBC + HMAC) |
| Notion OAuth token | Database (same) | Fernet |
| GitHub OAuth client secret | Environment variable | — |
| Notion OAuth client secret | Environment variable | — |
| Session secret key | Environment variable | — |
| Fernet encryption key | Environment variable | — |
| Database URL | Environment variable | — |
| SMTP password | Environment variable | — |

### OAuth Token Encryption

```
Token Encryption (Fernet):
1. Generate Fernet key (AES-256-CBC + HMAC-SHA256)
2. Store key in environment: FERNET_KEY=<base64-encoded-key>
3. Encrypt: fernet.encrypt(token.encode()) → base64 token
4. Decrypt: fernet.decrypt(encrypted_token) → original token
```

Tokens are only decrypted in-memory when needed for API calls. Never logged or exposed to the client.

### CSRF Protection

- Double-submit cookie pattern
- Server sets a random CSRF token as a non-httponly cookie
- Client reads cookie and sends as X-CSRF-Token header
- Server validates header matches cookie
- Applied to all POST, PATCH, DELETE, PUT requests

### API Security

- All requests must include `Content-Type: application/json`
- Input validation via Pydantic models on every endpoint
- CORS configured to only allow the application origin
- Rate limiting per IP address
- Request size limits (1MB max body)

### HTTP Security Headers

| Header | Value |
|---|---|
| Content-Security-Policy | default-src 'self'; script-src 'self' 'unsafe-inline' (for HTMX/Alpine); style-src 'self' 'unsafe-inline' |
| X-Content-Type-Options | nosniff |
| X-Frame-Options | DENY |
| Strict-Transport-Security | max-age=31536000; includeSubDomains |
| Referrer-Policy | strict-origin-when-cross-origin |
| Cache-Control | no-store (for authenticated pages) |

## 6. Data Model

*Security-related columns:*
- users.password_hash (bcrypt)
- integrations.access_token_encrypted (Fernet)
- activity_logs.ip_address (forensic data)
- activity_logs append-only constraint

## 7. API Changes

- CSRF token endpoint: GET /api/v1/auth/csrf-token
- Rate limit headers in all responses:
  - X-RateLimit-Limit
  - X-RateLimit-Remaining
  - X-RateLimit-Reset

## 8. UI Changes

- CSRF token included in all HTMX requests via meta tag
- Login page with password strength indicator
- Session timeout warning (optional)
- No sensitive data displayed in UI (tokens, passwords)

## 9. Security Considerations

Covered throughout.

## 10. Error Handling

- Error messages do not reveal internal details (stack traces, SQL errors)
- 500 errors return generic "Internal server error" with correlation ID
- Validation errors include field names but not valid values constraint details
- Authentication errors are intentionally vague ("Invalid credentials" vs "User not found")

## 11. Edge Cases

- Session cookie stolen → limited to 24h window; IP binding optional
- Database backup compromised → tokens encrypted; bcrypt hashes resistant
- Employee email used as username → no password necessary for employees (they don't log in)
- Admin leaves → owner can remove; logs show who removed them

## 12. Testing Strategy

- Penetration testing: CSRF, XSS, SQL injection attempts
- Authentication: brute force, session hijacking, token manipulation
- Authorization: admin accessing owner endpoints, cross-org data access
- Encryption: verify tokens are encrypted in DB, decrypted correctly
- Rate limiting: verify limits enforced

## 13. Acceptance Criteria

- All API traffic over TLS
- Passwords hashed with bcrypt cost 12
- OAuth tokens encrypted at rest
- CSRF protection works on all state-changing requests
- Rate limiting enforced on auth endpoints
- Audit logs are append-only
- Session timeout enforced after 24h

## 14. Future Improvements

- Multi-factor authentication (TOTP)
- WebAuthn / Passkeys
- SSO (SAML/OIDC) for enterprise
- IP allowlisting for organization
- Session management UI (view/revoke active sessions)
- Automated security scanning in CI
- Penetration testing schedule
- Bug bounty program
