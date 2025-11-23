# GastosDuo - Documentación Técnica

**Versión 1.0** | Angular 20.3 | Noviembre 2025

---

## 📋 Índice

1. [Stack Tecnológico](#stack-tecnológico)
2. [Arquitectura](#arquitectura)
3. [Estructura del Proyecto](#estructura-del-proyecto)
4. [Configuración Inicial](#configuración-inicial)
5. [Componentes Principales](#componentes-principales)
6. [Servicios](#servicios)
7. [Estilos y Temas](#estilos-y-temas)
8. [PWA](#pwa)
9. [Build y Deploy](#build-y-deploy)
10. [Troubleshooting](#troubleshooting)

---

## Stack Tecnológico

### Frontend
- **Framework**: Angular 20.3.0 (Standalone Components)
- **Lenguaje**: TypeScript 5.9.2
- **Estilos**: Tailwind CSS 4.1.17
- **Build**: Vite (Angular Build 20.3.9)

### Backend/Database
- **BaaS**: Supabase
- **Autenticación**: Supabase Auth (Email/Password)
- **Base de Datos**: PostgreSQL (via Supabase)

### Librerías
- **Signals**: Angular Signals (reactivity)
- **Forms**: Angular Forms Module
- **HTTP**: Supabase JS Client 2.83.0
- **Charts**: Chart.js 4.x (instalado, no implementado)

### Build Stats
```
Bundle size: 479.63 KB (raw) → 116.77 KB (gzipped)
- main.js: 450.52 KB → 111.74 KB
- styles.css: 29.12 KB → 5.03 KB
```

---

## Arquitectura

### Patrón: Single Page Application (SPA)
```
┌─────────────────────────────────────┐
│         index.html (Shell)          │
│  ┌───────────────────────────────┐  │
│  │      App Component (Root)     │  │
│  │  ┌─────────────────────────┐  │  │
│  │  │   Header + Nav Tabs     │  │  │
│  │  ├─────────────────────────┤  │  │
│  │  │   Notifications Banner  │  │  │
│  │  ├─────────────────────────┤  │  │
│  │  │   Dashboard / Movements │  │  │
│  │  │   Budgets / Balance     │  │  │
│  │  │   (Conditional *ngIf)   │  │  │
│  │  └─────────────────────────┘  │  │
│  └───────────────────────────────┘  │
└─────────────────────────────────────┘
             ↕
    ┌─────────────────┐
    │  ExpenseService │
    │   (Supabase)    │
    └─────────────────┘
```

### Flujo de Datos (Reactive)
```
[User Input] → [Signal Update] → [Computed Recalculation] → [UI Re-render]
```

---

## Estructura del Proyecto

```
gastos-pastel/
├── public/
│   ├── manifest.json          # PWA manifest
│   ├── icon-192.png          # App icon
│   └── icon-512.png          # App icon (large)
├── src/
│   ├── app/
│   │   ├── services/
│   │   │   └── expense.ts    # Supabase service
│   │   ├── app.ts            # Main component logic
│   │   ├── app.html          # Main template
│   │   └── app.css           # Component styles (empty)
│   ├── environments/
│   │   ├── environment.ts            # Production config
│   │   └── environment.development.ts # Dev config
│   ├── index.html            # Entry point
│   ├── main.ts              # Bootstrap
│   └── styles.css           # Global styles + Tailwind
├── angular.json             # Angular config
├── package.json            # Dependencies
├── tsconfig.json          # TypeScript config
├── GUIA_USUARIO.md       # User manual
└── GUIA_TECNICA.md       # This file
```

---

## Configuración Inicial

### 1. Clonar y Instalar
```bash
cd gastos-pastel
npm install
```

### 2. Configurar Supabase

**Crear proyecto en Supabase:**
1. Ir a [supabase.com](https://supabase.com)
2. Crear nuevo proyecto
3. Copiar URL y anon key

**Actualizar variables de entorno:**

Editar `src/environments/environment.ts`:
```typescript
export const environment = {
  production: true,
  supabaseUrl: 'https://xxx.supabase.co',  // Tu URL
  supabaseKey: 'eyJhbGc...',               // Tu anon key
};
```

Editar `src/environments/environment.development.ts` igual.

### 3. Crear Tabla en Supabase

Ir a SQL Editor en Supabase y ejecutar:

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

-- Row Level Security (RLS)
ALTER TABLE expenses ENABLE ROW LEVEL SECURITY;

-- Política: Usuarios autenticados pueden ver todos los gastos
CREATE POLICY "Enable read for authenticated users"
ON expenses FOR SELECT
TO authenticated
USING (true);

-- Política: Usuarios solo pueden insertar sus propios gastos
CREATE POLICY "Enable insert for authenticated users"
ON expenses FOR INSERT
TO authenticated
WITH CHECK (auth.uid() = user_id);

-- Política: Usuarios solo pueden actualizar sus propios gastos
CREATE POLICY "Enable update for users based on user_id"
ON expenses FOR UPDATE
TO authenticated
USING (auth.uid() = user_id);

-- Política: Usuarios solo pueden eliminar sus propios gastos
CREATE POLICY "Enable delete for users based on user_id"
ON expenses FOR DELETE
TO authenticated
USING (auth.uid() = user_id);
```

### 4. Ejecutar Localmente
```bash
npm start
# o
ng serve
```

Abre `http://localhost:4200`

---

## Componentes Principales

### App Component (`app.ts`)

**Responsabilidades:**
- Gestión de estado con Signals
- Autenticación
- CRUD de gastos
- Lógica de presupuestos y notificaciones

**Signals Principales:**
```typescript
// UI State
currentTab: Signal<'dashboard' | 'movements' | 'balance' | 'budgets'>
isDarkMode: Signal<boolean>
isLoginMode: Signal<boolean>
isEditing: Signal<boolean>

// Data
budgets: Signal<Budget[]>
notifications: Signal<Notification[]>

// Service injected signals
expenseService.expenses: Signal<Expense[]>
expenseService.user: Signal<User | null>
```

**Computed Signals:**
```typescript
selectedMonth        // Mes seleccionado para filtrar
filteredExpenses     // Gastos del mes actual
myExpenses           // Mis gastos del mes
myTotal              // Total de mis gastos
partnerTotal         // Total gastos pareja
totalJoint           // Total conjunto
balance              // Diferencia / 2
categoryStats        // Desglose por categoría
categoryProgress     // Progreso vs presupuesto
budgetAlerts         // Notificaciones automáticas
```

**Métodos CRUD:**
```typescript
// Autenticación
handleAuth()
toggleDarkMode()

// Gastos
saveExpense()         // Crear o actualizar
edit(item)           // Cargar para editar
delete(id)           // Eliminar
cancelEdit()         // Abortar edición

// Presupuestos
loadBudgets()        // Desde localStorage
saveBudget()         // Guardar/actualizar
deleteBudget(cat)    // Eliminar

// Notificaciones
dismissNotification(id)

// Utilidades
getIcon(cat)         // Icono por categoría
getToday()           // Fecha local YYYY-MM-DD
downloadReport()     // Export CSV
```

---

## Servicios

### ExpenseService (`services/expense.ts`)

**Singleton**: `providedIn: 'root'`

**Responsabilidades:**
- Cliente Supabase
- Autenticación
- CRUD de gastos en base de datos

**Código:**
```typescript
@Injectable({ providedIn: 'root' })
export class ExpenseService {
  private supabase: SupabaseClient;
  
  expenses = signal<Expense[]>([]);
  user = signal<any>(null);

  constructor() {
    this.supabase = createClient(
      environment.supabaseUrl, 
      environment.supabaseKey
    );
    this.initAuth();
  }

  async initAuth() {
    // Cargar sesión existente
    // Listener para cambios de auth
  }

  async signUp(email, password) { ... }
  async signIn(email, password) { ... }
  async logout() { ... }
  
  async loadExpenses() { ... }
  async addExpense(expense) { ... }
  async updateExpense(id, expense) { ... }
  async deleteExpense(id) { ... }
}
```

**Interfaz Expense:**
```typescript
interface Expense {
  id?: number;
  user_id?: string;
  name: string;
  amount: number;
  category: string;
  date: string;  // YYYY-MM-DD
}
```

---

## Estilos y Temas

### Tailwind CSS v4

**Configuración:** `src/styles.css`

```css
@import "tailwindcss";

@theme {
  --font-sans: 'Poppins', sans-serif;
  
  /* Colores pastel */
  --color-pastel-bg: #FDF6F0;
  --color-pastel-primary: #FF9AA2;
  --color-pastel-secondary: #B5EAD7;
  --color-pastel-tertiary: #e58cff;
  --color-pastel-accent: #C7CEEA;
  --color-pastel-text: #4A4A4A;
}
```

### Modo Oscuro

**Variables CSS dinámicas:**
```css
:root {
  /* Light mode */
  --bg-primary: #FDF6F0;
  --bg-card: #FFFFFF;
  --bg-input: #FDF6F0;
  --text-primary: #4A4A4A;
  --text-secondary: #9CA3AF;
  --border-color: #E5E7EB;
  --shadow: rgba(0, 0, 0, 0.1);
}

:root.dark {
  /* Dark mode */
  --bg-primary: #1A1A1A;
  --bg-card: #2D2D2D;
  --bg-input: #3A3A3A;
  --text-primary: #E5E5E5;
  --text-secondary: #9CA3AF;
  --border-color: #404040;
  --shadow: rgba(0, 0, 0, 0.5);
}
```

**Uso en templates:**
```html
<div [style.background-color]="'var(--bg-card)'"
     [style.color]="'var(--text-primary)'">
  ...
</div>
```

**Toggle:**
```typescript
toggleDarkMode() {
  this.isDarkMode.set(!this.isDarkMode());
  if (this.isDarkMode()) {
    document.documentElement.classList.add('dark');
    localStorage.setItem('darkMode', 'true');
  } else {
    document.documentElement.classList.remove('dark');
    localStorage.setItem('darkMode', 'false');
  }
}
```

### Clases Utilitarias

```css
.input-pastel {
  @apply w-full p-3 rounded-xl outline-none transition-all border;
  background-color: var(--bg-input);
  border-color: var(--border-color);
}

.nav-btn {
  @apply w-14 h-14 rounded-full flex items-center ...;
}

.nav-btn.active {
  background-color: var(--bg-input);
}
```

---

## PWA

### Manifest (`public/manifest.json`)

```json
{
  "name": "GastosDuo - Finanzas en Pareja",
  "short_name": "GastosDuo",
  "start_url": "/",
  "display": "standalone",
  "background_color": "#FDF6F0",
  "theme_color": "#FF9AA2",
  "orientation": "portrait",
  "icons": [
    {
      "src": "/icon-192.png",
      "sizes": "192x192",
      "type": "image/png"
    },
    {
      "src": "/icon-512.png",
      "sizes": "512x512",
      "type": "image/png"
    }
  ]
}
```

### Meta Tags (`index.html`)

```html
<!-- PWA -->
<link rel="manifest" href="/manifest.json">
<meta name="theme-color" content="#FF9AA2">
<meta name="apple-mobile-web-app-capable" content="yes">
<link rel="apple-touch-icon" href="/icon-192.png">
```

### Service Worker

**No implementado actualmente.** Para agregar:

1. Instalar Angular PWA:
```bash
ng add @angular/pwa
```

2. Configurar en `angular.json`:
```json
"serviceWorker": true,
"ngswConfigPath": "ngsw-config.json"
```

---

## Build y Deploy

### Desarrollo
```bash
npm start           # ng serve
```
- Compila en modo desarrollo
- Live reload en `http://localhost:4200`
- Source maps habilitados

### Producción
```bash
npm run build      # ng build
```
- Output: `dist/gastos-pastel/`
- Minificación automática
- Tree-shaking
- AOT compilation

### Deploy

**Netlify:**
```bash
# netlify.toml
[build]
  command = "npm run build"
  publish = "dist/gastos-pastel"

[[redirects]]
  from = "/*"
  to = "/index.html"
  status = 200
```

**Vercel:**
```json
{
  "buildCommand": "npm run build",
  "outputDirectory": "dist/gastos-pastel",
  "cleanUrls": true,
  "trailingSlash": false
}
```

**Firebase Hosting:**
```bash
firebase init hosting
# Set public directory: dist/gastos-pastel
# Configure as SPA: Yes
firebase deploy
```

---

## Troubleshooting

### Error: "Supabase connection failed"
**Causa:** Variables de entorno incorrectas
**Solución:** 
1. Verificar `environment.ts` tiene URL y key correctas
2. Verificar proyecto Supabase está activo
3. Check browser console para detalles

### Error: "Cannot read property of null"
**Causa:** Usuario no autenticado intentando acceder datos
**Solución:**
- Verificar `*ngIf="expenseService.user()"` en template
- Agregar guards en servicios

### Estilos no cargan / Tailwind no funciona
**Causa:** Tailwind v4 config incorrecto
**Solución:**
1. Verificar `@import "tailwindcss"` en `styles.css`
2. Verificar `@theme` syntax
3. Rebuild: `rm -rf .angular && npm start`

### PWA no se instala
**Causa:** Manifest o HTTPS faltante
**Solución:**
1. PWA requiere HTTPS (localhost OK)
2. Verificar `manifest.json` es accesible
3. Check Chrome DevTools > Application > Manifest

### Build falla con "Unterminated quote"
**Causa:** Error de sintaxis en templates
**Solución:**
1. Buscar comillas sin cerrar en `app.html`
2. Verificar strings en `[style.prop]` bindings
3. Check línea indicada en error

### localStorage no persiste
**Causa:** Modo incógnito o settings del navegador
**Solución:**
1. Verificar no estás en modo incógnito
2. Check browser permissions
3. Usar DevTools > Application > Storage

---

## Extensiones Futuras

### Charts con Chart.js
```typescript
import { Chart } from 'chart.js/auto';

createPieChart() {
  new Chart(ctx, {
    type: 'pie',
    data: {
      labels: this.categories,
      datasets: [{
        data: this.categoryStats().map(c => c.total)
      }]
    }
  });
}
```

### Notificaciones Push
```typescript
// Service Worker registration
// Push notification subscription
// Backend trigger con Supabase Functions
```

### Export PDF
```bash
npm install jspdf jspdf-autotable
```

```typescript
import jsPDF from 'jspdf';

downloadPDF() {
  const doc = new jsPDF();
  doc.text('Reporte de Gastos', 10, 10);
  // Add table with autoTable
  doc.save('gastos.pdf');
}
```

---

## Contribución

### Git Workflow
```bash
git checkout -b feature/nueva-funcionalidad
# Hacer cambios
git add .
git commit -m "feat: descripción"
git push origin feature/nueva-funcionalidad
# Crear Pull Request
```

### Convenciones
- **Commits**: Conventional Commits (feat, fix, docs, style, refactor)
- **Naming**: camelCase para variables, PascalCase para componentes
- **TypeScript**: Strict mode habilitado
- **Linting**: Seguir config Angular CLI

---

## Licencia y Créditos

**Proyecto:** GastosDuo  
**Versión:** 1.0.0  
**Framework:** Angular 20.3  
**Backend:** Supabase  
**Desarrollado:** Noviembre 2025  

---

**¿Preguntas técnicas?** Consulta el código fuente o abre un issue en el repositorio.
