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
    // Prefer Puppeteer's bundled Chromium. Allow override via PUPPETEER_EXECUTABLE_PATH.
    const launchOptions: Parameters<typeof puppeteer.launch>[0] = {
      headless: true,
      args: [
        '--no-sandbox',
        '--disable-setuid-sandbox',
        '--disable-dev-shm-usage',
        '--disable-accelerated-2d-canvas',
        '--disable-gpu'
      ]
    };

    if (process.env.PUPPETEER_EXECUTABLE_PATH) {
      launchOptions.executablePath = process.env.PUPPETEER_EXECUTABLE_PATH;
    }

    let browser: Awaited<ReturnType<typeof puppeteer.launch>> | undefined;
    try {
      browser = await puppeteer.launch(launchOptions);
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
                
                // Look for actual item title, not promotional text
                const titleEl = container.querySelector('strong, h1, h2, h3, h4, h5, h6, [class*="title"], [class*="item"], [class*="name"]');
                let title = titleEl?.textContent?.trim() || '';
                
                // Skip promotional text patterns
                const promoPatterns = [
                  /coming in hot/i,
                  /deals deals deals/i,
                  /bid! win! save/i,
                  /morning deals/i,
                  /afternoon deals/i,
                  /huge savings/i,
                  /mid-day rush/i,
                  /catch you outside/i,
                  /hitting you with/i
                ];
                
                if (promoPatterns.some(pattern => pattern.test(title))) {
                  // Try to find actual item title in other elements
                  const itemTitleEl = container.querySelector('[class*="item-title"], [class*="product-title"], [class*="auction-title"]');
                  if (itemTitleEl) {
                    title = itemTitleEl.textContent?.trim() || '';
                  } else {
                    // Skip this item if we can't find a real title
                    return;
                  }
                }
                
                if (!title || title.length < 5) return;
                
                const textContent = container.textContent || '';
                
                const locationMatch = textContent.match(/([A-Za-z\s]+)\s*-\s*([A-Za-z\s\.0-9\-]+)\s*,\s*([A-Z]{2})/);
                let location = 'Unknown';
                let state = 'Unknown';
                let facility = 'Unknown';
                
                if (locationMatch) {
                  const city = locationMatch[1].trim();
                  const street = locationMatch[2].trim();
                  state = locationMatch[3].trim();
                  
                  if (title.includes(city)) {
                    title = title.replace(new RegExp(`${city}.*`, 'i'), '').trim();
                  }
                  
                  facility = `${city} - ${street} - ${city}, ${state}`;
                  location = `${city} - ${street}, ${state}`;
                }
                
                const auctionIdMatch = textContent.match(/Auction:\s*([A-Z0-9]+)/);
                const auctionId = auctionIdMatch ? auctionIdMatch[1] : '';
                
                const itemCountMatch = textContent.match(/(\d+)\s+Items?/);
                const itemCount = itemCountMatch ? parseInt(itemCountMatch[1]) : 0;
                
                // Look for various date patterns
                const datePatterns = [
                  /(\d+)\s+DAYS?\s+(\d{2}):(\d{2}):(\d{2})/i,
                  /(October|November|December|January|February|March|April|May|June|July|August|September)\s+(\d+)[a-z]*(\d{2}:\d{2}\s*[AP]M)/i,
                  /(\d{1,2})\/(\d{1,2})\/(\d{4})\s+(\d{1,2}):(\d{2})\s*([AP]M)/i
                ];
                
                let endDate = new Date(Date.now() + 7 * 24 * 60 * 60 * 1000);
                
                for (const pattern of datePatterns) {
                  const match = textContent.match(pattern);
                  if (match) {
                    try {
                      if (pattern === datePatterns[0]) {
                        // Days:Hours:Minutes format
                        const days = parseInt(match[1]);
                        const hours = parseInt(match[2]);
                        const minutes = parseInt(match[3]);
                        const seconds = parseInt(match[4]);
                        endDate = new Date(Date.now() + (days * 24 + hours) * 60 * 60 * 1000 + minutes * 60 * 1000 + seconds * 1000);
                      } else if (pattern === datePatterns[1]) {
                        // Month Day, Year Time format
                        const monthStr = match[1];
                        const day = parseInt(match[2]);
                        const time = match[3];
                        const year = new Date().getFullYear();
                        const dateStr = `${monthStr} ${day}, ${year} ${time}`;
                        endDate = new Date(dateStr);
                      } else if (pattern === datePatterns[2]) {
                        // MM/DD/YYYY HH:MM AM/PM format
                        const month = parseInt(match[1]);
                        const day = parseInt(match[2]);
                        const year = parseInt(match[3]);
                        const hour = parseInt(match[4]);
                        const minute = parseInt(match[5]);
                        const ampm = match[6];
                        const hour24 = ampm.toUpperCase() === 'PM' && hour !== 12 ? hour + 12 : (ampm.toUpperCase() === 'AM' && hour === 12 ? 0 : hour);
                        endDate = new Date(year, month - 1, day, hour24, minute);
                      }
                      
                      if (!isNaN(endDate.getTime())) {
                        break;
                      }
                    } catch (e) {
                      // Continue to next pattern
                    }
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
      try {
        await browser?.close();
      } catch {}
    }
  }
}

export const scraper = new BidFTScraper();
