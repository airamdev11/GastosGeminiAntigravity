# 🧹 Script de Limpieza de Datos de Prueba

## Descripción

Este script elimina **TODOS** los registros de gastos de tu base de datos Supabase, incluyendo:

- Gastos regulares
- Conceptos a plazos
- Aportaciones a conceptos a plazos

## ⚠️ ADVERTENCIA

**ESTE SCRIPT ES DESTRUCTIVO Y NO SE PUEDE DESHACER**

Solo úsalo cuando quieras eliminar todos los datos de prueba y empezar de cero.

## Cómo usar

### Opción 1: Editor SQL de Supabase (Recomendado)

1. Abre tu proyecto en [Supabase Dashboard](https://app.supabase.com)
2. Ve a la sección **SQL Editor**
3. Crea una nueva query
4. Copia y pega el contenido completo de `clean-test-data.sql`
5. Haz clic en **Run** o presiona `Ctrl + Enter`
6. Verifica el resultado de la query de verificación al final

### Opción 2: Desde la terminal (si tienes supabase CLI)

```bash
supabase db execute -f clean-test-data.sql
```

## Verificación

Al final del script verás una tabla con el conteo de registros:

```
total_gastos | conceptos_plazos | aportaciones | gastos_regulares
-------------|------------------|--------------|------------------
     0       |        0         |      0       |        0
```

Si todos los valores son `0`, la limpieza fue exitosa ✅

## Recuperación

Si eliminaste los datos por error, puedes:

1. Revisar los backups automáticos de Supabase (si tienes plan Pro)
2. Usar Point-in-Time Recovery si está habilitado
3. Recrear los datos manualmente desde la aplicación

## Notas

- ✅ Este archivo está en `.gitignore` y NO se subirá a GitHub
- ✅ Solo elimina datos de la tabla `expenses`
- ✅ No elimina usuarios ni configuraciones
- ✅ Es seguro ejecutarlo múltiples veces (si ya está limpio, no hace nada)
