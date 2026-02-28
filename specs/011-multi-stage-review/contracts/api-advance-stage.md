# API Contract: Advance Idea Stage

**Feature**: 011-multi-stage-review  
**Path**: `/api/ideas/[id]/advance-stage`  
**Authentication**: Required (NextAuth session)  
**Role**: Evaluator or Admin only (403 for submitter)  
**CORS**: Same-origin only

---

## Overview

Advance-stage API allows evaluators (and admins) to move an idea from its current stage to the next stage in the pipeline. Used when the idea is not in the final stage. For the final stage, use `POST /api/ideas/[id]/evaluate` (accept/reject) instead.

---

## 1. Advance to Next Stage

**Method**: POST  
**Path**: `/api/ideas/[id]/advance-stage`  
**Content-Type**: `application/json`

### Request Body

```json
{
  "comments": "string (optional, 1-2000 chars when provided)"
}
```

Comments are optional for intermediate stage advances. At final stage, use evaluate endpoint (comments required there).

### Preconditions

- Idea exists and is in multi-stage pipeline (`currentStageId` not null)
- Idea is not in final stage (otherwise use evaluate)
- Idea is not already ACCEPTED or REJECTED
- Requestor has not been superseded (first-wins: if another evaluator advanced first, return 409)

### Success (200)

```json
{
  "success": true,
  "message": "Idea advanced to next stage",
  "idea": {
    "id": "clx...",
    "status": "UNDER_REVIEW",
    "currentStage": {
      "id": "cly...",
      "name": "Technical Review",
      "position": 2,
      "totalStages": 3
    }
  }
}
```

### Error Responses

- **400**: Idea is in final stage (use evaluate instead), or idea not in multi-stage pipeline
- **404**: Idea not found
- **409**: Idea has already been advanced from this stage by another evaluator
- **401**: Unauthenticated
- **403**: Not evaluator or admin

---

## 2. Evaluate at Final Stage (Existing Contract)

**Method**: POST  
**Path**: `/api/ideas/[id]/evaluate`  
**Content-Type**: `application/json`

Existing endpoint per spec 007. When idea has `currentStageId` = final stage, evaluator uses this to accept or reject. Request body:

```json
{
  "decision": "ACCEPTED" | "REJECTED",
  "comments": "string (required, 1-2000 chars)"
}
```

No changes to request/response shape. Evaluation service will:
1. Verify idea is in final stage (when stages configured) or use existing single-stage logic (when no stages)
2. Create Evaluation record
3. Update Idea status to ACCEPTED/REJECTED
4. Optionally set currentStageId to null (or leave for audit)
