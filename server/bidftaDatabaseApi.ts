import { bidftaIndexer, type BidftaIndexedItem } from "./bidftaIndexer";

// Cache for search results
const searchCache = new Map<string, { data: BidftaIndexedItem[], timestamp: number }>();
const CACHE_DURATION = 30 * 1000; // 30 seconds (shorter since database updates frequently)

export async function searchBidftaDatabase(query: string, locations?: string[]): Promise<BidftaIndexedItem[]> {
  console.log(`[BidFTA Database] Searching for: "${query}" with locations:`, locations);

  const cacheKey = `${query}_${locations?.join(',') || 'all'}`;
  const cached = searchCache.get(cacheKey);
  if (cached && (Date.now() - cached.timestamp) < CACHE_DURATION) {
    console.log(`[BidFTA Database] Cache hit - returning ${cached.data.length} items instantly`);
    return cached.data;
  }

  try {
    // Search the indexed database
    const results = bidftaIndexer.searchItems(query, locations);
    console.log(`[BidFTA Database] Found ${results.length} items from indexed database`);

    // Cache the results
    searchCache.set(cacheKey, { data: results, timestamp: Date.now() });
    
    return results;
  } catch (error) {
    console.error('[BidFTA Database] Search error:', error);
    return [];
  }
}

export async function getAllBidftaDatabaseItems(locations?: string[]): Promise<BidftaIndexedItem[]> {
  console.log(`[BidFTA Database] Getting all items with locations:`, locations);
  
  try {
    const results = bidftaIndexer.getAllItems(locations);
    console.log(`[BidFTA Database] Found ${results.length} total items from indexed database`);
    return results;
  } catch (error) {
    console.error('[BidFTA Database] Get all items error:', error);
    return [];
  }
}

export function getIndexerStats() {
  return bidftaIndexer.getStats();
}
