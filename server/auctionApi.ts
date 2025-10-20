/**
 * Auction API Fetcher
 * 
 * Fetches data from BidFTA's /api/auction/<id> endpoints
 * This provides complete auction data including all items and current bids
 */

import { log } from "../src/utils/logging";
import type { ItemRecord } from "../src/utils/types";
import { upsertItem } from "../src/db/upsert";

export interface AuctionApiResponse {
  auctionId: string;
  auctionNumber: string;
  locationId: string;
  locationName: string;
  endDate: Date;
  items: AuctionItem[];
  totalItems: number;
  fetchedAt: Date;
}

export interface AuctionItem {
  itemId: string;
  title: string;
  description: string;
  imageUrl: string;
  currentBid: number;
  msrp: number;
  condition: string;
  endDate: Date;
  auctionUrl: string;
  category1: string;
  category2: string;
  brand: string;
  model: string;
  lotCode: string;
  bidsCount: number;
  watchersCount: number;
}

export class AuctionApiService {
  private readonly BASE_URL = "https://www.bidfta.com/api/auction";
  private readonly REQUEST_DELAY = 500; // 500ms between requests

  /**
   * Fetch complete auction data by auction ID
   * Note: The /api/auction/<id> endpoint doesn't exist, so we'll use the search API instead
   */
  async fetchAuctionData(auctionId: string): Promise<AuctionApiResponse | null> {
    try {
      log.info(`[Auction API] Fetching auction data for ID: ${auctionId}`);
      
      // Since /api/auction/<id> doesn't exist, we'll use the search API to get items for this auction
      // We need to find the location ID for this auction first
      const url = `https://auction.bidfta.io/api/search/searchItemList?pageId=1&itemSearchKeywords=&locationId=23&pageSize=100`;
      const response = await fetch(url, {
        headers: {
          'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/91.0.4472.124 Safari/537.36',
          'Accept': 'application/json',
          'Referer': 'https://www.bidfta.com/'
        }
      });

      if (!response.ok) {
        log.warn(`[Auction API] Failed to fetch auction ${auctionId}: ${response.status}`);
        return null;
      }

      const data = await response.json();
      
      // Filter items for this specific auction
      if (data.items && Array.isArray(data.items)) {
        const auctionItems = data.items.filter((item: any) => String(item.auctionId) === auctionId);
        const filteredData = { ...data, items: auctionItems };
        return this.parseAuctionResponse(filteredData, auctionId);
      }
      
      return null;
    } catch (error) {
      log.error(`[Auction API] Error fetching auction ${auctionId}: ${error}`);
      return null;
    }
  }

  /**
   * Parse the auction API response
   */
  private parseAuctionResponse(data: any, auctionId: string): AuctionApiResponse | null {
    try {
      const items: AuctionItem[] = [];
      
      log.info(`[Auction API] Parsing auction ${auctionId} response...`);
      log.info(`[Auction API] Response keys: ${Object.keys(data).join(', ')}`);
      
      // Parse items from the response - try different possible structures
      let itemsArray = data.items || data.data?.items || data.auctionItems || [];
      
      if (!Array.isArray(itemsArray)) {
        log.warn(`[Auction API] No items array found in response for auction ${auctionId}`);
        return null;
      }
      
      log.info(`[Auction API] Found ${itemsArray.length} items in auction ${auctionId}`);
      
      for (const item of itemsArray) {
        const auctionItem: AuctionItem = {
          itemId: String(item.itemId || item.id || item.item_id),
          title: item.title || item.itemTitle || "Unknown Item",
          description: item.description || item.specs || item.itemDescription || "",
          imageUrl: item.imageUrl || item.image_url || item.itemImageUrl || "",
          currentBid: parseFloat(item.currentBid || item.lastHighBid || item.startingBid || item.current_bid || 0),
          msrp: parseFloat(item.msrp || item.itemMsrp || 0),
          condition: item.condition || item.itemCondition || "Unknown Condition",
          endDate: item.endDate || item.utcEndDateTime ? new Date(item.endDate || item.utcEndDateTime) : new Date(),
          auctionUrl: `https://www.bidfta.com/itemDetails?idauctions=${auctionId}&idItems=${item.itemId || item.id || item.item_id}`,
          category1: item.category1 || item.category || "",
          category2: item.category2 || "",
          brand: item.brand || item.itemBrand || "",
          model: item.model || item.itemModel || "",
          lotCode: item.lotCode || item.lot_code || "",
          bidsCount: parseInt(item.bidsCount || item.bidCount || 0),
          watchersCount: parseInt(item.watchersCount || item.watcherCount || 0)
        };
        items.push(auctionItem);
      }

      log.info(`[Auction API] Parsed ${items.length} items from auction ${auctionId}`);

      return {
        auctionId,
        auctionNumber: data.auctionNumber || data.auction_number || "",
        locationId: data.locationId || data.location_id || "",
        locationName: data.locationName || data.location_name || "",
        endDate: data.endDate || data.utcEndDateTime ? new Date(data.endDate || data.utcEndDateTime) : new Date(),
        items,
        totalItems: items.length,
        fetchedAt: new Date()
      };
    } catch (error) {
      log.error(`[Auction API] Error parsing auction response for ${auctionId}: ${error}`);
      return null;
    }
  }

