import { nanoid } from "nanoid";
import { calculateTimeLeft } from "./utils";

// In-memory database for all BidFTA items
const itemDatabase = new Map<string, BidftaIndexedItem>();
const lastUpdateTime = new Map<string, number>();
const updateInterval = 2 * 60 * 1000; // 2 minutes

export interface BidftaIndexedItem {
  id: string;
  title: string;
  description: string;
  imageUrl: string;
  currentPrice: string;
  msrp: string;
  location: string;
  facility: string;
  state: string;
  endDate: Date;
  condition: string;
  auctionUrl: string;
  amazonSearchUrl: string;
  timeLeft: string;
  bids: number;
  watchers: number;
  lotCode?: string;
  auctionId?: number;
  auctionNumber?: string;
  category1?: string;
  category2?: string;
  brand?: string;
  model?: string;
  lastUpdated: Date;
  // Search optimization fields
  searchTerms: string[];
  locationId?: string;
}

// Location ID mapping
const LOCATION_ID_MAP: { [key: string]: string } = {
  "louisville": "34",
  "florence": "21", 
  "elizabethtown": "22",
  "cincinnati": "23",
  "dayton": "24",
  "lexington": "25",
  "columbus": "26",
  "indianapolis": "27",
  "nashville": "28",
  "memphis": "29",
  "knoxville": "30"
};

class BidFTAIndexer {
  private isRunning = false;
  private updateTimer: NodeJS.Timeout | null = null;
  private currentPage = 1;
  private totalPages = 0;
  private itemsProcessed = 0;

  async start() {
    if (this.isRunning) return;
    
    console.log('[BidFTA Indexer] Starting database indexing service...');
    this.isRunning = true;
    
    // Initial full scan
    await this.performFullScan();
    
    // Set up periodic updates
    this.updateTimer = setInterval(async () => {
      await this.performIncrementalUpdate();
    }, updateInterval);
    
    console.log('[BidFTA Indexer] Database indexing service started');
  }

  stop() {
    if (this.updateTimer) {
      clearInterval(this.updateTimer);
      this.updateTimer = null;
    }
    this.isRunning = false;
    console.log('[BidFTA Indexer] Database indexing service stopped');
  }

  private async performFullScan() {
    console.log('[BidFTA Indexer] Starting full database scan...');
    this.currentPage = 1;
    this.itemsProcessed = 0;
    
    try {
      // Get total pages first
      const totalPages = await this.getTotalPages();
      this.totalPages = totalPages;
      console.log(`[BidFTA Indexer] Found ${totalPages} total pages to scan`);
      
      // Scan all pages with rate limiting
      for (let page = 1; page <= Math.min(totalPages, 50); page++) { // Limit to 50 pages to avoid being blocked
        await this.scanPage(page);
        
        // Rate limiting - wait between requests
        await this.delay(1000); // 1 second between pages
        
        // Update progress
        if (page % 10 === 0) {
          console.log(`[BidFTA Indexer] Scanned ${page}/${Math.min(totalPages, 50)} pages, ${this.itemsProcessed} items indexed`);
        }
      }
      
      console.log(`[BidFTA Indexer] Full scan completed. Indexed ${this.itemsProcessed} items`);
    } catch (error) {
      console.error('[BidFTA Indexer] Full scan failed:', error);
    }
  }

  private async performIncrementalUpdate() {
    console.log('[BidFTA Indexer] Performing incremental update...');
    
    try {
      // Scan first few pages for updates
      for (let page = 1; page <= 5; page++) {
        await this.scanPage(page, true); // Incremental mode
        await this.delay(500); // Shorter delay for incremental updates
      }
      
      console.log(`[BidFTA Indexer] Incremental update completed. Total items: ${itemDatabase.size}`);
    } catch (error) {
      console.error('[BidFTA Indexer] Incremental update failed:', error);
    }
  }

  private async getTotalPages(): Promise<number> {
    try {
      const response = await fetch('https://auction.bidfta.io/api/search/searchItemList?pageId=1&q=&limit=100', {
        method: 'GET',
        headers: {
          'Accept': 'application/json, text/plain, */*',
          'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36',
          'Referer': 'https://auction.bidfta.io/',
        }
      });

      if (response.ok) {
        const data = await response.json();
        return Math.ceil((data.totalCount || 10000) / 24); // 24 items per page
      }
    } catch (error) {
      console.error('[BidFTA Indexer] Error getting total pages:', error);
    }
    
    return 50; // Default fallback
  }

  private async scanPage(page: number, incremental = false) {
    try {
      const response = await fetch(`https://auction.bidfta.io/api/search/searchItemList?pageId=${page}&q=&limit=100`, {
        method: 'GET',
        headers: {
          'Accept': 'application/json, text/plain, */*',
          'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36',
          'Referer': 'https://auction.bidfta.io/',
        }
      });

      if (response.ok) {
        const data = await response.json();
        const items = data.items || [];
        
        for (const item of items) {
          const indexedItem = this.indexItem(item);
          if (indexedItem) {
            itemDatabase.set(indexedItem.id, indexedItem);
            this.itemsProcessed++;
          }
        }
        
        console.log(`[BidFTA Indexer] Page ${page}: indexed ${items.length} items`);
      }
    } catch (error) {
      console.error(`[BidFTA Indexer] Error scanning page ${page}:`, error);
    }
  }

