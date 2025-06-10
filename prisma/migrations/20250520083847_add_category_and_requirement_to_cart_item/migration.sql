/*
  Warnings:

  - You are about to drop the `SavedBusiness` table. If the table is not empty, all the data it contains will be lost.
  - You are about to drop the `SavedItem` table. If the table is not empty, all the data it contains will be lost.

*/
-- DropForeignKey
ALTER TABLE "SavedBusiness" DROP CONSTRAINT "SavedBusiness_businessId_fkey";

-- DropForeignKey
ALTER TABLE "SavedBusiness" DROP CONSTRAINT "SavedBusiness_userId_fkey";

-- DropForeignKey
ALTER TABLE "SavedItem" DROP CONSTRAINT "SavedItem_productId_fkey";

-- DropForeignKey
ALTER TABLE "SavedItem" DROP CONSTRAINT "SavedItem_savedBusinessId_fkey";

-- DropTable
DROP TABLE "SavedBusiness";

-- DropTable
DROP TABLE "SavedItem";
