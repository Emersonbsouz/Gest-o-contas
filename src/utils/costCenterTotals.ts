import type { Expense, Income } from '../types';

export function costCenterTotals(centerId: string, incomes: Income[], expenses: Expense[]) {
  const valid = (status?: string) => !['cancelled', 'CANCELADO', 'rejected'].includes(status || '');
  const revenue = incomes.filter(i => i.costCenterId === centerId && valid(i.status))
    .reduce((total, i) => total + i.amount, 0);
  const expense = expenses.filter(e => valid(e.status)).reduce((total, e) => {
    if (e.splits?.length) return total + e.splits.filter(s => s.costCenterId === centerId)
      .reduce((allocated, s) => allocated + s.amount, 0);
    return total + (e.costCenterId === centerId ? e.amount : 0);
  }, 0);
  return { revenue, expense, balance: revenue - expense };
}
