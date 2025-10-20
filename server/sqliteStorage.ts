/**
 * SQLite Storage Adapter
 * 
 * Implements the speed improvement plan with persistent storage,
 * UPSERT operations, and content hashing for change detection.
 */

import Database from 'better-sqlite3';
import { createHash } from 'crypto';
import { existsSync, mkdirSync } from 'fs';
import { join } from 'path';

export type Status = "active" | "ended" | "unknown";

export interface ItemRecord {
  item_id: string;
  location_name: string;
  title: string | null;
  description: string | null;
  msrp: number | null;
  current_bid: number | null;
  end_date: string | null;            // ISO-8601, if provided by site/API
  time_left_seconds: number | null;   // optional, only when explicit
  status: Status;
  source_url: string;
  fetched_at: string;                 // ISO-8601 at fetch time
  dom_hash: string | null;
  // raw echoes for audit
  msrp_text: string | null;
  current_bid_text: string | null;
  time_left_text: string | null;
  location_text: string | null;
  item_id_text: string | null;
}

export class SQLiteStorage {
  private db: Database.Database;
  private upsertStmt!: Database.Statement;
  private searchStmt!: Database.Statement;

  constructor(dbPath: string = './data/bidfta.db') {
    // Ensure data directory exists
    const dataDir = join(process.cwd(), 'data');
    if (!existsSync(dataDir)) {
      mkdirSync(dataDir, { recursive: true });
    }

    this.db = new Database(dbPath);
    this.initializeSchema();
    this.prepareStatements();
  }

  private initializeSchema(): void {
    // Create main items table
    this.db.exec(`
      CREATE TABLE IF NOT EXISTS items (
        item_id TEXT NOT NULL,
        location_name TEXT NOT NULL,
        title TEXT,
        description TEXT,
        msrp REAL,
        current_bid REAL,
        end_date TEXT,                    -- ISO-8601 from site when available
        time_left_seconds INTEGER,        -- optional; 0 if explicitly ended; else NULL
        status TEXT CHECK (status IN ('active','ended','unknown')) NOT NULL DEFAULT 'unknown',
        source_url TEXT NOT NULL,
        fetched_at TEXT NOT NULL,         -- ISO-8601 when this record was refreshed
        dom_hash TEXT,
        msrp_text TEXT,
        current_bid_text TEXT,
        time_left_text TEXT,
        location_text TEXT,
        item_id_text TEXT,
        PRIMARY KEY (item_id, location_name)
      )
    `);

    // Create indexes for fast queries
    this.db.exec(`
      CREATE INDEX IF NOT EXISTS idx_items_status ON items(status);
      CREATE INDEX IF NOT EXISTS idx_items_location ON items(location_name);
      CREATE INDEX IF NOT EXISTS idx_items_bid ON items(current_bid);
      CREATE INDEX IF NOT EXISTS idx_items_end_date ON items(end_date);
      CREATE INDEX IF NOT EXISTS idx_items_fetched_at ON items(fetched_at);
    `);

    // Note: FTS5 virtual table disabled for now due to SQLite compilation issues
    // Will use LIKE queries instead for text search
  }

  private prepareStatements(): void {
    // UPSERT statement
    this.upsertStmt = this.db.prepare(`
      INSERT INTO items (
        item_id, location_name, title, description, msrp, current_bid,
        end_date, time_left_seconds, status, source_url, fetched_at,
        dom_hash, msrp_text, current_bid_text, time_left_text, location_text, item_id_text
      ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
      ON CONFLICT(item_id, location_name) DO UPDATE SET
        title = excluded.title,
        description = excluded.description,
        msrp = excluded.msrp,
        current_bid = excluded.current_bid,
        end_date = excluded.end_date,
        time_left_seconds = excluded.time_left_seconds,
        status = excluded.status,
        source_url = excluded.source_url,
        fetched_at = excluded.fetched_at,
        dom_hash = excluded.dom_hash,
        msrp_text = excluded.msrp_text,
        current_bid_text = excluded.current_bid_text,
        time_left_text = excluded.time_left_text,
        location_text = excluded.location_text,
        item_id_text = excluded.item_id_text
    `);

    // Search statement
    this.searchStmt = this.db.prepare(`
      SELECT * FROM items 
      WHERE status = 'active'
      AND (title LIKE ? OR description LIKE ?)
      AND (? IS NULL OR location_name = ?)
      AND (? IS NULL OR current_bid >= ?)
      AND (? IS NULL OR current_bid <= ?)
      ORDER BY current_bid DESC
      LIMIT ? OFFSET ?
    `);

    // Note: FTS5 search removed, using LIKE queries instead
  }

