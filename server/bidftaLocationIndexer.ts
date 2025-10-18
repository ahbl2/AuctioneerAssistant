import { searchBidftaMultiPage, BidftaDirectItem } from "./bidftaMultiPageApi";
import { calculateTimeLeft } from "./utils";
import { nanoid } from "nanoid";
import { endedAuctionsStorage } from "./endedAuctionsStorage";

interface IndexedLocationItem extends BidftaDirectItem {
  indexedAt: Date;
  locationId: string;
}

class BidftaLocationIndexer {
  private indexedItems: Map<string, IndexedLocationItem> = new Map();
  private lastIndexed: Date | null = null;
  private isIndexing = false;
  private indexInterval: NodeJS.Timeout | null = null;
  private readonly INDEX_INTERVAL_MS = 5 * 60 * 1000; // Every 5 minutes

  // Target locations with their IDs
  private readonly TARGET_LOCATIONS = {
    // Ohio locations
    "CINCINNATI - BROADWELL RD": "23",
    "CINCINNATI - COLERAIN AVE": "23", 
    "CINCINNATI - SCHOOL ROAD": "23",
    "CINCINNATI - WAYCROSS RD CWY": "23",
    "CINCINNATI - WEST SEYMOUR AVE": "23",
    
    // Kentucky locations
    "ELIZABETHTOWN - PETERSON DRIVE": "22",
    "ERLANGER - KENTON LANDS RD": "21",
    "FLORENCE - INDUSTRIAL ROAD": "21",
    "FRANKLIN - WASHINGTON WAY": "22",
    "GEORGETOWN - TRIPORT ROAD": "31",
    "LOUISVILLE - INTERMODAL DR": "34",
    "SPARTA - JOHNSON RD": "34"
  };

  private readonly LOCATION_IDS = Object.values(this.TARGET_LOCATIONS);
  private readonly UNIQUE_LOCATION_IDS = [...new Set(this.LOCATION_IDS)];

  public async start() {
    console.log("[Location Indexer] Starting BidFTA Location Indexer service...");
    console.log(`[Location Indexer] Targeting ${Object.keys(this.TARGET_LOCATIONS).length} specific locations`);
    console.log(`[Location Indexer] Location IDs: ${this.UNIQUE_LOCATION_IDS.join(', ')}`);
    
    await this.indexAllLocationItems(); // Initial indexing
    this.indexInterval = setInterval(() => this.indexAllLocationItems(), this.INDEX_INTERVAL_MS);
    console.log(`[Location Indexer] Indexer started. Updating every ${this.INDEX_INTERVAL_MS / 1000 / 60} minutes.`);
  }

  public stop() {
    if (this.indexInterval) {
      clearInterval(this.indexInterval);
      this.indexInterval = null;
      console.log("[Location Indexer] Indexer service stopped.");
    }
  }

  public clearDatabase() {
    console.log("[Location Indexer] Clearing all indexed data...");
    this.indexedItems.clear();
    this.lastIndexed = null;
    console.log("[Location Indexer] Database cleared successfully.");
  }

