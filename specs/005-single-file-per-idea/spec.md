# Feature Specification: Single File Attachment Per Idea

**Feature Branch**: `005-single-file-per-idea`  
**Created**: February 25, 2026  
**Status**: Draft  
**Input**: User description: "Create Single file attachment per idea"

## Clarifications

### Session 2026-02-25

- Q: Where should attachment files be stored? (Local filesystem vs cloud object storage vs database BLOB) → A: Local filesystem
- Q: Maximum file size limit for attachments? → A: 25 MB
- Q: Allowed file types for attachments? → A: PDF, DOCX, PNG, JPG, GIF (documents + images only)
- Q: When user already has one file attached and selects another, replace or prevent? → A: Replace
- Q: Virus/malware scanning of uploads? → A: No – trust authenticated users; defer (internal portal)

## User Scenarios & Testing *(mandatory)*

### User Story 1 - Attach a File When Submitting an Idea (Priority: P1)

An employee can optionally attach a single file (e.g., document, image) when submitting an idea through the InnovatEPAM Portal. The attachment supports the idea with supplementary materials such as diagrams, screenshots, or supporting documents. Upon successful submission, both the idea and its attachment are stored and associated together.

**Why this priority**: This is the core value of the feature. Without it, users cannot attach supporting files to their ideas. It directly addresses the project requirement to support file attachments on idea submissions.

**Independent Test**: Can be fully tested by navigating to the idea submission form, selecting a file to attach, submitting the form, and verifying the idea is stored with the attachment accessible. Delivers the core value of "user can attach one file per idea."

**Acceptance Scenarios**:

1. **Given** a user is on the idea submission form, **When** they select a valid file using the file attachment control and complete the required fields, **Then** the file is included with the idea upon submission and both are stored together
2. **Given** a user has attached a file to their idea, **When** they submit the form successfully, **Then** they receive confirmation and can later view or download the attachment associated with their idea
3. **Given** a user is on the submission form, **When** they choose a file but change their mind, **Then** they can remove the selected file before submitting
4. **Given** a user submits an idea without attaching a file, **When** all other required fields are valid, **Then** the idea is submitted successfully (attachment is optional)
5. **Given** a user selects a file for attachment, **When** they view the form before submission, **Then** the selected file name is displayed so they can verify their choice

---

### User Story 2 - File Validation and Constraints (Priority: P1)

The system validates attached files before acceptance. Files that exceed size limits or are in unsupported formats are rejected with clear guidance. The system accepts only one file per idea.

**Why this priority**: Validation prevents abuse, ensures system stability, and protects against malicious uploads. Without constraints, the system could be overwhelmed or compromised. This must work alongside the attachment feature.

**Independent Test**: Can be fully tested by attempting to attach files of various sizes and types, verifying allowed files succeed and disallowed files produce clear error messages.

**Acceptance Scenarios**:

1. **Given** a user selects a file, **When** the file exceeds the maximum allowed size, **Then** an error message indicates the file is too large and specifies the maximum size, and the file is not attached
2. **Given** a user selects a file, **When** the file type is not in the list of supported formats, **Then** an error message indicates the file type is not supported and lists accepted formats, and the file is not attached
3. **Given** a user has already attached one file, **When** they select a second file, **Then** the system replaces the first file with the second, and the idea retains only one attachment
4. **Given** a user selects a valid file within constraints, **When** they proceed to submit, **Then** the file passes validation and is accepted
5. **Given** a user submits with an invalid or oversized file, **When** validation fails, **Then** the form does not submit and the user receives a specific error message without losing other form data

---

### User Story 3 - Attachment Display and Access (Priority: P2)

When viewing a submitted idea, users with appropriate access can see that an attachment exists and can download or view it. The attachment is clearly associated with the idea it supports.

**Why this priority**: Attachment value is realized only when it can be retrieved. Viewing ideas without access to attachments would make the feature incomplete. Secondary to upload because upload must work first.

**Independent Test**: Can be fully tested by submitting an idea with an attachment, navigating to the idea detail view, and verifying the attachment is listed and downloadable.

