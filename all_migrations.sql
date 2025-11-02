
-- migration: 20250423031603_init

-- CreateTable
CREATE TABLE "User" (
    "id" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "email" TEXT NOT NULL,
    "password" TEXT NOT NULL,
    "role" TEXT NOT NULL DEFAULT 'user',
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "User_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "SavedList" (
    "id" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "productId" INTEGER NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "SavedList_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "CartItem" (
    "id" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "productId" INTEGER NOT NULL,
    "quantity" INTEGER NOT NULL DEFAULT 1,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "CartItem_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Business" (
    "id" SERIAL NOT NULL,
    "name" TEXT NOT NULL,
    "description" TEXT,
    "image" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "Business_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Category" (
    "id" SERIAL NOT NULL,
    "name" TEXT NOT NULL,
    "businessId" INTEGER NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "Category_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Requirement" (
    "id" SERIAL NOT NULL,
    "title" TEXT NOT NULL,
    "description" TEXT,
    "cost" DOUBLE PRECISION,
    "categoryId" INTEGER NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "Requirement_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Comment" (
    "id" SERIAL NOT NULL,
    "content" TEXT NOT NULL,
    "requirementId" INTEGER NOT NULL,
    "userId" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "Comment_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Product" (
    "id" SERIAL NOT NULL,
    "name" TEXT NOT NULL,
    "description" TEXT,
    "price" DOUBLE PRECISION,
    "image" TEXT,
    "requirementId" INTEGER NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "Product_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Review" (
    "id" TEXT NOT NULL,
    "productId" INTEGER NOT NULL,
    "userId" TEXT NOT NULL,
    "rating" INTEGER NOT NULL,
    "comment" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "Review_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "User_email_key" ON "User"("email");

-- AddForeignKey
ALTER TABLE "SavedList" ADD CONSTRAINT "SavedList_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "SavedList" ADD CONSTRAINT "SavedList_productId_fkey" FOREIGN KEY ("productId") REFERENCES "Product"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "CartItem" ADD CONSTRAINT "CartItem_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "CartItem" ADD CONSTRAINT "CartItem_productId_fkey" FOREIGN KEY ("productId") REFERENCES "Product"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Category" ADD CONSTRAINT "Category_businessId_fkey" FOREIGN KEY ("businessId") REFERENCES "Business"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Requirement" ADD CONSTRAINT "Requirement_categoryId_fkey" FOREIGN KEY ("categoryId") REFERENCES "Category"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Comment" ADD CONSTRAINT "Comment_requirementId_fkey" FOREIGN KEY ("requirementId") REFERENCES "Requirement"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Comment" ADD CONSTRAINT "Comment_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Product" ADD CONSTRAINT "Product_requirementId_fkey" FOREIGN KEY ("requirementId") REFERENCES "Requirement"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Review" ADD CONSTRAINT "Review_productId_fkey" FOREIGN KEY ("productId") REFERENCES "Product"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Review" ADD CONSTRAINT "Review_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- migration: 20250423135104_add_business_and_necessity_to_requirements

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

-- migration: 20250424100415_update_product_model

-- DropForeignKey
ALTER TABLE "Product" DROP CONSTRAINT "Product_requirementId_fkey";

-- AlterTable
ALTER TABLE "Product" ADD COLUMN     "tags" TEXT[],
ALTER COLUMN "requirementId" DROP NOT NULL;

-- CreateTable
CREATE TABLE "RequirementProduct" (
    "id" SERIAL NOT NULL,
    "requirementId" INTEGER NOT NULL,
    "productId" INTEGER NOT NULL,
    "isManual" BOOLEAN NOT NULL DEFAULT true,

    CONSTRAINT "RequirementProduct_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "RequirementProduct_requirementId_productId_key" ON "RequirementProduct"("requirementId", "productId");

-- AddForeignKey
ALTER TABLE "Product" ADD CONSTRAINT "Product_requirementId_fkey" FOREIGN KEY ("requirementId") REFERENCES "Requirement"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "RequirementProduct" ADD CONSTRAINT "RequirementProduct_requirementId_fkey" FOREIGN KEY ("requirementId") REFERENCES "Requirement"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "RequirementProduct" ADD CONSTRAINT "RequirementProduct_productId_fkey" FOREIGN KEY ("productId") REFERENCES "Product"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- migration: 20250424143325_remove_categories

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

-- migration: 20250424164658_added_category_to_requirement

-- AlterTable
ALTER TABLE "Requirement" ADD COLUMN     "category" TEXT;

-- migration: 20250424202948_add_slug_optional

/*
  Warnings:

  - A unique constraint covering the columns `[slug]` on the table `Business` will be added. If there are existing duplicate values, this will fail.

*/
-- AlterTable
ALTER TABLE "Business" ADD COLUMN     "slug" TEXT;

-- CreateIndex
CREATE UNIQUE INDEX "Business_slug_key" ON "Business"("slug");

-- migration: 20250428090137_move_to_local_postresql

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

-- migration: 20250428092146_readded_slug

/*
  Warnings:

  - A unique constraint covering the columns `[slug]` on the table `Business` will be added. If there are existing duplicate values, this will fail.
  - Added the required column `slug` to the `Business` table without a default value. This is not possible if the table is not empty.

*/
-- DropIndex
DROP INDEX "Business_name_key";

-- AlterTable
ALTER TABLE "Business" ADD COLUMN     "slug" TEXT NOT NULL;

-- CreateIndex
CREATE UNIQUE INDEX "Business_slug_key" ON "Business"("slug");

-- migration: 20250504072759_update_cart_schema

/*
  Warnings:

  - You are about to drop the column `userId` on the `CartItem` table. All the data in the column will be lost.
  - You are about to drop the `SavedList` table. If the table is not empty, all the data it contains will be lost.
  - Added the required column `cartId` to the `CartItem` table without a default value. This is not possible if the table is not empty.
  - Added the required column `unitPrice` to the `CartItem` table without a default value. This is not possible if the table is not empty.
  - Added the required column `updatedAt` to the `CartItem` table without a default value. This is not possible if the table is not empty.

*/
-- DropForeignKey
ALTER TABLE "CartItem" DROP CONSTRAINT "CartItem_userId_fkey";

-- DropForeignKey
ALTER TABLE "SavedList" DROP CONSTRAINT "SavedList_productId_fkey";

-- DropForeignKey
ALTER TABLE "SavedList" DROP CONSTRAINT "SavedList_userId_fkey";

-- AlterTable
ALTER TABLE "CartItem" DROP COLUMN "userId",
ADD COLUMN     "cartId" TEXT NOT NULL,
ADD COLUMN     "unitPrice" DOUBLE PRECISION NOT NULL,
ADD COLUMN     "updatedAt" TIMESTAMP(3) NOT NULL;

-- DropTable
DROP TABLE "SavedList";

-- CreateTable
CREATE TABLE "Cart" (
    "id" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "businessId" INTEGER NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,
    "productId" INTEGER,

    CONSTRAINT "Cart_pkey" PRIMARY KEY ("id")
);

-- AddForeignKey
ALTER TABLE "Cart" ADD CONSTRAINT "Cart_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Cart" ADD CONSTRAINT "Cart_businessId_fkey" FOREIGN KEY ("businessId") REFERENCES "Business"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Cart" ADD CONSTRAINT "Cart_productId_fkey" FOREIGN KEY ("productId") REFERENCES "Product"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "CartItem" ADD CONSTRAINT "CartItem_cartId_fkey" FOREIGN KEY ("cartId") REFERENCES "Cart"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- migration: 20250507145121_init_nextauth_tables

-- AlterTable
ALTER TABLE "User" ADD COLUMN     "emailVerified" TIMESTAMP(3),
ADD COLUMN     "image" TEXT,
ALTER COLUMN "password" DROP NOT NULL;

-- CreateTable
CREATE TABLE "Account" (
    "id" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "type" TEXT NOT NULL,
    "provider" TEXT NOT NULL,
    "providerAccountId" TEXT NOT NULL,
    "refresh_token" TEXT,
    "access_token" TEXT,
    "expires_at" INTEGER,
    "token_type" TEXT,
    "scope" TEXT,
    "id_token" TEXT,
    "session_state" TEXT,

    CONSTRAINT "Account_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Session" (
    "id" TEXT NOT NULL,
    "sessionToken" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "expires" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "Session_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "VerificationToken" (
    "identifier" TEXT NOT NULL,
    "token" TEXT NOT NULL,
    "expires" TIMESTAMP(3) NOT NULL
);

-- CreateIndex
CREATE UNIQUE INDEX "Account_provider_providerAccountId_key" ON "Account"("provider", "providerAccountId");

-- CreateIndex
CREATE UNIQUE INDEX "Session_sessionToken_key" ON "Session"("sessionToken");

-- CreateIndex
CREATE UNIQUE INDEX "VerificationToken_token_key" ON "VerificationToken"("token");

-- CreateIndex
CREATE UNIQUE INDEX "VerificationToken_identifier_token_key" ON "VerificationToken"("identifier", "token");

-- AddForeignKey
ALTER TABLE "Account" ADD CONSTRAINT "Account_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Session" ADD CONSTRAINT "Session_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- migration: 20250508045748_fix_cart_model

/*
  Warnings:

  - You are about to drop the column `productId` on the `Cart` table. All the data in the column will be lost.

*/
-- DropForeignKey
ALTER TABLE "Cart" DROP CONSTRAINT "Cart_productId_fkey";

-- AlterTable
ALTER TABLE "Cart" DROP COLUMN "productId";

-- migration: 20250508075757_update_cart_model

-- AlterTable
ALTER TABLE "Cart" ADD COLUMN     "name" TEXT,
ADD COLUMN     "totalCost" DOUBLE PRECISION;

-- migration: 20250509053523_models_update

/*
  Warnings:

  - A unique constraint covering the columns `[userId,businessId]` on the table `Cart` will be added. If there are existing duplicate values, this will fail.

*/
-- AlterTable
ALTER TABLE "Business" ADD COLUMN     "userId" TEXT;

-- CreateIndex
CREATE UNIQUE INDEX "Cart_userId_businessId_key" ON "Cart"("userId", "businessId");

-- AddForeignKey
ALTER TABLE "Business" ADD CONSTRAINT "Business_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- migration: 20250515075520_add_vendor_fields

-- AlterTable
ALTER TABLE "Product" ADD COLUMN     "vendorLink" TEXT,
ADD COLUMN     "vendorLogo" TEXT,
ADD COLUMN     "vendorName" TEXT;

-- migration: 20250515200806_add_saved_business_models

-- CreateTable
CREATE TABLE "SavedBusiness" (
    "id" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "businessId" INTEGER NOT NULL,
    "totalCost" DOUBLE PRECISION NOT NULL,
    "isShared" BOOLEAN NOT NULL DEFAULT false,
    "sharedLink" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "SavedBusiness_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "SavedItem" (
    "id" TEXT NOT NULL,
    "savedBusinessId" TEXT NOT NULL,
    "productId" INTEGER NOT NULL,
    "name" TEXT NOT NULL,
    "description" TEXT,
    "price" DOUBLE PRECISION NOT NULL,
    "quantity" INTEGER NOT NULL DEFAULT 1,
    "image" TEXT,
    "vendorName" TEXT,
    "vendorLink" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "SavedItem_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "SavedBusiness_sharedLink_key" ON "SavedBusiness"("sharedLink");

-- CreateIndex
CREATE INDEX "SavedBusiness_userId_idx" ON "SavedBusiness"("userId");

-- CreateIndex
CREATE INDEX "SavedBusiness_businessId_idx" ON "SavedBusiness"("businessId");

-- AddForeignKey
ALTER TABLE "SavedBusiness" ADD CONSTRAINT "SavedBusiness_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "SavedBusiness" ADD CONSTRAINT "SavedBusiness_businessId_fkey" FOREIGN KEY ("businessId") REFERENCES "Business"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "SavedItem" ADD CONSTRAINT "SavedItem_savedBusinessId_fkey" FOREIGN KEY ("savedBusinessId") REFERENCES "SavedBusiness"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "SavedItem" ADD CONSTRAINT "SavedItem_productId_fkey" FOREIGN KEY ("productId") REFERENCES "Product"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- migration: 20250520083847_add_category_and_requirement_to_cart_item

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

-- migration: 20250520084124_add_category_and_requirement_to_cart_item

/*
  Warnings:

  - A unique constraint covering the columns `[cartId,productId]` on the table `CartItem` will be added. If there are existing duplicate values, this will fail.

*/
-- AlterTable
ALTER TABLE "CartItem" ADD COLUMN     "category" TEXT DEFAULT 'Uncategorized',
ADD COLUMN     "requirementName" TEXT DEFAULT 'Unspecified Requirement';

-- CreateIndex
CREATE INDEX "CartItem_cartId_idx" ON "CartItem"("cartId");

-- CreateIndex
CREATE UNIQUE INDEX "CartItem_cartId_productId_key" ON "CartItem"("cartId", "productId");

-- migration: 20250523063834_add_vendor_model

/*
  Warnings:

  - You are about to drop the column `vendorLink` on the `Product` table. All the data in the column will be lost.
  - You are about to drop the column `vendorLogo` on the `Product` table. All the data in the column will be lost.
  - You are about to drop the column `vendorName` on the `Product` table. All the data in the column will be lost.

*/
-- AlterTable
ALTER TABLE "Product" DROP COLUMN "vendorLink",
DROP COLUMN "vendorLogo",
DROP COLUMN "vendorName",
ADD COLUMN     "vendorId" INTEGER;

-- CreateTable
CREATE TABLE "Vendor" (
    "id" SERIAL NOT NULL,
    "name" TEXT NOT NULL,
    "website" TEXT,
    "logo" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "Vendor_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "Vendor_name_website_key" ON "Vendor"("name", "website");

-- AddForeignKey
ALTER TABLE "Product" ADD CONSTRAINT "Product_vendorId_fkey" FOREIGN KEY ("vendorId") REFERENCES "Vendor"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- migration: 20250525120053_add_product_url_field

-- AlterTable
ALTER TABLE "Product" ADD COLUMN     "url" TEXT;

-- migration: 20250526055734_add_phone_to_user

-- AlterTable
ALTER TABLE "User" ADD COLUMN     "phone" TEXT;

-- migration: 20250528060409_add_search_tracking

-- CreateTable
CREATE TABLE "SearchLog" (
    "id" TEXT NOT NULL,
    "keyword" TEXT NOT NULL,
    "location" TEXT,
    "userId" TEXT,
    "businessId" INTEGER,
    "ipAddress" TEXT,
    "userAgent" TEXT,
    "resultCount" INTEGER,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "SearchLog_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "SearchLog_keyword_idx" ON "SearchLog"("keyword");

-- CreateIndex
CREATE INDEX "SearchLog_createdAt_idx" ON "SearchLog"("createdAt");

-- CreateIndex
CREATE INDEX "Business_name_idx" ON "Business"("name");

-- AddForeignKey
ALTER TABLE "SearchLog" ADD CONSTRAINT "SearchLog_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "SearchLog" ADD CONSTRAINT "SearchLog_businessId_fkey" FOREIGN KEY ("businessId") REFERENCES "Business"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- migration: 20250528070702_add_published_to_business

-- AlterTable
ALTER TABLE "Business" ADD COLUMN     "published" BOOLEAN NOT NULL DEFAULT true;

-- migration: 20250607063705_add_notification_preferences

-- AlterTable
ALTER TABLE "User" ADD COLUMN     "emailNotifications" BOOLEAN NOT NULL DEFAULT true,
ADD COLUMN     "marketingEmails" BOOLEAN NOT NULL DEFAULT true,
ADD COLUMN     "pushNotifications" BOOLEAN NOT NULL DEFAULT false;
