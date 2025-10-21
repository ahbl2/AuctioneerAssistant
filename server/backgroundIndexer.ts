/**
 * Background Indexer
 * 
 * Implements the speed improvement plan by doing all network fetching
 * in the background and populating the SQLite database for instant searches.
 */

import { sqliteStorage, type ItemRecord, hashDom, parseMoney, parseTimeLeftToSeconds, mapLocation } from './sqliteStorage';
import { searchBidftaMultiPage } from './bidftaMultiPageApi';
import { log } from '../src/utils/logging';

export class BackgroundIndexer {
  private isRunning: boolean = false;
  private intervalId: NodeJS.Timeout | null = null;
  private readonly INDEX_INTERVAL_MS = 5 * 60 * 1000; // 5 minutes - more frequent for urgent auctions
  private readonly DISCOVERY_INTERVAL_MS = 2 * 60 * 60 * 1000; // 2 hours - more frequent discovery
  private readonly URGENT_TIME_LIMIT_MS = 6 * 60 * 60 * 1000; // 6 hours - only index auctions ending soon
  private lastDiscovery: Date | null = null;
  private discoveredAuctions: Map<string, string[]> = new Map(); // location -> auctionIds
  private isIndexing: boolean = false;

  // Target locations with their IDs
  private readonly TARGET_LOCATIONS: { [key: string]: string } = {
    "Cincinnati — Broadwell Road": "23",
    "Cincinnati — Colerain Avenue": "22", 
    "Cincinnati — School Road": "21",
    "Cincinnati — Waycross Road": "31",
    "Cincinnati — West Seymour Avenue": "34",
    "Elizabethtown — Peterson Drive": "24",
    "Erlanger — Kenton Lane Road 100": "25",
    "Florence — Industrial Road": "26",
    "Franklin — Washington Way": "27",
    "Georgetown — Triport Road": "28",
    "Louisville — Intermodal Drive": "29",
    "Sparta — Johnson Road": "30",
  };

  /**
   * Start the background indexer
   */
  start(): void {
    if (this.isRunning) {
      log.warn("[Background Indexer] Already running");
      return;
    }

    log.info("[Background Indexer] Starting background indexer...");
    this.isRunning = true;

    // Set up periodic indexing (delayed start)
    this.intervalId = setInterval(() => {
      this.runIndexing();
    }, this.INDEX_INTERVAL_MS);

    // Run initial discovery and indexing after a delay to let server start
    setTimeout(() => {
      this.runDiscoveryAndIndexing();
    }, 30000); // 30 second delay
  }

  /**
   * Stop the background indexer
   */
  stop(): void {
    if (!this.isRunning) {
      return;
    }

    log.info("[Background Indexer] Stopping background indexer...");
    this.isRunning = false;

    if (this.intervalId) {
      clearInterval(this.intervalId);
      this.intervalId = null;
    }
  }

  /**
   * Run discovery and indexing
   */
  private async runDiscoveryAndIndexing(): Promise<void> {
    try {
      await this.discoverAuctions();
      await this.runIndexing();
    } catch (error) {
      log.error(`[Background Indexer] Error in discovery and indexing: ${error}`);
    }
  }

  /**
   * Run indexing only (no discovery)
   */
  private async runIndexing(): Promise<void> {
    try {
      // Check if we need to run discovery
      const now = new Date();
      const shouldDiscover = !this.lastDiscovery || 
        (now.getTime() - this.lastDiscovery.getTime()) > this.DISCOVERY_INTERVAL_MS;

      if (shouldDiscover) {
        await this.discoverAuctions();
      }

      // Index only urgent auctions (ending within 6 hours)
      await this.indexUrgentAuctions();
    } catch (error) {
      log.error(`[Background Indexer] Error in indexing: ${error}`);
    }
  }

  /**
   * Discover active auctions for all locations
   */
  private async discoverAuctions(): Promise<void> {
    log.info("[Background Indexer] Discovering auctions...");
    this.discoveredAuctions.clear();

    for (const [locationName, locationId] of Object.entries(this.TARGET_LOCATIONS)) {
      try {
        // Use the multi-page API to discover auctions
        const items = await searchBidftaMultiPage("", [locationId], 5); // Just 5 pages for discovery
        
        // Extract unique auction IDs
        const auctionIds = new Set<string>();
        items.forEach(item => {
          if (item.auctionId) {
            auctionIds.add(item.auctionId.toString());
          }
        });

        this.discoveredAuctions.set(locationName, Array.from(auctionIds));
        log.info(`[Background Indexer] Discovered ${auctionIds.size} auctions for ${locationName}`);
        
        // Small delay between locations
        await new Promise(resolve => setTimeout(resolve, 1000));
      } catch (error) {
        log.error(`[Background Indexer] Error discovering auctions for ${locationName}: ${error}`);
      }
    }

    this.lastDiscovery = new Date();
    log.info(`[Background Indexer] Discovery completed. Found ${this.discoveredAuctions.size} locations with auctions`);
  }

  /**
   * Check if an auction is ending within the urgent time limit
   */
  private isUrgentAuction(endDate: string | Date | null): boolean {
    if (!endDate) return false;
    
    const now = new Date();
    const end = new Date(endDate);
    const timeLeft = end.getTime() - now.getTime();
    
    return timeLeft > 0 && timeLeft <= this.URGENT_TIME_LIMIT_MS;
  }

