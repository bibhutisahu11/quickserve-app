-- Create discounts table
CREATE TABLE IF NOT EXISTS "discounts" (
  "id"          TEXT NOT NULL,
  "orgId"       TEXT NOT NULL,
  "name"        TEXT NOT NULL,
  "description" TEXT,
  "type"        TEXT NOT NULL,
  "value"       DOUBLE PRECISION NOT NULL,
  "scope"       TEXT NOT NULL DEFAULT 'ALL',
  "itemIds"     TEXT[] NOT NULL DEFAULT '{}',
  "categories"  TEXT[] NOT NULL DEFAULT '{}',
  "daysOfWeek"  INTEGER[] NOT NULL DEFAULT '{}',
  "minOrder"    DOUBLE PRECISION,
  "active"      BOOLEAN NOT NULL DEFAULT true,
  "validFrom"   TIMESTAMP(3),
  "validTo"     TIMESTAMP(3),
  "createdAt"   TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  "updatedAt"   TIMESTAMP(3) NOT NULL,

  CONSTRAINT "discounts_pkey" PRIMARY KEY ("id"),
  CONSTRAINT "discounts_orgId_fkey" FOREIGN KEY ("orgId") REFERENCES "organizations"("id") ON DELETE CASCADE
);

-- Add discountAmount to orders
ALTER TABLE "orders"
  ADD COLUMN IF NOT EXISTS "discountAmount" DOUBLE PRECISION NOT NULL DEFAULT 0;
