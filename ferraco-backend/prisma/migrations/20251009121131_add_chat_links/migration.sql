-- CreateTable
CREATE TABLE "chat_links" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "name" TEXT NOT NULL,
    "source" TEXT NOT NULL,
    "url" TEXT NOT NULL,
    "shortCode" TEXT NOT NULL,
    "clicks" INTEGER NOT NULL DEFAULT 0,
    "leads" INTEGER NOT NULL DEFAULT 0,
    "isActive" BOOLEAN NOT NULL DEFAULT true,
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" DATETIME NOT NULL
);

-- CreateIndex
CREATE UNIQUE INDEX "chat_links_shortCode_key" ON "chat_links"("shortCode");

-- CreateIndex
CREATE INDEX "chat_links_shortCode_idx" ON "chat_links"("shortCode");

-- CreateIndex
CREATE INDEX "chat_links_isActive_idx" ON "chat_links"("isActive");
