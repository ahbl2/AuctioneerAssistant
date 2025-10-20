/**
 * Auction Discovery Service
 * 
 * Discovers active auction IDs per location by scraping the main auction listings.
 * This runs daily to get the current list of active auctions.
 */

import { log } from "../src/utils/logging";

export interface AuctionInfo {
  auctionId: string;
  locationId: string;
  locationName: string;
  auctionNumber: string;
  endDate: Date;
  itemCount: number;
  lastUpdated: Date;
}

export class AuctionDiscoveryService {
  private discoveredAuctions: Map<string, AuctionInfo> = new Map();
  private lastDiscovery: Date | null = null;
  private isDiscovering: boolean = false;

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
   * Discover all active auctions for all target locations
   */
  async discoverAllAuctions(): Promise<AuctionInfo[]> {
    if (this.isDiscovering) {
      log.warn("[Auction Discovery] Already discovering, skipping this cycle");
      return Array.from(this.discoveredAuctions.values());
    }

    this.isDiscovering = true;
    log.info("[Auction Discovery] Starting daily auction discovery...");

    try {
      const allAuctions: AuctionInfo[] = [];

      for (const [locationName, locationId] of Object.entries(this.TARGET_LOCATIONS)) {
        log.info(`[Auction Discovery] Discovering auctions for ${locationName} (ID: ${locationId})`);
        
        const auctions = await this.discoverAuctionsForLocation(locationId, locationName);
        allAuctions.push(...auctions);
        
        // Small delay between locations to be respectful
        await new Promise(resolve => setTimeout(resolve, 1000));
      }

      // Update our cache
      this.discoveredAuctions.clear();
      for (const auction of allAuctions) {
        this.discoveredAuctions.set(auction.auctionId, auction);
      }

      this.lastDiscovery = new Date();
      log.info(`[Auction Discovery] Discovered ${allAuctions.length} active auctions across all locations`);
      
      return allAuctions;
    } catch (error) {
      log.error(`[Auction Discovery] Error during discovery: ${error}`);
      return Array.from(this.discoveredAuctions.values());
    } finally {
      this.isDiscovering = false;
    }
  }

  /**
   * Discover active auctions for a specific location
   */
  private async discoverAuctionsForLocation(locationId: string, locationName: string): Promise<AuctionInfo[]> {
    try {
      // Use the items search API to find active auctions
      // This is more reliable than trying to find a dedicated auctions page
      const url = `https://auction.bidfta.io/api/search/searchItemList?pageId=1&itemSearchKeywords=&locationId=${locationId}&pageSize=24`;
      const response = await fetch(url, {
        headers: {
          'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/91.0.4472.124 Safari/537.36',
          'Accept': 'application/json',
          'Referer': 'https://www.bidfta.com/'
        }
      });

      if (!response.ok) {
        log.warn(`[Auction Discovery] Failed to fetch items for ${locationName}: ${response.status}`);
        return [];
      }

      const data = await response.json();
      return this.parseAuctionsFromAPI(data, locationId, locationName);
    } catch (error) {
      log.error(`[Auction Discovery] Error discovering auctions for ${locationName}: ${error}`);
      return [];
    }
  }

  /**
   * Parse auction information from API response
   */
  private parseAuctionsFromAPI(data: any, locationId: string, locationName: string): AuctionInfo[] {
    const auctions: AuctionInfo[] = [];
    const auctionMap = new Map<string, AuctionInfo>();

    try {
      if (data.items && Array.isArray(data.items)) {
        for (const item of data.items) {
          const auctionId = String(item.auctionId || item.auction_id);
          const auctionNumber = item.auctionNumber || item.auction_number || "";
          const endDateStr = item.utcEndDateTime || item.endDate || item.end_date;
          
          if (auctionId && endDateStr) {
            try {
              const endDate = new Date(endDateStr);
              if (endDate > new Date()) { // Only include active auctions
                if (!auctionMap.has(auctionId)) {
                  auctionMap.set(auctionId, {
                    auctionId,
                    locationId,
                    locationName,
                    auctionNumber,
                    endDate,
                    itemCount: 0,
                    lastUpdated: new Date()
                  });
                }
                // Increment item count
                const auction = auctionMap.get(auctionId)!;
                auction.itemCount++;
              }
            } catch (dateError) {
              log.warn(`[Auction Discovery] Invalid date for auction ${auctionId}: ${endDateStr}`);
            }
          }
        }
      }

      auctions.push(...auctionMap.values());
      log.info(`[Auction Discovery] Found ${auctions.length} active auctions for ${locationName} with ${data.items?.length || 0} total items`);
      return auctions;
    } catch (error) {
      log.error(`[Auction Discovery] Error parsing auctions from API: ${error}`);
      return [];
    }
  }

  /**
   * Parse auction information from HTML (legacy method)
   */
  private parseAuctionsFromHTML(html: string, locationId: string, locationName: string): AuctionInfo[] {
    const auctions: AuctionInfo[] = [];

    try {
      // Look for auction data in the HTML
      // This will depend on the actual structure of BidFTA's auction listings page
      const auctionRegex = /"auctionId":\s*(\d+)[^}]*?"auctionNumber":\s*"([^"]+)"[^}]*?"endDate":\s*"([^"]+)"/g;
      
      let match;
      while ((match = auctionRegex.exec(html)) !== null) {
        const auctionId = match[1];
        const auctionNumber = match[2];
        const endDateStr = match[3];
        
        try {
          const endDate = new Date(endDateStr);
          if (endDate > new Date()) { // Only include active auctions
            auctions.push({
              auctionId,
              locationId,
              locationName,
              auctionNumber,
              endDate,
              itemCount: 0, // Will be updated when we fetch the auction details
              lastUpdated: new Date()
            });
          }
        } catch (dateError) {
          log.warn(`[Auction Discovery] Invalid date for auction ${auctionId}: ${endDateStr}`);
        }
      }

      log.info(`[Auction Discovery] Found ${auctions.length} active auctions for ${locationName}`);
      return auctions;
    } catch (error) {
      log.error(`[Auction Discovery] Error parsing auctions from HTML: ${error}`);
      return [];
    }
  }

  /**
   * Get all discovered auctions
   */
  getDiscoveredAuctions(): AuctionInfo[] {
    return Array.from(this.discoveredAuctions.values());
  }

  /**
   * Get auctions for a specific location
   */
  getAuctionsForLocation(locationId: string): AuctionInfo[] {
    return Array.from(this.discoveredAuctions.values())
      .filter(auction => auction.locationId === locationId);
  }

  /**
   * Get active auctions (not ended)
   */
  getActiveAuctions(): AuctionInfo[] {
    const now = new Date();
    return Array.from(this.discoveredAuctions.values())
      .filter(auction => auction.endDate > now);
  }

  /**
   * Check if discovery is needed (runs daily)
   */
  isDiscoveryNeeded(): boolean {
    if (!this.lastDiscovery) return true;
    
    const hoursSinceLastDiscovery = (Date.now() - this.lastDiscovery.getTime()) / (1000 * 60 * 60);
    return hoursSinceLastDiscovery >= 24; // Run daily
  }

  /**
   * Get discovery status
   */
  getDiscoveryStatus() {
    return {
      totalAuctions: this.discoveredAuctions.size,
      lastDiscovery: this.lastDiscovery,
      isDiscovering: this.isDiscovering,
      needsDiscovery: this.isDiscoveryNeeded()
    };
  }
}

export const auctionDiscovery = new AuctionDiscoveryService();
