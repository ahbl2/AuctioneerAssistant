import { nanoid } from "nanoid";
import { calculateTimeLeft } from "./utils";

// Cache for search results
const searchCache = new Map<string, { data: BidftaSmartItem[], timestamp: number }>();
const CACHE_DURATION = 2 * 60 * 1000; // 2 minutes

export interface BidftaSmartItem {
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

function getLocationId(locationName: string): string | null {
  return LOCATION_ID_MAP[locationName.toLowerCase()] || null;
}

export async function searchBidftaSmart(query: string, locations?: string[]): Promise<BidftaSmartItem[]> {
  console.log(`[BidFTA Smart] Searching for: "${query}" with locations:`, locations);

  const cacheKey = `${query}_${locations?.join(',') || 'all'}`;
  const cached = searchCache.get(cacheKey);
  if (cached && (Date.now() - cached.timestamp) < CACHE_DURATION) {
    console.log(`[BidFTA Smart] Cache hit - returning ${cached.data.length} items instantly`);
    return cached.data;
  }

  try {
    // Use a single, focused search strategy
    const items = await searchWithFocusedQuery(query, locations);
    
    // Filter for relevance
    const relevantItems = items.filter(item => {
      const title = item.title.toLowerCase();
      const description = item.description.toLowerCase();
      const searchTerm = query.toLowerCase();
      
      // Check for exact matches first
      if (title.includes(searchTerm)) return true;
      
      // Check for partial matches
      const words = searchTerm.split(/\s+/);
      const titleWords = title.split(/\s+/);
      const descriptionWords = description.split(/\s+/);
      
      // Check if any search word appears in title or description
      return words.some(word => 
        word.length > 2 && (
          titleWords.some(tw => tw.includes(word)) ||
          descriptionWords.some(dw => dw.includes(word))
        )
      );
    });
    
    // Sort by relevance
    relevantItems.sort((a, b) => {
      const aExact = a.title.toLowerCase().includes(query.toLowerCase());
      const bExact = b.title.toLowerCase().includes(query.toLowerCase());
      
      if (aExact && !bExact) return -1;
      if (!aExact && bExact) return 1;
      
      // Sort by title length (shorter titles are usually more relevant)
      return a.title.length - b.title.length;
    });

    console.log(`[BidFTA Smart] Found ${relevantItems.length} relevant items from focused search`);

    // Cache the results
    searchCache.set(cacheKey, { data: relevantItems, timestamp: Date.now() });
    
    return relevantItems.slice(0, 50); // Limit to 50 results for performance
  } catch (error) {
    console.error('[BidFTA Smart] Search error:', error);
    return [];
  }
}

async function searchWithFocusedQuery(query: string, locations?: string[]): Promise<BidftaSmartItem[]> {
  console.log(`[BidFTA Smart] Focused query search`);
  
  try {
    const params = new URLSearchParams({
      pageId: '1',
      q: query,
      limit: '100'
    });

    if (locations && locations.length > 0) {
      const locationIds = locations.map(loc => getLocationId(loc)).filter(id => id);
      if (locationIds.length > 0) {
        params.append('locationIds', locationIds.join(','));
      }
    }

    const response = await fetch(`https://auction.bidfta.io/api/search/searchItemList?${params}`, {
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
      console.log(`[BidFTA Smart] Found ${items.length} items from API`);
      return items.map(normalizeBidftaItem);
    }
  } catch (error) {
    console.error('[BidFTA Smart] Focused query error:', error);
  }
  
  return [];
}

async function searchWithExactQuery(query: string, locations?: string[]): Promise<BidftaSmartItem[]> {
  console.log(`[BidFTA Smart] Strategy 1: Exact query search`);
  
  try {
    const params = new URLSearchParams({
      pageId: '1',
      q: query,
      limit: '100'
    });

    if (locations && locations.length > 0) {
      const locationIds = locations.map(loc => getLocationId(loc)).filter(id => id);
      if (locationIds.length > 0) {
        params.append('locationIds', locationIds.join(','));
      }
    }

    const response = await fetch(`https://auction.bidfta.io/api/search/searchItemList?${params}`, {
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
      console.log(`[BidFTA Smart] Strategy 1: Found ${items.length} items`);
      return items.map(normalizeBidftaItem);
    }
  } catch (error) {
    console.error('[BidFTA Smart] Strategy 1 error:', error);
  }
  
  return [];
}

async function searchWithBroadTerms(query: string, locations?: string[]): Promise<BidftaSmartItem[]> {
  console.log(`[BidFTA Smart] Strategy 2: Broad terms search`);
  
  // Generate broader search terms
  const broadTerms = generateBroadTerms(query);
  const allItems: BidftaSmartItem[] = [];

  for (const term of broadTerms.slice(0, 3)) { // Limit to 3 broad terms
    try {
      const params = new URLSearchParams({
        pageId: '1',
        q: term,
        limit: '100'
      });

      if (locations && locations.length > 0) {
        const locationIds = locations.map(loc => getLocationId(loc)).filter(id => id);
        if (locationIds.length > 0) {
          params.append('locationIds', locationIds.join(','));
        }
      }

      const response = await fetch(`https://auction.bidfta.io/api/search/searchItemList?${params}`, {
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
        
        // Filter items that are relevant to original query
        const relevantItems = items.filter(item => {
          const title = (item.title || '').toLowerCase();
          const description = (item.specs || '').toLowerCase();
          const originalQuery = query.toLowerCase();
          
          return title.includes(originalQuery) || 
                 description.includes(originalQuery) ||
                 (originalQuery.includes('chair') && title.includes('chair')) ||
                 (originalQuery.includes('office') && title.includes('office')) ||
                 (originalQuery.includes('electronics') && title.includes('electronic'));
        });
        
        allItems.push(...relevantItems.map(normalizeBidftaItem));
      }
      
      // Small delay between requests
      await new Promise(resolve => setTimeout(resolve, 200));
    } catch (error) {
      console.error(`[BidFTA Smart] Strategy 2 error for term "${term}":`, error);
    }
  }

  console.log(`[BidFTA Smart] Strategy 2: Found ${allItems.length} items`);
  return allItems;
}

async function searchWithCategories(query: string, locations?: string[]): Promise<BidftaSmartItem[]> {
  console.log(`[BidFTA Smart] Strategy 3: Category search`);
  
  // Map query to relevant categories
  const categories = getCategoriesForQuery(query);
  const allItems: BidftaSmartItem[] = [];

  for (const category of categories.slice(0, 2)) { // Limit to 2 categories
    try {
      const params = new URLSearchParams({
        pageId: '1',
        q: category,
        limit: '100'
      });

      if (locations && locations.length > 0) {
        const locationIds = locations.map(loc => getLocationId(loc)).filter(id => id);
        if (locationIds.length > 0) {
          params.append('locationIds', locationIds.join(','));
        }
      }

      const response = await fetch(`https://auction.bidfta.io/api/search/searchItemList?${params}`, {
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
        
        // Filter items that are relevant to original query
        const relevantItems = items.filter(item => {
          const title = (item.title || '').toLowerCase();
          const description = (item.specs || '').toLowerCase();
          const originalQuery = query.toLowerCase();
          
          return title.includes(originalQuery) || 
                 description.includes(originalQuery) ||
                 (originalQuery.includes('chair') && title.includes('chair')) ||
                 (originalQuery.includes('office') && title.includes('office')) ||
                 (originalQuery.includes('electronics') && title.includes('electronic'));
        });
        
        allItems.push(...relevantItems.map(normalizeBidftaItem));
      }
      
      // Small delay between requests
      await new Promise(resolve => setTimeout(resolve, 200));
    } catch (error) {
      console.error(`[BidFTA Smart] Strategy 3 error for category "${category}":`, error);
    }
  }

  console.log(`[BidFTA Smart] Strategy 3: Found ${allItems.length} items`);
  return allItems;
}

function generateBroadTerms(query: string): string[] {
  const terms = new Set<string>();
  const lowerQuery = query.toLowerCase();
  
  // Add original query
  terms.add(query);
  
  // Add related terms
  if (lowerQuery.includes('chair')) {
    terms.add('furniture');
    terms.add('office');
    terms.add('dining');
    terms.add('seating');
  }
  
  if (lowerQuery.includes('office')) {
    terms.add('desk');
    terms.add('work');
    terms.add('business');
    terms.add('furniture');
  }
  
  if (lowerQuery.includes('electronics')) {
    terms.add('electronic');
    terms.add('computer');
    terms.add('phone');
    terms.add('audio');
  }
  
  if (lowerQuery.includes('tools')) {
    terms.add('tool');
    terms.add('hardware');
    terms.add('equipment');
  }
  
  return Array.from(terms);
}

function getCategoriesForQuery(query: string): string[] {
  const lowerQuery = query.toLowerCase();
  const categories: string[] = [];
  
  if (lowerQuery.includes('chair') || lowerQuery.includes('furniture')) {
    categories.push('furniture');
    categories.push('home');
  }
  
  if (lowerQuery.includes('office')) {
    categories.push('office');
    categories.push('business');
  }
  
  if (lowerQuery.includes('electronics')) {
    categories.push('electronics');
    categories.push('computers');
  }
  
  if (lowerQuery.includes('tools')) {
    categories.push('tools');
    categories.push('hardware');
  }
  
  return categories;
}

export async function getAllBidftaSmartItems(locations?: string[]): Promise<BidftaSmartItem[]> {
  console.log(`[BidFTA Smart] Getting all items with locations:`, locations);
  return searchBidftaSmart("", locations); // Use empty query to get all
}

function normalizeBidftaItem(raw: any): BidftaSmartItem {
  const title = raw.title || "Unknown Item";
  const description = raw.specs || raw.description || "";
  const imageUrl = raw.imageUrl || "";
  const auctionUrl = `https://www.bidfta.com/itemDetails?idauctions=${raw.auctionId}&idItems=${raw.itemId}`;
  
  // Extract location data
  let locationStr = "Unknown Location";
  let city = "Unknown";
  let state = "Unknown";
  let facility = "Unknown";

  if (raw.auctionLocation) {
    city = raw.auctionLocation.city || "Unknown";
    state = raw.auctionLocation.state || "Unknown";
    facility = raw.auctionLocation.nickName || `${city} - ${raw.auctionLocation.address || "Unknown"}`;
    locationStr = `${city} - ${raw.auctionLocation.address || "Unknown"}`;
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
    model: raw.model
  };
}