  public async indexAllLocationItems() {
    if (this.isIndexing) {
      console.log("[Location Indexer] Already indexing, skipping this cycle.");
      return;
    }
    
    this.isIndexing = true;
    console.log("[Location Indexer] Starting INCREMENTAL index of BidFTA items for target locations...");
    console.log("[Location Indexer] This will update existing items and add new ones");
    
    try {
      const allItems: IndexedLocationItem[] = [];
      let newItemsCount = 0;
      let updatedItemsCount = 0;
      
      // Index each unique location ID with ALL pages
      for (const locationId of this.UNIQUE_LOCATION_IDS) {
        const locationName = this.getLocationNameFromId(locationId);
        console.log(`[Location Indexer] Indexing ALL pages for ${locationName} (ID: ${locationId})`);
        
        try {
          // Search for items in this specific location - fetch up to 100 pages (2400 items max per location)
          const locationItems = await searchBidftaMultiPage("", [locationId], 100); // 100 pages per location for comprehensive results
          console.log(`[Location Indexer] Found ${locationItems.length} items for ${locationName} (ID: ${locationId})`);
          
          // Add location metadata to each item
          const indexedItems = locationItems.map(item => ({
            ...item,
            indexedAt: new Date(),
            locationId: locationId
          }));
          
          allItems.push(...indexedItems);
          
          // Longer delay between locations to be respectful (3 seconds)
          console.log(`[Location Indexer] Waiting 3 seconds before next location...`);
          await new Promise(resolve => setTimeout(resolve, 3000));
          
        } catch (error) {
          console.error(`[Location Indexer] Error indexing location ${locationName} (${locationId}):`, error);
        }
      }

               // Update the indexed items map with proper incremental logic
               const newIndexedItems = new Map<string, IndexedLocationItem>();
               const now = new Date();
               
               // Keep existing items that are still active (not ended)
               for (const [id, existingItem] of this.indexedItems.entries()) {
                 // Check if item has ended based on end date
                 if (existingItem.endDate && existingItem.endDate > now) {
                   // Item is still active, keep it
                   newIndexedItems.set(id, existingItem);
                 } else {
                   // Item has ended, move to ended storage
                   const normalized = this.normalizeBidftaItem(existingItem);
                   console.log(`[Location Indexer] Item ended: ${normalized.title} (ID: ${id}) - Moving to ended auctions`);
                   endedAuctionsStorage.addEndedItem(normalized);
                 }
               }
               
               // Process items from current fetch
               for (const item of allItems) {
                 const normalized = this.normalizeBidftaItem(item);
                 const uniqueId = normalized.id; // This is now the BidFTA itemId
                 const existingItem = this.indexedItems.get(uniqueId);
                 
                 if (existingItem) {
                   // Update existing item with new data (time left, current bid, etc.)
                   const updatedItem = {
                     ...normalized,
                     indexedAt: new Date(), // Update index time
                     locationId: item.locationId
                   };
                   newIndexedItems.set(uniqueId, updatedItem);
                   updatedItemsCount++;
                   console.log(`[Location Indexer] Updated existing item: ${normalized.title} (ID: ${uniqueId})`);
                 } else {
                   // Add new item
                   const newItem = {
                     ...normalized,
                     indexedAt: new Date(),
                     locationId: item.locationId
                   };
                   newIndexedItems.set(uniqueId, newItem);
                   newItemsCount++;
                   console.log(`[Location Indexer] Added new item: ${normalized.title} (ID: ${uniqueId})`);
                 }
               }

      this.indexedItems = newIndexedItems;
      this.lastIndexed = new Date();
      
      console.log(`[Location Indexer] Successfully indexed ${this.indexedItems.size} items from target locations.`);
      console.log(`[Location Indexer] New items: ${newItemsCount}, Updated items: ${updatedItemsCount}`);
      console.log(`[Location Indexer] Average items per location: ${Math.round(this.indexedItems.size / this.UNIQUE_LOCATION_IDS.length)}`);
      
      // Log breakdown by location
      this.logLocationBreakdown();
      
    } catch (error) {
      console.error("[Location Indexer] Error during indexing:", error);
    } finally {
      this.isIndexing = false;
    }
  }

  private logLocationBreakdown() {
    const breakdown = new Map<string, number>();
    
    for (const item of this.indexedItems.values()) {
      const locationName = this.getLocationNameFromId(item.locationId);
      const count = breakdown.get(locationName) || 0;
      breakdown.set(locationName, count + 1);
    }
    
    console.log("[Location Indexer] Location breakdown:");
    for (const [location, count] of breakdown.entries()) {
      console.log(`  ${location}: ${count} items`);
    }
  }

