import { db } from "../Config/db.js";
import { users, shortLinks } from "../Drizzle/schema.js";
import { eq, sql } from "drizzle-orm";
export const loadProfileSummaryByUserId = async (userId) => {
    try {
        const [summary] = await db
            .select({
                id: users.id,
                name: users.name,
                email: users.email,
                createdAt: users.createdAt,
                isEmailValid: users.isEmailValid,
                totalLinks: sql`count(${shortLinks.id})`,
                lastActive: sql`max(${shortLinks.updatedAt})`,
            })
            .from(users)
            .leftJoin(shortLinks, eq(shortLinks.userId, users.id))
            .where(eq(users.id, userId))
            .groupBy(users.id, users.name, users.email, users.createdAt, users.isEmailValid)
            .limit(1);

        if (!summary) {
            return null;
        }

        return {
            ...summary,
            totalLinks: Number(summary.totalLinks || 0),
            isEmailValid: Boolean(summary.isEmailValid),
        };
    } catch (error) {
        throw error;
    }
};
export const updateUserName = async ({ userId, newName }) => {
    try {
        await db.update(users).set({ name: newName }).where(eq(users.id, userId));
    } catch (error) {
        throw error;
    }
}
export const updatePassword = async ({ userId, password }) => {
    try { await db.update(users).set({ password: password }).where(eq(users.id, userId)); }
    catch (error) {
        throw error;
    }
}