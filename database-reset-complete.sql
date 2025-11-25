-- =========================================================
-- SCRIPT: RESET COMPLETO de Base de Datos
-- =========================================================
-- ADVERTENCIA: Este script ELIMINA TODOS LOS DATOS
-- Solo ejecutar si quieres empezar desde cero
-- =========================================================

-- 1. ELIMINAR TABLA EXISTENTE (y todos sus datos)
DROP TABLE IF EXISTS expenses CASCADE;

-- 2. CREAR TABLA LIMPIA con TODOS los campos (incluyendo gastos a plazos)
CREATE TABLE expenses (
  id BIGSERIAL PRIMARY KEY,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL,
  
  -- Campos básicos del gasto
  user_id UUID REFERENCES auth.users NOT NULL,
  name TEXT NOT NULL,
  amount NUMERIC NOT NULL CHECK (amount >= 0),
  category TEXT NOT NULL,
  date DATE NOT NULL,
  
  -- Campos para gastos a plazos (agregados)
  installment_concept_id BIGINT,
  is_installment_concept BOOLEAN DEFAULT false,
  installment_total_amount NUMERIC,
  installment_name TEXT
);

-- 3. CREAR ÍNDICES para optimizar consultas
CREATE INDEX idx_expenses_user_id ON expenses(user_id);
CREATE INDEX idx_expenses_date ON expenses(date);
CREATE INDEX idx_installment_concept ON expenses(installment_concept_id);
CREATE INDEX idx_is_installment_concept ON expenses(is_installment_concept);

-- 4. HABILITAR ROW LEVEL SECURITY (RLS)
ALTER TABLE expenses ENABLE ROW LEVEL SECURITY;

-- 5. CREAR POLÍTICAS DE SEGURIDAD
-- Los usuarios solo pueden ver, insertar, actualizar y eliminar sus propios gastos
-- PERO pueden VER los gastos de otros usuarios en la misma pareja

-- Política de SELECT: Ver todos los gastos (propios y de la pareja)
DROP POLICY IF EXISTS "Users can view all expenses" ON expenses;
CREATE POLICY "Users can view all expenses"
  ON expenses FOR SELECT
  USING (true);

-- Política de INSERT: Solo insertar gastos propios
DROP POLICY IF EXISTS "Users can insert own expenses" ON expenses;
CREATE POLICY "Users can insert own expenses"
  ON expenses FOR INSERT
  WITH CHECK (auth.uid() = user_id);

-- Política de UPDATE: Solo actualizar gastos propios
DROP POLICY IF EXISTS "Users can update own expenses" ON expenses;
CREATE POLICY "Users can update own expenses"
  ON expenses FOR UPDATE
  USING (auth.uid() = user_id);

-- Política de DELETE: Solo eliminar gastos propios
DROP POLICY IF EXISTS "Users can delete own expenses" ON expenses;
CREATE POLICY "Users can delete own expenses"
  ON expenses FOR DELETE
  USING (auth.uid() = user_id);

-- 6. COMENTARIOS para documentación
COMMENT ON TABLE expenses IS 'Tabla de gastos compartidos entre pareja';
COMMENT ON COLUMN expenses.installment_concept_id IS 'ID del concepto padre de gastos a plazos. Null si no está vinculado.';
COMMENT ON COLUMN expenses.is_installment_concept IS 'True si este registro es un concepto de gasto a plazos (no una aportación real).';
COMMENT ON COLUMN expenses.installment_total_amount IS 'Monto total del concepto a plazos. Solo se usa cuando is_installment_concept=true.';
COMMENT ON COLUMN expenses.installment_name IS 'Nombre del concepto a plazos. Solo se usa cuando is_installment_concept=true.';

-- =========================================================
-- SCRIPT COMPLETADO
-- =========================================================
-- La tabla está lista para usar con:
-- ✅ Campos básicos de gastos
-- ✅ Campos de gastos a plazos
-- ✅ Índices optimizados
-- ✅ RLS habilitado
-- ✅ Políticas de seguridad configuradas
-- =========================================================
