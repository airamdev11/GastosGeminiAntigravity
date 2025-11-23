# 💕 GastosDuo - Finanzas en Pareja

> **Gestiona los gastos compartidos sin dramas**

Una aplicación web moderna para parejas que quieren controlar sus finanzas compartidas de forma sencilla, visual y sin complicaciones.

![Angular](https://img.shields.io/badge/Angular-20.3-red?logo=angular)
![TypeScript](https://img.shields.io/badge/TypeScript-5.9-blue?logo=typescript)
![Tailwind](https://img.shields.io/badge/Tailwind-4.1-38bdf8?logo=tailwindcss)
![Supabase](https://img.shields.io/badge/Supabase-Database-3ecf8e?logo=supabase)

---

## ✨ Características

### 🎨 Diseño Moderno

- **Colores pastel** para una experiencia visual agradable
- **Modo oscuro** con toggle instantáneo
- **Animaciones suaves** en todas las transiciones
- **Responsive** y optimizado para móviles

### 💰 Gestión de Gastos

- **Registro rápido** de gastos con categorías visuales
- **7 categorías**: Comida 🍔, Transporte 🚕, Casa 🏠, Ocio 🍿, Salud 💊, Mascotas 🐶, Otros 📦
- **Dashboard mensual** con estadísticas y gráficos
- **Edición/eliminación** de tus propios gastos
- **Export a Excel** de reportes mensuales

### 📊 Presupuestos

- **Define límites** por categoría
- **Barras de progreso** con colores según estado
- **3 niveles**: 🟢 OK (0-69%) | 🟡 Cuidado (70-89%) | 🔴 Peligro (90-100%+)
- **Actualización automática** con gastos del mes

### 🚨 Notificaciones

- **Alertas automáticas** al exceder presupuesto
- **Banner flotante** visible en toda la app
- **Mensajes descriptivos** con categoría y monto
- **Dismissible** - cierra las que ya viste

### ⚖️ Balance de Pareja

- **Cálculo automático** de quién debe a quién
- **Mensajes amigables** sobre próxima ronda
- **Por mes** - revisa históricos

### 📱 PWA (Progressive Web App)

- **Instalable** en Android e iOS
- **Icono personalizado** en pantalla de inicio
- **Experiencia nativa** sin barra del navegador
- **Funcionamiento offline** (próximamente)

---

## 🚀 Inicio Rápido

### Prerequisitos

- Node.js 18+ y npm
- Cuenta en [Supabase](https://supabase.com) (gratuita)

### Instalación

```bash
# Clonar repositorio
git clone https://github.com/tu-usuario/gastos-pastel.git
cd gastos-pastel

# Instalar dependencias
npm install

# Configurar Supabase
# 1. Crear proyecto en supabase.com
# 2. Copiar URL y anon key

# Crear tabla (ejecutar SQL en Supabase)
# Ver sección "Base de Datos" más abajo

# Iniciar desarrollo
npm start
```

Abre `http://localhost:4200` 🎉

---

## 🗄️ Base de Datos

Ejecuta este SQL en Supabase SQL Editor:

```sql
CREATE TABLE expenses (
  id BIGSERIAL PRIMARY KEY,
  user_id UUID REFERENCES auth.users NOT NULL,
  name TEXT NOT NULL,
  amount NUMERIC NOT NULL,
  category TEXT NOT NULL,
  date DATE NOT NULL,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Row Level Security
ALTER TABLE expenses ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Enable read for authenticated" ON expenses
  FOR SELECT TO authenticated USING (true);

CREATE POLICY "Enable insert for authenticated" ON expenses
  FOR INSERT TO authenticated WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Enable update for own" ON expenses
  FOR UPDATE TO authenticated USING (auth.uid() = user_id);

CREATE POLICY "Enable delete for own" ON expenses
  FOR DELETE TO authenticated USING (auth.uid() = user_id);
```

---

## 📁 Estructura del Proyecto

```
gastos-pastel/
├── src/
│   ├── app/
│   │   ├── services/
│   │   │   └── expense.ts        # Servicio Supabase
│   │   ├── app.ts                # Componente principal
│   │   └── app.html              # Template
│   ├── environments/
│   │   └── environment.ts        # ⚠️ Configurar aquí
│   ├── index.html
│   ├── main.ts
│   └── styles.css                # Tailwind + temas
├── public/
│   ├── manifest.json             # PWA
│   ├── icon-192.png             # Iconos app
│   └── icon-512.png
├── GUIA_USUARIO.md              # 📖 Manual de usuario
├── GUIA_TECNICA.md              # 🔧 Documentación técnica
└── README.md                    # Este archivo
```

---

## 🛠️ Scripts Disponibles

```bash
npm start              # Desarrollo (localhost:4200)
npm run build         # Build producción
npm test              # Tests (si existen)
npm run lint          # Lint código
```

---

## 🎨 Stack Tecnológico

| Categoría     | Tecnología                   |
| ------------- | ---------------------------- |
| **Framework** | Angular 20.3 (Standalone)    |
| **Lenguaje**  | TypeScript 5.9               |
| **Estilos**   | Tailwind CSS 4.1             |
| **Backend**   | Supabase (PostgreSQL + Auth) |
| **Build**     | Vite + Angular CLI           |
| **Charts**    | Chart.js 4.x (opcional)      |
| **PWA**       | Web App Manifest             |

**Bundle final:** 116 KB (gzipped) ⚡

---

## 📱 Instalación como App

### Android / Chrome

1. Abre la app en Chrome
2. Menú (⋮) → "Añadir a pantalla de inicio"
3. ✅ Listo

### iOS / Safari

1. Abre la app en Safari
2. Compartir → "Añadir a pantalla de inicio"
3. ✅ Listo

---

## 🔐 Seguridad

- ✅ **Autenticación** con Supabase Auth
- ✅ **RLS** (Row Level Security) en PostgreSQL
- ✅ **HTTPS** requerido en producción
- ✅ **Políticas**: Solo ves/editas tus propios gastos
- ⚠️ **Gastos compartidos**: Visible para ambos en la pareja

---

## 📚 Documentación

- **[Guía de Usuario](GUIA_USUARIO.md)** - Manual completo para usuarios finales
- **[Guía Técnica](GUIA_TECNICA.md)** - Documentación para desarrolladores

---

## 🚢 Deploy

### Netlify

```bash
npm run build
# Deploy carpeta: dist/gastos-pastel
```

### Vercel

```bash
vercel --prod
```

### Firebase

```bash
firebase init hosting
firebase deploy
```

**Recuerda:** Configurar redirect para SPA en todas las plataformas.

---

## 🐛 Issues Conocidos

- ⚠️ **Nombres hardcoded**: "AIRAM" y "YEINI" están hardcoded en `app.ts`
  - **Fix futuro**: Extraer de perfil de usuario
- ⚠️ **Presupuestos locales**: No se sincronizan entre dispositivos
  - **Stored**: localStorage del navegador
- ⚠️ **Service Worker**: No implementado aún
  - **Offline**: Solo funciona con caché del navegador

---

## 🔮 Roadmap Futuro

- [ ] **Service Worker** para funcionamiento offline completo
- [ ] **Gráficos avanzados** con Chart.js (ya instalado)
- [ ] **Notificaciones Push** para recordatorios
- [ ] **Export PDF** además de CSV
- [ ] **Perfiles de usuario** dinámicos (nombres/fotos)
- [ ] **Presupuestos sincronizados** en Supabase
- [ ] **Categorías personalizadas** por usuario
- [ ] **Multi-idioma** (i18n)

---

## 🤝 Contribuir

¡Las contribuciones son bienvenidas!

1. Fork el proyecto
2. Crea tu feature branch (`git checkout -b feature/AmazingFeature`)
3. Commit tus cambios (`git commit -m 'feat: Add amazing feature'`)
4. Push al branch (`git push origin feature/AmazingFeature`)
5. Abre un Pull Request

---

## 📄 Licencia

Este proyecto está bajo licencia MIT. Ver archivo `LICENSE` para detalles.

---

## 👥 Autores

**Proyecto:** GastosDuo  
**Versión:** 1.0.0  
**Año:** 2025

---

## 💬 Soporte

¿Tienes preguntas o problemas?

1. Revisa la [Guía de Usuario](GUIA_USUARIO.md)
2. Consulta la [Guía Técnica](GUIA_TECNICA.md)
3. Abre un issue en GitHub

---

## ⭐ Agradecimientos

- **Angular Team** - Framework increíble
- **Supabase** - Backend as a Service
- **Tailwind Labs** - Sistema de diseño
- **Comunidad Open Source** - Inspiración y recursos

---

**¡Hecho con 💕 para gestionar finanzas en pareja!**
