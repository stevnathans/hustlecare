/*
  Warnings:

  - You are about to drop the column `cost` on the `Requirement` table. All the data in the column will be lost.
  - You are about to drop the column `title` on the `Requirement` table. All the data in the column will be lost.
  - Added the required column `category` to the `Requirement` table without a default value. This is not possible if the table is not empty.
  - Added the required column `name` to the `Requirement` table without a default value. This is not possible if the table is not empty.
  - Added the required column `necessity` to the `Requirement` table without a default value. This is not possible if the table is not empty.

*/
-- DropForeignKey
ALTER TABLE "Requirement" DROP CONSTRAINT "Requirement_categoryId_fkey";

-- AlterTable
ALTER TABLE "Requirement" DROP COLUMN "cost",
DROP COLUMN "title",
ADD COLUMN     "businessId" INTEGER,
ADD COLUMN     "category" TEXT NOT NULL,
ADD COLUMN     "image" TEXT,
ADD COLUMN     "name" TEXT NOT NULL,
ADD COLUMN     "necessity" TEXT NOT NULL,
ALTER COLUMN "categoryId" DROP NOT NULL;

-- AddForeignKey
ALTER TABLE "Requirement" ADD CONSTRAINT "Requirement_businessId_fkey" FOREIGN KEY ("businessId") REFERENCES "Business"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Requirement" ADD CONSTRAINT "Requirement_categoryId_fkey" FOREIGN KEY ("categoryId") REFERENCES "Category"("id") ON DELETE SET NULL ON UPDATE CASCADE;
