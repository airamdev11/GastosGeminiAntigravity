import { Injectable, signal } from '@angular/core';
import { createClient, SupabaseClient } from '@supabase/supabase-js';
import { environment } from '../../environments/environment';

export interface Expense {
  id?: number;
  user_id?: string;
  name: string;
  amount: number;
  category: string;
  date: string;
  // Campos para gastos a plazos
  installment_concept_id?: number | null;
  is_installment_concept?: boolean;
  installment_total_amount?: number | null;
  installment_name?: string | null;
}

export interface InstallmentStats {
  conceptId: number;
  conceptName: string;
  totalAmount: number;
  contributed: number;
  remaining: number;
  percentage: number;
  category: string;
  contributions: Expense[];
}

@Injectable({ providedIn: 'root' })
export class ExpenseService {
  private supabase: SupabaseClient = createClient(environment.supabaseUrl, environment.supabaseKey);

  expenses = signal<Expense[]>([]);
  user = signal<any>(null);

  constructor() {
    this.initAuth();
  }

  async initAuth() {
    const { data } = await this.supabase.auth.getSession();
    this.user.set(data.session?.user || null);
    if (this.user()) this.loadExpenses();

    this.supabase.auth.onAuthStateChange((_event, session) => {
      this.user.set(session?.user || null);
      if (this.user()) this.loadExpenses();
    });
  }

  // --- AUTENTICACIÓN (SOLO LOGIN) ---
  async signIn(email: string, password: string) {
    const { data, error } = await this.supabase.auth.signInWithPassword({ email, password });
    return { data, error };
  }

  async logout() {
    await this.supabase.auth.signOut();
    this.expenses.set([]);
  }

  // --- DATOS ---
  async loadExpenses() {
    try {
      const { data, error } = await this.supabase
        .from('expenses')
        .select('*')
        .order('date', { ascending: false });

      if (error) throw error;
      if (data) this.expenses.set(data);
    } catch (e) {
      console.error('Error al cargar gastos:', e);
    }
  }

  async addExpense(expense: Expense): Promise<boolean> {
    try {
      const { error } = await this.supabase
        .from('expenses')
        .insert({ ...expense, user_id: this.user().id });

      if (error) {
        console.error('Error al guardar gasto:', error);
        alert('Error al guardar. Intenta de nuevo.');
        return false;
      }

      await this.loadExpenses();
      return true;
    } catch (e) {
      console.error('Error de red:', e);
      alert('Error de conexión. Verifica tu internet.');
      return false;
    }
  }

  // Editar Gasto
  async updateExpense(id: number, expense: Partial<Expense>): Promise<boolean> {
    try {
      const { error } = await this.supabase
        .from('expenses')
        .update(expense)
        .eq('id', id)
        .eq('user_id', this.user().id); // Doble check de seguridad

      if (error) {
        console.error('Error al actualizar gasto:', error);
        alert('Error al actualizar. Intenta de nuevo.');
        return false;
      }

      await this.loadExpenses();
      return true;
    } catch (e) {
      console.error('Error de red:', e);
      alert('Error de conexión. Verifica tu internet.');
      return false;
    }
  }

  async deleteExpense(id: number): Promise<boolean> {
    try {
      const { error } = await this.supabase
        .from('expenses')
        .delete()
        .eq('id', id)
        .eq('user_id', this.user().id);

      if (error) {
        console.error('Error al eliminar gasto:', error);
        alert('Error al eliminar. Intenta de nuevo.');
        return false;
      }

      await this.loadExpenses();
      return true;
    } catch (e) {
      console.error('Error de red:', e);
      alert('Error de conexión. Verifica tu internet.');
      return false;
    }
  }

  // --- GASTOS A PLAZOS ---

  /**
   * Crea un concepto de gasto a plazos
   */
  async createInstallmentConcept(
    name: string,
    totalAmount: number,
    category: string,
    date: string
  ): Promise<boolean> {
    try {
      const conceptExpense: Partial<Expense> = {
        name: `[CONCEPTO] ${name}`,
        amount: 0, // Los conceptos no suman al total (las aportaciones sí)
        category,
        date,
        is_installment_concept: true,
        installment_name: name,
        installment_total_amount: totalAmount,
        installment_concept_id: null,
      };

      const { error } = await this.supabase
        .from('expenses')
        .insert({ ...conceptExpense, user_id: this.user().id });

      if (error) {
        console.error('Error al crear concepto:', error);
        alert('Error al crear concepto. Intenta de nuevo.');
        return false;
      }

      await this.loadExpenses();
      return true;
    } catch (e) {
      console.error('Error de red:', e);
      alert('Error de conexión. Verifica tu internet.');
      return false;
    }
  }

  /**
   * Obtiene todos los conceptos de gastos a plazos activos
   */
  getInstallmentConcepts(): Expense[] {
    return this.expenses().filter((e) => e.is_installment_concept === true);
  }

  /**
   * Obtiene las aportaciones vinculadas a un concepto específico
   */
  getContributions(conceptId: number): Expense[] {
    return this.expenses().filter((e) => e.installment_concept_id === conceptId);
  }

  /**
   * Calcula las estadísticas de un concepto a plazos
   */
  getInstallmentStats(conceptId: number): InstallmentStats | null {
    const concept = this.expenses().find((e) => e.id === conceptId && e.is_installment_concept);
    if (!concept) return null;

    const contributions = this.getContributions(conceptId);
    const contributed = contributions.reduce((sum, c) => sum + c.amount, 0);
    const totalAmount = concept.installment_total_amount || 0;
    const remaining = totalAmount - contributed;
    const percentage = totalAmount > 0 ? (contributed / totalAmount) * 100 : 0;

    return {
      conceptId,
      conceptName: concept.installment_name || concept.name,
      totalAmount,
      contributed,
      remaining: remaining > 0 ? remaining : 0,
      percentage,
      category: concept.category,
      contributions,
    };
  }

  /**
   * Obtiene estadísticas de todos los conceptos activos
   */
  getAllInstallmentStats(): InstallmentStats[] {
    return this.getInstallmentConcepts()
      .map((concept) => this.getInstallmentStats(concept.id!))
      .filter((stats): stats is InstallmentStats => stats !== null);
  }

  /**
   * Valida si una aportación es válida para un concepto
   */
  validateContribution(conceptId: number, amount: number): { valid: boolean; error?: string } {
    const stats = this.getInstallmentStats(conceptId);
    if (!stats) {
      return { valid: false, error: 'Concepto no encontrado' };
    }

    if (amount <= 0) {
      return { valid: false, error: 'El monto debe ser mayor a 0' };
    }

    if (amount > stats.remaining) {
      return {
        valid: false,
        error: `El monto excede lo restante ($${stats.remaining}). Ajusta el monto.`,
      };
    }

    return { valid: true };
  }
}
