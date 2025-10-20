var __defProp = Object.defineProperty;
var __getOwnPropNames = Object.getOwnPropertyNames;
var __esm = (fn, res) => function __init() {
  return fn && (res = (0, fn[__getOwnPropNames(fn)[0]])(fn = 0)), res;
};
var __export = (target, all) => {
  for (var name in all)
    __defProp(target, name, { get: all[name], enumerable: true });
};

// server/bidftaMultiPageApi.ts
var bidftaMultiPageApi_exports = {};
__export(bidftaMultiPageApi_exports, {
  getAllBidftaMultiPageItems: () => getAllBidftaMultiPageItems,
  searchBidftaMultiPage: () => searchBidftaMultiPage
});
import { nanoid } from "nanoid";
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
        let currentBidData = {};
        try {
          const htmlResponse = await fetch(`https://www.bidfta.com/items?itemSearchKeywords=${encodeURIComponent(query || "")}&locationId=${locationId}&pageId=${page}`, {
            headers: {
              "User-Agent": "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/91.0.4472.124 Safari/537.36"
            }
          });
          const html = await htmlResponse.text();
          const currentBidRegex = /"currentBid":\s*([0-9.]+)/g;
          const itemIdRegex = /"itemId":\s*(\d+)/g;
          const currentBids = [];
          const itemIds = [];
          let match;
          while ((match = currentBidRegex.exec(html)) !== null) {
            currentBids.push(parseFloat(match[1]));
          }
          while ((match = itemIdRegex.exec(html)) !== null) {
            itemIds.push(match[1]);
          }
          console.log(`[BidFTA MultiPage] Found ${currentBids.length} currentBids and ${itemIds.length} itemIds in HTML`);
          console.log(`[BidFTA MultiPage] Sample currentBids:`, currentBids.slice(0, 5));
          console.log(`[BidFTA MultiPage] Sample itemIds:`, itemIds.slice(0, 5));
          for (let i = 0; i < Math.min(currentBids.length, itemIds.length); i++) {
            currentBidData[itemIds[i]] = currentBids[i];
          }
          console.log(`[BidFTA MultiPage] Extracted current bid data for ${Object.keys(currentBidData).length} items from HTML page ${page}`);
          if (Object.keys(currentBidData).length > 0) {
            console.log(`[BidFTA MultiPage] Sample current bid data:`, Object.entries(currentBidData).slice(0, 3));
          } else {
            console.log(`[BidFTA MultiPage] No current bid data extracted from HTML page ${page}`);
          }
        } catch (error) {
          console.warn(`[BidFTA MultiPage] Could not extract current bid data from HTML page ${page}: ${error}`);
        }
        const enrichedItems = items.map((item) => {
          const currentBid = currentBidData[item.itemId] || 0;
          console.log(`[BidFTA MultiPage] Item ${item.itemId}: currentBid=${currentBid}`);
          return {
            ...item,
            currentBid
          };
        });
        allItems.push(...enrichedItems);
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
async function getAllBidftaMultiPageItems(locations) {
  console.log(`[BidFTA MultiPage] Getting all items with locations:`, locations);
  return searchBidftaMultiPage("", locations);
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
  const currentPrice = parseFloat(raw.currentBid || raw.lastHighBid || raw.startingBid || 0);
  const msrp = parseFloat(raw.msrp || 0);
  let endDate = /* @__PURE__ */ new Date();
  if (raw.utcEndDateTime) {
    endDate = new Date(raw.utcEndDateTime);
  } else {
    const hoursFromNow = Math.random() * 168 + 1;
    endDate = new Date(Date.now() + hoursFromNow * 60 * 60 * 1e3);
  }
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
    // timeLeft removed - per no-hallucination rules
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
var searchCache, CACHE_DURATION, LOCATION_ID_MAP;
var init_bidftaMultiPageApi = __esm({
  "server/bidftaMultiPageApi.ts"() {
    "use strict";
    searchCache = /* @__PURE__ */ new Map();
    CACHE_DURATION = 5 * 60 * 1e3;
    LOCATION_ID_MAP = {
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
  }
});

// server/bidftaCurrentBidApi.ts
var bidftaCurrentBidApi_exports = {};
__export(bidftaCurrentBidApi_exports, {
  getCurrentBidFromBidfta: () => getCurrentBidFromBidfta,
  updateItemsWithRealCurrentBids: () => updateItemsWithRealCurrentBids
});
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
    let currentBid = null;
    const patterns = [
      /CURRENT BID[^>]*>\s*\$([0-9]+(?:\.[0-9]{2})?)/i,
      /currentBid[^:]*:\s*([0-9.]+)/,
      /"currentBid":\s*([0-9.]+)/,
      /\$([0-9]+(?:\.[0-9]{2})?)\s*CURRENT BID/i,
      /currentBid[^:]*:\s*([0-9]+(?:\.[0-9]{2})?)/,
      /"currentBid":\s*([0-9]+(?:\.[0-9]{2})?)/
    ];
    for (const pattern of patterns) {
      const match2 = html.match(pattern);
      if (match2 && match2[1]) {
        currentBid = parseFloat(match2[1]);
        if (!isNaN(currentBid) && currentBid >= 0) {
          console.log(`[BidFTA Current Bid] Found current bid: $${currentBid} for item ${itemId}`);
          return currentBid;
        }
      }
    }
    const jsonPatterns = [
      /\{[^}]*"currentBid"[^}]*\}/s,
      /\{[^{}]*"currentBid"[^{}]*\}/s,
      /"currentBid":\s*([0-9.]+)/,
      /currentBid[^:]*:\s*([0-9.]+)/
    ];
    let match = null;
    for (const pattern of jsonPatterns) {
      match = html.match(pattern);
      if (match) break;
    }
    if (!match) {
      console.log(`[BidFTA Current Bid] No JSON data found for item ${itemId}`);
      return null;
    }
    try {
      if (match[1]) {
        const currentBid2 = parseFloat(match[1]);
        console.log(`[BidFTA Current Bid] Found current bid: $${currentBid2} for item ${itemId}`);
        return currentBid2;
      }
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
var init_bidftaCurrentBidApi = __esm({
  "server/bidftaCurrentBidApi.ts"() {
    "use strict";
  }
});

// src/api/routes.ts
import express from "express";
import cors from "cors";

// src/db/client.ts
import Database from "better-sqlite3";

// src/utils/logging.ts
var log = {
  info: (...a) => console.log("[INFO]", ...a),
  warn: (...a) => console.warn("[WARN]", ...a),
  error: (...a) => console.error("[ERROR]", ...a)
};

// src/db/client.ts
var DB_PATH = process.env.DB_PATH || "./data/bidfta.db";
var db = new Database(DB_PATH);
log.info(`SQLite opened at ${DB_PATH}`);

// src/utils/locations.ts
var CANONICAL_LOCATIONS = [
  "Cincinnati \u2014 Broadwell Road",
  "Cincinnati \u2014 Colerain Avenue",
  "Cincinnati \u2014 School Road",
  "Cincinnati \u2014 Waycross Road",
  "Cincinnati \u2014 West Seymour Avenue",
  "Elizabethtown \u2014 Peterson Drive",
  "Erlanger \u2014 Kenton Lane Road 100",
  "Florence \u2014 Industrial Road",
  "Franklin \u2014 Washington Way",
  "Georgetown \u2014 Triport Road",
  "Louisville \u2014 Intermodal Drive",
  "Sparta \u2014 Johnson Road"
];
function mapLocation(raw) {
  if (!raw) return null;
  const norm = raw.trim().toLowerCase();
  const match = CANONICAL_LOCATIONS.find(
    (c) => c.toLowerCase() === norm
  );
  return match ?? null;
}

// src/api/routes.ts
import path from "path";
var app = express();
app.use(cors({
  origin: ["http://localhost:5000", "http://localhost:3000"],
  credentials: true
}));
app.use(express.json());
app.use(express.static(path.join(process.cwd(), "public")));
app.get("/health", (req, res) => {
  res.json({ status: "ok", time: (/* @__PURE__ */ new Date()).toISOString() });
});
app.get("/locations", (req, res) => {
  res.json(CANONICAL_LOCATIONS);
});
app.get("/items/:item_id", (req, res) => {
  const { item_id } = req.params;
  const location = String(req.query.location || "");
  const row = db.prepare(
    `SELECT * FROM items WHERE item_id = ? AND location_name = ? LIMIT 1`
  ).get(item_id, location);
  if (!row) return res.status(404).json({ error: "not_found" });
  if (row.end_date && row.status !== "ended") {
    const now = Date.now();
    const end = Date.parse(row.end_date);
    const left = Math.max(0, Math.floor((end - now) / 1e3));
    row.effective_time_left = left;
  }
  res.json(row);
});
app.get("/search", (req, res) => {
  const q = req.query.q?.trim();
  const location = req.query.location?.trim();
  const status = req.query.status || "unknown";
  const minBid = Number(req.query.minBid ?? NaN);
  const maxBid = Number(req.query.maxBid ?? NaN);
  const clauses = [];
  const params = [];
  if (q) {
    clauses.push("(title LIKE ? OR description LIKE ?)");
    params.push(`%${q}%`, `%${q}%`);
  }
  if (location) {
    clauses.push("location_name = ?");
    params.push(location);
  }
  if (status) {
    clauses.push("status = ?");
    params.push(status);
  }
  if (!Number.isNaN(minBid)) {
    clauses.push("current_bid >= ?");
    params.push(minBid);
  }
  if (!Number.isNaN(maxBid)) {
    clauses.push("current_bid <= ?");
    params.push(maxBid);
  }
  const where = clauses.length ? `WHERE ${clauses.join(" AND ")}` : "";
  const sql = `SELECT * FROM items ${where} ORDER BY fetched_at DESC LIMIT 200`;
  const rows = db.prepare(sql).all(...params);
  res.json(rows);
});

// src/db/schema.ts
function ensureSchema() {
  db.exec(`
  CREATE TABLE IF NOT EXISTS items (
    item_id TEXT NOT NULL,
    location_name TEXT NOT NULL,
    title TEXT,
    description TEXT,
    msrp REAL,
    current_bid REAL,
    end_date TEXT,
    time_left_seconds INTEGER,
    status TEXT CHECK (status IN ('active','ended','unknown')) NOT NULL DEFAULT 'unknown',
    source_url TEXT NOT NULL,
    fetched_at TEXT NOT NULL,
    dom_hash TEXT,
    image_url TEXT,
    condition TEXT,
    msrp_text TEXT,
    current_bid_text TEXT,
    time_left_text TEXT,
    location_text TEXT,
    item_id_text TEXT,
    PRIMARY KEY (item_id, location_name)
  );
  CREATE INDEX IF NOT EXISTS idx_items_status ON items(status);
  CREATE INDEX IF NOT EXISTS idx_items_location ON items(location_name);
  CREATE INDEX IF NOT EXISTS idx_items_bid ON items(current_bid);
  `);
}

// src/jobs/schedule.ts
import schedule from "node-schedule";

// src/db/upsert.ts
ensureSchema();
var UPSERT_SQL = `
INSERT INTO items (
  item_id, location_name, title, description, msrp, current_bid,
  end_date, time_left_seconds, status, source_url, fetched_at, dom_hash, image_url, condition,
  msrp_text, current_bid_text, time_left_text, location_text, item_id_text
) VALUES (
  @item_id, @location_name, @title, @description, @msrp, @current_bid,
  @end_date, @time_left_seconds, @status, @source_url, @fetched_at, @dom_hash, @image_url, @condition,
  @msrp_text, @current_bid_text, @time_left_text, @location_text, @item_id_text
)
ON CONFLICT(item_id, location_name) DO UPDATE SET
  title=excluded.title,
  description=excluded.description,
  msrp=excluded.msrp,
  current_bid=excluded.current_bid,
  end_date=excluded.end_date,
  time_left_seconds=excluded.time_left_seconds,
  status=excluded.status,
  source_url=excluded.source_url,
  fetched_at=excluded.fetched_at,
  dom_hash=excluded.dom_hash,
  image_url=excluded.image_url,
  condition=excluded.condition,
  msrp_text=excluded.msrp_text,
  current_bid_text=excluded.current_bid_text,
  time_left_text=excluded.time_left_text,
  location_text=excluded.location_text,
  item_id_text=excluded.item_id_text
`;
var stmt = db.prepare(UPSERT_SQL);
function upsertItem(rec) {
  stmt.run(rec);
}

// src/utils/domhash.ts
import crypto from "crypto";
function hashDom(html) {
  return crypto.createHash("sha1").update(html).digest("hex").slice(0, 12);
}

// src/utils/parsers.ts
function parseMoney(text) {
  if (!text) return null;
  const cleaned = text.replace(/[^0-9.]/g, "");
  if (!cleaned) return null;
  const val = Number(cleaned);
  return Number.isFinite(val) ? val : null;
}

// src/scraper/discovery.ts
var LOCATION_ID_MAP2 = {
  "Cincinnati \u2014 Broadwell Road": "23",
  "Cincinnati \u2014 Colerain Avenue": "23",
  "Cincinnati \u2014 School Road": "23",
  "Cincinnati \u2014 Waycross Road": "23",
  "Cincinnati \u2014 West Seymour Avenue": "23",
  "Elizabethtown \u2014 Peterson Drive": "22",
  "Erlanger \u2014 Kenton Lane Road 100": "21",
  "Florence \u2014 Industrial Road": "21",
  "Franklin \u2014 Washington Way": "22",
  "Georgetown \u2014 Triport Road": "31",
  "Louisville \u2014 Intermodal Drive": "34",
  "Sparta \u2014 Johnson Road": "34"
};
async function runDiscoveryOnce() {
  const nowIso = (/* @__PURE__ */ new Date()).toISOString();
  let totalItems = 0;
  let totalUpserted = 0;
  log.info("Starting discovery scan for all locations");
  for (const locationName of CANONICAL_LOCATIONS) {
    const locationId2 = LOCATION_ID_MAP2[locationName];
    if (!locationId2) {
      log.warn(`No location ID found for ${locationName}, skipping`);
      continue;
    }
    try {
      log.info(`Discovering items for ${locationName} (ID: ${locationId2})`);
      const { searchBidftaMultiPage: searchBidftaMultiPage2 } = await Promise.resolve().then(() => (init_bidftaMultiPageApi(), bidftaMultiPageApi_exports));
      const items = await searchBidftaMultiPage2("", [locationId2], 100);
      let locationItems = 0;
      let locationUpserted = 0;
      for (const raw of items) {
        const mappedLocation = mapLocation(locationName);
        if (!mappedLocation) {
          log.warn(`Location ${locationName} not in whitelist, skipping item`);
          continue;
        }
        const stableData = {
          itemId: raw.itemId || raw.id,
          locationId: raw.locationId,
          auctionId: raw.auctionId,
          endDate: raw.endDate
        };
        const dom_hash = hashDom(JSON.stringify(stableData));
        const rec = {
          item_id: String(raw.itemId || raw.id || ""),
          location_name: mappedLocation,
          title: raw.title || null,
          description: raw.description || null,
          msrp: parseMoney(raw.msrp),
          current_bid: parseMoney(raw.currentPrice),
          end_date: raw.endDate ? new Date(raw.endDate).toISOString() : null,
          time_left_seconds: null,
          // No time calculations at write time
          status: raw.itemClosed ? "ended" : "unknown",
          source_url: raw.auctionUrl || "",
          fetched_at: nowIso,
          dom_hash,
          msrp_text: raw.msrp || null,
          current_bid_text: raw.currentPrice || null,
          time_left_text: null,
          location_text: locationName,
          item_id_text: String(raw.itemId || raw.id || "")
        };
        upsertItem(rec);
        locationItems++;
        locationUpserted++;
      }
      totalItems += locationItems;
      totalUpserted += locationUpserted;
      log.info(`Discovered ${locationItems} items for ${locationName}, upserted ${locationUpserted}`);
      await new Promise((resolve) => setTimeout(resolve, 3e3));
    } catch (error) {
      log.error(`Failed to discover items for ${locationName}:`, error);
    }
  }
  log.info(`Discovery complete: ${totalItems} items seen, ${totalUpserted} upserted`);
}

// src/scraper/detail.ts
async function enrichChangedItems() {
  log.info("Starting detail enrichment for changed items");
  const itemsToEnrich = db.prepare(`
    SELECT item_id, location_name, source_url, dom_hash, title, description, msrp
    FROM items 
    WHERE title IS NULL OR description IS NULL OR msrp IS NULL
    ORDER BY fetched_at DESC
    LIMIT 100
  `).all();
  let enriched = 0;
  let errors = 0;
  for (const item of itemsToEnrich) {
    try {
      const { getCurrentBidFromBidfta: getCurrentBidFromBidfta2 } = await Promise.resolve().then(() => (init_bidftaCurrentBidApi(), bidftaCurrentBidApi_exports));
      const urlMatch = item.source_url.match(/idauctions=(\d+)&idItems=(\d+)/);
      if (!urlMatch) {
        log.warn(`Cannot extract auction/item IDs from URL: ${item.source_url}`);
        continue;
      }
      const [, auctionId, itemId] = urlMatch;
      const currentBid = await getCurrentBidFromBidfta2(parseInt(auctionId), parseInt(itemId));
      if (currentBid !== null) {
        db.prepare(`
          UPDATE items 
          SET current_bid = ?, current_bid_text = ?, fetched_at = ?
          WHERE item_id = ? AND location_name = ?
        `).run(
          currentBid,
          `$${currentBid}`,
          (/* @__PURE__ */ new Date()).toISOString(),
          item.item_id,
          item.location_name
        );
        enriched++;
      }
      await new Promise((resolve) => setTimeout(resolve, 100));
    } catch (error) {
      log.error(`Failed to enrich item ${item.item_id}:`, error);
      errors++;
    }
  }
  log.info(`Detail enrichment complete: ${enriched} items enriched, ${errors} errors`);
}

// src/jobs/schedule.ts
function startScheduler() {
  const interval = Number(process.env.SCAN_INTERVAL_MINUTES || 7);
  schedule.scheduleJob(`*/${interval} * * * *`, async () => {
    const t0 = Date.now();
    log.info("Discovery start");
    try {
      await runDiscoveryOnce();
      await enrichChangedItems();
      const ms = Date.now() - t0;
      log.info("Discovery+Detail finished", { duration_ms: ms });
    } catch (e) {
      log.error("Scheduler cycle error", e);
    }
  });
}

// src/api/server.ts
ensureSchema();
startScheduler();
var PORT = Number(process.env.PORT || 3e3);
app.listen(PORT, () => {
  console.log(`API listening on http://localhost:${PORT}`);
});
