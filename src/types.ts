export type PaymentMethod = 'pix' | 'credit_card' | 'debit_card' | 'cash' | 'transfer' | 'boleto' | 'other';

export type AccountType = 'checking' | 'cash' | 'savings' | 'investment';

export type PaymentStatus = 'paid' | 'pending';

export type ContactType = 'supplier' | 'customer' | 'service_provider' | 'other';

export type CardBrand = 'mastercard' | 'visa' | 'elo' | 'amex' | 'hipercard' | 'other';

export interface TreasuryAccount {
  id: string;
  name: string;
  type: AccountType;
  initialBalance: number;
  color: string;
  bankName?: string;
  accountNumber?: string;
}

export interface CreditCard {
  id: string;
  name: string;
  brand: CardBrand;
  limit: number;
  closingDay: number; // 1-31
  dueDay: number; // 1-31
  color: string;
  linkedAccountId?: string;
  notes?: string;
}

export interface ContactPerson {
  id: string;
  name: string;
  type: ContactType;
  phone?: string;
  email?: string;
  document?: string; // CPF or CNPJ
  pixKey?: string;
  notes?: string;
  createdAt?: number;
}

export interface RecurringBill {
  id: string;
  description: string;
  type: 'expense' | 'income';
  amount: number;
  dueDay: number; // 1-31
  categoryId: string;
  accountId?: string;
  cardId?: string;
  contactId?: string;
  active: boolean;
  notes?: string;
}

export interface FinancialGoal {
  id: string;
  title: string;
  targetAmount: number;
  currentAmount: number;
  deadline?: string; // YYYY-MM-DD
  color: string;
  category?: string;
  notes?: string;
}

export interface IncomeCategory {
  id: string;
  name: string;
  color: string;
  icon: string;
}

export interface Income {
  id: string;
  description: string;
  amount: number;
  date: string; // YYYY-MM-DD
  accountId: string;
  category: string;
  contactId?: string; // Cliente / Pagador
  status?: PaymentStatus;
  notes?: string;
  createdAt: number;
}

export interface AccountTransfer {
  id: string;
  fromAccountId: string;
  toAccountId: string;
  amount: number;
  date: string; // YYYY-MM-DD
  description: string;
  createdAt: number;
}

export interface Category {
  id: string;
  name: string;
  color: string;
  icon: string;
  budgetLimit?: number; // Optional monthly limit for this category
}

export interface Expense {
  id: string;
  description: string;
  amount: number;
  date: string; // YYYY-MM-DD
  categoryId: string;
  paymentMethod: PaymentMethod;
  accountId?: string; // Treasury account/cash that paid this expense
  cardId?: string; // Credit card id if paid with credit card
  contactId?: string; // Fornecedor / Favorecido
  status?: PaymentStatus; // 'paid' or 'pending'
  installments?: { current: number; total: number };
  notes?: string;
  createdAt: number;
}

export interface MonthlyBudget {
  [yearMonth: string]: number; // e.g. "2026-09": 3500
}

export interface CategoryBudget {
  [categoryId: string]: number;
}

export interface MonthSummary {
  yearMonth: string; // YYYY-MM
  total: number;
  count: number;
  dailyAverage: number;
  topCategory?: {
    category: Category;
    amount: number;
    percentage: number;
  };
}

export interface TreasurySummary {
  totalBalance: number;
  monthInflow: number;
  monthOutflow: number;
  monthNet: number;
  accountBalances: Record<string, number>;
}


