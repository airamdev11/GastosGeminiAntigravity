# GastosDuo - Guía de Usuario

**Versión 1.0** | Noviembre 2025

---

## 🎯 ¿Qué es GastosDuo?

GastosDuo es una aplicación web para **gestionar gastos compartidos en pareja** de forma sencilla y visual. Con diseño moderno en colores pastel, modo oscuro, y control de presupuestos.

---

## 🚀 Primeros Pasos

### 1. Registro / Inicio de Sesión
- **Email**: Ingresa tu correo electrónico
- **Contraseña**: Mínimo 6 caracteres
- Haz clic en **"Crear Cuenta"** o **"Entrar"** según corresponda
- Alterna entre registro/login con el enlace inferior

### 2. Compartir con tu Pareja
Para que ambos vean los gastos compartidos, tu pareja debe:
1. Crear su propia cuenta con otro email
2. Usar la **misma base de datos de Supabase**
3. Ambos verán todos los gastos de los dos

---

## 📱 Navegación Principal

La aplicación tiene **4 pestañas** en la barra inferior:

| Icono | Pestaña | Función |
|---|---|---|
| 📊 | **Dashboard** | Vista general del mes |
| 💸 | **Movimientos** | Agregar/editar gastos |
| 💰 | **Presupuestos** | Control de límites |
| ⚖️ | **Balance** | ¿Quién debe a quién? |

---

## 📊 Dashboard - Vista General

### Selector de Mes
- **Mes actual por defecto**
- Cambia el mes para ver gastos históricos
- Todos los gráficos se actualizan automáticamente

### Tarjeta Principal
- **Total del mes**: Suma de gastos de ambos
- **Barra de distribución**: 
  - Verde: Tus gastos
  - Rosa: Gastos de tu pareja
- Muestra nombres "AIRAM" y "YEINI" (hardcoded)

### Desglose por Categoría
- Tarjetas con iconos por categoría
- Monto total y porcentaje del mes
- Barra de progreso visual

### Botón Excel
- Descarga reporte CSV del mes seleccionado
- Incluye: Fecha, Concepto, Categoría, Monto, Quién

---

## 💸 Movimientos - Gestión de Gastos

### Agregar Nuevo Gasto
1. **Concepto**: Ej. "Tacos", "Gasolina"
2. **Monto**: Cantidad en pesos
3. **Fecha**: Por defecto hoy
4. **Categoría**: Selecciona icono (7 opciones)
5. **Guardar**: Click en "Agregar Gasto"

### Categorías Disponibles
- 🍔 Comida
- 🚕 Transporte
- 🏠 Casa
- 🍿 Ocio
- 💊 Salud
- 🐶 Mascotas
- 📦 Otros

### Editar Gasto
- **Solo tus gastos**: Click en cualquier gasto tuyo
- Se carga en el formulario superior
- Modifica y guarda cambios
- Botón "Cancelar" para abortar edición

### Eliminar Gasto
- **Hover** sobre tu gasto muestra botón "Eliminar"
- Click y confirma
- Solo puedes eliminar tus propios gastos

### Lista de Movimientos
- Ordenados por fecha (más recientes primero)
- **Borde izquierdo**:
  - Verde: Tus gastos
  - Rosa: Gastos de tu pareja
- Badge "Tú" en tus gastos
- Los de tu pareja no son editables

---

## 💰 Presupuestos - Control de Gastos

### Definir Presupuesto
1. **Selecciona categoría**: Click en icono
2. **Límite mensual**: Ingresa monto
3. **Guardar**: Click en "Guardar Presupuesto"
- Si ya existe, se actualiza
- Si es nueva, se crea

### Visualización de Progreso
Cada presupuesto muestra:
- **Icono** de la categoría
- **Gastado vs Límite**: "$500 / $1000"
- **Barra de progreso** con 3 estados:
  - 🟢 **Verde** (0-69%): Todo bien
  - 🟡 **Amarillo** (70-89%): Cuidado
  - 🔴 **Rojo** (90-100%+): ¡Límite excedido!
- **Porcentaje** utilizado
- Botón **"Eliminar"** para quitar presupuesto