  /**
   * Idempotent write; never duplicates. Fields not present remain unchanged.
   */
  upsertItem(rec: ItemRecord): void {
    this.upsertStmt.run(
      rec.item_id,
      rec.location_name,
      rec.title,
      rec.description,
      rec.msrp,
      rec.current_bid,
      rec.end_date,
      rec.time_left_seconds,
      rec.status,
      rec.source_url,
      rec.fetched_at,
      rec.dom_hash,
      rec.msrp_text,
      rec.current_bid_text,
      rec.time_left_text,
      rec.location_text,
      rec.item_id_text
    );
  }

  /**
   * Search items with optional filters
   */
  searchItems(options: {
    query?: string;
    location?: string;
    minBid?: number;
    maxBid?: number;
    page?: number;
    limit?: number;
  }): { items: ItemRecord[]; total: number } {
    const {
      query = '',
      location = null,
      minBid = null,
      maxBid = null,
      page = 1,
      limit = 100
    } = options;

    const offset = (page - 1) * limit;
    const searchTerm = `%${query}%`;

    // Use LIKE search for all queries
    const stmt = this.searchStmt;
    const params = [searchTerm, searchTerm, location, location, minBid, minBid, maxBid, maxBid, limit, offset];

    const items = stmt.all(...params) as ItemRecord[];

    // Get total count for pagination
    const countStmt = this.db.prepare(`
      SELECT COUNT(*) as total FROM items 
      WHERE status = 'active'
      AND (title LIKE ? OR description LIKE ?)
      AND (? IS NULL OR location_name = ?)
      AND (? IS NULL OR current_bid >= ?)
      AND (? IS NULL OR current_bid <= ?)
    `);
    
    const countParams = [searchTerm, searchTerm, location, location, minBid, minBid, maxBid, maxBid];
    const { total } = countStmt.get(...countParams) as { total: number };

    return { items, total };
  }

  /**
   * Get item by ID and location
   */
  getItem(itemId: string, locationName: string): ItemRecord | null {
    const stmt = this.db.prepare(`
      SELECT * FROM items 
      WHERE item_id = ? AND location_name = ?
    `);
    return stmt.get(itemId, locationName) as ItemRecord | null;
  }

  /**
   * Get all active items for a location
   */
  getActiveItems(locationName?: string): ItemRecord[] {
    const stmt = locationName 
      ? this.db.prepare(`SELECT * FROM items WHERE status = 'active' AND location_name = ? ORDER BY current_bid DESC`)
      : this.db.prepare(`SELECT * FROM items WHERE status = 'active' ORDER BY current_bid DESC`);
    
    return stmt.all(locationName || []) as ItemRecord[];
  }

  /**
   * Update item status
   */
  updateItemStatus(itemId: string, locationName: string, status: Status): void {
    const stmt = this.db.prepare(`
      UPDATE items 
      SET status = ?, fetched_at = ?
      WHERE item_id = ? AND location_name = ?
    `);
    stmt.run(status, new Date().toISOString(), itemId, locationName);
  }

  /**
   * Get items ending soon (for priority polling)
   */
  getItemsEndingSoon(hours: number = 2): ItemRecord[] {
    const cutoff = new Date();
    cutoff.setHours(cutoff.getHours() + hours);
    
    const stmt = this.db.prepare(`
      SELECT * FROM items 
      WHERE status = 'active' 
      AND end_date IS NOT NULL 
      AND datetime(end_date) <= datetime(?)
      ORDER BY end_date ASC
    `);
    
    return stmt.all(cutoff.toISOString()) as ItemRecord[];
  }

