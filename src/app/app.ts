import { CommonModule } from '@angular/common';
import { Component, computed, effect, inject, signal } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { Expense, ExpenseService, InstallmentStats } from './services/expense';

export interface Budget {
  category: string;
  limit: number;
}

@Component({
  selector: 'app-root',
  standalone: true,
  imports: [CommonModule, FormsModule],
  templateUrl: './app.html',
  styleUrl: './app.css',
})
export class App {
  expenseService = inject(ExpenseService);

  // UI State
  currentTab = signal<'dashboard' | 'movements' | 'balance' | 'budgets'>('movements');
  isDarkMode = signal(false); // Modo oscuro

  // Formulario Auth (Solo Login)
  authData = { email: '', password: '' };
  authError = signal(''); // Signal para reactividad inmediata
  authAttempts = 0;
  lastAttemptTime = 0;

  // Presupuestos
  budgets = signal<Budget[]>([]);
  budgetForm: Budget = { category: 'Comida', limit: 0 };

  // Notificaciones
  notifications = signal<Array<{ id: string; message: string; type: 'warning' | 'danger' }>>([]);

  constructor() {
    // Cargar preferencia de tema al iniciar
    const savedTheme = localStorage.getItem('darkMode');
    if (savedTheme === 'true') {
      this.isDarkMode.set(true);
      document.documentElement.classList.add('dark');
    }

    // Cargar presupuestos guardados
    this.loadBudgets();

    // Effect para actualizar notificaciones automáticamente
    effect(() => {
      const alerts = this.budgetAlerts();
      const currentNotifications = this.notifications();
      const newAlerts = alerts.filter(
        (alert) => !currentNotifications.find((n) => n.id === alert.id)
      );

      if (newAlerts.length > 0) {
        this.notifications.set([...currentNotifications, ...newAlerts]);
      }
    });
  }

  // Formulario Gastos
  isEditing = signal(false);
  editingId = signal<number | null>(null);
  expenseForm: Expense = {
    name: '',
    amount: 0,
    category: 'Comida',
    date: this.getToday(),
  };

  // Gastos a Plazos - UI State
  showInstallmentForm = signal(false);
  installmentConceptForm = {
    name: '',
    totalAmount: 0,
    category: 'Comida',
  };

  // Vincular gasto a concepto a plazos
  linkToInstallment = signal(false);
  selectedInstallmentId = signal<number | null>(null);

  categories = ['Comida', 'Transporte', 'Casa', 'Ocio', 'Salud', 'Mascotas', 'Otros'];

  categoryIcons: Record<string, string> = {
    Comida: '🍔',
    Transporte: '🚕',
    Casa: '🏠',
    Ocio: '🍿',
    Salud: '💊',
    Mascotas: '🐶',
    Otros: '📦',
  };

  // --- COMPUTED (REPORTES) ---

  // NUEVO: Selector de Mes (Por defecto el mes actual: "2025-11")
  selectedMonth = signal(new Date().toISOString().slice(0, 7));

  // 1. FILTRO MAESTRO (Base de todos los reportes)
  // Todos los cálculos ahora dependen de esto. Si cambias el mes, todo se recalcula solo.
  // IMPORTANTE: Filtrar solo gastos reales (no conceptos a plazos)
  filteredExpenses = computed(() => {
    return this.expenseService
      .expenses()
      .filter((e) => e.date.startsWith(this.selectedMonth()) && !e.is_installment_concept);
  });

  // Conceptos a plazos activos
  installmentConcepts = computed(() => {
    return this.expenseService.getAllInstallmentStats();
  });
  // Mis Gastos del Mes
  myExpenses = computed(() =>
    this.filteredExpenses().filter((e) => e.user_id === this.expenseService.user()?.id)
  );

  myTotal = computed(() => this.myExpenses().reduce((acc, curr) => acc + curr.amount, 0));

  // Gastos Pareja del Mes
  partnerTotal = computed(() =>
    this.filteredExpenses()
      .filter((e) => e.user_id !== this.expenseService.user()?.id)
      .reduce((acc, curr) => acc + curr.amount, 0)
  );

