# API Contract: Idea Submission (POST /api/ideas)

**Feature**: 004-idea-submission-form  
**Endpoint**: `POST /api/ideas`  
**Authentication**: Required (NextAuth session)  
**Content-Type**: `application/json`  
**CORS**: Same-origin only

---

## Request Schema

**Method**: POST  
**Path**: `/api/ideas`  
**Headers**:
```
Content-Type: application/json
Authorization: Bearer <session_token> (via NextAuth cookie)
```

**Body** (JSON):
```json
{
  "title": "string (required)",
  "description": "string (required)",
  "categoryId": "string (required)"
}
```

### Field Validation (Client-Side Pre-validation)

| Field | Type | Validation | Example |
|-------|------|-----------|---------|
| `title` | string | Required, min 5, max 100 chars, trim whitespace | "Automate code review process" |
| `description` | string | Required, min 20, max 2000 chars, trim whitespace | "We should implement an automated code review system to..." |
| `categoryId` | string | Required, non-empty, match existing category ID | "cat_001" |

**Error Handling (Client)**:
- If validation fails, display error message immediately without server request
- Preserve form data for user to correct

### Zod Schema (Validation)

```typescript
import { z } from 'zod';

const SubmitIdeaSchema = z.object({
  title: z
    .string()
    .trim()
    .min(5, 'Title must be at least 5 characters')
    .max(100, 'Title must not exceed 100 characters'),
  description: z
    .string()
    .trim()
    .min(20, 'Description must be at least 20 characters')
    .max(2000, 'Description must not exceed 2000 characters'),
  categoryId: z
    .string()
    .min(1, 'Please select a category'),
});

export type SubmitIdeaInput = z.infer<typeof SubmitIdeaSchema>;
```

---

## Response Schema

### Success Response (HTTP 201 Created)

```json
{
  "success": true,
  "message": "Your idea has been submitted successfully",
  "idea": {
    "id": "cm123abc4d5e6f7",
    "title": "Automate code review process",
    "description": "We should implement...",
    "categoryId": "cat_001",
    "category": {
      "id": "cat_001",
      "name": "Process Improvement"
    },
    "userId": "user_123",
    "submittedAt": "2026-02-25T14:30:00Z",
    "createdAt": "2026-02-25T14:30:00Z"
  }
}
```

### Error Response - Validation Failure (HTTP 400 Bad Request)

**When**: Request body fails Zod schema validation (title/description/categoryId constraints)

```json
{
  "success": false,
  "error": "Validation failed",
  "details": {
    "title": ["Title must be at least 5 characters"],
    "categoryId": ["Please select a category"]
  }
}
```

### Error Response - Category Not Found (HTTP 400 Bad Request)

**When**: Provided `categoryId` does not exist or is inactive

```json
{
  "success": false,
  "error": "Selected category is no longer available"
}
```

### Error Response - Authentication Failed (HTTP 401 Unauthorized)

**When**: User is not authenticated (no valid session)

```json
{
  "success": false,
  "error": "Authentication required"
}
```

### Error Response - Server Error (HTTP 500 Internal Server Error)

**When**: Unexpected server error (database failure, etc.)

```json
{
  "success": false,
  "error": "Failed to submit your idea. Please try again"
}
```

Retry logic is client-side: after receiving 500, client waits 1s and retries up to 3 times. After 3 failures, display: `"Failed to submit your idea. Please contact support"`

---

## Request/Response Examples

### Example 1: Success Submission

**Request**:
```bash
curl -X POST https://example.com/api/ideas \
  -H "Content-Type: application/json" \
  -d '{
    "title": "Implement AI-powered document processing",
    "description": "We should explore AI tools to automatically process and categorize incoming documents, reducing manual data entry by 80%.",
    "categoryId": "cat_002"
  }'
```

