import type { Expense, Income } from '../types';
import { isCancelled, isOpen, isSettled } from './financialStatus';

export interface ReportFilters {
  start: string; end: string;
  status: 'all' | 'open' | 'settled' | 'cancelled';
  kind: 'all' | 'income' | 'expense';
  accountId: string; costCenterId: string; search: string;
}

export function reportRows(incomes: Income[], expenses: Expense[], filters: ReportFilters,
  names: (item: Income | Expense) => string = () => '') {
  return [...incomes.map(item => ({ item, kind: 'income' as const })),
    ...expenses.map(item => ({ item, kind: 'expense' as const }))]
    .filter(({ item, kind }) => {
      if (filters.start && item.date < filters.start || filters.end && item.date > filters.end) return false;
      if (filters.kind !== 'all' && filters.kind !== kind) return false;
      if (filters.status === 'all' && isCancelled(item.status)) return false;
      if (filters.status === 'open' && !isOpen(item.status)) return false;
      if (filters.status === 'settled' && !isSettled(item.status)) return false;
      if (filters.status === 'cancelled' && !isCancelled(item.status)) return false;
      if (filters.accountId !== 'all' && item.accountId !== filters.accountId) return false;
      if (filters.costCenterId !== 'all' && item.costCenterId !== filters.costCenterId &&
        !(kind === 'expense' && (item as Expense).splits?.some(s => s.costCenterId === filters.costCenterId))) return false;
      return `${item.description} ${item.notes || ''} ${names(item)}`.toLocaleLowerCase('pt-BR')
        .includes(filters.search.trim().toLocaleLowerCase('pt-BR'));
    }).sort((a, b) => a.item.date.localeCompare(b.item.date) || a.item.id.localeCompare(b.item.id));
}

export function csvCell(value: unknown): string {
  let text = String(value ?? '');
  if (/^[\s]*[=+@-]/.test(text)) text = `'${text}`;
  return `"${text.replace(/"/g, '""')}"`;
}

export function monthRange(month: string) {
  const [year, number] = month.split('-').map(Number);
  return { start: `${month}-01`, end: `${month}-${new Date(year, number, 0).getDate()}` };
}
