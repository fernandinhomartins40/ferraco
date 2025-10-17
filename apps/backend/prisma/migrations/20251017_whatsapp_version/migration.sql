-- CreateTable
CREATE TABLE IF NOT EXISTS "whatsapp_versions" (
    "id" TEXT NOT NULL,
    "version" TEXT NOT NULL,
    "detected_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "applied_to_evolution" BOOLEAN NOT NULL DEFAULT false,
    "evolution_instance_name" TEXT,
    "error_message" TEXT,
    "metadata" JSONB,

    CONSTRAINT "whatsapp_versions_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "whatsapp_versions_detected_at_idx" ON "whatsapp_versions"("detected_at" DESC);

-- CreateIndex
CREATE INDEX "whatsapp_versions_version_idx" ON "whatsapp_versions"("version");
