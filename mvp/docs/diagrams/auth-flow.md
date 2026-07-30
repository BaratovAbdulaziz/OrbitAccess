# Authentication Flow Diagram

```mermaid
sequenceDiagram
    participant B as Browser
    participant A as FastAPI App
    participant DB as PostgreSQL
    participant R as Redis
    
    Note over B,R: Login Flow
    B->>A: POST /api/v1/auth/login<br/>email + password
    A->>DB: SELECT user by email
    DB-->>A: User record + password_hash
    A->>A: Verify password (bcrypt)
    A->>R: SET session:{id} {user_data}<br/>TTL: 86400s
    R-->>A: OK
    A-->>B: 200 OK<br/>Set-Cookie: session_id=...<br/>(HttpOnly, Secure, SameSite=Strict)
    
    Note over B,R: Authenticated Request
    B->>A: GET /api/v1/employees<br/>Cookie: session_id=...
    A->>R: GET session:{id}
    R-->>A: User data
    A->>A: Extend TTL
    A->>A: Process request
    A-->>B: 200 OK + response
    
    Note over B,R: Logout Flow
    B->>A: POST /api/v1/auth/logout
    A->>R: DELETE session:{id}
    R-->>A: OK
    A-->>B: 200 OK<br/>Set-Cookie: session_id=; Max-Age=0
```

## Flow Steps

1. **Login**: User submits credentials → server verifies → session created in Redis → cookie set
2. **Authenticated Request**: Cookie sent → server validates session in Redis → request processed
3. **Logout**: Session deleted from Redis → cookie cleared

## Security Controls

| Control | Implementation |
|---|---|
| Password hashing | bcrypt, cost factor 12 |
| Account lockout | 5 failed attempts → 15 min cooldown |
| Session TTL | 24 hours inactivity timeout |
| Cookie flags | HttpOnly, Secure, SameSite=Strict |
| CSRF protection | Double-submit cookie pattern |
| Rate limiting | 10 req/min/IP on auth endpoints |