  totalJoint = computed(() => this.myTotal() + this.partnerTotal());

  // Balance del Mes
  balance = computed(() => (this.myTotal() - this.partnerTotal()) / 2);

  // Desglose por Categoría (Del Mes)
  categoryStats = computed(() => {
    const stats: Record<string, number> = {};
    this.filteredExpenses().forEach((e) => {
      stats[e.category] = (stats[e.category] || 0) + e.amount;
    });

    return Object.entries(stats)
      .map(([name, total]) => ({
        name,
        total,
        icon: this.categoryIcons[name],
        percent: this.totalJoint() > 0 ? (total / this.totalJoint()) * 100 : 0,
      }))
      .sort((a, b) => b.total - a.total);
  });

  // Progreso de Presupuestos
  categoryProgress = computed(() => {
    const progress: Array<{
      category: string;
      spent: number;
      limit: number;
      percent: number;
      status: 'ok' | 'warning' | 'danger';
    }> = [];

    this.budgets().forEach((budget) => {
      const spent = this.filteredExpenses()
        .filter((e) => e.category === budget.category)
        .reduce((acc, e) => acc + e.amount, 0);

      const percent = budget.limit > 0 ? (spent / budget.limit) * 100 : 0;
      let status: 'ok' | 'warning' | 'danger' = 'ok';

      if (percent >= 90) status = 'danger';
      else if (percent >= 70) status = 'warning';

      progress.push({
        category: budget.category,
        spent,
        limit: budget.limit,
        percent,
        status,
      });
    });

    return progress.sort((a, b) => b.percent - a.percent);
  });

  // Alertas automáticas de presupuesto (PURO - sin side effects)
  budgetAlerts = computed(() => {
    const alerts: Array<{ id: string; message: string; type: 'warning' | 'danger' }> = [];

    this.categoryProgress().forEach((item) => {
      if (item.percent >= 100) {
        alerts.push({
          id: `budget-${item.category}`,
          message: `¡Has excedido el presupuesto de ${this.sanitizeText(item.category)}! ($${
            item.spent
          }/$${item.limit})`,
          type: 'danger',
        });
      } else if (item.percent >= 90) {
        alerts.push({
          id: `budget-${item.category}`,
          message: `Cuidado: Estás cerca del límite en ${this.sanitizeText(
            item.category
          )} (${item.percent.toFixed(0)}%)`,
          type: 'warning',
        });
      }
    });

    return alerts;
  });

  // --- ACCIONES ---

  async handleAuth() {
    this.authError.set(''); // Limpiar error anterior
    const { email, password } = this.authData;
    const now = Date.now();

    // Rate limiting: reset después de 1 minuto
    if (now - this.lastAttemptTime > 60000) {
      this.authAttempts = 0;
    }

    if (this.authAttempts >= 5) {
      this.authError.set('Demasiados intentos. Espera 1 minuto.');
      return;
    }

    // Validar email
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(email)) {
      this.authError.set('Email inválido');
      return;
    }

    // Validar contraseña
    if (password.length < 6) {
      this.authError.set('La contraseña debe tener al menos 6 caracteres');
      return;
    }

    this.authAttempts++;
    this.lastAttemptTime = now;