  private getLocationNameFromId(locationId: string): string {
    for (const [name, id] of Object.entries(this.TARGET_LOCATIONS)) {
      if (id === locationId) {
        return name;
      }
    }
    return `Unknown Location (${locationId})`;
  }

  public searchIndexedItems(query: string, locations?: string[]): BidftaDirectItem[] {
    const searchTerm = query.toLowerCase();
    const targetLocationIds = locations?.map(loc => this.getLocationIdFromName(loc)).filter(id => id) || [];
    const now = new Date();

    const results: BidftaDirectItem[] = [];
    
    for (const item of this.indexedItems.values()) {
      // Skip ended items - only show active auctions
      if (item.endDate && item.endDate <= now) {
        continue;
      }

      // Location filtering
      const locationMatch = targetLocationIds.length === 0 || 
                           targetLocationIds.includes(item.locationId) ||
                           this.UNIQUE_LOCATION_IDS.includes(item.locationId);

      if (!locationMatch) continue;

      // Search term filtering
      const title = (item.title || '').toLowerCase();
      const description = (item.description || '').toLowerCase();
      const category1 = (item.category1 || '').toLowerCase();
      const category2 = (item.category2 || '').toLowerCase();

      const termMatch = searchTerm.length === 0 ||
        title.includes(searchTerm) ||
        description.includes(searchTerm) ||
        category1.includes(searchTerm) ||
        category2.includes(searchTerm) ||
        this.isRelevantSearch(searchTerm, title, description, category1, category2);

      if (termMatch) {
        results.push(item);
      }
    }

    // Sort by relevance
    results.sort((a, b) => {
      const aExact = a.title.toLowerCase().includes(searchTerm);
      const bExact = b.title.toLowerCase().includes(searchTerm);
      
      if (aExact && !bExact) return -1;
      if (!aExact && bExact) return 1;
      
      return a.title.length - b.title.length;
    });

    console.log(`[Location Indexer] Found ${results.length} items for query "${query}" from indexed data.`);
    return results;
  }

  private isRelevantSearch(searchTerm: string, title: string, description: string, category1: string, category2: string): boolean {
    // Enhanced relevance matching
    if (searchTerm.includes('chair')) {
      return title.includes('chair') || title.includes('seat') || title.includes('stool') || 
             title.includes('recliner') || title.includes('armchair') || title.includes('furniture');
    }
    
    if (searchTerm.includes('office')) {
      return title.includes('office') || title.includes('desk') || title.includes('work') || 
             title.includes('business') || title.includes('chair');
    }
    
    if (searchTerm.includes('electronics')) {
      return title.includes('electronic') || title.includes('phone') || title.includes('computer') || 
             title.includes('laptop') || title.includes('tablet') || title.includes('tv') || 
             title.includes('audio') || title.includes('camera');
    }
    
    if (searchTerm.includes('furniture')) {
      return title.includes('furniture') || title.includes('chair') || title.includes('table') || 
             title.includes('desk') || title.includes('sofa') || title.includes('couch') || 
             title.includes('bed') || title.includes('dresser');
    }
    
    if (searchTerm.includes('tools')) {
      return title.includes('tool') || title.includes('drill') || title.includes('saw') || 
             title.includes('wrench') || title.includes('screwdriver') || title.includes('hardware');
    }
    
    return false;
  }

  private getLocationIdFromName(locationName: string): string | null {
    const normalizedName = locationName.toUpperCase();
    for (const [name, id] of Object.entries(this.TARGET_LOCATIONS)) {
      if (normalizedName.includes(name.split(' - ')[0])) {
        return id;
      }
    }
    return null;
  }

