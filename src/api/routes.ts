import express from "express";
import cors from "cors";
import { db } from "../db/client";
import { CANONICAL_LOCATIONS } from "../utils/locations";
import path from "path";

export const app = express();

// Enable CORS for all routes
app.use(cors({
  origin: ['http://localhost:5000', 'http://localhost:3000'],
  credentials: true
}));

app.use(express.json());
app.use(express.static(path.join(process.cwd(), 'public')));

app.get("/health", (req, res) => {
  res.json({ status: "ok", time: new Date().toISOString() });
});

app.get("/locations", (req, res) => {
  res.json(CANONICAL_LOCATIONS);
});

app.get("/items/:item_id", (req, res) => {
  const { item_id } = req.params;
  const location = String(req.query.location || "");
  const row = db
    .prepare(
      `SELECT * FROM items WHERE item_id = ? AND location_name = ? LIMIT 1`
    )
    .get(item_id, location);
  if (!row) return res.status(404).json({ error: "not_found" });

  // compute effective_time_left if end_date exists
  if (row.end_date && row.status !== "ended") {
    const now = Date.now();
    const end = Date.parse(row.end_date);
    const left = Math.max(0, Math.floor((end - now) / 1000));
    row.effective_time_left = left;
  }
  res.json(row);
});

app.get("/search", (req, res) => {
  const q = (req.query.q as string | undefined)?.trim();
  const location = (req.query.location as string | undefined)?.trim();
  const status = (req.query.status as string | undefined) || "unknown";
  const minBid = Number(req.query.minBid ?? NaN);
  const maxBid = Number(req.query.maxBid ?? NaN);
  const clauses: string[] = [];
  const params: any[] = [];

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
