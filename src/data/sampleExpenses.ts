import { Expense } from '../types';

export function getInitialExpenses(): Expense[] {
  const now = new Date();
  const currentYear = now.getFullYear();
  const currentMonth = now.getMonth(); // 0-indexed

  // Helper to format date YYYY-MM-DD
  const makeDate = (year: number, month: number, day: number) => {
    const y = year;
    const m = String(month + 1).padStart(2, '0');
    const d = String(Math.min(day, 28)).padStart(2, '0');
    return `${y}-${m}-${d}`;
  };

  const prevMonthDate = new Date(currentYear, currentMonth - 1, 1);
  const prevYear = prevMonthDate.getFullYear();
  const prevMonth = prevMonthDate.getMonth();

  const twoMonthsAgoDate = new Date(currentYear, currentMonth - 2, 1);
  const twoMonthsAgoYear = twoMonthsAgoDate.getFullYear();
  const twoMonthsAgoMonth = twoMonthsAgoDate.getMonth();

  return [
    // Current Month expenses
    {
      id: 'exp-curr-1',
      description: 'Supermercado Mensal',
      amount: 485.60,
      date: makeDate(currentYear, currentMonth, 3),
      categoryId: 'cat-alimentacao',
      paymentMethod: 'credit_card',
      notes: 'Compras de mantimentos para o mês',
      createdAt: Date.now() - 1000 * 60 * 60 * 24 * 6,
    },
    {
      id: 'exp-curr-2',
      description: 'Aluguel e Condomínio',
      amount: 1450.00,
      date: makeDate(currentYear, currentMonth, 5),
      categoryId: 'cat-moradia',
      paymentMethod: 'pix',
      notes: 'Boleto pago via PIX',
      createdAt: Date.now() - 1000 * 60 * 60 * 24 * 4,
    },
    {
      id: 'exp-curr-3',
      description: 'Conta de Energia Elétrica',
      amount: 198.40,
      date: makeDate(currentYear, currentMonth, 7),
      categoryId: 'cat-moradia',
      paymentMethod: 'pix',
      notes: 'Vencimento dia 10',
      createdAt: Date.now() - 1000 * 60 * 60 * 24 * 2,
    },
    {
      id: 'exp-curr-4',
      description: 'Abastecimento Carro',
      amount: 220.00,
      date: makeDate(currentYear, currentMonth, 8),
      categoryId: 'cat-transporte',
      paymentMethod: 'debit_card',
      notes: 'Gasolina aditivada',
      createdAt: Date.now() - 1000 * 60 * 60 * 24 * 1,
    },
    {
      id: 'exp-curr-5',
      description: 'Farmácia - Vitaminas e Remédios',
      amount: 115.80,
      date: makeDate(currentYear, currentMonth, 4),
      categoryId: 'cat-saude',
      paymentMethod: 'credit_card',
      createdAt: Date.now() - 1000 * 60 * 60 * 24 * 5,
    },
    {
      id: 'exp-curr-6',
      description: 'Jantar Restaurante Italiano',
      amount: 165.00,
      date: makeDate(currentYear, currentMonth, 6),
      categoryId: 'cat-lazer',
      paymentMethod: 'credit_card',
      notes: 'Comemoração final de semana',
      createdAt: Date.now() - 1000 * 60 * 60 * 24 * 3,
    },
    {
      id: 'exp-curr-7',
      description: 'Netflix e Spotify',
      amount: 79.80,
      date: makeDate(currentYear, currentMonth, 2),
      categoryId: 'cat-servicos',
      paymentMethod: 'credit_card',
      notes: 'Assinaturas recorrentes',
      createdAt: Date.now() - 1000 * 60 * 60 * 24 * 7,
    },
    {
      id: 'exp-curr-8',
      description: 'Padaria & Café da Manhã',
      amount: 42.50,
      date: makeDate(currentYear, currentMonth, 9),
      categoryId: 'cat-alimentacao',
      paymentMethod: 'pix',
      createdAt: Date.now() - 1000 * 60 * 60 * 12,
    },

    // Previous Month Expenses
    {
      id: 'exp-prev-1',
      description: 'Aluguel e Condomínio',
      amount: 1450.00,
      date: makeDate(prevYear, prevMonth, 5),
      categoryId: 'cat-moradia',
      paymentMethod: 'pix',
      createdAt: Date.now() - 1000 * 60 * 60 * 24 * 35,
    },
    {
      id: 'exp-prev-2',
      description: 'Supermercado Mensal',
      amount: 830.40,
      date: makeDate(prevYear, prevMonth, 4),
      categoryId: 'cat-alimentacao',
      paymentMethod: 'credit_card',
      createdAt: Date.now() - 1000 * 60 * 60 * 24 * 36,
    },
    {
      id: 'exp-prev-3',
      description: 'Combustível do Mês',
      amount: 380.00,
      date: makeDate(prevYear, prevMonth, 12),
      categoryId: 'cat-transporte',
      paymentMethod: 'debit_card',
      createdAt: Date.now() - 1000 * 60 * 60 * 24 * 28,
    },
    {
      id: 'exp-prev-4',
      description: 'Cinema & Lanches',
      amount: 140.00,
      date: makeDate(prevYear, prevMonth, 18),
      categoryId: 'cat-lazer',
      paymentMethod: 'credit_card',
      createdAt: Date.now() - 1000 * 60 * 60 * 24 * 22,
    },
    {
      id: 'exp-prev-5',
      description: 'Consulta Médica de Rotina',
      amount: 250.00,
      date: makeDate(prevYear, prevMonth, 22),
      categoryId: 'cat-saude',
      paymentMethod: 'pix',
      createdAt: Date.now() - 1000 * 60 * 60 * 24 * 18,
    },
    {
      id: 'exp-prev-6',
      description: 'Curso Online de Finanças',
      amount: 199.90,
      date: makeDate(prevYear, prevMonth, 10),
      categoryId: 'cat-educacao',
      paymentMethod: 'credit_card',
      createdAt: Date.now() - 1000 * 60 * 60 * 24 * 30,
    },
    {
      id: 'exp-prev-7',
      description: 'Roupas Novas',
      amount: 280.00,
      date: makeDate(prevYear, prevMonth, 25),
      categoryId: 'cat-compras',
      paymentMethod: 'credit_card',
      createdAt: Date.now() - 1000 * 60 * 60 * 24 * 15,
    },
    {
      id: 'exp-prev-8',
      description: 'Conta de Água e Luz',
      amount: 235.10,
      date: makeDate(prevYear, prevMonth, 8),
      categoryId: 'cat-moradia',
      paymentMethod: 'pix',
      createdAt: Date.now() - 1000 * 60 * 60 * 24 * 32,
    },

    // Two Months Ago Expenses
    {
      id: 'exp-two-1',
      description: 'Aluguel e Condomínio',
      amount: 1450.00,
      date: makeDate(twoMonthsAgoYear, twoMonthsAgoMonth, 5),
      categoryId: 'cat-moradia',
      paymentMethod: 'pix',
      createdAt: Date.now() - 1000 * 60 * 60 * 24 * 65,
    },
    {
      id: 'exp-two-2',
      description: 'Supermercado Mensal',
      amount: 790.20,
      date: makeDate(twoMonthsAgoYear, twoMonthsAgoMonth, 6),
      categoryId: 'cat-alimentacao',
      paymentMethod: 'credit_card',
      createdAt: Date.now() - 1000 * 60 * 60 * 24 * 64,
    },
    {
      id: 'exp-two-3',
      description: 'Transporte e Combustível',
      amount: 410.00,
      date: makeDate(twoMonthsAgoYear, twoMonthsAgoMonth, 14),
      categoryId: 'cat-transporte',
      paymentMethod: 'debit_card',
      createdAt: Date.now() - 1000 * 60 * 60 * 24 * 56,
    },
    {
      id: 'exp-two-4',
      description: 'Parque de Diversões & Passeio',
      amount: 230.00,
      date: makeDate(twoMonthsAgoYear, twoMonthsAgoMonth, 20),
      categoryId: 'cat-lazer',
      paymentMethod: 'pix',
      createdAt: Date.now() - 1000 * 60 * 60 * 24 * 50,
    },
    {
      id: 'exp-two-5',
      description: 'Internet Fibra e Celular',
      amount: 189.90,
      date: makeDate(twoMonthsAgoYear, twoMonthsAgoMonth, 10),
      categoryId: 'cat-servicos',
      paymentMethod: 'credit_card',
      createdAt: Date.now() - 1000 * 60 * 60 * 24 * 60,
    },
  ];
}
