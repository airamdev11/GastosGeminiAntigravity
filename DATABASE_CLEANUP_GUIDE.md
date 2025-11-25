# 🗄️ Guía de Limpieza de Base de Datos Supabase

## ¿Qué hacer?

Tienes **3 opciones** dependiendo de tu situación:

---

## 📋 OPCIÓN 1: Verificar Estado Actual (EJECUTA ESTO PRIMERO)

**Script:** `database-verify-status.sql`

1. Ve a Supabase → SQL Editor
2. Copia y pega el contenido de `database-verify-status.sql`
3. Ejecuta

Esto te mostrará:

- ✅ Qué columnas existen actualmente
- ✅ Cuántos registros tienes
- ✅ Si las columnas de gastos a plazos ya existen

---

## 🔄 OPCIÓN 2: Solo Agregar Columnas Nuevas (Si NO tienes datos importantes)

**Script:** `database-migration-installments.sql`

**Úsalo si:**

- La tabla `expenses` existe
- NO tiene las columnas `installment_concept_id`, `is_installment_concept`, etc.
- Quieres conservar tus gastos actuales

**Pasos:**

1. Ve a Supabase → SQL Editor
2. Copia y pega el contenido de `database-migration-installments.sql`
3. Ejecuta
4. Listo ✅

---

## 🗑️ OPCIÓN 3: Reset Completo (Empezar desde CERO)

**Script:** `database-reset-complete.sql`

**⚠️ ADVERTENCIA:** Este script **ELIMINA TODOS LOS DATOS**

**Úsalo si:**

- Quieres empezar de cero
- Tienes datos de prueba que no necesitas
- Quieres asegurarte de que todo esté limpio
- Hiciste cambios en la BD que quieres revertir

**Pasos:**

1. Ve a Supabase → SQL Editor
2. Copia y pega el contenido de `database-reset-complete.sql`
3. Ejecuta
4. Listo ✅ - Base de datos completamente limpia y con estructura actualizada

**Lo que hace:**

1. Elimina la tabla `expenses` y todos sus datos
2. Crea la tabla nueva con TODOS los campos (básicos + gastos a plazos)
3. Crea índices optimizados
4. Configura Row Level Security (RLS)
5. Define políticas de seguridad

---

## 🎯 Mi Recomendación

```
1️⃣ Primero ejecuta: database-verify-status.sql
   → Para ver el estado actual

2️⃣ Si NO tienes datos importantes:
   → Ejecuta: database-reset-complete.sql
   → Esto te deja con una BD limpia y actualizada

3️⃣ Si TIENES datos importantes que quieres conservar:
   → Ejecuta: database-migration-installments.sql
   → Esto solo agrega las columnas nuevas
```

---

## 📊 Estructura Final de la Tabla

Después de ejecutar cualquiera de los scripts correctos, tendrás:

```sql
expenses
├── id (BIGSERIAL PRIMARY KEY)
├── created_at (TIMESTAMP)
├── user_id (UUID)
├── name (TEXT)
├── amount (NUMERIC)
├── category (TEXT)
├── date (DATE)
├── installment_concept_id (BIGINT) ← NUEVO
├── is_installment_concept (BOOLEAN) ← NUEVO
├── installment_total_amount (NUMERIC) ← NUEVO
└── installment_name (TEXT) ← NUEVO
```

---

## 🔍 Verificar que Todo Funcionó

Después de ejecutar el script, vuelve a ejecutar `database-verify-status.sql` y verifica:

✅ La tabla tiene 11 columnas
✅ Existen 4 índices
✅ 0 registros (si hiciste reset completo)

---

## 🆘 Si Algo Sale Mal

**Error: "column already exists"**
→ Ya ejecutaste el script de migración antes. Todo está bien.

**Error: "table does not exist"**
→ Ejecuta `database-reset-complete.sql`

**Error de permisos**
→ Asegúrate de estar usando el proyecto correcto en Supabase

---

## 📝 Notas Importantes

1. **El código local está BIEN** - Los cambios de gastos a plazos están intactos
2. **Solo la base de datos necesita actualización** - Ejecuta uno de los scripts SQL
3. **No necesitas cambiar nada en el código** - Ya está todo implementado
4. **Después de actualizar la BD, la app funcionará perfectamente** 🎉
