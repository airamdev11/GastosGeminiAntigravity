-- =========================================================
-- MIGRATION: Agregar soporte para Gastos a Plazos
-- Fecha: 2025-11-25
-- =========================================================

-- Agregar columnas para soportar gastos a plazos
ALTER TABLE expenses
ADD COLUMN IF NOT EXISTS installment_concept_id INTEGER,
ADD COLUMN IF NOT EXISTS is_installment_concept BOOLEAN DEFAULT false,
ADD COLUMN IF NOT EXISTS installment_total_amount NUMERIC,
ADD COLUMN IF NOT EXISTS installment_name TEXT;

-- Crear índice para mejorar consultas de conceptos a plazos
CREATE INDEX IF NOT EXISTS idx_installment_concept ON expenses(installment_concept_id);

-- Crear índice para consultas de conceptos activos
CREATE INDEX IF NOT EXISTS idx_is_installment_concept ON expenses(is_installment_concept);

-- Comentarios para documentación
COMMENT ON COLUMN expenses.installment_concept_id IS 'ID del concepto padre de gastos a plazos. Null si no está vinculado.';
COMMENT ON COLUMN expenses.is_installment_concept IS 'True si este registro es un concepto de gasto a plazos (no una aportación).';
COMMENT ON COLUMN expenses.installment_total_amount IS 'Monto total del concepto a plazos. Solo se usa cuando is_installment_concept=true.';
COMMENT ON COLUMN expenses.installment_name IS 'Nombre del concepto a plazos. Solo se usa cuando is_installment_concept=true.';
