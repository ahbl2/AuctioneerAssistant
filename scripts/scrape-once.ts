import { ensureSchema } from "../src/db/schema";
import { runDiscoveryOnce } from "../src/scraper/discovery";
import { enrichChangedItems } from "../src/scraper/detail";

(async () => {
  ensureSchema();
  await runDiscoveryOnce();
  await enrichChangedItems();
  console.log("Scrape once complete.");
})();
