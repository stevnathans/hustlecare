/*
  Warnings:

  - You are about to drop the column `requirementId` on the `Product` table. All the data in the column will be lost.
  - You are about to drop the column `tags` on the `Product` table. All the data in the column will be lost.
  - You are about to drop the column `category` on the `Requirement` table. All the data in the column will be lost.
  - You are about to drop the column `categoryId` on the `Requirement` table. All the data in the column will be lost.
  - You are about to drop the `Category` table. If the table is not empty, all the data it contains will be lost.
  - You are about to drop the `RequirementProduct` table. If the table is not empty, all the data it contains will be lost.
  - Made the column `businessId` on table `Requirement` required. This step will fail if there are existing NULL values in that column.
  - Added the required column `updatedAt` to the `Review` table without a default value. This is not possible if the table is not empty.

*/
-- DropForeignKey
ALTER TABLE "Category" DROP CONSTRAINT "Category_businessId_fkey";

-- DropForeignKey
ALTER TABLE "Product" DROP CONSTRAINT "Product_requirementId_fkey";

-- DropForeignKey
ALTER TABLE "Requirement" DROP CONSTRAINT "Requirement_businessId_fkey";

-- DropForeignKey
ALTER TABLE "Requirement" DROP CONSTRAINT "Requirement_categoryId_fkey";

-- DropForeignKey
ALTER TABLE "RequirementProduct" DROP CONSTRAINT "RequirementProduct_productId_fkey";

-- DropForeignKey
ALTER TABLE "RequirementProduct" DROP CONSTRAINT "RequirementProduct_requirementId_fkey";

-- AlterTable
ALTER TABLE "Product" DROP COLUMN "requirementId",
DROP COLUMN "tags";

-- AlterTable
ALTER TABLE "Requirement" DROP COLUMN "category",
DROP COLUMN "categoryId",
ALTER COLUMN "businessId" SET NOT NULL;

-- AlterTable
ALTER TABLE "Review" ADD COLUMN     "updatedAt" TIMESTAMP(3) NOT NULL;

-- DropTable
DROP TABLE "Category";

-- DropTable
DROP TABLE "RequirementProduct";

-- AddForeignKey
ALTER TABLE "Requirement" ADD CONSTRAINT "Requirement_businessId_fkey" FOREIGN KEY ("businessId") REFERENCES "Business"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
