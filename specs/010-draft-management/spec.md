# Feature Specification: Draft Management (Save Drafts)

**Feature Branch**: `010-draft-management`  
**Created**: 2026-02-28  
**Status**: Draft  
**Input**: User description: "create Draft Management (save drafts)."

## User Scenarios & Testing *(mandatory)*

### User Story 1 - Submitter Saves Idea as Draft (Priority: P1)

A submitter (employee) can save a partially completed idea submission as a draft. They fill in some fields (title, description, category, dynamic fields, attachments), choose "Save draft" instead of "Submit", and the system stores the draft. The submitter can leave and return later without losing their work.

**Why this priority**: The core value is preventing loss of work when submitters are interrupted or need more time. Without draft saving, any navigation away or session loss discards all input.

**Independent Test**: Can be fully tested by logging in as submitter, opening the idea submission form, entering partial data, clicking "Save draft", then navigating away and returning to find the draft restored with all entered values. Delivers value by enabling submitters to work incrementally.

**Acceptance Scenarios**:

1. **Given** a submitter is on the idea submission form with some fields filled, **When** they click "Save draft", **Then** the system persists the draft with all current values (fixed fields, dynamic fields, attached files) and shows a success indicator
2. **Given** a submitter has saved a draft, **When** they navigate away (e.g., to another page) and later open the draft again, **Then** all previously entered data is restored and editable
3. **Given** a submitter is on the form with no or minimal data, **When** they click "Save draft", **Then** the system accepts and stores the draft (partial data is allowed)
4. **Given** a submitter saves a draft, **When** they view their drafts list or submissions area, **Then** the draft appears clearly marked as "Draft" (distinct from submitted ideas)
5. **Given** a submitter has a draft open, **When** they save again, **Then** the existing draft is updated (no duplicate is created)

---

### User Story 2 - Submitter Completes and Submits Draft (Priority: P2)

A submitter can open a saved draft, complete or modify the remaining fields, and submit the idea. Upon submission, the draft is converted to a submitted idea with normal status (e.g., "submitted") and enters the evaluation workflow. The draft is no longer listed as a draft.

**Why this priority**: Drafts only add value when submitters can finish and submit them. This story completes the draft-to-submission flow.

**Independent Test**: Can be fully tested by opening a saved draft, adding or editing content, submitting, and verifying the idea appears in the submitted list with status "submitted" and the draft no longer appears in drafts.

**Acceptance Scenarios**:

1. **Given** a submitter has a saved draft, **When** they open it, complete required fields, and click "Submit", **Then** the idea is submitted, enters the evaluation workflow, and is removed from the drafts list
2. **Given** a submitter opens a draft and makes edits, **When** they submit, **Then** the submitted idea reflects all current values (including edits made in this session)
3. **Given** a submitter opens a draft and submits without filling all required fields, **When** they click "Submit", **Then** the system prevents submission and shows validation messages (same as for a new submission)
4. **Given** a submitter submits a draft successfully, **When** they view the idea list, **Then** the idea appears with submitted status and is no longer in their drafts

---

### User Story 3 - Submitter Manages Drafts (List, Discard) (Priority: P3)

A submitter can view a list of their drafts, open any draft to edit, and discard drafts they no longer need. The drafts list shows identifying information (e.g., title if provided, creation/update date) so submitters can find the right draft quickly.

**Why this priority**: With multiple drafts, submitters need to manage them. Listing and discarding are essential for a clean experience; editing is covered in Story 1 and 2.

**Independent Test**: Can be fully tested by creating multiple drafts, viewing the list, opening a specific draft, discarding one, and verifying the list updates correctly.

**Acceptance Scenarios**:

1. **Given** a submitter has one or more drafts, **When** they access their drafts list or submission area, **Then** they see all their drafts with identifying info (e.g., title or "Untitled draft", last updated date)
2. **Given** the drafts list is visible, **When** the submitter selects a draft, **Then** they are taken to the form with that draft loaded for editing
3. **Given** a submitter has a draft they no longer need, **When** they choose "Discard" or "Delete" and confirm, **Then** the draft is permanently removed
4. **Given** a submitter has reached the maximum number of drafts allowed, **When** they try to save a new draft, **Then** the system prevents saving and explains they must submit or discard an existing draft first

---

### Edge Cases

