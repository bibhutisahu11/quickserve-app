-- Add BILLER value to Role enum
DO $$ BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_enum
    WHERE enumlabel = 'BILLER'
      AND enumtypid = (SELECT oid FROM pg_type WHERE typname = 'Role')
  ) THEN
    ALTER TYPE "Role" ADD VALUE 'BILLER';
  END IF;
END $$;
