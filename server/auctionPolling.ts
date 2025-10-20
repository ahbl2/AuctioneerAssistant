/**
 * Auction Polling Service
 * 
 * Polls known auction IDs for updates throughout the day
 * Replaces the old DOM scraping approach with targeted API calls
 */

import { auctionDiscovery, type AuctionInfo } from "./auctionDiscovery";
import { auctionApi } from "./auctionApi";
import { log } from "../src/utils/logging";

export class AuctionPollingService {
  private isPolling: boolean = false;
  private pollingInterval: NodeJS.Timeout | null = null;
  private readonly POLLING_INTERVAL_MS = 5 * 60 * 1000; // 5 minutes
  private readonly DISCOVERY_INTERVAL_MS = 24 * 60 * 60 * 1000; // 24 hours
  private lastDiscovery: Date | null = null;

  /**
   * Start the polling service
   */
  start(): void {
    if (this.isPolling) {
      log.warn("[Auction Polling] Service already running");
      return;
    }

    log.info("[Auction Polling] Starting auction polling service...");
    this.isPolling = true;

    // Run discovery immediately
    this.runDiscovery();

    // Set up polling interval
    this.pollingInterval = setInterval(() => {
      this.pollingCycle();
    }, this.POLLING_INTERVAL_MS);

    log.info(`[Auction Polling] Service started - polling every ${this.POLLING_INTERVAL_MS / 1000 / 60} minutes`);
  }

  /**
   * Stop the polling service
   */
  stop(): void {
    if (this.pollingInterval) {
      clearInterval(this.pollingInterval);
      this.pollingInterval = null;
    }
    this.isPolling = false;
    log.info("[Auction Polling] Service stopped");
  }

  /**
   * Main polling cycle
   */
  private async pollingCycle(): Promise<void> {
    try {
      log.info("[Auction Polling] Starting polling cycle...");

      // Check if we need to run discovery
      if (this.shouldRunDiscovery()) {
        await this.runDiscovery();
      }

      // Poll active auctions
      await this.pollActiveAuctions();

      log.info("[Auction Polling] Polling cycle completed");
    } catch (error) {
      log.error(`[Auction Polling] Error in polling cycle: ${error}`);
    }
  }

  /**
   * Check if discovery should run
   */
  private shouldRunDiscovery(): boolean {
    if (!this.lastDiscovery) return true;
    
    const hoursSinceLastDiscovery = (Date.now() - this.lastDiscovery.getTime()) / (1000 * 60 * 60);
    return hoursSinceLastDiscovery >= 24; // Run daily
  }

  /**
   * Run auction discovery
   */
  private async runDiscovery(): Promise<void> {
    try {
      log.info("[Auction Polling] Running auction discovery...");
      
      const discoveredAuctions = await auctionDiscovery.discoverAllAuctions();
      this.lastDiscovery = new Date();
      
      log.info(`[Auction Polling] Discovery completed - found ${discoveredAuctions.length} auctions`);
    } catch (error) {
      log.error(`[Auction Polling] Error during discovery: ${error}`);
    }
  }

  /**
   * Poll all active auctions
   */
  private async pollActiveAuctions(): Promise<void> {
    try {
      const activeAuctions = auctionDiscovery.getActiveAuctions();
      
      if (activeAuctions.length === 0) {
        log.info("[Auction Polling] No active auctions to poll");
        return;
      }

      log.info(`[Auction Polling] Polling ${activeAuctions.length} active auctions...`);
      
      // Get auction IDs
      const auctionIds = activeAuctions.map(auction => auction.auctionId);
      
      // Fetch and store auction data
      await auctionApi.fetchAndStoreAuctions(auctionIds);
      
      log.info(`[Auction Polling] Completed polling ${activeAuctions.length} auctions`);
    } catch (error) {
      log.error(`[Auction Polling] Error polling active auctions: ${error}`);
    }
  }

  /**
   * Get polling status
   */
  getStatus() {
    const discoveryStatus = auctionDiscovery.getDiscoveryStatus();
    
    return {
      isPolling: this.isPolling,
      lastDiscovery: this.lastDiscovery,
      pollingIntervalMs: this.POLLING_INTERVAL_MS,
      discoveryIntervalMs: this.DISCOVERY_INTERVAL_MS,
      discoveredAuctions: discoveryStatus.totalAuctions,
      activeAuctions: auctionDiscovery.getActiveAuctions().length,
      needsDiscovery: discoveryStatus.needsDiscovery
    };
  }

  /**
   * Force a discovery run
   */
  async forceDiscovery(): Promise<void> {
    log.info("[Auction Polling] Forcing discovery run...");
    await this.runDiscovery();
  }

  /**
   * Force a polling run
   */
  async forcePolling(): Promise<void> {
    log.info("[Auction Polling] Forcing polling run...");
    await this.pollActiveAuctions();
  }
}

export const auctionPolling = new AuctionPollingService();
