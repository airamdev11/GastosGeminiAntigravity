# 📋 Instrucciones para Implementar Gastos a Plazos

## 1. Ejecutar Migración de Base de Datos

**IMPORTANTE:** Antes de usar la aplicación, debes ejecutar el script SQL en Supabase.

### Pasos:

1. Ve a tu proyecto de Supabase: https://supabase.com/dashboard/project/YOUR_PROJECT_ID
2. Navega a **SQL Editor** en el menú lateral
3. Crea una nueva query
4. Copia y pega el contenido del archivo `database-migration-installments.sql`
5. Ejecuta el script (botón "Run" o Ctrl+Enter)
6. Verifica que se ejecutó correctamente (debe mostrar "Success")

## 2. Código Implementado

### Backend (`src/app/services/expense.ts`)

- ✅ Interfaz `Expense` extendida con 4 campos para gastos a plazos
- ✅ Nueva interfaz `InstallmentStats` para estadísticas
- ✅ 6 nuevos métodos:
  - `createInstallmentConcept()` - Crear concepto
  - `getInstallmentConcepts()` - Obtener conceptos activos
  - `getContributions()` - Obtener aportaciones de un concepto
  - `getInstallmentStats()` - Calcular estadísticas de un concepto
  - `getAllInstallmentStats()` - Estadísticas de todos los conceptos
  - `validateContribution()` - Validar monto de aportación

### Componente (`src/app/app.ts`)

- ✅ Signals para manejar formularios y estado UI
- ✅ Computed `installmentConcepts` para conceptos activos
- ✅ Filtrado de gastos reales (sin conceptos) en reportes
- ✅ Validación de aportaciones en `saveExpense()`
- ✅ 3 nuevos métodos para UI

### Vista (`src/app/app.html`)

- ✅ Botón toggle para formulario de concepto
- ✅ Formulario colapsable para crear concepto a plazos
- ✅ Checkbox para vincular gasto a concepto
- ✅ Selector de concepto con info del restante
- ✅ Sección de conceptos activos con:
  - Progress bars
  - Detalles del monto (total, aportado, restante)
  - Lista expandible de aportaciones
- ✅ Badges visuales en la lista de movimientos

## 3. Cómo Usar

### Crear un Concepto a Plazos

1. Ve al tab **Movimientos** (💸)
2. Click en **"➕ Crear Concepto a Plazos"**
3. Ingresa:
   - Nombre (ej: "Laptop nueva")
   - Monto total (ej: 12000)
   - Categoría
4. Click en **"Crear Concepto"**

### Hacer una Aportación

1. En el formulario de gasto normal
2. Marca ✅ **"Es aportación a un gasto a plazos"**
3. Selecciona el concepto del dropdown
4. Ingresa nombre, monto y fecha
5. El sistema validará que no excedas el restante
6. Click en **"Agregar Gasto"**

### Ver Progreso

- Los conceptos activos se muestran en la sección **"Conceptos a Plazos Activos"**
- Cada concepto muestra:
  - Monto restante (grande y destacado)
  - Barra de progreso visual
  - Lista de aportaciones (click en "Ver aportaciones")

## 4. Características

### Validaciones ✅

- ✅ No se puede aportar más del restante
- ✅ Ambas personas pueden crear conceptos
- ✅ Ambas personas pueden hacer aportaciones
- ✅ Solo puedes editar/eliminar tus propias aportaciones
- ✅ No se pueden eliminar conceptos (protegido)

### Integridad de Datos 💾

- ✅ Aportaciones se reflejan en dashboard individual
- ✅ Aportaciones aparecen en reportes CSV
- ✅ Filtrado correcto por mes (solo gastos reales)
- ✅ Conceptos tienen amount=0 (no suman al total)
- ✅ Solo las aportaciones suman al total

### UX 🎨

- ✅ Badges visuales (📅 para aportaciones, 📋 para conceptos)
- ✅ Progress bars con colores (verde < 70%, amarillo < 90%, rosa >= 90%)
- ✅ Info en tiempo real del monto restante
- ✅ Formularios colapsables para no saturar la UI
- ✅ Dark mode compatible

## 5. Notas Técnicas

### Estructura de la Base de Datos

```sql
-- Concepto a plazos (ejemplo)
{
  id: 123,
  name: "[CONCEPTO] Laptop nueva",
  amount: 0,  -- Los conceptos no suman
  category: "Otros",
  date: "2025-11-25",
  is_installment_concept: true,  -- Flag importante
  installment_name: "Laptop nueva",
  installment_total_amount: 12000,
  installment_concept_id: null
}

-- Aportación (ejemplo)
{
  id: 124,
  name: "Pago 1 - Laptop",
  amount: 3000,  -- Las aportaciones SÍ suman al total
  category: "Otros",
  date: "2025-11-25",
  is_installment_concept: false,
  installment_concept_id: 123,  -- Vinculado al concepto
  ...otros campos null
}
```

### Filtros Importantes

- `filteredExpenses`: Filtra POR MES y excluye conceptos (`!e.is_installment_concept`)
- `installmentConcepts`: Solo conceptos (`e.is_installment_concept === true`)
- Contribuciones: Gastos con `installment_concept_id !== null`

## 6. Testing Recomendado

1. ✅ Crear concepto
2. ✅ Hacer aportación (usuario 1)
3. ✅ Hacer aportación (usuario 2)
4. ✅ Verificar progreso actualizado
5. ✅ Intentar aportar más del restante (debe fallar)
6. ✅ Verificar que aportaciones aparecen en dashboard
7. ✅ Descargar CSV y verificar inclusión
8. ✅ Editar/eliminar aportación propia
9. ✅ Verificar modo oscuro

## 7. Problemas Comunes

**Error: "no such column"**
→ No ejecutaste el script SQL en Supabase

**El concepto no aparece en el selector**
→ Asegúrate de haberlo creado y recarga la página

**No puedo eliminar un concepto**
→ Por diseño, protección de datos. Solo puedes eliminar aportaciones.

**Las aportaciones no suman en el dashboard**
→ Verifica que `is_installment_concept = false` en la aportación
