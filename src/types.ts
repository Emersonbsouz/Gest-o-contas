export type PaymentMethod = 'pix' | 'credit_card' | 'debit_card' | 'cash' | 'transfer' | 'boleto' | 'other';

export type AccountType = 'checking' | 'cash' | 'savings' | 'investment';

export type PaymentStatus = 'paid' | 'pending' | 'liquidated' | 'approved' | 'rejected' | 'draft' | 'overdue' | 'cancelled' | 'PENDENTE' | 'PAGO' | 'VENCIDO' | 'CANCELADO';

export type ContactType = 'supplier' | 'client' | 'service_provider' | 'employee' | 'other';

export type ProposalStatus = 'draft' | 'sent' | 'approved' | 'rejected' | 'converted';

export interface CostCenter {
  id: string;
  name: string; // Nome da Obra/Projeto
  status: 'active' | 'completed' | 'on_hold';
  clientId: string; // Ref a ContactPerson
  managerId?: string; // Ref a ContactPerson (Funcionário)
  startDate?: string;
  endDate?: string;
  budget?: number;
  color: string;
  notes?: string;
  createdAt: number;
}

export interface Proposal {
  id: string;
  title: string;
  description?: string;
  clientId: string;
  amount: number;
  status: ProposalStatus;
  date: string;
  items?: Array<{
    description: string;
    quantity: number;
    unitPrice: number;
    total: number;
  }>;
  validUntil?: string;
  costCenterId?: string; // Set when converted
  notes?: string;
  createdAt: number;
}

export interface Equipment {
  id: string;
  name: string;
  brand?: string;
  serialNumber?: string;
  status: 'available' | 'rented' | 'maintenance' | 'broken';
  dailyRate: number;
  notes?: string;
}

export interface Rental {
  id: string;
  equipmentId: string;
  clientId: string;
  startDate: string;
  expectedReturnDate?: string;
  actualReturnDate?: string;
  status: 'active' | 'returned' | 'overdue';
  amount: number;
  costCenterId?: string;
  createdAt: number;
}

export interface TransactionSplit {
  id: string;
  costCenterId: string;
  amount: number;
  categoryId: string;
  notes?: string;
}

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
  address?: string; // Endereço do cliente/fornecedor
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
  costCenterId?: string;
  active: boolean;
  notes?: string;
  createdAt?: number;
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
  createdAt?: number;
}

export interface IncomeCategory {
  id: string;
  name: string;
  color: string;
  icon: string;
}

export interface BilletData {
  barcode?: string;
  digitableLine?: string;
  dueDate?: string;
  assignor?: string;
}

export interface Income {
  id: string;
  description: string;
  amount: number;
  date: string; // YYYY-MM-DD (Vencimento)
  accountId: string;
  categoryId: string;
  paymentMethod?: PaymentMethod;
  billetData?: BilletData;
  contactId?: string; // Cliente / Pagador (cliente_id)
  costCenterId?: string; // Obra vinculada
  status?: PaymentStatus;
  notes?: string;
  isRecurring?: boolean;
  parentTransactionId?: string; // For grouped installments
  installmentNumber?: number;
  totalInstallments?: number;
  transacao_id_banco?: string; // ID da transação no gateway/banco
  linha_digitavel?: string; // Os números usados para pagamento
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
  type: 'expense' | 'income';
  budgetLimit?: number; // Optional monthly limit for this category
  parentId?: string; // For hierarchical Chart of Accounts (Ex: 2. Custos > 2.1 Materiais)
}

export interface Expense {
  id: string;
  description: string;
  amount: number;
  date: string; // YYYY-MM-DD
  categoryId: string;
  paymentMethod: PaymentMethod;
  billetData?: BilletData;
  accountId?: string; // Treasury account/cash that paid this expense
  cardId?: string; // Credit card id if paid with credit card
  contactId?: string; // Fornecedor / Favorecido
  costCenterId?: string; // Default cost center if no splits
  documentNumber?: string; // NF ou Recibo
  status?: PaymentStatus; // 'paid' or 'pending'
  installments?: { current: number; total: number };
  splits?: TransactionSplit[]; // Multiple cost centers support
  isRecurring?: boolean;
  transacao_id_banco?: string;
  linha_digitavel?: string;
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

export type CompanyType = 'personal' | 'business';
export type CompanyRole = 'owner' | 'admin' | 'partner' | 'operator' | 'viewer' | 'custom';

export interface MemberPermissions {
  canCreateTransactions: boolean; // Despesas, receitas, transferências
  canEditTransactions: boolean;   // Editar lançamentos
  canDeleteTransactions: boolean; // Excluir lançamentos
  canManageRegistries: boolean;   // Cartões, favorecidos, contas bancárias, metas, categorias
  canViewReports: boolean;        // Visualizar relatórios, DRE, metas
  canManageMembers: boolean;      // Convidar e gerenciar permissões de outros membros
}

export const DEFAULT_ROLE_PERMISSIONS: Record<CompanyRole, MemberPermissions> = {
  owner: {
    canCreateTransactions: true,
    canEditTransactions: true,
    canDeleteTransactions: true,
    canManageRegistries: true,
    canViewReports: true,
    canManageMembers: true,
  },
  admin: {
    canCreateTransactions: true,
    canEditTransactions: true,
    canDeleteTransactions: true,
    canManageRegistries: true,
    canViewReports: true,
    canManageMembers: true,
  },
  partner: {
    canCreateTransactions: true,
    canEditTransactions: true,
    canDeleteTransactions: true,
    canManageRegistries: true,
    canViewReports: true,
    canManageMembers: false,
  },
  operator: {
    canCreateTransactions: true,
    canEditTransactions: true,
    canDeleteTransactions: false,
    canManageRegistries: true,
    canViewReports: false,
    canManageMembers: false,
  },
  viewer: {
    canCreateTransactions: false,
    canEditTransactions: false,
    canDeleteTransactions: false,
    canManageRegistries: false,
    canViewReports: true,
    canManageMembers: false,
  },
  custom: {
    canCreateTransactions: true,
    canEditTransactions: true,
    canDeleteTransactions: false,
    canManageRegistries: false,
    canViewReports: true,
    canManageMembers: false,
  },
};

export interface CompanyMemberInfo {
  email: string;
  name?: string;
  role?: CompanyRole;
  permissions?: MemberPermissions;
  addedAt?: number;
}

export interface Company {
  id: string;
  name: string; // Ex: "Despesas Pessoais", "Empresa Cacto", "Minha Empresa Individual"
  type: CompanyType;
  ownerId: string;
  ownerEmail: string;
  memberEmails: string[]; // Lista de e-mails com acesso
  membersInfo?: CompanyMemberInfo[];
  color?: string;
  createdAt: number;
}