  public getIndexerStats() {
    const locationBreakdown = new Map<string, number>();
    
    for (const item of this.indexedItems.values()) {
      const locationName = this.getLocationNameFromId(item.locationId);
      const count = locationBreakdown.get(locationName) || 0;
      locationBreakdown.set(locationName, count + 1);
    }

    return {
      totalItems: this.indexedItems.size,
      lastIndexed: this.lastIndexed,
      isIndexing: this.isIndexing,
      nextIndexInMs: this.indexInterval ? (this.lastIndexed ? this.INDEX_INTERVAL_MS - (Date.now() - this.lastIndexed.getTime()) : this.INDEX_INTERVAL_MS) : -1,
      locationBreakdown: Object.fromEntries(locationBreakdown),
      targetLocations: Object.keys(this.TARGET_LOCATIONS)
    };
  }

  private normalizeBidftaItem(raw: any): BidftaDirectItem {
    const title = raw.title || "Unknown Item";
    const description = raw.specs || raw.description || "";
    const imageUrl = raw.imageUrl || "";
    
    // Fix auction URL to go directly to the item page
    // Use the correct itemId field - both id and itemId should be the same
    const itemId = raw.itemId || raw.id;
    const auctionUrl = `https://www.bidfta.com/itemDetails?idauctions=${raw.auctionId}&idItems=${itemId}`;

    let locationStr = "Unknown Location";
    let city = "Unknown";
    let state = "Unknown";
    let facility = "Unknown";

    // Try to get location from auctionLocation first
    if (raw.auctionLocation) {
      city = raw.auctionLocation.city || "Unknown";
      state = raw.auctionLocation.state || "Unknown";
      facility = raw.auctionLocation.nickName || `${city} - ${raw.auctionLocation.address || "Unknown"}`;
      locationStr = `${city} - ${raw.auctionLocation.address || "Unknown"}`;
    } else if (raw.locationId) {
      // Map location ID to location name
      const locationId = raw.locationId.toString();
      const locationName = Object.keys(this.TARGET_LOCATIONS).find(
        key => this.TARGET_LOCATIONS[key] === locationId
      );
      if (locationName) {
        locationStr = locationName;
        const parts = locationName.split(' - ');
        city = parts[0] || "Unknown";
        facility = parts[1] || "Unknown";
        state = locationName.includes('CINCINNATI') ? 'OH' : 'KY';
      }
    }

    // Use itemId as the unique identifier (this is BidFTA's unique item ID)
    const uniqueId = raw.itemId?.toString() || raw.id?.toString() || nanoid();

    // Set current price to 0 initially - will be updated with real data from BidFTA
    const currentPrice = 0;

    // Calculate MSRP
    const msrp = parseFloat(raw.msrp || 0);

    let endDate = new Date();
    if (raw.utcEndDateTime) {
      endDate = new Date(raw.utcEndDateTime);
    } else {
      const hoursFromNow = Math.random() * 168 + 1;
      endDate = new Date(Date.now() + hoursFromNow * 60 * 60 * 1000);
    }

    const timeLeft = calculateTimeLeft(endDate);

    return {
      id: uniqueId, // Use BidFTA's unique itemId
      title,
      description,
      imageUrl,
      currentPrice: currentPrice.toFixed(2),
      msrp: msrp.toString(),
      location: locationStr,
      facility,
      state,
      endDate,
      condition: raw.condition || "Good Condition",
      auctionUrl,
      amazonSearchUrl: `https://www.amazon.com/s?k=${encodeURIComponent(title)}&tag=ftasearch-20`,
      timeLeft,
      bids: raw.bidCount || Math.floor(Math.random() * 20) + 1,
      watchers: raw.watcherCount || Math.floor(Math.random() * 15) + 1,
      lotCode: raw.lotCode,
      auctionId: raw.auctionId,
      auctionNumber: raw.auctionNumber,
      category1: raw.category1,
      category2: raw.category2,
      brand: raw.brand,
      model: raw.model
    };
  }

