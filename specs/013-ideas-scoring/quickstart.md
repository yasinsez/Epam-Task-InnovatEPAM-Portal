# Quickstart: Ideas Scoring System

**Feature**: 013-ideas-scoring | **Branch**: `013-ideas-scoring`

## Prerequisites

- Evaluation workflow (spec 007) implemented
- Optional: Multi-stage review (spec 011) implemented
- User roles (submitter, evaluator, admin) per spec 003

## Implementation Checklist

1. **Migration**: Add `rating`, `ratingEvaluatorId`, `ratingAssignedAt` to Idea model; run `npx prisma migrate dev`
2. **Rating service**: Create `src/lib/services/rating-service.ts` with `assignRating(ideaId, evaluatorId, rating)`
3. **Validators**: Add `ratingSchema` (zod: z.number().int().min(1).max(5)) to `src/lib/validators.ts`
4. **API route**: Create `POST /api/ideas/[id]/assign-rating`
5. **Idea service**: Extend `getIdeasForUser` and `getIdeaForDetail` to include `rating`, `ratingDisplay`, `ratingAssignedAt`
6. **Idea service (sort/filter)**: Add optional `sortBy`, `minRating` to list query for evaluators/admins
7. **EvaluationForm**: Add rating input (1–5) and "Save Rating" or submit with evaluation
8. **RatingDisplay**: Create component for "4/5" or "Not yet rated"
9. **Idea list page**: Display `ratingDisplay` in list items
10. **Idea detail page**: Display `ratingDisplay`; show assign UI for evaluators when status allows

## Verification

1. **Assign rating**: As evaluator, open idea in SUBMITTED/UNDER_REVIEW → assign 1–5 → save → verify persisted
2. **Display in list**: View idea list → see "4/5" or "Not yet rated"
3. **Display in detail**: Open idea detail → see rating prominently
4. **Submitter sees own**: As submitter, view evaluated idea with rating → see rating
5. **Validation**: Try rating 0 or 6 → blocked with validation message
6. **Immutable after decision**: Accept idea → try to change rating → blocked (409)
7. **Sort/filter** (P3): As evaluator, sort by rating desc → highest first; filter minRating=4 → only 4–5

## Key Files

- `prisma/schema.prisma` — Idea.rating, ratingEvaluatorId, ratingAssignedAt
- `src/lib/services/rating-service.ts` — assignRating
- `src/lib/services/idea-service.ts` — getIdeasForUser, getIdeaForDetail (include rating; sort/filter)
- `src/app/api/ideas/[id]/assign-rating/route.ts` — POST handler
- `src/components/EvaluationForm.tsx` — Rating input
- `src/components/RatingDisplay.tsx` — Display component
- `src/app/ideas/[id]/page.tsx` — Idea detail with rating display
- `src/app/ideas/page.tsx` — Idea list with rating column
