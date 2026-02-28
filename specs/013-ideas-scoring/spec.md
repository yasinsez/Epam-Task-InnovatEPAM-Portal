# Feature Specification: Ideas Scoring System

**Feature Branch**: `013-ideas-scoring`  
**Created**: February 28, 2026  
**Status**: Draft  
**Input**: User description: "can you add Scoring System (1-5 ratings) to the ideas"

## User Scenarios & Testing *(mandatory)*

### User Story 1 - Evaluator Assigns Rating to Idea (Priority: P1)

An evaluator or admin viewing an idea can assign a numeric rating from 1 to 5 to express the quality or merit of the idea. The rating is entered when evaluating the idea (e.g., alongside accept/reject or as part of the evaluation flow) and is persisted. Once saved, the rating is visible to anyone with access to the idea.

**Why this priority**: Assigning ratings is the core capability of the scoring system. Without it, no scores exist and the feature delivers no value. This delivers the core value of "ideas can be scored on a 1-5 scale."

**Independent Test**: Can be fully tested by logging in as an evaluator or admin, opening a submitted or under-review idea, assigning a rating between 1 and 5, and confirming it is saved and displayed. Delivers the core value of "evaluators can rate ideas."

**Acceptance Scenarios**:

1. **Given** an evaluator or admin is viewing a submitted or under-review idea, **When** they assign a rating from 1 to 5 and save, **Then** the rating is persisted and displayed on the idea
2. **Given** an evaluator assigns a rating, **When** they view the idea again, **Then** they see the previously assigned rating
3. **Given** an evaluator has assigned a rating, **When** another user with access views the idea, **Then** they see the rating
4. **Given** an evaluator attempts to submit a rating outside 1-5 (e.g., 0 or 6), **When** they try to save, **Then** the system prevents submission and prompts for a valid rating
5. **Given** an evaluator assigns a rating, **When** they later change their mind before final evaluation, **Then** they can update the rating until the idea is accepted or rejected

---

### User Story 2 - Rating Displayed in Idea List and Detail (Priority: P1)

Users who can view ideas see the idea's rating (when one has been assigned) in both the idea list and the idea detail view. The rating is displayed in a clear, consistent format (e.g., "4/5" or a visual indicator such as stars). Ideas without a rating show an appropriate placeholder (e.g., "Not yet rated" or "—").

**Why this priority**: Displaying ratings makes the scoring actionable. Users need to see scores to compare ideas, prioritize review, or understand evaluation outcomes. This delivers the core value of "ratings are visible where ideas are shown."

**Independent Test**: Can be fully tested by having at least one idea with a rating and one without, then verifying both appear correctly in the list and detail views for users with access.

**Acceptance Scenarios**:

1. **Given** an idea has an assigned rating, **When** a user views the idea list, **Then** they see the rating displayed for that idea (e.g., "4/5" or equivalent)
2. **Given** an idea has an assigned rating, **When** a user opens the idea detail view, **Then** they see the rating displayed prominently
3. **Given** an idea has no rating yet, **When** a user views the list or detail, **Then** they see an appropriate placeholder (e.g., "Not yet rated") rather than a misleading value
4. **Given** multiple ideas have ratings, **When** a user views the list, **Then** ratings are displayed consistently for each idea (same format and placement)

---

### User Story 3 - Submitter Views Rating on Own Ideas (Priority: P2)

A submitter can view the rating assigned to their own ideas after an evaluator has scored them. This provides feedback on how their idea was assessed and supports transparency in the evaluation process.

**Why this priority**: Submitter visibility completes the feedback loop and builds trust. Secondary to assigning and displaying ratings because the core scoring mechanism works without it, but submitters benefit from seeing how their ideas were rated.

**Independent Test**: Can be fully tested by having an evaluator rate a submitter's idea, then logging in as the submitter and verifying they see the rating in the idea detail view.

**Acceptance Scenarios**:

1. **Given** an evaluator has assigned a rating to a submitter's idea, **When** the submitter views their idea detail, **Then** they see the rating
2. **Given** a submitter's idea has not yet been rated, **When** the submitter views the detail, **Then** they see "Not yet rated" or equivalent
3. **Given** a submitter views the idea list, **When** their ideas have ratings, **Then** they see the rating in the list for their own ideas

---

### User Story 4 - Sort or Filter Ideas by Rating (Priority: P3)

