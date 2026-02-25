# API Contract: User Role Management

**Phase 1 Output** | REST API specification  
**Date**: 2026-02-25 | **Feature**: User Roles (003-user-roles)

## Overview

Role management endpoints live under `/api/admin/users`. All endpoints require a valid NextAuth session. Role enforcement is performed via database lookup on every request.

**Base URL**: `http://localhost:3000/api/admin` (development)  
**Base URL**: `https://innovatepam-portal.vercel.app/api/admin` (production)

**Role Values**: `submitter`, `evaluator`, `admin`

---

## Endpoint: GET /api/admin/users

**Purpose**: List users with their current roles.  
**Priority**: P1  
**Access**: Admin only

### Request

```http
GET /api/admin/users HTTP/1.1
```

### Response

**Success (200 OK)**:
```json
{
  "success": true,
  "users": [
    {
      "id": "user-cuid-123",
      "email": "emp123@epam.com",
      "name": "John Doe",
      "role": "submitter"
    }
  ]
}
```

**Unauthorized (401)**:
```json
{ "success": false, "error": "Unauthorized" }
```

**Forbidden (403)** - Non-admin:
```json
{ "success": false, "error": "Forbidden" }
```

---

## Endpoint: PATCH /api/admin/users/{userId}/role

**Purpose**: Update a user's role.  
**Priority**: P1  
**Access**: Admin only (self-demotion blocked)

### Request

```http
PATCH /api/admin/users/user-cuid-123/role HTTP/1.1
Content-Type: application/json

{
  "role": "evaluator"
}
```

**Request Body**:
| Field | Type | Required | Validation |
|-------|------|----------|-----------|
| `role` | string | Yes | Must be `submitter`, `evaluator`, or `admin` |

### Response

**Success (200 OK)**:
```json
{
  "success": true,
  "user": {
    "id": "user-cuid-123",
    "role": "evaluator"
  }
}
```

**Unauthorized (401)**:
```json
{ "success": false, "error": "Unauthorized" }
```

**Forbidden (403)** - Non-admin or self-demotion attempt:
```json
{ "success": false, "error": "Forbidden" }
```

**Validation Error (400)** - Invalid role:
```json
{ "success": false, "error": "Invalid role" }
```

**Not Found (404)** - Unknown user:
```json
{ "success": false, "error": "User not found" }
```

---

## Standard Role Enforcement Responses

- Missing session or invalid token: 401 Unauthorized
- Authenticated but insufficient role: 403 Forbidden
- Missing or invalid role on user: 403 Forbidden (treat as unauthorized)
