# Research: Ideas Scoring System

**Feature**: 013-ideas-scoring | **Date**: 2026-02-28

## 1. Rating Storage: Idea vs Evaluation

**Decision**: Store rating on the Idea model as `rating` (Int 1–5), `ratingEvaluatorId` (FK User), and `ratingAssignedAt` (DateTime). Do not add to Evaluation.

**Rationale**:
- Spec allows "rating before accept/reject" or standalone. Evaluation is created only on accept/reject; rating must be persistable earlier.
- FR-002 requires evaluator and timestamp; Idea columns satisfy this.
- One rating per idea in MVP; last assignment wins until accept/reject.
- Keeps Evaluation focused on final decision; rating is a separate dimension.

**Alternatives considered**:
- **Evaluation.rating**: Would require creating Evaluation earlier with nullable decision/comments; schema and flow changes larger.
- **Separate Rating table**: Overkill for MVP 1:1; can refactor later if multi-evaluator support is added.

---

## 2. Rating Assignment API

**Decision**: New endpoint `POST /api/ideas/[id]/assign-rating` with body `{ rating: number }`. Evaluators and admins can call it for ideas in SUBMITTED or UNDER_REVIEW. Returns updated idea with rating. Block updates when idea is ACCEPTED or REJECTED.

**Rationale**:
- Allows assigning/updating rating independently of accept/reject.
- Aligns with existing `/evaluate` and `/advance-stage` patterns.
- Single responsibility; evaluate endpoint stays focused on decision.

**Alternatives considered**:
- **Extend POST /evaluate with optional rating**: Couples rating to final decision; harder to support "rate now, decide later."
- **Server Action only**: API endpoint enables consistent auth/validation and future reuse (e.g., mobile).

---

## 3. UI Placement for Rating Input

**Decision**: Add rating control (1–5 input: stars or select) to `EvaluationForm` when showing accept/reject section. Rating can be saved independently via "Save Rating" or submitted together with accept/reject.

**Rationale**:
- Spec: "rating entered when evaluating (alongside or before accept/reject)."
- Single form keeps evaluation flow cohesive.
- "Save Rating" allows updating rating before final decision (FR-006).

**Alternatives considered**:
- **Separate "Rate Idea" section above EvaluationForm**: More visual separation; acceptable if design favors it—can be adjusted in implementation.
- **Mandatory rating before accept/reject**: Spec does not require; defer.

---

## 4. Rating Display Format

**Decision**: Display as "X/5" (e.g., "4/5") or equivalent visual indicator (e.g., filled/empty stars). No rating: "Not yet rated" (per FR-004).

**Rationale**:
- Spec explicitly allows "4/5" or visual indicator.
- "Not yet rated" avoids confusion with "0" or empty value.

**Alternatives considered**:
- **Stars only**: "X/5" is more accessible; stars can complement.
- **Numeric only**: "4/5" clarifies scale; preferred for MVP.

---

## 5. Sort and Filter by Rating (FR-010/011)

**Decision**: Extend `GET /api/ideas` with optional query params: `sortBy=rating` (or `ratingDesc`/`ratingAsc`), `minRating=4`. Evaluators and admins only. Ideas without rating: when sorting by rating desc, place at end; when minRating filter applied, exclude them.

**Rationale**:
- P3 feature; low risk to add params now.
- Matches existing `categoryId` filter pattern.
- Excluding unrated ideas from minRating avoids ambiguous inclusion.

**Alternatives considered**:
- **Separate sort endpoint**: Unnecessary; list endpoint already supports filters.
- **Include unrated in minRating**: Ambiguous—treat as 0 or exclude; exclude is clearer.
