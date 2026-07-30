# Backup and Recovery

## 1. Overview

Defines the backup strategy, recovery procedures, and disaster recovery plan for SMB Access Manager MVP.

## 2. Purpose

Ensure data can be recovered in the event of data loss, corruption, or infrastructure failure. Meet the minimum data protection bar for a SaaS product handling customer access credentials.

## 3. Functional Requirements

- Daily automated database backups
- Point-in-time recovery capability (within backup schedule)
- Secure backup storage
- Documented recovery procedure

## 4. Non-functional Requirements

- Recovery Time Objective (RTO): 4 hours
- Recovery Point Objective (RPO): 24 hours
- Backup retention: 30 days

## 5. Technical Design

### Backup Scope

| Data | Backup Method | Frequency | Retention |
|---|---|---|---|
| PostgreSQL database | pg_dump (SQL format) | Daily (0200 UTC) | 30 days |
| Environment variables | Stored securely outside server (password manager) | On change | Indefinite |
| Application code | Git repository (GitHub) | On push | Indefinite |
| Docker images | Docker Hub / GitHub Container Registry | On build | Indefinite |

**Not backed up**:
- Redis data (session cache + job queue) — ephemeral, rebuilt on restart
- In-memory metrics — lost on restart, acceptable for MVP

### Backup Procedure

```bash
#!/bin/bash
# /scripts/backup.sh

BACKUP_DIR="/backups"
DB_CONTAINER="orbitaccess-db-1"
DB_USER="user"
DB_NAME="orbitaccess"
TIMESTAMP=$(date +%Y%m%d_%H%M%S)
FILENAME="${BACKUP_DIR}/orbitaccess_${TIMESTAMP}.sql.gz"

# Create backup
docker exec ${DB_CONTAINER} pg_dump -U ${DB_USER} -d ${DB_NAME} \
  --clean \
  --if-exists \
  --no-owner \
  --no-acl \
  | gzip > ${FILENAME}

# Encrypt backup (optional but recommended)
# gpg --encrypt --recipient ops@orbitaccess.com ${FILENAME}

# Verify backup integrity
gunzip -t ${FILENAME}
if [ $? -eq 0 ]; then
  echo "Backup verified: ${FILENAME}"
  echo "Size: $(du -h ${FILENAME} | cut -f1)"
else:
  echo "BACKUP VERIFICATION FAILED: ${FILENAME}"
  exit 1
fi

# Cleanup backups older than 30 days
find ${BACKUP_DIR} -name "orbitaccess_*.sql.gz" -mtime +30 -delete
```

**Cron setup**: `0 2 * * * /opt/orbitaccess/scripts/backup.sh`

### Backup Storage

| Environment | Storage Location | Notes |
|---|---|---|
| Development | Local filesystem | Acceptable for dev |
| Staging | Local + S3 backup | `aws s3 cp` after dump |
| Production | Local + S3 backup | S3 bucket with versioning enabled |

S3 bucket configuration:
- Bucket: `orbitaccess-backups`
- Path: `postgresql/<environment>/`
- Server-side encryption: AES-256
- Lifecycle policy: transition to Glacier after 30 days, delete after 365 days
- Versioning: enabled

### Recovery Procedure

#### Full Database Recovery

```bash
#!/bin/bash
# /scripts/restore.sh

BACKUP_FILE=$1
DB_CONTAINER="orbitaccess-db-1"
DB_USER="user"
DB_NAME="orbitaccess"

if [ -z "$BACKUP_FILE" ]; then
  echo "Usage: $0 <backup-file>"
  exit 1
fi

# Stop application to prevent writes during restore
docker compose stop app

# Drop and recreate database (within container)
docker exec ${DB_CONTAINER} psql -U ${DB_USER} -c "DROP DATABASE IF EXISTS ${DB_NAME};"
docker exec ${DB_CONTAINER} psql -U ${DB_USER} -c "CREATE DATABASE ${DB_NAME};"

# Restore from backup
gunzip -c ${BACKUP_FILE} | docker exec -i ${DB_CONTAINER} psql -U ${DB_USER} -d ${DB_NAME}

# Run any pending migrations
docker compose run --rm app alembic upgrade head

# Start application
docker compose up -d app

echo "Recovery complete. Application restarted."
```

#### Point-in-Time Recovery

PostgreSQL WAL archiving is not configured for MVP (requires additional setup). For MVP, point-in-time recovery is limited to the most recent daily backup.

### Disaster Recovery Scenarios

| Scenario | Impact | Recovery Action | RTO |
|---|---|---|---|
| Database corruption | Data loss since last backup | Restore from latest backup | 1 hour |
| VPS failure | Complete outage | Provision new VPS, restore backup, update DNS | 4 hours |
| Accidental data deletion | Specific records lost | Restore from backup (may lose recent changes) | 1 hour |
| Security breach (data compromise) | Potential data exposure | Restore from pre-breach backup, rotate all secrets | 4 hours |
| Region-level cloud outage | Complete outage (if using managed DB) | Cross-region recovery (not available for MVP) | N/A |

### Secrets Recovery

All secrets required to run the application are stored in:
1. **Password manager** (Bitwarden / 1Password): Shared with ops team
2. **GitHub repository secrets**: For CI/CD
3. **VPS environment file**: `/opt/orbitaccess/.env` (not backed up — manually recreated)

### Testing Recovery

- Monthly automated restore test: restore latest backup to staging environment
- Verify data integrity: employee count matches, integrations functional
- Document any issues found during restore testing

## 6. Data Model

No changes.

## 7. API Changes

No changes.

## 8. UI Changes

No changes.

## 9. Security Considerations

- Backups contain encrypted OAuth tokens (encrypted at rest in DB; remain encrypted in backup)
- Backup files should be encrypted before off-server storage (GPG or S3 SSE)
- Backup files contain all customer data — must be protected accordingly
- S3 bucket access restricted to ops team only

## 10. Error Handling

- Backup failure → cron sends email to ops; retry next day
- Restore failure → database may be in inconsistent state; restore from different backup point
- Partial restore → always restore full backup (no table-level restore for MVP)

## 11. Edge Cases

- Backup runs during high load → negligible impact; pg_dump runs at low priority
- Disk full during backup → backup fails; monitoring alerts on disk usage
- Backup file corruption → integrity check (gunzip -t) catches before old backup is deleted
- Multiple backups same day → cron ensures unique filenames (timestamp to second)

## 12. Testing Strategy

- Monthly restore test to staging environment
- Verify backup file integrity
- Test recovery of specific records from backup

## 13. Acceptance Criteria

- Automated daily backup running and verified
- Restore procedure documented and tested
- Backup retention of 30 days
- RTO: 4 hours, RPO: 24 hours

## 14. Future Improvements

- Continuous WAL archiving for point-in-time recovery (PITR)
- Managed PostgreSQL (RDS, Cloud SQL) with automated backups
- Cross-region backup replication
- Backup encryption with customer-managed key
- Automated recovery testing (chaos engineering)
- Database replication for HA (hot standby)
