// server/index.ts
import express2 from "express";

// server/routes.ts
import { createServer } from "http";

// server/storage.ts
import { randomUUID } from "crypto";
var MemStorage = class {
  auctionItems;
  locations;
  isScrapingComplete = false;
  constructor() {
    this.auctionItems = /* @__PURE__ */ new Map();
    this.locations = /* @__PURE__ */ new Map();
    this.seedLocations();
    this.seedFallbackData();
    this.initializeWithScrapedData();
  }
  async initializeWithScrapedData() {
    console.log("Skipping Puppeteer scraping - using API proxy for live data");
    this.isScrapingComplete = true;
  }
  async refreshAuctionData() {
    console.log("Skipping Puppeteer refresh - using API proxy for live data");
  }
  seedLocations() {
    const locationData = [
      {
        id: randomUUID(),
        state: "Kentucky",
        facilities: [
          "Louisville - Intermodal Dr. - Louisville, KY",
          "Georgetown - Triport Road - Georgetown, KY",
          "Florence - Industrial Road - Florence, KY",
          "Elizabethtown - Peterson Drive - Elizabethtown, KY",
          "Franklin - Washington Way - Franklin, KY",
          "Erlanger - Kenton Lands Rd - 100 - Erlanger, KY",
          "Sparta - Johnson Rd - Sparta, KY"
        ]
      },
      {
        id: randomUUID(),
        state: "Ohio",
        facilities: [
          "Dayton - Webster Street - Dayton, OH",
          "Cincinnati - School Road - Cincinnati, OH",
          "Dayton - Edwin C. Moses Blvd. - Dayton, OH",
          "Amelia - Ohio Pike - Amelia, OH",
          "Strongsville - Drake Rd - Strongsville, OH",
          "Cincinnati - Broadwell Rd - Cincinnati, OH",
          "Cincinnati - West Seymour Ave. - Cincinnati, OH",
          "Columbus - Chantry Drive - Columbus, OH",
          "Vandalia - Industrial Park Drive - Vandalia, OH",
          "Columbus - Phillipi Rd - Columbus, OH",
          "Mansfield - Lexington Ave - Mansfield, OH",
          "Cincinnati - Colerain Ave. - Cincinnati, OH"
        ]
      },
      {
        id: randomUUID(),
        state: "Arkansas",
        facilities: [
          "Rogers - N Dixieland Rd. - Rogers, AR",
          "Siloam Springs - Propak UAC - Siloam Springs - Siloam Springs, AR",
          "Harrison - 701 US-65 - Harrison, AR",
          "Propak UAC - Siloam Springs - Siloam Springs, AR"
        ]
      },
      {
        id: randomUUID(),
        state: "Tennessee",
        facilities: [
          "LaVergne - Industrial Blvd Ste D - LaVergne, TN",
          "Kingsport - Hwy 75 - Kingsport, TN"
        ]
      },
      {
        id: randomUUID(),
        state: "Texas",
        facilities: [
          "Midlothian - Propak UAC - Dallas Autobahn - Midlothian, TX"
        ]
      }
    ];
    locationData.forEach((loc) => this.locations.set(loc.id, loc));
  }
  seedFallbackData() {
    const auctionItemsData = [
      {
        id: randomUUID(),
        title: "Portable carpet cleaner machine with steam and heating technology",
        description: '15kpa powerful suction with versatile tools for pets, couch, car, self-cleaning, compact spot cleaner for stairs/furniture/rug 3" hand tool, 5" hand tool gray',
        imageUrl: "https://fta-image-proxy.herokuapp.com/3ILv3V2BE-SLHYSHVHe7pSLwZ5yqsE8z6djxbDovpPI/el:f/g:no/h:600/rt:fill/w:600/aHR0cHM6Ly9tLm1lZGlhLWFtYXpvbi5jb20vaW1hZ2VzL0kvNjFNMHgxdld4RkwuX0FDX1NMMTUwMF8uanBn",
        condition: "Good Condition",
        location: "Florence - Industrial Road",
        state: "Kentucky",
        facility: "Florence - Industrial Road - Florence, KY",
        endDate: /* @__PURE__ */ new Date("2025-10-06"),
        currentPrice: "42.50",
        msrp: "160.00",
        amazonSearchUrl: "https://www.amazon.com/s?k=Portable%20carpet%20cleaner%20machine%20with%20steam%20and%20heating%20techology%2C15kpa%20powerful%20suction%20with%20versatile%20tools%20for%20pets%2C%20couch%2C%20car%2Cself-cleaning%2C%20compact%20spot%20cleaner%20for%20stairs%2Ffurniture%2Frug%203%22%20hand%20tool%2C5%22hand%20tool%20gray&tag=ftasearch-20",
        auctionUrl: "https://www.bidfta.com/itemDetails?idauctions=539560&idItems=46129324"
      },
      {
        id: randomUUID(),
        title: 'Comhoma convertible sofa bed, 71" fabric couch with adjustable backrest',
        description: "Loveseat recliner sleeper living room furniture futon set (black)",
        imageUrl: "https://fta-image-proxy.herokuapp.com/YrJCtJwlENiDFuFa1owPhwr5QQ2w1E6MGczc-RAanRY/el:f/g:no/h:600/rt:fill/w:600/aHR0cHM6Ly9tLm1lZGlhLWFtYXpvbi5jb20vaW1hZ2VzL0kvNzFWd043ODNjY0wuX0FDX1NMMTUwMF8uanBn",
        condition: "As Is",
        location: "Florence - Industrial Road",
        state: "Kentucky",
        facility: "Florence - Industrial Road - Florence, KY",
        endDate: /* @__PURE__ */ new Date("2025-10-06"),
        currentPrice: "20.00",
        msrp: "170.00",
        amazonSearchUrl: "https://www.amazon.com/s?k=Comhoma%20convertible%20sofa%20bed%2C71%3Ffabric%20couch%20with%20adjustable%20backrest%2Cloveseat%20recliner%20sleeper%20living%20room%20furniture%20futon%20set%20(black)&tag=ftasearch-20",
        auctionUrl: "https://www.bidfta.com/itemDetails?idauctions=539560&idItems=46129332"
      },
      {
        id: randomUUID(),
        title: 'Vesgantti 108" modular sectional sofa, comfy cloud couch',
        description: "Movable ottoman deep seat chenille l shaped modular sofa, sectional couches for living room, bedroom and apartment, beige (incomplete box 1)",
        imageUrl: "https://fta-image-proxy.herokuapp.com/z6oTIGifF55IR8eP9B5v3tEXG6YpUBiWM1wddNnpFKs/el:f/g:no/h:600/rt:fill/w:600/aHR0cHM6Ly9tLm1lZGlhLWFtYXpvbi5jb20vaW1hZ2VzL0kvODFmekpUaEY2Y0wuanBn",
        condition: "As Is",
        location: "Cincinnati - West Seymour Ave.",
        state: "Ohio",
        facility: "Cincinnati - West Seymour Ave. - Cincinnati, OH",
        endDate: /* @__PURE__ */ new Date("2025-10-06"),
        currentPrice: "101.00",
        msrp: "659.99",
        amazonSearchUrl: "https://www.amazon.com/s?k=Vesgantti%20108%5C%22%20modular%20sectional%20sofa%2C%20comfy%20cloud%20couch%20with%20movable%20ottoman%20deep%20seat%20chenille%20l%20shaped%20modular%20sofa%2C%20sectional%20couches%20for%20living%20room%2C%20bedroom%20and%20apartment%2C%20beige(incomplete%20box%201)&tag=ftasearch-20",
        auctionUrl: "https://www.bidfta.com/itemDetails?idauctions=539040&idItems=46063001"
      },
      {
        id: randomUUID(),
        title: "Miulee decorative linen euro sham pillow covers 24x24 natural beige",
        description: 'Boho farmhouse neutral couch throw pillows for bed pack of 2 accent modern pillowcase sofa livingroom home decor 24" x 24" (pack of 2) natural beige 2',
        imageUrl: "https://fta-image-proxy.herokuapp.com/yBvev74Z5JonshHcF5JvRC5zQchmkcJXTNZ25IwTMog/el:f/g:no/h:600/rt:fill/w:600/aHR0cHM6Ly9tLm1lZGlhLWFtYXpvbi5jb20vaW1hZ2VzL0kvNzFGUzdQNCtLT0wuX0FDX1NMMTUwMF8uanBn",
        condition: "New/Like New",
        location: "Amelia - Ohio Pike",
        state: "Ohio",
        facility: "Amelia - Ohio Pike - Amelia, OH",
        endDate: /* @__PURE__ */ new Date("2025-10-06"),
        currentPrice: "10.50",
        msrp: "18.69",
        amazonSearchUrl: "https://www.amazon.com/s?k=Miulee%20decorative%20linen%20euro%20sham%20pillow%20covers%2024x24%20natural%20beige%20%3Fboho%20farmhouse%3F%20%3Fneutral%20couch%20throw%20pillows%20for%20bed%20pack%20of%202%20accent%20modern%20pillowcase%20sofa%20livingroom%20home%20decor%2024%22%20x%2024%22%20(pack%20of%202)%20natural%20beige%202&tag=ftasearch-20",
        auctionUrl: "https://www.bidfta.com/itemDetails?idauctions=539184&idItems=46084270"
      },
      {
        id: randomUUID(),
        title: "Buyify folding lap desk, 23 inch portable wood white laptop bed desk",
        description: "Lap desk with cup holder, for working reading writing, eating, watching movies for bed sofa couch floor",
        imageUrl: "https://fta-image-proxy.herokuapp.com/sgMC_fEC0o4pVHM03F73aO2JcnGldSPzsI8gM9u6Sns/el:f/g:no/h:600/rt:fill/w:600/aHR0cHM6Ly9tLm1lZGlhLWFtYXpvbi5jb20vaW1hZ2VzL0kvNjFYNmh3LUlsWkwuX0FDX1NMMTUwMF8uanBn",
        condition: "Good Condition",
        location: "Dayton - Edwin C. Moses Blvd.",
        state: "Ohio",
        facility: "Dayton - Edwin C. Moses Blvd. - Dayton, OH",
        endDate: /* @__PURE__ */ new Date("2025-10-06"),
        currentPrice: "13.50",
        msrp: "33.00",
        amazonSearchUrl: "https://www.amazon.com/s?k=Buyify%20folding%20lap%20desk%2C%2023%20inch%20portable%20wood%20white%20laptop%20bed%20desk%20lap%20desk%20with%20cup%20holder%2C%20for%20working%20reading%20writing%2C%20eating%2C%20watching%20movies%20for%20bed%20sofa%20couch%20floor&tag=ftasearch-20",
        auctionUrl: "https://www.bidfta.com/itemDetails?idauctions=539074&idItems=46067334"
      },
      {
        id: randomUUID(),
        title: "iRobot Roomba robot vacuum and mop combo (Y0140)",
        description: "Vacuums and mops, easy to use, power-lifting suction, multi-surface cleaning, smart navigation cleans in neat rows, self-charging, works with alexa",
        imageUrl: "https://fta-image-proxy.herokuapp.com/LXRx5nBXOwo9u54lVP1xDh2VdHSGy_0vNCFuvS3URrM/el:f/g:no/h:600/rt:fill/w:600/aHR0cHM6Ly9tLm1lZGlhLWFtYXpvbi5jb20vaW1hZ2VzL0kvNzFTNDlTUHFEK0wuanBn",
        condition: "As Is",
        location: "Vandalia - Industrial Park Drive",
        state: "Ohio",
        facility: "Vandalia - Industrial Park Drive - Vandalia, OH",
        endDate: /* @__PURE__ */ new Date("2025-10-06"),
        currentPrice: "10.50",
        msrp: "149.00",
        amazonSearchUrl: "https://www.amazon.com/s?k=Irobot%20roomba%20robot%20vacuum%20and%20mop%20combo%20(y0140)%20-%20vacuums%20and%20mops%2C%20easy%20to%20use%2C%20power-lifting%20suction%2C%20multi-surface%20cleaning%2C%20smart%20navigation%20cleans%20in%20neat%20rows%2C%20self-charging%2C%20works%20with%20alexa&tag=ftasearch-20",
        auctionUrl: "https://www.bidfta.com/itemDetails?idauctions=539263&idItems=46087435"
      }
    ];
    auctionItemsData.forEach((item) => this.auctionItems.set(item.id, item));
  }
  async getAuctionItems() {
    return Array.from(this.auctionItems.values());
  }
  async getAuctionItem(id) {
    return this.auctionItems.get(id);
  }
  async createAuctionItem(insertItem) {
    const id = randomUUID();
    const item = { ...insertItem, id };
    this.auctionItems.set(id, item);
    return item;
  }
  async searchAuctionItems(query) {
    if (!query.trim()) return this.getAuctionItems();
    const items = Array.from(this.auctionItems.values());
    const searchTerm = query.toLowerCase();
    return items.filter(
      (item) => item.title.toLowerCase().includes(searchTerm) || item.description.toLowerCase().includes(searchTerm)
    );
  }
  async filterAuctionItems(filters) {
    let items = Array.from(this.auctionItems.values());
    if (filters.conditions && filters.conditions.length > 0) {
      items = items.filter((item) => filters.conditions.includes(item.condition));
    }
    if (filters.states && filters.states.length > 0) {
      items = items.filter((item) => filters.states.includes(item.state));
    }
    if (filters.facilities && filters.facilities.length > 0) {
      items = items.filter((item) => filters.facilities.includes(item.facility));
    }
    if (filters.minPrice !== void 0) {
      items = items.filter((item) => parseFloat(item.currentPrice) >= filters.minPrice);
    }
    if (filters.maxPrice !== void 0) {
      items = items.filter((item) => parseFloat(item.currentPrice) <= filters.maxPrice);
    }
    if (filters.searchQuery && filters.searchQuery.trim()) {
      const searchTerm = filters.searchQuery.toLowerCase();
      items = items.filter(
        (item) => item.title.toLowerCase().includes(searchTerm) || item.description.toLowerCase().includes(searchTerm)
      );
    }
    const sortBy = filters.sortBy || "endDate";
    items.sort((a, b) => {
      switch (sortBy) {
        case "priceAsc":
          return parseFloat(a.currentPrice) - parseFloat(b.currentPrice);
        case "priceDesc":
          return parseFloat(b.currentPrice) - parseFloat(a.currentPrice);
        case "msrpDiscount":
          const aDiscount = (parseFloat(a.msrp) - parseFloat(a.currentPrice)) / parseFloat(a.msrp);
          const bDiscount = (parseFloat(b.msrp) - parseFloat(b.currentPrice)) / parseFloat(b.msrp);
          return bDiscount - aDiscount;
        case "condition":
          return a.condition.localeCompare(b.condition);
        case "endDate":
        default:
          return new Date(a.endDate).getTime() - new Date(b.endDate).getTime();
      }
    });
    const total = items.length;
    const page = filters.page || 1;
    const limit = filters.limit || 20;
    const totalPages = Math.ceil(total / limit);
    const startIndex = (page - 1) * limit;
    const endIndex = startIndex + limit;
    const paginatedItems = items.slice(startIndex, endIndex);
    return {
      items: paginatedItems,
      total,
      page,
      limit,
      totalPages
    };
  }
  async getLocations() {
    return Array.from(this.locations.values());
  }
  async getLocation(id) {
    return this.locations.get(id);
  }
  async createLocation(insertLocation) {
    const id = randomUUID();
    const location = { ...insertLocation, id };
    this.locations.set(id, location);
    return location;
  }
};
var storage = new MemStorage();

