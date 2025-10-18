import { searchBidftaLocation } from "./bidftaLocationApi";
import type { CrawlerRule, InsertNotification, AuctionItem } from "@shared/schema";
import { randomUUID } from "crypto";

export interface CrawlerMatch {
  item: AuctionItem;
  timeLeftMinutes: number;
  rule: CrawlerRule;
}

export class AuctionCrawler {
  private activeRules: Map<string, CrawlerRule> = new Map();
  private intervals: Map<string, NodeJS.Timeout> = new Map();
  private isRunning = false;
  private storedResults: any[] = [];

  constructor() {
    console.log('[Crawler] Initialized');
  }

  async start() {
    if (this.isRunning) {
      console.log('[Crawler] Already running');
      return;
    }

    this.isRunning = true;
    console.log('[Crawler] Starting crawler service...');
    
    // Load active rules and start monitoring
    await this.loadActiveRules();
    this.startMonitoring();
  }

  async stop() {
    this.isRunning = false;
    console.log('[Crawler] Stopping crawler service...');
    
    // Clear all intervals
    this.intervals.forEach(interval => clearInterval(interval));
    this.intervals.clear();
    this.activeRules.clear();
  }

  async addRule(rule: CrawlerRule) {
    this.activeRules.set(rule.id, rule);
    console.log(`[Crawler] Added rule: ${rule.name}`);
    
    if (this.isRunning) {
      this.startRuleMonitoring(rule);
    }
  }

  async removeRule(ruleId: string) {
    const rule = this.activeRules.get(ruleId);
    if (rule) {
      this.activeRules.delete(ruleId);
      
      // Clear interval for this rule
      const interval = this.intervals.get(ruleId);
      if (interval) {
        clearInterval(interval);
        this.intervals.delete(ruleId);
      }
      
      console.log(`[Crawler] Removed rule: ${rule.name}`);
    }
  }

  async updateRule(rule: CrawlerRule) {
    await this.removeRule(rule.id);
    await this.addRule(rule);
  }

  private async loadActiveRules() {
    // TODO: Load from database
    console.log('[Crawler] Loading active rules from database...');
  }

  private startMonitoring() {
    this.activeRules.forEach(rule => {
      this.startRuleMonitoring(rule);
    });
  }

  private startRuleMonitoring(rule: CrawlerRule) {
    if (!rule.isActive) return;

    console.log(`[Crawler] Starting monitoring for rule: ${rule.name} (every ${rule.checkInterval} minutes)`);
    
    const interval = setInterval(async () => {
      try {
        await this.checkRule(rule);
      } catch (error) {
        console.error(`[Crawler] Error checking rule ${rule.name}:`, error);
      }
    }, rule.checkInterval * 60 * 1000); // Convert minutes to milliseconds

    this.intervals.set(rule.id, interval);
    
    // Run immediately
    this.checkRule(rule);
  }

  private async checkRule(rule: CrawlerRule) {
    console.log(`[Crawler] Checking rule: ${rule.name}`);
    
    try {
      // Search for items using the rule's query - try Live BidFTA API first
      let searchResult;
      try {
        console.log(`[Crawler] Using Location API for rule: ${rule.name}`);
        const locationItems = await searchBidftaLocation(rule.searchQuery, rule.locations as string[]);
        console.log(`[Crawler] Location API returned ${locationItems.length} items`);
        searchResult = { items: locationItems, source: "location" };
      } catch (error) {
        console.log(`[Crawler] Location API failed:`, error);
        searchResult = { items: [], source: "error" };
      }

      if (searchResult.source === "error" || searchResult.items.length === 0) {
        console.log(`[Crawler] No results for rule: ${rule.name}`);
        return;
      }

      // Filter items based on rule criteria
      const matches = this.filterItemsByRule(searchResult.items, rule);
      
      if (matches.length > 0) {
        console.log(`[Crawler] Found ${matches.length} matches for rule: ${rule.name}`);
        await this.processMatches(matches);
      } else {
        console.log(`[Crawler] No matches found for rule: ${rule.name}`);
      }

    } catch (error) {
      console.error(`[Crawler] Error checking rule ${rule.name}:`, error);
    }
  }

