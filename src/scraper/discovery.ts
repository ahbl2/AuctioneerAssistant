/**
 * Discovery task: enumerate listing/API pages for each location,
 * extract minimal fields, compute dom_hash from a stable snippet,
 * normalize, and upsert.
 *
 * NOTE: Do NOT fabricate values. If unknown, store nulls.
 */
import { upsertItem } from "../db/upsert";
import { hashDom } from "../utils/domhash";
import { parseMoney, parseTimeLeftToSeconds } from "../utils/parsers";
import { mapLocation, CANONICAL_LOCATIONS } from "../utils/locations";
import type { ItemRecord } from "../utils/types";
import { log } from "../utils/logging";

// Location ID mapping for BidFTA API
const LOCATION_ID_MAP: Record<string, string> = {
  "Cincinnati — Broadwell Road": "23",
  "Cincinnati — Colerain Avenue": "23", 
  "Cincinnati — School Road": "23",
  "Cincinnati — Waycross Road": "23",
  "Cincinnati — West Seymour Avenue": "23",
  "Elizabethtown — Peterson Drive": "22",
  "Erlanger — Kenton Lane Road 100": "21",
  "Florence — Industrial Road": "21",
  "Franklin — Washington Way": "22",
  "Georgetown — Triport Road": "31",
  "Louisville — Intermodal Drive": "34",
  "Sparta — Johnson Road": "34"
};

export async function runDiscoveryOnce(): Promise<void> {
  const nowIso = new Date().toISOString();
  let totalItems = 0;
  let totalUpserted = 0;

  log.info("Starting discovery scan for all locations");

  for (const locationName of CANONICAL_LOCATIONS) {
    const locationId = LOCATION_ID_MAP[locationName];
    if (!locationId) {
      log.warn(`No location ID found for ${locationName}, skipping`);
      continue;
    }

    try {
      log.info(`Discovering items for ${locationName} (ID: ${locationId})`);
      
      // Use existing multi-page API to fetch items
      const { searchBidftaMultiPage } = await import("../../server/bidftaMultiPageApi");
      const items = await searchBidftaMultiPage("", [locationId], 100);
      
      let locationItems = 0;
      let locationUpserted = 0;

      for (const raw of items) {
        // Map location using our canonical mapping
        const mappedLocation = mapLocation(locationName);
        if (!mappedLocation) {
          log.warn(`Location ${locationName} not in whitelist, skipping item`);
          continue;
        }

        // Create stable hash from minimal stable data
        const stableData = {
          itemId: raw.itemId || raw.id,
          locationId: raw.locationId,
          auctionId: raw.auctionId,
          endDate: raw.endDate
        };
        const dom_hash = hashDom(JSON.stringify(stableData));

        const rec: ItemRecord = {
          item_id: String(raw.itemId || raw.id || ""),
          location_name: mappedLocation,
          title: raw.title || null,
          description: raw.description || null,
          msrp: parseMoney(raw.msrp),
          current_bid: parseMoney(raw.currentPrice),
          end_date: raw.endDate ? new Date(raw.endDate).toISOString() : null,
          time_left_seconds: null, // No time calculations at write time
          status: raw.itemClosed ? "ended" : "unknown",
          source_url: raw.auctionUrl || "",
          fetched_at: nowIso,
          dom_hash,
          msrp_text: raw.msrp || null,
          current_bid_text: raw.currentPrice || null,
          time_left_text: null,
          location_text: locationName,
          item_id_text: String(raw.itemId || raw.id || ""),
        };

        upsertItem(rec);
        locationItems++;
        locationUpserted++;
      }

      totalItems += locationItems;
      totalUpserted += locationUpserted;
      
      log.info(`Discovered ${locationItems} items for ${locationName}, upserted ${locationUpserted}`);
      
      // Stagger requests to be respectful
      await new Promise(resolve => setTimeout(resolve, 3000));
      
    } catch (error) {
      log.error(`Failed to discover items for ${locationName}:`, error);
    }
  }

  log.info(`Discovery complete: ${totalItems} items seen, ${totalUpserted} upserted`);
}
