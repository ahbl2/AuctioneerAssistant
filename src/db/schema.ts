import { db } from "./client";

export function ensureSchema() {
  db.exec(`
  CREATE TABLE IF NOT EXISTS items (
    item_id TEXT NOT NULL,
    location_name TEXT NOT NULL,
    title TEXT,
    description TEXT,
    msrp REAL,
    current_bid REAL,
    end_date TEXT,
    time_left_seconds INTEGER,
    status TEXT CHECK (status IN ('active','ended','unknown')) NOT NULL DEFAULT 'unknown',
    source_url TEXT NOT NULL,
    fetched_at TEXT NOT NULL,
    dom_hash TEXT,
    image_url TEXT,
    condition TEXT,
    msrp_text TEXT,
    current_bid_text TEXT,
    time_left_text TEXT,
    location_text TEXT,
    item_id_text TEXT,
    PRIMARY KEY (item_id, location_name)
  );
  CREATE INDEX IF NOT EXISTS idx_items_status ON items(status);
  CREATE INDEX IF NOT EXISTS idx_items_location ON items(location_name);
  CREATE INDEX IF NOT EXISTS idx_items_bid ON items(current_bid);
  `);
}
