import { sql } from "drizzle-orm";
import { pgTable, text, varchar, decimal, timestamp, jsonb } from "drizzle-orm/pg-core";
import { createInsertSchema } from "drizzle-zod";
import { z } from "zod";

export const auctionItems = pgTable("auction_items", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  title: text("title").notNull(),
  description: text("description").notNull(),
  imageUrl: text("image_url").notNull(),
  condition: varchar("condition", { length: 50 }).notNull(),
  location: text("location").notNull(),
  state: varchar("state", { length: 50 }).notNull(),
  facility: text("facility").notNull(),
  endDate: timestamp("end_date").notNull(),
  currentPrice: decimal("current_price", { precision: 10, scale: 2 }).notNull(),
  msrp: decimal("msrp", { precision: 10, scale: 2 }).notNull(),
  amazonSearchUrl: text("amazon_search_url").notNull(),
  auctionUrl: text("auction_url").notNull(),
});

export const locations = pgTable("locations", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  state: varchar("state", { length: 50 }).notNull(),
  facilities: jsonb("facilities").notNull(),
});

export const crawlerRules = pgTable("crawler_rules", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  name: varchar("name", { length: 255 }).notNull(),
  searchQuery: varchar("search_query", { length: 500 }).notNull(),
  locations: jsonb("locations").notNull(), // Array of location names
  maxBidPrice: decimal("max_bid_price", { precision: 10, scale: 2 }).notNull(),
  maxTimeLeft: integer("max_time_left").notNull(), // Minutes
  checkInterval: integer("check_interval").notNull(), // Minutes
  isActive: boolean("is_active").default(true).notNull(),
  lastChecked: timestamp("last_checked"),
  createdAt: timestamp("created_at").defaultNow().notNull(),
  updatedAt: timestamp("updated_at").defaultNow().notNull(),
});

export const notifications = pgTable("notifications", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  ruleId: varchar("rule_id").notNull().references(() => crawlerRules.id),
  itemId: varchar("item_id").notNull(),
  title: varchar("title", { length: 500 }).notNull(),
  currentPrice: decimal("current_price", { precision: 10, scale: 2 }).notNull(),
  timeLeft: integer("time_left").notNull(), // Minutes
  location: varchar("location", { length: 255 }).notNull(),
  auctionUrl: varchar("auction_url", { length: 1000 }).notNull(),
  isRead: boolean("is_read").default(false).notNull(),
  createdAt: timestamp("created_at").defaultNow().notNull(),
});

export const insertAuctionItemSchema = createInsertSchema(auctionItems).omit({
  id: true,
});

export const insertLocationSchema = createInsertSchema(locations).omit({
  id: true,
});

export const insertCrawlerRuleSchema = createInsertSchema(crawlerRules).omit({
  id: true,
  createdAt: true,
  updatedAt: true,
});

export const insertNotificationSchema = createInsertSchema(notifications).omit({
  id: true,
  createdAt: true,
});

export type InsertAuctionItem = z.infer<typeof insertAuctionItemSchema>;
export type AuctionItem = typeof auctionItems.$inferSelect;
export type InsertLocation = z.infer<typeof insertLocationSchema>;
export type Location = typeof locations.$inferSelect;
export type InsertCrawlerRule = z.infer<typeof insertCrawlerRuleSchema>;
export type CrawlerRule = typeof crawlerRules.$inferSelect;
export type InsertNotification = z.infer<typeof insertNotificationSchema>;
export type Notification = typeof notifications.$inferSelect;
