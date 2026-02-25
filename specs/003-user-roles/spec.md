# Feature Specification: Basic Role Distinction (Submitter vs. Evaluator/Admin)

**Feature Branch**: `003-user-roles`  
**Created**: February 25, 2026  
**Status**: Draft  
**Input**: User description: "Basic role distinction (submitter vs. evaluator/admin)"

## Clarifications

### Session 2026-02-25

- Q: Should role changes be audited, and if so, who manages the audit log? → A: No audit logging required for MVP; defer to Phase 2
- Q: Should users with the "evaluator" role also be able to perform "submitter" actions (submit ideas)? → A: No, roles are exclusive; evaluators cannot submit ideas (submitter-only capability)
- Q: What is the enforcement timing requirement for role changes to take effect? → A: Immediate on next request/action (1-5 seconds typical latency); no session refresh needed
- Q: How should the system handle session invalidation or token refresh when a role changes? → A: Always fetch fresh role from DB on each API call; no caching of role in token/session
- Q: Should admins be able to grant themselves the "admin" role, or does it require a higher-level authorization step? → A: Admins cannot demote themselves; can change others' roles but not their own

## User Scenarios & Testing *(mandatory)*

<!--
  IMPORTANT: User stories should be PRIORITIZED as user journeys ordered by importance.
  Each user story/journey must be INDEPENDENTLY TESTABLE - meaning if you implement just ONE of them,
  you should still have a viable MVP (Minimum Viable Product) that delivers value.
  
  Assign priorities (P1, P2, P3, etc.) to each story, where P1 is the most critical.
  Think of each story as a standalone slice of functionality that can be:
  - Developed independently
  - Tested independently
  - Deployed independently
  - Demonstrated to users independently
-->

### User Story 1 - User Roles Assignment (Priority: P1)

The system assigns a default role to each newly registered user. Admin users can view and modify user roles to control who can submit ideas (submitter role), who can evaluate ideas (evaluator role), and who has full system permissions (admin role). Each user has exactly one active role that determines their capabilities within the system.

**Why this priority**: Role assignment is foundational to the entire access control system. Without role storage and assignment, the system cannot differentiate between users with different capabilities. This is required before any role-based features can be built.

**Independent Test**: Can be fully tested by registering a new user and verifying they have a default role, then as an admin user navigating to a role management interface and changing the role of another user, and verifying the role change is persisted. Delivers the core value of "system can distinguish users by role."

**Acceptance Scenarios**:

1. **Given** a new user completes registration, **When** their account is created, **Then** they are assigned the "submitter" role by default
2. **Given** an admin user is logged in, **When** they access the admin panel, **Then** they can view a list of all users with their current roles
3. **Given** an admin user is viewing the user list, **When** they select a user and change their role from "submitter" to "evaluator", **Then** the role change is saved and persisted in the database
4. **Given** a user has had their role changed, **When** they log out and log back in, **Then** the system reflects their new role in their session
5. **Given** an admin user attempts to change another admin's role, **When** they attempt the change, **Then** the change is allowed (admins can manage other admins)
6. **Given** a user has a role assigned, **When** they are deleted from the system, **Then** their role assignment is also removed

---

### User Story 2 - Role-Based Page Access (Priority: P1)

The system restricts access to pages based on user roles. Submitters can access submission pages, evaluators can access evaluation pages, and admins can access all pages. When users without the required role attempt to access restricted pages, they are redirected to an appropriate access denied page or their role-appropriate dashboard.

**Why this priority**: Page-level access control is critical to prevent unauthorized users from viewing or using features they shouldn't have access to. This is a core security requirement and must work before allowing any per-role UI customization.

**Independent Test**: Can be fully tested by logging in as different user roles and attempting to navigate to pages restricted to other roles (e.g., submitter tries to access evaluator dashboard), verifying redirects work correctly, and confirming submitters can access submission pages while evaluators get access denied.

**Acceptance Scenarios**:

1. **Given** a submitter user is logged in, **When** they navigate to `/ideas/submit`, **Then** the page loads and they can access the submission form
2. **Given** a submitter user is logged in, **When** they attempt to navigate to `/admin/users`, **Then** they are redirected to a "Access Denied" page
3. **Given** an evaluator user is logged in, **When** they navigate to `/evaluation/queue`, **Then** the page loads and they can access the evaluation interface
4. **Given** an evaluator user is logged in, **When** they attempt to navigate to `/admin/roles`, **Then** they are redirected to a "Access Denied" page
5. **Given** an admin user is logged in, **When** they attempt to navigate to any page in the system, **Then** all pages load without access restrictions
6. **Given** a user is logged out, **When** they attempt to access any protected page, **Then** they are redirected to the login page
7. **Given** a user's role is changed while they are logged in, **When** they navigate to a previously accessible page that now requires a different role, **Then** they are redirected to access denied

---

### User Story 3 - Role-Based API Access (Priority: P1)

The system enforces role-based permissions at the API level to prevent unauthorized data access and modifications. API requests from users lacking the required role are denied. This prevents direct API calls from bypassing UI-level restrictions.

**Why this priority**: Role-based API access is equally important as page access. APIs must validate permissions to prevent unauthorized data access. Without this, users could bypass UI-level restrictions with direct API calls.

**Independent Test**: Can be fully tested by making authenticated API requests as different user roles and verifying responses are either allowed or denied appropriately, confirming API requests from unauthorized roles are rejected.

**Acceptance Scenarios**:

