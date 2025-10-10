-- RedefineTables
PRAGMA defer_foreign_keys=ON;
PRAGMA foreign_keys=OFF;
CREATE TABLE "new_company_data" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "name" TEXT NOT NULL,
    "industry" TEXT NOT NULL,
    "description" TEXT NOT NULL,
    "differentials" TEXT NOT NULL,
    "targetAudience" TEXT NOT NULL,
    "location" TEXT NOT NULL,
    "workingHours" TEXT NOT NULL,
    "phone" TEXT,
    "website" TEXT,
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP
);
INSERT INTO "new_company_data" ("description", "differentials", "id", "industry", "location", "name", "phone", "targetAudience", "updatedAt", "website", "workingHours") SELECT "description", "differentials", "id", "industry", "location", "name", "phone", "targetAudience", "updatedAt", "website", "workingHours" FROM "company_data";
DROP TABLE "company_data";
ALTER TABLE "new_company_data" RENAME TO "company_data";
CREATE TABLE "new_faq_items" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "question" TEXT NOT NULL,
    "answer" TEXT NOT NULL,
    "category" TEXT NOT NULL,
    "keywords" TEXT NOT NULL,
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP
);
INSERT INTO "new_faq_items" ("answer", "category", "createdAt", "id", "keywords", "question", "updatedAt") SELECT "answer", "category", "createdAt", "id", "keywords", "question", "updatedAt" FROM "faq_items";
DROP TABLE "faq_items";
ALTER TABLE "new_faq_items" RENAME TO "faq_items";
CREATE INDEX "faq_items_category_idx" ON "faq_items"("category");
CREATE TABLE "new_products" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "name" TEXT NOT NULL,
    "description" TEXT NOT NULL,
    "category" TEXT NOT NULL,
    "price" TEXT,
    "keywords" TEXT NOT NULL,
    "benefits" TEXT,
    "isActive" BOOLEAN NOT NULL DEFAULT true,
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP
);
INSERT INTO "new_products" ("benefits", "category", "createdAt", "description", "id", "isActive", "keywords", "name", "price", "updatedAt") SELECT "benefits", "category", "createdAt", "description", "id", "isActive", "keywords", "name", "price", "updatedAt" FROM "products";
DROP TABLE "products";
ALTER TABLE "new_products" RENAME TO "products";
CREATE INDEX "products_isActive_idx" ON "products"("isActive");
CREATE INDEX "products_category_idx" ON "products"("category");
PRAGMA foreign_keys=ON;
PRAGMA defer_foreign_keys=OFF;
