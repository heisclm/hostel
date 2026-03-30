/*
  Warnings:

  - Added the required column `base_amount` to the `bookings` table without a default value. This is not possible if the table is not empty.

*/

ALTER TABLE "bookings" ADD COLUMN "base_amount" DECIMAL(10,2);
ALTER TABLE "bookings" ADD COLUMN "platform_fee" DECIMAL(10,2);
ALTER TABLE "bookings" ADD COLUMN "platform_fee_percent" DOUBLE PRECISION;

UPDATE "bookings" SET
  "base_amount" = "total_amount",
  "platform_fee" = 0,
  "platform_fee_percent" = 2.0;

ALTER TABLE "bookings" ALTER COLUMN "base_amount" SET NOT NULL;
ALTER TABLE "bookings" ALTER COLUMN "platform_fee" SET NOT NULL;
ALTER TABLE "bookings" ALTER COLUMN "platform_fee" SET DEFAULT 0;
ALTER TABLE "bookings" ALTER COLUMN "platform_fee_percent" SET NOT NULL;
ALTER TABLE "bookings" ALTER COLUMN "platform_fee_percent" SET DEFAULT 2.0;