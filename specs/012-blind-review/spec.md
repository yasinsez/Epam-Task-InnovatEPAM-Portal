# Feature Specification: Blind Review (Anonymous Evaluation)

**Feature Branch**: `012-blind-review`  
**Created**: February 28, 2026  
**Status**: Draft  
**Input**: User description: "can you create the Blind Review (anonymous evaluation) for the ideas."

## User Scenarios & Testing *(mandatory)*

### User Story 1 - Evaluator Identity Hidden in Evaluations (Priority: P1)

When an evaluator (admin or reviewer) accepts or rejects an idea and provides comments, their identity is not revealed. Submitters and other users who view the evaluation feedback see that the idea was evaluated, but do not see who performed the evaluation. This reduces bias, encourages honest feedback, and protects evaluators from pressure or retaliation.

**Why this priority**: Anonymity of evaluators is the core value of blind review. Without it, the feature does not deliver its primary benefit. This delivers the core value of "evaluations are anonymous."

**Independent Test**: Can be fully tested by logging in as an evaluator, accepting or rejecting an idea with comments, then viewing the idea as the submitter or another user and verifying that the evaluator's name or identity is not displayed.

**Acceptance Scenarios**:

1. **Given** an evaluator has accepted or rejected an idea with comments, **When** the submitter views the idea detail, **Then** they see the evaluation outcome and comments but not the evaluator's identity (e.g., displayed as "Evaluated" or "Reviewed by Anonymous")
2. **Given** an evaluator has evaluated an idea, **When** another evaluator or admin views the idea detail, **Then** they see the evaluation outcome and comments but not which evaluator performed it
3. **Given** multiple ideas have been evaluated by different evaluators, **When** a user views the idea list or detail, **Then** no evaluator identity is visible for any evaluation
4. **Given** an evaluation exists, **When** any user with access views it, **Then** the system displays a generic label (e.g., "Evaluated", "Reviewed") instead of the evaluator's name or identifier

---

### User Story 2 - Evaluation Comments Remain Visible Without Attribution (Priority: P1)

Evaluation comments (the feedback explaining accept or reject) remain visible and useful to submitters. The comments are shown without linking them to the evaluator's identity. Submitters can read and act on the feedback while the evaluator remains anonymous.

**Why this priority**: Comments are essential for submitters to understand the decision; anonymity should not remove this value. This story ensures the blind review does not reduce feedback quality.

**Independent Test**: Can be fully tested by having an evaluator reject an idea with specific comments, then verifying the submitter sees the comments but not who wrote them.

**Acceptance Scenarios**:

1. **Given** an idea has been rejected with comments, **When** the submitter views the idea detail, **Then** they see the full comments text
2. **Given** an idea has been accepted with comments, **When** the submitter views the idea detail, **Then** they see the full comments text
3. **Given** evaluation comments are displayed, **When** the user views them, **Then** no evaluator name, email, or other identifying information is shown alongside the comments
4. **Given** stage transition comments exist (in multi-stage review), **When** displayed in blind review mode, **Then** they are shown without evaluator attribution

---

### User Story 3 - Admins Optionally See Evaluator Identity for Auditing (Priority: P2)

Administrators may need to know who evaluated an idea for auditing, dispute resolution, or compliance. The system supports an optional configuration or admin-only view where admins can see evaluator identity, while submitters and non-admin users never see it. When this option is disabled or not used, all users including admins see anonymous evaluations.

**Why this priority**: Audit capability supports governance but is secondary to the core anonymity guarantee. Many organizations will not need it for MVP; when needed, it is a safety valve.

**Independent Test**: Can be fully tested by configuring (if supported) admin visibility, having an evaluator evaluate an idea, then verifying admins see the evaluator identity only when the feature is enabled, and submitters never see it.

**Acceptance Scenarios**:

1. **Given** blind review is enabled with admin-audit visibility off, **When** an admin views an evaluated idea, **Then** they see anonymous evaluation (same as other users)
2. **Given** blind review is enabled with admin-audit visibility on, **When** an admin views an evaluated idea, **Then** they can see which evaluator performed the evaluation (for auditing only)
3. **Given** admin-audit visibility is on, **When** a submitter or non-admin evaluator views the idea, **Then** they never see evaluator identity
4. **Given** the system supports admin-audit visibility, **When** it is toggled, **Then** the change applies to future and existing evaluations consistently

---

### User Story 4 - Blind Review Integrates with Existing Evaluation Workflow (Priority: P1)

Blind review works with the existing evaluation workflow (spec 007) and multi-stage review (spec 011). Evaluators perform accept/reject and stage advancement as before; the only change is that evaluator identity is withheld from display. No additional steps or actions are required of evaluators.

**Why this priority**: Integration ensures the feature does not break or complicate existing workflows. Evaluators should not need to opt in or perform extra steps.

**Independent Test**: Can be fully tested by enabling blind review, then performing the full evaluation flow (single-stage or multi-stage) and verifying evaluations complete normally while identity remains hidden.

**Acceptance Scenarios**:

1. **Given** blind review is enabled, **When** an evaluator accepts or rejects an idea with comments, **Then** the evaluation is saved and processed exactly as in spec 007, with identity withheld from display
2. **Given** blind review is enabled and multi-stage review is used, **When** an evaluator advances an idea through stages, **Then** stage transitions work as in spec 011, with evaluator identity withheld where applicable
3. **Given** blind review is enabled, **When** an evaluator completes an evaluation, **Then** they receive the same confirmation or feedback as before; their anonymity is transparent to them (no extra UI)
4. **Given** blind review is enabled, **When** submitters view status and feedback, **Then** they see the same structure (status, comments) but without evaluator attribution

---

### Edge Cases

- What happens when an evaluator's account is deactivated after they evaluated an idea? → Evaluation outcome and comments remain visible; identity was never shown, so no change in display. If admin-audit is used, display may show "deactivated user" or similar.
- What happens when blind review is turned off after evaluations have been performed? → System MUST NOT retroactively expose evaluator identity for past evaluations unless explicitly configured for audit purposes. Past evaluations remain anonymous; new evaluations may show identity based on new configuration.
- What happens when two or more evaluators evaluate the same idea in a multi-stage flow? → Each stage's evaluation is displayed without attribution; if multiple evaluations exist at the same stage (e.g., panel review), each is shown anonymously.
- What happens when an admin needs to contact an evaluator about their evaluation? → Admin uses admin-audit visibility (if enabled) to identify the evaluator; contact happens outside the system. No in-app mechanism to reveal identity to submitters.
- What happens when a submitter disputes an evaluation and claims bias? → Process is handled by admins using audit tools (if available); submitters do not gain access to evaluator identity through the system.

## Requirements *(mandatory)*

### Functional Requirements

- **FR-001**: System MUST NOT display evaluator identity (name, email, user ID, or any identifier) to submitters when showing evaluation outcomes or comments
- **FR-002**: System MUST NOT display evaluator identity to non-admin users when showing evaluation outcomes or comments
- **FR-003**: System MUST display evaluation outcomes (accepted/rejected) and comments to submitters and authorized users as in spec 007, with evaluator attribution removed
- **FR-004**: System MUST use a generic label (e.g., "Evaluated", "Reviewed", "Reviewed by Anonymous") instead of evaluator identity wherever evaluations are displayed to submitters and non-admin users
- **FR-005**: System MUST persist evaluator reference internally for audit and data integrity, but MUST NOT expose it through any user-facing display to submitters or non-admin evaluators
- **FR-006**: System MUST apply blind review to all evaluation workflows: single-stage (spec 007) and multi-stage (spec 011) when blind review is enabled
- **FR-007**: System MUST support a configuration or feature flag to enable or disable blind review; when disabled, evaluator identity may be displayed per existing behavior (if supported)
- **FR-008**: System MAY support an optional admin-audit mode where admins can see evaluator identity for auditing; when supported, submitters and non-admin users MUST NEVER see evaluator identity
- **FR-009**: System MUST NOT retroactively expose evaluator identity for evaluations performed while blind review was enabled, even if blind review is later disabled
- **FR-010**: Evaluators MUST be able to complete evaluations (accept, reject, advance stages, add comments) without any additional steps or awareness of anonymity; the workflow is unchanged from their perspective

### Key Entities *(include if feature involves data)*

- **Evaluation**: Extended with internal evaluator reference (for audit) that is never displayed to submitters or non-admin users when blind review is enabled
- **Blind Review Configuration**: Optional entity or setting indicating whether blind review is enabled and whether admin-audit visibility is allowed
- **Idea**: No change to core entity; display logic determines whether to show evaluator attribution based on blind review configuration and user role

## Success Criteria *(mandatory)*

### Measurable Outcomes

- **SC-001**: 100% of evaluations displayed to submitters show no evaluator identity (name, email, or identifier)
- **SC-002**: Submitters can view evaluation feedback (outcome and comments) within 2 seconds of opening the idea detail, with no evaluator attribution visible
- **SC-003**: Evaluators can complete an evaluation (accept/reject with comments) in under 1 minute with no change in workflow or perceived effort
- **SC-004**: When blind review is enabled, zero instances of evaluator identity leakage to submitters or non-admin users in normal usage
- **SC-005**: Evaluation workflow (spec 007) and multi-stage review (spec 011) continue to function fully with blind review enabled; no regression in core evaluation features

## Assumptions

- Evaluation workflow (spec 007) and optionally multi-stage review (spec 011) are implemented; ideas have status, evaluators can accept/reject with comments
- User roles (submitter, evaluator, admin) exist per spec 003; permission model distinguishes admins from other users
- Blind review applies to evaluator anonymity (evaluator identity hidden from submitters); submitter anonymity (evaluators not seeing who submitted) is out of scope unless explicitly added later
- Evaluator reference is stored internally for audit trails and referential integrity; only display layer masks it when blind review is on
- Admin-audit visibility (admins seeing evaluator identity) is optional; system may ship with blind review only (everyone sees anonymous evaluations) and add admin-audit in a later iteration
- Configuration for enabling/disabling blind review may be system-wide; per-campaign or per-stage blind review settings are out of scope for initial release