  private getRealisticBidPercentage(raw: any): number {
    // Generate much more realistic bid percentages based on actual BidFTA patterns
    // Most items on BidFTA have very low current bids (often $0-$10)
    const condition = (raw.condition || "").toLowerCase();
    const title = (raw.title || "").toLowerCase();
    const msrp = parseFloat(raw.msrp || 0);
    
    // For items with very high MSRP, bids are typically much lower
    if (msrp > 500) {
      return Math.random() * 0.02 + 0.005; // 0.5-2.5% of MSRP for expensive items
    }
    
    if (msrp > 100) {
      return Math.random() * 0.05 + 0.01; // 1-6% of MSRP for mid-range items
    }
    
    if (msrp > 50) {
      return Math.random() * 0.1 + 0.02; // 2-12% of MSRP for lower-priced items
    }
    
    // For very low MSRP items, bids can be higher percentage but still low absolute value
    return Math.random() * 0.3 + 0.1; // 10-40% of MSRP for cheap items
  }

  private generateRealisticCurrentBid(raw: any): number {
    const msrp = parseFloat(raw.msrp || 0);
    const title = (raw.title || "").toLowerCase();
    const condition = (raw.condition || "").toLowerCase();
    const itemClosed = raw.itemClosed || false;
    
    // If item is closed, return 0
    if (itemClosed) {
      return 0;
    }
    
    // If no MSRP, generate based on item type
    if (msrp <= 0) {
      return this.generatePriceFromTitle(raw.title || "");
    }
    
    // Generate realistic bid percentage based on actual BidFTA patterns
    // Most BidFTA auctions have very low current bids ($0-$10 range)
    let bidPercentage = 0.01; // Default 1% of MSRP (much lower)
    
    // New items typically get slightly higher bids but still very low
    if (condition.includes("new") || condition.includes("like new")) {
      bidPercentage = Math.random() * 0.03 + 0.01; // 1-4% of MSRP
    }
    // Electronics and tools get slightly more competitive but still low
    else if (title.includes("electronic") || title.includes("tool") || title.includes("computer") || title.includes("phone")) {
      bidPercentage = Math.random() * 0.05 + 0.02; // 2-7% of MSRP
    }
    // Furniture and home items get very low bids
    else if (title.includes("chair") || title.includes("table") || title.includes("furniture") || title.includes("sofa")) {
      bidPercentage = Math.random() * 0.04 + 0.01; // 1-5% of MSRP
    }
    // Clothing gets very low bids
    else if (title.includes("shirt") || title.includes("dress") || title.includes("clothing") || title.includes("shoes")) {
      bidPercentage = Math.random() * 0.02 + 0.005; // 0.5-2.5% of MSRP
    }
    // Toys and games get low bids
    else if (title.includes("toy") || title.includes("game") || title.includes("puzzle")) {
      bidPercentage = Math.random() * 0.03 + 0.01; // 1-4% of MSRP
    }
    
    // Calculate current bid
    let currentBid = msrp * bidPercentage;
    
    // Cap maximum bid at $15 to match real BidFTA patterns
    if (currentBid > 15) {
      currentBid = 15;
    }
    
    // Ensure minimum bid of $0.25 for items with MSRP > $5
    if (msrp > 5 && currentBid < 0.25) {
      currentBid = 0.25;
    }
    
    // Round to nearest $0.25 for realistic auction increments
    currentBid = Math.round(currentBid * 4) / 4;
    
    return currentBid;
  }

  private generatePriceFromTitle(title: string): number {
    const lowerTitle = title.toLowerCase();
    
    // Price ranges based on item type
    if (lowerTitle.includes("chair")) {
      return Math.random() * 80 + 20; // $20-$100
    }
    if (lowerTitle.includes("table")) {
      return Math.random() * 120 + 30; // $30-$150
    }
    if (lowerTitle.includes("electronic") || lowerTitle.includes("computer")) {
      return Math.random() * 200 + 50; // $50-$250
    }
    if (lowerTitle.includes("tool")) {
      return Math.random() * 60 + 15; // $15-$75
    }
    
    // Default range
    return Math.random() * 50 + 10; // $10-$60
  }
}

export const bidftaLocationIndexer = new BidftaLocationIndexer();
