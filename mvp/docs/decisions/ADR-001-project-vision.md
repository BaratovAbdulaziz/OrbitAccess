# ADR-001: Project Vision

**Status**: Accepted

**Context**: We need a clear product vision to guide all technical and product decisions.

**Decision**: Build a lightweight IAM platform for small businesses (5–100 employees) focused on simplicity, fast setup, and low cost. The MVP validates core onboarding/offboarding workflows with GitHub Organizations and Notion integrations.

**Consequences**:
- Positive: Clear scope prevents feature creep
- Positive: Targets a specific underserved market
- Neutral: May not suit larger enterprises (future: SSO, SCIM)
- Negative: Two integrations limits value proposition for some customers

**Rationale**: Small businesses are underserved by existing IAM platforms (Okta, JumpCloud) which are priced for enterprises. A focused MVP with the most common tools (GitHub + Notion) minimizes time-to-value while validating the core workflow.
