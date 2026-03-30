/*
  Warnings:

  - You are about to drop the column `student_id` on the `bookings` table. All the data in the column will be lost.
  - You are about to drop the column `student_id` on the `complaints` table. All the data in the column will be lost.
  - You are about to drop the column `student_id` on the `reviews` table. All the data in the column will be lost.
  - You are about to drop the column `student_id` on the `saved_hostels` table. All the data in the column will be lost.
  - A unique constraint covering the columns `[user_id,hostel_id,booking_id]` on the table `reviews` will be added. If there are existing duplicate values, this will fail.
  - A unique constraint covering the columns `[user_id,hostel_id]` on the table `saved_hostels` will be added. If there are existing duplicate values, this will fail.
  - Added the required column `booker_id` to the `bookings` table without a default value. This is not possible if the table is not empty.
  - Added the required column `user_id` to the `complaints` table without a default value. This is not possible if the table is not empty.
  - Added the required column `user_id` to the `reviews` table without a default value. This is not possible if the table is not empty.
  - Added the required column `user_id` to the `saved_hostels` table without a default value. This is not possible if the table is not empty.

*/
-- CreateEnum
CREATE TYPE "GuestType" AS ENUM ('PARENT_GUARDIAN', 'UNIVERSITY_STAFF', 'PROSPECTIVE_STUDENT', 'VISITOR');

-- AlterEnum
ALTER TYPE "UserRole" ADD VALUE 'GUEST';

-- DropForeignKey
ALTER TABLE "bookings" DROP CONSTRAINT "bookings_student_id_fkey";

-- DropForeignKey
ALTER TABLE "complaints" DROP CONSTRAINT "complaints_student_id_fkey";

-- DropForeignKey
ALTER TABLE "reviews" DROP CONSTRAINT "reviews_student_id_fkey";

-- DropForeignKey
ALTER TABLE "saved_hostels" DROP CONSTRAINT "saved_hostels_student_id_fkey";

-- DropIndex
DROP INDEX "reviews_student_id_hostel_id_booking_id_key";

-- DropIndex
DROP INDEX "saved_hostels_student_id_hostel_id_key";

-- DropIndex
DROP INDEX "saved_hostels_student_id_idx";

-- AlterTable
ALTER TABLE "bookings" DROP COLUMN "student_id",
ADD COLUMN     "booker_id" TEXT NOT NULL,
ADD COLUMN     "is_booking_for_self" BOOLEAN NOT NULL DEFAULT true,
ADD COLUMN     "occupant_email" TEXT,
ADD COLUMN     "occupant_name" TEXT,
ADD COLUMN     "occupant_phone" TEXT;

-- AlterTable
ALTER TABLE "complaints" DROP COLUMN "student_id",
ADD COLUMN     "user_id" TEXT NOT NULL;

-- AlterTable
ALTER TABLE "reviews" DROP COLUMN "student_id",
ADD COLUMN     "user_id" TEXT NOT NULL;

-- AlterTable
ALTER TABLE "saved_hostels" DROP COLUMN "student_id",
ADD COLUMN     "user_id" TEXT NOT NULL;

-- CreateTable
CREATE TABLE "guest_profiles" (
    "id" TEXT NOT NULL,
    "user_id" TEXT NOT NULL,
    "guest_type" "GuestType" NOT NULL,
    "beneficiary_name" TEXT,
    "beneficiary_phone" TEXT,
    "beneficiary_email" TEXT,
    "relationship_type" TEXT,
    "staff_id" TEXT,
    "department" TEXT,
    "admission_number" TEXT,
    "expected_matric_date" TIMESTAMP(3),
    "programme_admitted" TEXT,
    "purpose" TEXT,
    "organization" TEXT,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "guest_profiles_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "guest_profiles_user_id_key" ON "guest_profiles"("user_id");

-- CreateIndex
CREATE INDEX "bookings_booker_id_idx" ON "bookings"("booker_id");

-- CreateIndex
CREATE UNIQUE INDEX "reviews_user_id_hostel_id_booking_id_key" ON "reviews"("user_id", "hostel_id", "booking_id");

-- CreateIndex
CREATE INDEX "saved_hostels_user_id_idx" ON "saved_hostels"("user_id");

-- CreateIndex
CREATE UNIQUE INDEX "saved_hostels_user_id_hostel_id_key" ON "saved_hostels"("user_id", "hostel_id");

-- AddForeignKey
ALTER TABLE "guest_profiles" ADD CONSTRAINT "guest_profiles_user_id_fkey" FOREIGN KEY ("user_id") REFERENCES "users"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "saved_hostels" ADD CONSTRAINT "saved_hostels_user_id_fkey" FOREIGN KEY ("user_id") REFERENCES "users"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "bookings" ADD CONSTRAINT "bookings_booker_id_fkey" FOREIGN KEY ("booker_id") REFERENCES "users"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "complaints" ADD CONSTRAINT "complaints_user_id_fkey" FOREIGN KEY ("user_id") REFERENCES "users"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "reviews" ADD CONSTRAINT "reviews_user_id_fkey" FOREIGN KEY ("user_id") REFERENCES "users"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
