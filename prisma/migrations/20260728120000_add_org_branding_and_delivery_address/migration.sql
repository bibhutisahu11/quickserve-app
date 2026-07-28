-- Add branding / business info fields to organizations
ALTER TABLE "organizations"
  ADD COLUMN IF NOT EXISTS "address"     TEXT,
  ADD COLUMN IF NOT EXISTS "phone"       TEXT,
  ADD COLUMN IF NOT EXISTS "email"       TEXT,
  ADD COLUMN IF NOT EXISTS "gstNumber"   TEXT,
  ADD COLUMN IF NOT EXISTS "fssaiNumber" TEXT,
  ADD COLUMN IF NOT EXISTS "tagline"     TEXT,
  ADD COLUMN IF NOT EXISTS "footerText"  TEXT;

-- Add delivery address to orders (for parcel orders)
ALTER TABLE "orders"
  ADD COLUMN IF NOT EXISTS "deliveryAddress" TEXT;
