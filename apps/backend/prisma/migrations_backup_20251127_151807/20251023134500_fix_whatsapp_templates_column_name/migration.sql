-- Fix whatsappTemplates column name (PostgreSQL converted to lowercase)
-- This migration handles both scenarios: column with or without quotes

-- First, check if the lowercase version exists and rename it
DO $$
BEGIN
    IF EXISTS (
        SELECT 1 FROM information_schema.columns 
        WHERE table_name = 'chatbot_config' 
        AND column_name = 'whatsapptemplates'
    ) THEN
        ALTER TABLE "chatbot_config" RENAME COLUMN whatsapptemplates TO "whatsappTemplates";
    END IF;
END $$;
