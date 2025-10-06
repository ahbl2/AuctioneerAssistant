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
      
      console.log('Navigating to bidfta.com/category/all/1...');
      await page.goto('https://www.bidfta.com/category/all/1', {
        waitUntil: 'networkidle0',
        timeout: 45000
      });

      await new Promise(resolve => setTimeout(resolve, 3000));

      console.log('Loading all pages of results...');
      let allItems: any[] = [];
      let currentPage = 1;
      const maxPages = 50;
      
      while (currentPage <= maxPages) {
        console.log(`Scraping page ${currentPage}...`);
        
        try {
          await page.evaluate(() => window.scrollTo(0, document.body.scrollHeight));
          await new Promise(resolve => setTimeout(resolve, 2000));
        } catch (scrollError) {
          console.log('Error scrolling, continuing...');
        }
        
        let pageItems: any[] = [];
        try {
          pageItems = await page.evaluate(() => {
            const results: any[] = [];
            
            const auctionLinks = Array.from(document.querySelectorAll('a[href*="/api/auction/"]'));
            
            auctionLinks.forEach((link: any) => {
              try {
                const container = link.closest('div, article, section') || link;
                
                const imgEls = container.querySelectorAll('img');
                if (imgEls.length === 0) return;
                
                const imageUrl = imgEls[0].src || '';
                if (!imageUrl || imageUrl.includes('placeholder')) return;
                
                const titleEl = container.querySelector('strong, h1, h2, h3, h4, h5, h6, [class*="title"]');
                const title = titleEl?.textContent?.trim() || '';
                if (!title || title.length < 5) return;
                
                const textContent = container.textContent || '';
                
                const locationMatch = textContent.match(/([A-Za-z\s]+)\s*-\s*([A-Za-z\s\.]+)\s*,\s*([A-Z]{2})/);
                const location = locationMatch ? locationMatch[0] : 'Unknown';
                const state = locationMatch ? locationMatch[3] : 'Unknown';
                const facility = location;
                
                const auctionIdMatch = textContent.match(/Auction:\s*([A-Z0-9]+)/);
                const auctionId = auctionIdMatch ? auctionIdMatch[1] : '';
                
                const itemCountMatch = textContent.match(/(\d+)\s+Items?/);
                const itemCount = itemCountMatch ? parseInt(itemCountMatch[1]) : 0;
                
                const endDateMatch = textContent.match(/(October|November|December|January|February|March|April|May|June|July|August|September)\s+(\d+)[a-z]*(\d{2}:\d{2}\s*[AP]M)/);
                let endDate = new Date(Date.now() + 7 * 24 * 60 * 60 * 1000);
                
                if (endDateMatch) {
                  const monthStr = endDateMatch[1];
                  const day = parseInt(endDateMatch[2]);
                  const time = endDateMatch[3];
                  const year = new Date().getFullYear();
                  const dateStr = `${monthStr} ${day}, ${year} ${time}`;
                  const parsedDate = new Date(dateStr);
                  if (!isNaN(parsedDate.getTime())) {
                    endDate = parsedDate;
                  }
                }
                
                const auctionUrl = link.href || '';
                
                const currentPrice = '0';
                const condition = 'Good Condition';
                const msrp = '0';
                
                results.push({
                  title,
                  description: `${title} - ${itemCount} items - ${auctionId}`,
                  imageUrl,
                  condition,
                  location,
                  state,
                  facility,
                  currentPrice,
                  msrp,
                  amazonSearchUrl: `https://www.amazon.com/s?k=${encodeURIComponent(title)}&tag=ftasearch-20`,
                  auctionUrl,
                  endDate
                });
              } catch (err) {
                console.error('Error parsing auction item:', err);
              }
            });
            
            return results;
          });
        } catch (evalError) {
          console.log(`Error evaluating page ${currentPage}, skipping:`, evalError);
          break;
        }
        
        console.log(`Found ${pageItems.length} items on page ${currentPage}`);
        allItems = allItems.concat(pageItems);
        
        if (pageItems.length === 0) {
          console.log('No items found on this page, stopping');
          break;
        }
        
        currentPage++;
        
        if (currentPage <= maxPages) {
          try {
            const nextPageUrl = `https://www.bidfta.com/category/all/${currentPage}`;
            console.log(`Navigating to page ${currentPage}: ${nextPageUrl}`);
            await page.goto(nextPageUrl, {
              waitUntil: 'networkidle0',
              timeout: 45000
            });
            await new Promise(resolve => setTimeout(resolve, 2000));
          } catch (navError) {
            console.log('Error navigating to next page, stopping pagination');
            break;
          }
        }
      }
      
      console.log(`Successfully scraped ${allItems.length} auction items across ${currentPage} pages`);
      
      if (allItems.length === 0) {
        console.log('No items scraped from any page');
      }
      
      return allItems;
    } catch (error) {
      console.error('Error scraping bidfta.com:', error);
      return [];
    } finally {
      await browser.close();
    }
  }
}

export const scraper = new BidFTScraper();
