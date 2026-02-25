# Feature Specification: Evaluation Workflow

**Feature Branch**: `007-evaluation-workflow`  
**Created**: February 25, 2026  
**Status**: Draft  
**Input**: User description: "Evaluation workflow with basic status tracking (submitted, under review, accepted, rejected) and simple admin accept/reject with comments"

## Clarifications

### Session 2026-02-25

- Q: If two admins open the same submitted idea simultaneously and both attempt to accept or reject it, what should happen? → A: First successful submission wins; second admin sees "This idea has already been evaluated" and their evaluation is discarded.
- Q: When exactly should the status transition to "under review" occur? → A: When the admin clicks an explicit "Evaluate" or "Start evaluation" button/action.
- Q: What is the exact maximum character limit for evaluation comments? → A: 2000 characters (matches idea description limit from spec 004).
- Q: Where should the Accept/Reject evaluation UI live? → A: Inline in the idea detail view (buttons + comment field visible on the same page).
- Q: When is an idea assigned "submitted" status? → A: Automatically when the idea is created via the idea submission form (spec 004).

## User Scenarios & Testing *(mandatory)*

### User Story 1 - Display Idea Status (Priority: P1)

All users who can view an idea see its current evaluation status: submitted, under review, accepted, or rejected. The status is visible in the idea list and in the idea detail view so submitters can track their ideas and evaluators/admins can see what needs review or has been decided.

**Why this priority**: Status visibility is the foundation for the evaluation workflow. Without it, users cannot understand where an idea stands in the process. This delivers the core value of "status tracking."

**Independent Test**: Can be fully tested by submitting an idea and verifying its status appears as "submitted" in the list and detail view. Delivers the core value of "ideas have visible status."

**Acceptance Scenarios**:

1. **Given** an idea has been submitted, **When** a user views the idea in the list, **Then** they see the status "submitted" (or equivalent label)
2. **Given** an idea has been submitted, **When** a user opens the idea detail view, **Then** they see the current status (submitted, under review, accepted, or rejected)
3. **Given** an idea's status has changed (e.g., to accepted or rejected), **When** a user views the idea list or detail, **Then** they see the updated status
4. **Given** an idea is under review, **When** a user views it, **Then** they see the status "under review"

---

### User Story 2 - Admin Accepts or Rejects Idea with Comments (Priority: P1)

An admin (or evaluator with evaluation rights) can evaluate an idea by accepting or rejecting it. When accepting or rejecting, the admin must provide comments that explain the decision. The comments are stored with the decision and visible to the submitter.

**Why this priority**: Accept/reject with comments is the core evaluation action. Without it, submitters receive no feedback and the workflow has no meaningful outcome. This delivers the core value of "admin can evaluate ideas."

**Independent Test**: Can be fully tested by logging in as an admin, opening a submitted idea, choosing Accept or Reject, entering comments, and confirming. Verify the status updates and comments are persisted and visible.

**Acceptance Scenarios**:

1. **Given** an admin is viewing a submitted or under-review idea, **When** they choose to accept it and enter comments, **Then** the idea status becomes "accepted" and the comments are saved
2. **Given** an admin is viewing a submitted or under-review idea, **When** they choose to reject it and enter comments, **Then** the idea status becomes "rejected" and the comments are saved
3. **Given** an admin attempts to accept or reject without entering comments, **When** they submit the evaluation, **Then** the system prevents submission and prompts them to provide comments
4. **Given** an admin has accepted or rejected an idea, **When** they or another user views the idea detail, **Then** the evaluation comments are visible

---

### User Story 3 - Submitter Views Evaluation Feedback (Priority: P2)

A submitter can view the evaluation outcome (accepted or rejected) and the evaluator's comments on their own ideas. This allows them to understand the decision and, if rejected, learn what they might improve.

**Why this priority**: Feedback visibility completes the evaluation loop and provides value to submitters. Secondary to status display and admin actions because the core workflow works without it (admins can still evaluate), but submitters need to see results.

**Independent Test**: Can be fully tested by having an admin reject an idea with comments, then logging in as the submitter and verifying they see "rejected" and the comments in the idea detail view.

**Acceptance Scenarios**:

1. **Given** an idea has been accepted with comments, **When** the submitter views their idea detail, **Then** they see the "accepted" status and the evaluation comments
2. **Given** an idea has been rejected with comments, **When** the submitter views their idea detail, **Then** they see the "rejected" status and the evaluation comments
3. **Given** an idea is still submitted or under review, **When** the submitter views their idea detail, **Then** they see the current status and no evaluation comments (or a message that evaluation is pending)

---

### User Story 4 - Admin Transitions Idea to Under Review (Priority: P3)

