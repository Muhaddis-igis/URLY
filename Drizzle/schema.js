import { mysqlTable, int, varchar, text, tinyint, timestamp, mysqlEnum} from "drizzle-orm/mysql-core";
import { sql } from "drizzle-orm";
import { relations } from "drizzle-orm";

// ------------------ Users ------------------
export const users = mysqlTable("Users", {
  id: int("id").autoincrement().primaryKey(),
  name: varchar("name", { length: 50 }).notNull(),
  email: varchar("email", { length: 255 }).notNull().unique(),
  password: varchar("password", { length: 255 }).notNull(),
  createdAt: timestamp("created_at").defaultNow().notNull(),
  updatedAt: timestamp("updated_at").defaultNow().onUpdateNow().notNull(),
  isEmailValid: tinyint("is_email_valid").default(0).notNull() // use tinyint(1) for MySQL boolean
});

// ------------------ Sessions ------------------
export const sessions = mysqlTable("Sessions", {
  id: int("id").autoincrement().primaryKey(),
  userId: int("user_id").notNull().references(() => users.id, { onDelete: "cascade" }),
  valid: tinyint("valid").default(1).notNull(), // MySQL boolean
  userAgent: text("user_agent").notNull(),
  ipAddress: varchar("ip_address", { length: 255 }).notNull(),
  createdAt: timestamp("created_at").defaultNow().notNull(),
  updatedAt: timestamp("updated_at").defaultNow().onUpdateNow().notNull()
});

// ------------------ Shortlinks ------------------
export const shortLinks = mysqlTable("Shortlinks", {
  id: int("id").autoincrement().primaryKey(),
  originalUrl: varchar("original_url", { length: 255 }).notNull(),
  shortCode: varchar("short_code", { length: 30 }).notNull().unique(),
  userId: int("user_id").notNull().references(() => users.id),
  createdAt: timestamp("created_at").defaultNow().notNull(),
  updatedAt: timestamp("updated_at").defaultNow().onUpdateNow().notNull()
});

// ------------------ VerifyEmailTokens ------------------
export const verifyEmailTokens = mysqlTable("VerifyEmailTokens", {
  id: int("id").autoincrement().primaryKey(),
  userId: int("user_id").notNull().references(() => users.id, { onDelete: "cascade" }),
  token: varchar("token", { length: 255 }).notNull(),
  createdAt: timestamp("created_at").defaultNow().notNull(),
  updatedAt: timestamp("updated_at").defaultNow().onUpdateNow().notNull(),
  expiresAt: timestamp("expires_at").default(sql`(now() + interval 1 day)`).notNull()
});

// ------------------ PasswordResetTokens ------------------
export const passwordResetTokens = mysqlTable("password_reset_tokens", {
  id: int("id").autoincrement().primaryKey(),
  userId: int("user_id").notNull().references(() => users.id, { onDelete: "cascade" }),
  token: varchar("token", { length: 255 }).notNull(),
  expiresAt: timestamp("expires_at").default(sql`(now() + interval 1 hour)`).notNull(),
  createdAt: timestamp("created_at").defaultNow().notNull()
});

export const oauthUsers = mysqlTable("oauth_users", {
  id: int("id").autoincrement().primaryKey(),
  provider: mysqlEnum("provider", ["google"]).notNull(),
  providerUserId: varchar("provider_user_id", { length: 255 }).notNull(),
  createdAt: timestamp("created_at").defaultNow().notNull(),
})

// ------------------ Relations ------------------
export const userRelations = relations(users, ({ many }) => ({
  sessions: many(sessions),
  shortLinks: many(shortLinks),
  verifyTokens: many(verifyEmailTokens),
  passwordResetTokens: many(passwordResetTokens)
}));

export const sessionRelations = relations(sessions, ({ one }) => ({
  user: one(users, { fields: [sessions.userId], references: [users.id] })
}));

export const shortLinkRelations = relations(shortLinks, ({ one }) => ({
  user: one(users, { fields: [shortLinks.userId], references: [users.id] })
}));

export const verifyTokenRelations = relations(verifyEmailTokens, ({ one }) => ({
  user: one(users, { fields: [verifyEmailTokens.userId], references: [users.id] })
}));

export const passwordResetTokenRelations = relations(passwordResetTokens, ({ one }) => ({
  user: one(users, { fields: [passwordResetTokens.userId], references: [users.id] })
}));