  /**
   * Index only urgent auctions (ending within 6 hours)
   */
  private async indexUrgentAuctions(): Promise<void> {
    log.info("[Background Indexer] Starting urgent auction indexing (6 hours or less)...");
    
    let totalItemsProcessed = 0;
    let totalItemsChanged = 0;
    let urgentAuctionsFound = 0;

    // Process locations one at a time to avoid memory issues
    for (const [locationName, auctionIds] of this.discoveredAuctions.entries()) {
      try {
        const locationId = this.TARGET_LOCATIONS[locationName];
        if (!locationId) continue;

        // Fetch items for this location
        const items = await searchBidftaMultiPage("", [locationId], 3); // Only 3 pages for urgent indexing
        
        // Filter for urgent auctions only
        const urgentItems = items.filter(item => this.isUrgentAuction(item.endDate));
        
        if (urgentItems.length > 0) {
          urgentAuctionsFound++;
          log.info(`[Background Indexer] Found ${urgentItems.length} urgent items for ${locationName}`);
          
          let processed = 0;
          let changed = 0;
          
          // Process urgent items in small batches
          const batchSize = 10;
          for (let i = 0; i < urgentItems.length; i += batchSize) {
            const batch = urgentItems.slice(i, i + batchSize);
            
            for (const item of batch) {
              const itemProcessed = await this.processItem(item, locationName);
              processed++;
              if (itemProcessed) {
                changed++;
              }
            }
            
            // Small delay between batches
            await new Promise(resolve => setTimeout(resolve, 100));
          }
          
          totalItemsProcessed += processed;
          totalItemsChanged += changed;
        } else {
          log.info(`[Background Indexer] No urgent auctions found for ${locationName}`);
        }
        
        // Delay between locations
        await new Promise(resolve => setTimeout(resolve, 2000));
      } catch (error) {
        log.error(`[Background Indexer] Error indexing urgent auctions for ${locationName}: ${error}`);
      }
    }

    log.info(`[Background Indexer] Urgent indexing completed. Found ${urgentAuctionsFound} locations with urgent auctions. Processed ${totalItemsProcessed} items, ${totalItemsChanged} changed`);
  }

  /**
   * Process a single item and update the database
   */
  private async processItem(item: any, locationName: string): Promise<boolean> {
    try {
      // Debug logging for image URL
      console.log(`[Background Indexer] Processing item ${item.id || item.itemId}: imageUrl = "${item.imageUrl}"`);
      
      // Create minimal snippet for hash calculation
      const snippet = JSON.stringify({
        id: item.id,
        title: item.title,
        currentPrice: item.currentPrice,
        endDate: item.endDate,
        auctionId: item.auctionId
      });

      const domHash = hashDom(snippet);
      
      // Check if item already exists and hasn't changed
      const existing = sqliteStorage.getItem(item.id, locationName);
      if (existing && existing.dom_hash === domHash) {
        return false; // No changes
      }

      // Normalize the item data
      const record: ItemRecord = {
        item_id: item.id || item.itemId || item.item_id || '',
        location_name: locationName,
        title: item.title || null,
        description: item.description || null,
        msrp: parseMoney(item.msrp),
        current_bid: parseMoney(item.currentPrice),
        end_date: item.endDate ? new Date(item.endDate).toISOString() : null,
        time_left_seconds: parseTimeLeftToSeconds(item.timeLeft),
        status: this.determineStatus(item),
        source_url: item.auctionUrl || `https://www.bidfta.com/itemDetails?idauctions=${item.auctionId}&idItems=${item.id}`,
        fetched_at: new Date().toISOString(),
        dom_hash: domHash,
        image_url: item.imageUrl || null,
        condition: item.condition || null,
        msrp_text: item.msrp || null,
        current_bid_text: item.currentPrice || null,
        time_left_text: item.timeLeft || null,
        location_text: locationName,
        item_id_text: item.id || item.itemId || item.item_id || null
      };

      console.log(`[Background Indexer] Storing item with image_url: "${record.image_url}"`);

      // UPSERT the item
      sqliteStorage.upsertItem(record);
      return true; // Item was changed
    } catch (error) {
      log.error(`[Background Indexer] Error processing item ${item.id}: ${error}`);
      return false;
    }
  }

  /**
   * Determine item status based on available data
   */
  private determineStatus(item: any): "active" | "ended" | "unknown" {
    if (item.endDate) {
      const endDate = new Date(item.endDate);
      const now = new Date();
      return endDate <= now ? "ended" : "active";
    }
    return "unknown";
  }

  /**
   * Get indexer statistics
   */
  getStats(): {
    isRunning: boolean;
    lastDiscovery: Date | null;
    discoveredAuctions: { [location: string]: number };
    dbStats: any;
  } {
    const discoveredAuctions: { [location: string]: number } = {};
    Array.from(this.discoveredAuctions.entries()).forEach(([location, auctionIds]) => {
      discoveredAuctions[location] = auctionIds.length;
    });

    return {
      isRunning: this.isRunning,
      lastDiscovery: this.lastDiscovery,
      discoveredAuctions,
      dbStats: sqliteStorage.getStats()
    };
  }

  /**
   * Force a discovery and indexing cycle
   */
  async forceIndex(): Promise<void> {
    log.info("[Background Indexer] Forcing discovery and indexing...");
    await this.runDiscoveryAndIndexing();
  }
}

// Export singleton instance
export const backgroundIndexer = new BackgroundIndexer();
