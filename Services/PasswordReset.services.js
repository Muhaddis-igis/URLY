import crypto from 'crypto'
import { and, eq, lt, sql } from 'drizzle-orm'
import { db } from '../Config/db.js'
import { passwordResetTokens, sessions, users } from '../Drizzle/schema.js'
import { sendEmail } from '../lib/Send-mail.js'

export const generatePasswordResetToken = () => crypto.randomBytes(32).toString('hex')

export const generatePasswordResetLink = (token, email) => {
  const baseUrl = process.env.BASE_URL || `http://localhost:${process.env.PORT || 3000}`
  const url = new URL('/reset-password', baseUrl)
  url.searchParams.set('token', token)
  url.searchParams.set('email', email)
  return url.toString()
}

export const createPasswordResetTokenForUser = async ({ userId, token }) => {
  return db.transaction(async (tx) => {
    await tx
      .delete(passwordResetTokens)
      .where(eq(passwordResetTokens.userId, userId))

    await tx.insert(passwordResetTokens).values({
      userId,
      token
    })
  })
}

export const getValidPasswordResetToken = async ({ token, email }) => {
  return db.transaction(async (tx) => {
    await tx
      .delete(passwordResetTokens)
      .where(lt(passwordResetTokens.expiresAt, sql`CURRENT_TIMESTAMP()`))

    const [row] = await tx
      .select({
        userId: users.id,
        email: users.email,
        token: passwordResetTokens.token,
        expiresAt: passwordResetTokens.expiresAt
      })
      .from(passwordResetTokens)
      .innerJoin(users, eq(users.id, passwordResetTokens.userId))
      .where(and(eq(passwordResetTokens.token, token), eq(users.email, email)))
      .limit(1)

    if (!row) {
      return null
    }

    if (new Date(row.expiresAt) < new Date()) {
      return null
    }

    return row
  })
}

export const resetPasswordByToken = async ({ token, email, nextPasswordHash }) => {
  return db.transaction(async (tx) => {
    await tx
      .delete(passwordResetTokens)
      .where(lt(passwordResetTokens.expiresAt, sql`CURRENT_TIMESTAMP()`))

    const [row] = await tx
      .select({
        userId: users.id,
        token: passwordResetTokens.token,
        expiresAt: passwordResetTokens.expiresAt
      })
      .from(passwordResetTokens)
      .innerJoin(users, eq(users.id, passwordResetTokens.userId))
      .where(and(eq(passwordResetTokens.token, token), eq(users.email, email)))
      .limit(1)

    if (!row) {
      return { updated: false }
    }

    if (new Date(row.expiresAt) < new Date()) {
      return { updated: false }
    }

    await tx
      .update(users)
      .set({ password: nextPasswordHash })
      .where(eq(users.id, row.userId))

    await tx
      .delete(passwordResetTokens)
      .where(eq(passwordResetTokens.userId, row.userId))

    // Invalidate all existing sessions after password reset.
    await tx
      .delete(sessions)
      .where(eq(sessions.userId, row.userId))

    return { updated: true, userId: row.userId }
  })
}

export const sendPasswordResetEmail = async ({ email, token }) => {
  const resetLink = generatePasswordResetLink(token, email)

  await sendEmail({
    to: email,
    subject: 'Reset your URLly password',
    html: `
      <h1>Reset your password</h1>
      <p>We received a request to reset your password.</p>
      <p>Click the link below to set a new password. This link expires in 1 hour.</p>
      <p><a href="${resetLink}">Reset Password</a></p>
      <p>If you did not request this, you can ignore this email.</p>
    `
  })
}
