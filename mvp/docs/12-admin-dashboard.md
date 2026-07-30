# Admin Dashboard

## 1. Overview

The admin dashboard is the main interface administrators see after logging in. It provides a high-level overview of the organization's status and quick access to all management functions.

## 2. Purpose

Serve as the landing page and navigation hub for all administration tasks.

## 3. Functional Requirements

- Display organization name and admin name
- Show summary statistics (total employees, active, provisioning, failed)
- Show integration health status
- Provide navigation to all sections
- Display recent activity (last 5 log entries)

## 4. Non-functional Requirements

- Page load <1 second
- Real-time status updates via HTMX polling (every 10 seconds for provisioning status)

## 5. Technical Design

### Screen Layout

```
┌─────────────────────────────────────────────┐
│  SMB Access Manager    [Org Name]  [Logout] │  ← Top nav bar
├─────────────────────────────────────────────┤
│  ┌─────────┐ ┌──────────┐ ┌───────────┐   │
│  │ 45      │ │ 3        │ │ 2         │   │  ← Stats cards
│  │ Total   │ │Pending   │ │Failed     │   │
│  └─────────┘ └──────────┘ └───────────┘   │
│                                             │
│  ┌─────────────────────────────┐           │
│  │ Integrations                │           │  ← Integration status
│  │ ✓ GitHub (acme-org)         │           │
│  │ ⚠ Notion (disconnected)     │           │
│  │ [Connect]                   │           │
│  └─────────────────────────────┘           │
│                                             │
│  ┌─────────────────────────────┐           │
│  │ Recent Activity             │           │  ← Recent log entries
│  │ • 10:00 — Added Sam Rivera  │           │
│  │ • 09:45 — Offboarded J. Doe │           │
│  │ [View all →]                │           │
│  └─────────────────────────────┘           │
└─────────────────────────────────────────────┘
```

### Components

| Component | Description | States |
|---|---|---|
| TopNav | Organization name, user menu, logout | — |
| StatsCards | Employee counts by status | Loading (skeleton), loaded, error |
| IntegrationStatus | Status of each connected service | Connected, disconnected, error, loading |
| RecentActivity | Last 5 activity log entries | Empty ("No activity yet"), loaded, loading |
| QuickActions | Add employee, invite admin | — |

### States

- **Loading**: Skeleton placeholders for stats cards and activity list
- **Loaded**: Full dashboard with real data
- **Error**: Error banner if API fails; retry button
- **Empty**: Welcome message if no employees or integrations exist yet

### Navigation

Dashboard accessible via `/dashboard` or `/`. Sidebar or top nav links to:
- Employees (`/employees`)
- Roles (`/roles`)
- Integrations (`/integrations`)
- Activity Log (`/activity-log`)
- Settings (`/settings`)

## 6. Data Model

- Employees (count by status)
- Integrations (list with status)
- Activity logs (last 5 entries)

## 7. API Changes

- GET /api/v1/dashboard/summary (aggregate endpoint for dashboard data)

## 8. UI Changes

This document defines the main dashboard screen.

## 9. Security Considerations

- Dashboard only accessible to authenticated owners and admins
- Data scoped to the user's organization

## 10. Error Handling

- API failure → show error banner with "Unable to load dashboard. [Retry]"
- Integration error → show warning icon with "Integration needs attention"

## 11. Edge Cases

- Brand new org with no employees → show "Get started" call-to-action
- All employees offboarded → show "0 active, X total" stats
- Integration disconnected mid-session → HTMX poll detects and updates UI

## 12. Testing Strategy

- Test dashboard renders with all states
- Test HTMX polling updates integration status
- Test empty state for new organizations

## 13. Acceptance Criteria

- Dashboard loads with correct stats
- Integration status visible
- Recent activity visible
- Navigation links work correctly

## 14. Future Improvements

- Graph of provisioning activity over time
- Integration-specific metrics
- Admin activity heatmap
- Customizable dashboard widgets
