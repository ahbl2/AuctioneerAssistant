import { BidftaDirectItem } from '../shared/schema';

interface BidftaItemData {
  id: number;
  lotCode: string;
  auctionId: number;
  currentBid: number;
  quantity: number;
  initialQuantity: number;
  soldQuantity: number;
  condition: string;
  description: string;
  msrp: number;
  specs: string;
  highBidder: number;
  lotterId: string;
  loadNumber: string;
  title: string;
  nextBid: number;
  itemClosed: boolean;
  itemTimeRemaining: string;
  hoursRemaining: number;
  utcEndDateTime: string;
  removed: boolean;
  bidsCount: number;
  pictures: string[];
  pictureList: Array<{
    picUrl: string;
    mainPicture: boolean;
    lotterPicture: boolean;
  }>;
}

/**
 * Scrapes current bid data from BidFTA item detail pages
 */
export async function getCurrentBidFromBidfta(auctionId: number, itemId: number): Promise<number | null> {
  try {
    console.log(`[BidFTA Current Bid] Fetching current bid for auction ${auctionId}, item ${itemId}`);
    
    const url = `https://www.bidfta.com/itemDetails?idauctions=${auctionId}&idItems=${itemId}`;
    const response = await fetch(url, {
      headers: {
        'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/91.0.4472.124 Safari/537.36'
      }
    });

    if (!response.ok) {
      console.log(`[BidFTA Current Bid] HTTP error: ${response.status}`);
      return null;
    }

    const html = await response.text();
    
    // Look for current bid in multiple ways
    let currentBid = null;
    
    // Look for current bid in the HTML content
    // Try multiple patterns to find the current bid
    const patterns = [
      /CURRENT BID[^>]*>\s*\$([0-9]+(?:\.[0-9]{2})?)/i,
      /currentBid[^:]*:\s*([0-9.]+)/,
      /"currentBid":\s*([0-9.]+)/,
      /\$([0-9]+(?:\.[0-9]{2})?)\s*CURRENT BID/i,
      /currentBid[^:]*:\s*([0-9]+(?:\.[0-9]{2})?)/,
      /"currentBid":\s*([0-9]+(?:\.[0-9]{2})?)/
    ];
    
    for (const pattern of patterns) {
      const match = html.match(pattern);
      if (match && match[1]) {
        currentBid = parseFloat(match[1]);
        if (!isNaN(currentBid) && currentBid >= 0) {
          console.log(`[BidFTA Current Bid] Found current bid: $${currentBid} for item ${itemId}`);
          return currentBid;
        }
      }
    }
    
    // Try to find JSON data with currentBid
    const jsonPatterns = [
      /\{[^}]*"currentBid"[^}]*\}/s,
      /\{[^{}]*"currentBid"[^{}]*\}/s,
      /"currentBid":\s*([0-9.]+)/,
      /currentBid[^:]*:\s*([0-9.]+)/
    ];
    
    let match = null;
    for (const pattern of jsonPatterns) {
      match = html.match(pattern);
      if (match) break;
    }
    
    if (!match) {
      console.log(`[BidFTA Current Bid] No JSON data found for item ${itemId}`);
      return null;
    }

    try {
      // If we found a simple number pattern, use it directly
      if (match[1]) {
        const currentBid = parseFloat(match[1]);
        console.log(`[BidFTA Current Bid] Found current bid: $${currentBid} for item ${itemId}`);
        return currentBid;
      }
      
      // Try to parse as JSON object
      const itemData: BidftaItemData = JSON.parse(match[0]);
      console.log(`[BidFTA Current Bid] Found current bid: $${itemData.currentBid} for item ${itemId}`);
      return itemData.currentBid;
    } catch (parseError) {
      console.log(`[BidFTA Current Bid] JSON parse error for item ${itemId}:`, parseError);
      return null;
    }
  } catch (error) {
    console.log(`[BidFTA Current Bid] Error fetching current bid for item ${itemId}:`, error);
    return null;
  }
}

/**
 * Updates items with real current bid data from BidFTA
 */
export async function updateItemsWithRealCurrentBids(items: BidftaDirectItem[]): Promise<BidftaDirectItem[]> {
  console.log(`[BidFTA Current Bid] Updating ${items.length} items with real current bid data...`);
  
  const updatedItems: BidftaDirectItem[] = [];
  
  for (const item of items) {
    try {
      // Extract auction ID and item ID from the auction URL
      const auctionUrl = item.auctionUrl;
      const auctionMatch = auctionUrl.match(/idauctions=(\d+)&idItems=(\d+)/);
      
      if (!auctionMatch) {
        console.log(`[BidFTA Current Bid] Could not extract IDs from URL: ${auctionUrl}`);
        updatedItems.push(item);
        continue;
      }
      
      const auctionId = parseInt(auctionMatch[1]);
      const itemId = parseInt(auctionMatch[2]);
      
      // Get real current bid
      const realCurrentBid = await getCurrentBidFromBidfta(auctionId, itemId);
      
      if (realCurrentBid !== null) {
        const updatedItem = {
          ...item,
          currentPrice: realCurrentBid.toFixed(2)
        };
        updatedItems.push(updatedItem);
        console.log(`[BidFTA Current Bid] Updated item ${itemId}: $${item.currentPrice} -> $${realCurrentBid}`);
      } else {
        updatedItems.push(item);
        console.log(`[BidFTA Current Bid] Could not get current bid for item ${itemId}, keeping original: $${item.currentPrice}`);
      }
      
      // Add delay to be respectful to BidFTA
      await new Promise(resolve => setTimeout(resolve, 500));
      
    } catch (error) {
      console.log(`[BidFTA Current Bid] Error updating item ${item.id}:`, error);
      updatedItems.push(item);
    }
  }
  
  console.log(`[BidFTA Current Bid] Updated ${updatedItems.length} items with real current bid data`);
  return updatedItems;
}