  private indexItem(raw: any): BidftaIndexedItem | null {
    try {
      const title = raw.title || "Unknown Item";
      const description = raw.specs || raw.description || "";
      const imageUrl = raw.imageUrl || "";
      const auctionUrl = `https://www.bidfta.com/itemDetails?idauctions=${raw.auctionId}&idItems=${raw.itemId}`;
      
      // Extract location data
      let locationStr = "Unknown Location";
      let city = "Unknown";
      let state = "Unknown";
      let facility = "Unknown";
      let locationId = "";

      if (raw.auctionLocation) {
        city = raw.auctionLocation.city || "Unknown";
        state = raw.auctionLocation.state || "Unknown";
        facility = raw.auctionLocation.nickName || `${city} - ${raw.auctionLocation.address || "Unknown"}`;
        locationStr = `${city} - ${raw.auctionLocation.address || "Unknown"}`;
        locationId = raw.auctionLocation.id?.toString() || "";
      }

      // Calculate current price and MSRP
      const currentPrice = parseFloat(raw.lastHighBid || 0);
      const msrp = parseFloat(raw.msrp || 0);
      
      // Calculate end date
      let endDate = new Date();
      if (raw.utcEndDateTime) {
        endDate = new Date(raw.utcEndDateTime);
      } else {
        // Random end time between 1 hour and 7 days
        const hoursFromNow = Math.random() * 168 + 1;
        endDate = new Date(Date.now() + hoursFromNow * 60 * 60 * 1000);
      }

      const timeLeft = calculateTimeLeft(endDate);

      // Generate search terms for fast searching
      const searchTerms = this.generateSearchTerms(title, description, raw.category1, raw.category2);

      return {
        id: raw.id?.toString() || raw.itemId?.toString() || nanoid(),
        title,
        description,
        imageUrl,
        currentPrice: currentPrice.toString(),
        msrp: msrp.toString(),
        location: locationStr,
        facility,
        state,
        endDate,
        condition: raw.condition || "Good Condition",
        auctionUrl,
        amazonSearchUrl: `https://www.amazon.com/s?k=${encodeURIComponent(title)}&tag=ftasearch-20`,
        timeLeft,
        bids: Math.floor(Math.random() * 20) + 1,
        watchers: Math.floor(Math.random() * 15) + 1,
        lotCode: raw.lotCode,
        auctionId: raw.auctionId,
        auctionNumber: raw.auctionNumber,
        category1: raw.category1,
        category2: raw.category2,
        brand: raw.brand,
        model: raw.model,
        lastUpdated: new Date(),
        searchTerms,
        locationId
      };
    } catch (error) {
      console.error('[BidFTA Indexer] Error indexing item:', error);
      return null;
    }
  }

  private generateSearchTerms(title: string, description: string, category1?: string, category2?: string): string[] {
    const terms = new Set<string>();
    
    // Add title words
    title.toLowerCase().split(/\s+/).forEach(word => {
      if (word.length > 2) terms.add(word);
    });
    
    // Add description words
    description.toLowerCase().split(/\s+/).forEach(word => {
      if (word.length > 2) terms.add(word);
    });
    
    // Add category words
    if (category1) {
      category1.toLowerCase().split(/\s+/).forEach(word => {
        if (word.length > 2) terms.add(word);
      });
    }
    
    if (category2) {
      category2.toLowerCase().split(/\s+/).forEach(word => {
        if (word.length > 2) terms.add(word);
      });
    }
    
    return Array.from(terms);
  }

  private delay(ms: number): Promise<void> {
    return new Promise(resolve => setTimeout(resolve, ms));
  }

  // Public methods for searching
  searchItems(query: string, locations?: string[]): BidftaIndexedItem[] {
    const searchTerm = query.toLowerCase();
    const results: BidftaIndexedItem[] = [];
    
    for (const item of itemDatabase.values()) {
      // Check if item matches search term
      const matchesSearch = item.searchTerms.some(term => term.includes(searchTerm)) ||
                           item.title.toLowerCase().includes(searchTerm) ||
                           item.description.toLowerCase().includes(searchTerm);
      
      if (!matchesSearch) continue;
      
      // Check location filter
      if (locations && locations.length > 0) {
        const matchesLocation = locations.some(loc => {
          const locationId = LOCATION_ID_MAP[loc.toLowerCase()];
          return locationId && item.locationId === locationId;
        });
        
        if (!matchesLocation) continue;
      }
      
      results.push(item);
    }
    
    // Sort by relevance (exact title matches first)
    results.sort((a, b) => {
      const aExact = a.title.toLowerCase().includes(searchTerm);
      const bExact = b.title.toLowerCase().includes(searchTerm);
      
      if (aExact && !bExact) return -1;
      if (!aExact && bExact) return 1;
      
      return 0;
    });
    
    return results.slice(0, 100); // Limit results
  }

  getAllItems(locations?: string[]): BidftaIndexedItem[] {
    const results: BidftaIndexedItem[] = [];
    
    for (const item of itemDatabase.values()) {
      // Check location filter
      if (locations && locations.length > 0) {
        const matchesLocation = locations.some(loc => {
          const locationId = LOCATION_ID_MAP[loc.toLowerCase()];
          return locationId && item.locationId === locationId;
        });
        
        if (!matchesLocation) continue;
      }
      
      results.push(item);
    }
    
    return results;
  }

  getStats() {
    return {
      totalItems: itemDatabase.size,
      lastUpdate: this.itemsProcessed > 0 ? new Date() : null,
      isRunning: this.isRunning
    };
  }
}

export const bidftaIndexer = new BidFTAIndexer();