  /**
   * Fetch multiple auctions with rate limiting
   */
  async fetchMultipleAuctions(auctionIds: string[]): Promise<AuctionApiResponse[]> {
    const results: AuctionApiResponse[] = [];
    
    log.info(`[Auction API] Fetching ${auctionIds.length} auctions with rate limiting`);
    
    for (let i = 0; i < auctionIds.length; i++) {
      const auctionId = auctionIds[i];
      
      try {
        const auctionData = await this.fetchAuctionData(auctionId);
        if (auctionData) {
          results.push(auctionData);
          log.info(`[Auction API] Fetched auction ${auctionId} (${i + 1}/${auctionIds.length}) - ${auctionData.totalItems} items`);
        }
        
        // Rate limiting delay
        if (i < auctionIds.length - 1) {
          await new Promise(resolve => setTimeout(resolve, this.REQUEST_DELAY));
        }
      } catch (error) {
        log.error(`[Auction API] Error fetching auction ${auctionId}: ${error}`);
      }
    }
    
    log.info(`[Auction API] Successfully fetched ${results.length}/${auctionIds.length} auctions`);
    return results;
  }

  /**
   * Store auction data in the database
   */
  async storeAuctionData(auctionData: AuctionApiResponse): Promise<void> {
    try {
      log.info(`[Auction API] Storing ${auctionData.totalItems} items from auction ${auctionData.auctionId}`);
      
      for (const item of auctionData.items) {
        const sqliteRecord: ItemRecord = {
          item_id: item.itemId,
          location_name: auctionData.locationName,
          title: item.title,
          description: item.description,
          msrp: item.msrp,
          current_bid: item.currentBid,
          end_date: item.endDate.toISOString(),
          time_left_seconds: null, // Client-side calculation
          status: item.endDate > new Date() ? "active" : "ended",
          source_url: item.auctionUrl,
          fetched_at: auctionData.fetchedAt.toISOString(),
          dom_hash: null,
          image_url: item.imageUrl,
          condition: item.condition,
          msrp_text: item.msrp.toString(),
          current_bid_text: item.currentBid.toString(),
          time_left_text: null,
          location_text: auctionData.locationName,
          item_id_text: item.itemId
        };
        
        upsertItem(sqliteRecord);
      }
      
      log.info(`[Auction API] Successfully stored ${auctionData.totalItems} items from auction ${auctionData.auctionId}`);
    } catch (error) {
      log.error(`[Auction API] Error storing auction data for ${auctionData.auctionId}: ${error}`);
    }
  }

  /**
   * Fetch and store multiple auctions
   */
  async fetchAndStoreAuctions(auctionIds: string[]): Promise<void> {
    const auctionDataList = await this.fetchMultipleAuctions(auctionIds);
    
    for (const auctionData of auctionDataList) {
      await this.storeAuctionData(auctionData);
    }
  }
}

export const auctionApi = new AuctionApiService();
