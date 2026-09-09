import { Expense, Category } from '../types';

export const MONTH_NAMES = [
  'Janeiro',
  'Fevereiro',
  'Março',
  'Abril',
  'Maio',
  'Junho',
  'Julho',
  'Agosto',
  'Setembro',
  'Outubro',
  'Novembro',
  'Dezembro',
];

export const PAYMENT_METHOD_LABELS: Record<string, string> = {
  pix: 'PIX',
  credit_card: 'Cartão de Crédito',
  debit_card: 'Cartão de Débito',
  cash: 'Dinheiro',
  transfer: 'Transferência',
  boleto: 'Boleto Bancário',
  other: 'Outro',
};

export function formatCurrency(value: number): string {
  return new Intl.NumberFormat('pt-BR', {
    style: 'currency',
    currency: 'BRL',
  }).format(value);
}

export function formatDateBR(dateString: string): string {
  if (!dateString) return '';
  const [year, month, day] = dateString.split('-');
  if (!year || !month || !day) return dateString;
  return `${day}/${month}/${year}`;
}

export function formatMonthYearLabel(yearMonth: string): string {
  if (!yearMonth) return '';
  const [year, month] = yearMonth.split('-');
  const monthIndex = parseInt(month, 10) - 1;
  return `${MONTH_NAMES[monthIndex] || month} de ${year}`;
}

export function formatShortMonth(yearMonth: string): string {
  if (!yearMonth) return '';
  const [year, month] = yearMonth.split('-');
  const monthIndex = parseInt(month, 10) - 1;
  const shortNames = ['Jan', 'Fev', 'Mar', 'Abr', 'Mai', 'Jun', 'Jul', 'Ago', 'Set', 'Out', 'Nov', 'Dez'];
  return `${shortNames[monthIndex] || month}/${year.slice(2)}`;
}

export function getCurrentYearMonth(): string {
  const now = new Date();
  const year = now.getFullYear();
  const month = String(now.getMonth() + 1).padStart(2, '0');
  return `${year}-${month}`;
}

export function getRelativeMonth(yearMonth: string, offsetMonths: number): string {
  const [y, m] = yearMonth.split('-').map(Number);
  const d = new Date(y, m - 1 + offsetMonths, 1);
  const year = d.getFullYear();
  const month = String(d.getMonth() + 1).padStart(2, '0');
  return `${year}-${month}`;
}

// Calculate summary for a given month
export function getMonthSummary(
  expenses: Expense[],
  categories: Category[],
  yearMonth: string,
  budgetLimit?: number
) {
  const monthExpenses = expenses.filter((e) => e.date.startsWith(yearMonth));
  const total = monthExpenses.reduce((acc, curr) => acc + curr.amount, 0);
  const count = monthExpenses.length;

  // Calculate daily average (based on days in month or current day if this month)
  const [y, m] = yearMonth.split('-').map(Number);
  const daysInMonth = new Date(y, m, 0).getDate();
  const now = new Date();
  const isCurrentMonth = now.getFullYear() === y && now.getMonth() + 1 === m;
  const daysPassed = isCurrentMonth ? Math.max(1, now.getDate()) : daysInMonth;
  const dailyAverage = total / daysPassed;

  // Group by category
  const categoryTotals: Record<string, number> = {};
  monthExpenses.forEach((e) => {
    categoryTotals[e.categoryId] = (categoryTotals[e.categoryId] || 0) + e.amount;
  });

  let topCategory: { category: Category; amount: number; percentage: number } | undefined;
  let maxAmount = 0;

  Object.entries(categoryTotals).forEach(([catId, amount]) => {
    if (amount > maxAmount) {
      maxAmount = amount;
      const cat = categories.find((c) => c.id === catId);
      if (cat) {
        topCategory = {
          category: cat,
          amount,
          percentage: total > 0 ? (amount / total) * 100 : 0,
        };
      }
    }
  });

  // Calculate previous month total to compute delta percentage
  const prevYearMonth = getRelativeMonth(yearMonth, -1);
  const prevMonthExpenses = expenses.filter((e) => e.date.startsWith(prevYearMonth));
  const prevTotal = prevMonthExpenses.reduce((acc, curr) => acc + curr.amount, 0);

  let deltaPercent: number | null = null;
  if (prevTotal > 0) {
    deltaPercent = ((total - prevTotal) / prevTotal) * 100;
  }

  return {
    yearMonth,
    total,
    count,
    dailyAverage,
    topCategory,
    prevTotal,
    deltaPercent,
    budgetLimit: budgetLimit || 0,
    budgetPercent: budgetLimit && budgetLimit > 0 ? (total / budgetLimit) * 100 : null,
  };
}

