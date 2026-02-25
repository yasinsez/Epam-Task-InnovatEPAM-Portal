# Data Model: Idea Submission Feature

**Feature**: 004-idea-submission-form  
**Created**: February 25, 2026  
**Version**: 1.0

## Entity: Idea

Represents a user-submitted innovation idea with title, description, category, and submission metadata.

### Fields

| Field | Type | Constraints | Description |
|-------|------|-----------|-------------|
| `id` | String (CUID) | Primary Key, unique | Unique identifier for the idea |
| `title` | String | Required, 5-100 chars, non-null | User-provided idea title |
| `description` | String | Required, 20-2000 chars, non-null | Detailed description of the idea |
| `categoryId` | String | Required, non-null, Foreign Key → Category.id | Reference to idea category |
| `userId` | String | Required, non-null, Foreign Key → User.id | ID of user who submitted the idea |
| `status` | Enum (DRAFT \| SUBMITTED) | Default: SUBMITTED | Submission state (SUBMITTED for now; DRAFT reserved for MVP+) |
| `submittedAt` | DateTime | Required, non-null, default: now() | Timestamp when idea was submitted |
| `createdAt` | DateTime | Required, non-null, default: now() | Timestamp when idea record was created |
| `updatedAt` | DateTime | Required, auto-update on change | Timestamp of last update |
| `sanitizedTitle` | String | Required, denormalized | Sanitized version of title (HTML/special chars stripped) for search/display |
| `sanitizedDescription` | String | Required, denormalized | Sanitized version of description for search/display |

### Validation Rules

- **title**: Must be 5-100 characters after trimming
- **description**: Must be 20-2000 characters after trimming
- **categoryId**: Must reference an existing Category with valid ID
- **userId**: Must reference an authenticated User
- **Sanitization**: Both title and description MUST be sanitized to remove all HTML and special characters, preserving only: alphanumeric, spaces, hyphens (-), periods (.), commas (,)
- **Immutability**: Once submitted (status = SUBMITTED), idea cannot be deleted by user (update/delete restricted to admins or via audit log)

### Relationships

- **User**: Many-to-One relationship with User (creator/owner)
- **Category**: Many-to-One relationship with Category (classification)

### Indexes

- `(userId)` - Query ideas by submitter
- `(categoryId)` - Query ideas by category
- `(submittedAt DESC)` - Query recent ideas chronologically
- `(userId, submittedAt DESC)` - Query user's ideas in order

### Sample Data

```
{
  id: "cm123abc4d5e6f7",
  title: "Implement automated code review tool",
  description: "We should integrate an automated code review system to catch common issues early and reduce review time.",
  sanitizedTitle: "Implement automated code review tool",
  sanitizedDescription: "We should integrate an automated code review system to catch common issues early and reduce review time.",
  categoryId: "cat_001",
  userId: "user_123",
  status: "SUBMITTED",
  submittedAt: 2026-02-25T14:30:00Z,
  createdAt: 2026-02-25T14:30:00Z,
  updatedAt: 2026-02-25T14:30:00Z
}
```

---

## Entity: Category

Represents a predefined idea classification category (e.g., Process Improvement, Technology, Cost Reduction).

### Fields

| Field | Type | Constraints | Description |
|-------|------|-----------|-------------|
| `id` | String (CUID) | Primary Key, unique | Unique identifier for the category |
| `name` | String | Required, unique, max 50 chars | Category name (e.g., "Process Improvement") |
| `slug` | String | Required, unique, max 50 chars | URL-safe slug version of name (e.g., "process-improvement") |
| `description` | String | Optional, max 500 chars | Human-readable description of category |
| `order` | Integer | Optional, default: 999 | Sort order for dropdown/list display |
| `isActive` | Boolean | Default: true | Whether category is available for new submissions |
| `createdAt` | DateTime | Required, default: now() | Timestamp when category was created |
| `updatedAt` | DateTime | Required, auto-update on change | Timestamp of last update |

### Validation Rules

- **name**: Must be 1-50 characters, non-empty, unique across all categories
- **slug**: Must be URL-safe (alphanumeric, hyphens, underscores only), unique, derived from name
- **description**: Optional but if provided, must be 0-500 characters
- **order**: Integer ≥ 0 for explicit ordering; NULL or 999 for unspecified
- **isActive**: Categories with isActive=false should not appear in submission form dropdown (but existing ideas can keep references to inactive categories)

