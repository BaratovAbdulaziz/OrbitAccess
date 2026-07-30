# Configuration Reference

## 1. Overview

Complete reference for all configuration options. Supersedes the inline config descriptions in `26-environment-configuration.md`.

## 2. Purpose

Provide a single reference for all environment variables, their types, defaults, and purposes.

## 3. Functional Requirements

*Covered in `03-functional-requirements.md`.*

## 4. Non-functional Requirements

- All configuration via environment variables
- Sensible defaults for local development
- Production requires explicit values for all required variables

## 5. Technical Design

### Configuration Source

All configuration is loaded from environment variables at startup via `pydantic-settings`. An optional `.env` file is supported for local development but not used in production.

```
Environment Variable > .env file > Default value
```

### Variable Reference

#### Application

| Variable | Type | Default | Required | Description |
|---|---|---|---|---|
| `APP_NAME` | string | `"SMB Access Manager"` | No | Application name used in emails and UI |
| `APP_URL` | string | `"http://localhost:8000"` | Yes (prod) | Public URL of the application |
| `DEBUG` | boolean | `false` | No | Enable debug mode (verbose errors, hot reload) |
| `LOG_LEVEL` | enum | `"INFO"` | No | Log level: DEBUG, INFO, WARNING, ERROR |
| `SECRET_KEY` | string | — | **Yes** | Session signing key (32+ random bytes, hex-encoded) |
| `CORS_ORIGINS` | string | `"*"` | No | Comma-separated allowed CORS origins |

#### Database

| Variable | Type | Default | Required | Description |
|---|---|---|---|---|
| `DATABASE_URL` | string | `"postgresql+asyncpg://user:pass@localhost:5432/orbitaccess"` | Yes (prod) | Async PostgreSQL connection string |
| `DB_POOL_SIZE` | integer | `10` | No | SQLAlchemy connection pool size |
| `DB_MAX_OVERFLOW` | integer | `20` | No | Max overflow connections |
| `DB_ECHO` | boolean | `false` | No | Log all SQL statements (development only) |

#### Redis

| Variable | Type | Default | Required | Description |
|---|---|---|---|---|
| `REDIS_URL` | string | `"redis://localhost:6379/0"` | Yes (prod) | Redis connection string |
| `REDIS_POOL_SIZE` | integer | `10` | No | Redis connection pool size |

#### Encryption

| Variable | Type | Default | Required | Description |
|---|---|---|---|---|
| `FERNET_KEY` | string | — | **Yes** | Base64-encoded Fernet key for token encryption |

#### GitHub OAuth

| Variable | Type | Default | Required | Description |
|---|---|---|---|---|
| `GITHUB_CLIENT_ID` | string | `""` | **Yes** | GitHub OAuth App client ID |
| `GITHUB_CLIENT_SECRET` | string | `""` | **Yes** | GitHub OAuth App client secret |

#### Notion OAuth

| Variable | Type | Default | Required | Description |
|---|---|---|---|---|
| `NOTION_CLIENT_ID` | string | `""` | **Yes** | Notion integration client ID |
| `NOTION_CLIENT_SECRET` | string | `""` | **Yes** | Notion integration client secret |

#### Email (SMTP)

| Variable | Type | Default | Required | Description |
|---|---|---|---|---|
| `SMTP_HOST` | string | `"localhost"` | Yes (prod) | SMTP server hostname |
| `SMTP_PORT` | integer | `587` | No | SMTP server port (25, 465, 587) |
| `SMTP_USER` | string | `""` | Yes (prod) | SMTP username |
| `SMTP_PASSWORD` | string | `""` | Yes (prod) | SMTP password |
| `SMTP_USE_TLS` | boolean | `true` | No | Enable STARTTLS |
| `EMAIL_FROM` | string | `"noreply@orbitaccess.com"` | No | From address for outgoing emails |

#### Rate Limiting

| Variable | Type | Default | Required | Description |
|---|---|---|---|---|
| `RATE_LIMIT_AUTH` | integer | `10` | No | Max auth requests per minute per IP |
| `RATE_LIMIT_API` | integer | `60` | No | Max API requests per minute per IP |
| `RATE_LIMIT_WINDOW` | integer | `60` | No | Rate limit window in seconds |

#### Session

| Variable | Type | Default | Required | Description |
|---|---|---|---|---|
| `SESSION_TTL_SECONDS` | integer | `86400` | No | Session TTL in seconds (24h) |
| `SESSION_REFRESH_THRESHOLD` | integer | `3600` | No | Extend TTL if more than this many seconds remain |

#### Provisioning

| Variable | Type | Default | Required | Description |
|---|---|---|---|---|
| `PROVISIONING_MAX_RETRIES` | integer | `3` | No | Max provisioning retry attempts |
| `PROVISIONING_RETRY_BACKOFF_BASE` | integer | `5` | No | Base backoff in seconds (exponential: 5, 15, 45) |
| `PROVISIONING_JOB_TIMEOUT` | integer | `120` | No | Job timeout in seconds |

### Startup Validation

On application startup, `config.py` validates all required variables. If any are missing, the application logs the missing variables and exits with code 1.

```python
# app/config.py
class Settings(BaseSettings):
    # ...
    @model_validator(mode="after")
    def validate_production_settings(self):
        if not self.debug:
            required_vars = ["SECRET_KEY", "FERNET_KEY", "DATABASE_URL", "REDIS_URL"]
            missing = [v for v in required_vars if not getattr(self, v, None)]
            if missing:
                raise ValueError(f"Missing required configuration: {', '.join(missing)}")
        return self
```

### Environment-Specific Configuration

| Environment | Config File | Notes |
|---|---|---|
| Development | `.env` (optional) | Sensible defaults, DEBUG=true |
| Testing | CI environment variables | Test database, mocked external services |
| Staging | VPS environment variables | Production-like, staging OAuth apps |
| Production | VPS environment variables | Production OAuth apps, real secrets |

### Secrets Generation

```bash
# Generate SECRET_KEY (use for sessions)
python -c "import secrets; print(secrets.token_hex(32))"

# Generate FERNET_KEY (use for token encryption)
python -c "from cryptography.fernet import Fernet; print(Fernet.generate_key().decode())"

# Generate DATABASE_URL password
python -c "import secrets; print(secrets.token_urlsafe(16))"
```

## 6. Data Model

No changes.

## 7. API Changes

No changes.

## 8. UI Changes

No changes.

## 9. Security Considerations

- Secrets (SECRET_KEY, FERNET_KEY, passwords) use SecretStr — never logged
- CORS_ORIGINS should be restricted in production (not `*`)
- DEBUG must be false in production

## 10. Error Handling

- Missing required env var → startup failure with clear message
- Invalid env var type → startup failure with type error
- `.env` file missing → allowed; uses actual environment variables

## 11. Edge Cases

- `DATABASE_URL` with special characters → must be URL-encoded
- Trailing whitespace in env vars → pydantic-settings strips automatically
- `*` for CORS_ORIGINS → allows all origins (development only)

## 12. Testing Strategy

- Test config loads with minimum required vars
- Test config validation fails with clear message when required vars missing
- Test SecretStr does not expose values in logs

## 13. Acceptance Criteria

- Application starts with all required variables
- Missing variables cause clear error message at startup
- All configuration options documented

## 14. Future Improvements

- Runtime configuration reload for non-sensitive settings
- Admin UI for viewing (non-secret) configuration
- Configuration profiles for common deployment scenarios
- YAML/TOML config file support for complex settings