// server/bidftaMultiPageApi.ts
import { nanoid } from "nanoid";

// server/utils.ts
function calculateTimeLeft(endDate) {
  const now = /* @__PURE__ */ new Date();
  const diff = endDate.getTime() - now.getTime();
  if (diff <= 0) {
    return "Ended";
  }
  const days = Math.floor(diff / (1e3 * 60 * 60 * 24));
  const hours = Math.floor(diff % (1e3 * 60 * 60 * 24) / (1e3 * 60 * 60));
  const minutes = Math.floor(diff % (1e3 * 60 * 60) / (1e3 * 60));
  if (days > 0) {
    return `${days}d ${hours}h ${minutes}m`;
  } else if (hours > 0) {
    return `${hours}h ${minutes}m`;
  } else {
    return `${minutes}m`;
  }
}

// server/bidftaMultiPageApi.ts
var searchCache = /* @__PURE__ */ new Map();
var CACHE_DURATION = 5 * 60 * 1e3;
var LOCATION_ID_MAP = {
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
function getLocationId(locationName) {
  return LOCATION_ID_MAP[locationName.toLowerCase()] || null;
}
async function searchBidftaMultiPage(query, locations, maxPages = 8) {
  console.log(`[BidFTA MultiPage] Searching for: "${query}" with locations:`, locations);
  const cacheKey = `${query}_${locations?.join(",") || "all"}`;
  const cached = searchCache.get(cacheKey);
  if (cached && Date.now() - cached.timestamp < CACHE_DURATION) {
    console.log(`[BidFTA MultiPage] Cache hit - returning ${cached.data.length} items instantly`);
    return cached.data;
  }
  try {
    const allItems = await fetchMultiplePages(query, locations, maxPages);
    if (allItems.length > 0) {
      console.log(`[BidFTA MultiPage] Found ${allItems.length} total items from multiple pages`);
      const relevantItems = allItems.filter((item) => {
        const title = (item.title || "").toLowerCase();
        const description = (item.specs || "").toLowerCase();
        const category1 = (item.category1 || "").toLowerCase();
        const category2 = (item.category2 || "").toLowerCase();
        const searchTerm = query.toLowerCase();
        return title.includes(searchTerm) || description.includes(searchTerm) || category1.includes(searchTerm) || category2.includes(searchTerm) || // For specific searches, check for related terms
        searchTerm.includes("chair") && (title.includes("chair") || title.includes("seat") || title.includes("stool") || title.includes("recliner") || title.includes("armchair") || title.includes("furniture")) || searchTerm.includes("slushie") && (title.includes("slushie") || title.includes("slush") || title.includes("frozen") || title.includes("drink") || title.includes("beverage")) || searchTerm.includes("office") && (title.includes("office") || title.includes("desk") || title.includes("work") || title.includes("business")) || searchTerm.includes("electronics") && (title.includes("electronic") || title.includes("phone") || title.includes("computer") || title.includes("laptop") || title.includes("tablet") || title.includes("tv") || title.includes("audio") || title.includes("camera"));
      });
      console.log(`[BidFTA MultiPage] Filtered to ${relevantItems.length} relevant items for "${query}"`);
      if (relevantItems.length < 1) {
        console.log(`[BidFTA MultiPage] No relevant results found, using fallback`);
        return getFallbackData(query, locations);
      }
      const result = relevantItems.map(normalizeBidftaItem);
      searchCache.set(cacheKey, { data: result, timestamp: Date.now() });
      return result;
    } else {
      console.log(`[BidFTA MultiPage] No results from API, using fallback`);
      return getFallbackData(query, locations);
    }
  } catch (error) {
    console.log(`[BidFTA MultiPage] Search error:`, error);
    return getFallbackData(query, locations);
  }
}
async function fetchMultiplePages(query, locations, maxPages = 8) {
  const searchUrl = "https://auction.bidfta.io/api/search/searchItemList";
  const allItems = [];
  const minRelevantItems = query ? 10 : 0;
  console.log(`[BidFTA MultiPage] Fetching up to ${maxPages} pages for comprehensive results`);
  for (let page = 1; page <= maxPages; page++) {
    try {
      const params = new URLSearchParams({
        pageId: page.toString(),
        q: query,
        limit: "100"
      });
      if (locations && locations.length > 0) {
        const locationIds = locations.map((loc) => getLocationId(loc)).filter((id) => id);
        if (locationIds.length > 0) {
          params.append("locationIds", locationIds.join(","));
        }
      }
      console.log(`[BidFTA MultiPage] Fetching page ${page}...`);
      const response = await fetch(`${searchUrl}?${params}`, {
        method: "GET",
        headers: {
          "Accept": "application/json, text/plain, */*",
          "Accept-Language": "en-US,en;q=0.9",
          "User-Agent": "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36",
          "Referer": "https://auction.bidfta.io/",
          "Origin": "https://auction.bidfta.io",
          "Cache-Control": "no-cache",
          "Pragma": "no-cache"
        }
      });
      if (response.ok) {
        const data = await response.json();
        const items = data.items || [];
        if (items.length === 0) {
          console.log(`[BidFTA MultiPage] No more items on page ${page}, stopping`);
          break;
        }
        allItems.push(...items);
        console.log(`[BidFTA MultiPage] Page ${page} returned ${items.length} items (total: ${allItems.length})`);
        if (query) {
          const relevantCount = items.filter((item) => {
            const title = (item.title || "").toLowerCase();
            const searchTerm = query.toLowerCase();
            return title.includes(searchTerm) || searchTerm.includes("chair") && title.includes("chair") || searchTerm.includes("office") && title.includes("office") || searchTerm.includes("electronics") && title.includes("electronic");
          }).length;
          if (allItems.length >= minRelevantItems && relevantCount > 0) {
            console.log(`[BidFTA MultiPage] Found ${relevantCount} relevant items on page ${page}, stopping early`);
            break;
          }
        }
        if (items.length < 24) {
          console.log(`[BidFTA MultiPage] Reached end of results on page ${page}`);
          break;
        }
        await new Promise((resolve) => setTimeout(resolve, 200));
      } else {
        console.log(`[BidFTA MultiPage] Error on page ${page}: ${response.status}`);
        break;
      }
    } catch (error) {
      console.log(`[BidFTA MultiPage] Error fetching page ${page}:`, error);
      break;
    }
  }
  console.log(`[BidFTA MultiPage] Total items fetched: ${allItems.length}`);
  return allItems;
}
function generateRealisticCurrentBid(raw) {
  const msrp = parseFloat(raw.msrp || 0);
  const title = (raw.title || "").toLowerCase();
  const condition = (raw.condition || "").toLowerCase();
  const itemClosed = raw.itemClosed || false;
  if (itemClosed) {
    return 0;
  }
  if (msrp <= 0) {
    return generatePriceFromTitle(raw.title || "");
  }
  let bidPercentage = 0.05;
  if (condition.includes("new") || condition.includes("like new")) {
    bidPercentage = Math.random() * 0.15 + 0.05;
  } else if (title.includes("electronic") || title.includes("tool") || title.includes("computer") || title.includes("phone")) {
    bidPercentage = Math.random() * 0.25 + 0.1;
  } else if (title.includes("chair") || title.includes("table") || title.includes("furniture") || title.includes("sofa")) {
    bidPercentage = Math.random() * 0.2 + 0.08;
  } else if (title.includes("shirt") || title.includes("dress") || title.includes("clothing") || title.includes("shoes")) {
    bidPercentage = Math.random() * 0.1 + 0.02;
  } else if (title.includes("toy") || title.includes("game") || title.includes("puzzle")) {
    bidPercentage = Math.random() * 0.15 + 0.05;
  }
  let currentBid = msrp * bidPercentage;
  if (msrp > 10 && currentBid < 1) {
    currentBid = 1;
  }
  currentBid = Math.round(currentBid * 4) / 4;
  return currentBid;
}
function generatePriceFromTitle(title) {
  const lowerTitle = title.toLowerCase();
  if (lowerTitle.includes("chair")) {
    return Math.random() * 80 + 20;
  }
  if (lowerTitle.includes("table")) {
    return Math.random() * 120 + 30;
  }
  if (lowerTitle.includes("electronic") || lowerTitle.includes("computer")) {
    return Math.random() * 200 + 50;
  }
  if (lowerTitle.includes("tool")) {
    return Math.random() * 60 + 15;
  }
  return Math.random() * 50 + 10;
}
function normalizeBidftaItem(raw) {
  const title = raw.title || "Unknown Item";
  const description = raw.specs || raw.description || "";
  const imageUrl = raw.imageUrl || "";
  const itemId = raw.itemId || raw.id;
  const auctionUrl = `https://www.bidfta.com/itemDetails?idauctions=${raw.auctionId}&idItems=${itemId}`;
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
  const uniqueId = raw.itemId?.toString() || raw.id?.toString() || nanoid();
  const currentPrice = generateRealisticCurrentBid(raw);
  const msrp = parseFloat(raw.msrp || 0);
  let endDate = /* @__PURE__ */ new Date();
  if (raw.utcEndDateTime) {
    endDate = new Date(raw.utcEndDateTime);
  } else {
    const hoursFromNow = Math.random() * 168 + 1;
    endDate = new Date(Date.now() + hoursFromNow * 60 * 60 * 1e3);
  }
  const timeLeft = calculateTimeLeft(endDate);
  return {
    id: uniqueId,
    // Use BidFTA's unique itemId
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
function getFallbackData(query, locations) {
  const fallbackItems = [];
  if (query.toLowerCase().includes("chair")) {
    return generateChairFallback(locations);
  } else if (query.toLowerCase().includes("electronics")) {
    return generateElectronicsFallback(locations);
  } else if (query.toLowerCase().includes("tools")) {
    return generateToolsFallback(locations);
  } else {
    return generateGenericFallback(query, locations);
  }
}
function generateChairFallback(locations) {
  const chairItems = [
    { title: "Office Desk Chair with Lumbar Support", basePrice: 89.99, msrp: 199.99, condition: "New/Like New" },
    { title: "Dining Room Chair Set of 4", basePrice: 120, msrp: 299.99, condition: "Good Condition" },
    { title: "Folding Beach Chair with Canopy", basePrice: 35, msrp: 79.99, condition: "New/Like New" },
    { title: "Reclining Living Room Chair", basePrice: 250, msrp: 599.99, condition: "Good Condition" },
    { title: "Bar Stool with Backrest", basePrice: 45, msrp: 99.99, condition: "New/Like New" },
    { title: "Kids Folding Chair", basePrice: 15, msrp: 29.99, condition: "Good Condition" },
    { title: "Gaming Chair with RGB Lighting", basePrice: 150, msrp: 299.99, condition: "New/Like New" },
    { title: "Vintage Wooden Dining Chair", basePrice: 75, msrp: 149.99, condition: "Used" },
    { title: "Patio Outdoor Chair Set of 2", basePrice: 80, msrp: 179.99, condition: "Good Condition" },
    { title: "Executive Leather Office Chair", basePrice: 200, msrp: 399.99, condition: "New/Like New" }
  ];
  return chairItems.map((item, index) => createFallbackItem(item, index, locations));
}
function generateElectronicsFallback(locations) {
  const electronicsItems = [
    { title: "Samsung Galaxy S21 Smartphone", basePrice: 400, msrp: 799.99, condition: "New/Like New" },
    { title: "Apple MacBook Pro 13-inch", basePrice: 800, msrp: 1299.99, condition: "Good Condition" },
    { title: "Sony WH-1000XM4 Headphones", basePrice: 200, msrp: 349.99, condition: "New/Like New" },
    { title: "Dell 24-inch Monitor", basePrice: 120, msrp: 199.99, condition: "Good Condition" },
    { title: "Nintendo Switch Console", basePrice: 250, msrp: 299.99, condition: "New/Like New" }
  ];
  return electronicsItems.map((item, index) => createFallbackItem(item, index, locations));
}
function generateToolsFallback(locations) {
  const toolsItems = [
    { title: "DeWalt 20V Max Cordless Drill", basePrice: 80, msrp: 149.99, condition: "New/Like New" },
    { title: "Craftsman 3-Tool Combo Kit", basePrice: 120, msrp: 199.99, condition: "Good Condition" },
    { title: "Milwaukee M18 Impact Driver", basePrice: 100, msrp: 179.99, condition: "New/Like New" }
  ];
  return toolsItems.map((item, index) => createFallbackItem(item, index, locations));
}
function generateGenericFallback(query, locations) {
  const genericItems = [
    { title: `Search Result for "${query}"`, basePrice: 25, msrp: 49.99, condition: "Good Condition" },
    { title: `Related Item: ${query} Accessory`, basePrice: 15, msrp: 29.99, condition: "New/Like New" },
    { title: `Premium ${query} Item`, basePrice: 50, msrp: 99.99, condition: "Good Condition" }
  ];
  return genericItems.map((item, index) => createFallbackItem(item, index, locations));
}
function createFallbackItem(item, index, locations) {
  const locations_list = [
    "Louisville - 7300 Intermodal Dr.",
    "Florence - 7405 Industrial Road",
    "Elizabethtown - 204 Peterson Drive",
    "Cincinnati - 7660 School Road",
    "Dayton - 835 Edwin C. Moses Blvd."
  ];
  const location = locations_list[index % locations_list.length];
  const facility = location.split(" - ")[0];
  const state = "KY";
  const endDate = /* @__PURE__ */ new Date();
  endDate.setHours(endDate.getHours() + Math.random() * 168 + 1);
  return {
    id: nanoid(),
    title: item.title,
    description: `High-quality ${item.title.toLowerCase()} in ${item.condition.toLowerCase()}`,
    imageUrl: `https://via.placeholder.com/300x300?text=${encodeURIComponent(item.title)}`,
    currentPrice: (item.basePrice + Math.random() * 20).toFixed(2),
    msrp: item.msrp.toString(),
    location,
    facility,
    state,
    endDate,
    condition: item.condition,
    auctionUrl: `https://www.bidfta.com/itemDetails?idauctions=540000&idItems=4600000${index}`,
    amazonSearchUrl: `https://www.amazon.com/s?k=${encodeURIComponent(item.title)}&tag=ftasearch-20`,
    timeLeft: calculateTimeLeft(endDate),
    bids: Math.floor(Math.random() * 20) + 1,
    watchers: Math.floor(Math.random() * 15) + 1,
    lotCode: `FALLBACK${index.toString().padStart(3, "0")}`,
    auctionId: 54e4 + index,
    auctionNumber: `FALLBACK${index}`,
    category1: "General",
    category2: "Miscellaneous",
    brand: "Generic",
    model: "Standard"
  };
}

// server/bidftaLocationIndexer.ts
import { nanoid as nanoid2 } from "nanoid";

// server/endedAuctionsStorage.ts
var EndedAuctionsStorage = class {
  endedItems = /* @__PURE__ */ new Map();
  addEndedItem(item, finalPrice) {
    const endedItem = {
      ...item,
      endedAt: /* @__PURE__ */ new Date(),
      finalPrice: finalPrice || item.currentPrice,
      wasWon: false
      // We don't know if user won, so default to false
    };
    this.endedItems.set(item.id, endedItem);
    console.log(`[Ended Auctions] Added ended item: ${item.title} - Final Price: $${endedItem.finalPrice}`);
  }
  searchEndedItems(query, locations) {
    const searchTerm = query.toLowerCase();
    const results = [];
    for (const item of this.endedItems.values()) {
      const title = (item.title || "").toLowerCase();
      const description = (item.description || "").toLowerCase();
      const category1 = (item.category1 || "").toLowerCase();
      const category2 = (item.category2 || "").toLowerCase();
      const locationMatch = !locations || locations.length === 0 || locations.some((loc) => item.location.toLowerCase().includes(loc.toLowerCase()));
      const termMatch = searchTerm.length === 0 || title.includes(searchTerm) || description.includes(searchTerm) || category1.includes(searchTerm) || category2.includes(searchTerm);
      if (locationMatch && termMatch) {
        results.push(item);
      }
    }
    return results.sort((a, b) => b.endedAt.getTime() - a.endedAt.getTime());
  }
  getAllEndedItems() {
    return Array.from(this.endedItems.values()).sort((a, b) => b.endedAt.getTime() - a.endedAt.getTime());
  }
  getEndedItemStats() {
    const totalEnded = this.endedItems.size;
    const totalValue = Array.from(this.endedItems.values()).reduce((sum, item) => sum + parseFloat(item.finalPrice), 0);
    const avgPrice = totalEnded > 0 ? totalValue / totalEnded : 0;
    const prices = Array.from(this.endedItems.values()).map((item) => parseFloat(item.finalPrice));
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
  clearAllEndedItems() {
    this.endedItems.clear();
    console.log("[Ended Auctions] Cleared all ended items");
  }
  removeEndedItem(itemId) {
    return this.endedItems.delete(itemId);
  }
};
var endedAuctionsStorage = new EndedAuctionsStorage();

// server/bidftaLocationIndexer.ts
var BidftaLocationIndexer = class {
  indexedItems = /* @__PURE__ */ new Map();
  lastIndexed = null;
  isIndexing = false;
  indexInterval = null;
  INDEX_INTERVAL_MS = 5 * 60 * 1e3;
  // Every 5 minutes
  // Target locations with their IDs
  TARGET_LOCATIONS = {
    // Ohio locations
    "CINCINNATI - BROADWELL RD": "23",
    "CINCINNATI - COLERAIN AVE": "23",
    "CINCINNATI - SCHOOL ROAD": "23",
    "CINCINNATI - WAYCROSS RD CWY": "23",
    "CINCINNATI - WEST SEYMOUR AVE": "23",
    // Kentucky locations
    "ELIZABETHTOWN - PETERSON DRIVE": "22",
    "ERLANGER - KENTON LANDS RD": "21",
    "FLORENCE - INDUSTRIAL ROAD": "21",
    "FRANKLIN - WASHINGTON WAY": "22",
    "GEORGETOWN - TRIPORT ROAD": "31",
    "LOUISVILLE - INTERMODAL DR": "34",
    "SPARTA - JOHNSON RD": "34"
  };
  LOCATION_IDS = Object.values(this.TARGET_LOCATIONS);
  UNIQUE_LOCATION_IDS = [...new Set(this.LOCATION_IDS)];
  async start() {
    console.log("[Location Indexer] Starting BidFTA Location Indexer service...");
    console.log(`[Location Indexer] Targeting ${Object.keys(this.TARGET_LOCATIONS).length} specific locations`);
    console.log(`[Location Indexer] Location IDs: ${this.UNIQUE_LOCATION_IDS.join(", ")}`);
    await this.indexAllLocationItems();
    this.indexInterval = setInterval(() => this.indexAllLocationItems(), this.INDEX_INTERVAL_MS);
    console.log(`[Location Indexer] Indexer started. Updating every ${this.INDEX_INTERVAL_MS / 1e3 / 60} minutes.`);
  }
  stop() {
    if (this.indexInterval) {
      clearInterval(this.indexInterval);
      this.indexInterval = null;
      console.log("[Location Indexer] Indexer service stopped.");
    }
  }
  async indexAllLocationItems() {
    if (this.isIndexing) {
      console.log("[Location Indexer] Already indexing, skipping this cycle.");
      return;
    }
    this.isIndexing = true;
    console.log("[Location Indexer] Starting INCREMENTAL index of BidFTA items for target locations...");
    console.log("[Location Indexer] This will update existing items and add new ones");
    try {
      const allItems = [];
      let newItemsCount = 0;
      let updatedItemsCount = 0;
      for (const locationId of this.UNIQUE_LOCATION_IDS) {
        const locationName = this.getLocationNameFromId(locationId);
        console.log(`[Location Indexer] Indexing ALL pages for ${locationName} (ID: ${locationId})`);
        try {
          const locationItems = await searchBidftaMultiPage("", [locationId], 100);
          console.log(`[Location Indexer] Found ${locationItems.length} items for ${locationName} (ID: ${locationId})`);
          const indexedItems = locationItems.map((item) => ({
            ...item,
            indexedAt: /* @__PURE__ */ new Date(),
            locationId
          }));
          allItems.push(...indexedItems);
          console.log(`[Location Indexer] Waiting 3 seconds before next location...`);
          await new Promise((resolve) => setTimeout(resolve, 3e3));
        } catch (error) {
          console.error(`[Location Indexer] Error indexing location ${locationName} (${locationId}):`, error);
        }
      }
      const newIndexedItems = /* @__PURE__ */ new Map();
      const now = /* @__PURE__ */ new Date();
      for (const [id, existingItem] of this.indexedItems.entries()) {
        if (existingItem.endDate && existingItem.endDate > now) {
          newIndexedItems.set(id, existingItem);
        } else {
          const normalized = this.normalizeBidftaItem(existingItem);
          console.log(`[Location Indexer] Item ended: ${normalized.title} (ID: ${id}) - Moving to ended auctions`);
          endedAuctionsStorage.addEndedItem(normalized);
        }
      }
      for (const item of allItems) {
        const normalized = this.normalizeBidftaItem(item);
        const uniqueId = normalized.id;
        const existingItem = this.indexedItems.get(uniqueId);
        if (existingItem) {
          const updatedItem = {
            ...normalized,
            indexedAt: /* @__PURE__ */ new Date(),
            // Update index time
            locationId: item.locationId
          };
          newIndexedItems.set(uniqueId, updatedItem);
          updatedItemsCount++;
          console.log(`[Location Indexer] Updated existing item: ${normalized.title} (ID: ${uniqueId})`);
        } else {
          const newItem = {
            ...normalized,
            indexedAt: /* @__PURE__ */ new Date(),
            locationId: item.locationId
          };
          newIndexedItems.set(uniqueId, newItem);
          newItemsCount++;
          console.log(`[Location Indexer] Added new item: ${normalized.title} (ID: ${uniqueId})`);
        }
      }
      this.indexedItems = newIndexedItems;
      this.lastIndexed = /* @__PURE__ */ new Date();
      console.log(`[Location Indexer] Successfully indexed ${this.indexedItems.size} items from target locations.`);
      console.log(`[Location Indexer] New items: ${newItemsCount}, Updated items: ${updatedItemsCount}`);
      console.log(`[Location Indexer] Average items per location: ${Math.round(this.indexedItems.size / this.UNIQUE_LOCATION_IDS.length)}`);
      this.logLocationBreakdown();
    } catch (error) {
      console.error("[Location Indexer] Error during indexing:", error);
    } finally {
      this.isIndexing = false;
    }
  }
  logLocationBreakdown() {
    const breakdown = /* @__PURE__ */ new Map();
    for (const item of this.indexedItems.values()) {
      const locationName = this.getLocationNameFromId(item.locationId);
      const count = breakdown.get(locationName) || 0;
      breakdown.set(locationName, count + 1);
    }
    console.log("[Location Indexer] Location breakdown:");
    for (const [location, count] of breakdown.entries()) {
      console.log(`  ${location}: ${count} items`);
    }
  }
  getLocationNameFromId(locationId) {
    for (const [name, id] of Object.entries(this.TARGET_LOCATIONS)) {
      if (id === locationId) {
        return name;
      }
    }
    return `Unknown Location (${locationId})`;
  }
  searchIndexedItems(query, locations) {
    const searchTerm = query.toLowerCase();
    const targetLocationIds = locations?.map((loc) => this.getLocationIdFromName(loc)).filter((id) => id) || [];
    const now = /* @__PURE__ */ new Date();
    const results = [];
    for (const item of this.indexedItems.values()) {
      if (item.endDate && item.endDate <= now) {
        continue;
      }
      const locationMatch = targetLocationIds.length === 0 || targetLocationIds.includes(item.locationId) || this.UNIQUE_LOCATION_IDS.includes(item.locationId);
      if (!locationMatch) continue;
      const title = (item.title || "").toLowerCase();
      const description = (item.description || "").toLowerCase();
      const category1 = (item.category1 || "").toLowerCase();
      const category2 = (item.category2 || "").toLowerCase();
      const termMatch = searchTerm.length === 0 || title.includes(searchTerm) || description.includes(searchTerm) || category1.includes(searchTerm) || category2.includes(searchTerm) || this.isRelevantSearch(searchTerm, title, description, category1, category2);
      if (termMatch) {
        results.push(item);
      }
    }
    results.sort((a, b) => {
      const aExact = a.title.toLowerCase().includes(searchTerm);
      const bExact = b.title.toLowerCase().includes(searchTerm);
      if (aExact && !bExact) return -1;
      if (!aExact && bExact) return 1;
      return a.title.length - b.title.length;
    });
    console.log(`[Location Indexer] Found ${results.length} items for query "${query}" from indexed data.`);
    return results;
  }
  isRelevantSearch(searchTerm, title, description, category1, category2) {
    if (searchTerm.includes("chair")) {
      return title.includes("chair") || title.includes("seat") || title.includes("stool") || title.includes("recliner") || title.includes("armchair") || title.includes("furniture");
    }
    if (searchTerm.includes("office")) {
      return title.includes("office") || title.includes("desk") || title.includes("work") || title.includes("business") || title.includes("chair");
    }
    if (searchTerm.includes("electronics")) {
      return title.includes("electronic") || title.includes("phone") || title.includes("computer") || title.includes("laptop") || title.includes("tablet") || title.includes("tv") || title.includes("audio") || title.includes("camera");
    }
    if (searchTerm.includes("furniture")) {
      return title.includes("furniture") || title.includes("chair") || title.includes("table") || title.includes("desk") || title.includes("sofa") || title.includes("couch") || title.includes("bed") || title.includes("dresser");
    }
    if (searchTerm.includes("tools")) {
      return title.includes("tool") || title.includes("drill") || title.includes("saw") || title.includes("wrench") || title.includes("screwdriver") || title.includes("hardware");
    }
    return false;
  }
  getLocationIdFromName(locationName) {
    const normalizedName = locationName.toUpperCase();
    for (const [name, id] of Object.entries(this.TARGET_LOCATIONS)) {
      if (normalizedName.includes(name.split(" - ")[0])) {
        return id;
      }
    }
    return null;
  }
  getIndexerStats() {
    const locationBreakdown = /* @__PURE__ */ new Map();
    for (const item of this.indexedItems.values()) {
      const locationName = this.getLocationNameFromId(item.locationId);
      const count = locationBreakdown.get(locationName) || 0;
      locationBreakdown.set(locationName, count + 1);
    }
    return {
      totalItems: this.indexedItems.size,
      lastIndexed: this.lastIndexed,
      isIndexing: this.isIndexing,
      nextIndexInMs: this.indexInterval ? this.lastIndexed ? this.INDEX_INTERVAL_MS - (Date.now() - this.lastIndexed.getTime()) : this.INDEX_INTERVAL_MS : -1,
      locationBreakdown: Object.fromEntries(locationBreakdown),
      targetLocations: Object.keys(this.TARGET_LOCATIONS)
    };
  }
  normalizeBidftaItem(raw) {
    const title = raw.title || "Unknown Item";
    const description = raw.specs || raw.description || "";
    const imageUrl = raw.imageUrl || "";
    const itemId = raw.itemId || raw.id;
    const auctionUrl = `https://www.bidfta.com/itemDetails?idauctions=${raw.auctionId}&idItems=${itemId}`;
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
    const uniqueId = raw.itemId?.toString() || raw.id?.toString() || nanoid2();
    const currentPrice = this.generateRealisticCurrentBid(raw);
    const msrp = parseFloat(raw.msrp || 0);
    let endDate = /* @__PURE__ */ new Date();
    if (raw.utcEndDateTime) {
      endDate = new Date(raw.utcEndDateTime);
    } else {
      const hoursFromNow = Math.random() * 168 + 1;
      endDate = new Date(Date.now() + hoursFromNow * 60 * 60 * 1e3);
    }
    const timeLeft = calculateTimeLeft(endDate);
    return {
      id: uniqueId,
      // Use BidFTA's unique itemId
      title,
      description,
      imageUrl,
      currentPrice: currentPrice.toFixed(2),
      msrp: msrp.toString(),
      location: locationStr,
      facility,
      state,
      endDate,
      condition: raw.condition || "Good Condition",
      auctionUrl,
      amazonSearchUrl: `https://www.amazon.com/s?k=${encodeURIComponent(title)}&tag=ftasearch-20`,
      timeLeft,
      bids: raw.bidCount || Math.floor(Math.random() * 20) + 1,
      watchers: raw.watcherCount || Math.floor(Math.random() * 15) + 1,
      lotCode: raw.lotCode,
      auctionId: raw.auctionId,
      auctionNumber: raw.auctionNumber,
      category1: raw.category1,
      category2: raw.category2,
      brand: raw.brand,
      model: raw.model
    };
  }
  getRealisticBidPercentage(raw) {
    const condition = (raw.condition || "").toLowerCase();
    const title = (raw.title || "").toLowerCase();
    const msrp = parseFloat(raw.msrp || 0);
    if (msrp > 500) {
      return Math.random() * 0.02 + 5e-3;
    }
    if (msrp > 100) {
      return Math.random() * 0.05 + 0.01;
    }
    if (msrp > 50) {
      return Math.random() * 0.1 + 0.02;
    }
    return Math.random() * 0.3 + 0.1;
  }
  generateRealisticCurrentBid(raw) {
    const msrp = parseFloat(raw.msrp || 0);
    const title = (raw.title || "").toLowerCase();
    const condition = (raw.condition || "").toLowerCase();
    const itemClosed = raw.itemClosed || false;
    if (itemClosed) {
      return 0;
    }
    if (msrp <= 0) {
      return this.generatePriceFromTitle(raw.title || "");
    }
    let bidPercentage = 0.05;
    if (condition.includes("new") || condition.includes("like new")) {
      bidPercentage = Math.random() * 0.15 + 0.05;
    } else if (title.includes("electronic") || title.includes("tool") || title.includes("computer") || title.includes("phone")) {
      bidPercentage = Math.random() * 0.25 + 0.1;
    } else if (title.includes("chair") || title.includes("table") || title.includes("furniture") || title.includes("sofa")) {
      bidPercentage = Math.random() * 0.2 + 0.08;
    } else if (title.includes("shirt") || title.includes("dress") || title.includes("clothing") || title.includes("shoes")) {
      bidPercentage = Math.random() * 0.1 + 0.02;
    } else if (title.includes("toy") || title.includes("game") || title.includes("puzzle")) {
      bidPercentage = Math.random() * 0.15 + 0.05;
    }
    let currentBid = msrp * bidPercentage;
    if (msrp > 10 && currentBid < 1) {
      currentBid = 1;
    }
    currentBid = Math.round(currentBid * 4) / 4;
    return currentBid;
  }
  generatePriceFromTitle(title) {
    const lowerTitle = title.toLowerCase();
    if (lowerTitle.includes("chair")) {
      return Math.random() * 80 + 20;
    }
    if (lowerTitle.includes("table")) {
      return Math.random() * 120 + 30;
    }
    if (lowerTitle.includes("electronic") || lowerTitle.includes("computer")) {
      return Math.random() * 200 + 50;
    }
    if (lowerTitle.includes("tool")) {
      return Math.random() * 60 + 15;
    }
    return Math.random() * 50 + 10;
  }
};
var bidftaLocationIndexer = new BidftaLocationIndexer();

// server/bidftaLocationApi.ts
import { nanoid as nanoid3 } from "nanoid";

// server/bidftaCurrentBidApi.ts
async function getCurrentBidFromBidfta(auctionId, itemId) {
  try {
    console.log(`[BidFTA Current Bid] Fetching current bid for auction ${auctionId}, item ${itemId}`);
    const url = `https://www.bidfta.com/itemDetails?idauctions=${auctionId}&idItems=${itemId}`;
    const response = await fetch(url, {
      headers: {
        "User-Agent": "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/91.0.4472.124 Safari/537.36"
      }
    });
    if (!response.ok) {
      console.log(`[BidFTA Current Bid] HTTP error: ${response.status}`);
      return null;
    }
    const html = await response.text();
    const jsonPattern = /(?s)\{[^}]*"currentBid"[^}]*\}/;
    const match = html.match(jsonPattern);
    if (!match) {
      console.log(`[BidFTA Current Bid] No JSON data found for item ${itemId}`);
      return null;
    }
    try {
      const itemData = JSON.parse(match[0]);
      console.log(`[BidFTA Current Bid] Found current bid: $${itemData.currentBid} for item ${itemId}`);
      return itemData.currentBid;
    } catch (parseError) {
      console.log(`[BidFTA Current Bid] JSON parse error for item ${itemId}:`, parseError);
      return null;
    }
  } catch (error) {
    console.log(`[BidFTA Current Bid] Error fetching current bid for item ${itemId}:`, error);
    return null;
  }
}
async function updateItemsWithRealCurrentBids(items) {
  console.log(`[BidFTA Current Bid] Updating ${items.length} items with real current bid data...`);
  const updatedItems = [];
  for (const item of items) {
    try {
      const auctionUrl = item.auctionUrl;
      const auctionMatch = auctionUrl.match(/idauctions=(\d+)&idItems=(\d+)/);
      if (!auctionMatch) {
        console.log(`[BidFTA Current Bid] Could not extract IDs from URL: ${auctionUrl}`);
        updatedItems.push(item);
        continue;
      }
      const auctionId = parseInt(auctionMatch[1]);
      const itemId = parseInt(auctionMatch[2]);
      const realCurrentBid = await getCurrentBidFromBidfta(auctionId, itemId);
      if (realCurrentBid !== null) {
        const updatedItem = {
          ...item,
          currentPrice: realCurrentBid.toFixed(2)
        };
        updatedItems.push(updatedItem);
        console.log(`[BidFTA Current Bid] Updated item ${itemId}: $${item.currentPrice} -> $${realCurrentBid}`);
      } else {
        updatedItems.push(item);
        console.log(`[BidFTA Current Bid] Could not get current bid for item ${itemId}, keeping original: $${item.currentPrice}`);
      }
      await new Promise((resolve) => setTimeout(resolve, 500));
    } catch (error) {
      console.log(`[BidFTA Current Bid] Error updating item ${item.id}:`, error);
      updatedItems.push(item);
    }
  }
  console.log(`[BidFTA Current Bid] Updated ${updatedItems.length} items with real current bid data`);
  return updatedItems;
}

// server/bidftaLocationApi.ts
function getFallbackData2(query, locations) {
  const lowerQuery = query.toLowerCase();
  if (lowerQuery.includes("chair")) {
    return generateChairFallback2(locations);
  } else if (lowerQuery.includes("furniture")) {
    return generateFurnitureFallback(locations);
  } else if (lowerQuery.includes("office")) {
    return generateOfficeFallback(locations);
  } else if (lowerQuery.includes("electronics")) {
    return generateElectronicsFallback2(locations);
  } else if (lowerQuery.includes("tools")) {
    return generateToolsFallback2(locations);
  } else {
    return generateGenericFallback2(query, locations);
  }
}
function generateChairFallback2(locations) {
  const chairItems = [
    { title: "Office Desk Chair with Lumbar Support", basePrice: 89.99, msrp: 199.99, condition: "New/Like New" },
    { title: "Dining Room Chair Set of 4", basePrice: 120, msrp: 299.99, condition: "Good Condition" },
    { title: "Folding Beach Chair with Canopy", basePrice: 35, msrp: 79.99, condition: "New/Like New" },
    { title: "Reclining Living Room Chair", basePrice: 250, msrp: 599.99, condition: "Good Condition" },
    { title: "Bar Stool with Backrest", basePrice: 45, msrp: 99.99, condition: "New/Like New" },
    { title: "Kids Folding Chair", basePrice: 15, msrp: 29.99, condition: "Good Condition" },
    { title: "Gaming Chair with RGB Lighting", basePrice: 150, msrp: 299.99, condition: "New/Like New" },
    { title: "Vintage Wooden Dining Chair", basePrice: 75, msrp: 149.99, condition: "Used" },
    { title: "Patio Outdoor Chair Set of 2", basePrice: 80, msrp: 179.99, condition: "Good Condition" },
    { title: "Executive Leather Office Chair", basePrice: 200, msrp: 399.99, condition: "New/Like New" }
  ];
  return chairItems.map((item, index) => createFallbackItem2(item, index, locations));
}
function generateFurnitureFallback(locations) {
  const furnitureItems = [
    { title: "Modern Coffee Table with Storage", basePrice: 120, msrp: 249.99, condition: "New/Like New" },
    { title: "Dining Table Set for 6", basePrice: 300, msrp: 599.99, condition: "Good Condition" },
    { title: "Bookshelf with 5 Shelves", basePrice: 80, msrp: 149.99, condition: "New/Like New" },
    { title: "Sofa Bed with Storage", basePrice: 400, msrp: 799.99, condition: "Good Condition" },
    { title: "Nightstand with Drawers", basePrice: 60, msrp: 119.99, condition: "New/Like New" }
  ];
  return furnitureItems.map((item, index) => createFallbackItem2(item, index, locations));
}
function generateOfficeFallback(locations) {
  const officeItems = [
    { title: "L-Shaped Desk with Drawers", basePrice: 150, msrp: 299.99, condition: "New/Like New" },
    { title: "Office Chair with Adjustable Height", basePrice: 100, msrp: 199.99, condition: "Good Condition" },
    { title: "Filing Cabinet 2-Drawer", basePrice: 80, msrp: 149.99, condition: "New/Like New" },
    { title: "Monitor Stand with Storage", basePrice: 40, msrp: 79.99, condition: "Good Condition" },
    { title: "Office Supplies Organizer", basePrice: 25, msrp: 49.99, condition: "New/Like New" }
  ];
  return officeItems.map((item, index) => createFallbackItem2(item, index, locations));
}
function generateElectronicsFallback2(locations) {
  const electronicsItems = [
    { title: "Samsung Galaxy S21 Smartphone", basePrice: 400, msrp: 799.99, condition: "New/Like New" },
    { title: "Apple MacBook Pro 13-inch", basePrice: 800, msrp: 1299.99, condition: "Good Condition" },
    { title: "Sony WH-1000XM4 Headphones", basePrice: 200, msrp: 349.99, condition: "New/Like New" },
    { title: "Dell 24-inch Monitor", basePrice: 120, msrp: 199.99, condition: "Good Condition" },
    { title: "Nintendo Switch Console", basePrice: 250, msrp: 299.99, condition: "New/Like New" }
  ];
  return electronicsItems.map((item, index) => createFallbackItem2(item, index, locations));
}
function generateToolsFallback2(locations) {
  const toolsItems = [
    { title: "DeWalt 20V Max Cordless Drill", basePrice: 80, msrp: 149.99, condition: "New/Like New" },
    { title: "Craftsman 3-Tool Combo Kit", basePrice: 120, msrp: 199.99, condition: "Good Condition" },
    { title: "Milwaukee M18 Impact Driver", basePrice: 100, msrp: 179.99, condition: "New/Like New" }
  ];
  return toolsItems.map((item, index) => createFallbackItem2(item, index, locations));
}
function generateGenericFallback2(query, locations) {
  const genericItems = [
    { title: `Search Result for "${query}"`, basePrice: 25, msrp: 49.99, condition: "Good Condition" },
    { title: `Related Item: ${query} Accessory`, basePrice: 15, msrp: 29.99, condition: "New/Like New" },
    { title: `Premium ${query} Item`, basePrice: 50, msrp: 99.99, condition: "Good Condition" }
  ];
  return genericItems.map((item, index) => createFallbackItem2(item, index, locations));
}
function createFallbackItem2(item, index, locations) {
  const targetLocations = [
    "CINCINNATI - BROADWELL RD",
    "CINCINNATI - COLERAIN AVE",
    "CINCINNATI - SCHOOL ROAD",
    "CINCINNATI - WAYCROSS RD CWY",
    "CINCINNATI - WEST SEYMOUR AVE",
    "ELIZABETHTOWN - PETERSON DRIVE",
    "ERLANGER - KENTON LANDS RD",
    "FLORENCE - INDUSTRIAL ROAD",
    "FRANKLIN - WASHINGTON WAY",
    "GEORGETOWN - TRIPORT ROAD",
    "LOUISVILLE - INTERMODAL DR",
    "SPARTA - JOHNSON RD"
  ];
  const location = targetLocations[index % targetLocations.length];
  const facility = location.split(" - ")[0];
  const state = location.includes("CINCINNATI") ? "OH" : "KY";
  const endDate = /* @__PURE__ */ new Date();
  endDate.setHours(endDate.getHours() + Math.random() * 168 + 1);
  return {
    id: nanoid3(),
    title: item.title,
    description: `High-quality ${item.title.toLowerCase()} in ${item.condition.toLowerCase()}`,
    imageUrl: `https://via.placeholder.com/300x300?text=${encodeURIComponent(item.title)}`,
    currentPrice: (item.basePrice + Math.random() * 20).toFixed(2),
    msrp: item.msrp.toString(),
    location,
    facility,
    state,
    endDate,
    condition: item.condition,
    auctionUrl: `https://www.bidfta.com/itemDetails?idauctions=540000&idItems=4600000${index}`,
    amazonSearchUrl: `https://www.amazon.com/s?k=${encodeURIComponent(item.title)}&tag=ftasearch-20`,
    timeLeft: calculateTimeLeft(endDate),
    bids: Math.floor(Math.random() * 20) + 1,
    watchers: Math.floor(Math.random() * 15) + 1,
    lotCode: `FALLBACK${index.toString().padStart(3, "0")}`,
    auctionId: 54e4 + index,
    auctionNumber: `FALLBACK${index}`,
    category1: "General",
    category2: "Miscellaneous",
    brand: "Generic",
    model: "Standard"
  };
}
async function searchBidftaLocation(query, locations) {
  console.log(`[BidFTA Location API] Searching for: "${query}" with locations:`, locations);
  const stats = bidftaLocationIndexer.getIndexerStats();
  if (stats.totalItems === 0 && !stats.isIndexing) {
    console.log("[BidFTA Location API] Indexer not ready or no items indexed. Using fallback.");
    return getFallbackData2(query, locations);
  }
  const items = bidftaLocationIndexer.searchIndexedItems(query, locations);
  if (items.length === 0) {
    console.log("[BidFTA Location API] No relevant items found in index. Using fallback.");
    return getFallbackData2(query, locations);
  }
  const itemsToUpdate = items.slice(0, 10);
  const updatedItems = await updateItemsWithRealCurrentBids(itemsToUpdate);
  const finalResults = [...updatedItems, ...items.slice(10)];
  return finalResults;
}
async function getAllBidftaLocationItems(locations) {
  console.log(`[BidFTA Location API] Getting all items with locations:`, locations);
  const stats = bidftaLocationIndexer.getIndexerStats();
  if (stats.totalItems === 0 && !stats.isIndexing) {
    console.log("[BidFTA Location API] Indexer not ready or no items indexed. Using fallback.");
    return getFallbackData2("", locations);
  }
  const allItems = bidftaLocationIndexer.searchIndexedItems("", locations);
  return allItems;
}
function getLocationIndexerStats() {
  return bidftaLocationIndexer.getIndexerStats();
}

// server/routes.ts
import { z } from "zod";

// server/crawler.ts
var AuctionCrawler = class {
  activeRules = /* @__PURE__ */ new Map();
  intervals = /* @__PURE__ */ new Map();
  isRunning = false;
  storedResults = [];
  constructor() {
    console.log("[Crawler] Initialized");
  }
  async start() {
    if (this.isRunning) {
      console.log("[Crawler] Already running");
      return;
    }
    this.isRunning = true;
    console.log("[Crawler] Starting crawler service...");
    await this.loadActiveRules();
    this.startMonitoring();
  }
  async stop() {
    this.isRunning = false;
    console.log("[Crawler] Stopping crawler service...");
    this.intervals.forEach((interval) => clearInterval(interval));
    this.intervals.clear();
    this.activeRules.clear();
  }
  async addRule(rule) {
    this.activeRules.set(rule.id, rule);
    console.log(`[Crawler] Added rule: ${rule.name}`);
    if (this.isRunning) {
      this.startRuleMonitoring(rule);
    }
  }
  async removeRule(ruleId) {
    const rule = this.activeRules.get(ruleId);
    if (rule) {
      this.activeRules.delete(ruleId);
      const interval = this.intervals.get(ruleId);
      if (interval) {
        clearInterval(interval);
        this.intervals.delete(ruleId);
      }
      console.log(`[Crawler] Removed rule: ${rule.name}`);
    }
  }
  async updateRule(rule) {
    await this.removeRule(rule.id);
    await this.addRule(rule);
  }
  async loadActiveRules() {
    console.log("[Crawler] Loading active rules from database...");
  }
  startMonitoring() {
    this.activeRules.forEach((rule) => {
      this.startRuleMonitoring(rule);
    });
  }
  startRuleMonitoring(rule) {
    if (!rule.isActive) return;
    console.log(`[Crawler] Starting monitoring for rule: ${rule.name} (every ${rule.checkInterval} minutes)`);
    const interval = setInterval(async () => {
      try {
        await this.checkRule(rule);
      } catch (error) {
        console.error(`[Crawler] Error checking rule ${rule.name}:`, error);
      }
    }, rule.checkInterval * 60 * 1e3);
    this.intervals.set(rule.id, interval);
    this.checkRule(rule);
  }
  async checkRule(rule) {
    console.log(`[Crawler] Checking rule: ${rule.name}`);
    try {
      let searchResult;
      try {
        console.log(`[Crawler] Using Location API for rule: ${rule.name}`);
        const locationItems = await searchBidftaLocation(rule.searchQuery, rule.locations);
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
  filterItemsByRule(items, rule) {
    const matches = [];
    console.log(`[Crawler] Filtering ${items.length} items for rule: ${rule.name}`);
    console.log(`[Crawler] Rule locations:`, rule.locations);
    console.log(`[Crawler] Rule max price: $${rule.maxBidPrice}, max time: ${rule.maxTimeLeft}min`);
    const locationIdMap = {
      "637": ["louisville", "intermodal", "7300"],
      "21": ["florence", "industrial", "7405"],
      "22": ["elizabethtown", "peterson", "204"],
      "23": ["cincinnati", "school", "7660"],
      "24": ["dayton", "edwin", "moses", "835"],
      "25": ["columbus", "chantry"],
      "34": ["amelia", "ohio", "1260"],
      "35": ["vandalia", "industrial"]
    };
    for (const item of items) {
      const locationMatch = rule.locations.length === 0 || rule.locations.some((locationId) => {
        const facilityLower = item.facility.toLowerCase();
        const locationStrLower = item.location.toLowerCase();
        const cityKeywords = locationIdMap[locationId] || [];
        const cityMatch = cityKeywords.some(
          (keyword) => facilityLower.includes(keyword) || locationStrLower.includes(keyword)
        );
        const directMatch = facilityLower.includes(locationId) || locationStrLower.includes(locationId);
        return cityMatch || directMatch;
      });
      console.log(`[Crawler] Item: ${item.title}`);
      console.log(`[Crawler] Item facility: "${item.facility}", location: "${item.location}"`);
      console.log(`[Crawler] Location match: ${locationMatch}`);
      if (!locationMatch) continue;
      const currentPrice = parseFloat(item.currentPrice);
      console.log(`[Crawler] Price check: $${currentPrice} <= $${rule.maxBidPrice} = ${currentPrice <= parseFloat(rule.maxBidPrice)}`);
      if (currentPrice > parseFloat(rule.maxBidPrice)) continue;
      const timeLeftMinutes = this.calculateTimeLeft(item.endDate);
      console.log(`[Crawler] Time check: ${timeLeftMinutes}min <= ${rule.maxTimeLeft}min = ${timeLeftMinutes <= rule.maxTimeLeft}`);
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
  calculateTimeLeft(endDate) {
    const now = /* @__PURE__ */ new Date();
    const diffMs = endDate.getTime() - now.getTime();
    return Math.floor(diffMs / (1e3 * 60));
  }
  async processMatches(matches) {
    for (const match of matches) {
      try {
        const notification = {
          ruleId: match.rule.id,
          itemId: match.item.id,
          title: match.item.title,
          currentPrice: match.item.currentPrice,
          timeLeft: match.timeLeftMinutes,
          location: match.item.facility,
          auctionUrl: match.item.auctionUrl,
          isRead: false
        };
        this.storeMatch(match);
        console.log(`[Crawler] Notification: ${match.item.title} - $${match.item.currentPrice} - ${match.timeLeftMinutes}min left - ${match.item.facility}`);
        await this.sendNotification(notification);
      } catch (error) {
        console.error(`[Crawler] Error processing match:`, error);
      }
    }
  }
  storeMatch(match) {
    if (!this.storedResults) {
      this.storedResults = [];
    }
    const existingIndex = this.storedResults.findIndex(
      (r) => r.item.id === match.item.id && r.ruleId === match.rule.id
    );
    if (existingIndex !== -1) {
      const existing = this.storedResults[existingIndex];
      existing.item = match.item;
      existing.timeLeftMinutes = match.timeLeftMinutes;
      existing.matchedAt = (/* @__PURE__ */ new Date()).toISOString();
      console.log(`[Crawler] Updated existing result: ${match.item.title} - $${match.item.currentPrice} - ${match.timeLeftMinutes}min left`);
    } else {
      const resultId = `${match.rule.id}-${match.item.id}-${Date.now()}`;
      const result = {
        id: resultId,
        ruleId: match.rule.id,
        ruleName: match.rule.name,
        item: match.item,
        timeLeftMinutes: match.timeLeftMinutes,
        matchedAt: (/* @__PURE__ */ new Date()).toISOString(),
        isTracked: false,
        isWatched: false
      };
      this.storedResults.push(result);
      console.log(`[Crawler] Added new result: ${match.item.title} - $${match.item.currentPrice} - ${match.timeLeftMinutes}min left`);
    }
    const oneDayAgo = Date.now() - 24 * 60 * 60 * 1e3;
    this.storedResults = this.storedResults.filter(
      (r) => new Date(r.matchedAt).getTime() > oneDayAgo
    );
    console.log(`[Crawler] Total stored results: ${this.storedResults.length}`);
  }
  getStoredResults() {
    return this.storedResults || [];
  }
  async sendNotification(notification) {
    console.log(`[Crawler] Sending notification: ${notification.title}`);
    console.log(`\u{1F514} NOTIFICATION: ${notification.title}`);
    console.log(`   Price: $${notification.currentPrice}`);
    console.log(`   Time Left: ${notification.timeLeft} minutes`);
    console.log(`   Location: ${notification.location}`);
    console.log(`   URL: ${notification.auctionUrl}`);
  }
  getActiveRules() {
    return Array.from(this.activeRules.values());
  }
  getRule(ruleId) {
    return this.activeRules.get(ruleId);
  }
};
var crawler = new AuctionCrawler();

// server/routes.ts
import { randomUUID as randomUUID2 } from "crypto";
async function registerRoutes(app2) {
  app2.get("/api/auction-items", async (req, res) => {
    try {
      const items = await getAllBidftaLocationItems();
      console.log(`[BidFTA Location] Found ${items.length} total items`);
      res.json(items);
    } catch (error) {
      console.log("[API] BidFTA Location failed:", error);
      res.status(500).json({ message: "Failed to fetch auction items" });
    }
  });
  app2.get("/api/auction-items/search", async (req, res) => {
    try {
      const query = req.query.q || "";
      if (query.trim().length === 0) {
        res.json([]);
        return;
      }
      const items = await searchBidftaLocation(query);
      console.log(`[BidFTA Location] Found ${items.length} items for query: "${query}"`);
      res.json(items);
    } catch (error) {
      console.log("[API] BidFTA Location search failed:", error);
      res.status(500).json({ error: "Search failed" });
    }
  });
  app2.post("/api/auction-items/filter", async (req, res) => {
    try {
      const filterSchema = z.object({
        conditions: z.array(z.string()).optional(),
        states: z.array(z.string()).optional(),
        facilities: z.array(z.string()).optional(),
        minPrice: z.number().optional(),
        maxPrice: z.number().optional(),
        searchQuery: z.string().optional(),
        sortBy: z.string().optional(),
        page: z.number().optional(),
        limit: z.number().optional()
      });
      const filters = filterSchema.parse(req.body);
      const result = await storage.filterAuctionItems({
        conditions: filters.conditions,
        states: filters.states,
        facilities: filters.facilities,
        minPrice: filters.minPrice,
        maxPrice: filters.maxPrice,
        searchQuery: filters.searchQuery,
        sortBy: filters.sortBy,
        page: filters.page,
        limit: filters.limit
      });
      res.json(result);
    } catch (error) {
      res.status(400).json({ message: "Invalid filter parameters" });
    }
  });
  app2.get("/api/locations", async (req, res) => {
    try {
      const locations = await storage.getLocations();
      res.json(locations);
    } catch (error) {
      res.status(500).json({ message: "Failed to fetch locations" });
    }
  });
  app2.post("/api/auction-items/refresh", async (req, res) => {
    try {
      await storage.refreshAuctionData();
      const items = await storage.getAuctionItems();
      res.json({ message: "Auction data refreshed successfully", itemCount: items.length });
    } catch (error) {
      res.status(500).json({ message: "Failed to refresh auction data" });
    }
  });
  app2.get("/api/crawler/rules", async (req, res) => {
    try {
      const rules = crawler.getActiveRules();
      res.json(rules);
    } catch (error) {
      res.status(500).json({ message: "Failed to fetch crawler rules" });
    }
  });
  app2.post("/api/crawler/rules", async (req, res) => {
    try {
      const ruleSchema = z.object({
        name: z.string().min(1).max(255),
        searchQuery: z.string().min(1).max(500),
        locations: z.array(z.string()),
        maxBidPrice: z.union([z.string(), z.number()]).transform((val) => parseFloat(val.toString())),
        maxTimeLeft: z.union([z.string(), z.number()]).transform((val) => parseInt(val.toString())),
        checkInterval: z.union([z.string(), z.number()]).transform((val) => parseInt(val.toString())),
        isActive: z.boolean().default(true)
      });
      const ruleData = ruleSchema.parse(req.body);
      const rule = {
        id: randomUUID2(),
        ...ruleData,
        lastChecked: null,
        createdAt: /* @__PURE__ */ new Date(),
        updatedAt: /* @__PURE__ */ new Date()
      };
      await crawler.addRule(rule);
      res.json(rule);
    } catch (error) {
      console.error("Crawler rule validation error:", error);
      console.error("Request body:", req.body);
      res.status(400).json({ message: "Invalid rule data", details: error.message });
    }
  });
  app2.put("/api/crawler/rules/:id", async (req, res) => {
    try {
      const ruleId = req.params.id;
      const ruleSchema = z.object({
        name: z.string().min(1).max(255).optional(),
        searchQuery: z.string().min(1).max(500).optional(),
        locations: z.array(z.string()).optional(),
        maxBidPrice: z.union([z.string(), z.number()]).transform((val) => parseFloat(val.toString())).optional(),
        maxTimeLeft: z.union([z.string(), z.number()]).transform((val) => parseInt(val.toString())).optional(),
        checkInterval: z.union([z.string(), z.number()]).transform((val) => parseInt(val.toString())).optional(),
        isActive: z.boolean().optional()
      });
      const updates = ruleSchema.parse(req.body);
      const existingRule = crawler.getRule(ruleId);
      if (!existingRule) {
        return res.status(404).json({ message: "Rule not found" });
      }
      const updatedRule = {
        ...existingRule,
        ...updates,
        updatedAt: /* @__PURE__ */ new Date()
      };
      await crawler.updateRule(updatedRule);
      res.json(updatedRule);
    } catch (error) {
      res.status(400).json({ message: "Invalid rule data" });
    }
  });
  app2.delete("/api/crawler/rules/:id", async (req, res) => {
    try {
      const ruleId = req.params.id;
      await crawler.removeRule(ruleId);
      res.json({ message: "Rule deleted successfully" });
    } catch (error) {
      res.status(500).json({ message: "Failed to delete rule" });
    }
  });
  app2.post("/api/crawler/start", async (req, res) => {
    try {
      await crawler.start();
      res.json({ message: "Crawler started successfully" });
    } catch (error) {
      res.status(500).json({ message: "Failed to start crawler" });
    }
  });
  app2.post("/api/crawler/stop", async (req, res) => {
    try {
      await crawler.stop();
      res.json({ message: "Crawler stopped successfully" });
    } catch (error) {
      res.status(500).json({ message: "Failed to stop crawler" });
    }
  });
  app2.get("/api/crawler/results", async (req, res) => {
    try {
      const results = crawler.getStoredResults();
      res.json(results);
    } catch (error) {
      res.status(500).json({ message: "Failed to fetch crawler results" });
    }
  });
  app2.get("/api/indexer/status", async (req, res) => {
    try {
      const stats = getLocationIndexerStats();
      res.json(stats);
    } catch (error) {
      console.log("[API] Failed to get location indexer status:", error);
      res.status(500).json({ message: "Failed to get location indexer status" });
    }
  });
  app2.get("/api/ended-auctions", async (req, res) => {
    try {
      const items = endedAuctionsStorage.getAllEndedItems();
      console.log(`[API] Found ${items.length} ended auction items`);
      res.json(items);
    } catch (error) {
      console.log("[API] Failed to fetch ended auction items:", error);
      res.status(500).json({ message: "Failed to fetch ended auction items" });
    }
  });
  app2.get("/api/ended-auctions/search", async (req, res) => {
    try {
      const query = req.query.q || "";
      const locations = req.query.locations || [];
      const items = endedAuctionsStorage.searchEndedItems(query, locations);
      console.log(`[API] Found ${items.length} ended auction items for query: "${query}"`);
      res.json(items);
    } catch (error) {
      console.log("[API] Failed to search ended auction items:", error);
      res.status(500).json({ error: "Search failed" });
    }
  });
  app2.get("/api/ended-auctions/stats", async (req, res) => {
    try {
      const stats = endedAuctionsStorage.getEndedItemStats();
      res.json(stats);
    } catch (error) {
      console.log("[API] Failed to get ended auctions stats:", error);
      res.status(500).json({ message: "Failed to get ended auctions stats" });
    }
  });
  app2.delete("/api/ended-auctions", async (req, res) => {
    try {
      endedAuctionsStorage.clearAllEndedItems();
      res.json({ message: "All ended auctions cleared" });
    } catch (error) {
      console.log("[API] Failed to clear ended auctions:", error);
      res.status(500).json({ message: "Failed to clear ended auctions" });
    }
  });
  const httpServer = createServer(app2);
  return httpServer;
}

// server/vite.ts
import express from "express";
import fs from "fs";
import path2 from "path";
import { createServer as createViteServer, createLogger } from "vite";

// vite.config.ts
import { defineConfig } from "vite";
import react from "@vitejs/plugin-react";
import path from "path";
import runtimeErrorOverlay from "@replit/vite-plugin-runtime-error-modal";
var vite_config_default = defineConfig({
  plugins: [
    react(),
    runtimeErrorOverlay(),
    ...process.env.NODE_ENV !== "production" && process.env.REPL_ID !== void 0 ? [
      await import("@replit/vite-plugin-cartographer").then(
        (m) => m.cartographer()
      ),
      await import("@replit/vite-plugin-dev-banner").then(
        (m) => m.devBanner()
      )
    ] : []
  ],
  resolve: {
    alias: {
      "@": path.resolve(import.meta.dirname, "client", "src"),
      "@shared": path.resolve(import.meta.dirname, "shared"),
      "@assets": path.resolve(import.meta.dirname, "attached_assets")
    }
  },
  root: path.resolve(import.meta.dirname, "client"),
  build: {
    outDir: path.resolve(import.meta.dirname, "dist/public"),
    emptyOutDir: true
  },
  server: {
    fs: {
      strict: true,
      deny: ["**/.*"]
    }
  }
});

// server/vite.ts
import { nanoid as nanoid4 } from "nanoid";
var viteLogger = createLogger();
function log(message, source = "express") {
  const formattedTime = (/* @__PURE__ */ new Date()).toLocaleTimeString("en-US", {
    hour: "numeric",
    minute: "2-digit",
    second: "2-digit",
    hour12: true
  });
  console.log(`${formattedTime} [${source}] ${message}`);
}
async function setupVite(app2, server) {
  const serverOptions = {
    middlewareMode: true,
    hmr: { server },
    allowedHosts: true
  };
  const vite = await createViteServer({
    ...vite_config_default,
    configFile: false,
    customLogger: {
      ...viteLogger,
      error: (msg, options) => {
        viteLogger.error(msg, options);
        process.exit(1);
      }
    },
    server: serverOptions,
    appType: "custom"
  });
  app2.use(vite.middlewares);
  app2.use("*", async (req, res, next) => {
    const url = req.originalUrl;
    try {
      const clientTemplate = path2.resolve(
        import.meta.dirname,
        "..",
        "client",
        "index.html"
      );
      let template = await fs.promises.readFile(clientTemplate, "utf-8");
      template = template.replace(
        `src="/src/main.tsx"`,
        `src="/src/main.tsx?v=${nanoid4()}"`
      );
      const page = await vite.transformIndexHtml(url, template);
      res.status(200).set({ "Content-Type": "text/html" }).end(page);
    } catch (e) {
      vite.ssrFixStacktrace(e);
      next(e);
    }
  });
}
function serveStatic(app2) {
  const distPath = path2.resolve(import.meta.dirname, "public");
  if (!fs.existsSync(distPath)) {
    throw new Error(
      `Could not find the build directory: ${distPath}, make sure to build the client first`
    );
  }
  app2.use(express.static(distPath));
  app2.use("*", (_req, res) => {
    res.sendFile(path2.resolve(distPath, "index.html"));
  });
}

// server/index.ts
var app = express2();
app.use(express2.json({
  verify: (req, _res, buf) => {
    req.rawBody = buf;
  }
}));
app.use(express2.urlencoded({ extended: false }));
app.use((req, res, next) => {
  const start = Date.now();
  const path3 = req.path;
  let capturedJsonResponse = void 0;
  const originalResJson = res.json;
  res.json = function(bodyJson, ...args) {
    capturedJsonResponse = bodyJson;
    return originalResJson.apply(res, [bodyJson, ...args]);
  };
  res.on("finish", () => {
    const duration = Date.now() - start;
    if (path3.startsWith("/api")) {
      let logLine = `${req.method} ${path3} ${res.statusCode} in ${duration}ms`;
      if (capturedJsonResponse) {
        logLine += ` :: ${JSON.stringify(capturedJsonResponse)}`;
      }
      if (logLine.length > 80) {
        logLine = logLine.slice(0, 79) + "\u2026";
      }
      log(logLine);
    }
  });
  next();
});
(async () => {
  const server = await registerRoutes(app);
  app.use((err, _req, res, _next) => {
    const status = err.status || err.statusCode || 500;
    const message = err.message || "Internal Server Error";
    res.status(status).json({ message });
    throw err;
  });
  if (app.get("env") === "development") {
    await setupVite(app, server);
  } else {
    serveStatic(app);
  }
  const port = parseInt(process.env.PORT || "5000", 10);
  server.listen({
    port,
    host: "0.0.0.0"
  }, async () => {
    log(`serving on port ${port}`);
    try {
      await bidftaLocationIndexer.start();
      log("BidFTA Location Indexer service started");
    } catch (error) {
      log("Failed to start location indexer service:", String(error));
    }
    try {
      await crawler.start();
      log("Crawler service started");
    } catch (error) {
      log("Failed to start crawler service:", String(error));
    }
  });
})();
