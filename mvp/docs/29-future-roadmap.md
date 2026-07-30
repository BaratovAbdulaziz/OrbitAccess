# Future Roadmap

## 1. Overview

Describes the planned evolution of SMB Access Manager beyond the MVP. This roadmap guides architectural decisions to ensure the MVP doesn't paint us into a corner.

## 2. Purpose

Provide strategic direction for the product after MVP launch. Informed by the product vision and anticipated customer needs.

## 3. Functional Requirements

*Covered in `03-functional-requirements.md`.*

## 4. Non-functional Requirements

*Covered in `04-non-functional-requirements.md`.*

## 5. Technical Design

### V1: Post-MVP (Months 3–6)

#### Additional Integrations

| Integration | Priority | Complexity | Notes |
|---|---|---|---|
| Slack | High | Medium | OAuth + invite to workspace/channels |
| Google Workspace | High | High | Directory API, group management |
| Microsoft 365 | High | High | Graph API, group management |
| Linear | Medium | Low | OAuth + team membership |
| Vercel | Medium | Medium | Team invite via API |
| AWS IAM | Low | High | IAM user/role creation |

#### Feature Enhancements

| Feature | Priority | Description |
|---|---|---|
| Bulk employee import (CSV) | High | Upload CSV with names, emails, roles |
| Employee self-service portal | Medium | Employee logs in, views their access, requests changes |
| Role templates | Medium | Pre-built role configs for common patterns |
| Approval workflows | Medium | Manager approval required before provisioning |
| Scheduled offboarding | Medium | Set future departure date |
| Webhook events | Low | Send events to external systems on provisioning changes |

### V2: Growth (Months 6–12)

#### Enterprise Features

| Feature | Description |
|---|---|
| SSO/SAML | Okta, Azure AD, Google as identity providers |
| SCIM provisioning | System for Cross-domain Identity Management |
| Directory sync | Sync users from Google Workspace / Azure AD |
| Audit report exports | PDF/CSV export with compliance formatting |
| Role-based access control for admins | Granular admin permissions |
| Multi-organization management | MSP-style management of multiple orgs |

#### Platform

| Feature | Description |
|---|---|
| API token for programmatic access | Developer API with rate limits |
| Terraform provider | Infrastructure-as-code for access management |
| Public REST API | Third-party integration via API |

### V3: Scale (Year 2+)

#### Commercial Features

| Feature | Description |
|---|---|
| Billing and subscription tiers | Free, Pro, Enterprise plans |
| Usage-based pricing | Per-active-user pricing |
| Custom branding/white-label | Enterprise branding |
| SLA guarantees | Uptime guarantees for paid tiers |
| Dedicated support SLAs | Enterprise support tiers |

#### Technical Scale

| Feature | Description |
|---|---|
| Multi-region deployment | Geographic redundancy |
| Read replicas | Scale activity log queries |
| Horizontal scaling | Multiple app instances behind load balancer |
| Event sourcing | Full event-sourced audit system |
| CQRS | Separate read/write models for activity logs |

### Architecture Evolution

```
MVP: Monolith
  │
  ├── Single FastAPI process
  ├── In-process ARQ workers
  └── Single PostgreSQL + Redis

V1: Modular Monolith
  │
  ├── Domain modules (identity, provisioning, integrations)
  ├── Separate worker process (horizontal scaling)
  └── Read replica for logs

V2: Service Extraction
  │
  ├── Identity Service (auth, users, orgs)
  ├── Provisioning Service (job orchestration)
  ├── Integration Service (external API calls)
  └── Audit Service (activity log with event sourcing)

V3: Event-Driven
  │
  ├── Message broker (RabbitMQ/NATS)
  ├── Event-sourced audit system
  ├── Microservices with bounded contexts
  └── GraphQL API gateway for clients
```

### Integration Provider API (Future)

For V2+, the system should support a plugin-style integration provider:

```python
class IntegrationProvider(ABC):
    """Interface all integrations must implement."""

    @abstractmethod
    async def provision(self, employee: Employee, config: dict) -> dict: ...

    @abstractmethod
    async def deprovision(self, employee: Employee, config: dict) -> dict: ...

    @abstractmethod
    async def validate_config(self, config: dict) -> bool: ...

    @abstractmethod
    async def health_check(self) -> bool: ...
```

This allows third-party developers to create integrations without modifying core code.

## 6. Data Model

Future data model changes anticipated:
- `integrations.config` expanded for additional providers
- `role_integrations.config` expanded for provider-specific configs
- Webhook events table
- Billing/subscriptions tables
- Audit log event sourcing (separate event store)

## 7. API Changes

- V2: API versioning strategy needed (v1 continues, v2 introduced)
- Future: GraphQL optional layer

## 8. UI Changes

- Self-service portal for employees (separate from admin dashboard)
- Settings page for billing, branding, SSO config
- Integration marketplace for discovering new integrations

## 9. Security Considerations

- SSO/SAML introduces federation trust considerations
- SCIM requires careful handling of external identity references
- API tokens require rate limiting and rotation policies
- Each new integration must go through security review

## 10. Error Handling

- As integration count grows, error aggregation and alerting become critical
- Integration health monitoring across 20+ providers

## 11. Edge Cases

- Cross-provider dependencies (e.g., "provision Slack after Google Workspace")
- Partial provider outages affecting specific orgs
- Provider API changes breaking existing integrations
- Data residency requirements for enterprise customers

## 12. Testing Strategy

- Integration contract tests for each provider
- Chaos engineering for provider API failures
- Regression test suite grows with each new integration

## 13. Acceptance Criteria

N/A — roadmap document.

## 14. Future Improvements

This document is the future improvements section.

## Appendix: Integration Prioritization Matrix

| Integration | Customer Demand | Complexity | Maintenance Cost | Priority |
|---|---|---|---|---|
| Slack | Very High | Medium | Low | 1 |
| Google Workspace | Very High | High | Medium | 2 |
| Microsoft 365 | High | High | Medium | 3 |
| Linear | Medium | Low | Low | 4 |
| Vercel | Medium | Medium | Low | 5 |
| AWS IAM | Low | Very High | High | 6 |
| Figma | Medium | Low | Low | 7 |
| GitLab | Medium | Medium | Low | 8 |