When an admin begins evaluating an idea, the system can optionally transition its status to "under review" to indicate that evaluation is in progress. This helps other admins avoid duplicate work and gives submitters a clearer picture of progress.

**Why this priority**: "Under review" is a convenience status that improves coordination when multiple evaluators exist. For MVP with a single admin or few evaluators, it is optional. The workflow functions with submitted → accepted/rejected only.

**Independent Test**: Can be fully tested by having an admin open an idea for evaluation and verifying the status changes to "under review" (or remains "submitted" if this story is deferred).

**Acceptance Scenarios**:

1. **Given** an admin is viewing a submitted idea, **When** they click the explicit "Evaluate" or "Start evaluation" button, **Then** the idea status becomes "under review" and they enter the evaluation flow
2. **Given** an idea is under review, **When** the admin accepts or rejects it, **Then** the status transitions to "accepted" or "rejected" accordingly

---

### Edge Cases

- What happens when an admin tries to evaluate an idea that has already been accepted or rejected? → System prevents re-evaluation or shows a message that the idea has already been decided; no duplicate evaluation
- What happens when two admins open the same submitted idea simultaneously and both attempt to evaluate it? → First successful submission wins; the second admin sees "This idea has already been evaluated" and their evaluation is discarded (no locking; no overwrite)
- What happens when a submitter views an idea that was evaluated but the evaluator's account was later deactivated? → The evaluation outcome and comments remain visible; submitter sees the decision and comments (evaluator identity may be anonymized or shown as "Administrator" if needed)
- What happens when comments exceed a reasonable length? → System enforces a maximum of 2000 characters and shows validation error if exceeded
- What happens when an admin loses connection while submitting evaluation? → User sees an error; evaluation is not saved until successfully submitted; they can retry

## Requirements *(mandatory)*

### Functional Requirements

- **FR-001**: System MUST assign and persist one of four statuses for each idea: submitted, under review, accepted, rejected
- **FR-001a**: System MUST assign "submitted" status automatically when an idea is created via the idea submission form (spec 004)
- **FR-002**: System MUST display the current idea status in the idea list and in the idea detail view to all users with access to that idea
- **FR-003**: System MUST allow admins (and evaluators with evaluation rights) to accept an idea with required comments
- **FR-004**: System MUST allow admins (and evaluators with evaluation rights) to reject an idea with required comments
- **FR-005**: System MUST require comments when accepting or rejecting an idea; evaluation cannot be submitted without comments
- **FR-006**: System MUST persist evaluation comments with the idea and make them visible to the submitter and to evaluators/admins when viewing the idea
- **FR-006a**: System MUST present Accept/Reject evaluation controls (buttons and comment field) inline in the idea detail view for admins/evaluators
- **FR-007**: System MUST prevent re-evaluation of ideas that have already been accepted or rejected
- **FR-008**: System MUST transition idea status from submitted to accepted or rejected when an admin completes evaluation
- **FR-009**: System SHOULD transition idea status to "under review" when an admin clicks the explicit "Evaluate" or "Start evaluation" button for a submitted idea (optional for MVP)
- **FR-010**: System MUST enforce a maximum of 2000 characters for evaluation comments and display validation feedback if exceeded

### Key Entities *(include if feature involves data)*

- **Idea**: Extended with status (submitted, under review, accepted, rejected) and optional evaluation result
- **Evaluation**: Represents the outcome of an evaluation: decision (accept/reject), comments, evaluator reference, timestamp

## Success Criteria *(mandatory)*

### Measurable Outcomes

- **SC-001**: Users can see the current status of any idea they have access to within 2 seconds of loading the list or detail view
- **SC-002**: Admins can complete an evaluation (accept or reject with comments) in under 1 minute
- **SC-003**: Submitters can view evaluation feedback (status and comments) on their ideas within 2 seconds of opening the detail view
- **SC-004**: 100% of evaluated ideas have comments stored and visible to submitters
- **SC-005**: No idea can be evaluated twice; re-evaluation attempts are blocked in 100% of test cases

## Assumptions

- Idea submission and listing features (specs 004, 005, 006) are implemented; ideas exist with title, description, category, and optional attachment
- Ideas created via the submission form (004) receive "submitted" status at creation; no separate draft/submit step
- User roles (submitter, evaluator, admin) are in place per spec 003; admins and evaluators have permission to evaluate ideas
- Only admins (or evaluators with evaluation rights) can change idea status; submitters cannot change status
- Comments are plain text; rich text or attachments for comments are out of scope for MVP
- A single evaluation per idea; no multi-stage review or scoring (those are in Phases 5–7)
- Once accepted or rejected, an idea cannot be reverted to submitted or under review in MVP
