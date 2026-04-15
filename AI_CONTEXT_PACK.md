# AI Context Pack - URLly

Purpose: Give any coding agent enough context to safely and quickly work in this repository.

## One-minute Project Summary

- Express + EJS server-rendered app for URL shortening.
- MySQL persistence through Drizzle ORM.
- Cookie-based auth using access and refresh JWTs with DB sessions.
- Includes signup/login, Google OAuth login, profile pages, email verification, password reset.

## Runtime Entry and Flow

Primary entrypoint:
- `script.js`

Mounted routers:
- `routes/Auth.routes.js`
- `routes/shortener.routes.js`
- `routes/Profile.routes.js`

Global middleware order in `script.js` (important):
1. static files
2. view setup (EJS)
3. URL-encoded parser
4. cookie parser
5. session + flash
6. request IP middleware
7. `VerifyAuthentication`
8. `res.locals` enrichment
9. route mounting

## Domain Map

### Auth domain
Files:
- `Controllers/Auth.controller.js`
- `Services/Auth.services.js`
- `Validator/auth.validator.js`
- `Middlewares/Verifytoken.middleware.js`

Key behaviors:
- `postloginHandler`: verifies password with argon2 and issues auth cookies.
- `postsignupHandler`: creates user and auto-issues auth cookies.
- `logoutHandler`: deletes DB session and clears auth cookies.
- Refresh behavior: if no access token but valid refresh token, middleware reissues access token.

### URL shortener domain
Files:
- `Controllers/gethandler.controller.js`
- `Controllers/posthandler.controller.js`
- `Controllers/redirecter.controller.js`
- `Controllers/deletehandler.controller.js`
- `Services/Shortener.services.js`
- `Validator/shortener.validator.js`

Key behaviors:
- Dashboard create route validates URL + shortcode.
- Shortcode uniqueness enforced by DB unique constraint.
- Redirect route: `/S/:shortcode`.

### Email verification domain
Files:
- `Services/EmailVerification.services.js`
- `Controllers/gethandler.controller.js`
- `Controllers/posthandler.controller.js`

Key behaviors:
- Stores one token per user.
- Generates verification URL using `BASE_URL`.
- Marks `Users.is_email_valid` and removes token on success.

### Password reset domain
Files:
- `Services/PasswordReset.services.js`
- `Controllers/Auth.controller.js`

Key behaviors:
- Generates secure token (`crypto.randomBytes`).
- Resets password only for valid/unexpired token.
- Deletes all sessions after successful reset.

### Profile domain
Files:
- `Controllers/Profile.controller.js`
- `Services/profile.services.js`
- `Validator/profile.validator.js`

Key behaviors:
- Profile summary aggregates total links and last active.
- Change password verifies current password + checks strength via `zxcvbn`.

## Database Context

Schema file:
- `Drizzle/schema.js`

Tables:
- `Users`
- `Sessions`
- `Shortlinks`
- `VerifyEmailTokens`
- `password_reset_tokens`
- `oauth_users` (defined, currently not wired)

Operational notes:
- Session rows represent active login sessions.
- Refresh token payload uses `sessionId` to rehydrate user.
- Token cleanup for verify/reset flows is done in transactions.

## Agent Working Rules (Repository-Specific)

1. Keep the layered pattern: route -> controller -> service -> DB.
2. Put input validation in `Validator/` with Zod; do not bury validation logic in services.
3. Preserve cookie names exactly: `Access_token`, `Refresh_token`.
4. For protected pages, preserve guard style `if (!req.user) return res.redirect('/login')`.
5. Continue using flash messages for user-facing validation errors.
6. When touching auth/session logic, verify middleware refresh branch still works.
7. Prefer editing existing modules over creating parallel duplicates.
8. Do not hardcode secrets; only use environment variables.

## High-Impact Risk Areas

- Auth middleware can silently set `req.user = null`; route behavior depends on this.
- Some token-related code paths are brittle; regression-test login/logout/reset after changes.
- Mail service code contains two implementations in `lib/`; update carefully to avoid divergence.
- Case-sensitive path differences (`drizzle` vs `Drizzle`) can break Linux environments.

## Recommended Validation After Changes

Minimum manual checks:
1. Signup -> Login -> Dashboard access.
2. Create short link -> redirect works.
3. Edit and delete short link from dashboard.
4. Forgot password email -> reset password -> old session invalidated.
5. Email verification link flow.
6. Profile edit + change password.
7. Refresh token path: delete access cookie, keep refresh cookie, then open protected route.

## Local Commands

```bash
npm install
npm run generate
npm run migrate
npm run dev
npm run studio
```

## Required Environment Variables (names only)

- `PORT`
- `DATABASE_URL`
- `JWT_SECRET`
- `JWT_ACCESS_SECRET`
- `JWT_REFRESH_SECRET`
- `SESSION_SECRET`
- `RESEND_API_KEY`
- `EMAIL_FROM`
- `GOOGLE_CLIENT_ID`
- `GOOGLE_CLIENT_SECRET`
- `GOOGLE_REDIRECT_URI`
- `BASE_URL`
- `FRONTEND_URL`

## Where to Start for Common Tasks

- Add new endpoint: router file -> controller -> service -> validator -> view.
- Change DB model: `Drizzle/schema.js` -> generate/migrate -> update service queries.
- Adjust auth behavior: `Middlewares/Verifytoken.middleware.js` + `Services/Auth.services.js`.
- Modify email content/flow: `Services/EmailVerification.services.js` or `Services/PasswordReset.services.js` + `lib/Send-mail.js`.

## Commit Hygiene Guidance for Agents

- Keep PRs small and domain-focused.
- Mention changed flows explicitly (for example: "reset password now invalidates sessions").
- Include reproduction and verification steps in PR notes.
- Never include real credentials in docs, commits, or logs.
