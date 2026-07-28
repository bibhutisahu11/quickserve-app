-- CreateEnum: Role
CREATE TYPE "Role" AS ENUM ('SUPER_ADMIN', 'HOTEL_ADMIN', 'MANAGER', 'WAITER', 'KITCHEN');

-- CreateTable: organizations
CREATE TABLE "organizations" (
    "id" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "slug" TEXT NOT NULL,
    "logoUrl" TEXT,
    "active" BOOLEAN NOT NULL DEFAULT true,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "organizations_pkey" PRIMARY KEY ("id")
);

CREATE UNIQUE INDEX "organizations_slug_key" ON "organizations"("slug");

-- Insert the default organization (all existing data will be assigned to this org)
INSERT INTO "organizations" ("id", "name", "slug", "active", "createdAt", "updatedAt")
VALUES ('default-org-seed-id-000001', 'My Hotel', 'my-hotel', true, CURRENT_TIMESTAMP, CURRENT_TIMESTAMP);

-- Rename Admin → admins and add role + orgId columns
ALTER TABLE "Admin" RENAME TO "admins";

-- Rename the primary key and unique index constraints
ALTER TABLE "admins" RENAME CONSTRAINT "Admin_pkey" TO "admins_pkey";
ALTER INDEX "Admin_email_key" RENAME TO "admins_email_key";

ALTER TABLE "admins" ADD COLUMN "role" "Role" NOT NULL DEFAULT 'HOTEL_ADMIN';
ALTER TABLE "admins" ADD COLUMN "orgId" TEXT;

-- Backfill existing admins → default org
UPDATE "admins" SET "orgId" = 'default-org-seed-id-000001';

-- Add foreign key for admins → organizations
ALTER TABLE "admins" ADD CONSTRAINT "admins_orgId_fkey"
    FOREIGN KEY ("orgId") REFERENCES "organizations"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddColumn: orgId to tables
ALTER TABLE "tables" ADD COLUMN "orgId" TEXT;
UPDATE "tables" SET "orgId" = 'default-org-seed-id-000001';
ALTER TABLE "tables" ADD CONSTRAINT "tables_orgId_fkey"
    FOREIGN KEY ("orgId") REFERENCES "organizations"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddColumn: orgId to menu_items
ALTER TABLE "menu_items" ADD COLUMN "orgId" TEXT;
UPDATE "menu_items" SET "orgId" = 'default-org-seed-id-000001';
ALTER TABLE "menu_items" ADD CONSTRAINT "menu_items_orgId_fkey"
    FOREIGN KEY ("orgId") REFERENCES "organizations"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddColumn: orgId to orders (and paymentId if not present)
DO $$ BEGIN
  IF NOT EXISTS (SELECT 1 FROM information_schema.columns
                 WHERE table_name='orders' AND column_name='paymentId') THEN
    ALTER TABLE "orders" ADD COLUMN "paymentId" TEXT;
  END IF;
END $$;

ALTER TABLE "orders" ADD COLUMN "orgId" TEXT;
UPDATE "orders" SET "orgId" = 'default-org-seed-id-000001';
ALTER TABLE "orders" ADD CONSTRAINT "orders_orgId_fkey"
    FOREIGN KEY ("orgId") REFERENCES "organizations"("id") ON DELETE SET NULL ON UPDATE CASCADE;