  /**
   * Get statistics
   */
  getStats(): {
    totalItems: number;
    activeItems: number;
    endedItems: number;
    byLocation: { [location: string]: number };
  } {
    const totalStmt = this.db.prepare(`SELECT COUNT(*) as count FROM items`);
    const activeStmt = this.db.prepare(`SELECT COUNT(*) as count FROM items WHERE status = 'active'`);
    const endedStmt = this.db.prepare(`SELECT COUNT(*) as count FROM items WHERE status = 'ended'`);
    const locationStmt = this.db.prepare(`
      SELECT location_name, COUNT(*) as count 
      FROM items 
      WHERE status = 'active' 
      GROUP BY location_name
    `);

    const total = (totalStmt.get() as { count: number }).count;
    const active = (activeStmt.get() as { count: number }).count;
    const ended = (endedStmt.get() as { count: number }).count;
    const byLocation: { [location: string]: number } = {};
    
    (locationStmt.all() as { location_name: string; count: number }[]).forEach(row => {
      byLocation[row.location_name] = row.count;
    });

    return { totalItems: total, activeItems: active, endedItems: ended, byLocation };
  }

  /**
   * Clean up old records
   */
  cleanup(daysOld: number = 30): void {
    const cutoff = new Date();
    cutoff.setDate(cutoff.getDate() - daysOld);
    
    const stmt = this.db.prepare(`
      DELETE FROM items 
      WHERE status = 'ended' 
      AND datetime(fetched_at) < datetime(?)
    `);
    
    const result = stmt.run(cutoff.toISOString());
    console.log(`Cleaned up ${result.changes} old records`);
  }

  /**
   * Close database connection
   */
  close(): void {
    this.db.close();
  }
}

// Utility functions for normalization
export function parseMoney(text: string | null): number | null {
  if (!text) return null;
  const cleaned = text.replace(/[$,\s]/g, '');
  const parsed = parseFloat(cleaned);
  return isNaN(parsed) ? null : parsed;
}

export function parseTimeLeftToSeconds(text: string | null): number | null {
  if (!text) return null;
  
  // Parse patterns like "1d 2h 3m 4s" or "2h 30m" or "45m"
  const timeRegex = /(?:(\d+)d\s*)?(?:(\d+)h\s*)?(?:(\d+)m\s*)?(?:(\d+)s\s*)?/;
  const match = text.match(timeRegex);
  
  if (!match) return null;
  
  const days = parseInt(match[1] || '0');
  const hours = parseInt(match[2] || '0');
  const minutes = parseInt(match[3] || '0');
  const seconds = parseInt(match[4] || '0');
  
  return days * 86400 + hours * 3600 + minutes * 60 + seconds;
}

export function hashDom(html: string): string {
  return createHash('sha1').update(html).digest('hex').substring(0, 12);
}

export function mapLocation(raw: string): string | null {
  // Whitelist of canonical location names
  const locationMap: { [key: string]: string } = {
    'Cincinnati — Broadwell Road': 'Cincinnati — Broadwell Road',
    'Cincinnati — Colerain Avenue': 'Cincinnati — Colerain Avenue',
    'Cincinnati — School Road': 'Cincinnati — School Road',
    'Cincinnati — Waycross Road': 'Cincinnati — Waycross Road',
    'Cincinnati — West Seymour Avenue': 'Cincinnati — West Seymour Avenue',
    'Elizabethtown — Peterson Drive': 'Elizabethtown — Peterson Drive',
    'Erlanger — Kenton Lane Road 100': 'Erlanger — Kenton Lane Road 100',
    'Florence — Industrial Road': 'Florence — Industrial Road',
    'Franklin — Washington Way': 'Franklin — Washington Way',
    'Georgetown — Triport Road': 'Georgetown — Triport Road',
    'Louisville — Intermodal Drive': 'Louisville — Intermodal Drive',
    'Sparta — Johnson Road': 'Sparta — Johnson Road',
  };
  
  return locationMap[raw] || null;
}

// Export singleton instance
export const sqliteStorage = new SQLiteStorage();
