-- RedefineTables
PRAGMA defer_foreign_keys=ON;
PRAGMA foreign_keys=OFF;
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
    "updatedAt" DATETIME NOT NULL
);
INSERT INTO "new_products" ("benefits", "category", "createdAt", "description", "id", "isActive", "keywords", "name", "price", "updatedAt") SELECT "benefits", "category", "createdAt", "description", "id", "isActive", "keywords", "name", "price", "updatedAt" FROM "products";
DROP TABLE "products";
ALTER TABLE "new_products" RENAME TO "products";
CREATE INDEX "products_isActive_idx" ON "products"("isActive");
CREATE INDEX "products_category_idx" ON "products"("category");
PRAGMA foreign_keys=ON;
PRAGMA defer_foreign_keys=OFF;
