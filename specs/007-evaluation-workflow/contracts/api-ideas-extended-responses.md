# API Contract: Extended Idea Responses (Status & Evaluation)

**Feature**: 007-evaluation-workflow  
**Scope**: Additive changes to idea list and idea detail data  
**Input**: specs/006-idea-listing-viewing contracts (api-ideas-list.md, api-idea-detail.md)

---

## Overview

Idea list and idea detail responses are extended with `status` and, when applicable, `evaluation` fields. The app uses Server Components that call `getIdeasForUser` and `getIdeaForDetail` directly; no new API routes for list/detail. This contract documents the extended data shape for implementers.

---

## Idea List Item (Extended)

Add to each idea in list response:

| Field | Type | Description |
|-------|------|-------------|
| `status` | string | One of: "SUBMITTED", "UNDER_REVIEW", "ACCEPTED", "REJECTED" |

**Example**:
```json
{
  "id": "cm123abc4d5e6f7",
  "title": "Implement automated code review tool",
  "category": { "id": "cat_001", "name": "Process Improvement" },
  "submittedAt": "2026-02-25T14:30:00Z",
  "hasAttachment": true,
  "status": "SUBMITTED"
}
```

---

## Idea Detail (Extended)

Add to idea detail response:

| Field | Type | Description |
|-------|------|-------------|
| `status` | string | One of: "SUBMITTED", "UNDER_REVIEW", "ACCEPTED", "REJECTED" |
| `evaluation` | object \| null | Present when status is ACCEPTED or REJECTED; null otherwise |

**evaluation** (when present):

| Field | Type | Description |
|-------|------|-------------|
| `decision` | string | "ACCEPTED" or "REJECTED" |
| `comments` | string | Evaluator comments |
| `evaluatedAt` | string | ISO 8601 date |
| `evaluatorDisplayName` | string | Evaluator name or "Administrator" if user deactivated |

**Example** (evaluated idea):
```json
{
  "id": "cm123abc4d5e6f7",
  "title": "Implement automated code review tool",
  "description": "...",
  "category": { "id": "cat_001", "name": "Process Improvement" },
  "submittedAt": "2026-02-25T14:30:00Z",
  "submitter": "Jane Smith",
  "attachment": { ... },
  "status": "ACCEPTED",
  "evaluation": {
    "decision": "ACCEPTED",
    "comments": "Great idea, we will follow up.",
    "evaluatedAt": "2026-02-25T15:00:00Z",
    "evaluatorDisplayName": "Admin User"
  }
}
```

---

## Display Labels (UI)

| Status Value | User-Friendly Label |
|--------------|---------------------|
| SUBMITTED | Submitted |
| UNDER_REVIEW | Under Review |
| ACCEPTED | Accepted |
| REJECTED | Rejected |
