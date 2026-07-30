# Deployment

## 1. Overview

The MVP is deployed as a single Docker Compose stack on a VPS. This keeps infrastructure simple and costs low while providing reliable operation.

## 2. Purpose

Define the deployment architecture, infrastructure requirements, and operational procedures.

## 3. Functional Requirements

- One-command deployment (`docker compose up`)
- Automated database migrations on startup
- Persistent data volumes
- Automatic restart on failure
- Health check endpoints

## 4. Non-functional Requirements

- 99.5% uptime during business hours
- Deployable on a $10–$20/mo VPS
- Backup and restore capability

## 5. Technical Design

### Infrastructure

```
┌──────────────────────────────────────────────┐
│                  VPS (Ubuntu 24.04)           │
│                                               │
│  ┌────────────┐  ┌────────────┐  ┌────────┐  │
│  │  FastAPI   │  │ PostgreSQL │  │ Redis  │  │
│  │  (uvicorn) │  │   16       │  │   7    │  │
│  └────────────┘  └────────────┘  └────────┘  │
│       │                │              │       │
│  ┌────┴────┐           │              │       │
│  │ Nginx   │           │              │       │
│  │ (proxy) │           │              │       │
│  └─────────┘           │              │       │
│       │                │              │       │
│       ▼                ▼              ▼       │
│  ┌─────────────────────────────────────┐      │
│  │         Docker Compose             │      │
│  └─────────────────────────────────────┘      │
│                                               │
│  Volumes:                                      │
│  - postgres_data:/var/lib/postgresql/data      │
│  - redis_data:/data                            │
└──────────────────────────────────────────────┘
```

### Docker Compose

```yaml
version: "3.8"

services:
  app:
    build: .
    ports:
      - "8000:8000"
    environment:
      - DATABASE_URL=postgresql+asyncpg://user:pass@db:5432/orbitaccess
      - REDIS_URL=redis://redis:6379/0
      - FERNET_KEY=${FERNET_KEY}
      - SESSION_SECRET=${SESSION_SECRET}
      - GITHUB_CLIENT_ID=${GITHUB_CLIENT_ID}
      - GITHUB_CLIENT_SECRET=${GITHUB_CLIENT_SECRET}
      - NOTION_CLIENT_ID=${NOTION_CLIENT_ID}
      - NOTION_CLIENT_SECRET=${NOTION_CLIENT_SECRET}
      - SMTP_HOST=${SMTP_HOST}
      - SMTP_PORT=${SMTP_PORT}
      - SMTP_USER=${SMTP_USER}
      - SMTP_PASSWORD=${SMTP_PASSWORD}
      - APP_URL=${APP_URL}
    depends_on:
      db:
        condition: service_healthy
      redis:
        condition: service_healthy
    restart: unless-stopped
    healthcheck:
      test: ["CMD", "curl", "-f", "http://localhost:8000/health"]
      interval: 30s
      timeout: 10s
      retries: 3

  db:
    image: postgres:16-alpine
    volumes:
      - postgres_data:/var/lib/postgresql/data
    environment:
      - POSTGRES_USER=user
      - POSTGRES_PASSWORD=pass
      - POSTGRES_DB=orbitaccess
    healthcheck:
      test: ["CMD-SHELL", "pg_isready -U user -d orbitaccess"]
      interval: 10s
      timeout: 5s
      retries: 5
    restart: unless-stopped

  redis:
    image: redis:7-alpine
    volumes:
      - redis_data:/data
    healthcheck:
      test: ["CMD", "redis-cli", "ping"]
      interval: 10s
      timeout: 5s
      retries: 5
    restart: unless-stopped

volumes:
  postgres_data:
  redis_data:
```

### Nginx Configuration

Nginx runs on the host (or as a container) and acts as a TLS-terminating reverse proxy:

```nginx
server {
    listen 443 ssl http2;
    server_name app.orbitaccess.com;

    ssl_certificate /etc/letsencrypt/live/app.orbitaccess.com/fullchain.pem;
    ssl_certificate_key /etc/letsencrypt/live/app.orbitaccess.com/privkey.pem;

    location / {
        proxy_pass http://127.0.0.1:8000;
        proxy_set_header Host $host;
        proxy_set_header X-Real-IP $remote_addr;
        proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
        proxy_set_header X-Forwarded-Proto $scheme;
    }

    location /static/ {
        alias /app/static/;
        expires 30d;
        add_header Cache-Control "public, immutable";
    }
}

server {
    listen 80;
    server_name app.orbitaccess.com;
    return 301 https://$host$request_uri;
}
```

