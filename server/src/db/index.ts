import Database from 'better-sqlite3'
import { drizzle } from 'drizzle-orm/better-sqlite3'
import * as schema from './schema.js'
import path from 'path'
import { fileURLToPath } from 'url'
import fs from 'fs'

const __dirname = path.dirname(fileURLToPath(import.meta.url))

// Store DB in project root /data by default, or override via env
const dataDir = process.env.DATA_DIR ?? path.resolve(__dirname, '../../../data')
if (!fs.existsSync(dataDir)) fs.mkdirSync(dataDir, { recursive: true })

const dbPath = path.join(dataDir, 'llm.db')
const sqlite = new Database(dbPath)

// Enable WAL for better concurrent read performance
sqlite.pragma('journal_mode = WAL')
sqlite.pragma('foreign_keys = ON')

export const db = drizzle(sqlite, { schema })
export { sqlite }

// ── Auto-migrate on startup ───────────────────────────────────────────────────
// We use raw SQL here to avoid needing drizzle-kit at runtime
export function migrate() {
  sqlite.exec(`
    CREATE TABLE IF NOT EXISTS profile (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      name TEXT NOT NULL DEFAULT '',
      age INTEGER,
      location TEXT,
      occupation TEXT,
      employer TEXT,
      annual_salary REAL,
      currency TEXT NOT NULL DEFAULT 'USD',
      dark_mode INTEGER NOT NULL DEFAULT 0,
      created_at TEXT NOT NULL DEFAULT (datetime('now')),
      updated_at TEXT NOT NULL DEFAULT (datetime('now'))
    );

    CREATE TABLE IF NOT EXISTS plaid_items (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      item_id TEXT NOT NULL UNIQUE,
      access_token TEXT NOT NULL,
      institution_id TEXT,
      institution_name TEXT,
      status TEXT NOT NULL DEFAULT 'active',
      error_code TEXT,
      last_synced_at TEXT,
      created_at TEXT NOT NULL DEFAULT (datetime('now'))
    );

    CREATE TABLE IF NOT EXISTS accounts (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      plaid_item_id INTEGER REFERENCES plaid_items(id),
      plaid_account_id TEXT UNIQUE,
      name TEXT NOT NULL,
      official_name TEXT,
      type TEXT NOT NULL,
      subtype TEXT,
      institution_name TEXT,
      balance_current REAL NOT NULL DEFAULT 0,
      balance_available REAL,
      balance_limit REAL,
      currency_code TEXT NOT NULL DEFAULT 'USD',
      mask TEXT,
      is_manual INTEGER NOT NULL DEFAULT 0,
      is_hidden INTEGER NOT NULL DEFAULT 0,
      last_synced_at TEXT,
      created_at TEXT NOT NULL DEFAULT (datetime('now')),
      updated_at TEXT NOT NULL DEFAULT (datetime('now'))
    );

    CREATE TABLE IF NOT EXISTS categories (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      name TEXT NOT NULL,
      parent_id INTEGER,
      color TEXT,
      emoji TEXT,
      is_system INTEGER NOT NULL DEFAULT 0
    );

    CREATE TABLE IF NOT EXISTS transactions (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      account_id INTEGER NOT NULL REFERENCES accounts(id),
      plaid_transaction_id TEXT UNIQUE,
      amount REAL NOT NULL,
      date TEXT NOT NULL,
      merchant_name TEXT,
      original_description TEXT,
      category_id INTEGER REFERENCES categories(id),
      is_pending INTEGER NOT NULL DEFAULT 0,
      is_manual INTEGER NOT NULL DEFAULT 0,
      is_transfer INTEGER NOT NULL DEFAULT 0,
      is_outlier INTEGER NOT NULL DEFAULT 0,
      notes TEXT,
      created_at TEXT NOT NULL DEFAULT (datetime('now')),
      updated_at TEXT NOT NULL DEFAULT (datetime('now'))
    );

    CREATE INDEX IF NOT EXISTS tx_account_date ON transactions(account_id, date);
    CREATE INDEX IF NOT EXISTS tx_date ON transactions(date);

    CREATE TABLE IF NOT EXISTS budget_buckets (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      name TEXT NOT NULL,
      category_id INTEGER REFERENCES categories(id),
      monthly_limit REAL NOT NULL DEFAULT 0,
      color TEXT NOT NULL DEFAULT '#10b981',
      emoji TEXT NOT NULL DEFAULT '💰',
      sort_order INTEGER NOT NULL DEFAULT 0,
      is_slush INTEGER NOT NULL DEFAULT 0,
      is_active INTEGER NOT NULL DEFAULT 1,
      created_at TEXT NOT NULL DEFAULT (datetime('now'))
    );

    CREATE TABLE IF NOT EXISTS budget_periods (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      bucket_id INTEGER NOT NULL REFERENCES budget_buckets(id),
      year INTEGER NOT NULL,
      month INTEGER NOT NULL,
      allocated REAL NOT NULL DEFAULT 0,
      spent REAL NOT NULL DEFAULT 0
    );

    CREATE INDEX IF NOT EXISTS bp_bucket_period ON budget_periods(bucket_id, year, month);

    CREATE TABLE IF NOT EXISTS goals (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      name TEXT NOT NULL,
      target_amount REAL NOT NULL,
      current_amount REAL NOT NULL DEFAULT 0,
      monthly_contribution REAL NOT NULL DEFAULT 0,
      deadline TEXT,
      linked_account_id INTEGER REFERENCES accounts(id),
      is_completed INTEGER NOT NULL DEFAULT 0,
      emoji TEXT DEFAULT '🎯',
      created_at TEXT NOT NULL DEFAULT (datetime('now')),
      updated_at TEXT NOT NULL DEFAULT (datetime('now'))
    );

    CREATE TABLE IF NOT EXISTS income_records (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      amount REAL NOT NULL,
      source TEXT,
      date TEXT NOT NULL,
      is_outlier INTEGER NOT NULL DEFAULT 0,
      outlier_reason TEXT,
      transaction_id INTEGER REFERENCES transactions(id),
      notes TEXT,
      created_at TEXT NOT NULL DEFAULT (datetime('now'))
    );

    CREATE TABLE IF NOT EXISTS filter_rules (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      name TEXT NOT NULL,
      pattern TEXT NOT NULL,
      match_type TEXT NOT NULL DEFAULT 'keyword',
      category_id INTEGER REFERENCES categories(id),
      bucket_id INTEGER REFERENCES budget_buckets(id),
      priority INTEGER NOT NULL DEFAULT 0,
      is_active INTEGER NOT NULL DEFAULT 1,
      matched_count INTEGER NOT NULL DEFAULT 0,
      created_at TEXT NOT NULL DEFAULT (datetime('now'))
    );

    CREATE TABLE IF NOT EXISTS assets (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      name TEXT NOT NULL,
      type TEXT NOT NULL,
      purchase_value REAL NOT NULL,
      current_value REAL NOT NULL,
      purchase_date TEXT,
      depreciation_rate REAL,
      valuation_source TEXT,
      last_valuated_at TEXT,
      vin TEXT,
      address TEXT,
      notes TEXT,
      created_at TEXT NOT NULL DEFAULT (datetime('now')),
      updated_at TEXT NOT NULL DEFAULT (datetime('now'))
    );

    CREATE TABLE IF NOT EXISTS net_worth_snapshots (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      date TEXT NOT NULL UNIQUE,
      total_assets REAL NOT NULL,
      total_liabilities REAL NOT NULL,
      net_worth REAL NOT NULL,
      created_at TEXT NOT NULL DEFAULT (datetime('now'))
    );

    CREATE TABLE IF NOT EXISTS ai_settings (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      provider TEXT NOT NULL DEFAULT 'none',
      api_key TEXT,
      model TEXT,
      endpoint TEXT DEFAULT 'http://localhost:1234/v1',
      updated_at TEXT NOT NULL DEFAULT (datetime('now'))
    );
  `)
  console.log(`  ✓ Database ready at ${dbPath}`)
}
