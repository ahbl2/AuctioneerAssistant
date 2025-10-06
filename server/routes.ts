import type { Express } from "express";
import { createServer, type Server } from "http";
import { storage } from "./storage";
import { z } from "zod";

export async function registerRoutes(app: Express): Promise<Server> {
  
  // Get all auction items
  app.get("/api/auction-items", async (req, res) => {
    try {
      const items = await storage.getAuctionItems();
      res.json(items);
    } catch (error) {
      res.status(500).json({ message: "Failed to fetch auction items" });
    }
  });

  // Search auction items
  app.get("/api/auction-items/search", async (req, res) => {
    try {
      const query = req.query.q as string || "";
      const items = await storage.searchAuctionItems(query);
      res.json(items);
    } catch (error) {
      res.status(500).json({ message: "Failed to search auction items" });
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
      });

      const filters = filterSchema.parse(req.body);
      
      let items = await storage.filterAuctionItems({
        conditions: filters.conditions,
        states: filters.states,
        facilities: filters.facilities,
        minPrice: filters.minPrice,
        maxPrice: filters.maxPrice,
      });

      // Apply search query if provided
      if (filters.searchQuery && filters.searchQuery.trim()) {
        const searchTerm = filters.searchQuery.toLowerCase();
        items = items.filter(item => 
          item.title.toLowerCase().includes(searchTerm) ||
          item.description.toLowerCase().includes(searchTerm)
        );
      }

      res.json(items);
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

  // Background refresh every 15 minutes
  setInterval(async () => {
    try {
      console.log('Running background auction data refresh...');
      await storage.refreshAuctionData();
    } catch (error) {
      console.error('Background refresh failed:', error);
    }
  }, 15 * 60 * 1000);

  const httpServer = createServer(app);
  return httpServer;
}
