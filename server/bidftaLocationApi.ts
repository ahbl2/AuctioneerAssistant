import { bidftaLocationIndexer } from "./bidftaLocationIndexer";
import { BidftaDirectItem } from "./bidftaMultiPageApi";
import { updateItemsWithRealCurrentBids } from "./bidftaCurrentBidApi";

export async function searchBidftaLocation(query: string, locations?: string[]): Promise<BidftaDirectItem[]> {
  console.log(`[BidFTA Location API] Searching for: "${query}" with locations:`, locations);
  const stats = bidftaLocationIndexer.getIndexerStats();

  // Only return real data - no fallback data allowed per no-hallucination rules
  if (stats.totalItems === 0 && !stats.isIndexing) {
    console.log("[BidFTA Location API] Indexer not ready or no items indexed. Returning empty results.");
    return [];
  }

  const items = bidftaLocationIndexer.searchIndexedItems(query, locations);

  if (items.length === 0) {
    console.log("[BidFTA Location API] No relevant items found in index. Returning empty results.");
    return [];
  }

  // Update items with real current bid data from BidFTA
  const updatedItems = await updateItemsWithRealCurrentBids(items);
  
  return updatedItems;
}

export async function getAllBidftaLocationItems(locations?: string[]): Promise<BidftaDirectItem[]> {
  console.log(`[BidFTA Location API] Getting all items with locations:`, locations);
  const stats = bidftaLocationIndexer.getIndexerStats();

  // Only return real data - no fallback data allowed per no-hallucination rules
  if (stats.totalItems === 0 && !stats.isIndexing) {
    console.log("[BidFTA Location API] Indexer not ready or no items indexed. Returning empty results.");
    return [];
  }

  const items = bidftaLocationIndexer.getAllIndexedItems(locations);

  if (items.length === 0) {
    console.log("[BidFTA Location API] No items found in index. Returning empty results.");
    return [];
  }

  // Update items with real current bid data from BidFTA
  const updatedItems = await updateItemsWithRealCurrentBids(items);
  
  return updatedItems;
}

export function getLocationIndexerStats() {
  return bidftaLocationIndexer.getIndexerStats();
}