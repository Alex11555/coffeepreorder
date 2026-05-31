-- Add the unlock flag the Raspberry Pi polls for.
ALTER TABLE "Locker" ADD COLUMN "unlockPending" BOOLEAN NOT NULL DEFAULT false;
