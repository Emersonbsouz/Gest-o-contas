import type { Expense, RecurringBill } from '../types';
import { isOpen } from './financialStatus';

// Values reflect registered unpaid expenses, including future installments.
// A subscription template is a forecast, never an additional debt.
export function getCardSummary(cardId: string, expenses: Expense[], recurring: RecurringBill[]) {
  const openExpenses = expenses.filter(e => e.cardId === cardId && e.paymentMethod === 'credit_card' && isOpen(e.status) && e.status !== 'draft');
  const cents = (value: number) => Math.round(value * 100);
  return {
    openExpenses,
    outstanding: openExpenses.reduce((sum, e) => sum + cents(e.amount), 0) / 100,
    monthlySubscriptions: recurring.filter(b => b.kind === 'subscription' && b.type === 'expense' && b.active && b.cardId === cardId).reduce((sum,b) => sum + cents(b.amount),0) / 100,
  };
}

export function recurringDate(month: string, dueDay: number) {
  const [year, m] = month.split('-').map(Number);
  const day = Math.min(Math.max(dueDay, 1), new Date(year, m, 0).getDate());
  return month + '-' + String(day).padStart(2, '0');
}
