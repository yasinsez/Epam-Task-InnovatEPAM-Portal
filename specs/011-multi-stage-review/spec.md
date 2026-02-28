# Feature Specification: Multi-Stage Review

**Feature Branch**: `011-multi-stage-review`  
**Created**: February 28, 2026  
**Status**: Draft  
**Input**: User description: "Create the Multi-Stage Review (configurable stages)."

## User Scenarios & Testing *(mandatory)*

### User Story 1 - Admin Configures Review Stages (Priority: P1)

Admins can define the review stages that ideas pass through before a final decision. Each stage has a name and order (e.g., "Initial Screening", "Technical Review", "Final Decision"). The configuration determines how ideas progress from submission to acceptance or rejection.

**Why this priority**: Configurable stages are the foundation of this feature. Without the ability to define stages, the multi-stage review cannot exist. This delivers the core value of "configurable stages."

**Independent Test**: Can be fully tested by logging in as an admin, opening the stage configuration, adding/editing/reordering stages, saving, and verifying the configuration persists. Delivers the core value of "stages are configurable."

**Acceptance Scenarios**:

1. **Given** an admin is logged in, **When** they open the review stages configuration, **Then** they see the list of defined stages in order
2. **Given** an admin is configuring stages, **When** they add a new stage with a name and position, **Then** the stage is saved and appears in the correct order
3. **Given** stages exist, **When** an admin reorders stages (e.g., swaps two stages), **Then** the new order is persisted and reflected everywhere
4. **Given** stages exist, **When** an admin edits a stage name, **Then** the updated name is saved and visible
5. **Given** stages exist, **When** an admin removes a stage (where no ideas are currently in that stage), **Then** the stage is removed from the configuration

---

### User Story 2 - Ideas Advance Through Stages (Priority: P1)

Evaluators (or admins) can move an idea from one stage to the next. Each idea has a current stage. When an evaluator completes their review at a stage, they can advance the idea to the next stage or, at the final stage, accept or reject the idea.

**Why this priority**: Stage advancement is the core workflow action. Without it, ideas remain stuck and the multi-stage process does not function. This delivers the core value of "ideas progress through stages."

**Independent Test**: Can be fully tested by submitting an idea, logging in as evaluator, advancing the idea through each configured stage, and finally accepting or rejecting at the last stage.

**Acceptance Scenarios**:

1. **Given** an idea is in stage 1 of N, **When** an evaluator completes review and advances it, **Then** the idea moves to stage 2
2. **Given** an idea is in the final stage, **When** an evaluator chooses to accept or reject with comments, **Then** the idea receives the final decision (accepted/rejected) and no longer advances
3. **Given** an idea is in any non-final stage, **When** a user views the idea, **Then** they see the current stage name and position in the workflow
4. **Given** an idea advances to a new stage, **When** any user views the idea list or detail, **Then** the updated stage is displayed
5. **Given** an evaluator advances an idea, **When** the action completes, **Then** the stage transition is persisted and optionally includes comments

---

### User Story 3 - Submitter Sees Stage Progress (Priority: P2)

Submitters can see which stage their idea is in and how far it has progressed through the review pipeline. This provides transparency and reduces support inquiries about status.

**Why this priority**: Submitter visibility improves user experience but the core workflow (configure stages, advance ideas) functions without it. Delivers value of "submitters understand where their idea stands."

**Independent Test**: Can be fully tested by submitting an idea, having an evaluator advance it through stages, and verifying the submitter sees the current stage and progress in the idea detail view.

**Acceptance Scenarios**:

1. **Given** an idea has been submitted, **When** the submitter views the idea detail, **Then** they see the current stage (e.g., "Stage 1 of 3: Initial Screening")
2. **Given** an idea has advanced through multiple stages, **When** the submitter views it, **Then** they see the current stage and optionally the path completed (e.g., "Initial Screening ✓ → Technical Review ✓ → Final Decision")
3. **Given** an idea has been accepted or rejected, **When** the submitter views it, **Then** they see the final decision and all evaluation feedback

---

### User Story 4 - Minimum One Stage with Accept/Reject (Priority: P1)

The system must support at least one review stage. If no custom stages are configured, the system falls back to the existing evaluation workflow (submitted → under review → accept/reject) so that evaluation continues to work.

**Why this priority**: Ensures backward compatibility and prevents breaking the evaluation workflow when multi-stage is first introduced. A single-stage configuration is a valid "multi-stage" setup.

