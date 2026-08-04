-- Add PAYMENT_PENDING value to OrderStatus enum
DO $$ BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_enum
    WHERE enumlabel = 'PAYMENT_PENDING'
      AND enumtypid = (SELECT oid FROM pg_type WHERE typname = 'OrderStatus')
  ) THEN
    ALTER TYPE "OrderStatus" ADD VALUE 'PAYMENT_PENDING';
  END IF;
END $$;

-- Add UPI payment fields to orders table
ALTER TABLE "orders"
  ADD COLUMN IF NOT EXISTS "upiUtr"            TEXT,
  ADD COLUMN IF NOT EXISTS "paymentScreenshot" TEXT,
  ADD COLUMN IF NOT EXISTS "paymentVerified"   BOOLEAN NOT NULL DEFAULT false,
  ADD COLUMN IF NOT EXISTS "nudgeCount"        INTEGER NOT NULL DEFAULT 0,
  ADD COLUMN IF NOT EXISTS "nudgedAt"          TIMESTAMP(3);

-- Add UPI ID to organizations table
ALTER TABLE "organizations"
  ADD COLUMN IF NOT EXISTS "upiId" TEXT;