    const { error } = await this.expenseService.signIn(email, password);
    if (error) {
      this.authError.set('Credenciales incorrectas');
    } else {
      // Limpiar campos después de login exitoso
      this.authData = { email: '', password: '' };
      this.authAttempts = 0;
    }
  }

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

  getIcon(cat: string) {
    return this.categoryIcons[cat] || '✨';
  }

  // Cargar datos al formulario para editar
  edit(item: Expense) {
    this.isEditing.set(true);
    this.editingId.set(item.id!);
    this.expenseForm = { ...item }; // Copia para no modificar directo la lista
    this.currentTab.set('movements'); // Llevar al usuario a la tab del form
    window.scrollTo({ top: 0, behavior: 'smooth' });
  }

  cancelEdit() {
    this.isEditing.set(false);
    this.editingId.set(null);
    this.resetForm();
  }

  // Helper para obtener fecha LOCAL en formato YYYY-MM-DD
  getToday(): string {
    const now = new Date();
    // Ajustamos la hora restando la diferencia de zona horaria
    now.setMinutes(now.getMinutes() - now.getTimezoneOffset());
    return now.toISOString().split('T')[0];
  }

  async saveExpense() {
    // Validación completa de inputs
    if (!this.expenseForm.name || this.expenseForm.name.trim().length === 0) {
      alert('El concepto no puede estar vacío');
      return;
    }

    if (this.expenseForm.name.length > 100) {
      alert('El concepto es demasiado largo (máx 100 caracteres)');
      return;
    }

    if (this.expenseForm.amount <= 0) {
      alert('El monto debe ser mayor a 0');
      return;
    }

    if (this.expenseForm.amount > 1000000) {
      alert('El monto es demasiado grande (máx $1,000,000)');
      return;
    }

    if (!this.categories.includes(this.expenseForm.category)) {
      alert('Categoría inválida');
      return;
    }

    // Validación especial si es aportación a concepto a plazos
    if (this.linkToInstallment() && this.selectedInstallmentId()) {
      const validation = this.expenseService.validateContribution(
        this.selectedInstallmentId()!,
        this.expenseForm.amount
      );

      if (!validation.valid) {
        alert(validation.error);
        return;
      }
    }

    // Preparar el gasto con campos de vinculación si aplica
    const expenseToSave: Expense = {
      ...this.expenseForm,
      installment_concept_id: this.linkToInstallment() ? this.selectedInstallmentId() : null,
    };

    // Intentar guardar
    let success = false;
    if (this.isEditing() && this.editingId()) {
      success = await this.expenseService.updateExpense(this.editingId()!, expenseToSave);
    } else {
      success = await this.expenseService.addExpense(expenseToSave);
    }

    if (success) {
      this.cancelEdit();
    }
  }

  async delete(id: number) {
    if (confirm('¿Borrar este registro?')) {
      const success = await this.expenseService.deleteExpense(id);

      // Si se eliminó exitosamente, cancelar edición si estaba editando este item
      if (success && this.editingId() === id) {
        this.cancelEdit();
      }
    }
  }

  resetForm() {
    this.expenseForm = {
      name: '',
      amount: 0,
      category: 'Comida',
      date: this.getToday(),
    };
    this.linkToInstallment.set(false);
    this.selectedInstallmentId.set(null);
  }

  // --- GASTOS A PLAZOS ---

  async createInstallmentConcept() {
    if (!this.installmentConceptForm.name || this.installmentConceptForm.name.trim().length === 0) {
      alert('El nombre del concepto no puede estar vacío');
      return;
    }

    if (this.installmentConceptForm.totalAmount <= 0) {
      alert('El monto total debe ser mayor a 0');
      return;
    }

    if (this.installmentConceptForm.totalAmount > 10000000) {
      alert('El monto es demasiado grande (máx $10,000,000)');
      return;
    }

    const success = await this.expenseService.createInstallmentConcept(
      this.installmentConceptForm.name,
      this.installmentConceptForm.totalAmount,
      this.installmentConceptForm.category,
      this.getToday()
    );

    if (success) {
      this.resetInstallmentForm();
      this.showInstallmentForm.set(false);
      alert('✅ Concepto a plazos creado exitosamente');
    }
  }

  resetInstallmentForm() {
    this.installmentConceptForm = {
      name: '',
      totalAmount: 0,
      category: 'Comida',
    };
  }

  toggleInstallmentForm() {
    this.showInstallmentForm.set(!this.showInstallmentForm());
    if (!this.showInstallmentForm()) {
      this.resetInstallmentForm();
    }
  }

  getInstallmentStats(conceptId: number): InstallmentStats | null {
    return this.expenseService.getInstallmentStats(conceptId);
  }

  // Helper para sanitizar CSV (prevenir CSV injection)
  sanitizeCSV(value: string): string {
    // Convertir a string si no lo es
    const str = String(value);

    // Prevenir CSV injection
    if (str.startsWith('=') || str.startsWith('+') || str.startsWith('-') || str.startsWith('@')) {
      return "'" + str;
    }

    // Escapar comillas y comas
    if (str.includes(',') || str.includes('"') || str.includes('\n')) {
      return '"' + str.replace(/"/g, '""') + '"';
    }

    return str;
  }

  // Helper para sanitizar texto (prevenir XSS)
  sanitizeText(text: string): string {
    return text.replace(/[<>]/g, '');
  }

  // Función para exportar a CSV (Excel)
  downloadReport() {
    if (this.filteredExpenses().length === 0) {
      alert('No hay gastos para exportar en este mes');
      return;
    }

    const data = this.filteredExpenses().map((e) => ({
      Fecha: e.date,
      Concepto: this.sanitizeCSV(e.name),
      Categoria: e.category,
      Monto: e.amount,
      Quien: e.user_id === this.expenseService.user().id ? 'Yo' : 'Pareja',
    }));

    // Convertir JSON a CSV
    const headers = Object.keys(data[0]).join(',');
    const rows = data
      .map((row) =>
        Object.values(row)
          .map((v) => this.sanitizeCSV(String(v)))
          .join(',')
      )
      .join('\n');
    const csvContent = `data:text/csv;charset=utf-8,${headers}\n${rows}`;

    // Crear link de descarga invisible
    const encodedUri = encodeURI(csvContent);
    const link = document.createElement('a');
    link.setAttribute('href', encodedUri);
    link.setAttribute('download', `Reporte_Gastos_${this.selectedMonth()}.csv`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  }

  // --- PRESUPUESTOS ---

  loadBudgets() {
    try {
      const saved = localStorage.getItem('budgets');
      if (saved) {
        const parsed = JSON.parse(saved);

        // Validar estructura
        if (Array.isArray(parsed)) {
          const valid = parsed.every(
            (b) =>
              typeof b.category === 'string' &&
              typeof b.limit === 'number' &&
              b.limit >= 0 &&
              this.categories.includes(b.category)
          );

          if (valid) {
            this.budgets.set(parsed);
          } else {
            console.warn('Presupuestos inválidos en localStorage, ignorando');
            localStorage.removeItem('budgets');
          }
        }
      }
    } catch (e) {
      console.error('Error al cargar presupuestos:', e);
      localStorage.removeItem('budgets');
    }
  }

  saveBudget() {
    if (this.budgetForm.limit <= 0) {
      alert('El presupuesto debe ser mayor a 0');
      return;
    }

    if (this.budgetForm.limit > 10000000) {
      alert('El límite es demasiado alto (máx $10,000,000)');
      return;
    }

    const existing = this.budgets().find((b) => b.category === this.budgetForm.category);

    if (existing) {
      // Actualizar existente
      const updated = this.budgets().map((b) =>
        b.category === this.budgetForm.category ? { ...this.budgetForm } : b
      );
      this.budgets.set(updated);
    } else {
      // Agregar nuevo
      this.budgets.set([...this.budgets(), { ...this.budgetForm }]);
    }

    localStorage.setItem('budgets', JSON.stringify(this.budgets()));
    this.resetBudgetForm();
  }

  deleteBudget(category: string) {
    const updated = this.budgets().filter((b) => b.category !== category);
    this.budgets.set(updated);
    localStorage.setItem('budgets', JSON.stringify(updated));
  }

  resetBudgetForm() {
    this.budgetForm = { category: 'Comida', limit: 0 };
  }

  // --- NOTIFICACIONES ---

  dismissNotification(id: string) {
    this.notifications.set(this.notifications().filter((n) => n.id !== id));
  }

  trackByNotificationId(index: number, item: { id: string }) {
    return item.id;
  }
}
