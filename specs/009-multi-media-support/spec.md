# Feature Specification: Multi-Media Support (Multiple File Types)

**Feature Branch**: `009-multi-media-support`  
**Created**: 2026-02-28  
**Status**: Draft  
**Input**: User description: "Multi-Media Support (multiple file types)"

## Clarifications

### Session 2026-02-28

- Q: How are attachment limits (max count, per-file size, total size) configured? → A: Database/admin config. Limits are stored in DB and editable via admin UI or API.
- Q: When admin changes limits, do they apply retroactively? → A: Prospective only. Limit changes affect only new uploads; existing ideas and their attachments remain valid and unchanged.
- Q: How deeply should file content be validated (extension only vs MIME vs sniffing)? → A: Extension + MIME type. Validate both file extension and the upload's declared Content-Type.
- Q: Where should attachment files be stored (local FS vs cloud vs DB)? → A: Local filesystem. Keep current pattern (uploads/ideas/<ideaId>/), extend for multiple files per idea.
- Q: How do admins configure upload limits and types (UI vs API only)? → A: Admin UI. Admins configure limits and allowed types via a settings/config page in the portal.
- Q: Should video (e.g., MP4) be supported in v1? → A: Defer video. v1 supports documents, images, spreadsheets only; video to be added later.

## User Scenarios & Testing *(mandatory)*

### User Story 1 - Submitter Attaches Multiple Files of Different Types (Priority: P1)

A submitter (employee) can attach multiple files to an idea submission. Each file can be a different type: documents (e.g., PDF, Word), images (e.g., JPEG, PNG), or spreadsheets. The system accepts the files, validates their type and size, and associates them with the idea. Submitters can add, remove, or replace files before submitting. (Video support deferred to a future release.)

**Why this priority**: The core value is enabling richer idea submissions. Without multiple file support, submitters cannot provide supporting materials (slides, diagrams, prototypes) alongside their written description.

**Independent Test**: Can be fully tested by logging in as submitter, creating or editing an idea, attaching multiple files of different allowed types, submitting, and verifying all files are stored and viewable. Delivers value by expanding what submitters can include in a single idea.

**Acceptance Scenarios**:

1. **Given** a submitter is on the idea submission form, **When** they add one or more files within the allowed types and size limits, **Then** the system accepts the files and shows them in a list with name, type, and size
2. **Given** files are attached, **When** the submitter removes a file before submission, **Then** that file is removed from the list and is not stored with the idea
3. **Given** the submitter has attached files, **When** they submit the idea, **Then** all attached files are stored and associated with the idea
4. **Given** the submitter uploads a file of a disallowed type, **When** the upload completes, **Then** the system rejects it and shows a clear message indicating allowed types
5. **Given** the submitter uploads a file exceeding the per-file or total size limit, **When** the upload completes, **Then** the system rejects it and shows a clear message with the limit
6. **Given** an idea exists with the previous single-file model, **When** the system is updated, **Then** that idea and its single file remain viewable and functional

---

### User Story 2 - Viewer Sees and Accesses All Attachments (Priority: P2)

Viewers (submitters, evaluators, admins) can see all attachments on an idea in the detail view. Each attachment shows its filename, type, and size. Viewers can download or open each file. For supported image types, the system may show a preview or thumbnail when practical.

**Why this priority**: Attachments only add value when evaluators and admins can access them during review. This story completes the submission-to-review flow.

**Independent Test**: Can be fully tested by submitting an idea with multiple files, then viewing the idea as submitter, evaluator, or admin and verifying all attachments are listed and downloadable.

**Acceptance Scenarios**:

1. **Given** an idea has multiple attachments, **When** a viewer opens the idea detail page, **Then** they see a list of all attachments with filename, type, and size
2. **Given** the attachment list is visible, **When** the viewer selects download or open for an attachment, **Then** the file is retrieved and made available (download starts or opens in browser where supported)
3. **Given** an attachment is an image type (e.g., JPEG, PNG), **When** the viewer is on the idea detail page, **Then** a thumbnail or inline preview is shown when feasible
4. **Given** an idea has no attachments, **When** a viewer opens the idea, **Then** the attachment section shows a clear empty state (e.g., "No attachments")

---

### User Story 3 - Attachment Limits and Validation Are Clear to Users (Priority: P3)

Submitters see clear guidance on allowed file types, maximum file count, per-file size limit, and total size limit before and during upload. Validation errors are specific (e.g., "File type X is not allowed" or "Total size exceeds 50MB") so submitters can correct issues quickly.

**Why this priority**: Reduces support burden and failed submissions. Users can self-serve when they know the rules.

**Independent Test**: Can be fully tested by attempting uploads that violate limits and verifying the error messages are specific and helpful; and by checking that submission form or upload area displays the limits.

**Acceptance Scenarios**:

1. **Given** the submitter is on the submission form, **When** they view the file attachment area, **Then** they see the allowed types, per-file limit, total limit, and max file count
2. **Given** the submitter uploads an invalid file, **When** validation fails, **Then** the message specifies the reason (type, per-file size, total size, or count)
3. **Given** the submitter has reached the file count limit, **When** they try to add another file, **Then** the system prevents adding and shows a clear message

