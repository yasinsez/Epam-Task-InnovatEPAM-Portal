# Feature Specification: Smart Submission Forms (Dynamic Fields)

**Feature Branch**: `001-smart-submission-forms`  
**Created**: 2026-02-28  
**Status**: Draft  
**Input**: User description: "create Smart Submission Forms (dynamic fields)."

## Clarifications

### Session 2026-02-28

- Q: How should backward compatibility with the existing fixed schema (title, description, category) be handled? → A: Retain fixed fields – Title, description, and category stay as mandatory fixed fields; dynamic fields are added alongside them.
- Q: When no dynamic fields are configured, should the system use a minimal default form or prevent submission until configured? → A: Minimal default – New deployments seed with title, description, category; submissions allowed before custom dynamic fields are configured.
- Q: How does the system handle concurrent admin edits to form configuration? → A: Last-write-wins – The most recent save overwrites previous changes; no conflict detection or locking.
- Q: Which dynamic fields appear in the idea list view? → A: All dynamic fields – Include every dynamic field in the list row; truncate or wrap as needed.
- Q: Should form configuration changes be audited? → A: Basic audit log – Record who changed the config and when; no detailed diff history.

## User Scenarios & Testing *(mandatory)*

### User Story 1 - Admin Configures Submission Form Fields (Priority: P1)

An administrator can define which fields appear on the idea submission form. They specify each field's label, data type, whether it is required or optional, and display order. The configuration applies to all new idea submissions.

**Why this priority**: Without configurable fields, the system cannot adapt to different innovation campaigns or departments. This is the foundation for the dynamic form experience.

**Independent Test**: Can be fully tested by logging in as admin, accessing form configuration, adding/editing/reordering fields, and verifying the configuration is saved. Delivers value by enabling form customization without code changes.

**Acceptance Scenarios**:

1. **Given** the user is an admin, **When** they access the form configuration screen, **Then** they see the current field definitions and can add, edit, reorder, or remove fields
2. **Given** an admin is adding a new field, **When** they specify label, type, and required status, **Then** the field is saved and appears in the configured form for submitters
3. **Given** a configured form exists, **When** an admin changes the field order, **Then** submitters see fields in the new order on the submission form
4. **Given** an admin removes a field from the configuration, **When** the change is saved, **Then** that field no longer appears for new submissions (existing submitted data for that field remains accessible for historical ideas)

---

### User Story 2 - Submitter Fills Dynamic Submission Form (Priority: P2)

A submitter (employee) sees the configured fields when submitting an idea. They fill out each field according to its type and validation rules. Required fields must be completed before submission. The form behaves like the existing fixed form but with configurable fields.

**Why this priority**: Submitters are the primary users of the form; dynamic fields only add value when they can complete submissions using the configured form.

**Independent Test**: Can be fully tested by logging in as submitter, opening the submission form, filling required and optional fields, submitting, and verifying the idea is created with the correct values.

**Acceptance Scenarios**:

1. **Given** the form is configured with specific fields, **When** a submitter opens the idea submission page, **Then** they see only the configured fields in the specified order
2. **Given** a field is marked required, **When** the submitter attempts to submit without filling it, **Then** the system prevents submission and shows a clear validation message
3. **Given** the submitter fills all required and optional fields, **When** they submit, **Then** the idea is created and stored with the provided values
4. **Given** a field has type-specific validation (e.g., number range, text length), **When** the submitter enters invalid data, **Then** the system shows appropriate validation feedback before allowing submission
5. **Given** the submitter has previously attached a file (per existing MVP), **When** they submit with dynamic fields, **Then** the file attachment is preserved and associated with the idea

---

### User Story 3 - View Submitted Ideas with Dynamic Field Values (Priority: P3)

Viewers (submitters, evaluators, admins) see submitted ideas with their dynamic field values displayed in listing and detail views. Field labels from the configuration are shown alongside the submitted values.

**Why this priority**: Submitted data must be readable and searchable; otherwise the dynamic form has no practical value for evaluation.

**Independent Test**: Can be fully tested by submitting an idea with dynamic fields, then viewing it in the list and detail views and verifying all field values display correctly with proper labels.

**Acceptance Scenarios**:

1. **Given** an idea was submitted with dynamic field values, **When** a user views the idea list, **Then** all dynamic fields are visible in the list row (with truncation or wrapping as needed)
2. **Given** an idea was submitted with dynamic field values, **When** a user opens the idea detail page, **Then** all submitted field values are displayed with their configured labels
3. **Given** the form configuration was changed after an idea was submitted, **When** a user views that older idea, **Then** the historical field values are still displayed (even if the field was later removed from configuration)
4. **Given** an idea has dynamic fields, **When** evaluators or admins review it, **Then** they see all dynamic field data alongside the existing fixed fields (title, description, category) and file attachment