**Independent Test**: Can be fully tested by having no custom stages (or a single stage), submitting an idea, and verifying it can still be accepted or rejected via the standard evaluation flow.

**Acceptance Scenarios**:

1. **Given** no custom stages are configured, **When** an idea is submitted, **Then** it can be evaluated using the default workflow (per spec 007)
2. **Given** exactly one stage is configured, **When** an evaluator reviews an idea at that stage, **Then** they can accept or reject with comments (same as single-stage flow)
3. **Given** multiple stages exist, **When** an idea reaches the last stage, **Then** the evaluator can accept or reject with required comments

---

### Edge Cases

- What happens when an admin removes a stage that has ideas currently in it? → System prevents removal or requires reassigning those ideas to another stage first
- What happens when an admin reorders stages and an idea is in the middle of the pipeline? → Idea retains its logical position; stage references are updated to reflect new ordering
- What happens when no stages are configured and an admin tries to evaluate? → System uses default workflow (spec 007) or prompts admin to configure at least one stage
- What happens when two evaluators try to advance the same idea from the same stage simultaneously? → First successful action wins; second sees "This idea has already been advanced" or similar
- What happens when an admin adds a new stage between two existing stages? → New stage is inserted at the specified position; ideas in later stages are not automatically moved
- What happens when the only evaluator is unavailable and an idea is stuck in a stage? → Idea remains in that stage until an evaluator acts; no auto-advance (out of scope: escalations, reassignment)

## Requirements *(mandatory)*

### Functional Requirements

- **FR-001**: System MUST allow admins to create, edit, reorder, and remove review stages (subject to constraints when ideas are in a stage)
- **FR-002**: System MUST persist stage configuration and apply it to all ideas in the review pipeline
- **FR-003**: System MUST assign each submitted idea to the first configured stage (or default workflow if no stages)
- **FR-004**: System MUST allow evaluators (and admins) to advance an idea from the current stage to the next stage
- **FR-005**: System MUST allow evaluators (and admins) to accept or reject an idea with required comments when the idea is in the final stage
- **FR-006**: System MUST display the current stage of each idea in the idea list and idea detail view
- **FR-007**: System MUST support at least one stage; zero stages must fall back to default evaluation workflow (spec 007)
- **FR-008**: System MUST prevent advancing an idea that has already been advanced from that stage (first successful action wins)
- **FR-009**: System MUST persist stage transitions with timestamps and optional comments
- **FR-010**: System MUST enforce a maximum of 2000 characters for stage transition comments (per spec 007)
- **FR-011**: System MUST prevent removal of a stage that contains one or more ideas unless those ideas are first reassigned or the removal is blocked with a clear message
- **FR-012**: Submitters MUST be able to view the current stage and final decision (if any) for their own ideas

### Key Entities

- **Review Stage**: A configurable step in the review pipeline; has a name, order (position), and optional description
- **Stage Configuration**: The ordered list of stages that define the review pipeline for the system
- **Idea**: Extended with current stage reference (which stage the idea is in) and stage history
- **Stage Transition**: A record of an idea moving from one stage to another; includes timestamp, optional comments, evaluator reference

## Success Criteria *(mandatory)*

### Measurable Outcomes

- **SC-001**: Admins can configure a new review stage (add, name, position) in under 1 minute
- **SC-002**: Evaluators can advance an idea from one stage to the next in under 30 seconds
- **SC-003**: Submitters can see the current stage of their idea within 2 seconds of opening the detail view
- **SC-004**: 100% of ideas in a stage can be advanced (when evaluator has permission) without errors under normal conditions
- **SC-005**: Stage configuration changes (add, edit, reorder, remove) persist and are reflected across all views within 5 seconds
- **SC-006**: Existing evaluation workflow (spec 007) continues to function when multi-stage is introduced (backward compatibility)

## Assumptions

- Evaluation workflow (spec 007) is implemented; ideas have status, evaluators can accept/reject with comments
- User roles (submitter, evaluator, admin) exist per spec 003; admins can configure stages; evaluators and admins can advance ideas
- Stage configuration is system-wide (one pipeline for all ideas); per-category or per-campaign pipelines are out of scope
- Stages are sequential; no branching, parallel, or conditional flows
- Comments at each stage transition are optional unless at the final stage (where accept/reject requires comments per spec 007)
- Maximum number of stages: assumed reasonable limit (e.g., 10–20) to prevent abuse; specific limit can be defined in implementation
- No automatic stage escalation or timeouts; ideas remain in a stage until manually advanced
