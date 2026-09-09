import React, { useState, useEffect, useMemo } from 'react';
import { Header } from './components/Header';
import { ExpenseSummaryCards } from './components/ExpenseSummaryCards';
import { MonthlyCharts } from './components/MonthlyCharts';
import { ExpenseList } from './components/ExpenseList';
import { ExpenseFormModal } from './components/ExpenseFormModal';
import { CategoryManagerModal } from './components/CategoryManagerModal';
import { MonthlyBudgetModal } from './components/MonthlyBudgetModal';
import { TreasuryView } from './components/TreasuryView';
import { IncomeFormModal } from './components/IncomeFormModal';
import { TransferFormModal } from './components/TransferFormModal';
import { AccountFormModal } from './components/AccountFormModal';
import { CreditCardFormModal } from './components/CreditCardFormModal';
import { ContactFormModal } from './components/ContactFormModal';
import { RecurringBillFormModal } from './components/RecurringBillFormModal';
import { GoalFormModal } from './components/GoalFormModal';
import { QuickRegisterModal } from './components/QuickRegisterModal';
import { RegistriesView } from './components/RegistriesView';

import {
  Expense,
  Category,
  MonthlyBudget,
  TreasuryAccount,
  Income,
  AccountTransfer,
  CreditCard,
  ContactPerson,
  RecurringBill,
  FinancialGoal,
  ContactType,
} from './types';
import { DEFAULT_CATEGORIES } from './data/defaultCategories';
import { getInitialExpenses } from './data/sampleExpenses';
import {
  DEFAULT_ACCOUNTS,
  getInitialIncomes,
  getInitialTransfers,
} from './data/defaultTreasury';
import {
  DEFAULT_CREDIT_CARDS,
  DEFAULT_CONTACTS,
  DEFAULT_RECURRING_BILLS,
  DEFAULT_GOALS,
} from './data/defaultRegistries';
import {
  getCurrentYearMonth,
  getMonthSummary,
  formatDateBR,
  PAYMENT_METHOD_LABELS,
} from './utils/formatters';
import { calculateAccountBalances } from './utils/treasuryHelpers';
import { RotateCcw, ShieldCheck } from 'lucide-react';

const STORAGE_KEYS = {
  EXPENSES: 'app_controle_gastos_expenses',
  CATEGORIES: 'app_controle_gastos_categories',
  BUDGETS: 'app_controle_gastos_budgets',
  ACCOUNTS: 'app_controle_gastos_accounts',
  INCOMES: 'app_controle_gastos_incomes',
  TRANSFERS: 'app_controle_gastos_transfers',
  CARDS: 'app_controle_gastos_cards',
  CONTACTS: 'app_controle_gastos_contacts',
  RECURRING: 'app_controle_gastos_recurring',
  GOALS: 'app_controle_gastos_goals',
};

