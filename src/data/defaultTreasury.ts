import { TreasuryAccount, Income, AccountTransfer } from '../types';

export const DEFAULT_ACCOUNTS: TreasuryAccount[] = [
  {
    id: 'acc-nubank',
    name: 'Nubank (Conta Principal)',
    type: 'checking',
    initialBalance: 3250.0,
    color: '#8b5cf6',
    bankName: 'Nubank',
    accountNumber: 'Ag 0001 • C/C 48291-0',
  },
  {
    id: 'acc-itau',
    name: 'Banco Itaú',
    type: 'checking',
    initialBalance: 1840.5,
    color: '#ea580c',
    bankName: 'Itaú Unibanco',
    accountNumber: 'Ag 1492 • C/C 03215-4',
  },
  {
    id: 'acc-caixa',
    name: 'Caixa Físico / Carteira',
    type: 'cash',
    initialBalance: 380.0,
    color: '#10b981',
    bankName: 'Dinheiro em Espécie',
  },
  {
    id: 'acc-reserva',
    name: 'Reserva de Emergência',
    type: 'savings',
    initialBalance: 8500.0,
    color: '#0284c7',
    bankName: 'Tesouro Selic / CDB',
    accountNumber: 'Conta Investimento',
  },
];

export const INCOME_CATEGORIES = [
  'Salário',
  'Pró-Labore',
  'Freelance & Serviços',
  'Vendas',
  'Rendimentos & Dividendos',
  'Reembolso',
  'Doações & Presentes',
  'Outras Entradas',
];

export function getInitialIncomes(): Income[] {
  const now = new Date();
  const currentYear = now.getFullYear();
  const currentMonth = now.getMonth();

  const makeDate = (year: number, month: number, day: number) => {
    const y = year;
    const m = String(month + 1).padStart(2, '0');
    const d = String(Math.min(day, 28)).padStart(2, '0');
    return `${y}-${m}-${d}`;
  };

  const prevMonthDate = new Date(currentYear, currentMonth - 1, 1);
  const prevYear = prevMonthDate.getFullYear();
  const prevMonth = prevMonthDate.getMonth();

  return [
    // Current Month Incomes
    {
      id: 'inc-curr-1',
      description: 'Salário Mensal',
      amount: 5400.0,
      date: makeDate(currentYear, currentMonth, 5),
      accountId: 'acc-nubank',
      category: 'Salário',
      notes: 'Depósito em conta corrente CLT',
      createdAt: Date.now() - 1000 * 60 * 60 * 24 * 4,
    },
    {
      id: 'inc-curr-2',
      description: 'Consultoria Web / Freelance',
      amount: 1450.0,
      date: makeDate(currentYear, currentMonth, 3),
      accountId: 'acc-itau',
      category: 'Freelance & Serviços',
      notes: 'Pagamento recebido via PIX',
      createdAt: Date.now() - 1000 * 60 * 60 * 24 * 6,
    },
    {
      id: 'inc-curr-3',
      description: 'Rendimento de Aplicação CDB',
      amount: 78.35,
      date: makeDate(currentYear, currentMonth, 1),
      accountId: 'acc-reserva',
      category: 'Rendimentos & Dividendos',
      createdAt: Date.now() - 1000 * 60 * 60 * 24 * 8,
    },

    // Previous Month Incomes
    {
      id: 'inc-prev-1',
      description: 'Salário Mensal',
      amount: 5400.0,
      date: makeDate(prevYear, prevMonth, 5),
      accountId: 'acc-nubank',
      category: 'Salário',
      createdAt: Date.now() - 1000 * 60 * 60 * 24 * 35,
    },
    {
      id: 'inc-prev-2',
      description: 'Venda de Equipamento Usado',
      amount: 650.0,
      date: makeDate(prevYear, prevMonth, 15),
      accountId: 'acc-nubank',
      category: 'Vendas',
      createdAt: Date.now() - 1000 * 60 * 60 * 24 * 25,
    },
    {
      id: 'inc-prev-3',
      description: 'Rendimento Reserva',
      amount: 74.2,
      date: makeDate(prevYear, prevMonth, 1),
      accountId: 'acc-reserva',
      category: 'Rendimentos & Dividendos',
      createdAt: Date.now() - 1000 * 60 * 60 * 24 * 39,
    },
  ];
}

export function getInitialTransfers(): AccountTransfer[] {
  const now = new Date();
  const currentYear = now.getFullYear();
  const currentMonth = now.getMonth();

  const makeDate = (year: number, month: number, day: number) => {
    const y = year;
    const m = String(month + 1).padStart(2, '0');
    const d = String(Math.min(day, 28)).padStart(2, '0');
    return `${y}-${m}-${d}`;
  };

  return [
    {
      id: 'trans-curr-1',
      fromAccountId: 'acc-nubank',
      toAccountId: 'acc-caixa',
      amount: 250.0,
      date: makeDate(currentYear, currentMonth, 4),
      description: 'Saque no banco 24h para caixa físico',
      createdAt: Date.now() - 1000 * 60 * 60 * 24 * 5,
    },
    {
      id: 'trans-curr-2',
      fromAccountId: 'acc-nubank',
      toAccountId: 'acc-reserva',
      amount: 600.0,
      date: makeDate(currentYear, currentMonth, 6),
      description: 'Aporte mensal na reserva de emergência',
      createdAt: Date.now() - 1000 * 60 * 60 * 24 * 3,
    },
  ];
}
