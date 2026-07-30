# Environment Configuration

## 1. Overview

Defines all environment variables, configuration management strategy, and environment-specific settings for SMB Access Manager.

## 2. Purpose

Centralize configuration management and ensure consistent behavior across development, staging, and production environments.

## 3. Functional Requirements

- All configuration via environment variables
- Sensible defaults for development
- Validation on startup (fail fast if required vars missing)

## 4. Non-functional Requirements

- No hardcoded configuration values in code
- Secrets never logged or exposed in error messages

## 5. Technical Design

### Configuration Management

Uses `pydantic-settings` to load and validate configuration:

```python
# app/config.py
from pydantic_settings import BaseSettings
from pydantic import Field, EmailStr, SecretStr

class Settings(BaseSettings):
    # Application
    app_name: str = "SMB Access Manager"
    app_url: str = Field(default="http://localhost:8000")
    debug: bool = Field(default=False)
    secret_key: SecretStr = Field(...)

    # Database
    database_url: str = Field(default="postgresql+asyncpg://user:pass@localhost:5432/orbitaccess")

    # Redis
    redis_url: str = Field(default="redis://localhost:6379/0")

    # Encryption
    fernet_key: SecretStr = Field(...)

    # GitHub OAuth
    github_client_id: str = Field(default="")
    github_client_secret: SecretStr = Field(default="")

    # Notion OAuth
    notion_client_id: str = Field(default="")
    notion_client_secret: SecretStr = Field(default="")

    # SMTP
    smtp_host: str = Field(default="localhost")
    smtp_port: int = Field(default=587)
    smtp_user: str = Field(default="")
    smtp_password: SecretStr = Field(default="")
    email_from: EmailStr = Field(default="noreply@orbitaccess.com")

    # Rate Limiting
    rate_limit_auth: int = Field(default=10)    # requests/min
    rate_limit_api: int = Field(default=60)      # requests/min

    # Session
    session_ttl_seconds: int = Field(default=86400)  # 24 hours

    # Provisioning
    provisioning_max_retries: int = Field(default=3)
    provisioning_retry_backoff_base: int = Field(default=5)  # seconds

    model_config = {"env_file": ".env", "env_file_encoding": "utf-8"}

settings = Settings()
```

### Environment Files

| File | Purpose | Committed? |
|---|---|---|
| `.env.example` | Template with placeholder values | Yes |
| `.env` | Local development overrides | No |
| CI environment | GitHub Actions secrets | No |
| Production environment | VPS environment variables / Docker secrets | No |

### Environment Matrix

| Variable | Dev Default | Staging | Production |
|---|---|---|---|
| `DEBUG` | `true` | `false` | `false` |
| `DATABASE_URL` | Local PostgreSQL | Staging RDS | Production RDS |
| `REDIS_URL` | Local Redis | Staging ElastiCache | Production ElastiCache |
| `APP_URL` | `http://localhost:8000` | `https://staging.orbitaccess.com` | `https://app.orbitaccess.com` |
| `LOG_LEVEL` | `DEBUG` | `INFO` | `INFO` |
| `CORS_ORIGINS` | `*` | Staging URL | Production URL |

### Required Variables (no default)

These variables must be explicitly set or the app fails to start:

| Variable | Why Required |
|---|---|
| `SECRET_KEY` | Session signing key; must be cryptographically random |
| `FERNET_KEY` | OAuth token encryption key; must be base64 Fernet key |
| `GITHUB_CLIENT_ID` | GitHub OAuth app ID |
| `GITHUB_CLIENT_SECRET` | GitHub OAuth app secret |
| `NOTION_CLIENT_ID` | Notion integration ID |
| `NOTION_CLIENT_SECRET` | Notion integration secret |

### Variable Generation

```bash
# Generate a secure secret key
python -c "import secrets; print(secrets.token_hex(32))"

# Generate a Fernet key
python -c "from cryptography.fernet import Fernet; print(Fernet.generate_key().decode())"
```

### `.env.example`

```bash
# Application
DEBUG=true
APP_URL=http://localhost:8000
SECRET_KEY=change-me-to-a-random-secret

# Database
DATABASE_URL=postgresql+asyncpg://user:pass@localhost:5432/orbitaccess

# Redis
REDIS_URL=redis://localhost:6379/0

# Encryption
FERNET_KEY=

# GitHub OAuth
GITHUB_CLIENT_ID=
GITHUB_CLIENT_SECRET=

# Notion OAuth
NOTION_CLIENT_ID=
NOTION_CLIENT_SECRET=

# SMTP
SMTP_HOST=localhost
SMTP_PORT=587
SMTP_USER=
SMTP_PASSWORD=
EMAIL_FROM=noreply@orbitaccess.com

# Rate Limiting
RATE_LIMIT_AUTH=10
RATE_LIMIT_API=60
```

## 6. Data Model

No changes.

## 7. API Changes

No changes.

## 8. UI Changes

No changes.

## 9. Security Considerations

- All secrets use `SecretStr` (hides value in `__repr__`, prevents accidental logging)
- `.env` file never committed to version control
- Fernet key required for token encryption — without it, integrations cannot function
- SMTP password stored as SecretStr

## 10. Error Handling

- Missing required variables → `ValidationError` on startup; app fails to start
- Invalid variable types → descriptive error from pydantic-settings
- File not found (`.env`) → allowed in production (use actual env vars)

## 11. Edge Cases

- `.env` file missing → pydantic-settings uses actual environment variables
- Variable contains special characters → .env quoting handles it; env vars are raw strings
- Database URL with special chars in password → URL-encoded properly in connection string

## 12. Testing Strategy

- Test config loads with minimum required variables
- Test config validation fails when required vars missing
- Test SecretStr values are not exposed in logs

## 13. Acceptance Criteria

- App starts with all required environment variables
- Missing required variables cause clear startup error
- No secrets exposed in logs or error messages

## 14. Future Improvements

- Secrets manager integration (HashiCorp Vault, AWS Secrets Manager)
- Encrypted `.env` files for team development
- Environment-specific config files (dev.yml, prod.yml) for complex configs
- Configuration UI within admin dashboard (for non-sensitive settings)
