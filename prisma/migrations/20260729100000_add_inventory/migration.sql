CREATE TYPE IF NOT EXISTS "StockLogType" AS ENUM ('IN', 'OUT', 'ADJUSTMENT');

CREATE TABLE IF NOT EXISTS "inventory_items" (
  "id"        TEXT NOT NULL PRIMARY KEY,
  "name"      TEXT NOT NULL,
  "category"  TEXT NOT NULL DEFAULT 'General',
  "quantity"  DOUBLE PRECISION NOT NULL DEFAULT 0,
  "unit"      TEXT NOT NULL DEFAULT 'units',
  "minStock"  DOUBLE PRECISION NOT NULL DEFAULT 0,
  "orgId"     TEXT,
  "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  "updatedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  CONSTRAINT "inventory_items_orgId_fkey"
    FOREIGN KEY ("orgId") REFERENCES "organizations"("id") ON DELETE SET NULL
);

CREATE TABLE IF NOT EXISTS "stock_logs" (
  "id"        TEXT NOT NULL PRIMARY KEY,
  "itemId"    TEXT NOT NULL,
  "change"    DOUBLE PRECISION NOT NULL,
  "note"      TEXT,
  "type"      "StockLogType" NOT NULL,
  "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  CONSTRAINT "stock_logs_itemId_fkey"
    FOREIGN KEY ("itemId") REFERENCES "inventory_items"("id") ON DELETE CASCADE
);
