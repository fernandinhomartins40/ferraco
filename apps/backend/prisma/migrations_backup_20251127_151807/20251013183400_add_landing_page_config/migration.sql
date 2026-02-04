-- CreateTable
CREATE TABLE IF NOT EXISTS "landing_page_config" (
    "id" TEXT NOT NULL,
    "header" TEXT NOT NULL,
    "hero" TEXT NOT NULL,
    "marquee" TEXT NOT NULL,
    "about" TEXT NOT NULL,
    "products" TEXT NOT NULL,
    "experience" TEXT NOT NULL,
    "contact" TEXT NOT NULL,
    "footer" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "landing_page_config_pkey" PRIMARY KEY ("id")
);
