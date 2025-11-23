# Setup de Environment para Desarrollo Local

Si estás desarrollando localmente, necesitas crear los archivos de environment con tus credenciales de Supabase.

## Opción 1: Usando el Script (Recomendado)

```bash
# Configurar variables de entorno temporalmente y ejecutar el script
SUPABASE_URL=https://tu-proyecto.supabase.co \
SUPABASE_ANON_KEY=tu-anon-key \
node setup-env.js
```

## Opción 2: Manualmente

Crea los siguientes archivos manualmente:

### `src/environments/environment.ts` (Producción)

```typescript
export const environment = {
  production: true,
  supabaseUrl: 'https://tu-proyecto.supabase.co',
  supabaseKey: 'tu-anon-key',
};
```

### `src/environments/environment.development.ts` (Desarrollo)

```typescript
export const environment = {
  production: false,
  supabaseUrl: 'https://tu-proyecto.supabase.co',
  supabaseKey: 'tu-anon-key',
};
```

> **⚠️ IMPORTANTE**: Estos archivos NO se deben subir a Git. Ya están en `.gitignore` para proteger tus credenciales.

## Obtener las Credenciales de Supabase

1. Ve a [Supabase Dashboard](https://app.supabase.com/)
2. Selecciona tu proyecto
3. Ve a **Settings** → **API**
4. Copia:
   - **Project URL** (será tu `supabaseUrl`)
   - **Anon key** (será tu `supabaseKey`)

## Verificar que Funcione

Después de configurar los archivos, ejecuta:

```bash
npm start
```

La aplicación debería iniciar sin errores y conectarse a Supabase correctamente.