// Category Breakdown for Charts
export function getCategoryChartData(expenses: Expense[], categories: Category[], yearMonth: string) {
  const monthExpenses = expenses.filter((e) => e.date.startsWith(yearMonth));
  const total = monthExpenses.reduce((acc, curr) => acc + curr.amount, 0);

  const categoryMap = new Map<string, { category: Category; amount: number; count: number }>();

  // Map existing categories
  categories.forEach((cat) => {
    categoryMap.set(cat.id, { category: cat, amount: 0, count: 0 });
  });

  monthExpenses.forEach((e) => {
    const existing = categoryMap.get(e.categoryId);
    if (existing) {
      existing.amount += e.amount;
      existing.count += 1;
    } else {
      const fallbackCat: Category = {
        id: e.categoryId,
        name: 'Outros',
        color: '#64748b',
        icon: 'MoreHorizontal',
      };
      categoryMap.set(e.categoryId, { category: fallbackCat, amount: e.amount, count: 1 });
    }
  });

  return Array.from(categoryMap.values())
    .filter((item) => item.amount > 0)
    .map((item) => ({
      id: item.category.id,
      name: item.category.name,
      amount: item.amount,
      percentage: total > 0 ? Number(((item.amount / total) * 100).toFixed(1)) : 0,
      color: item.category.color,
      icon: item.category.icon,
      count: item.count,
      budgetLimit: item.category.budgetLimit,
    }))
    .sort((a, b) => b.amount - a.amount);
}

// Daily Evolution in the month
export function getDailyChartData(expenses: Expense[], yearMonth: string) {
  const [y, m] = yearMonth.split('-').map(Number);
  const daysInMonth = new Date(y, m, 0).getDate();

  const dayMap: Record<number, number> = {};
  for (let i = 1; i <= daysInMonth; i++) {
    dayMap[i] = 0;
  }

  expenses
    .filter((e) => e.date.startsWith(yearMonth))
    .forEach((e) => {
      const day = parseInt(e.date.split('-')[2], 10);
      if (dayMap[day] !== undefined) {
        dayMap[day] += e.amount;
      }
    });

  let cumulative = 0;
  return Object.entries(dayMap).map(([dayStr, amount]) => {
    const day = Number(dayStr);
    cumulative += amount;
    return {
      day: `Dia ${day}`,
      shortDay: `${day}`,
      amount: Number(amount.toFixed(2)),
      cumulative: Number(cumulative.toFixed(2)),
    };
  });
}

// Historical comparison of last 6 months
export function getHistoricalMonthlyData(expenses: Expense[], currentYearMonth: string, monthsBack = 6) {
  const results = [];
  for (let i = monthsBack - 1; i >= 0; i--) {
    const ym = getRelativeMonth(currentYearMonth, -i);
    const mExpenses = expenses.filter((e) => e.date.startsWith(ym));
    const total = mExpenses.reduce((acc, curr) => acc + curr.amount, 0);
    const count = mExpenses.length;
    results.push({
      yearMonth: ym,
      label: formatShortMonth(ym),
      total: Number(total.toFixed(2)),
      count,
    });
  }
  return results;
}
