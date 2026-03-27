# API Reference

Base URL: `http://localhost:4000` (development)

All requests to Better Auth endpoints require an `Origin` header matching `FRONTEND_URL`.  
All authenticated endpoints require a valid session cookie set by Better Auth.

---

## Health

### `GET /health`

Liveness check. Used by Docker and load balancers.

**Auth required:** No  
**Rate limit:** Global (100 req / 15 min)

**Response `200`:**
```json
{ "status": "ok" }
```

---

## Auth — Better Auth Managed

These endpoints are handled directly by Better Auth. They are mounted at `/api/auth/*`.

---

### `POST /api/auth/sign-up/email`

Register a new user with email and password.  
Sends a verification email on success — user cannot sign in until email is verified.

**Auth required:** No  
**Rate limit:** Auth (10 req / 15 min)

**Request body:**
```json
{
  "name": "string (2–100 chars)",
  "email": "string (valid email)",
  "password": "string (8–72 chars, 1 uppercase, 1 number, 1 special char)",
  "callbackURL": "string (optional, must be trusted origin)"
}
```

**Response `200`:**
```json
{
  "token": "session token",
  "user": {
    "id": "string",
    "name": "string",
    "email": "string",
    "emailVerified": false,
    "image": null,
    "createdAt": "ISO date",
    "updatedAt": "ISO date"
  }
}
```

**Errors:**
| Status | Meaning |
|--------|---------|
| `400` | Validation failed (see error.fieldErrors) |
| `422` | Email already registered |
| `429` | Rate limit exceeded |

---

### `POST /api/auth/sign-in/email`

Sign in with email and password.

**Auth required:** No  
**Rate limit:** Auth (10 req / 15 min)  
**Extra protection:** Account locks after 10 failed attempts in 15 minutes

**Request body:**
```json
{
  "email": "string",
  "password": "string"
}
```

**Response `200`:**
```json
{
  "redirect": false,
  "token": "session token",
  "user": {
    "id": "string",
    "name": "string",
    "email": "string",
    "emailVerified": true,
    "image": null,
    "createdAt": "ISO date",
    "updatedAt": "ISO date"
  }
}
```

**Errors:**
| Status | Meaning |
|--------|---------|
| `401` | Invalid credentials or email not verified |
| `429` | Rate limit or account lockout |

---

### `POST /api/auth/sign-out`

Sign out the current session. Blacklists the session token in Redis for instant revocation.

**Auth required:** Yes (session cookie)  
**Rate limit:** Global

**Response `200`:**
```json
{ "success": true }
```

---

### `GET /api/auth/session`

Returns the current session and user. Checks the Redis blacklist before responding.

**Auth required:** Yes (session cookie)  
**Rate limit:** Global

**Response `200`:**
```json
{
  "session": {
    "id": "string",
    "token": "string",
    "expiresAt": "ISO date",
    "ipAddress": "string",
    "userAgent": "string",
    "userId": "string"
  },
  "user": {
    "id": "string",
    "name": "string",
    "email": "string",
    "emailVerified": true,
    "image": null,
    "createdAt": "ISO date",
    "updatedAt": "ISO date"
  }
}
```

**Response `401`:** Session expired, revoked, or missing.

---

### `POST /api/auth/forget-password`

Request a password reset email.  
Always returns success regardless of whether the email exists (prevents email enumeration).

**Auth required:** No  
**Rate limit:** Auth (10 req / 15 min)

**Request body:**
```json
{
  "email": "string",
  "redirectTo": "string (URL to redirect to after reset)"
}
```

**Response `200`:**
```json
{ "status": true }
```

---

### `POST /api/auth/reset-password`

Set a new password using the token from the reset email.

**Auth required:** No (reset token in body)  
**Rate limit:** Auth (10 req / 15 min)

**Request body:**
```json
{
  "token": "string (from reset email)",
  "newPassword": "string (8–72 chars, 1 uppercase, 1 number, 1 special char)"
}
```

**Response `200`:**
```json
{ "status": true }
```

**Errors:**
| Status | Meaning |
|--------|---------|
| `400` | Invalid or expired token |
| `422` | Password does not meet requirements |

---

### `GET /api/auth/verify-email`

Verify a user's email address using the token from the verification email.  
Auto signs in the user after verification.

**Auth required:** No (token in query string)  
**Rate limit:** Global

**Query params:**
```
?token=string
```

**Response:** Redirects to `callbackURL` or frontend root.

---

## Auth — Custom Routes

These are additional auth-related endpoints handled by the Express router, not Better Auth.

---

### `GET /api/auth/me`

Returns the authenticated user from the current session.  
Use this for client-side session checks — faster than `/api/auth/session` as it uses the cached session.

**Auth required:** Yes (`requireSession` middleware)  
**Rate limit:** API (60 req / 15 min)

**Response `200`:**
```json
{
  "user": {
    "id": "string",
    "name": "string",
    "email": "string",
    "emailVerified": true,
    "image": null,
    "createdAt": "ISO date",
    "updatedAt": "ISO date"
  }
}
```

**Errors:**
| Status | Meaning |
|--------|---------|
| `401` | No session or session revoked |
| `403` | Email not verified |

---

## Disabled Endpoints

These endpoints are explicitly blocked and return `404`:

| Endpoint | Reason |
|----------|--------|
| `GET /api/auth/list-sessions` | Would expose session metadata |
| `POST /api/auth/revoke-session` | No ownership check — any user could revoke any session |

---

## Adding New Endpoints

Protect routes using the provided middleware:

```ts
import { requireSession, sensitiveAction } from "../auth/auth.middleware";

// Standard protected route
router.get("/profile", requireSession, getProfile);

// Sensitive route — forces fresh DB session lookup, bypasses cookie cache
router.post("/change-password", sensitiveAction, changePassword);
```

**`requireSession`** — validates the session cookie, checks the Redis blacklist, verifies email is confirmed, and attaches `req.user`.

**`sensitiveAction`** — same as `requireSession` but with `disableCookieCache: true`, forcing a fresh database lookup. Use on password changes, account deletion, and payment routes.

---

## Error Format

All errors follow this shape:

```json
{ "error": "Human readable message" }
```

Validation errors (400) include field-level detail:

```json
{
  "error": {
    "formErrors": [],
    "fieldErrors": {
      "email": ["Invalid email address"],
      "password": ["Password must contain at least one uppercase letter"]
    }
  }
}
```
