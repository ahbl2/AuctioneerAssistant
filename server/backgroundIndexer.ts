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
  private readonly INDEX_INTERVAL_MS = 5 * 60 * 1000; // 5 minutes
  private readonly DISCOVERY_INTERVAL_MS = 6 * 60 * 60 * 1000; // 6 hours
  private lastDiscovery: Date | null = null;
  private discoveredAuctions: Map<string, string[]> = new Map(); // location -> auctionIds

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

    // Run initial discovery and indexing
    this.runDiscoveryAndIndexing();

    // Set up periodic indexing
    this.intervalId = setInterval(() => {
      this.runIndexing();
    }, this.INDEX_INTERVAL_MS);
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

      // Index all discovered auctions
      await this.indexAllAuctions();
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
   * Index all discovered auctions
   */
  private async indexAllAuctions(): Promise<void> {
    log.info("[Background Indexer] Starting auction indexing...");
    
    let totalItemsProcessed = 0;
    let totalItemsChanged = 0;

    for (const [locationName, auctionIds] of Array.from(this.discoveredAuctions.entries())) {
      try {
        const locationId = this.TARGET_LOCATIONS[locationName];
        if (!locationId) continue;

        // Fetch items for this location
        const items = await searchBidftaMultiPage("", [locationId], 20); // 20 pages per location
        
        for (const item of items) {
          const processed = await this.processItem(item, locationName);
          totalItemsProcessed++;
          if (processed) {
            totalItemsChanged++;
          }
        }

        log.info(`[Background Indexer] Processed ${items.length} items for ${locationName}`);
        
        // Small delay between locations
        await new Promise(resolve => setTimeout(resolve, 2000));
      } catch (error) {
        log.error(`[Background Indexer] Error indexing ${locationName}: ${error}`);
      }
    }

    log.info(`[Background Indexer] Indexing completed. Processed ${totalItemsProcessed} items, ${totalItemsChanged} changed`);
  }

  /**
   * Process a single item and update the database
   */
  private async processItem(item: any, locationName: string): Promise<boolean> {
    try {
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
        msrp_text: item.msrp || null,
        current_bid_text: item.currentPrice || null,
        time_left_text: item.timeLeft || null,
        location_text: locationName,
        item_id_text: item.id || item.itemId || item.item_id || null
      };

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
