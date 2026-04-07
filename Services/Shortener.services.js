import { db } from "../Config/db.js";
import { shortLinks, users, verifyEmailTokens } from "../Drizzle/schema.js";
import { eq, lt, sql } from "drizzle-orm";
import crypto from 'crypto'
import { id } from "zod/locales";

export const LoadShortLinks = async (userId) => {
  try {
    const links = await db.select().from(shortLinks).where(eq(shortLinks.userId, userId));
    // console.log("âœ… Short links loaded successfully:", links);
    return links;
  } catch (error) {
    // console.error("âŒ Error loading short links:", error);
    throw error;
  }
};
export const LoadShortLink = async (shortCode) => {
  try {
    const link = await db
      .select()
      .from(shortLinks)
      .where(eq(shortLinks.shortCode, shortCode))
      .limit(1);

    return link[0] || null;
  } catch (error) {
    // console.error("Error loading short link:", error);
    throw error;
  }
};
export const LoadShortLinkById = async (id) => {
  try {
    const [link] = await db.select().from(shortLinks).where(eq(shortLinks.id, id)).limit(1);
    return link || null;
  } catch (error) {
    // console.error("âŒ Error loading short link by ID:", error);
    throw error;
  }
}

export const SaveShortLink = async (originalUrl, shortCode, userId) => {
  try {
    const result = await db.insert(shortLinks).values({ originalUrl, shortCode, userId });
    return result;
  } catch (error) {
    // console.error("âŒ Error saving short link:", error);
    throw error;
  }
};

export const SaveShortLinkIfAvailable = async (originalUrl, shortCode, userId) => {
  try {
    await db.insert(shortLinks).values({ originalUrl, shortCode, userId });
    return { created: true };
  } catch (error) {
    if (error?.code === 'ER_DUP_ENTRY' || error?.errno === 1062) {
      return { created: false };
    }
    throw error;
  }
};

export const deleteShortLink = async (shortCode) => {
  try {
    await db.delete(shortLinks).where(eq(shortLinks.shortCode, shortCode));
    // // console.log(`Shortcode ${shortCode} deleted successfully`);
  } catch (error) {
    // console.error("âŒ Error deleting short link:", error);
    throw error;
  }
};

export const updateShortLink = async (id, originalUrl, shortCode) => {
  try {
    await db.update(shortLinks).set({ originalUrl, shortCode }).where(eq(shortLinks.id, id))
  }
  catch (error) {
    // console.error("âŒ Error updating short link:", error);
    throw error;
  }
}