---

### Edge Cases

- What happens when no fields are configured? The system retains a minimal default form (title, description, category). Submissions are allowed before any dynamic fields are configured.
- How does the system handle a field configuration change (type or removal) while a submitter has the form open? The submitter's session continues with the configuration at load time; any in-progress data for removed fields is discarded on submission.
- How does the system handle concurrent admin edits? Last-write-wins: the most recent save overwrites; no conflict detection or optimistic locking.
- What happens when validation rules conflict (e.g., required field with no value and max length 0)? Configuration must prevent invalid rules; if invalid configuration exists, the system rejects submission and shows a generic validation error.
- How does the system handle very long field labels or values? Display truncates or wraps appropriately; storage accepts values up to a reasonable limit (e.g., 10,000 characters for long text).
- What happens when the form configuration is empty and an admin tries to save? The system allows saving an empty dynamic-field configuration; the minimal default form (title, description, category) applies.

## Requirements *(mandatory)*

### Functional Requirements

- **FR-001**: System MUST allow administrators to define form fields with at least: label, data type, required/optional status, and display order
- **FR-002**: System MUST support these field types: single-line text, long text (multiline), number, single-select (dropdown), multi-select, checkbox, and date
- **FR-003**: System MUST validate submitted data according to each field's type and required status before accepting the submission
- **FR-004**: System MUST persist form configuration separately from submitted idea data so configuration changes do not corrupt existing submissions
- **FR-005**: System MUST display configured field labels alongside submitted values in idea detail and listing views
- **FR-006**: System MUST preserve historical field values when form configuration changes (e.g., removed or renamed fields) for ideas submitted before the change
- **FR-007**: System MUST allow admins to reorder fields, and submitters MUST see fields in the configured order
- **FR-008**: System MUST maintain backward compatibility: ideas submitted with the previous fixed schema (title, description, category) MUST remain viewable and functional
- **FR-009**: System MUST restrict form configuration access to users with admin role; submitters MUST NOT be able to modify form configuration
- **FR-010**: System MUST provide a minimal default form (title, description, category) when no dynamic fields are configured; submissions are allowed with the default form alone
- **FR-011**: System MUST record a basic audit log for form configuration changes (who, when); no diff or rollback required

### Key Entities

- **Form Configuration**: The set of field definitions that define the submission form. Includes field definitions, their order, and metadata (e.g., when last updated). One active configuration per form at a time.
- **Field Definition**: A single configurable field. Attributes: label, type (text, long text, number, single-select, multi-select, checkbox, date), required flag, validation constraints (e.g., min/max for numbers, options for selects), display order.
- **Submitted Field Value**: A value submitted by a user for a specific field. Stored with reference to the field definition (or its identifier at submission time) and the idea.
- **Idea (extended)**: An idea now includes both fixed attributes (e.g., creator, status, file attachment) and dynamic field values keyed by field identifier.

## Success Criteria *(mandatory)*

### Measurable Outcomes

- **SC-001**: Admins can add or modify a form field and see the change reflected for submitters within one page load or refresh
- **SC-002**: Submitters can complete a submission with up to 15 dynamic fields in under 3 minutes
- **SC-003**: 95% of valid submissions succeed on first attempt when users follow field instructions
- **SC-004**: Configuration changes do not cause data loss for previously submitted ideas
- **SC-005**: Form configuration and submission flow remain usable on standard desktop and mobile screen sizes

## Assumptions

- **Single form configuration**: One active submission form configuration applies globally; no per-category or per-campaign form variations in this phase.
- **Field limits**: Maximum of 25 configurable fields per form to keep the UI manageable; single-select and multi-select options limited to 50 choices per field.
- **Backward compatibility**: Title, description, and category remain mandatory fixed fields; dynamic fields are added alongside them. Existing ideas and the evaluation workflow continue to use the fixed fields unchanged.
- **Admin-only configuration**: Only admins configure forms; evaluators have read-only access to configuration unless explicitly given edit rights (assumed admin-only for simplicity).
- **Concurrent edits**: Last-write-wins for form configuration; no conflict detection or optimistic locking.
- **Audit**: Basic audit log (who, when) for form configuration changes; no versioned snapshots or rollback.
- **No conditional logic**: Fields are always shown when configured; no "show field X only when field Y has value Z" in this phase.
- **Localization**: Field labels and validation messages use the system's primary language; multi-language support is out of scope.
