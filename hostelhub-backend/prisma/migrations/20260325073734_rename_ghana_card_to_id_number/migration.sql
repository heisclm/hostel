/*
  Warnings:

  - You are about to drop the column `ghana_card_number` on the `manager_profiles` table. All the data in the column will be lost.
  - Added the required column `id_number` to the `manager_profiles` table without a default value. This is not possible if the table is not empty.

*/
-- AlterTable
ALTER TABLE "manager_profiles" DROP COLUMN "ghana_card_number",
ADD COLUMN     "id_number" TEXT NOT NULL,
ADD COLUMN     "id_type" TEXT NOT NULL DEFAULT 'ghana_card';
