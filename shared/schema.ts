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

export const insertAuctionItemSchema = createInsertSchema(auctionItems).omit({
  id: true,
});

export const insertLocationSchema = createInsertSchema(locations).omit({
  id: true,
});

export type InsertAuctionItem = z.infer<typeof insertAuctionItemSchema>;
export type AuctionItem = typeof auctionItems.$inferSelect;
export type InsertLocation = z.infer<typeof insertLocationSchema>;
export type Location = typeof locations.$inferSelect;
