-- CreateTable: landing_page_config_history
-- Armazena histórico de todas as alterações na configuração da landing page

CREATE TABLE IF NOT EXISTS "landing_page_config_history" (
    "id" TEXT NOT NULL,
    "config_id" TEXT,
    "header" TEXT NOT NULL,
    "hero" TEXT NOT NULL,
    "marquee" TEXT NOT NULL,
    "about" TEXT NOT NULL,
    "products" TEXT NOT NULL,
    "experience" TEXT NOT NULL,
    "contact" TEXT NOT NULL,
    "footer" TEXT NOT NULL,
    "change_type" TEXT NOT NULL DEFAULT 'manual_save',
    "changed_by_user_id" TEXT,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "landing_page_config_history_pkey" PRIMARY KEY ("id")
);

-- AddForeignKey
ALTER TABLE "landing_page_config_history" DROP CONSTRAINT IF EXISTS "landing_page_config_history_config_id_fkey";
ALTER TABLE "landing_page_config_history" ADD CONSTRAINT "landing_page_config_history_config_id_fkey"
    FOREIGN KEY ("config_id") REFERENCES "landing_page_config" ("id")
    ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "landing_page_config_history" DROP CONSTRAINT IF EXISTS "landing_page_config_history_changed_by_user_id_fkey";
ALTER TABLE "landing_page_config_history" ADD CONSTRAINT "landing_page_config_history_changed_by_user_id_fkey"
    FOREIGN KEY ("changed_by_user_id") REFERENCES "users" ("id")
    ON DELETE SET NULL ON UPDATE CASCADE;

-- CreateIndex
CREATE INDEX IF NOT EXISTS "landing_page_config_history_config_id_idx" ON "landing_page_config_history"("config_id");
CREATE INDEX IF NOT EXISTS "landing_page_config_history_created_at_idx" ON "landing_page_config_history"("created_at" DESC);
CREATE INDEX IF NOT EXISTS "landing_page_config_history_change_type_idx" ON "landing_page_config_history"("change_type");
