import { db } from "../Config/db.js";
import { users, verifyEmailTokens } from "../Drizzle/schema.js";
import {sendEmail} from '../lib/Send-mail.js'
import { eq, lt, sql } from "drizzle-orm";
import crypto from 'crypto'





export const generateVerificationCode = (digit = 8) => {
    const min = 10 ** (digit - 1);
    const max = 10 ** digit - 1;
    return crypto.randomInt(min, max);
}

export const addVerificationCode = async ({ userId, token }) => {
    try {
        await db
            .delete(verifyEmailTokens)
            .where(eq(verifyEmailTokens.userId, userId));

        // Insert new token
        await db.insert(verifyEmailTokens).values({
            userId,
            token,
        });
    } catch (error) {
        throw error;
    }
};
export const generateVerificationLink = (token, email) => {
    const baseUrl = process.env.BASE_URL || 'http://localhost:3000';
    let url = new URL('/login/verify-email-token', baseUrl);
    url.searchParams.append('token', token);
    url.searchParams.append('email', email);
    return url.toString();
}
export const getVerificationById = async (userId) => {
    return db.transaction(async (tx) => {
        try {
            await tx
                .delete(verifyEmailTokens)
                .where(lt(verifyEmailTokens.expiresAt, sql`CURRENT_TIMESTAMP()`));
            const [verification] = await tx.select().from(verifyEmailTokens).where(eq(verifyEmailTokens.userId, userId)).limit(1);
            console.log("Verification token retrieved:", verification);
            return verification || null;

        } catch (error) {
            throw error;
        }
    })
};

export const getVerificationByTokenAndEmail = async (token, email) => {
    try {
        const [verification] = await db
            .select({
                userId: users.id,
                email: users.email,
                token: verifyEmailTokens.token,
                expiresAt: verifyEmailTokens.expiresAt,
            })
            .from(verifyEmailTokens)
            .innerJoin(users, eq(users.id, verifyEmailTokens.userId))
            .where(eq(verifyEmailTokens.token, token))
            .limit(1);

        if (!verification) {
            return null;
        }

        if (verification.email.toLowerCase() !== email.toLowerCase()) {
            return null;
        }

        return verification;
    } catch (error) {
        throw error;
    }
};


export const tokenValidation = async (token) => {
    try {
        const verification = await db.select({
            id: verifyEmailTokens.id,
            userId: verifyEmailTokens.userId,
            expiresAt: verifyEmailTokens.expiresAt,
        }).from(verifyEmailTokens).where(eq(verifyEmailTokens.token, token));
        return verification || null;
    }
    catch (error) {
        throw error;
    }
}
export const verifyUser = async ({ email, token }) => {
    await db.transaction(async (tx) => {
        try {
            await tx.update(users).set({ isEmailValid: true }).where(eq(users.email, email));
            await tx.delete(verifyEmailTokens).where(eq(verifyEmailTokens.token, token));
        }
        catch (error) {
            throw error;
        }
    })
}
export const SendVerificationEmail = async ({ userId, email }) => {
    const verification = await getVerificationById(userId);
    if (verification) {
        return res.redirect('/login/verify-email')
    }
    const verificationCode = generateVerificationCode()
    await addVerificationCode({ userId: userId, token: verificationCode });
    const verifyLink = generateVerificationLink(verificationCode, email)
    sendEmail({ to: email, subject: 'Verify your email for URLly', html: `<h1>Verify Your Email</h1><p>Please click the link below to verify your email address: and your refresh token is ${verificationCode}</p><a href="${verifyLink}">Verify Email</a>` })
    console.log("everything is fine")
}