**Acceptance Scenarios**:

1. **Given** an idea has an attached file, **When** a user with access views the idea, **Then** they see an indication that an attachment exists (e.g., file name or "Attachment" link)
2. **Given** a user is viewing an idea with an attachment, **When** they initiate the download/view action, **Then** they receive the file or can open it in an appropriate viewer
3. **Given** an idea has no attachment, **When** a user views the idea, **Then** no attachment section or indicator is shown (or a clear "No attachment" state)
4. **Given** a user downloads an attachment, **When** the download completes, **Then** the file is the same as what was originally uploaded (integrity preserved)

---

### Edge Cases

- What happens when a user selects a file and the submission fails (e.g., server error)? → Form data including the selected file reference is preserved; user can retry without re-selecting the file
- What happens when a user selects an empty (0-byte) file? → System rejects it with a message like "File is empty" or "Please select a valid file"
- What happens when a file is uploaded but storage fails partway through? → User receives an error message; the idea is not saved (transactional consistency); user can retry
- What happens when a user attaches a file with a very long name? → System accepts or truncates for display; storage uses a safe identifier; no security or display issues
- What happens when an evaluator/admin views an idea with an attachment? → They can access the attachment using the same display and download capability as the submitter (per access rules)

## Requirements *(mandatory)*

### Functional Requirements

- **FR-001**: System MUST provide a file attachment control on the idea submission form allowing users to select a single file
- **FR-002**: System MUST allow idea submission with or without an attachment (attachment is optional)
- **FR-003**: System MUST enforce a maximum of one file per idea (no multiple attachments)
- **FR-004**: System MUST validate file size before acceptance and reject files exceeding 25 MB, with a clear error message stating the limit
- **FR-005**: System MUST validate file type against the allowed list (PDF, DOCX, PNG, JPG, GIF) and reject unsupported formats, with a clear error message listing accepted formats
- **FR-006**: System MUST store the attached file in association with the submitted idea so it can be retrieved when viewing the idea
- **FR-007**: System MUST allow users to remove a selected file before submission
- **FR-008**: System MUST display the selected file name (or suitable indicator) to the user before submission
- **FR-009**: System MUST preserve the selected file (or allow re-selection) when submission fails, so the user can retry without re-entering all data
- **FR-010**: System MUST provide a way for users with access to view or download the attachment when viewing a submitted idea
- **FR-011**: System MUST reject empty (0-byte) files with an appropriate error message

### Key Entities

- **Idea**: Extended to include an optional attachment reference; existing attributes (title, description, category, etc.) unchanged from the basic idea submission form
- **Attachment**: Represents a single file linked to an idea with attributes:
  - Original file name (for display to users)
  - Stored file reference (filesystem path or safe identifier for retrieval from local disk)
  - File size (at upload time)
  - File type/category (e.g., document, image)

## Success Criteria *(mandatory)*

### Measurable Outcomes

- **SC-001**: Users can attach a valid file and submit an idea in under 3 minutes from form load to confirmation
- **SC-002**: 95% of valid file attachments are successfully stored and retrievable when viewing the idea
- **SC-003**: Invalid files (wrong type or size) are rejected with clear, actionable error messages in 100% of test cases
- **SC-004**: Users can successfully download or view their attached file within 3 seconds of requesting it from the idea view
- **SC-005**: Ideas submitted without attachments succeed at the same rate as those with attachments (no regression)

## Assumptions

- The idea submission form (title, description, category) already exists and is functional; this feature adds the attachment control to that form
- Supported file types are PDF, DOCX, PNG, JPG, GIF (documents and images only)
- Maximum file size is 25 MB (allows larger presentations, datasets, and design files)
- Only authenticated users can submit ideas and view attachments; access control follows existing idea visibility rules
- Attachment storage is durable and survives system restarts; retrieval remains available for the lifetime of the idea
- Attachment files are stored on the application server's local filesystem in a designated directory
- Virus/malware scanning of uploads is deferred; trust authenticated internal users; may add scanning in future if requirements change
