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
