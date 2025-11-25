-- =========================================================
-- SCRIPT: VERIFICAR Estado de Base de Datos
-- =========================================================
-- Este script te ayuda a verificar qué columnas existen
-- Ejecuta esto ANTES de decidir qué script usar
-- =========================================================

-- Ver todas las columnas de la tabla expenses
SELECT 
  column_name,
  data_type,
  is_nullable,
  column_default
FROM information_schema.columns
WHERE table_name = 'expenses'
ORDER BY ordinal_position;

-- Ver índices existentes
SELECT
  indexname,
  indexdef
FROM pg_indexes
WHERE tablename = 'expenses';

-- Contar registros existentes
SELECT COUNT(*) as total_expenses FROM expenses;

-- Ver si existen gastos a plazos
SELECT COUNT(*) as installment_concepts 
FROM expenses 
WHERE is_installment_concept = true;
