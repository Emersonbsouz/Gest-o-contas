import {
  TreasuryAccount,
  Income,
  Expense,
  AccountTransfer,
  Category,
} from '../types';

export interface UnifiedTransaction {
  id: string;
  type: 'income' | 'expense' | 'transfer';
  date: string;
  description: string;
  amount: number;
  accountId: string;
  accountName: string;
  toAccountId?: string;
  toAccountName?: string;
  categoryName: string;
  color?: string;
  icon?: string;
  notes?: string;
  createdAt: number;
}

export function calculateAccountBalances(
  accounts: TreasuryAccount[],
  incomes: Income[],
  expenses: Expense[],
  transfers: AccountTransfer[]
): Record<string, number> {
  const balances: Record<string, number> = {};

  // Initialize with initialBalance
  accounts.forEach((acc) => {
    balances[acc.id] = acc.initialBalance;
  });

  // Add all incomes
  incomes.forEach((inc) => {
    if (balances[inc.accountId] !== undefined) {
      balances[inc.accountId] += inc.amount;
    } else if (accounts.length > 0) {
      balances[accounts[0].id] = (balances[accounts[0].id] || 0) + inc.amount;
    }
  });

  // Subtract all expenses
  expenses.forEach((exp) => {
    const accId = exp.accountId || (accounts[0] ? accounts[0].id : '');
    if (balances[accId] !== undefined) {
      balances[accId] -= exp.amount;
    }
  });

  // Apply transfers (subtract from origin, add to destination)
  transfers.forEach((tr) => {
    if (balances[tr.fromAccountId] !== undefined) {
      balances[tr.fromAccountId] -= tr.amount;
    }
    if (balances[tr.toAccountId] !== undefined) {
      balances[tr.toAccountId] += tr.amount;
    }
  });

  return balances;
}

export function getTreasuryMonthSummary(
  accounts: TreasuryAccount[],
  incomes: Income[],
  expenses: Expense[],
  transfers: AccountTransfer[],
  yearMonth: string
) {
  const monthIncomes = incomes.filter((i) => i.date.startsWith(yearMonth));
  const monthExpenses = expenses.filter((e) => e.date.startsWith(yearMonth));
  const monthTransfers = transfers.filter((t) => t.date.startsWith(yearMonth));

  const monthInflow = monthIncomes.reduce((acc, curr) => acc + curr.amount, 0);
  const monthOutflow = monthExpenses.reduce((acc, curr) => acc + curr.amount, 0);
  const monthNet = monthInflow - monthOutflow;

  const balances = calculateAccountBalances(accounts, incomes, expenses, transfers);
  const totalBalance = Object.values(balances).reduce((acc, curr) => acc + curr, 0);

  return {
    totalBalance,
    monthInflow,
    monthOutflow,
    monthNet,
    incomesCount: monthIncomes.length,
    expensesCount: monthExpenses.length,
    transfersCount: monthTransfers.length,
    balances,
  };
}

