import puppeteer from 'puppeteer';
import type { InsertAuctionItem } from '@shared/schema';

export interface ScrapedAuctionData {
  items: InsertAuctionItem[];
  lastUpdated: Date;
}

export class BidFTScraper {
  private cachedData: ScrapedAuctionData | null = null;
  private isScrapingInProgress = false;
  private cacheExpiryMs = 15 * 60 * 1000;

  async getAuctionData(forceRefresh = false): Promise<ScrapedAuctionData> {
    if (!forceRefresh && this.cachedData && this.isCacheValid()) {
      return this.cachedData;
    }

    if (this.isScrapingInProgress) {
      while (this.isScrapingInProgress) {
        await new Promise(resolve => setTimeout(resolve, 1000));
      }
      return this.cachedData || { items: [], lastUpdated: new Date() };
    }

    this.isScrapingInProgress = true;
    try {
      const items = await this.scrapeAuctions();
      this.cachedData = {
        items,
        lastUpdated: new Date()
      };
      return this.cachedData;
    } finally {
      this.isScrapingInProgress = false;
    }
  }

  private isCacheValid(): boolean {
    if (!this.cachedData) return false;
    const now = Date.now();
    const cacheAge = now - this.cachedData.lastUpdated.getTime();
    return cacheAge < this.cacheExpiryMs;
  }

  private async scrapeAuctions(): Promise<InsertAuctionItem[]> {
    const browser = await puppeteer.launch({
      headless: true,
      args: ['--no-sandbox', '--disable-setuid-sandbox']
    });

    try {
      const page = await browser.newPage();
      await page.setUserAgent('Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36');
      
      console.log('Navigating to bidft.auction/search...');
      await page.goto('https://www.bidft.auction/search', {
        waitUntil: 'networkidle2',
        timeout: 30000
      });

      console.log('Waiting for auction items to load...');
      await page.waitForSelector('[class*="Card"]', { timeout: 15000 });
      
      await page.waitForFunction(() => {
        const cards = document.querySelectorAll('[class*="Card"]');
        return cards.length > 5;
      }, { timeout: 10000 });

      console.log('Extracting auction data...');
      const items = await page.evaluate(() => {
        const results: any[] = [];
        const cards = document.querySelectorAll('[class*="Card"]');
        
        cards.forEach((card: any) => {
          try {
            const titleEl = card.querySelector('h3, [class*="title"], [class*="Title"]');
            const title = titleEl?.textContent?.trim();
            
            const descEl = card.querySelector('p, [class*="description"], [class*="Description"]');
            const description = descEl?.textContent?.trim();
            
            const imgEl = card.querySelector('img');
            const imageUrl = imgEl?.src || imgEl?.getAttribute('data-src') || '';
            
            const priceEl = card.querySelector('[class*="price"], [class*="Price"]');
            const priceText = priceEl?.textContent?.trim() || '0';
            const currentPrice = priceText.replace(/[^0-9.]/g, '') || '0';
            
            const linkEl = card.querySelector('a[href*="bidfta.com"]');
            const auctionUrl = linkEl?.href || '';
            
            const conditionEl = card.querySelector('[class*="condition"], [class*="Condition"]');
            const condition = conditionEl?.textContent?.trim() || 'Unknown';
            
            const locationEl = card.querySelector('[class*="location"], [class*="Location"]');
            const locationText = locationEl?.textContent?.trim() || '';
            
            const stateMatch = locationText.match(/,\s*([A-Z]{2})\s*$/);
            const state = stateMatch ? stateMatch[1] : 'Unknown';
            
            if (title && imageUrl) {
              results.push({
                title,
                description: description || title,
                imageUrl,
                condition,
                location: locationText || 'Unknown',
                state,
                facility: locationText || 'Unknown',
                currentPrice,
                msrp: (parseFloat(currentPrice) * 2).toFixed(2),
                amazonSearchUrl: `https://www.amazon.com/s?k=${encodeURIComponent(title)}&tag=ftasearch-20`,
                auctionUrl,
                endDate: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000)
              });
            }
          } catch (err) {
            console.error('Error parsing card:', err);
          }
        });
        
        return results;
      });

      console.log(`Successfully scraped ${items.length} auction items`);
      return items;
    } catch (error) {
      console.error('Error scraping bidft.auction:', error);
      return [];
    } finally {
      await browser.close();
    }
  }
}

export const scraper = new BidFTScraper();
