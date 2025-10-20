import Database from "better-sqlite3";
import { log } from "../utils/logging";

const DB_PATH = process.env.DB_PATH || "./data/bidfta.db";

export const db = new Database(DB_PATH);
log.info(`SQLite opened at ${DB_PATH}`);
