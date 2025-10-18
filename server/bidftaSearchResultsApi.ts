import { BidftaDirectItem } from '../shared/schema';

interface BidftaSearchResult {
  id: number;
  itemId: number;
  auctionId: number;
  title: string;
  currentBid: number;
  msrp: number;
  condition: string;
  location: string;
  timeLeft: string;
  imageUrl: string;
  auctionUrl: string;
}

/**
 * Scrapes current bid data from BidFTA search results page
 * This is much more efficient than scraping individual item pages
 */
export async function getCurrentBidsFromSearchResults(query: string, locations?: string[]): Promise<Map<number, number>> {
  try {
    console.log(`[BidFTA Search Results] Fetching current bids for query: "${query}"`);
    
    // Build search URL similar to what we see in the image
    const searchParams = new URLSearchParams({
      pageId: '1',
      itemSearchKeywords: query,
      limit: '100' // Get more results per page
    });
    
    // Add location filters if specified
    if (locations && locations.length > 0) {
      // Add location parameters (this might need adjustment based on actual BidFTA API)
      locations.forEach((location, index) => {
        searchParams.append(`location${index}`, location);
      });
    }
    
    const url = `https://www.bidfta.com/items?${searchParams.toString()}`;
    console.log(`[BidFTA Search Results] Fetching: ${url}`);
    
    const response = await fetch(url, {
      headers: {
        'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/91.0.4472.124 Safari/537.36',
        'Accept': 'text/html,application/xhtml+xml,application/xml;q=0.9,image/webp,*/*;q=0.8',
        'Accept-Language': 'en-US,en;q=0.5',
        'Accept-Encoding': 'gzip, deflate, br',
        'Connection': 'keep-alive',
        'Upgrade-Insecure-Requests': '1'
      }
    });

    if (!response.ok) {
      console.log(`[BidFTA Search Results] HTTP error: ${response.status}`);
      return new Map();
    }

    const html = await response.text();
    const currentBids = new Map<number, number>();
    
    // Look for item blocks that contain both item ID and current bid
    // This is more accurate than trying to match separate arrays
    const itemBlockPattern = /<div[^>]*class="[^"]*item[^"]*"[^>]*>.*?idItems=(\d+).*?CURRENT BID[^>]*>\s*\$([0-9]+(?:\.[0-9]{2})?)/gis;
    
    let match;
    while ((match = itemBlockPattern.exec(html)) !== null) {
      const itemId = parseInt(match[1]);
      const currentBid = parseFloat(match[2]);
      
      if (!isNaN(itemId) && !isNaN(currentBid)) {
        currentBids.set(itemId, currentBid);
        console.log(`[BidFTA Search Results] Found item ${itemId} with current bid $${currentBid}`);
      }
    }
    
    // If the above pattern doesn't work, try alternative patterns
    if (currentBids.size === 0) {
      console.log(`[BidFTA Search Results] Primary pattern failed, trying alternative patterns...`);
      
      // Try to find JSON data with current bids
      const jsonPattern = /window\.__INITIAL_STATE__\s*=\s*(\{.*?\});/s;
      const jsonMatch = html.match(jsonPattern);
      
      if (jsonMatch) {
        try {
          const data = JSON.parse(jsonMatch[1]);
          console.log(`[BidFTA Search Results] Found JSON data, looking for items...`);
          
          // Look for items array in the JSON
          if (data.items && Array.isArray(data.items)) {
            data.items.forEach((item: any) => {
              if (item.id && item.currentBid !== undefined) {
                currentBids.set(item.id, item.currentBid);
                console.log(`[BidFTA Search Results] Found JSON item ${item.id} with current bid $${item.currentBid}`);
              }
            });
          }
        } catch (error) {
          console.log(`[BidFTA Search Results] JSON parse error:`, error);
        }
      }
    }
    
    console.log(`[BidFTA Search Results] Found ${currentBids.size} current bids for query: "${query}"`);
    return currentBids;
    
  } catch (error) {
    console.log(`[BidFTA Search Results] Error fetching current bids:`, error);
    return new Map();
  }
}

/**
 * Updates ALL items with real current bid data from search results
 */
export async function updateAllItemsWithRealCurrentBids(items: BidftaDirectItem[], query: string): Promise<BidftaDirectItem[]> {
  console.log(`[BidFTA Search Results] Updating ${items.length} items with real current bid data...`);
  
  // Get current bids from search results page
  const currentBids = await getCurrentBidsFromSearchResults(query);
  
  if (currentBids.size === 0) {
    console.log(`[BidFTA Search Results] No current bid data found, returning original items`);
    return items;
  }
  
  // Update items with real current bid data
  const updatedItems = items.map(item => {
    const itemId = parseInt(item.id);
    const realCurrentBid = currentBids.get(itemId);
    
    if (realCurrentBid !== undefined) {
      console.log(`[BidFTA Search Results] Updated item ${itemId}: $${item.currentPrice} -> $${realCurrentBid}`);
      return {
        ...item,
        currentPrice: realCurrentBid.toFixed(2)
      };
    }
    
    return item;
  });
  
  console.log(`[BidFTA Search Results] Updated ${updatedItems.length} items with real current bid data`);
  return updatedItems;
}
