import React, { useState, useEffect, useMemo } from 'react';
import { Header } from './components/Header';
import { ExpenseSummaryCards } from './components/ExpenseSummaryCards';
import { MonthlyCharts } from './components/MonthlyCharts';
import { ExpenseList } from './components/ExpenseList';
import { FinancialFormModal } from './components/FinancialFormModal';
import { CategoryManagerModal } from './components/CategoryManagerModal';
import { MonthlyBudgetModal } from './components/MonthlyBudgetModal';
import { TreasuryView } from './components/TreasuryView';
import { TransferFormModal } from './components/TransferFormModal';
import { AccountFormModal } from './components/AccountFormModal';
import { CreditCardFormModal } from './components/CreditCardFormModal';
import { ContactFormModal } from './components/ContactFormModal';
import { RecurringBillFormModal } from './components/RecurringBillFormModal';
import { GoalFormModal } from './components/GoalFormModal';
import { QuickRegisterModal } from './components/QuickRegisterModal';
import { RegistriesView } from './components/RegistriesView';
import { ReportsView } from './components/ReportsView';
import { CreateCompanyModal } from './components/CreateCompanyModal';
import { ManageMembersModal } from './components/ManageMembersModal';
import { ResetConfirmModal } from './components/ResetConfirmModal';
import { BackupSecurityModal } from './components/BackupSecurityModal';
import { DatabaseSettingsModal } from './components/DatabaseSettingsModal';
import { AuthView } from './components/AuthView';
import { Sidebar } from './components/Sidebar';
import { DashboardView } from './components/DashboardView';
import { CommercialView } from './components/CommercialView';
import { ProjectsView } from './components/ProjectsView';
import { FinancialView } from './components/FinancialView';
import { CostCenterModal } from './components/CostCenterModal';
import { ProposalModal } from './components/ProposalModal';
import { RentalModal } from './components/RentalModal';
import { EquipmentModal } from './components/EquipmentModal';
import { useAuth } from './context/AuthContext';
import { useCompanyData } from './hooks/useCompanyData';
import {
  ensureDefaultCompanies,
  subscribeToUserCompanies,
  createNewCompany,
  addCompanyMember,
  updateCompanyMember,
  removeCompanyMember,
} from './services/companyService';

import {
  Expense,
  Category,
  TreasuryAccount,
  Income,
  AccountTransfer,
  CreditCard,
  ContactPerson,
  RecurringBill,
  FinancialGoal,
  ContactType,
  Company,
  CompanyType,
  CompanyRole,
  MemberPermissions,
  DEFAULT_ROLE_PERMISSIONS,
  CostCenter,
  Proposal,
  Rental,
  Equipment,
} from './types';
import {
  getCurrentYearMonth,
  getMonthSummary,
  formatDateBR,
  PAYMENT_METHOD_LABELS,
} from './utils/formatters';
import { calculateAccountBalances } from './utils/treasuryHelpers';
import { RotateCcw, ShieldCheck, Loader2, Building2, User, Database } from 'lucide-react';

