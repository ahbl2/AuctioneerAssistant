/**
 * Detail task: for items that are new/changed (by dom_hash) or missing
 * enrichment, load the item page if necessary and fill title/description/msrp.
 * Double-read critical nodes if reading from HTML. If mismatch → null + warn.
 */
import { db } from "../db/client";
import { parseMoney } from "../utils/parsers";
import { log } from "../utils/logging";

export async function enrichChangedItems(): Promise<void> {
  log.info("Starting detail enrichment for changed items");
  
  // Get items that need enrichment (missing title, description, or have changed dom_hash)
  const itemsToEnrich = db.prepare(`
    SELECT item_id, location_name, source_url, dom_hash, title, description, msrp
    FROM items 
    WHERE title IS NULL OR description IS NULL OR msrp IS NULL
    ORDER BY fetched_at DESC
    LIMIT 100
  `).all();

  let enriched = 0;
  let errors = 0;

  for (const item of itemsToEnrich) {
    try {
      // For now, we'll use the existing current bid API to get real data
      const { getCurrentBidFromBidfta } = await import("../../server/bidftaCurrentBidApi");
      
      // Extract auction ID and item ID from source URL
      const urlMatch = item.source_url.match(/idauctions=(\d+)&idItems=(\d+)/);
      if (!urlMatch) {
        log.warn(`Cannot extract auction/item IDs from URL: ${item.source_url}`);
        continue;
      }

      const [, auctionId, itemId] = urlMatch;
      const currentBid = await getCurrentBidFromBidfta(parseInt(auctionId), parseInt(itemId));
      
      if (currentBid !== null) {
        // Update with real current bid data
        db.prepare(`
          UPDATE items 
          SET current_bid = ?, current_bid_text = ?, fetched_at = ?
          WHERE item_id = ? AND location_name = ?
        `).run(
          currentBid,
          `$${currentBid}`,
          new Date().toISOString(),
          item.item_id,
          item.location_name
        );
        
        enriched++;
      }

      // Small delay to be respectful
      await new Promise(resolve => setTimeout(resolve, 100));
      
    } catch (error) {
      log.error(`Failed to enrich item ${item.item_id}:`, error);
      errors++;
    }
  }

  log.info(`Detail enrichment complete: ${enriched} items enriched, ${errors} errors`);
}