**Response** (201):
```json
{
  "success": true,
  "message": "Your idea has been submitted successfully",
  "idea": {
    "id": "cm9lk4m2kd8f9g0",
    "title": "Implement AI-powered document processing",
    "description": "We should explore AI tools to automatically process and categorize incoming documents, reducing manual data entry by 80%.",
    "categoryId": "cat_002",
    "category": {
      "id": "cat_002",
      "name": "Technology"
    },
    "userId": "user_456",
    "submittedAt": "2026-02-25T15:45:00Z",
    "createdAt": "2026-02-25T15:45:00Z"
  }
}
```

### Example 2: Validation Failure

**Request**:
```bash
curl -X POST https://example.com/api/ideas \
  -H "Content-Type: application/json" \
  -d '{
    "title": "AI",
    "description": "Short",
    "categoryId": ""
  }'
```

**Response** (400):
```json
{
  "success": false,
  "error": "Validation failed",
  "details": {
    "title": ["Title must be at least 5 characters"],
    "description": ["Description must be at least 20 characters"],
    "categoryId": ["Please select a category"]
  }
}
```

### Example 3: Category Not Found

**Request**:
```bash
curl -X POST https://example.com/api/ideas \
  -H "Content-Type: application/json" \
  -d '{
    "title": "Valid Title Here",
    "description": "This is a valid description of an idea for improvement.",
    "categoryId": "cat_invalid_999"
  }'
```

**Response** (400):
```json
{
  "success": false,
  "error": "Selected category is no longer available"
}
```

---

## Implementation Details

### Server-Side Processing (POST /api/ideas)

1. **Authentication Check**: Verify NextAuth session exists; reject with 401 if missing
2. **Payload Validation**: Parse and validate request body with Zod schema
3. **Category Verification**: Check that categoryId exists and isActive = true
4. **Sanitization**: Strip HTML and special characters from title and description
5. **Database Write**: Create Idea record via Prisma with sanitized fields
6. **Logging**: Log successful submission with userId, categoryId, timestamp
7. **Response**: Return 201 with idea object

### Client-Side Retry Logic

```javascript
async function submitIdea(data, maxRetries = 3) {
  let retryCount = 0;
  
  while (retryCount < maxRetries) {
    try {
      const response = await fetch('/api/ideas', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(data),
      });
      
      if (response.ok) {
        return await response.json(); // Success
      }
      
      if (response.status >= 500) {
        // Server error - retry after 1s
        retryCount++;
        if (retryCount >= maxRetries) {
          throw new Error('Failed to submit your idea. Please contact support');
        }
        await new Promise(resolve => setTimeout(resolve, 1000));
        continue;
      }
      
      // Client error (400, 401) - don't retry
      return await response.json();
    } catch (error) {
      retryCount++;
      if (retryCount >= maxRetries) {
        throw error;
      }
      await new Promise(resolve => setTimeout(resolve, 1000));
    }
  }
}
```

---

## Error Codes Reference

| Code | Status | Meaning | User Message |
|------|--------|---------|--------------|
| `VALIDATION_ERROR` | 400 | Schema validation failed | "Please fix the errors and try again" |
| `CATEGORY_NOT_FOUND` | 400 | Category ID doesn't exist | "Selected category is no longer available" |
| `AUTH_REQUIRED` | 401 | User not authenticated | "Authentication required" |
| `SERVER_ERROR` | 500 | Unexpected error | "Failed to submit your idea. Please try again" |

---

## Rate Limiting & Abuse Prevention

**Current**: No explicit rate limiting (reserved for future MVP+)  
**Form-Level**: Disable submit button during submission to prevent double-submit  
**Server-Level**: Standard HTTP request rate limiting via infrastructure (if configured)

---

## Accessibility & Security Notes

- **CSRF**: NextAuth provides CSRF protection via SameSite cookies (no explicit token needed)
- **Input Sanitization**: Performed server-side; HTML and special characters stripped
- **SQL Injection**: Prisma parameterizes all queries; no raw SQL risk
- **XSS**: Sanitized data stored; React auto-escapes output
