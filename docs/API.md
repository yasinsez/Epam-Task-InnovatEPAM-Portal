# API Documentation

## Auth Endpoints

- `POST /api/auth/register`
  - Body: `{ email, password }`
  - Responses: `201`, `400`, `409`, `500`

- `POST /api/auth/login`
  - Body: `{ email, password }`
  - Responses: `200` (`X-Auth-Token` header + cookie), `401`, `429`, `500`

- `POST /api/auth/logout`
  - Header: `Authorization: Bearer <token>`
  - Responses: `200`, `401`

- `POST /api/auth/forgot-password`
  - Body: `{ email }`
  - Response: always `200` generic message

- `POST /api/auth/reset-password`
  - Body: `{ token, password }`
  - Responses: `200`, `400`

- `POST /api/auth/refresh`
  - Header: `Authorization: Bearer <token>`
  - Responses: `200` (`X-Auth-Token` when refreshed), `401`

- `GET /api/auth/sessions`
  - Header: `Authorization: Bearer <token>`
  - Responses: `200`, `401`

- `POST /api/auth/sessions/:sessionId/revoke`
  - Header: `Authorization: Bearer <token>`
  - Responses: `200`, `401`
