import { BidftaDirectItem } from "./bidftaMultiPageApi";
import { calculateTimeLeft } from "./utils";

interface EndedAuctionItem extends BidftaDirectItem {
  endedAt: Date;
  finalPrice: string;
  wasWon: boolean;
}

class EndedAuctionsStorage {
  private endedItems: Map<string, EndedAuctionItem> = new Map();

  public addEndedItem(item: BidftaDirectItem, finalPrice?: string): void {
    const endedItem: EndedAuctionItem = {
      ...item,
      endedAt: new Date(),
      finalPrice: finalPrice || item.currentPrice,
      wasWon: false // We don't know if user won, so default to false
    };
    
    this.endedItems.set(item.id, endedItem);
    console.log(`[Ended Auctions] Added ended item: ${item.title} - Final Price: $${endedItem.finalPrice}`);
  }

  public searchEndedItems(query: string, locations?: string[]): EndedAuctionItem[] {
    const searchTerm = query.toLowerCase();
    const results: EndedAuctionItem[] = [];

    for (const item of this.endedItems.values()) {
      const title = (item.title || '').toLowerCase();
      const description = (item.description || '').toLowerCase();
      const category1 = (item.category1 || '').toLowerCase();
      const category2 = (item.category2 || '').toLowerCase();

      // Location filtering
      const locationMatch = !locations || locations.length === 0 || 
        locations.some(loc => item.location.toLowerCase().includes(loc.toLowerCase()));

      // Search term filtering
      const termMatch = searchTerm.length === 0 ||
        title.includes(searchTerm) ||
        description.includes(searchTerm) ||
        category1.includes(searchTerm) ||
        category2.includes(searchTerm);

      if (locationMatch && termMatch) {
        results.push(item);
      }
    }

    // Sort by ended date (most recent first)
    return results.sort((a, b) => b.endedAt.getTime() - a.endedAt.getTime());
  }

  public getAllEndedItems(): EndedAuctionItem[] {
    return Array.from(this.endedItems.values()).sort((a, b) => b.endedAt.getTime() - a.endedAt.getTime());
  }

  public getEndedItemStats() {
    const totalEnded = this.endedItems.size;
    const totalValue = Array.from(this.endedItems.values())
      .reduce((sum, item) => sum + parseFloat(item.finalPrice), 0);
    
    const avgPrice = totalEnded > 0 ? totalValue / totalEnded : 0;
    
    // Price range analysis
    const prices = Array.from(this.endedItems.values()).map(item => parseFloat(item.finalPrice));
    const minPrice = prices.length > 0 ? Math.min(...prices) : 0;
    const maxPrice = prices.length > 0 ? Math.max(...prices) : 0;

    return {
      totalEnded,
      totalValue: totalValue.toFixed(2),
      avgPrice: avgPrice.toFixed(2),
      minPrice: minPrice.toFixed(2),
      maxPrice: maxPrice.toFixed(2)
    };
  }

  public clearAllEndedItems(): void {
    this.endedItems.clear();
    console.log("[Ended Auctions] Cleared all ended items");
  }

  public removeEndedItem(itemId: string): boolean {
    return this.endedItems.delete(itemId);
  }
}

export const endedAuctionsStorage = new EndedAuctionsStorage();