### Environment Variables

| Variable | Description | Source |
|---|---|---|
| DATABASE_URL | PostgreSQL connection string | Generated |
| REDIS_URL | Redis connection string | Generated |
| FERNET_KEY | Encryption key for OAuth tokens | `openssl rand -base64 32` |
| SESSION_SECRET | Session signing key | `openssl rand -hex 32` |
| GITHUB_CLIENT_ID | GitHub OAuth app client ID | GitHub Developer Settings |
| GITHUB_CLIENT_SECRET | GitHub OAuth app secret | GitHub Developer Settings |
| NOTION_CLIENT_ID | Notion OAuth integration ID | Notion Integrations |
| NOTION_CLIENT_SECRET | Notion OAuth secret | Notion Integrations |
| SMTP_* | Email configuration | Mail provider (SendGrid, etc.) |
| APP_URL | Public application URL | `https://app.orbitaccess.com` |

### CI/CD Pipeline

```yaml
# .github/workflows/deploy.yml
name: Deploy

on:
  push:
    branches: [main]

jobs:
  test:
    runs-on: ubuntu-latest
    services:
      postgres:
        image: postgres:16-alpine
        env:
          POSTGRES_USER: user
          POSTGRES_PASSWORD: pass
          POSTGRES_DB: orbitaccess_test
      redis:
        image: redis:7-alpine
    steps:
      - uses: actions/checkout@v4
      - uses: actions/setup-python@v5
        with:
          python-version: "3.12"
      - run: pip install -r requirements.txt
      - run: pip install -r requirements-dev.txt
      - run: alembic upgrade head
      - run: pytest --cov=app --cov-fail-under=80

  deploy:
    needs: test
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v4
      - name: Deploy to VPS
        uses: appleboy/ssh-action@v1.0.3
        with:
          host: ${{ secrets.VPS_HOST }}
          username: ${{ secrets.VPS_USER }}
          key: ${{ secrets.VPS_SSH_KEY }}
          script: |
            cd /opt/orbitaccess
            git pull
            docker compose pull
            docker compose up -d --build
            docker system prune -f
```

### Database Backups

```bash
# Daily backup via cron
0 2 * * * docker exec orbitaccess-db-1 pg_dump -U user orbitaccess | gzip > /backups/orbitaccess_$(date +\%Y\%m\%d).sql.gz

# Retention: 30 days
0 3 * * * find /backups -name "orbitaccess_*.sql.gz" -mtime +30 -delete
```

### Monitoring

- Health check endpoint: `GET /health` returns `{ "status": "ok", "db": true, "redis": true }`
- Docker restart policy: `unless-stopped`
- Basic uptime monitoring via UptimeRobot or similar (free tier)
- Application logs: `docker compose logs -f app`

## 6. Data Model

Database managed via Alembic migrations. Migration runs as part of the app startup.

## 7. API Changes

- GET /health — health check endpoint (no auth required)

## 8. UI Changes

No UI changes.

## 9. Security Considerations

- TLS termination at Nginx
- Database not exposed to the internet
- Environment variables for all secrets
- Regular backups
- Docker containers run as non-root user

## 10. Error Handling

- App crashes → Docker restart policy brings it back
- Database down → health check fails; app returns 503
- Disk full → backup and log rotation configured
- Out of memory → Docker memory limits prevent OOM kills on host

## 11. Edge Cases

- Zero-downtime deployment: not required for MVP; brief downtime acceptable
- Database migration failure → app startup fails; operator rolls back
- Redis data loss → sessions lost (users need to re-login); job queue lost (pending provisioning must be retried manually)
- SSL certificate expiry → automated renewal via Let's Encrypt certbot

## 12. Testing Strategy

- Test Docker Compose setup locally
- Test migration runs on startup
- Test health check endpoint
- Test backup and restore procedure

## 13. Acceptance Criteria

- `docker compose up` starts the full stack
- Application accessible at `https://app.orbitaccess.com`
- Health check returns OK
- Database migrations run automatically
- Backups configured and working

## 14. Future Improvements

- Kubernetes deployment for HA
- Terraform/Pulumi for infrastructure as code
- CDN for static assets
- Blue-green deployment for zero-downtime
- Auto-scaling based on CPU/queue depth
- Database read replicas
- Managed PostgreSQL (RDS, Cloud SQL)
- Sentry/DataDog for error monitoring
