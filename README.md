# URLly - URL Shortener with Drizzle

A production-style URL shortener built with Express, EJS, MySQL, and Drizzle ORM.

## Overview

This project provides:
- User authentication (email/password + Google OAuth)
- Session-backed JWT authentication with access/refresh cookies
- URL shortening with custom shortcodes
- Email verification
- Password reset flow
- User profile management

Stack:
- Runtime: Node.js (ESM)
- Server: Express 5
- Views: EJS
- ORM: Drizzle ORM
- Database: MySQL
- Validation: Zod
- Auth & Security: argon2, jsonwebtoken, express-session, cookie-parser
- Mail: Resend (with a fallback nodemailer utility in repository)

## Project Structure

- `script.js`: app bootstrap, middlewares, route mounting
- `routes/`: route definitions by domain
- `Controllers/`: HTTP controllers
- `Services/`: DB/business logic
- `Drizzle/schema.js`: database schema
- `Drizzle/Migration/`: SQL migrations
- `Validator/`: request validation with Zod
- `Middlewares/Verifytoken.middleware.js`: auth extraction and token refresh behavior
- `Views/`: EJS templates
- `Public/`: static CSS assets

## Architecture Notes

### Request flow
1. Request reaches global middleware chain in `script.js`.
2. `VerifyAuthentication` reads auth cookies and populates `req.user`.
3. Controllers guard private pages with `if (!req.user) redirect('/login')`.
4. Controllers call service layer for data mutation/fetch.
5. Views render with `res.locals.user` and flash messages.

### Auth model
- Access cookie: `Access_token` (short-lived)
- Refresh cookie: `Refresh_token` (long-lived)
- Refresh token stores `sessionId` only.
- Sessions are persisted in DB (`Sessions` table).
- If only refresh token exists and is valid, middleware issues a new access token.

### Data model (high-level)
Main tables in `Drizzle/schema.js`:
- `Users`
- `Sessions`
- `Shortlinks`
- `VerifyEmailTokens`
- `password_reset_tokens`
- `oauth_users` (present but currently not wired in auth flow)

## Setup

## 1) Install dependencies

```bash
npm install
```

## 2) Create environment file

Create `.env` in project root with your own values:

```env
PORT=3000
DATABASE_URL=mysql://<username>:<password>@<host>:<port>/<database>?ssl-mode=REQUIRED

JWT_SECRET=<strong-random-secret>
JWT_ACCESS_SECRET=<strong-random-secret>
JWT_REFRESH_SECRET=<strong-random-secret>
SESSION_SECRET=<strong-random-secret>

RESEND_API_KEY=<resend-api-key>
EMAIL_FROM=Website <noreply@yourdomain.com>

GOOGLE_CLIENT_ID=<google-client-id>
GOOGLE_CLIENT_SECRET=<google-client-secret>
GOOGLE_REDIRECT_URI=http://localhost:3000/google/callback

BASE_URL=http://localhost:3000
FRONTEND_URL=http://localhost:3000
```

## 3) Generate and run migrations

```bash
npm run generate
npm run migrate
```

## 4) Start development server

```bash
npm run dev
```

Server default: `http://localhost:3000`

## Scripts

From `package.json`:
- `npm run dev` -> run app with nodemon
- `npm run generate` -> generate Drizzle migration files
- `npm run migrate` -> run DB migrations
- `npm run studio` -> launch Drizzle Studio

## Routes

### Public pages and auth
- `GET /` -> Home page
- `GET /login` -> Login page
- `POST /login` -> Login submit
- `GET /signup` -> Signup page
- `POST /signup` -> Signup submit
- `GET /logout` -> Logout

### Password reset
- `GET /forgot-password` and `POST /forgot-password`
- `GET /login/forgot-password` and `POST /login/forgot-password`
- `GET /reset-password?token=...&email=...`
- `POST /reset-password`

### Google OAuth
- `GET /google`
- `GET /google/callback`

### URL shortener
- `GET /login/dashboard`
- `POST /login/dashboard`
- `GET /login/dashboard/edit/:id`
- `POST /login/dashboard/edit/:id`
- `DELETE /delete/S/:shortcode`
- `GET /S/:shortcode` -> redirect to original URL

### Email verification
- `GET /login/verify-email`
- `POST /login/verify-email`
- `GET /login/verify-email-token?token=...&email=...`
- `POST /login/verify-email-token`
- `GET /login/verify-email/resend`

### Profile
- `GET /login/profile`
- `GET /login/profile/edit`
- `POST /login/profile/edit`
- `GET /login/profile/change-password`
- `POST /login/profile/change-password`

## Validation

Validation middleware exists in:
- `Validator/auth.validator.js`
- `Validator/shortener.validator.js`
- `Validator/profile.validator.js`

Patterns:
- Input is parsed via Zod.
- Validation errors are flashed and redirected.
- Controllers generally assume validated input in private actions.

## Deployment Notes

- Ensure MySQL and SSL parameters in `DATABASE_URL` are valid for target host.
- Set `NODE_ENV=production` for secure cookie behavior.
- Make sure OAuth redirect URI exactly matches deployed callback URL.
- Configure `BASE_URL` to deployed domain so email links are correct.

## Security Notes

- Passwords are hashed with argon2.
- JWT secrets must be strong and rotated if leaked.
- Never commit real `.env` values.
- If secrets were ever committed, rotate all of them immediately.

## Known Gaps / Improvements

- Add automated tests (unit + integration).
- Add centralized error-handling middleware.
- Add rate limiting for auth and short-link creation routes.
- Remove duplicate/legacy code paths and tighten token verification edge cases.
- Confirm migration output path casing (`drizzle` vs `Drizzle`) for Linux deployments.

## Troubleshooting

### Drizzle Studio fails to run
- Verify `DATABASE_URL` is valid.
- Confirm Drizzle config points to correct schema path.
- Ensure DB host allows your IP.

### Login loop or missing user session
- Check cookie names: `Access_token`, `Refresh_token`.
- Verify JWT secrets and expiry values.
- Inspect `Sessions` table for issued session row.

### Email links not working
- Check `BASE_URL` and mail provider API key.
- Verify resend sender domain/address.

## License

ISC (as in `package.json`).
