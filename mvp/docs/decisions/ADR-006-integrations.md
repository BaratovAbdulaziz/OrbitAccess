# ADR-006: Integration Architecture

**Status**: Accepted

**Context**: The MVP needs to integrate with GitHub Organizations and Notion workspaces. Future integrations will be added.

**Decision**: Use OAuth 2.0 for authentication with both services. Implement a service-layer abstraction (`BaseIntegrationProvider`) so new integrations follow the same pattern. Store tokens encrypted at rest with Fernet.

**Consequences**:
- Positive: Consistent pattern for all integrations
- Positive: OAuth 2.0 is the industry standard for third-party API access
- Positive: Encrypted token storage limits damage from database breach
- Negative: OAuth setup requires developers to register apps with each provider
- Negative: Token lifecycle management varies by provider (GitHub tokens expire, Notion tokens don't)
- Negative: Integration provider abstraction may need adjustment as new integrations are added

**Rationale**: OAuth 2.0 is the only responsible way to access third-party APIs on behalf of users (vs. storing personal access tokens). The integration provider abstraction keeps the provisioning orchestration logic clean and independent of any specific integration implementation.
