-- CreateTable
CREATE TABLE "kanban_columns" (
    "id" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "color" TEXT NOT NULL,
    "status" TEXT NOT NULL,
    "order" INTEGER NOT NULL,
    "isSystem" BOOLEAN NOT NULL DEFAULT false,
    "isActive" BOOLEAN NOT NULL DEFAULT true,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "kanban_columns_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "kanban_columns_order_key" ON "kanban_columns"("order");

-- CreateIndex
CREATE INDEX "kanban_columns_isActive_idx" ON "kanban_columns"("isActive");

-- CreateIndex
CREATE INDEX "kanban_columns_order_idx" ON "kanban_columns"("order");

-- Insert default "Lead Novo" column
INSERT INTO "kanban_columns" ("id", "name", "color", "status", "order", "isSystem", "isActive", "createdAt", "updatedAt")
VALUES (
    'clxkanban001',
    'Lead Novo',
    '#3B82F6',
    'NOVO',
    0,
    true,
    true,
    CURRENT_TIMESTAMP,
    CURRENT_TIMESTAMP
);