export default function App() {
  const [activeTab, setActiveTab] = useState<'expenses' | 'treasury' | 'registries'>('treasury');
  const [currentYearMonth, setCurrentYearMonth] = useState<string>(() => getCurrentYearMonth());


  // Expenses State
  const [expenses, setExpenses] = useState<Expense[]>(() => {
    try {
      const saved = localStorage.getItem(STORAGE_KEYS.EXPENSES);
      if (saved) return JSON.parse(saved);
    } catch (e) {
      console.error('Erro ao ler despesas do localStorage', e);
    }
    return getInitialExpenses();
  });

  // Categories State
  const [categories, setCategories] = useState<Category[]>(() => {
    try {
      const saved = localStorage.getItem(STORAGE_KEYS.CATEGORIES);
      if (saved) return JSON.parse(saved);
    } catch (e) {
      console.error('Erro ao ler categorias do localStorage', e);
    }
    return DEFAULT_CATEGORIES;
  });

  // Budgets State
  const [budgets, setBudgets] = useState<MonthlyBudget>(() => {
    try {
      const saved = localStorage.getItem(STORAGE_KEYS.BUDGETS);
      if (saved) return JSON.parse(saved);
    } catch (e) {
      console.error('Erro ao ler orçamentos do localStorage', e);
    }
    const ym = getCurrentYearMonth();
    return { [ym]: 3500 };
  });

  // Treasury Accounts State
  const [accounts, setAccounts] = useState<TreasuryAccount[]>(() => {
    try {
      const saved = localStorage.getItem(STORAGE_KEYS.ACCOUNTS);
      if (saved) return JSON.parse(saved);
    } catch (e) {
      console.error('Erro ao ler contas de tesouraria do localStorage', e);
    }
    return DEFAULT_ACCOUNTS;
  });

  // Incomes State
  const [incomes, setIncomes] = useState<Income[]>(() => {
    try {
      const saved = localStorage.getItem(STORAGE_KEYS.INCOMES);
      if (saved) return JSON.parse(saved);
    } catch (e) {
      console.error('Erro ao ler receitas do localStorage', e);
    }
    return getInitialIncomes();
  });

  // Transfers State
  const [transfers, setTransfers] = useState<AccountTransfer[]>(() => {
    try {
      const saved = localStorage.getItem(STORAGE_KEYS.TRANSFERS);
      if (saved) return JSON.parse(saved);
    } catch (e) {
      console.error('Erro ao ler transferências do localStorage', e);
    }
    return getInitialTransfers();
  });

  // Credit Cards State
  const [cards, setCards] = useState<CreditCard[]>(() => {
    try {
      const saved = localStorage.getItem(STORAGE_KEYS.CARDS);
      if (saved) return JSON.parse(saved);
    } catch (e) {
      console.error('Erro ao ler cartões do localStorage', e);
    }
    return DEFAULT_CREDIT_CARDS;
  });

  // Contacts / Favorecidos State
  const [contacts, setContacts] = useState<ContactPerson[]>(() => {
    try {
      const saved = localStorage.getItem(STORAGE_KEYS.CONTACTS);
      if (saved) return JSON.parse(saved);
    } catch (e) {
      console.error('Erro ao ler contatos do localStorage', e);
    }
    return DEFAULT_CONTACTS;
  });

  // Recurring Bills State
  const [recurringBills, setRecurringBills] = useState<RecurringBill[]>(() => {
    try {
      const saved = localStorage.getItem(STORAGE_KEYS.RECURRING);
      if (saved) return JSON.parse(saved);
    } catch (e) {
      console.error('Erro ao ler contas recorrentes do localStorage', e);
    }
    return DEFAULT_RECURRING_BILLS;
  });

  // Financial Goals State
  const [goals, setGoals] = useState<FinancialGoal[]>(() => {
    try {
      const saved = localStorage.getItem(STORAGE_KEYS.GOALS);
      if (saved) return JSON.parse(saved);
    } catch (e) {
      console.error('Erro ao ler metas do localStorage', e);
    }
    return DEFAULT_GOALS;
  });

  // Modals state
  const [isExpenseModalOpen, setIsExpenseModalOpen] = useState(false);
  const [editingExpense, setEditingExpense] = useState<Expense | null>(null);

  const [isCategoryModalOpen, setIsCategoryModalOpen] = useState(false);
  const [isBudgetModalOpen, setIsBudgetModalOpen] = useState(false);

  const [isIncomeModalOpen, setIsIncomeModalOpen] = useState(false);
  const [editingIncome, setEditingIncome] = useState<Income | null>(null);
  const [preselectedIncomeAccountId, setPreselectedIncomeAccountId] = useState<string | undefined>();

  const [isTransferModalOpen, setIsTransferModalOpen] = useState(false);
  const [editingTransfer, setEditingTransfer] = useState<AccountTransfer | null>(null);
  const [preselectedTransferAccountId, setPreselectedTransferAccountId] = useState<string | undefined>();

  const [isAccountModalOpen, setIsAccountModalOpen] = useState(false);
  const [editingAccount, setEditingAccount] = useState<TreasuryAccount | null>(null);

  // New Modals state for Registries
  const [isCardModalOpen, setIsCardModalOpen] = useState(false);
  const [editingCard, setEditingCard] = useState<CreditCard | null>(null);

  const [isContactModalOpen, setIsContactModalOpen] = useState(false);
  const [editingContact, setEditingContact] = useState<ContactPerson | null>(null);
  const [contactDefaultType, setContactDefaultType] = useState<ContactType | undefined>();

  const [isRecurringModalOpen, setIsRecurringModalOpen] = useState(false);
  const [editingRecurring, setEditingRecurring] = useState<RecurringBill | null>(null);

  const [isGoalModalOpen, setIsGoalModalOpen] = useState(false);
  const [editingGoal, setEditingGoal] = useState<FinancialGoal | null>(null);

  const [isQuickRegisterOpen, setIsQuickRegisterOpen] = useState(false);

  // Sync state to localStorage
  useEffect(() => {
    try {
      localStorage.setItem(STORAGE_KEYS.EXPENSES, JSON.stringify(expenses));
    } catch (e) {
      console.error('Erro ao salvar despesas', e);
    }
  }, [expenses]);

  useEffect(() => {
    try {
      localStorage.setItem(STORAGE_KEYS.CATEGORIES, JSON.stringify(categories));
    } catch (e) {
      console.error('Erro ao salvar categorias', e);
    }
  }, [categories]);

  useEffect(() => {
    try {
      localStorage.setItem(STORAGE_KEYS.BUDGETS, JSON.stringify(budgets));
    } catch (e) {
      console.error('Erro ao salvar orçamentos', e);
    }
  }, [budgets]);

  useEffect(() => {
    try {
      localStorage.setItem(STORAGE_KEYS.ACCOUNTS, JSON.stringify(accounts));
    } catch (e) {
      console.error('Erro ao salvar contas da tesouraria', e);
    }
  }, [accounts]);

  useEffect(() => {
    try {
      localStorage.setItem(STORAGE_KEYS.INCOMES, JSON.stringify(incomes));
    } catch (e) {
      console.error('Erro ao salvar receitas', e);
    }
  }, [incomes]);

  useEffect(() => {
    try {
      localStorage.setItem(STORAGE_KEYS.TRANSFERS, JSON.stringify(transfers));
    } catch (e) {
      console.error('Erro ao salvar transferências', e);
    }
  }, [transfers]);

  useEffect(() => {
    try {
      localStorage.setItem(STORAGE_KEYS.CARDS, JSON.stringify(cards));
    } catch (e) {
      console.error('Erro ao salvar cartões', e);
    }
  }, [cards]);

  useEffect(() => {
    try {
      localStorage.setItem(STORAGE_KEYS.CONTACTS, JSON.stringify(contacts));
    } catch (e) {
      console.error('Erro ao salvar contatos', e);
    }
  }, [contacts]);

  useEffect(() => {
    try {
      localStorage.setItem(STORAGE_KEYS.RECURRING, JSON.stringify(recurringBills));
    } catch (e) {
      console.error('Erro ao salvar contas recorrentes', e);
    }
  }, [recurringBills]);

  useEffect(() => {
    try {
      localStorage.setItem(STORAGE_KEYS.GOALS, JSON.stringify(goals));
    } catch (e) {
      console.error('Erro ao salvar metas financeiras', e);
    }
  }, [goals]);


  // Total Treasury Balance
  const totalTreasuryBalance = useMemo(() => {
    const balances = calculateAccountBalances(accounts, incomes, expenses, transfers);
    return Object.values(balances).reduce((acc, curr) => acc + curr, 0);
  }, [accounts, incomes, expenses, transfers]);

  // Current month summary for Expense Tab
  const currentBudget = budgets[currentYearMonth] || 0;
  const expenseSummary = getMonthSummary(expenses, categories, currentYearMonth, currentBudget);

  // --- Handlers for Expenses ---
  const handleOpenAddExpenseModal = () => {
    setEditingExpense(null);
    setIsExpenseModalOpen(true);
  };

  const handleEditExpense = (expense: Expense) => {
    setEditingExpense(expense);
    setIsExpenseModalOpen(true);
  };

  const handleSaveExpense = (
    expenseData: Omit<Expense, 'id' | 'createdAt'>,
    expenseId?: string
  ) => {
    if (expenseId) {
      setExpenses((prev) =>
        prev.map((e) => (e.id === expenseId ? { ...e, ...expenseData } : e))
      );
    } else {
      const newExpense: Expense = {
        ...expenseData,
        id: `exp-${Date.now()}-${Math.random().toString(36).substring(2, 6)}`,
        createdAt: Date.now(),
      };
      setExpenses((prev) => [newExpense, ...prev]);

      const expenseYM = newExpense.date.substring(0, 7);
      if (expenseYM !== currentYearMonth) {
        setCurrentYearMonth(expenseYM);
      }
    }
  };

  const handleDeleteExpense = (expenseId: string) => {
    setExpenses((prev) => prev.filter((e) => e.id !== expenseId));
  };

  // --- Handlers for Categories & Budgets ---
  const handleAddCategory = (categoryData: Omit<Category, 'id'>) => {
    const newCat: Category = {
      ...categoryData,
      id: `cat-${Date.now()}`,
    };
    setCategories((prev) => [...prev, newCat]);
  };

  const handleDeleteCategory = (categoryId: string) => {
    setCategories((prev) => prev.filter((c) => c.id !== categoryId));
    setExpenses((prev) =>
      prev.map((e) =>
        e.categoryId === categoryId ? { ...e, categoryId: 'cat-outros' } : e
      )
    );
  };

  const handleUpdateCategoryBudget = (
    categoryId: string,
    budgetLimit: number | undefined
  ) => {
    setCategories((prev) =>
      prev.map((c) => (c.id === categoryId ? { ...c, budgetLimit } : c))
    );
  };

  const handleSaveMonthlyBudget = (yearMonth: string, amount: number) => {
    setBudgets((prev) => ({
      ...prev,
      [yearMonth]: amount,
    }));
  };

  // --- Handlers for Treasury Incomes ---
  const handleOpenAddIncomeModal = (preselectedAccountId?: string) => {
    setEditingIncome(null);
    setPreselectedIncomeAccountId(preselectedAccountId);
    setIsIncomeModalOpen(true);
  };

  const handleEditIncome = (income: Income) => {
    setEditingIncome(income);
    setPreselectedIncomeAccountId(income.accountId);
    setIsIncomeModalOpen(true);
  };

  const handleSaveIncome = (
    incomeData: Omit<Income, 'id' | 'createdAt'>,
    incomeId?: string
  ) => {
    if (incomeId) {
      setIncomes((prev) =>
        prev.map((i) => (i.id === incomeId ? { ...i, ...incomeData } : i))
      );
    } else {
      const newIncome: Income = {
        ...incomeData,
        id: `inc-${Date.now()}-${Math.random().toString(36).substring(2, 6)}`,
        createdAt: Date.now(),
      };
      setIncomes((prev) => [newIncome, ...prev]);

      const incomeYM = newIncome.date.substring(0, 7);
      if (incomeYM !== currentYearMonth) {
        setCurrentYearMonth(incomeYM);
      }
    }
  };

  const handleDeleteIncome = (incomeId: string) => {
    setIncomes((prev) => prev.filter((i) => i.id !== incomeId));
  };

  // --- Handlers for Treasury Transfers ---
  const handleOpenAddTransferModal = (preselectedAccountId?: string) => {
    setEditingTransfer(null);
    setPreselectedTransferAccountId(preselectedAccountId);
    setIsTransferModalOpen(true);
  };

  const handleEditTransfer = (transfer: AccountTransfer) => {
    setEditingTransfer(transfer);
    setPreselectedTransferAccountId(transfer.fromAccountId);
    setIsTransferModalOpen(true);
  };

  const handleSaveTransfer = (
    transferData: Omit<AccountTransfer, 'id' | 'createdAt'>,
    transferId?: string
  ) => {
    if (transferId) {
      setTransfers((prev) =>
        prev.map((t) => (t.id === transferId ? { ...t, ...transferData } : t))
      );
    } else {
      const newTransfer: AccountTransfer = {
        ...transferData,
        id: `tr-${Date.now()}-${Math.random().toString(36).substring(2, 6)}`,
        createdAt: Date.now(),
      };
      setTransfers((prev) => [newTransfer, ...prev]);

      const transferYM = newTransfer.date.substring(0, 7);
      if (transferYM !== currentYearMonth) {
        setCurrentYearMonth(transferYM);
      }
    }
  };

  const handleDeleteTransfer = (transferId: string) => {
    setTransfers((prev) => prev.filter((t) => t.id !== transferId));
  };

  // --- Handlers for Treasury Accounts ---
  const handleOpenAccountModal = (account?: TreasuryAccount) => {
    setEditingAccount(account || null);
    setIsAccountModalOpen(true);
  };

  const handleSaveAccount = (
    accountData: Omit<TreasuryAccount, 'id'>,
    accountId?: string
  ) => {
    if (accountId) {
      setAccounts((prev) =>
        prev.map((a) => (a.id === accountId ? { ...a, ...accountData } : a))
      );
    } else {
      const newAcc: TreasuryAccount = {
        ...accountData,
        id: `acc-${Date.now()}-${Math.random().toString(36).substring(2, 6)}`,
      };
      setAccounts((prev) => [...prev, newAcc]);
    }
  };

  const handleDeleteAccount = (accountId: string) => {
    if (accounts.length <= 1) {
      alert('Você deve manter ao menos uma conta bancária ou caixa na tesouraria.');
      return;
    }

    if (
      window.confirm(
        'Tem certeza que deseja excluir esta conta da tesouraria? Os lançamentos vinculados permanecerão no histórico.'
      )
    ) {
      setAccounts((prev) => prev.filter((a) => a.id !== accountId));
    }
  };

  // --- Handlers for Credit Cards ---
  const handleOpenAddCardModal = (card?: CreditCard) => {
    setEditingCard(card || null);
    setIsCardModalOpen(true);
  };

  const handleSaveCard = (cardData: Omit<CreditCard, 'id'>, cardId?: string) => {
    if (cardId) {
      setCards((prev) =>
        prev.map((c) => (c.id === cardId ? { ...c, ...cardData } : c))
      );
    } else {
      const newCard: CreditCard = {
        ...cardData,
        id: `card-${Date.now()}-${Math.random().toString(36).substring(2, 6)}`,
      };
      setCards((prev) => [...prev, newCard]);
    }
  };

  const handleDeleteCard = (cardId: string) => {
    if (window.confirm('Tem certeza que deseja remover este cartão?')) {
      setCards((prev) => prev.filter((c) => c.id !== cardId));
    }
  };

  // --- Handlers for Contacts / Favorecidos ---
  const handleOpenAddContactModal = (contact?: ContactPerson, defaultType?: ContactType) => {
    setEditingContact(contact || null);
    setContactDefaultType(defaultType);
    setIsContactModalOpen(true);
  };

  const handleSaveContact = (contactData: Omit<ContactPerson, 'id'>, contactId?: string) => {
    if (contactId) {
      setContacts((prev) =>
        prev.map((c) => (c.id === contactId ? { ...c, ...contactData } : c))
      );
    } else {
      const newContact: ContactPerson = {
        ...contactData,
        id: `contact-${Date.now()}-${Math.random().toString(36).substring(2, 6)}`,
      };
      setContacts((prev) => [...prev, newContact]);
    }
  };

  const handleDeleteContact = (contactId: string) => {
    if (window.confirm('Deseja excluir este favorecido/contato cadastrado?')) {
      setContacts((prev) => prev.filter((c) => c.id !== contactId));
    }
  };

  // --- Handlers for Recurring Bills ---
  const handleOpenAddRecurringModal = (bill?: RecurringBill) => {
    setEditingRecurring(bill || null);
    setIsRecurringModalOpen(true);
  };

  const handleSaveRecurring = (billData: Omit<RecurringBill, 'id'>, billId?: string) => {
    if (billId) {
      setRecurringBills((prev) =>
        prev.map((b) => (b.id === billId ? { ...b, ...billData } : b))
      );
    } else {
      const newBill: RecurringBill = {
        ...billData,
        id: `rec-${Date.now()}-${Math.random().toString(36).substring(2, 6)}`,
      };
      setRecurringBills((prev) => [...prev, newBill]);
    }
  };

  const handleDeleteRecurring = (billId: string) => {
    if (window.confirm('Deseja excluir esta conta ou receita fixa recorrente?')) {
      setRecurringBills((prev) => prev.filter((b) => b.id !== billId));
    }
  };

  const handleTriggerRecurringBill = (bill: RecurringBill) => {
    // Determine target date for current month
    const targetDay = String(Math.min(Math.max(bill.dueDay, 1), 28)).padStart(2, '0');
    const billDate = `${currentYearMonth}-${targetDay}`;

    if (bill.type === 'expense') {
      const newExp: Expense = {
        id: `exp-rec-${Date.now()}-${Math.random().toString(36).substring(2, 6)}`,
        description: bill.description,
        amount: bill.amount,
        date: billDate,
        categoryId: bill.categoryId || categories[0]?.id || 'cat-moradia',
        accountId: bill.accountId || accounts[0]?.id,
        paymentMethod: 'boleto',
        contactId: bill.contactId,
        status: 'pending',
        notes: 'Lançado a partir de Conta Fixa Recorrente',
        createdAt: Date.now(),
      };
      setExpenses((prev) => [newExp, ...prev]);
      alert(`Despesa "${bill.description}" de ${formatDateBR(billDate)} lançada com sucesso no mês ${currentYearMonth}!`);
    } else {
      const newInc: Income = {
        id: `inc-rec-${Date.now()}-${Math.random().toString(36).substring(2, 6)}`,
        description: bill.description,
        amount: bill.amount,
        date: billDate,
        accountId: bill.accountId || accounts[0]?.id || '',
        category: 'Salário & Pro-labore',
        contactId: bill.contactId,
        status: 'pending',
        notes: 'Lançado a partir de Receita Fixa Recorrente',
        createdAt: Date.now(),
      };
      setIncomes((prev) => [newInc, ...prev]);
      alert(`Receita "${bill.description}" de ${formatDateBR(billDate)} lançada com sucesso no mês ${currentYearMonth}!`);
    }
  };

  // --- Handlers for Financial Goals ---
  const handleOpenAddGoalModal = (goal?: FinancialGoal) => {
    setEditingGoal(goal || null);
    setIsGoalModalOpen(true);
  };

  const handleSaveGoal = (goalData: Omit<FinancialGoal, 'id'>, goalId?: string) => {
    if (goalId) {
      setGoals((prev) =>
        prev.map((g) => (g.id === goalId ? { ...g, ...goalData } : g))
      );
    } else {
      const newGoal: FinancialGoal = {
        ...goalData,
        id: `goal-${Date.now()}-${Math.random().toString(36).substring(2, 6)}`,
      };
      setGoals((prev) => [...prev, newGoal]);
    }
  };

  const handleDeleteGoal = (goalId: string) => {
    if (window.confirm('Tem certeza que deseja excluir esta meta financeira?')) {
      setGoals((prev) => prev.filter((g) => g.id !== goalId));
    }
  };

  const handleUpdateGoalAmount = (goalId: string, currentAmount: number) => {
    setGoals((prev) =>
      prev.map((g) => (g.id === goalId ? { ...g, currentAmount } : g))
    );
  };

  // --- Quick Register Hub Handler ---
  const handleQuickRegisterAction = (
    type:
      | 'expense'
      | 'income'
      | 'transfer'
      | 'card'
      | 'contact'
      | 'recurring'
      | 'goal'
      | 'account'
      | 'category'
  ) => {
    switch (type) {
      case 'expense':
        handleOpenAddExpenseModal();
        break;
      case 'income':
        handleOpenAddIncomeModal();
        break;
      case 'transfer':
        handleOpenAddTransferModal();
        break;
      case 'card':
        handleOpenAddCardModal();
        break;
      case 'contact':
        handleOpenAddContactModal();
        break;
      case 'recurring':
        handleOpenAddRecurringModal();
        break;
      case 'goal':
        handleOpenAddGoalModal();
        break;
      case 'account':
        handleOpenAccountModal();
        break;
      case 'category':
        setIsCategoryModalOpen(true);
        break;
    }
  };

  // --- Export CSV for Expenses ---
  const handleExportExpensesCSV = () => {
    const headers = [
      'Data',
      'Descricao',
      'Categoria',
      'Conta de Saida',
      'Forma de Pagamento',
      'Valor (R$)',
      'Observacoes',
    ];

    const categoryMap = new Map<string, string>(categories.map((c) => [c.id, c.name]));
    const accountMap = new Map<string, string>(accounts.map((a) => [a.id, a.name]));

    const rows = expenses.map((e) => {
      const categoryName = categoryMap.get(e.categoryId) || 'Outros';
      const accountName = e.accountId ? accountMap.get(e.accountId) || 'Conta Padrão' : 'Conta Padrão';
      return [
        formatDateBR(e.date),
        `"${e.description.replace(/"/g, '""')}"`,
        `"${categoryName.replace(/"/g, '""')}"`,
        `"${accountName.replace(/"/g, '""')}"`,
        `"${PAYMENT_METHOD_LABELS[e.paymentMethod] || e.paymentMethod}"`,
        e.amount.toFixed(2).replace('.', ','),
        `"${(e.notes || '').replace(/"/g, '""')}"`,
      ];
    });

    const csvContent =
      'data:text/csv;charset=utf-8,\uFEFF' +
      [headers.join(';'), ...rows.map((r) => r.join(';'))].join('\n');

    const encodedUri = encodeURI(csvContent);
    const link = document.createElement('a');
    link.setAttribute('href', encodedUri);
    link.setAttribute('download', `gastos_pessoais_${currentYearMonth}.csv`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  // --- Reset All Data ---
  const handleResetData = () => {
    if (
      window.confirm(
        'Deseja restaurar todos os dados de exemplo originais (despesas, tesouraria, cartões, contatos e metas)? Todas as suas alterações locais serão redefinidas.'
      )
    ) {
      setExpenses(getInitialExpenses());
      setCategories(DEFAULT_CATEGORIES);
      setAccounts(DEFAULT_ACCOUNTS);
      setIncomes(getInitialIncomes());
      setTransfers(getInitialTransfers());
      setCards(DEFAULT_CREDIT_CARDS);
      setContacts(DEFAULT_CONTACTS);
      setRecurringBills(DEFAULT_RECURRING_BILLS);
      setGoals(DEFAULT_GOALS);
      const ym = getCurrentYearMonth();
      setBudgets({ [ym]: 3500 });
      localStorage.removeItem(STORAGE_KEYS.EXPENSES);
      localStorage.removeItem(STORAGE_KEYS.CATEGORIES);
      localStorage.removeItem(STORAGE_KEYS.BUDGETS);
      localStorage.removeItem(STORAGE_KEYS.ACCOUNTS);
      localStorage.removeItem(STORAGE_KEYS.INCOMES);
      localStorage.removeItem(STORAGE_KEYS.TRANSFERS);
      localStorage.removeItem(STORAGE_KEYS.CARDS);
      localStorage.removeItem(STORAGE_KEYS.CONTACTS);
      localStorage.removeItem(STORAGE_KEYS.RECURRING);
      localStorage.removeItem(STORAGE_KEYS.GOALS);
    }
  };

  return (
    <div className="min-h-screen flex flex-col bg-slate-50 text-slate-800">
      {/* Top Header with Module Navigation & Actions */}
      <Header
        currentYearMonth={currentYearMonth}
        activeTab={activeTab}
        onTabChange={setActiveTab}
        totalTreasuryBalance={totalTreasuryBalance}
        onChangeMonth={setCurrentYearMonth}
        onOpenAddModal={handleOpenAddExpenseModal}
        onOpenCategoryModal={() => setIsCategoryModalOpen(true)}
        onOpenIncomeModal={() => handleOpenAddIncomeModal()}
        onOpenTransferModal={() => handleOpenAddTransferModal()}
        onOpenQuickRegisterModal={() => setIsQuickRegisterOpen(true)}
        onExportData={handleExportExpensesCSV}
        onResetData={handleResetData}
      />

      {/* Main Content */}
      <main className="flex-1 max-w-7xl w-full mx-auto px-4 sm:px-6 lg:px-8 py-6">
        {activeTab === 'registries' ? (
          /* Central Registry Management Hub (Cartões, Favorecidos/Clientes, Contas Fixas, Metas) */
          <RegistriesView
            cards={cards}
            contacts={contacts}
            recurringBills={recurringBills}
            goals={goals}
            accounts={accounts}
            categories={categories}
            onOpenCardModal={handleOpenAddCardModal}
            onDeleteCard={handleDeleteCard}
            onOpenContactModal={handleOpenAddContactModal}
            onDeleteContact={handleDeleteContact}
            onOpenRecurringModal={handleOpenAddRecurringModal}
            onDeleteRecurring={handleDeleteRecurring}
            onTriggerRecurring={handleTriggerRecurringBill}
            onOpenGoalModal={handleOpenAddGoalModal}
            onDeleteGoal={handleDeleteGoal}
            onUpdateGoalAmount={handleUpdateGoalAmount}
            onOpenAccountModal={handleOpenAccountModal}
            onOpenCategoryModal={() => setIsCategoryModalOpen(true)}
          />
        ) : activeTab === 'treasury' ? (
          /* Treasury Module (Tesouraria, Contas, Fluxo de Caixa, Livro-Caixa) */
          <TreasuryView
            accounts={accounts}
            incomes={incomes}
            expenses={expenses}
            transfers={transfers}
            categories={categories}
            selectedMonth={currentYearMonth}
            onMonthChange={setCurrentYearMonth}
            onOpenIncomeModal={handleOpenAddIncomeModal}
            onOpenTransferModal={handleOpenAddTransferModal}
            onOpenExpenseModal={handleOpenAddExpenseModal}
            onOpenAccountModal={handleOpenAccountModal}
            onDeleteAccount={handleDeleteAccount}
            onDeleteIncome={handleDeleteIncome}
            onDeleteTransfer={handleDeleteTransfer}
            onDeleteExpense={handleDeleteExpense}
            onEditIncome={handleEditIncome}
            onEditTransfer={handleEditTransfer}
            onEditExpense={handleEditExpense}
          />
        ) : (
          /* Expenses & Analytics Module (Despesas, Gráficos por Categoria, Limite Orçamentário) */
          <div className="space-y-6">
            {/* KPI Cards */}
            <ExpenseSummaryCards
              total={expenseSummary.total}
              count={expenseSummary.count}
              dailyAverage={expenseSummary.dailyAverage}
              deltaPercent={expenseSummary.deltaPercent}
              topCategory={expenseSummary.topCategory}
              budgetLimit={expenseSummary.budgetLimit}
              onOpenBudgetModal={() => setIsBudgetModalOpen(true)}
            />

            {/* Automatic Monthly Charts */}
            <MonthlyCharts
              expenses={expenses}
              categories={categories}
              currentYearMonth={currentYearMonth}
            />

            {/* Expenses List & Filter Table */}
            <ExpenseList
              expenses={expenses}
              categories={categories}
              accounts={accounts}
              cards={cards}
              contacts={contacts}
              currentYearMonth={currentYearMonth}
              onEditExpense={handleEditExpense}
              onDeleteExpense={handleDeleteExpense}
              onOpenAddModal={handleOpenAddExpenseModal}
            />
          </div>
        )}
      </main>

      {/* Footer */}
      <footer className="border-t border-slate-200 bg-white py-4 mt-auto">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 flex flex-col sm:flex-row items-center justify-between gap-2 text-xs text-slate-500">
          <div className="flex items-center gap-1.5">
            <ShieldCheck className="w-4 h-4 text-emerald-600" />
            <span>
              Controle de Gastos & Tesouraria • Seus dados ficam salvos localmente com total privacidade no navegador.
            </span>
          </div>
          <button
            onClick={handleResetData}
            className="flex items-center gap-1 hover:text-indigo-600 text-slate-400 transition-colors"
            title="Restaurar dados de exemplo da tesouraria e despesas"
          >
            <RotateCcw className="w-3.5 h-3.5" />
            <span>Restaurar dados de exemplo</span>
          </button>
        </div>
      </footer>

      {/* Standard Modals */}
      <ExpenseFormModal
        isOpen={isExpenseModalOpen}
        onClose={() => setIsExpenseModalOpen(false)}
        onSave={handleSaveExpense}
        editingExpense={editingExpense}
        categories={categories}
        accounts={accounts}
        cards={cards}
        contacts={contacts}
        defaultDate={`${currentYearMonth}-01`}
      />

      <CategoryManagerModal
        isOpen={isCategoryModalOpen}
        onClose={() => setIsCategoryModalOpen(false)}
        categories={categories}
        onAddCategory={handleAddCategory}
        onDeleteCategory={handleDeleteCategory}
        onUpdateCategoryBudget={handleUpdateCategoryBudget}
      />

      <MonthlyBudgetModal
        isOpen={isBudgetModalOpen}
        onClose={() => setIsBudgetModalOpen(false)}
        yearMonth={currentYearMonth}
        currentBudget={currentBudget}
        onSaveBudget={handleSaveMonthlyBudget}
      />

      <IncomeFormModal
        isOpen={isIncomeModalOpen}
        onClose={() => setIsIncomeModalOpen(false)}
        onSave={handleSaveIncome}
        editingIncome={editingIncome}
        accounts={accounts}
        contacts={contacts}
        defaultDate={`${currentYearMonth}-01`}
      />

      <TransferFormModal
        isOpen={isTransferModalOpen}
        onClose={() => setIsTransferModalOpen(false)}
        onSave={handleSaveTransfer}
        editingTransfer={editingTransfer}
        accounts={accounts}
        defaultDate={`${currentYearMonth}-01`}
        defaultFromAccountId={preselectedTransferAccountId}
      />

      <AccountFormModal
        isOpen={isAccountModalOpen}
        onClose={() => setIsAccountModalOpen(false)}
        onSave={handleSaveAccount}
        editingAccount={editingAccount}
      />

      {/* Registries Form Modals */}
      <CreditCardFormModal
        isOpen={isCardModalOpen}
        onClose={() => setIsCardModalOpen(false)}
        onSave={handleSaveCard}
        editingCard={editingCard}
      />

      <ContactFormModal
        isOpen={isContactModalOpen}
        onClose={() => setIsContactModalOpen(false)}
        onSave={handleSaveContact}
        editingContact={editingContact}
        defaultType={contactDefaultType}
      />

      <RecurringBillFormModal
        isOpen={isRecurringModalOpen}
        onClose={() => setIsRecurringModalOpen(false)}
        onSave={handleSaveRecurring}
        editingBill={editingRecurring}
        categories={categories}
        accounts={accounts}
        contacts={contacts}
      />

      <GoalFormModal
        isOpen={isGoalModalOpen}
        onClose={() => setIsGoalModalOpen(false)}
        onSave={handleSaveGoal}
        editingGoal={editingGoal}
      />

      <QuickRegisterModal
        isOpen={isQuickRegisterOpen}
        onClose={() => setIsQuickRegisterOpen(false)}
        onSelect={handleQuickRegisterAction}
      />
    </div>
  );
}

