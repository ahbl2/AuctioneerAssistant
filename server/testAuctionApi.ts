/**
 * Test script to debug auction API response
 */

import { auctionApi } from "./auctionApi";

async function testAuctionApi() {
  console.log("Testing auction API with auction ID 543130...");
  
  try {
    const result = await auctionApi.fetchAuctionData("543130");
    
    if (result) {
      console.log("✅ Auction API test successful!");
      console.log(`Found ${result.totalItems} items`);
      console.log(`Auction ID: ${result.auctionId}`);
      console.log(`Location: ${result.locationName}`);
      
      if (result.items.length > 0) {
        console.log("\nSample items:");
        for (let i = 0; i < Math.min(3, result.items.length); i++) {
          const item = result.items[i];
          console.log(`  Item ${i + 1}:`);
          console.log(`    Title: ${item.title}`);
          console.log(`    Current Bid: ${item.currentBid}`);
          console.log(`    MSRP: ${item.msrp}`);
          console.log(`    Condition: ${item.condition}`);
          console.log("");
        }
      }
    } else {
      console.log("❌ Auction API test failed - no data returned");
    }
  } catch (error) {
    console.error("❌ Auction API test error:", error);
  }
}

testAuctionApi();