### Relationships

- **Ideas**: One-to-Many relationship with Idea (classified by this category)

### Indexes

- `(slug)` - Query by slug for URL routing or API endpoints
- `(isActive, order, name)` - Query active categories for form dropdown
- `(order ASC)` - Display categories in sorted order

### Predefined Categories

Categories are seeded at migration time. The following categories MUST be available:

1. **Process Improvement** - Improvements to existing workflows and processes
2. **Technology** - Technology adoption, new tools, automation
3. **Cost Reduction** - Ideas for reducing expenses and improving efficiency
4. **Culture & Engagement** - Employee engagement, culture, team building

### Sample Data

```
{
  id: "cat_001",
  name: "Process Improvement",
  slug: "process-improvement",
  description: "Ideas for improving existing workflows, processes, and operational efficiency",
  order: 1,
  isActive: true,
  createdAt: 2026-02-24T00:00:00Z,
  updatedAt: 2026-02-24T00:00:00Z
},
{
  id: "cat_002",
  name: "Technology",
  slug: "technology",
  description: "Technology adoption, new tools, automation, and digital transformation",
  order: 2,
  isActive: true,
  createdAt: 2026-02-24T00:00:00Z,
  updatedAt: 2026-02-24T00:00:00Z
},
{
  id: "cat_003",
  name: "Cost Reduction",
  slug: "cost-reduction",
  description: "Ideas for reducing costs and improving resource efficiency",
  order: 3,
  isActive: true,
  createdAt: 2026-02-24T00:00:00Z,
  updatedAt: 2026-02-24T00:00:00Z
},
{
  id: "cat_004",
  name: "Culture & Engagement",
  slug: "culture-engagement",
  description: "Employee engagement, company culture, and team building initiatives",
  order: 4,
  isActive: true,
  createdAt: 2026-02-24T00:00:00Z,
  updatedAt: 2026-02-24T00:00:00Z
}
```

---

## Prisma Schema (prisma/schema.prisma additions)

```prisma
// Category model (new)
model Category {
  id          String   @id @default(cuid())
  name        String   @unique @db.VarChar(50)
  slug        String   @unique @db.VarChar(50)
  description String?  @db.VarChar(500)
  order       Int      @default(999)
  isActive    Boolean  @default(true)
  createdAt   DateTime @default(now())
  updatedAt   DateTime @updatedAt
  ideas       Idea[]

  @@index([slug])
  @@index([isActive, order, name])
}

// Idea model (new)
model Idea {
  id                   String   @id @default(cuid())
  title                String   @db.VarChar(100)
  description          String   @db.Text
  sanitizedTitle       String   @db.VarChar(100)
  sanitizedDescription String   @db.Text
  categoryId           String
  category             Category @relation(fields: [categoryId], references: [id])
  userId               String
  user                 User     @relation(fields: [userId], references: [id], onDelete: Cascade)
  status               String   @default("SUBMITTED") @db.VarChar(20)
  submittedAt          DateTime @default(now())
  createdAt            DateTime @default(now())
  updatedAt            DateTime @updatedAt

  @@index([userId])
  @@index([categoryId])
  @@index([submittedAt])
  @@index([userId, submittedAt])
}

// User model additions (existing model extension)
model User {
  // ... existing fields ...
  ideas Ideas[]  // Add this relation
}
```

---

## State Transitions

### Idea State Lifecycle

```
DRAFT (reserved)
  ↓
SUBMITTED ←→ [Terminal state for user]
```

**Note**: For MVP, all form submissions go directly to SUBMITTED status. Future enhancements may include DRAFT state for auto-save functionality or approval workflows.

---

## Validation Summary Table

| Field | Type | Validation | Error Message |
|-------|------|-----------|---------------|
| title | String | Required, 5-100 chars | "Title must be between 5 and 100 characters" |
| description | String | Required, 20-2000 chars | "Description must be between 20 and 2000 characters" |
| categoryId | String | Required, valid category ID | "Please select a category" |
| At submission | - | HTML/special char sanitization | (Implicit - server-side only) |

---

## Migration Strategy

1. **Migration 1**: Create `Category` table with seed data (4 predefined categories)
2. **Migration 2**: Create `Idea` table with foreign keys to Category and User
3. **Index Strategy**: Indexes created during migration for query optimization
4. **Rollback**: If needed, both tables can be dropped; User table remains unchanged (no breaking changes to User schema)
