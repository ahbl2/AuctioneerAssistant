import puppeteer from 'puppeteer';
import type { InsertAuctionItem } from '@shared/schema';
import { execSync } from 'child_process';

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
    let chromiumPath = '';
    try {
      chromiumPath = execSync('which chromium || which chromium-browser', { encoding: 'utf8' }).trim();
    } catch {
      chromiumPath = '/nix/store/zi4f80l169xlmivz8vja8wlphq74qqk0-chromium-125.0.6422.141/bin/chromium';
    }

    const browser = await puppeteer.launch({
      headless: true,
      executablePath: chromiumPath,
      args: [
        '--no-sandbox',
        '--disable-setuid-sandbox',
        '--disable-dev-shm-usage',
        '--disable-accelerated-2d-canvas',
        '--disable-gpu'
      ]
    });

    try {
      const page = await browser.newPage();
      await page.setUserAgent('Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36');
      
      console.log('Navigating to bidft.auction/search...');
      await page.goto('https://www.bidft.auction/search', {
        waitUntil: 'networkidle0',
        timeout: 45000
      });

      await new Promise(resolve => setTimeout(resolve, 3000));

      console.log('Extracting auction data...');
      const items = await page.evaluate(() => {
        const results: any[] = [];
        
        const skipKeywords = [
          'columns', 'header', 'navigation', 'nav', 'menu', 'footer',
          'sidebar', 'filter', 'sort', 'search', 'banner'
        ];
        
        const rows = Array.from(document.querySelectorAll('tr, div[role="row"], [class*="row"]'));
        
        rows.forEach((row: any) => {
          try {
            const text = row.textContent?.toLowerCase() || '';
            
            if (skipKeywords.some(kw => text.includes(kw) && text.length < 100)) {
              return;
            }

            const imgEl = row.querySelector('img');
            if (!imgEl) return;

            const imageUrl = imgEl.src || imgEl.getAttribute('data-src') || '';
            if (!imageUrl || imageUrl.includes('placeholder') || imageUrl.includes('icon')) return;
            
            if (!imageUrl.includes('http')) return;

            const cells = Array.from(row.querySelectorAll('td, div[role="cell"], [class*="cell"]'));
            if (cells.length === 0) {
              cells.push(row);
            }

            let title = '';
            let currentPrice = '0';
            let location = 'Unknown';
            let condition = 'Good Condition';
            let msrp = '0';
            
            cells.forEach((cell: any) => {
              const cellText = cell.textContent?.trim() || '';
              
              if (!title && cellText.length > 20 && cellText.length < 300 && 
                  !cellText.match(/^\d+$/) && !cellText.includes('$')) {
                title = cellText.split('\n')[0].trim();
              }
              
              const priceMatch = cellText.match(/\$(\d+\.?\d*)/g);
              if (priceMatch && priceMatch.length >= 1) {
                currentPrice = priceMatch[0].replace('$', '');
                if (priceMatch.length >= 2) {
                  msrp = priceMatch[1].replace('$', '');
                }
              }
              
              if (cellText.match(/(New|Like New|Good|As Is|Unknown)/i)) {
                const match = cellText.match(/(New\/Like New|Like New|New|Good Condition|As Is)/i);
                if (match) condition = match[0];
              }
              
              if (cellText.match(/,\s*[A-Z]{2}/) || cellText.includes(' - ')) {
                const parts = cellText.split('\n');
                location = parts.find((p: string) => p.includes(',') || p.includes(' - ')) || location;
              }
            });

            const linkEl = row.querySelector('a[href*="bidfta.com"]') || 
                          row.querySelector('a[href*="itemDetails"]');
            const auctionUrl = linkEl?.href || '';

            if (title && title.length > 10 && imageUrl && currentPrice !== '0') {
              results.push({
                title,
                description: title,
                imageUrl,
                condition,
                location,
                state: location.match(/,\s*([A-Z]{2})/)?.[1] || 'Unknown',
                facility: location,
                currentPrice,
                msrp: msrp !== '0' ? msrp : (parseFloat(currentPrice) * 2.5).toFixed(2),
                amazonSearchUrl: `https://www.amazon.com/s?k=${encodeURIComponent(title)}&tag=ftasearch-20`,
                auctionUrl,
                endDate: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000)
              });
            }
          } catch (err) {
            console.error('Error parsing row:', err);
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
