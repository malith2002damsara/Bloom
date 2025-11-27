-- Migration: Add separate columns for each size's pricing and details
-- Purpose: Store individual size data in dedicated columns for easier querying
-- Date: 2025-11-27

-- Add columns for SMALL size
ALTER TABLE products ADD COLUMN IF NOT EXISTS "smallPrice" NUMERIC(10, 2) DEFAULT NULL;
ALTER TABLE products ADD COLUMN IF NOT EXISTS "smallOldPrice" NUMERIC(10, 2) DEFAULT NULL;
ALTER TABLE products ADD COLUMN IF NOT EXISTS "smallDiscount" NUMERIC(5, 2) DEFAULT NULL;
ALTER TABLE products ADD COLUMN IF NOT EXISTS "smallDiscountedPrice" NUMERIC(10, 2) DEFAULT NULL;
ALTER TABLE products ADD COLUMN IF NOT EXISTS "smallFlowerCount" INTEGER DEFAULT NULL;
ALTER TABLE products ADD COLUMN IF NOT EXISTS "smallDimensionsHeight" NUMERIC(10, 2) DEFAULT NULL;
ALTER TABLE products ADD COLUMN IF NOT EXISTS "smallDimensionsWidth" NUMERIC(10, 2) DEFAULT NULL;
ALTER TABLE products ADD COLUMN IF NOT EXISTS "smallDimensionsDepth" NUMERIC(10, 2) DEFAULT NULL;

-- Add columns for MEDIUM size
ALTER TABLE products ADD COLUMN IF NOT EXISTS "mediumPrice" NUMERIC(10, 2) DEFAULT NULL;
ALTER TABLE products ADD COLUMN IF NOT EXISTS "mediumOldPrice" NUMERIC(10, 2) DEFAULT NULL;
ALTER TABLE products ADD COLUMN IF NOT EXISTS "mediumDiscount" NUMERIC(5, 2) DEFAULT NULL;
ALTER TABLE products ADD COLUMN IF NOT EXISTS "mediumDiscountedPrice" NUMERIC(10, 2) DEFAULT NULL;
ALTER TABLE products ADD COLUMN IF NOT EXISTS "mediumFlowerCount" INTEGER DEFAULT NULL;
ALTER TABLE products ADD COLUMN IF NOT EXISTS "mediumDimensionsHeight" NUMERIC(10, 2) DEFAULT NULL;
ALTER TABLE products ADD COLUMN IF NOT EXISTS "mediumDimensionsWidth" NUMERIC(10, 2) DEFAULT NULL;
ALTER TABLE products ADD COLUMN IF NOT EXISTS "mediumDimensionsDepth" NUMERIC(10, 2) DEFAULT NULL;

-- Add columns for LARGE size
ALTER TABLE products ADD COLUMN IF NOT EXISTS "largePrice" NUMERIC(10, 2) DEFAULT NULL;
ALTER TABLE products ADD COLUMN IF NOT EXISTS "largeOldPrice" NUMERIC(10, 2) DEFAULT NULL;
ALTER TABLE products ADD COLUMN IF NOT EXISTS "largeDiscount" NUMERIC(5, 2) DEFAULT NULL;
ALTER TABLE products ADD COLUMN IF NOT EXISTS "largeDiscountedPrice" NUMERIC(10, 2) DEFAULT NULL;
ALTER TABLE products ADD COLUMN IF NOT EXISTS "largeFlowerCount" INTEGER DEFAULT NULL;
ALTER TABLE products ADD COLUMN IF NOT EXISTS "largeDimensionsHeight" NUMERIC(10, 2) DEFAULT NULL;
ALTER TABLE products ADD COLUMN IF NOT EXISTS "largeDimensionsWidth" NUMERIC(10, 2) DEFAULT NULL;
ALTER TABLE products ADD COLUMN IF NOT EXISTS "largeDimensionsDepth" NUMERIC(10, 2) DEFAULT NULL;

-- Add columns for EXTRA LARGE size
ALTER TABLE products ADD COLUMN IF NOT EXISTS "extraLargePrice" NUMERIC(10, 2) DEFAULT NULL;
ALTER TABLE products ADD COLUMN IF NOT EXISTS "extraLargeOldPrice" NUMERIC(10, 2) DEFAULT NULL;
ALTER TABLE products ADD COLUMN IF NOT EXISTS "extraLargeDiscount" NUMERIC(5, 2) DEFAULT NULL;
ALTER TABLE products ADD COLUMN IF NOT EXISTS "extraLargeDiscountedPrice" NUMERIC(10, 2) DEFAULT NULL;
ALTER TABLE products ADD COLUMN IF NOT EXISTS "extraLargeFlowerCount" INTEGER DEFAULT NULL;
ALTER TABLE products ADD COLUMN IF NOT EXISTS "extraLargeDimensionsHeight" NUMERIC(10, 2) DEFAULT NULL;
ALTER TABLE products ADD COLUMN IF NOT EXISTS "extraLargeDimensionsWidth" NUMERIC(10, 2) DEFAULT NULL;
ALTER TABLE products ADD COLUMN IF NOT EXISTS "extraLargeDimensionsDepth" NUMERIC(10, 2) DEFAULT NULL;

-- Create indexes for better query performance
CREATE INDEX IF NOT EXISTS idx_products_small_price ON products ("smallPrice");
CREATE INDEX IF NOT EXISTS idx_products_medium_price ON products ("mediumPrice");
CREATE INDEX IF NOT EXISTS idx_products_large_price ON products ("largePrice");
CREATE INDEX IF NOT EXISTS idx_products_extralarge_price ON products ("extraLargePrice");

-- Verify columns were added
SELECT column_name, data_type, is_nullable 
FROM information_schema.columns 
WHERE table_name = 'products' 
  AND column_name LIKE '%small%' 
  OR column_name LIKE '%medium%' 
  OR column_name LIKE '%large%'
ORDER BY ordinal_position;

COMMENT ON COLUMN products."smallPrice" IS 'Price for small size variant';
COMMENT ON COLUMN products."smallOldPrice" IS 'Old price for small size (before discount)';
COMMENT ON COLUMN products."smallDiscount" IS 'Discount percentage for small size';
COMMENT ON COLUMN products."smallDiscountedPrice" IS 'Final price after discount for small size';
COMMENT ON COLUMN products."smallFlowerCount" IS 'Number of flowers in small size';
COMMENT ON COLUMN products."smallDimensionsHeight" IS 'Height dimension for small size (cm)';
COMMENT ON COLUMN products."smallDimensionsWidth" IS 'Width dimension for small size (cm)';
COMMENT ON COLUMN products."smallDimensionsDepth" IS 'Depth dimension for small size (cm)';

-- Repeat comments for medium, large, and extra large sizes...

-- Migration complete
SELECT 'Migration completed successfully!' AS status;
