import { CommonModule } from '@angular/common';
import { Component, computed, effect, inject, signal } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { Expense, ExpenseService, InstallmentStats } from './services/expense';
import jsPDF from 'jspdf';
import autoTable from 'jspdf-autotable';

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

  // Celebración de concepto completado
  showCelebration = signal(false);

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

  // Símbolos para PDF (ASCII-friendly)
  categorySymbols: Record<string, string> = {
    Comida: '[F]', // Food
    Transporte: '[T]', // Transport
    Casa: '[H]', // Home
    Ocio: '[E]', // Entertainment
    Salud: '[M]', // Medical
    Mascotas: '[P]', // Pet
    Otros: '[O]', // Other
  };

  // Exponer Math para el template
  Math = Math;

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

  // Conceptos a plazos activos (sin completados) - para el selector en el formulario
  activeInstallmentConcepts = computed(() => {
    return this.expenseService.getAllInstallmentStats().filter((concept) => concept.remaining > 0);
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
          message: `¡Has excedido el presupuesto de ${this.sanitizeText(item.category)}! (${
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

  // --- NUEVOS ANÁLISIS PARA DASHBOARD ---

  // Tendencias mensuales (últimos 3 meses)
  monthlyTrends = computed(() => {
    const trends = [];
    const currentDate = new Date(this.selectedMonth() + '-01T12:00:00');

    for (let i = 2; i >= 0; i--) {
      const date = new Date(currentDate);
      date.setMonth(date.getMonth() - i);
      const monthKey = date.toISOString().slice(0, 7);

      const monthExpenses = this.expenseService
        .expenses()
        .filter((e) => e.date.startsWith(monthKey) && !e.is_installment_concept);

      const total = monthExpenses.reduce((acc, e) => acc + e.amount, 0);
      const monthName = date.toLocaleDateString('es-ES', { month: 'short', year: 'numeric' });

      trends.push({ month: monthName, total, key: monthKey });
    }

    // Calcular el máximo para usar en el gráfico
    const maxTotal = Math.max(...trends.map((t) => t.total), 1); // Mínimo 1 para evitar división por cero

    return { trends, maxTotal };
  });

  // Hábitos de gasto
  spendingHabits = computed(() => {
    const expenses = this.filteredExpenses();
    if (expenses.length === 0) return null;

    // Promedio diario
    const daysInMonth = new Date(
      parseInt(this.selectedMonth().split('-')[0]),
      parseInt(this.selectedMonth().split('-')[1]),
      0
    ).getDate();
    const dailyAverage = this.totalJoint() / daysInMonth;

    // Categoría más frecuente
    const categoryCount: Record<string, number> = {};
    expenses.forEach((e) => {
      categoryCount[e.category] = (categoryCount[e.category] || 0) + 1;
    });
    const mostFrequent = Object.entries(categoryCount).sort((a, b) => b[1] - a[1])[0];

    // Día de la semana con más gastos
    const dayCount: Record<string, number> = {};
    const dayNames = ['Dom', 'Lun', 'Mar', 'Mié', 'Jue', 'Vie', 'Sáb'];
    expenses.forEach((e) => {
      const day = new Date(e.date + 'T00:00:00').getDay();
      const dayName = dayNames[day];
      dayCount[dayName] = (dayCount[dayName] || 0) + 1;
    });
    const mostActiveDay = Object.entries(dayCount).sort((a, b) => b[1] - a[1])[0];

    return {
      dailyAverage: Math.round(dailyAverage),
      mostFrequentCategory: mostFrequent ? mostFrequent[0] : null,
      mostActiveDay: mostActiveDay ? mostActiveDay[0] : null,
      totalTransactions: expenses.length,
    };
  });

  // Potencial de ahorro
  savingsPotential = computed(() => {
    const suggestions = [];
    const progress = this.categoryProgress();

    // Sugerencias basadas en presupuestos excedidos
    progress.forEach((item) => {
      if (item.percent > 100) {
        const excess = item.spent - item.limit;
        suggestions.push({
          category: item.category,
          message: `Reduce ${item.category}`,
          amount: Math.round(excess),
        });
      }
    });

    // Sugerencia general si no hay presupuestos
    if (suggestions.length === 0 && this.totalJoint() > 0) {
      const average = this.totalJoint() / this.categoryStats().length;
      const topCategory = this.categoryStats()[0];
      if (topCategory && topCategory.total > average * 1.5) {
        suggestions.push({
          category: topCategory.name,
          message: `${topCategory.name} es tu mayor gasto`,
          amount: Math.round(topCategory.total * 0.1),
        });
      }
    }

    return suggestions;
  });

  // Comparativa individual vs conjunto
  individualComparison = computed(() => {
    const total = this.totalJoint();
    if (total === 0) return null;

    return {
      myPercent: Math.round((this.myTotal() / total) * 100),
      partnerPercent: Math.round((this.partnerTotal() / total) * 100),
      myTotal: this.myTotal(),
      partnerTotal: this.partnerTotal(),
    };
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

  // Para PDFs: devuelve símbolo ASCII en lugar de emoji
  getSymbol(cat: string) {
    return this.categorySymbols[cat] || '[?]';
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

      // Verificar si esta aportación completará el concepto
      const stats = this.expenseService.getInstallmentStats(this.selectedInstallmentId()!);
      const willComplete = stats && this.expenseForm.amount === stats.remaining;

      if (willComplete) {
        // Guardamos el nombre del concepto para la celebración
        const conceptName = stats!.conceptName;

        // Preparar el gasto y guardarlo
        const expenseToSave: Expense = {
          ...this.expenseForm,
          installment_concept_id: this.selectedInstallmentId(),
        };

        const success = await this.expenseService.addExpense(expenseToSave);

        if (success) {
          this.cancelEdit();
          // Mostrar celebración
          this.triggerCelebration(conceptName);
        }
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

  // Celebración al completar concepto
  triggerCelebration(conceptName: string) {
    // Mostrar notificación
    this.showCelebration.set(true);

    // Crear confetti
    this.createConfetti();

    // Ocultar notificación después de 3 segundos
    setTimeout(() => {
      this.showCelebration.set(false);
    }, 3000);

    // Scroll suave a la sección de conceptos
    setTimeout(() => {
      document.querySelector('.installment-concepts-section')?.scrollIntoView({
        behavior: 'smooth',
        block: 'nearest',
      });
    }, 500);
  }

  createConfetti() {
    const colors = ['#10b981', '#3b82f6', '#f59e0b', '#ef4444', '#8b5cf6', '#ec4899'];
    const confettiCount = 50;

    for (let i = 0; i < confettiCount; i++) {
      setTimeout(() => {
        const confetti = document.createElement('div');
        confetti.className = 'confetti';
        confetti.style.left = Math.random() * 100 + 'vw';
        confetti.style.backgroundColor = colors[Math.floor(Math.random() * colors.length)];
        confetti.style.animationDelay = Math.random() * 0.5 + 's';
        confetti.style.animationDuration = Math.random() * 2 + 2 + 's';

        document.body.appendChild(confetti);

        // Eliminar después de la animación
        setTimeout(() => confetti.remove(), 5000);
      }, i * 30);
    }
  }

  // Helper para sanitizar texto (prevenir XSS)
  sanitizeText(text: string): string {
    return text.replace(/[<>]/g, '');
  }

  // Función para generar PDF tipo Estado de Cuenta bancario
  downloadPDFReport() {
    if (this.filteredExpenses().length === 0) {
      alert('No hay gastos para exportar en este mes');
      return;
    }

    const doc = new jsPDF();
    const pageWidth = doc.internal.pageSize.width;
    const pageHeight = doc.internal.pageSize.height;

    // --- ENCABEZADO ---
    doc.setFillColor(0, 0, 0);
    doc.rect(0, 0, pageWidth, 35, 'F');

    doc.setTextColor(255, 255, 255);
    doc.setFontSize(24);
    doc.setFont('helvetica', 'bold');
    doc.text('GastosDuo', 14, 15);

    doc.setFontSize(10);
    doc.setFont('helvetica', 'normal');
    doc.text('Estado de Cuenta', 14, 23);

    // Fecha de generación
    const today = new Date().toLocaleDateString('es-ES', {
      year: 'numeric',
      month: 'long',
      day: 'numeric',
    });
    doc.setTextColor(200, 200, 200);
    doc.setFontSize(8);
    doc.text(`Generado: ${today}`, pageWidth - 14, 12, { align: 'right' });

    // --- INFORMACIÓN DEL PERÍODO ---
    doc.setTextColor(0, 0, 0);
    doc.setFontSize(12);
    doc.setFont('helvetica', 'bold');
    //this.selectedMonth() es un string en el formato 'YYYY-MM'
    //-01T12:00:00 es para que la fecha sea valida
    const monthYear = new Date(this.selectedMonth() + '-01T12:00:00').toLocaleDateString('es-ES', {
      month: 'long',
      year: 'numeric',
    });
    doc.text(`Periodo: ${monthYear.toUpperCase()}`, 14, 45);

    // --- RESUMEN EJECUTIVO ---
    let yPos = 55;
    doc.setFillColor(248, 250, 252);
    doc.rect(14, yPos, pageWidth - 28, 35, 'F');

    doc.setFontSize(10);
    doc.setFont('helvetica', 'bold');
    doc.text('RESUMEN EJECUTIVO', 20, yPos + 8);

    doc.setFont('helvetica', 'normal');
    doc.setFontSize(9);
    const user = this.expenseService.user();
    const userName = user.email.split('@')[0];

    doc.text(`Total de Movimientos: ${this.filteredExpenses().length}`, 20, yPos + 16);
    doc.text(`${userName}: $${this.myTotal().toLocaleString('es-MX')}`, 20, yPos + 23);
    doc.text(`Pareja: $${this.partnerTotal().toLocaleString('es-MX')}`, 20, yPos + 30);

    doc.setFont('helvetica', 'bold');
    doc.setFontSize(11);
    doc.text(`TOTAL: $${this.totalJoint().toLocaleString('es-MX')}`, pageWidth - 20, yPos + 23, {
      align: 'right',
    });

    // --- DESGLOSE POR CATEGORÍAS ---
    yPos += 45;
    doc.setFontSize(10);
    doc.setFont('helvetica', 'bold');
    doc.text('DESGLOSE POR CATEGORÍAS', 14, yPos);

    yPos += 5;
    const categoryData = this.categoryStats().map((cat) => [
      cat.name,
      `$${cat.total.toLocaleString('es-MX')}`,
      `${cat.percent.toFixed(1)}%`,
    ]);

    autoTable(doc, {
      startY: yPos,
      head: [['Categoría', 'Monto', '% del Total']],
      body: categoryData,
      theme: 'striped',
      headStyles: { fillColor: [0, 0, 0], fontSize: 9 },
      styles: { fontSize: 8, cellPadding: 3 },
      columnStyles: {
        1: { halign: 'right' },
        2: { halign: 'right' },
      },
    });

    // --- TABLA DE MOVIMIENTOS ---
    yPos = (doc as any).lastAutoTable.finalY + 10;
    doc.setFontSize(10);
    doc.setFont('helvetica', 'bold');
    doc.text('DETALLE DE MOVIMIENTOS', 14, yPos);

    yPos += 5;
    const movementsData = this.filteredExpenses()
      .sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime())
      .map((e) => [
        new Date(e.date).toLocaleDateString('es-ES', { day: '2-digit', month: '2-digit' }),
        e.name.length > 30 ? e.name.substring(0, 30) + '...' : e.name,
        e.category,
        `$${e.amount.toLocaleString('es-MX')}`,
        e.user_id === this.expenseService.user().id ? userName : 'Pareja',
        e.installment_concept_id ? 'Sí' : '',
      ]);

    autoTable(doc, {
      startY: yPos,
      head: [['Fecha', 'Concepto', 'Categoría', 'Monto', 'Quién', 'A Plazo']],
      body: movementsData,
      theme: 'grid',
      headStyles: { fillColor: [0, 0, 0], fontSize: 8 },
      styles: { fontSize: 7, cellPadding: 2 },
      columnStyles: {
        0: { cellWidth: 18 },
        2: { cellWidth: 22 },
        3: { halign: 'right', cellWidth: 25 },
        4: { cellWidth: 20 },
        5: { cellWidth: 15, halign: 'center' },
      },
    });

    // --- CONCEPTOS A PLAZOS (si existen) ---
    const installments = this.installmentConcepts();
    if (installments.length > 0) {
      yPos = (doc as any).lastAutoTable.finalY + 10;

      // Verificar si necesitamos una nueva página
      if (yPos > pageHeight - 60) {
        doc.addPage();
        yPos = 20;
      }

      doc.setFontSize(10);
      doc.setFont('helvetica', 'bold');
      doc.text('GASTOS A PLAZOS', 14, yPos);

      yPos += 5;
      const installmentData = installments.map((inst) => [
        inst.conceptName,
        `$${inst.totalAmount.toLocaleString('es-MX')}`,
        `$${inst.contributed.toLocaleString('es-MX')}`,
        `$${inst.remaining.toLocaleString('es-MX')}`,
        `${inst.percentage.toFixed(0)}%`,
        inst.remaining === 0 ? '✅' : '⏳',
      ]);

      autoTable(doc, {
        startY: yPos,
        head: [['Concepto', 'Total', 'Aportado', 'Restante', 'Progreso', 'Estado']],
        body: installmentData,
        theme: 'striped',
        headStyles: { fillColor: [0, 0, 0], fontSize: 8 },
        styles: { fontSize: 7, cellPadding: 3 },
        columnStyles: {
          1: { halign: 'right' },
          2: { halign: 'right' },
          3: { halign: 'right' },
          4: { halign: 'right' },
          5: { halign: 'center', cellWidth: 18 },
        },
      });
    }

    // --- BALANCE ---
    yPos = (doc as any).lastAutoTable.finalY + 10;

    // Verificar si necesitamos una nueva página
    if (yPos > pageHeight - 40) {
      doc.addPage();
      yPos = 20;
    }

    doc.setFillColor(240, 240, 240);
    doc.rect(14, yPos, pageWidth - 28, 25, 'F');

    doc.setFontSize(10);
    doc.setFont('helvetica', 'bold');
    doc.text('BALANCE', 20, yPos + 8);

    const balance = this.balance();
    const balanceText =
      balance > 0
        ? `${userName} ha gastado más. Pareja debe: $${Math.abs(balance).toLocaleString('es-MX')}`
        : balance < 0
        ? `Pareja ha gastado más. ${userName} debe: $${Math.abs(balance).toLocaleString('es-MX')}`
        : 'Ambos han gastado lo mismo. ¡Perfecto equilibrio!';

    doc.setFont('helvetica', 'normal');
    doc.setFontSize(9);
    doc.text(balanceText, 20, yPos + 17);

    // --- FOOTER ---
    doc.setFontSize(7);
    doc.setTextColor(150, 150, 150);
    doc.text(
      'Este documento es un resumen de gastos generado automáticamente por GastosDuo',
      pageWidth / 2,
      pageHeight - 10,
      { align: 'center' }
    );

    // Descargar el PDF
    doc.save(`Estado_de_Cuenta_${this.selectedMonth()}.pdf`);
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
