import { db } from "./client";
import { ensureSchema } from "./schema";
import type { ItemRecord } from "../utils/types";

// Ensure schema exists before preparing statements
ensureSchema();

const UPSERT_SQL = `
INSERT INTO items (
  item_id, location_name, title, description, msrp, current_bid,
  end_date, time_left_seconds, status, source_url, fetched_at, dom_hash, image_url, condition,
  msrp_text, current_bid_text, time_left_text, location_text, item_id_text
) VALUES (
  @item_id, @location_name, @title, @description, @msrp, @current_bid,
  @end_date, @time_left_seconds, @status, @source_url, @fetched_at, @dom_hash, @image_url, @condition,
  @msrp_text, @current_bid_text, @time_left_text, @location_text, @item_id_text
)
ON CONFLICT(item_id, location_name) DO UPDATE SET
  title=excluded.title,
  description=excluded.description,
  msrp=excluded.msrp,
  current_bid=excluded.current_bid,
  end_date=excluded.end_date,
  time_left_seconds=excluded.time_left_seconds,
  status=excluded.status,
  source_url=excluded.source_url,
  fetched_at=excluded.fetched_at,
  dom_hash=excluded.dom_hash,
  image_url=excluded.image_url,
  condition=excluded.condition,
  msrp_text=excluded.msrp_text,
  current_bid_text=excluded.current_bid_text,
  time_left_text=excluded.time_left_text,
  location_text=excluded.location_text,
  item_id_text=excluded.item_id_text
`;

const stmt = db.prepare(UPSERT_SQL);

/** Idempotent write; never duplicates a row. */
export function upsertItem(rec: ItemRecord): void {
  stmt.run(rec);
}
