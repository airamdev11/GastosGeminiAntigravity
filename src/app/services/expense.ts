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

  // --- AUTENTICACIÓN (EMAIL/PASSWORD) ---
  async signUp(email: string, password: string) {
    // Crea usuario y loguea automáticamente
    const { data, error } = await this.supabase.auth.signUp({ email, password });
    return { data, error };
  }

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
}
