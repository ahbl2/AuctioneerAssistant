import { BidftaDirectItem } from '../shared/schema';

/**
 * Gets current bid data directly from BidFTA API
 * This is more reliable than HTML scraping
 */
export async function getCurrentBidFromBidftaApi(auctionId: number, itemId: number): Promise<number | null> {
  try {
    console.log(`[BidFTA Direct API] Fetching current bid for auction ${auctionId}, item ${itemId}`);
    
    // Try the auction API endpoint
    const auctionUrl = `https://auction.bidfta.io/api/auction/${auctionId}`;
    const response = await fetch(auctionUrl, {
      headers: {
        'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/91.0.4472.124 Safari/537.36',
        'Accept': 'application/json',
        'Referer': 'https://www.bidfta.com/'
      }
    });

    if (!response.ok) {
      console.log(`[BidFTA Direct API] HTTP error: ${response.status}`);
      return null;
    }

    const data = await response.json();
    
    // Look for the item in the auction data
    if (data.items && Array.isArray(data.items)) {
      const item = data.items.find((i: any) => i.id === itemId || i.itemId === itemId);
      if (item && item.currentBid !== undefined) {
        console.log(`[BidFTA Direct API] Found current bid: $${item.currentBid} for item ${itemId}`);
        return parseFloat(item.currentBid);
      }
    }
    
    // Try alternative fields
    if (data.currentBid !== undefined) {
      console.log(`[BidFTA Direct API] Found auction current bid: $${data.currentBid} for item ${itemId}`);
      return parseFloat(data.currentBid);
    }
    
    console.log(`[BidFTA Direct API] No current bid found for item ${itemId}`);
    return null;
    
  } catch (error) {
    console.log(`[BidFTA Direct API] Error fetching current bid for item ${itemId}:`, error);
    return null;
  }
}

/**
 * Updates items with real current bid data from BidFTA API
 */
export async function updateItemsWithRealCurrentBidsFromApi(items: BidftaDirectItem[]): Promise<BidftaDirectItem[]> {
  console.log(`[BidFTA Direct API] Updating ${items.length} items with real current bid data...`);
  
  const updatedItems: BidftaDirectItem[] = [];
  
  for (const item of items) {
    try {
      // Extract auction ID and item ID from the auction URL
      const auctionUrl = item.auctionUrl;
      const auctionMatch = auctionUrl.match(/idauctions=(\d+)&idItems=(\d+)/);
      
      if (!auctionMatch) {
        console.log(`[BidFTA Direct API] Could not extract IDs from URL: ${auctionUrl}`);
        updatedItems.push(item);
        continue;
      }
      
      const auctionId = parseInt(auctionMatch[1]);
      const itemId = parseInt(auctionMatch[2]);
      
      // Get real current bid from API
      const realCurrentBid = await getCurrentBidFromBidftaApi(auctionId, itemId);
      
      if (realCurrentBid !== null) {
        const updatedItem = {
          ...item,
          currentPrice: realCurrentBid.toFixed(2)
        };
        updatedItems.push(updatedItem);
        console.log(`[BidFTA Direct API] Updated item ${itemId}: $${item.currentPrice} -> $${realCurrentBid}`);
      } else {
        updatedItems.push(item);
        console.log(`[BidFTA Direct API] Could not get current bid for item ${itemId}, keeping original: $${item.currentPrice}`);
      }
      
      // Add delay to be respectful to the API
      await new Promise(resolve => setTimeout(resolve, 200));
      
    } catch (error) {
      console.log(`[BidFTA Direct API] Error updating item ${item.id}:`, error);
      updatedItems.push(item);
    }
  }
  
  console.log(`[BidFTA Direct API] Updated ${updatedItems.length} items with real current bid data`);
  return updatedItems;
}