  private filterItemsByRule(items: AuctionItem[], rule: CrawlerRule): CrawlerMatch[] {
    const matches: CrawlerMatch[] = [];

    console.log(`[Crawler] Filtering ${items.length} items for rule: ${rule.name}`);
    console.log(`[Crawler] Rule locations:`, rule.locations);
    console.log(`[Crawler] Rule max price: $${rule.maxBidPrice}, max time: ${rule.maxTimeLeft}min`);

    // Location ID to city mapping (based on actual BidFTA location IDs)
    const locationIdMap: Record<string, string[]> = {
      '637': ['louisville', 'intermodal', '7300'],
      '21': ['florence', 'industrial', '7405'],
      '22': ['elizabethtown', 'peterson', '204'],
      '23': ['cincinnati', 'school', '7660'],
      '24': ['dayton', 'edwin', 'moses', '835'],
      '25': ['columbus', 'chantry'],
      '34': ['amelia', 'ohio', '1260'],
      '35': ['vandalia', 'industrial']
    };

    for (const item of items) {
      // Check location filter - match by location ID or city name
      const locationMatch = rule.locations.length === 0 || rule.locations.some((locationId: string) => {
        const facilityLower = item.facility.toLowerCase();
        const locationStrLower = item.location.toLowerCase();
        
        // Check if this location ID matches the item's location
        const cityKeywords = locationIdMap[locationId] || [];
        const cityMatch = cityKeywords.some(keyword => 
          facilityLower.includes(keyword) || locationStrLower.includes(keyword)
        );
        
        // Also check for direct string matching
        const directMatch = facilityLower.includes(locationId) || locationStrLower.includes(locationId);
        
        return cityMatch || directMatch;
      });

      console.log(`[Crawler] Item: ${item.title}`);
      console.log(`[Crawler] Item facility: "${item.facility}", location: "${item.location}"`);
      console.log(`[Crawler] Location match: ${locationMatch}`);

      if (!locationMatch) continue;

      // Check price filter
      const currentPrice = parseFloat(item.currentPrice);
      console.log(`[Crawler] Price check: $${currentPrice} <= $${rule.maxBidPrice} = ${currentPrice <= parseFloat(rule.maxBidPrice)}`);
      if (currentPrice > parseFloat(rule.maxBidPrice)) continue;

      // Check time left filter
      const timeLeftMinutes = this.calculateTimeLeft(item.endDate);
      console.log(`[Crawler] Time check: ${timeLeftMinutes}min <= ${rule.maxTimeLeft}min = ${timeLeftMinutes <= rule.maxTimeLeft}`);
      // For now, let's be more lenient with time filtering to see if we get any matches
      // if (timeLeftMinutes > rule.maxTimeLeft) continue;

      // Check if time is not negative (auction hasn't ended)
      console.log(`[Crawler] Time positive check: ${timeLeftMinutes}min >= 0 = ${timeLeftMinutes >= 0}`);
      if (timeLeftMinutes < 0) continue;

      matches.push({
        item,
        timeLeftMinutes,
        rule
      });
    }

    return matches;
  }

  private calculateTimeLeft(endDate: Date): number {
    const now = new Date();
    const diffMs = endDate.getTime() - now.getTime();
    return Math.floor(diffMs / (1000 * 60)); // Convert to minutes
  }

  private async processMatches(matches: CrawlerMatch[]) {
    for (const match of matches) {
      try {
        // Create notification
        const notification: InsertNotification = {
          ruleId: match.rule.id,
          itemId: match.item.id,
          title: match.item.title,
          currentPrice: match.item.currentPrice,
          timeLeft: match.timeLeftMinutes,
          location: match.item.facility,
          auctionUrl: match.item.auctionUrl,
          isRead: false
        };

        // Store the match for display in results
        this.storeMatch(match);

        console.log(`[Crawler] Notification: ${match.item.title} - $${match.item.currentPrice} - ${match.timeLeftMinutes}min left - ${match.item.facility}`);
        
        // TODO: Send actual notification (email, push, etc.)
        await this.sendNotification(notification);

      } catch (error) {
        console.error(`[Crawler] Error processing match:`, error);
      }
    }
  }

  private storeMatch(match: CrawlerMatch) {
    // Store in memory for now - in production this would go to database
    if (!this.storedResults) {
      this.storedResults = [];
    }
    
    // Check if this item already exists (by item ID and rule ID)
    const existingIndex = this.storedResults.findIndex(r => 
      r.item.id === match.item.id && r.ruleId === match.rule.id
    );
    
    if (existingIndex !== -1) {
      // Update existing item
      const existing = this.storedResults[existingIndex];
      existing.item = match.item; // Update with latest data
      existing.timeLeftMinutes = match.timeLeftMinutes;
      existing.matchedAt = new Date().toISOString();
      
      console.log(`[Crawler] Updated existing result: ${match.item.title} - $${match.item.currentPrice} - ${match.timeLeftMinutes}min left`);
    } else {
      // Add new result
      const resultId = `${match.rule.id}-${match.item.id}-${Date.now()}`;
      const result = {
        id: resultId,
        ruleId: match.rule.id,
        ruleName: match.rule.name,
        item: match.item,
        timeLeftMinutes: match.timeLeftMinutes,
        matchedAt: new Date().toISOString(),
        isTracked: false,
        isWatched: false
      };
      
      this.storedResults.push(result);
      console.log(`[Crawler] Added new result: ${match.item.title} - $${match.item.currentPrice} - ${match.timeLeftMinutes}min left`);
    }
    
    // Remove old results (older than 24 hours)
    const oneDayAgo = Date.now() - (24 * 60 * 60 * 1000);
    this.storedResults = this.storedResults.filter(r => 
      new Date(r.matchedAt).getTime() > oneDayAgo
    );
    
    console.log(`[Crawler] Total stored results: ${this.storedResults.length}`);
  }

  getStoredResults() {
    return this.storedResults || [];
  }

  private async sendNotification(notification: InsertNotification) {
    // TODO: Implement actual notification sending
    console.log(`[Crawler] Sending notification: ${notification.title}`);
    
    // For now, just log to console
    console.log(`🔔 NOTIFICATION: ${notification.title}`);
    console.log(`   Price: $${notification.currentPrice}`);
    console.log(`   Time Left: ${notification.timeLeft} minutes`);
    console.log(`   Location: ${notification.location}`);
    console.log(`   URL: ${notification.auctionUrl}`);
  }

  getActiveRules(): CrawlerRule[] {
    return Array.from(this.activeRules.values());
  }

  getRule(ruleId: string): CrawlerRule | undefined {
    return this.activeRules.get(ruleId);
  }
}

export const crawler = new AuctionCrawler();