### Almacenamiento
- Presupuestos guardados en **localStorage**
- Persisten al recargar
- Son **locales a tu navegador** (no compartidos)

---

## 🚨 Notificaciones Automáticas

### ¿Cuándo aparecen?
Las notificaciones aparecen automáticamente cuando:
- **⚠️ Warning (Amarillo)**: Gastos ≥ 90% del presupuesto
- **🚨 Danger (Rojo)**: Gastos ≥ 100% del presupuesto

### Ubicación
- Banner flotante debajo del header
- Visible en todas las pestañas
- Múltiples notificaciones apiladas

### Descartar
- Click en **✕** para cerrar
- Las alertas reaparecen si sigues excediendo

---

## ⚖️ Balance - Cuentas Claras

### ¿Quién debe a quién?
El balance muestra la diferencia entre tus gastos y los de tu pareja:

- **🤑 Te deben**: Gastaste más que tu pareja
- **💸 Debes**: Tu pareja gastó más que tú
- **🤝 A mano**: Gastaron exactamente igual

### Cálculo
```
Balance = (Tus Gastos - Gastos Pareja) / 2
```

### Mensajes
- Sugiere quién debe pagar la próxima salida
- Monto exacto a equilibrar
- Basado en el **mes seleccionado**

---

## 🌙 Modo Oscuro

### Activar/Desactivar
- **Botón en header**: 🌙 (claro) / ☀️ (oscuro)
- Click para alternar
- Cambio instantáneo con transición suave

### Persistencia
- Preferencia guardada en **localStorage**
- Se mantiene al recargar la página
- Afecta toda la aplicación

---

## 📱 Instalar como App (PWA)

### En Android/Chrome
1. Abre la app en Chrome
2. Menú (⋮) → **"Añadir a pantalla de inicio"**
3. Confirma
4. Icono aparece en tu pantalla

### En iOS/Safari
1. Abre la app en Safari
2. Botón Compartir → **"Añadir a la pantalla de inicio"**
3. Confirma
4. Icono aparece en tu pantalla

### Ventajas
- Se abre como app nativa (sin barra del navegador)
- Icono personalizado con colores pastel
- Funcionamiento offline (próximamente)

---

## 🔐 Seguridad y Privacidad

### Datos Personales
- Solo email y contraseña requeridos
- **Supabase** maneja autenticación segura
- Contraseñas encriptadas

### Gastos
- Almacenados en base de datos compartida
- Solo usuarios con tu proyecto Supabase pueden ver
- Requiere login para acceder

### Presupuestos
- Guardados localmente en tu navegador
- **No se comparten** con tu pareja
- Cada uno define sus propios límites

---

## 💡 Tips y Trucos

### Organización
1. **Registra gastos diariamente** para no olvidar
2. **Usa categorías consistentes** para mejores estadísticas
3. **Revisa el dashboard mensualmente** para análisis

### Presupuestos
1. **Empieza conservador** con límites bajos
2. **Ajusta según necesidad** después del primer mes
3. **Prioriza categorías problemáticas** (ej. Comida, Ocio)

### Balance
1. **Revisa al final del mes** para liquidar cuentas
2. **Screenshot del balance** como comprobante
3. **Descarga Excel** para archivo permanente

---

## ❓ Preguntas Frecuentes

**¿Puedo usar con más de 2 personas?**
No, la app está diseñada para parejas. El balance asume solo 2 usuarios.

**¿Funciona sin internet?**
Requiere conexión para guardar/cargar gastos. PWA permite visualización offline de datos cargados.

**¿Los presupuestos son compartidos?**
No, cada persona define sus propios presupuestos en su navegador.

**¿Puedo exportar todos los datos?**
Sí, usa el botón "Excel" para descargar CSV por mes.

**¿Cómo cambio mi contraseña?**
Desde Supabase dashboard o implementa función de reset (próximamente).

---

## 🆘 Soporte

Para problemas técnicos o dudas:
1. Revisa esta guía primero
2. Consulta la documentación técnica
3. Contacta al desarrollador

---

**¡Disfruta gestionando tus finanzas en pareja! 💕**
