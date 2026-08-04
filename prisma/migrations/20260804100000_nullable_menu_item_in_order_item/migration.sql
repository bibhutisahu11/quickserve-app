-- Make menuItemId nullable so menu items can be deleted without losing order history
ALTER TABLE "order_items" ALTER COLUMN "menuItemId" DROP NOT NULL;

-- Drop old FK constraint and re-add with ON DELETE SET NULL
ALTER TABLE "order_items" DROP CONSTRAINT IF EXISTS "order_items_menuItemId_fkey";

ALTER TABLE "order_items"
  ADD CONSTRAINT "order_items_menuItemId_fkey"
  FOREIGN KEY ("menuItemId") REFERENCES "menu_items"("id") ON DELETE SET NULL ON UPDATE CASCADE;
