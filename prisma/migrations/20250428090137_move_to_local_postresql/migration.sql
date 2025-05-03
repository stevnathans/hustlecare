/*
  Warnings:

  - You are about to drop the column `slug` on the `Business` table. All the data in the column will be lost.
  - A unique constraint covering the columns `[name]` on the table `Business` will be added. If there are existing duplicate values, this will fail.

*/
-- DropIndex
DROP INDEX "Business_slug_key";

-- AlterTable
ALTER TABLE "Business" DROP COLUMN "slug";

-- CreateIndex
CREATE UNIQUE INDEX "Business_name_key" ON "Business"("name");