export default function App() {
  const { currentUser, loading: authLoading, logout } = useAuth();

  // Multi-Company State
  const [companies, setCompanies] = useState<Company[]>([]);
  const [activeCompany, setActiveCompany] = useState<Company | null>(null);
  const [isCreateCompanyOpen, setIsCreateCompanyOpen] = useState(false);
  const [isManageMembersOpen, setIsManageMembersOpen] = useState(false);

  // Active View & Month
  const [activeView, setActiveView] = useState<'dashboard' | 'comercial' | 'projetos' | 'financeiro' | 'cadastros' | 'relatorios'>('dashboard');
  const [currentYearMonth, setCurrentYearMonth] = useState<string>(() => getCurrentYearMonth());

  // Subscribe to user companies when logged in
  useEffect(() => {
    if (!currentUser) {
      setCompanies([]);
      setActiveCompany(null);
      return;
    }

    let isMounted = true;

    // Ensure starter companies (Personal, Individual, Cacto) exist in cloud
    ensureDefaultCompanies(currentUser.uid, currentUser.email || '')
      .then((initialComps) => {
        if (!isMounted) return;
        if (initialComps && initialComps.length > 0) {
          setCompanies(initialComps);
          setActiveCompany((prev) => {
            if (prev) {
              const stillExists = initialComps.find((c) => c.id === prev.id);
              if (stillExists) return stillExists;
            }
            const savedCompId = localStorage.getItem(`app_active_company_${currentUser.uid}`);
            return initialComps.find((c) => c.id === savedCompId) || initialComps[0] || null;
          });
        }
      })
      .catch((err) => {
        console.error('[App] Erro ao carregar empresas iniciais:', err);
      });

    // Real-time listener for companies
    const unsubscribe = subscribeToUserCompanies(
      currentUser.uid,
      currentUser.email || '',
      (updatedComps) => {
        if (!isMounted) return;
        if (updatedComps && updatedComps.length > 0) {
          setCompanies(updatedComps);
          setActiveCompany((prev) => {
            if (prev) {
              const stillExists = updatedComps.find((c) => c.id === prev.id);
              if (stillExists) return stillExists;
            }
            const savedCompId = localStorage.getItem(`app_active_company_${currentUser.uid}`);
            return updatedComps.find((c) => c.id === savedCompId) || updatedComps[0] || null;
          });
        }
      }
    );

    return () => {
      isMounted = false;
      unsubscribe();
    };
  }, [currentUser]);

  // Hook for all isolated financial state scoped to activeCompany
  const {
    expenses,
    categories,
    budgets,
    accounts,
    incomes,
    transfers,
    cards,
    contacts,
    recurringBills,
    goals,
    costCenters,
    proposals,
    equipment,
    rentals,
    loading: dataLoading,
    cloudSyncStatus,
    lastError,
    saveExpense,
    deleteExpense,
    saveIncome,
    deleteIncome,
    saveTransfer,
    deleteTransfer,
    saveAccount,
    deleteAccount,
    saveCard,
    deleteCard,
    saveContact,
    deleteContact,
    saveRecurring,
    deleteRecurring,
    saveGoal,
    deleteGoal,
    saveCostCenter,
    deleteCostCenter,
    saveProposal,
    deleteProposal,
    saveEquipment,
    deleteEquipment,
    saveRental,
    deleteRental,
    addCategory,
    deleteCategory,
    updateCategoryBudget,
    saveMonthlyBudget,
    resetData,
    clearAllData,
  } = useCompanyData(activeCompany?.id || null);

  // Modals state
  const [isBackupModalOpen, setIsBackupModalOpen] = useState(false);
  const [isResetConfirmOpen, setIsResetConfirmOpen] = useState(false);
  const [isCategoryModalOpen, setIsCategoryModalOpen] = useState(false);
  const [isBudgetModalOpen, setIsBudgetModalOpen] = useState(false);
  const [isDbSettingsOpen, setIsDbSettingsOpen] = useState(false);

  // Unified Financial Modal (Expense/Income)
  const [isFinancialModalOpen, setIsFinancialModalOpen] = useState(false);
  const [financialModalType, setFinancialModalType] = useState<'expense' | 'income'>('expense');
  const [editingFinancialItem, setEditingFinancialItem] = useState<any | null>(null);
  const [financialPreselectedAccountId, setFinancialPreselectedAccountId] = useState<string | undefined>();

  const [isTransferModalOpen, setIsTransferModalOpen] = useState(false);
  const [editingTransfer, setEditingTransfer] = useState<AccountTransfer | null>(null);
  const [preselectedTransferAccountId, setPreselectedTransferAccountId] = useState<string | undefined>();

  const [isAccountModalOpen, setIsAccountModalOpen] = useState(false);
  const [editingAccount, setEditingAccount] = useState<TreasuryAccount | null>(null);

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

  // ERP Modals State
  const [isCostCenterModalOpen, setIsCostCenterModalOpen] = useState(false);
  const [editingCostCenter, setEditingCostCenter] = useState<CostCenter | null>(null);

  const [isProposalModalOpen, setIsProposalModalOpen] = useState(false);
  const [editingProposal, setEditingProposal] = useState<Proposal | null>(null);

  const [isRentalModalOpen, setIsRentalModalOpen] = useState(false);
  const [editingRental, setEditingRental] = useState<Rental | null>(null);

  const [isEquipmentModalOpen, setIsEquipmentModalOpen] = useState(false);
  const [editingEquipment, setEditingEquipment] = useState<Equipment | null>(null);

  const [dbHealth, setDbHealth] = useState<{ status: string; database: string } | null>(null);

  useEffect(() => {
    fetch('/api/health')
      .then(res => res.json())
      .then(data => setDbHealth(data))
      .catch(() => setDbHealth({ status: 'error', database: 'missing' }));
  }, []);

  // Total Treasury Balance
  const totalTreasuryBalance = useMemo(() => {
    const balances = calculateAccountBalances(accounts, incomes, expenses, transfers);
    return Object.values(balances).reduce((acc, curr) => acc + curr, 0);
  }, [accounts, incomes, expenses, transfers]);

  // Current month summary for Expense Tab
  const currentBudget = budgets[currentYearMonth] || 0;
  const expenseSummary = getMonthSummary(expenses, categories, currentYearMonth, currentBudget);

  // Company management handlers
  const handleSelectCompany = (comp: Company) => {
    setActiveCompany(comp);
    if (currentUser) {
      localStorage.setItem(`app_active_company_${currentUser.uid}`, comp.id);
    }
  };

  const handleCreateCompany = async (data: { name: string; type: CompanyType; color: string }) => {
    if (!currentUser) return;
    const newComp = await createNewCompany(currentUser.uid, currentUser.email || '', data);
    setCompanies((prev) => [...prev, newComp]);
    handleSelectCompany(newComp);
  };

  // Compute permissions for the current user in the active company
  const currentUserPermissions = useMemo<MemberPermissions>(() => {
    if (!activeCompany || !currentUser?.email) {
      return DEFAULT_ROLE_PERMISSIONS.owner;
    }
    const cleanEmail = currentUser.email.toLowerCase().trim();
    if ((activeCompany.ownerEmail || '').toLowerCase().trim() === cleanEmail) {
      return DEFAULT_ROLE_PERMISSIONS.owner;
    }
    const member = (activeCompany.membersInfo || []).find(
      (m) => (m.email || '').toLowerCase().trim() === cleanEmail
    );
    if (!member) {
      return DEFAULT_ROLE_PERMISSIONS.partner;
    }
    return member.permissions || DEFAULT_ROLE_PERMISSIONS[member.role] || DEFAULT_ROLE_PERMISSIONS.partner;
  }, [activeCompany, currentUser?.email]);

  const handleAddMember = async (
    companyId: string,
    email: string,
    name?: string,
    role?: CompanyRole,
    permissions?: MemberPermissions
  ) => {
    const chosenRole = role || 'partner';
    const chosenPerms = permissions || DEFAULT_ROLE_PERMISSIONS[chosenRole];
    await addCompanyMember(companyId, email, name, chosenRole, chosenPerms);
    const cleanEmail = email.toLowerCase().trim();
    const newMemberMeta = {
      email: cleanEmail,
      name: name?.trim() || cleanEmail,
      role: chosenRole,
      permissions: chosenPerms,
      addedAt: Date.now(),
    };

    setCompanies((prev) =>
      prev.map((c) =>
        c.id === companyId
          ? {
              ...c,
              memberEmails: c.memberEmails.includes(cleanEmail) ? c.memberEmails : [...c.memberEmails, cleanEmail],
              membersInfo: [
                ...(c.membersInfo || []).filter((m) => m.email.toLowerCase().trim() !== cleanEmail),
                newMemberMeta,
              ],
            }
          : c
      )
    );
    setActiveCompany((prev) =>
      prev && prev.id === companyId
        ? {
            ...prev,
            memberEmails: prev.memberEmails.includes(cleanEmail) ? prev.memberEmails : [...prev.memberEmails, cleanEmail],
            membersInfo: [
              ...(prev.membersInfo || []).filter((m) => m.email.toLowerCase().trim() !== cleanEmail),
              newMemberMeta,
            ],
          }
        : prev
    );
  };

  const handleUpdateMember = async (
    companyId: string,
    email: string,
    updates: {
      name?: string;
      role: CompanyRole;
      permissions: MemberPermissions;
    }
  ) => {
    await updateCompanyMember(companyId, email, updates);
    const cleanEmail = email.toLowerCase().trim();

    setCompanies((prev) =>
      prev.map((c) => {
        if (c.id !== companyId) return c;
        const updatedInfo = (c.membersInfo || []).map((m) => {
          if (m.email.toLowerCase().trim() === cleanEmail) {
            return {
              ...m,
              name: updates.name !== undefined ? updates.name : m.name,
              role: updates.role,
              permissions: updates.permissions,
            };
          }
          return m;
        });
        return { ...c, membersInfo: updatedInfo };
      })
    );

    setActiveCompany((prev) => {
      if (!prev || prev.id !== companyId) return prev;
      const updatedInfo = (prev.membersInfo || []).map((m) => {
        if (m.email.toLowerCase().trim() === cleanEmail) {
          return {
            ...m,
            name: updates.name !== undefined ? updates.name : m.name,
            role: updates.role,
            permissions: updates.permissions,
          };
        }
        return m;
      });
      return { ...prev, membersInfo: updatedInfo };
    });
  };

  const handleRemoveMember = async (companyId: string, email: string) => {
    await removeCompanyMember(companyId, email);
    const cleanEmail = email.toLowerCase().trim();
    setCompanies((prev) =>
      prev.map((c) =>
        c.id === companyId
          ? {
              ...c,
              memberEmails: c.memberEmails.filter((m) => m.toLowerCase().trim() !== cleanEmail),
              membersInfo: (c.membersInfo || []).filter((m) => m.email.toLowerCase().trim() !== cleanEmail),
            }
          : c
      )
    );
    setActiveCompany((prev) =>
      prev && prev.id === companyId
        ? {
            ...prev,
            memberEmails: prev.memberEmails.filter((m) => m.toLowerCase().trim() !== cleanEmail),
            membersInfo: (prev.membersInfo || []).filter((m) => m.email.toLowerCase().trim() !== cleanEmail),
          }
        : prev
    );
  };

  // --- Handlers for Expenses ---
  const handleOpenAddExpenseModal = () => {
    if (!currentUserPermissions.canCreateTransactions) {
      alert('Você não tem permissão para lançar despesas nesta empresa.');
      return;
    }
    setFinancialModalType('expense');
    setEditingFinancialItem(null);
    setFinancialPreselectedAccountId(undefined);
    setIsFinancialModalOpen(true);
  };

  const handleEditExpense = (expense: Expense) => {
    if (!currentUserPermissions.canEditTransactions) {
      alert('Você não tem permissão para editar lançamentos nesta empresa.');
      return;
    }
    setFinancialModalType('expense');
    setEditingFinancialItem(expense);
    setIsFinancialModalOpen(true);
  };

  const handleDeleteExpense = async (expenseId: string) => {
    if (!currentUserPermissions.canDeleteTransactions) {
      alert('Você não tem permissão para excluir lançamentos nesta empresa.');
      return;
    }
    await deleteExpense(expenseId);
  };

  const handleSaveExpense = async (
    expenseData: Omit<Expense, 'id' | 'createdAt'>,
    expenseId?: string
  ) => {
    if (expenseId && !currentUserPermissions.canEditTransactions) {
      alert('Você não tem permissão para editar lançamentos nesta empresa.');
      return;
    }
    if (!expenseId && !currentUserPermissions.canCreateTransactions) {
      alert('Você não tem permissão para lançar despesas nesta empresa.');
      return;
    }
    const saved = await saveExpense(expenseData, expenseId);
    if (saved) {
      const expenseYM = saved.date.substring(0, 7);
      if (expenseYM !== currentYearMonth) {
        setCurrentYearMonth(expenseYM);
      }
    }
  };

  const handleLiquidateExpense = async (expense: Expense) => {
    if (!currentUserPermissions.canEditTransactions) {
      alert('Você não tem permissão para liquidar lançamentos nesta empresa.');
      return;
    }
    await saveExpense({ ...expense, status: 'liquidated' }, expense.id);
  };

  // --- Handlers for Treasury Incomes ---
  const handleOpenAddIncomeModal = (preselectedAccountId?: string) => {
    if (!currentUserPermissions.canCreateTransactions) {
      alert('Você não tem permissão para lançar receitas nesta empresa.');
      return;
    }
    setFinancialModalType('income');
    setEditingFinancialItem(null);
    setFinancialPreselectedAccountId(preselectedAccountId);
    setIsFinancialModalOpen(true);
  };

  const handleEditIncome = (income: Income) => {
    if (!currentUserPermissions.canEditTransactions) {
      alert('Você não tem permissão para editar lançamentos nesta empresa.');
      return;
    }
    setFinancialModalType('income');
    setEditingFinancialItem(income);
    setFinancialPreselectedAccountId(income.accountId);
    setIsFinancialModalOpen(true);
  };

  const handleDeleteIncome = async (incomeId: string) => {
    if (!currentUserPermissions.canDeleteTransactions) {
      alert('Você não tem permissão para excluir lançamentos nesta empresa.');
      return;
    }
    await deleteIncome(incomeId);
  };

  const handleSaveIncome = async (
    incomeData: Omit<Income, 'id' | 'createdAt'>,
    incomeId?: string
  ) => {
    if (incomeId && !currentUserPermissions.canEditTransactions) {
      alert('Você não tem permissão para editar lançamentos nesta empresa.');
      return;
    }
    if (!incomeId && !currentUserPermissions.canCreateTransactions) {
      alert('Você não tem permissão para lançar receitas nesta empresa.');
      return;
    }
    await saveIncome(incomeData, incomeId);
    const incomeYM = incomeData.date.substring(0, 7);
    if (incomeYM !== currentYearMonth) {
      setCurrentYearMonth(incomeYM);
    }
  };

  const handleLiquidateIncome = async (income: Income) => {
    if (!currentUserPermissions.canEditTransactions) {
      alert('Você não tem permissão para liquidar lançamentos nesta empresa.');
      return;
    }
    await saveIncome({ ...income, status: 'liquidated' }, income.id);
  };

  // --- Handlers for Treasury Transfers ---
  const handleOpenAddTransferModal = (preselectedAccountId?: string) => {
    if (!currentUserPermissions.canCreateTransactions) {
      alert('Você não tem permissão para lançar transferências nesta empresa.');
      return;
    }
    setEditingTransfer(null);
    setPreselectedTransferAccountId(preselectedAccountId);
    setIsTransferModalOpen(true);
  };

  const handleEditTransfer = (transfer: AccountTransfer) => {
    if (!currentUserPermissions.canEditTransactions) {
      alert('Você não tem permissão para editar lançamentos nesta empresa.');
      return;
    }
    setEditingTransfer(transfer);
    setPreselectedTransferAccountId(transfer.fromAccountId);
    setIsTransferModalOpen(true);
  };

  const handleDeleteTransfer = async (transferId: string) => {
    if (!currentUserPermissions.canDeleteTransactions) {
      alert('Você não tem permissão para excluir lançamentos nesta empresa.');
      return;
    }
    await deleteTransfer(transferId);
  };

  const handleSaveTransfer = async (
    transferData: Omit<AccountTransfer, 'id' | 'createdAt'>,
    transferId?: string
  ) => {
    if (transferId && !currentUserPermissions.canEditTransactions) {
      alert('Você não tem permissão para editar lançamentos nesta empresa.');
      return;
    }
    if (!transferId && !currentUserPermissions.canCreateTransactions) {
      alert('Você não tem permissão para lançar transferências nesta empresa.');
      return;
    }
    await saveTransfer(transferData, transferId);
    const transferYM = transferData.date.substring(0, 7);
    if (transferYM !== currentYearMonth) {
      setCurrentYearMonth(transferYM);
    }
  };

  // --- Handlers for Treasury Accounts ---
  const handleOpenAccountModal = (account?: TreasuryAccount) => {
    if (!currentUserPermissions.canManageRegistries) {
      alert('Você não tem permissão para gerenciar contas bancárias nesta empresa.');
      return;
    }
    setEditingAccount(account || null);
    setIsAccountModalOpen(true);
  };

  const handleDeleteAccount = async (accountId: string) => {
    if (!currentUserPermissions.canManageRegistries) {
      alert('Você não tem permissão para alterar cadastros nesta empresa.');
      return;
    }
    if (accounts.length <= 1) {
      alert('Você deve manter ao menos uma conta bancária ou caixa na tesouraria.');
      return;
    }
    if (
      window.confirm(
        'Tem certeza que deseja excluir esta conta da tesouraria? Os lançamentos vinculados permanecerão no histórico.'
      )
    ) {
      await deleteAccount(accountId);
    }
  };

  // --- Handlers for Credit Cards ---
  const handleOpenAddCardModal = (card?: CreditCard) => {
    if (!currentUserPermissions.canManageRegistries) {
      alert('Você não tem permissão para gerenciar cartões nesta empresa.');
      return;
    }
    setEditingCard(card || null);
    setIsCardModalOpen(true);
  };

  const handleDeleteCard = async (cardId: string) => {
    if (!currentUserPermissions.canManageRegistries) {
      alert('Você não tem permissão para alterar cadastros nesta empresa.');
      return;
    }
    if (window.confirm('Tem certeza que deseja remover este cartão?')) {
      await deleteCard(cardId);
    }
  };

  // --- Handlers for Contacts / Favorecidos ---
  const handleOpenAddContactModal = (contact?: ContactPerson, defaultType?: ContactType) => {
    setEditingContact(contact || null);
    setContactDefaultType(defaultType);
    setIsContactModalOpen(true);
  };

  const handleDeleteContact = async (contactId: string) => {
    if (window.confirm('Deseja excluir este favorecido/contato cadastrado?')) {
      await deleteContact(contactId);
    }
  };

  // --- Handlers for Recurring Bills ---
  const handleOpenAddRecurringModal = (bill?: RecurringBill) => {
    setEditingRecurring(bill || null);
    setIsRecurringModalOpen(true);
  };

  const handleDeleteRecurring = async (billId: string) => {
    if (window.confirm('Deseja excluir esta conta ou receita fixa recorrente?')) {
      await deleteRecurring(billId);
    }
  };

  const handleTriggerRecurringBill = async (bill: RecurringBill) => {
    const targetDay = String(Math.min(Math.max(bill.dueDay, 1), 28)).padStart(2, '0');
    const billDate = `${currentYearMonth}-${targetDay}`;

    if (bill.type === 'expense') {
      await saveExpense({
        description: bill.description,
        amount: bill.amount,
        date: billDate,
        categoryId: bill.categoryId || categories[0]?.id || 'cat-moradia',
        accountId: bill.accountId || accounts[0]?.id,
        paymentMethod: 'boleto',
        contactId: bill.contactId,
        status: 'pending',
        notes: 'Lançado a partir de Conta Fixa Recorrente',
      });
      alert(`Despesa "${bill.description}" de ${formatDateBR(billDate)} lançada com sucesso no mês ${currentYearMonth}!`);
    } else {
      await saveIncome({
        description: bill.description,
        amount: bill.amount,
        date: billDate,
        accountId: bill.accountId || accounts[0]?.id || '',
        categoryId: 'cat-salario',
        contactId: bill.contactId,
        status: 'pending',
        notes: 'Lançado a partir de Receita Fixa Recorrente',
      });
      alert(`Receita "${bill.description}" de ${formatDateBR(billDate)} lançada com sucesso no mês ${currentYearMonth}!`);
    }
  };

  const handleConvertProposal = async (proposal: Proposal) => {
    if (!window.confirm(`Deseja converter a proposta "${proposal.title}" em um novo Centro de Custo?`)) return;

    const newCC = await saveCostCenter({
      name: proposal.title,
      clientId: proposal.clientId,
      status: 'active',
      budget: proposal.amount,
      startDate: new Date().toISOString().split('T')[0],
      color: '#4f46e5',
    }) as any;

    if (newCC && newCC.id) {
      // Create a pending income based on the proposal
      await saveIncome({
        description: `Receita: ${proposal.title}`,
        amount: proposal.amount,
        date: proposal.date,
        accountId: accounts[0]?.id || '',
        categoryId: 'cat-salario',
        contactId: proposal.clientId,
        status: 'pending',
        costCenterId: newCC.id,
        notes: `Gerado automaticamente da proposta: ${proposal.id}`,
      });

      alert(`Sucesso! Centro de custo "${proposal.title}" criado e receita provisionada.`);
      setActiveView('projetos');
    }
  };

  // --- Handlers for Financial Goals ---
  const handleOpenAddGoalModal = (goal?: FinancialGoal) => {
    setEditingGoal(goal || null);
    setIsGoalModalOpen(true);
  };

  const handleDeleteGoal = async (goalId: string) => {
    if (window.confirm('Tem certeza que deseja excluir esta meta financeira?')) {
      await deleteGoal(goalId);
    }
  };

  const handleUpdateGoalAmount = async (goalId: string, currentAmount: number) => {
    const goal = goals.find((g) => g.id === goalId);
    if (goal) {
      await saveGoal({ ...goal, currentAmount }, goalId);
    }
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
      | 'proposal'
      | 'costCenter'
      | 'rental'
      | 'equipment'
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
      case 'proposal':
        setEditingProposal(null);
        setIsProposalModalOpen(true);
        break;
      case 'costCenter':
        setEditingCostCenter(null);
        setIsCostCenterModalOpen(true);
        break;
      case 'rental':
        setEditingRental(null);
        setIsRentalModalOpen(true);
        break;
      case 'equipment':
        setEditingEquipment(null);
        setIsEquipmentModalOpen(true);
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
    link.setAttribute('download', `gastos_${activeCompany?.name || 'financas'}_${currentYearMonth}.csv`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  // If Firebase auth is loading
  if (authLoading) {
    return (
      <div className="min-h-screen bg-slate-900 flex flex-col items-center justify-center text-white">
        <Loader2 className="w-8 h-8 animate-spin text-indigo-500 mb-3" />
        <p className="text-sm font-medium text-slate-300">Carregando perfil e empresas...</p>
      </div>
    );
  }

  // If user is not authenticated, show AuthView
  if (!currentUser) {
    return <AuthView />;
  }

  return (
    <div className="min-h-screen bg-slate-50 flex font-sans text-slate-800 antialiased">
      <Sidebar 
        activeView={activeView}
        onViewChange={(view) => setActiveView(view as any)}
        activeCompany={activeCompany}
        onLogout={logout}
        cloudSyncStatus={cloudSyncStatus}
      />

      <div className="flex-1 flex flex-col min-w-0 overflow-hidden">
        {/* Top Header */}
        <Header
          currentYearMonth={currentYearMonth}
          activeTab={'expenses'} // Placeholder for legacy compatibility if needed
          onTabChange={() => {}} // Placeholder
          totalTreasuryBalance={totalTreasuryBalance}
          onChangeMonth={setCurrentYearMonth}
          onOpenAddModal={handleOpenAddExpenseModal}
          onOpenCategoryModal={() => setIsCategoryModalOpen(true)}
          onOpenIncomeModal={() => handleOpenAddIncomeModal()}
          onOpenTransferModal={() => handleOpenAddTransferModal()}
          onOpenQuickRegisterModal={() => setIsQuickRegisterOpen(true)}
          onExportData={handleExportExpensesCSV}
          onResetData={() => setIsResetConfirmOpen(true)}
          onOpenBackupModal={() => setIsBackupModalOpen(true)}
          cloudSyncStatus={cloudSyncStatus}
          companies={companies}
          activeCompany={activeCompany}
          onSelectCompany={handleSelectCompany}
          onOpenCreateCompany={() => setIsCreateCompanyOpen(true)}
          onOpenManageMembers={() => setIsManageMembersOpen(true)}
          currentUserEmail={currentUser.email}
          currentUserName={currentUser.displayName}
          onLogout={logout}
        />

        {/* Main Content Area */}
        <main className="flex-1 overflow-y-auto p-4 sm:p-6 lg:p-8">
          {/* Error Alert Banner */}
          {cloudSyncStatus === 'error' && (
            <div className="mb-6 p-4 bg-rose-50 border border-rose-200 rounded-2xl flex flex-col sm:flex-row sm:items-center justify-between gap-3 shadow-sm">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-full bg-rose-100 flex items-center justify-center shrink-0">
                  <ShieldCheck className="w-5 h-5 text-rose-600" />
                </div>
                <div>
                  <h4 className="text-sm font-bold text-rose-950">Falha na Sincronização</h4>
                  <p className="text-xs text-rose-800 leading-relaxed max-w-xl">
                    Verifique sua conexão ou permissões de acesso.
                    {lastError && <code className="block mt-1 font-mono text-[10px] bg-rose-100 p-1 rounded">{lastError}</code>}
                  </p>
                </div>
              </div>
              <button
                onClick={() => window.location.reload()}
                className="px-4 py-2 bg-rose-600 hover:bg-rose-700 text-white text-xs font-bold rounded-xl transition flex items-center justify-center gap-2"
              >
                <RotateCcw className="w-3.5 h-3.5" />
                Recarregar
              </button>
            </div>
          )}

          {activeView === 'dashboard' && (
            <DashboardView 
              expenses={expenses}
              incomes={incomes}
              accounts={accounts}
              transfers={transfers}
              costCenters={costCenters}
              proposals={proposals}
              onAction={handleQuickRegisterAction}
              onViewChange={(view) => setActiveView(view as any)}
            />
          )}

          {activeView === 'comercial' && (
            <CommercialView 
              proposals={proposals}
              rentals={rentals}
              contacts={contacts}
              equipment={equipment}
              onOpenProposalModal={(p) => {
                setEditingProposal(p || null);
                setIsProposalModalOpen(true);
              }}
              onDeleteProposal={deleteProposal}
              onOpenRentalModal={(r) => {
                setEditingRental(r || null);
                setIsRentalModalOpen(true);
              }}
              onDeleteRental={deleteRental}
              onConvertProposal={handleConvertProposal}
            />
          )}

          {activeView === 'projetos' && (
            <ProjectsView 
              costCenters={costCenters}
              contacts={contacts}
              onOpenCostCenterModal={(cc) => {
                setEditingCostCenter(cc || null);
                setIsCostCenterModalOpen(true);
              }}
              onDeleteCostCenter={deleteCostCenter}
            />
          )}

          {activeView === 'financeiro' && (
            <FinancialView 
              expenses={expenses}
              incomes={incomes}
              accounts={accounts}
              transfers={transfers}
              categories={categories}
              cards={cards}
              contacts={contacts}
              costCenters={costCenters}
              currentYearMonth={currentYearMonth}
              onMonthChange={setCurrentYearMonth}
              onOpenExpenseModal={handleOpenAddExpenseModal}
              onOpenIncomeModal={() => handleOpenAddIncomeModal()}
              onOpenTransferModal={() => handleOpenAddTransferModal()}
              onEditExpense={handleEditExpense}
              onDeleteExpense={handleDeleteExpense}
              onEditIncome={handleEditIncome}
              onDeleteIncome={handleDeleteIncome}
              onEditTransfer={handleEditTransfer}
              onDeleteTransfer={handleDeleteTransfer}
              onLiquidateExpense={handleLiquidateExpense}
              onLiquidateIncome={handleLiquidateIncome}
              onOpenAccountModal={handleOpenAccountModal}
              onDeleteAccount={handleDeleteAccount}
            />
          )}

          {activeView === 'cadastros' && (
            <RegistriesView
              cards={cards}
              contacts={contacts}
              recurringBills={recurringBills}
              goals={goals}
              categories={categories}
              accounts={accounts}
              currentYearMonth={currentYearMonth}
              activeCompany={activeCompany}
              currentUserEmail={currentUser.email}
              currentUserPermissions={currentUserPermissions}
              onAddMember={handleAddMember}
              onUpdateMember={handleUpdateMember}
              onRemoveMember={handleRemoveMember}
              onOpenManageMembers={() => setIsManageMembersOpen(true)}
              onOpenCardModal={handleOpenAddCardModal}
              onDeleteCard={handleDeleteCard}
              onOpenContactModal={handleOpenAddContactModal}
              onDeleteContact={handleDeleteContact}
              onOpenRecurringModal={handleOpenAddRecurringModal}
              onDeleteRecurring={handleDeleteRecurring}
              onTriggerRecurringBill={handleTriggerRecurringBill}
              onOpenGoalModal={handleOpenAddGoalModal}
              onDeleteGoal={handleDeleteGoal}
              onUpdateGoalAmount={handleUpdateGoalAmount}
              onOpenAccountModal={handleOpenAccountModal}
              onDeleteAccount={handleDeleteAccount}
              onOpenCategoryModal={() => setIsCategoryModalOpen(true)}
              onOpenExpenseModal={handleOpenAddExpenseModal}
              onOpenIncomeModal={handleOpenAddIncomeModal}
              equipment={equipment}
              onOpenEquipmentModal={(item) => {
                setEditingEquipment(item || null);
                setIsEquipmentModalOpen(true);
              }}
              onDeleteEquipment={deleteEquipment}
            />
          )}

          {activeView === 'relatorios' && (
            <ReportsView
              expenses={expenses}
              incomes={incomes}
              categories={categories}
              accounts={accounts}
              selectedMonth={currentYearMonth}
              onMonthChange={setCurrentYearMonth}
            />
          )}
        </main>
      </div>

      {/* Modals */}
      <FinancialFormModal
        type={financialModalType}
        isOpen={isFinancialModalOpen}
        onClose={() => setIsFinancialModalOpen(false)}
        onSave={financialModalType === 'expense' ? handleSaveExpense : handleSaveIncome}
        editingItem={editingFinancialItem}
        categories={categories}
        accounts={accounts}
        cards={cards}
        contacts={contacts}
        costCenters={costCenters}
        defaultDate={`${currentYearMonth}-01`}
      />

      <CategoryManagerModal
        isOpen={isCategoryModalOpen}
        onClose={() => setIsCategoryModalOpen(false)}
        categories={categories}
        onAddCategory={addCategory}
        onDeleteCategory={deleteCategory}
        onUpdateCategoryBudget={updateCategoryBudget}
      />

      <MonthlyBudgetModal
        isOpen={isBudgetModalOpen}
        onClose={() => setIsBudgetModalOpen(false)}
        yearMonth={currentYearMonth}
        currentBudget={currentBudget}
        onSaveBudget={saveMonthlyBudget}
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
        onSave={saveAccount}
        editingAccount={editingAccount}
      />

      {/* Registries Form Modals */}
      <CreditCardFormModal
        isOpen={isCardModalOpen}
        onClose={() => setIsCardModalOpen(false)}
        onSave={saveCard}
        editingCard={editingCard}
        accounts={accounts}
      />

      <ContactFormModal
        isOpen={isContactModalOpen}
        onClose={() => setIsContactModalOpen(false)}
        onSave={saveContact}
        editingContact={editingContact}
        defaultType={contactDefaultType}
      />

      <RecurringBillFormModal
        isOpen={isRecurringModalOpen}
        onClose={() => setIsRecurringModalOpen(false)}
        onSave={saveRecurring}
        editingBill={editingRecurring}
        categories={categories}
        accounts={accounts}
        cards={cards}
        contacts={contacts}
      />

      <GoalFormModal
        isOpen={isGoalModalOpen}
        onClose={() => setIsGoalModalOpen(false)}
        onSave={saveGoal}
        editingGoal={editingGoal}
      />

      <QuickRegisterModal
        isOpen={isQuickRegisterOpen}
        onClose={() => setIsQuickRegisterOpen(false)}
        onSelectAction={handleQuickRegisterAction}
      />

      <CostCenterModal
        isOpen={isCostCenterModalOpen}
        onClose={() => setIsCostCenterModalOpen(false)}
        onSave={saveCostCenter}
        editingCC={editingCostCenter}
        contacts={contacts}
      />

      <ProposalModal
        isOpen={isProposalModalOpen}
        onClose={() => setIsProposalModalOpen(false)}
        onSave={saveProposal}
        editingProposal={editingProposal}
        contacts={contacts}
      />

      <RentalModal
        isOpen={isRentalModalOpen}
        onClose={() => setIsRentalModalOpen(false)}
        onSave={saveRental}
        editingRental={editingRental}
        contacts={contacts}
        equipment={equipment}
      />

      <EquipmentModal
        isOpen={isEquipmentModalOpen}
        onClose={() => setIsEquipmentModalOpen(false)}
        onSave={saveEquipment}
        editingItem={editingEquipment}
      />

      {/* Multi-Company Modals */}
      <CreateCompanyModal
        isOpen={isCreateCompanyOpen}
        onClose={() => setIsCreateCompanyOpen(false)}
        onCreate={handleCreateCompany}
      />

      <ManageMembersModal
        isOpen={isManageMembersOpen}
        onClose={() => setIsManageMembersOpen(false)}
        company={activeCompany}
        currentUserEmail={currentUser.email}
        onAddMember={handleAddMember}
        onUpdateMember={handleUpdateMember}
        onRemoveMember={handleRemoveMember}
      />

      <ResetConfirmModal
        isOpen={isResetConfirmOpen}
        onClose={() => setIsResetConfirmOpen(false)}
        onConfirmReset={async (keepCategories, createCleanAccount) => {
          await clearAllData(keepCategories, createCleanAccount);
        }}
        companyName={activeCompany?.name || 'Ambiente Selecionado'}
      />

      <BackupSecurityModal
        isOpen={isBackupModalOpen}
        onClose={() => setIsBackupModalOpen(false)}
        companies={companies}
        currentUserEmail={currentUser.email}
        cloudSyncStatus={cloudSyncStatus}
        lastError={lastError}
        onRefreshData={() => window.location.reload()}
      />

      <DatabaseSettingsModal
        isOpen={isDbSettingsOpen}
        onClose={() => setIsDbSettingsOpen(false)}
      />

      {/* Database Status Notification */}
      {dbHealth?.database === 'missing' && (
        <div className="fixed bottom-24 right-6 left-6 md:left-auto md:w-96 z-50 animate-in slide-in-from-bottom-4 duration-500">
          <div className="bg-amber-50 border border-amber-200 rounded-2xl p-4 shadow-xl flex items-start gap-4">
            <div className="w-10 h-10 rounded-full bg-amber-100 flex items-center justify-center flex-shrink-0">
              <Database className="w-5 h-5 text-amber-600" />
            </div>
            <div className="flex-1">
              <h4 className="text-sm font-bold text-amber-900">Configuração de Banco SQL (Neon)</h4>
              <p className="text-xs text-amber-700 mt-1 leading-relaxed">
                Para resolver os erros de conexão, cole sua <strong>DATABASE_URL</strong> do Neon nas <strong>Configurações (Engrenagem)</strong> do sistema.
              </p>
              <div className="mt-3 flex gap-2">
                <button 
                  onClick={() => setIsDbSettingsOpen(true)}
                  className="text-[10px] font-bold px-3 py-1.5 bg-amber-600 text-white rounded-lg hover:bg-amber-700 transition-colors"
                >
                  Configurar agora
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