Evaluators and admins can sort the idea list by rating (highest first or lowest first) to prioritize review. Optionally, they can filter to show only ideas above a certain rating threshold. This helps focus evaluation effort on higher-potential ideas.

**Why this priority**: Sorting and filtering by rating improves efficiency when many ideas exist. It is a convenience feature that enhances the value of scoring but is not required for the scoring system to function.

**Independent Test**: Can be fully tested by having ideas with different ratings, applying sort or filter controls, and verifying the list updates correctly.

**Acceptance Scenarios**:

1. **Given** ideas have varying ratings, **When** an evaluator or admin selects "Sort by rating (highest first)", **Then** the list shows ideas ordered by rating with highest at top; ideas without ratings appear at the end or in a defined position
2. **Given** an evaluator selects "Sort by rating (lowest first)", **When** the list is displayed, **Then** ideas are ordered with lowest rated first
3. **Given** a filter "Show ideas rated 4 or higher" is available, **When** the user applies it, **Then** the list shows only ideas with rating >= 4
4. **Given** a sort or filter is applied, **When** the user clears it, **Then** the list returns to default ordering (e.g., by submission date)

---

### Edge Cases

- What happens when an evaluator assigns a rating but never completes accept/reject? → The rating is saved and visible; the idea remains in submitted or under-review status
- What happens when the same idea is evaluated by multiple evaluators (if future workflows allow)? → For MVP with single evaluation per idea, one rating applies. If multiple ratings are supported later, display the average and document the policy in assumptions
- What happens when an evaluator updates a rating after the idea has been accepted or rejected? → System prevents rating changes once the idea is in accepted or rejected status; rating is final at evaluation completion
- What happens when a user views an idea they should not access? → Access control applies as per existing rules; rating is only visible to users with access to the idea
- What happens when the rating display is requested for an idea with no rating? → Show "Not yet rated" or equivalent; do not show "0" or empty/confusing value

## Requirements *(mandatory)*

### Functional Requirements

- **FR-001**: System MUST allow evaluators and admins to assign a numeric rating from 1 to 5 to ideas that are submitted or under review
- **FR-002**: System MUST persist the assigned rating with the idea and associate it with the evaluator (for audit) and timestamp
- **FR-003**: System MUST display the rating in the idea list and idea detail view when a rating has been assigned
- **FR-004**: System MUST display "Not yet rated" or equivalent when an idea has no rating
- **FR-005**: System MUST prevent ratings outside the 1-5 range and provide validation feedback
- **FR-006**: System MUST allow evaluators to update the rating before the idea is accepted or rejected
- **FR-007**: System MUST prevent rating changes after the idea has been accepted or rejected
- **FR-008**: System MUST make the rating visible to submitters when viewing their own ideas
- **FR-009**: System MUST enforce existing access rules; only users with access to an idea can see its rating
- **FR-010**: System SHOULD allow evaluators and admins to sort the idea list by rating (highest or lowest first)
- **FR-011**: System MAY allow filtering ideas by minimum rating threshold (e.g., 4 or higher)

### Key Entities *(include if feature involves data)*

- **Idea**: Extended with an optional rating (1-5). Rating is assigned during evaluation.
- **Rating**: Represents a 1-5 score assigned to an idea. Key attributes: value (1-5), evaluator reference, timestamp. One rating per idea in MVP (last assignment wins if updated before accept/reject).

## Success Criteria *(mandatory)*

### Measurable Outcomes

- **SC-001**: Evaluators can assign and save a rating to an idea in under 30 seconds
- **SC-002**: Users can see the rating (or "Not yet rated") for any idea they have access to within 2 seconds of loading the list or detail view
- **SC-003**: 100% of saved ratings fall within the valid 1-5 range
- **SC-004**: Submitters can view the rating on their evaluated ideas within 2 seconds of opening the detail view
- **SC-005**: Rating changes are blocked after accept/reject in 100% of test cases

## Assumptions

- Evaluation workflow (spec 007) is implemented; evaluators and admins can view and evaluate ideas
- In MVP, a single evaluation and single rating per idea; the evaluator who accepts/rejects typically assigns the rating
- Rating can be assigned during evaluation (alongside or before accept/reject) or as a standalone step; exact UI placement follows existing evaluation patterns
- If multiple evaluators rate the same idea in future workflows, display policy (e.g., average) will be defined in a subsequent spec
- User roles (submitter, evaluator, admin) and access rules follow spec 003
- Rating is whole numbers only (1, 2, 3, 4, 5); no decimals or half-stars in MVP
