# Data Model: Idea Listing and Viewing

**Feature**: 006-idea-listing-viewing  
**Created**: 2026-02-25  
**Version**: 1.0

## Overview

This feature uses existing entities (Idea, Category, Attachment, User). No schema changes required. Data model focuses on **query shapes** and **visibility rules** for listing and detail views.

---

## Entity Summary (Existing)

| Entity | Source | Purpose |
|--------|--------|---------|
| Idea | 004, 005 | Core entity; title, description, categoryId, userId, submittedAt, attachment |
| Category | 004 | Name for display and filter |
| Attachment | 005 | Optional; indicates presence and download |
| User | 002, 003 | name, email for submitter display (detail only) |

---

## List Query Shape

### Prisma Query

```prisma
prisma.idea.findMany({
  where: listWhereClause,   // userId filter for submitter; {} for evaluator/admin
  orderBy: { submittedAt: 'desc' },
  skip: (page - 1) * pageSize,
  take: pageSize,
  include: {
    category: { select: { id: true, name: true } },
    attachment: { select: { id: true } },  // presence only
  },
})
```

### Visibility Rules

| Role | where clause |
|------|--------------|
| SUBMITTER | `{ userId: sessionUserId }` |
| EVALUATOR | `{}` |
| ADMIN | `{}` |

### Response Shape (per idea in list)

| Field | Source | Description |
|-------|--------|-------------|
| id | Idea.id | Link target |
| title | Idea.title | Display |
| category | Category.name | Display |
| submittedAt | Idea.submittedAt | Display (formatted) |
| hasAttachment | boolean | `!!attachment` |

---

## Detail Query Shape

### Prisma Query

```prisma
prisma.idea.findUnique({
  where: { id: ideaId },
  include: {
    category: { select: { id: true, name: true } },
    attachment: true,  // full for download link
    user: { select: { name: true, email: true } },  // evaluator/admin only
  },
})
```

### Access Rules

| Role | Condition | Show Submitter? |
|------|-----------|-----------------|
| Owner (submitter) | idea.userId === sessionUserId | No |
| Evaluator/Admin | role in [EVALUATOR, ADMIN] | Yes (name \|\| email) |

### Response Shape (detail)

| Field | Source | When |
|-------|--------|------|
| title, description | Idea | Always |
| category | Category.name | Always |
| submittedAt | Idea.submittedAt | Always |
| submitter | User.name \|\| User.email | Evaluator/Admin only |
| attachment | Attachment | When present |

---

## Pagination Metadata

| Field | Type | Description |
|-------|------|-------------|
| page | number | Current page (1-based) |
| pageSize | number | Items per page (default 15) |
| totalCount | number | Total ideas matching filter |
| totalPages | number | ceil(totalCount / pageSize) |

### Page Normalization (spec)

- Page 0 or negative → use page 1
- Page > totalPages → use last page
- Invalid categoryId → ignore filter (or 400 if strict validation)

---

## Validation Rules

- **page**: Integer ≥ 1; normalize if out of range
- **pageSize**: Integer 1–100; default 15
- **categoryId**: Optional; must reference existing Category if provided

---

## Index Usage

Existing indexes support queries:

- `(userId, submittedAt)` — submitter list
- `(submittedAt)` — all-ideas list
- `(categoryId)` — category filter

No new indexes required.
