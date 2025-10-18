import type { Express } from "express";
import { createServer, type Server } from "http";
import { storage } from "./storage";
import { searchBidftaLocation, getAllBidftaLocationItems, getLocationIndexerStats } from "./bidftaLocationApi";
import { endedAuctionsStorage } from "./endedAuctionsStorage";
import { z } from "zod";
import { crawler } from "./crawler";
import type { InsertCrawlerRule, CrawlerRule } from "@shared/schema";
import { randomUUID } from "crypto";

export async function registerRoutes(app: Express): Promise<Server> {
  
  // Get all auction items - Location-specific approach
  app.get("/api/auction-items", async (req, res) => {
    try {
      const items = await getAllBidftaLocationItems();
      console.log(`[BidFTA Location] Found ${items.length} total items`);
      res.json(items);
    } catch (error) {
      console.log("[API] BidFTA Location failed:", error);
      res.status(500).json({ message: "Failed to fetch auction items" });
    }
  });

  // Search auction items - Location-specific approach (comprehensive indexing)
  app.get("/api/auction-items/search", async (req, res) => {
    try {
      const query = req.query.q as string || "";
      if (query.trim().length === 0) {
        res.json([]);
        return;
      }

      // Use Location API - comprehensive indexing of target locations
      const items = await searchBidftaLocation(query);
      console.log(`[BidFTA Location] Found ${items.length} items for query: "${query}"`);
      res.json(items);
    } catch (error) {
      console.log("[API] BidFTA Location search failed:", error);
      res.status(500).json({ error: "Search failed" });
    }
  });

  // Filter auction items
  app.post("/api/auction-items/filter", async (req, res) => {
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
        limit: z.number().optional(),
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
        limit: filters.limit,
      });

      res.json(result);
    } catch (error) {
      res.status(400).json({ message: "Invalid filter parameters" });
    }
  });

  // Get all locations
  app.get("/api/locations", async (req, res) => {
    try {
      const locations = await storage.getLocations();
      res.json(locations);
    } catch (error) {
      res.status(500).json({ message: "Failed to fetch locations" });
    }
  });

  // Refresh auction data from bidft.auction
  app.post("/api/auction-items/refresh", async (req, res) => {
    try {
      await storage.refreshAuctionData();
      const items = await storage.getAuctionItems();
      res.json({ message: "Auction data refreshed successfully", itemCount: items.length });
    } catch (error) {
      res.status(500).json({ message: "Failed to refresh auction data" });
    }
  });

  // Background refresh disabled - using API proxy instead
  // setInterval(async () => {
  //   try {
  //     console.log('Running background auction data refresh...');
  //     await storage.refreshAuctionData();
  //   } catch (error) {
  //     console.error('Background refresh failed:', error);
  //   }
  // }, 15 * 60 * 1000);

  // Crawler Routes
  app.get("/api/crawler/rules", async (req, res) => {
    try {
      const rules = crawler.getActiveRules();
      res.json(rules);
    } catch (error) {
      res.status(500).json({ message: "Failed to fetch crawler rules" });
    }
  });

  app.post("/api/crawler/rules", async (req, res) => {
    try {
      const ruleSchema = z.object({
        name: z.string().min(1).max(255),
        searchQuery: z.string().min(1).max(500),
        locations: z.array(z.string()),
        maxBidPrice: z.union([z.string(), z.number()]).transform(val => parseFloat(val.toString())),
        maxTimeLeft: z.union([z.string(), z.number()]).transform(val => parseInt(val.toString())),
        checkInterval: z.union([z.string(), z.number()]).transform(val => parseInt(val.toString())),
        isActive: z.boolean().default(true),
      });

      const ruleData = ruleSchema.parse(req.body);
      const rule: CrawlerRule = {
        id: randomUUID(),
        ...ruleData,
        lastChecked: null,
        createdAt: new Date(),
        updatedAt: new Date(),
      };

      await crawler.addRule(rule);
      res.json(rule);
    } catch (error) {
      console.error('Crawler rule validation error:', error);
      console.error('Request body:', req.body);
      res.status(400).json({ message: "Invalid rule data", details: error.message });
    }
  });

  app.put("/api/crawler/rules/:id", async (req, res) => {
    try {
      const ruleId = req.params.id;
      const ruleSchema = z.object({
        name: z.string().min(1).max(255).optional(),
        searchQuery: z.string().min(1).max(500).optional(),
        locations: z.array(z.string()).optional(),
        maxBidPrice: z.union([z.string(), z.number()]).transform(val => parseFloat(val.toString())).optional(),
        maxTimeLeft: z.union([z.string(), z.number()]).transform(val => parseInt(val.toString())).optional(),
        checkInterval: z.union([z.string(), z.number()]).transform(val => parseInt(val.toString())).optional(),
        isActive: z.boolean().optional(),
      });

      const updates = ruleSchema.parse(req.body);
      const existingRule = crawler.getRule(ruleId);
      
      if (!existingRule) {
        return res.status(404).json({ message: "Rule not found" });
      }

      const updatedRule: CrawlerRule = {
        ...existingRule,
        ...updates,
        updatedAt: new Date(),
      };

      await crawler.updateRule(updatedRule);
      res.json(updatedRule);
    } catch (error) {
      res.status(400).json({ message: "Invalid rule data" });
    }
  });

  app.delete("/api/crawler/rules/:id", async (req, res) => {
    try {
      const ruleId = req.params.id;
      await crawler.removeRule(ruleId);
      res.json({ message: "Rule deleted successfully" });
    } catch (error) {
      res.status(500).json({ message: "Failed to delete rule" });
    }
  });

  app.post("/api/crawler/start", async (req, res) => {
    try {
      await crawler.start();
      res.json({ message: "Crawler started successfully" });
    } catch (error) {
      res.status(500).json({ message: "Failed to start crawler" });
    }
  });

  app.post("/api/crawler/stop", async (req, res) => {
    try {
      await crawler.stop();
      res.json({ message: "Crawler stopped successfully" });
    } catch (error) {
      res.status(500).json({ message: "Failed to stop crawler" });
    }
  });

  app.get("/api/crawler/results", async (req, res) => {
    try {
      const results = crawler.getStoredResults();
      res.json(results);
    } catch (error) {
      res.status(500).json({ message: "Failed to fetch crawler results" });
    }
  });

  // Get location indexer status
  app.get("/api/indexer/status", async (req, res) => {
    try {
      const stats = getLocationIndexerStats();
      res.json(stats);
    } catch (error) {
      console.log("[API] Failed to get location indexer status:", error);
      res.status(500).json({ message: "Failed to get location indexer status" });
    }
  });

  // Get all ended auction items
  app.get("/api/ended-auctions", async (req, res) => {
    try {
      const items = endedAuctionsStorage.getAllEndedItems();
      console.log(`[API] Found ${items.length} ended auction items`);
      res.json(items);
    } catch (error) {
      console.log("[API] Failed to fetch ended auction items:", error);
      res.status(500).json({ message: "Failed to fetch ended auction items" });
    }
  });

  // Search ended auction items
  app.get("/api/ended-auctions/search", async (req, res) => {
    try {
      const query = req.query.q as string || "";
      const locations = req.query.locations as string[] || [];
      
      const items = endedAuctionsStorage.searchEndedItems(query, locations);
      console.log(`[API] Found ${items.length} ended auction items for query: "${query}"`);
      res.json(items);
    } catch (error) {
      console.log("[API] Failed to search ended auction items:", error);
      res.status(500).json({ error: "Search failed" });
    }
  });

  // Get ended auctions statistics
  app.get("/api/ended-auctions/stats", async (req, res) => {
    try {
      const stats = endedAuctionsStorage.getEndedItemStats();
      res.json(stats);
    } catch (error) {
      console.log("[API] Failed to get ended auctions stats:", error);
      res.status(500).json({ message: "Failed to get ended auctions stats" });
    }
  });

  // Clear all ended auctions
  app.delete("/api/ended-auctions", async (req, res) => {
    try {
      endedAuctionsStorage.clearAllEndedItems();
      res.json({ message: "All ended auctions cleared" });
    } catch (error) {
      console.log("[API] Failed to clear ended auctions:", error);
      res.status(500).json({ message: "Failed to clear ended auctions" });
    }
  });

  const httpServer = createServer(app);
  return httpServer;
}
