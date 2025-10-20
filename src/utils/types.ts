export type Status = "active" | "ended" | "unknown";

export type ItemRecord = {
  item_id: string;
  location_name: string;
  title: string | null;
  description: string | null;
  msrp: number | null;
  current_bid: number | null;
  end_date: string | null;            // ISO-8601, if provided by site/API
  time_left_seconds: number | null;   // optional, 0 if explicitly ended
  status: Status;
  source_url: string;
  fetched_at: string;                 // ISO-8601 at fetch time
  dom_hash: string | null;
  image_url: string | null;           // URL to item image
  condition: string | null;           // Item condition from BidFTA
  // raw echoes for audit
  msrp_text: string | null;
  current_bid_text: string | null;
  time_left_text: string | null;
  location_text: string | null;
  item_id_text: string | null;
};

export type SearchParams = {
  q?: string;
  location_name?: string;
  minBid?: number;
  maxBid?: number;
  minMsrp?: number;
  maxMsrp?: number;
  status?: Status;
};