- What happens when the form configuration changes after a draft was saved? When the submitter opens the draft, the system loads it with the current form configuration. Values for fields that still exist are restored; values for removed fields are preserved for historical purposes but not displayed. New fields appear empty.
- How does the system handle a submitter with no drafts? The drafts list shows an empty state (e.g., "No drafts") with guidance to create a new idea.
- What happens when a submitter tries to open a draft that was created with a different (older) form configuration? The draft loads; existing field values map where possible; any structural mismatch is handled gracefully (e.g., show what can be shown, allow editing and resave).
- How does the system handle session expiry or logout with an unsaved draft open? If the user had not clicked "Save draft", data in the current session may be lost. Clear messaging (e.g., "Save draft to keep your work") helps. Auto-save is out of scope for v1.
- What happens when a submitter discards a draft that has file attachments? Attachments associated only with the draft are removed; storage is cleaned up.
- How does the system handle concurrent access (e.g., same draft open in two tabs)? Last-save-wins. If the user saves in one tab, the other tab's state may be stale; a simple approach is to treat each save as authoritative.

## Requirements *(mandatory)*

### Functional Requirements

- **FR-001**: System MUST allow submitters to save an in-progress idea submission as a draft, persisting all form data (fixed fields, dynamic fields, attached files) without requiring validation of required fields
- **FR-002**: System MUST store drafts distinctly from submitted ideas (e.g., via status "draft") so they do not appear in the evaluation workflow
- **FR-003**: System MUST allow submitters to open a saved draft and resume editing with all previously saved data restored
- **FR-004**: System MUST allow submitters to submit a draft as a complete idea once required fields are satisfied; upon successful submission, the draft is converted to a submitted idea and removed from the drafts list
- **FR-005**: System MUST allow submitters to view a list of their own drafts, showing identifying information (e.g., title or placeholder, last updated date)
- **FR-006**: System MUST allow submitters to discard (delete) drafts they no longer need, with confirmation to prevent accidental loss
- **FR-007**: System MUST restrict draft visibility to the owning submitter; evaluators and admins do not see drafts in normal workflows
- **FR-008**: System MUST enforce a maximum number of drafts per user (e.g., 10) to limit storage and abuse
- **FR-009**: System MUST update an existing draft when the submitter saves again from the same draft (no duplicate drafts)
- **FR-010**: System MUST validate required fields only when the submitter chooses "Submit", not when they choose "Save draft"
- **FR-011**: System MUST persist draft attachments (files) and make them available when the draft is reopened; discarded drafts MUST have their orphaned attachments cleaned up

### Key Entities

- **Draft**: An in-progress idea submission saved by a submitter. Attributes: owner (user), form data (fixed and dynamic field values), attached files, status "draft", creation and last-updated timestamps. Distinct from a submitted idea. One draft = one potential idea.
- **Idea (extended)**: An idea can originate from a draft; when submitted, the draft is converted to an idea with status "submitted" and proceeds through the evaluation workflow.
- **Draft List**: A view of the submitter's drafts, showing enough info to identify each (e.g., title, last updated) and actions (open, discard).

## Success Criteria *(mandatory)*

### Measurable Outcomes

- **SC-001**: Submitters can save a draft and return within the same session or a later session to find all data intact
- **SC-002**: Submitters can complete and submit a draft in under 1 minute when all required data is ready
- **SC-003**: Draft list displays within 2 seconds and allows submitters to open the correct draft on first attempt in typical usage (3 or fewer drafts)
- **SC-004**: Zero unintended data loss: drafts are not lost due to navigation, session timeout, or system restart when "Save draft" was used
- **SC-005**: Submitters understand the difference between "Save draft" and "Submit" from clear labeling and feedback

## Assumptions

- **Submitter-only drafts**: Only submitters create and manage drafts; evaluators and admins do not have drafts for ideas they review.
- **Draft limit**: Maximum of 10 drafts per user. Users must submit or discard a draft before creating a new one when at the limit.
- **No auto-save in v1**: Explicit "Save draft" action only; no background auto-save. Future enhancement possible.
- **Form compatibility**: Drafts work with the existing submission form (fixed + dynamic fields + attachments from prior specs). Form configuration changes are handled by loading drafts with current config and mapping preserved values.
- **No sharing**: Drafts are private to the owner; no collaboration or sharing of drafts.
- **Last-save-wins**: No conflict resolution for concurrent edits; the most recent save overwrites.
- **Storage**: Draft attachments use the same storage mechanism as submitted ideas; cleanup on discard follows existing patterns where applicable.