export function getUnifiedTransactions(
  incomes: Income[],
  expenses: Expense[],
  transfers: AccountTransfer[],
  accounts: TreasuryAccount[],
  categories: Category[],
  options?: {
    yearMonth?: string;
    accountId?: string;
    type?: 'all' | 'income' | 'expense' | 'transfer';
    searchTerm?: string;
  }
): UnifiedTransaction[] {
  const accountMap = new Map<string, string>(accounts.map((a) => [a.id, a.name]));
  const categoryMap = new Map<string, Category>(categories.map((c) => [c.id, c]));

  const list: UnifiedTransaction[] = [];

  // Incomes
  incomes.forEach((inc) => {
    list.push({
      id: inc.id,
      type: 'income',
      date: inc.date,
      description: inc.description,
      amount: inc.amount,
      accountId: inc.accountId,
      accountName: accountMap.get(inc.accountId) || 'Conta Geral',
      categoryName: inc.category,
      notes: inc.notes,
      createdAt: inc.createdAt,
    });
  });

  // Expenses
  expenses.forEach((exp) => {
    const accId = exp.accountId || (accounts[0] ? accounts[0].id : '');
    const cat = categoryMap.get(exp.categoryId);
    list.push({
      id: exp.id,
      type: 'expense',
      date: exp.date,
      description: exp.description,
      amount: exp.amount,
      accountId: accId,
      accountName: accountMap.get(accId) || 'Conta Geral',
      categoryName: cat?.name || 'Despesa',
      color: cat?.color,
      icon: cat?.icon,
      notes: exp.notes,
      createdAt: exp.createdAt,
    });
  });

  // Transfers
  transfers.forEach((tr) => {
    list.push({
      id: tr.id,
      type: 'transfer',
      date: tr.date,
      description: tr.description || 'Transferência entre contas',
      amount: tr.amount,
      accountId: tr.fromAccountId,
      accountName: accountMap.get(tr.fromAccountId) || 'Origem',
      toAccountId: tr.toAccountId,
      toAccountName: accountMap.get(tr.toAccountId) || 'Destino',
      categoryName: 'Transferência Interna',
      createdAt: tr.createdAt,
    });
  });

  // Apply filters
  return list
    .filter((item) => {
      if (options?.yearMonth && !item.date.startsWith(options.yearMonth)) {
        return false;
      }
      if (options?.type && options.type !== 'all' && item.type !== options.type) {
        return false;
      }
      if (options?.accountId && options.accountId !== 'all') {
        if (item.type === 'transfer') {
          if (item.accountId !== options.accountId && item.toAccountId !== options.accountId) {
            return false;
          }
        } else if (item.accountId !== options.accountId) {
          return false;
        }
      }
      if (options?.searchTerm) {
        const term = options.searchTerm.toLowerCase();
        const matchesDesc = item.description.toLowerCase().includes(term);
        const matchesNotes = item.notes ? item.notes.toLowerCase().includes(term) : false;
        const matchesCat = item.categoryName.toLowerCase().includes(term);
        const matchesAcc = item.accountName.toLowerCase().includes(term);
        if (!matchesDesc && !matchesNotes && !matchesCat && !matchesAcc) {
          return false;
        }
      }
      return true;
    })
    .sort((a, b) => b.date.localeCompare(a.date) || b.createdAt - a.createdAt);
}

export function getTreasuryCashflowHistory(
  incomes: Income[],
  expenses: Expense[],
  currentYearMonth: string,
  monthsBack = 6
) {
  const shortNames = ['Jan', 'Fev', 'Mar', 'Abr', 'Mai', 'Jun', 'Jul', 'Ago', 'Set', 'Out', 'Nov', 'Dez'];
  const [currY, currM] = currentYearMonth.split('-').map(Number);
  const results = [];

  for (let i = monthsBack - 1; i >= 0; i--) {
    const d = new Date(currY, currM - 1 - i, 1);
    const y = d.getFullYear();
    const m = String(d.getMonth() + 1).padStart(2, '0');
    const ym = `${y}-${m}`;

    const monthIncomes = incomes.filter((inc) => inc.date.startsWith(ym));
    const monthExpenses = expenses.filter((exp) => exp.date.startsWith(ym));

    const inflow = monthIncomes.reduce((acc, curr) => acc + curr.amount, 0);
    const outflow = monthExpenses.reduce((acc, curr) => acc + curr.amount, 0);
    const net = inflow - outflow;

    results.push({
      yearMonth: ym,
      label: `${shortNames[d.getMonth()]}/${String(y).slice(2)}`,
      inflow: Number(inflow.toFixed(2)),
      outflow: Number(outflow.toFixed(2)),
      net: Number(net.toFixed(2)),
    });
  }

  return results;
}

export function getAccountDistributionData(
  accounts: TreasuryAccount[],
  balances: Record<string, number>
) {
  return accounts
    .map((acc) => {
      const balance = balances[acc.id] || 0;
      return {
        id: acc.id,
        name: acc.name,
        type: acc.type,
        color: acc.color,
        balance: Math.max(0, balance), // For distribution pie chart, keep positive portion
        rawBalance: balance,
      };
    })
    .filter((a) => a.balance > 0);
}

