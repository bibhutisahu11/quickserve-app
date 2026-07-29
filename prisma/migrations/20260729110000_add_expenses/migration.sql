CREATE TABLE IF NOT EXISTS "expenses" (
  "id"          TEXT NOT NULL PRIMARY KEY,
  "amount"      DOUBLE PRECISION NOT NULL,
  "category"    TEXT NOT NULL,
  "description" TEXT,
  "date"        TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  "paymentMode" TEXT NOT NULL DEFAULT 'Cash',
  "orgId"       TEXT,
  "addedBy"     TEXT,
  "createdAt"   TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  "updatedAt"   TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  CONSTRAINT "expenses_orgId_fkey"
    FOREIGN KEY ("orgId") REFERENCES "organizations"("id") ON DELETE SET NULL
);
