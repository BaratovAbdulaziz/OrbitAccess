# Product Overview

## 1. Overview

SMB Access Manager is a lightweight Identity and Access Management (IAM) platform designed specifically for small businesses with 5–100 employees. It automates employee onboarding and offboarding by provisioning and revoking access across connected third-party services from a single administration panel.

## 2. Purpose

Small businesses typically manage access manually — sharing passwords, individually inviting users to each service, and often failing to revoke access when employees leave. This creates security risks and administrative overhead. SMB Access Manager eliminates this by providing a single source of truth for employee access that propagates automatically to connected services.

## 3. Functional Requirements

- Organization creation and administration
- Administrator invitation and management
- Third-party service integration (GitHub Organizations, Notion workspaces)
- Employee role definition and management
- Employee lifecycle management (onboarding, offboarding)
- Automated access provisioning based on role
- Automated access revocation on offboarding
- Activity log with audit trail

## 4. Non-functional Requirements

- **Simplicity**: Complete setup in under 30 minutes
- **Performance**: Provisioning operations complete within 60 seconds
- **Availability**: 99.5% uptime during business hours
- **Security**: All tokens encrypted at rest; HTTPS everywhere; audit log is append-only
- **Scalability**: Support up to 100 organizations per instance, 100 employees per organization
- **Maintainability**: Monolith-first architecture with clear module boundaries
- **Cost**: Operable on a single $10–$20/mo VPS for MVP

## 5. Technical Design

- **Stack**: Python (FastAPI) backend, PostgreSQL database, Simple HTML/JS frontend (or lightweight SPA with HTMX/Alpine.js)
- **Deployment**: Single Docker container on a VPS
- **Background Jobs**: FastAPI background tasks / ARQ for async provisioning
- **Authentication**: Session-based auth with email magic links or password
- **Integration Pattern**: OAuth 2.0 for GitHub and Notion connections

## 6. Data Model

*Designed in detail in `06-database-design.md`.*

Core entities: Organization, User (Admin/Employee), Role, Integration (GitHub/Notion), ProvisioningJob, ActivityLog.

## 7. API Changes

*Covered in full in `07-api-design.md`.*

## 8. UI Changes

*Covered in full in `12-admin-dashboard.md` through `16-activity-logs.md`*

## 9. Security Considerations

- All connections over TLS
- OAuth tokens encrypted at rest using Fernet (symmetric encryption)
- Session cookies with HttpOnly, Secure, SameSite flags
- Rate limiting on authentication endpoints
- Input validation on all API inputs
- Principle of least privilege for API keys

## 10. Error Handling

- Structured JSON error responses throughout API
- Provisioning failures logged with full context
- Automatic retry (3 attempts) for integration operations
- Admin notified via in-app notification on provisioning failure

## 11. Edge Cases

- Employee added before GitHub/Notion integration is set up → queued until integration active
- OAuth token expires → background job fails, admin must reconnect integration
- Network failure during provisioning → retry with exponential backoff
- Email invitation bounces → admin can resend or manually set password
- Concurrent provisioning operations → serialized per organization

## 12. Testing Strategy

- Unit tests for business logic and role calculations
- Integration tests for API endpoints
- Mock-based tests for GitHub/Notion API calls
- End-to-end test for complete onboarding flow

## 13. Acceptance Criteria

- Admin can create organization and invite other admins
- Admin can connect GitHub Organization and Notion workspace
- Admin can create roles and assign services/permissions
- Adding an employee with a role provisions access within 60 seconds
- Offboarding an employee revokes all access within 60 seconds
- All actions visible in activity log with timestamps and actor identity

## 14. Future Improvements

- SSO/SAML support
- Directory sync (Google Workspace, Microsoft 365)
- More integrations (Slack, Linear, AWS, Vercel)
- Self-service password reset
- Role templates / marketplace
- SCIM provisioning
- Billing and tiered plans
- Audit report exports (PDF/CSV)
- Webhook events for integration with downstream systems