---

### Edge Cases

- What happens when the submitter uploads a file with a correct extension but wrong content (e.g., .pdf that is actually an executable)? The system validates both file extension and the declared MIME type (Content-Type) from the upload. If extension and MIME type do not match the allowed mapping, the file is rejected. Users may report misuse through normal channels.
- How does the system handle a very long filename? Filenames are truncated or sanitized for display and storage; the original name is preserved for download where possible.
- What happens when storage is full or upload fails mid-way? The system shows a clear error message. Partially uploaded files are not stored; the submitter can retry.
- How does the system handle concurrent edits (e.g., submitter and evaluator viewing same idea)? Viewing attachments is read-only; no conflict. If submitter is editing a draft, their changes apply on save.
- What happens when an allowed file type is removed from configuration after ideas were submitted? Existing attachments remain accessible; new submissions cannot use the removed type.
- When admin changes limits (file count, per-file size, total size), do existing ideas get affected? No. All configuration changes apply prospectively to new uploads only; existing ideas and their attachments remain valid.
- How does the system handle duplicate filenames from the same user? Each attachment is stored with a unique identifier; display can show original filename with disambiguation if needed (e.g., "document.pdf", "document (2).pdf").

## Requirements *(mandatory)*

### Functional Requirements

- **FR-001**: System MUST allow submitters to attach multiple files to an idea submission, within an admin-configurable maximum (e.g., 10 files per idea) stored in the database
- **FR-002**: System MUST support at least these file types: documents (PDF, DOC, DOCX), images (JPEG, PNG, GIF), and spreadsheets (XLS, XLSX)
- **FR-003**: System MUST enforce a per-file size limit (e.g., 10MB) and a total size limit per idea (e.g., 50MB), both admin-configurable and stored in the database
- **FR-004**: System MUST reject files of disallowed types and show a clear validation message. Validation MUST check both file extension and declared MIME type (Content-Type); both must match the allowed mapping.
- **FR-005**: System MUST reject files that exceed per-file or total size limits and show a clear validation message
- **FR-006**: System MUST persist all accepted attachments and associate them with the idea
- **FR-007**: System MUST display all attachments in the idea detail view with filename, type, and size
- **FR-008**: System MUST allow viewers (submitters, evaluators, admins) to download or open each attachment
- **FR-009**: System MUST display allowed types, size limits, and file count limits to submitters before and during upload
- **FR-010**: System MUST remain backward compatible: ideas with a single file (from the previous model) MUST remain viewable and downloadable
- **FR-011**: System MUST allow submitters to remove an attachment before submitting the idea
- **FR-012**: System MUST show thumbnails or inline previews for image attachments in the idea detail view when practical
- **FR-013**: System MUST provide an admin settings/config page where admins can view and edit upload configuration (allowed file types, per-file size limit, total size limit per idea, maximum file count)

### Key Entities

- **Attachment**: A file associated with an idea. Attributes: original filename, file type, size, storage reference (path under local filesystem, e.g., `ideas/<ideaId>/<uuid>.<ext>`), association to idea. Each attachment belongs to one idea.
- **Idea (extended)**: An idea may have zero or more attachments. The relationship replaces or extends the previous single-file-per-idea model.
- **Upload Configuration**: Stored in the database and editable by admins via an admin settings/config page in the portal. Defines allowed file types, per-file size limit, total size limit per idea, and maximum file count. Configuration changes apply prospectively only (new uploads); existing ideas and attachments are never invalidated.

## Success Criteria *(mandatory)*

### Measurable Outcomes

- **SC-001**: Submitters can attach up to 10 files of mixed types (documents, images, spreadsheets) to an idea and submit in under 2 minutes
- **SC-002**: 95% of valid uploads succeed on first attempt when users follow the displayed limits and types
- **SC-003**: Viewers can access and download any attachment within 3 seconds of requesting it
- **SC-004**: Validation errors clearly indicate the reason for rejection (type, size, or count) so users can correct without support
- **SC-005**: Existing ideas with a single file remain fully viewable and downloadable after the feature is deployed

## Assumptions

- **File type set**: Documents (PDF, DOC, DOCX), images (JPEG, PNG, GIF), and spreadsheets (XLS, XLSX) are in scope for v1. Video (e.g., MP4) is explicitly deferred to a future release.
- **Size limits**: 10MB per file and 50MB total per idea are reasonable defaults; can be adjusted by configuration if the system supports it.
- **Max file count**: 10 files per idea keeps the UI manageable and covers typical use (description doc, 2–3 images, spreadsheet).
- **Backward compatibility**: The previous single-file attachment model is preserved; existing ideas and their files are not migrated or altered.
- **Preview scope**: Thumbnails or inline previews for images only; documents and spreadsheets are download-only unless the platform provides built-in viewers.
- **Storage**: Local filesystem (configurable base path, e.g., `./uploads`). Extends existing single-file pattern for multiple files per idea. Cloud object storage is out of scope for this feature.
- **Security**: Validation includes extension, MIME type (Content-Type), and size. Virus scanning or advanced malware detection is out of scope unless explicitly required by policy.
