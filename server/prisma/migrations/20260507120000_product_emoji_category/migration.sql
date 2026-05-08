-- Add emoji + category columns to Product so the UI can render tiles.
ALTER TABLE "Product" ADD COLUMN "emoji" TEXT;
ALTER TABLE "Product" ADD COLUMN "category" TEXT;
