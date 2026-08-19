-- Add 'visita_programada' to lead_status enum for G1 (auto-create visit from lead)
ALTER TYPE lead_status ADD VALUE IF NOT EXISTS 'visita_programada' AFTER 'en_proceso';
