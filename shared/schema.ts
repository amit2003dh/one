import { sql } from "drizzle-orm";
import { pgTable, text, varchar, timestamp, boolean, integer } from "drizzle-orm/pg-core";
import { createInsertSchema } from "drizzle-zod";
import { z } from "zod";

// Email Categories
export const EMAIL_CATEGORIES = [
  "Interested",
  "Meeting Booked",
  "Not Interested",
  "Spam",
  "Out of Office"
] as const;

export type EmailCategory = typeof EMAIL_CATEGORIES[number];

// Email Accounts Table
export const emailAccounts = pgTable("email_accounts", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  email: text("email").notNull().unique(),
  imapHost: text("imap_host").notNull(),
  imapPort: integer("imap_port").notNull().default(993),
  imapUser: text("imap_user").notNull(),
  imapPassword: text("imap_password").notNull(),
  isActive: boolean("is_active").notNull().default(true),
  lastSyncedAt: timestamp("last_synced_at"),
  createdAt: timestamp("created_at").notNull().default(sql`now()`),
});

export const insertEmailAccountSchema = createInsertSchema(emailAccounts).omit({
  id: true,
  isActive: true,
  lastSyncedAt: true,
  createdAt: true,
});

export type InsertEmailAccount = z.infer<typeof insertEmailAccountSchema>;
export type EmailAccount = typeof emailAccounts.$inferSelect;

// Emails Table
export const emails = pgTable("emails", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  accountId: varchar("account_id").notNull().references(() => emailAccounts.id, { onDelete: "cascade" }),
  messageId: text("message_id").notNull(),
  from: text("from").notNull(),
  to: text("to").notNull(),
  subject: text("subject").notNull(),
  bodyText: text("body_text"),
  bodyHtml: text("body_html"),
  folder: text("folder").notNull().default("INBOX"),
  category: text("category"),
  isRead: boolean("is_read").notNull().default(false),
  hasAttachments: boolean("has_attachments").notNull().default(false),
  receivedAt: timestamp("received_at").notNull(),
  createdAt: timestamp("created_at").notNull().default(sql`now()`),
});

export const insertEmailSchema = createInsertSchema(emails).omit({
  id: true,
  createdAt: true,
});

export type InsertEmail = z.infer<typeof insertEmailSchema>;
export type Email = typeof emails.$inferSelect;

// Extended Email type with account info for frontend
export interface EmailWithAccount extends Email {
  accountEmail: string;
}

// Search filters
export const searchFiltersSchema = z.object({
  query: z.string().optional(),
  accountId: z.string().optional(),
  folder: z.string().optional(),
  category: z.enum(EMAIL_CATEGORIES).optional(),
  hasAttachments: z.boolean().optional(),
  isRead: z.boolean().optional(),
  dateFrom: z.string().optional(),
  dateTo: z.string().optional(),
});

export type SearchFilters = z.infer<typeof searchFiltersSchema>;

// Update email category schema
export const updateEmailCategorySchema = z.object({
  category: z.enum(EMAIL_CATEGORIES),
});

export type UpdateEmailCategory = z.infer<typeof updateEmailCategorySchema>;