1. **Given** a submitter user is logged in, **When** they submit an idea via the API, **Then** the request succeeds
2. **Given** a submitter user is logged in, **When** they attempt to access the evaluation queue via API, **Then** the request is denied with an authorization error
3. **Given** an evaluator user is logged in, **When** they request the evaluation queue via API, **Then** the request succeeds and returns ideas to evaluate
4. **Given** an admin user is logged in, **When** they change a user's role via the API, **Then** the request succeeds and the role is changed
5. **Given** a user with an invalid or missing role is logged in, **When** they make any API request, **Then** the system treats them as unauthorized
6. **Given** a submitter user attempts to access the admin users endpoint via direct API call, **When** they submit the request with their authentication token, **Then** the request is denied with an authorization error

---

### User Story 4 - Role-Based UI Display (Priority: P2)

The user interface dynamically displays different navigation menus, dashboards, and action buttons based on the logged-in user's role. Submitters see submission-focused features, evaluators see evaluation-focused features, and admins see administrative features. This improves usability by hiding irrelevant options.

**Why this priority**: UI customization by role improves user experience and reduces confusion for users, but doesn't block core functionality. The system is still usable with full UI visible to all roles; this is a UX enhancement rather than a security requirement.

**Independent Test**: Can be fully tested by logging in as each role (submitter, evaluator, admin) and verifying the navigation menu, dashboard widgets, and available action buttons differ appropriately for each role; submitters don't see evaluation buttons, evaluators don't see admin options, etc.

**Acceptance Scenarios**:

1. **Given** a submitter user is logged in, **When** they view the main navigation, **Then** they see "Submit Idea" and "My Ideas" but not "Evaluation Queue" or "Admin Panel"
2. **Given** an evaluator user is logged in, **When** they view the main navigation, **Then** they see "Evaluation Queue" and "Assigned Ideas" but not "Submit Idea" or "Admin Panel"
3. **Given** an admin user is logged in, **When** they view the main navigation, **Then** they see all sections including "Admin Panel", "User Management", "Submit Idea", and "Evaluation Queue"
4. **Given** a submitter user is on their dashboard, **When** the page renders, **Then** the dashboard shows submission statistics (ideas submitted, status of ideas) rather than evaluation statistics
5. **Given** an evaluator user is on their dashboard, **When** the page renders, **Then** the dashboard shows evaluation statistics (ideas pending review, completed reviews) rather than submission statistics

---

### Edge Cases

- What happens if a user's role is deleted from the system while they are logged in? → System treats user as unauthorized on next action
- What happens if a role change request receives an invalid role value? → System rejects with validation error and doesn't change role  
- What if an admin attempts to change their own role to submitter? → Admin self-demotion is prevented; only other admins can change an admin's role
- What happens if a user has no role assigned? → System treats them as unauthorized and redirects to login
- What happens when multiple admins change the same user's role simultaneously? → System handles as race condition with last-write-wins or returns conflict error

## Requirements *(mandatory)*

### Functional Requirements

- **FR-001**: System MUST store a role for each user (one of: submitter, evaluator, admin)
- **FR-002**: System MUST assign the "submitter" role to newly registered users by default
- **FR-003**: System MUST prevent access to pages requiring roles the user doesn't have, redirecting to access denied page or dashboard
- **FR-004**: System MUST prevent authenticated API requests from roles that don't have permission, denying the request
- **FR-005**: System MUST allow admin users to view all users and their current roles via an admin interface
- **FR-006**: System MUST allow admin users to change any user's role (including other admins) and persist the change immediately, except admins cannot change their own role
- **FR-007**: System MUST validate that role values are one of the three allowed values (submitter, evaluator, admin) and reject invalid values
- **FR-008**: System MUST update role enforcement immediately when a user's role is changed (user's next action uses new permissions)
- **FR-009**: System MUST display UI elements (navigation, buttons, dashboard sections) conditionally based on user's role
- **FR-010**: System MUST handle users with missing or invalid roles by treating them as unauthorized
- **FR-011**: System MUST validate role on every protected API call against the database; role information MUST NOT be cached in JWT tokens or long-lived session stores
- **FR-012**: System MUST enforce role-exclusive permissions where roles do not inherit capabilities from other roles (e.g., evaluators cannot submit ideas, submitters cannot evaluate ideas)

### Key Entities

- **User**: Extended with a role attribute that stores which of the three roles the user possesses (submitter, evaluator, or admin); default is submitter
- **Role**: Represents the three permission levels in the system (submitter, evaluator, admin) and defines which features and data each role can access

## Success Criteria *(mandatory)*

### Measurable Outcomes

- **SC-001**: All users can be assigned one of the three roles without error, and role assignments persist across login sessions
- **SC-002**: Users can only access pages and features their role permits; unauthorized access is immediately denied
- **SC-003**: Admin users can change any user's role (except their own) and the new permissions are enforced on the user's next API call or page request (typical latency 1-5 seconds)
- **SC-004**: New registrations automatically receive the "submitter" role with 100% consistency
- **SC-005**: Role-based UI correctly displays for all three roles with no role-specific content visible to other roles
- **SC-006**: System handles concurrent role changes without creating inconsistent state

## Assumptions

- The existing User authentication system (from spec 002-user-auth) is fully implemented and functioning
- The three role types (submitter, evaluator, admin) are the only roles needed for MVP
- Multi-tenancy and dynamic role creation are not required for MVP
- Role changes take effect on the user's next request or action (not requiring real-time push notifications) with typical latency of 1-5 seconds
- Admin users are trusted to manage all roles including other admin accounts, but cannot modify their own role
- Roles are exclusive and non-hierarchical; no role inheritance (evaluators cannot submit, submitters cannot evaluate)
- Role state is always fetched fresh from the database on each protected API endpoint call; no role caching in JWT tokens or long-lived sessions
