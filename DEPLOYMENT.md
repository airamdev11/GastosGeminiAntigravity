# Guía de Despliegue - GastosDuo

Esta guía te ayudará a desplegar la aplicación GastosDuo en Netlify.

## Prerequisitos

- Cuenta en [Netlify](https://www.netlify.com/) (gratis)
- Cuenta en [Supabase](https://supabase.com/) (gratis)
- Repositorio de Git (GitHub, GitLab, o Bitbucket)

## Paso 1: Preparar el Repositorio

1. Asegúrate de que todos los cambios estén committed:
   ```bash
   git add .
   git commit -m "Preparar para despliegue"
   git push origin main
   ```

## Paso 2: Configurar Supabase

Si aún no tienes un proyecto de Supabase:

1. Ve a [Supabase Dashboard](https://app.supabase.com/)
2. Crea un nuevo proyecto
3. Espera a que se complete la configuración
4. Ve a **Settings** → **API**
5. Copia los siguientes valores:
   - **Project URL** (ej: `https://xxxxx.supabase.co`)
   - **Anon key** (public)

## Paso 3: Desplegar en Netlify

### Opción A: Deploy con Git (Recomendado)

1. Ve a [Netlify](https://app.netlify.com/)
2. Haz clic en **"Add new site"** → **"Import an existing project"**
3. Conecta tu proveedor de Git (GitHub/GitLab/Bitbucket)
4. Selecciona el repositorio `gastos-pastel`
5. Configura los siguientes ajustes:
   - **Build command**: `npm run build`
   - **Publish directory**: `dist/gastos-pastel/browser`
6. Haz clic en **"Show advanced"** → **"New variable"** y agrega:
   - `SUPABASE_URL`: Tu Project URL de Supabase
   - `SUPABASE_ANON_KEY`: Tu Anon key de Supabase

> [!IMPORTANT]
> Asegúrate de agregar las variables de entorno antes de hacer el deploy. Las variables se pueden configurar también después en **Site settings** → **Environment variables**.

7. Haz clic en **"Deploy site"**
8. Espera a que termine el despliegue (2-3 minutos)
9. Tu sitio estará disponible en una URL como `https://random-name.netlify.app`

### Opción B: Deploy Manual (Más Rápido para Pruebas)

1. Construye el proyecto localmente:

   ```bash
   npm run build
   ```

2. Ve a [Netlify](https://app.netlify.com/)
3. Arrastra la carpeta `dist/gastos-pastel/browser` al área de drop en Netlify
4. Una vez desplegado, ve a **Site settings** → **Environment variables**
5. Agrega las variables de Supabase:
   - `SUPABASE_URL`
   - `SUPABASE_ANON_KEY`
6. Ve a **Deploys** → **Trigger deploy** → **Deploy site**

## Paso 4: Configurar Dominio Personalizado (Opcional)

1. En Netlify, ve a **Site settings** → **Domain management**
2. Haz clic en **"Add custom domain"**
3. Sigue las instrucciones para configurar tu dominio
4. Netlify automáticamente configurará HTTPS

## Paso 5: Verificar el Despliegue

1. Abre tu sitio en Netlify
2. Verifica que:
   - La página carga correctamente
   - Puedes navegar entre secciones
   - Puedes agregar gastos (esto confirma que Supabase está conectado)
   - Las gráficas se muestran correctamente

## Actualizaciones Automáticas

Si usaste la Opción A (Deploy con Git):

- Cada vez que hagas `git push` a tu rama principal, Netlify automáticamente:
  1. Detectará los cambios
  2. Ejecutará el build
  3. Desplegará la nueva versión

## Solución de Problemas

### El sitio no carga o muestra error 404

- Verifica que `netlify.toml` esté en la raíz del proyecto
- Asegúrate que el archivo `public/_redirects` exista

### Error de conexión con Supabase

- Verifica que las variables de entorno estén configuradas correctamente en Netlify
- Confirma que el Project URL y Anon Key sean correctos
- Revisa la consola del navegador para más detalles

### Build fallido

- Revisa los logs del build en Netlify
- Asegúrate de que `npm run build` funcione localmente
- Verifica que todas las dependencias estén en `package.json`

### Las rutas no funcionan al recargar la página

- Confirma que exista el archivo `public/_redirects`
- Verifica la configuración en `netlify.toml`

## Comandos Útiles

```bash
# Build local
npm run build

# Servir el build localmente para pruebas
npx http-server dist/gastos-pastel/browser -p 8080

# Ver logs de producción
# Ve a Netlify Dashboard → Deploys → [Latest Deploy] → Deploy log
```

## Configuración de la Base de Datos

La estructura de la base de datos en Supabase debe incluir la tabla `gastos` con las siguientes columnas:

```sql
CREATE TABLE gastos (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  descripcion TEXT NOT NULL,
  monto DECIMAL(10,2) NOT NULL,
  categoria TEXT NOT NULL,
  fecha DATE NOT NULL,
  pagado_por TEXT NOT NULL,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Habilitar Row Level Security (RLS)
ALTER TABLE gastos ENABLE ROW LEVEL SECURITY;

-- Política para permitir lectura/escritura anónima (ajustar según necesidades)
CREATE POLICY "Allow all access" ON gastos FOR ALL USING (true);
```

> [!WARNING]
> La política anterior permite acceso completo. Para producción, considera implementar autenticación y políticas RLS más restrictivas.

## Seguridad

- **Nunca** subas el archivo `.env` con credenciales reales a Git
- Usa las variables de entorno de Netlify para datos sensibles
- Considera implementar autenticación de usuarios en Supabase
- Revisa y ajusta las políticas RLS de Supabase según tus necesidades

## Recursos Adicionales

- [Documentación de Netlify](https://docs.netlify.com/)
- [Documentación de Supabase](https://supabase.com/docs)
- [Angular Deployment Guide](https://angular.dev/tools/cli/deployment)

## Soporte

Si encuentras problemas, revisa:

1. Los logs de Netlify en el dashboard
2. La consola del navegador (F12)
3. Los logs de Supabase en el dashboard

---

¡Disfruta usando GastosDuo! 🎉
