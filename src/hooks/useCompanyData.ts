import { useCallback, useEffect, useState } from 'react';
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
  CostCenter,
  Proposal,
  Equipment,
  Rental,
} from '../types';
import { DEFAULT_CATEGORIES } from '../data/defaultCategories';
import { getInitialExpenses } from '../data/sampleExpenses';
import { DEFAULT_ACCOUNTS, getInitialIncomes, getInitialTransfers } from '../data/defaultTreasury';
import {
  DEFAULT_CREDIT_CARDS,
  DEFAULT_CONTACTS,
  DEFAULT_RECURRING_BILLS,
  DEFAULT_GOALS,
} from '../data/defaultRegistries';
import { getCurrentYearMonth } from '../utils/formatters';
import {
  subscribeToCompanySubcollection,
  saveCompanyDoc,
  deleteCompanyDoc,
  clearCompanyData,
} from '../services/companyService';

type SyncStatus = 'synced' | 'syncing' | 'error';

type Setter<T> = React.Dispatch<React.SetStateAction<T[]>>;

export function useCompanyData(companyId: string | null) {
  const getStorageKey = (prefix: string) => `cg_${companyId || 'default'}_${prefix}`;

  const [expenses, setExpenses] = useState<Expense[]>([]);
  const [categories, setCategories] = useState<Category[]>(DEFAULT_CATEGORIES);
  const [budgets, setBudgets] = useState<MonthlyBudget>({ [getCurrentYearMonth()]: 0 });
  const [accounts, setAccounts] = useState<TreasuryAccount[]>([]);
  const [incomes, setIncomes] = useState<Income[]>([]);
  const [transfers, setTransfers] = useState<AccountTransfer[]>([]);
  const [cards, setCards] = useState<CreditCard[]>([]);
  const [contacts, setContacts] = useState<ContactPerson[]>([]);
  const [recurringBills, setRecurringBills] = useState<RecurringBill[]>([]);
  const [goals, setGoals] = useState<FinancialGoal[]>([]);
  const [costCenters, setCostCenters] = useState<CostCenter[]>([]);
  const [proposals, setProposals] = useState<Proposal[]>([]);
  const [equipment, setEquipment] = useState<Equipment[]>([]);
  const [rentals, setRentals] = useState<Rental[]>([]);
  const [loading, setLoading] = useState(true);
  const [cloudSyncStatus, setCloudSyncStatus] = useState<SyncStatus>('synced');
  const [lastError, setLastError] = useState<string | null>(null);

  const readArray = <T,>(key: string, fallback: T[] = []): T[] => {
    try {
      const raw = localStorage.getItem(key);
      if (!raw) return fallback;
      const value = JSON.parse(raw);
      return Array.isArray(value) ? value : fallback;
    } catch {
      return fallback;
    }
  };

  const persistLocal = <T,>(prefix: string, items: T[]) => {
    localStorage.setItem(getStorageKey(prefix), JSON.stringify(items));
  };

  useEffect(() => {
    if (!companyId) {
      setLoading(false);
      return;
    }

    setLoading(true);
    setExpenses(readArray<Expense>(getStorageKey('expenses')));
    setCategories(readArray<Category>(getStorageKey('categories'), DEFAULT_CATEGORIES));
    setAccounts(readArray<TreasuryAccount>(getStorageKey('accounts')));
    setIncomes(readArray<Income>(getStorageKey('incomes')));
    setTransfers(readArray<AccountTransfer>(getStorageKey('transfers')));
    setCards(readArray<CreditCard>(getStorageKey('cards')));
    setContacts(readArray<ContactPerson>(getStorageKey('contacts')));
    setRecurringBills(readArray<RecurringBill>(getStorageKey('recurring')));
    setGoals(readArray<FinancialGoal>(getStorageKey('goals')));
    setCostCenters(readArray<CostCenter>(getStorageKey('costCenters')));
    setProposals(readArray<Proposal>(getStorageKey('proposals')));
    setEquipment(readArray<Equipment>(getStorageKey('equipment')));
    setRentals(readArray<Rental>(getStorageKey('rentals')));
    try {
      const saved = localStorage.getItem(getStorageKey('budgets'));
      setBudgets(saved ? JSON.parse(saved) : { [getCurrentYearMonth()]: 0 });
    } catch {
      setBudgets({ [getCurrentYearMonth()]: 0 });
    }

    const unsubs: Array<() => void> = [];

    const wire = <T extends { id: string }>(
      collectionName: string,
      cacheName: string,
      setter: Setter<T>,
      fallback: T[] = []
    ) => {
      unsubs.push(
        subscribeToCompanySubcollection<T>(
          companyId,
          collectionName,
          (remote) => {
            const cached = readArray<T>(getStorageKey(cacheName), fallback);
            if (remote.length === 0 && cached.length > 0) {
              setter(cached);
              void Promise.all(cached.map((item) => saveCompanyDoc(companyId, collectionName, item.id, item)));
            } else if (remote.length === 0 && fallback.length > 0) {
              setter(fallback);
              persistLocal(cacheName, fallback);
              void Promise.all(fallback.map((item) => saveCompanyDoc(companyId, collectionName, item.id, item)));
            } else {
              setter(remote);
              persistLocal(cacheName, remote);
            }
            setCloudSyncStatus('synced');
            setLastError(null);
            setLoading(false);
          },
          (error) => {
            const message = error instanceof Error ? error.message : String(error);
            setCloudSyncStatus('error');
            setLastError(message);
            setLoading(false);
          }
        )
      );
    };

    wire<Expense>('expenses', 'expenses', setExpenses);
    wire<Category>('categories', 'categories', setCategories, DEFAULT_CATEGORIES);
    wire<TreasuryAccount>('accounts', 'accounts', setAccounts);
    wire<Income>('incomes', 'incomes', setIncomes);
    wire<AccountTransfer>('transfers', 'transfers', setTransfers);
    wire<CreditCard>('cards', 'cards', setCards);
    wire<ContactPerson>('contacts', 'contacts', setContacts);
    wire<RecurringBill>('recurring', 'recurring', setRecurringBills);
    wire<FinancialGoal>('goals', 'goals', setGoals);
    wire<CostCenter>('costCenters', 'costCenters', setCostCenters);
    wire<Proposal>('proposals', 'proposals', setProposals);
    wire<Equipment>('equipment', 'equipment', setEquipment);
    wire<Rental>('rentals', 'rentals', setRentals);

    unsubs.push(
      subscribeToCompanySubcollection<{ id: string; ym: string; amount: number }>(
        companyId,
        'budgets',
        (items) => {
          const next: MonthlyBudget = {};
          items.forEach((item) => {
            if (item.ym) next[item.ym] = Number(item.amount) || 0;
          });
          const finalValue = Object.keys(next).length ? next : { [getCurrentYearMonth()]: 0 };
          setBudgets(finalValue);
          localStorage.setItem(getStorageKey('budgets'), JSON.stringify(finalValue));
        }
      )
    );

    return () => unsubs.forEach((unsubscribe) => unsubscribe());
  }, [companyId]);

  const makeId = (prefix: string) => `${prefix}-${Date.now()}-${Math.random().toString(36).slice(2, 7)}`;

  const saveExpense = useCallback(async (data: Omit<Expense, 'id' | 'createdAt'>, expenseId?: string) => {
    if (!companyId) return;
    setCloudSyncStatus('syncing');
    try {
      const id = expenseId || makeId('exp');
      const item: Expense = { ...data, id, createdAt: expenseId ? expenses.find((v) => v.id === id)?.createdAt || Date.now() : Date.now() };
      setExpenses((prev) => {
        const next = expenseId ? prev.map((v) => (v.id === id ? item : v)) : [item, ...prev];
        persistLocal('expenses', next);
        return next;
      });
      await saveCompanyDoc(companyId, 'expenses', id, item);
      setCloudSyncStatus('synced');
      setLastError(null);
      return item;
    } catch (error) {
      const message = error instanceof Error ? error.message : String(error);
      setCloudSyncStatus('error');
      setLastError(message);
      return undefined;
    }
  }, [companyId, expenses]);

  const deleteExpense = useCallback(async (id: string) => {
    if (!companyId) return;
    setExpenses((prev) => {
      const next = prev.filter((v) => v.id !== id);
      persistLocal('expenses', next);
      return next;
    });
    await deleteCompanyDoc(companyId, 'expenses', id);
  }, [companyId]);

  const saveIncome = useCallback(async (data: Omit<Income, 'id' | 'createdAt'>, incomeId?: string) => {
    if (!companyId) return;
    const id = incomeId || makeId('inc');
    const item: Income = { ...data, id, createdAt: incomeId ? incomes.find((v) => v.id === id)?.createdAt || Date.now() : Date.now() };
    setIncomes((prev) => {
      const next = incomeId ? prev.map((v) => (v.id === id ? item : v)) : [item, ...prev];
      persistLocal('incomes', next);
      return next;
    });
    await saveCompanyDoc(companyId, 'incomes', id, item);
  }, [companyId, incomes]);

  const deleteIncome = useCallback(async (id: string) => {
    if (!companyId) return;
    setIncomes((prev) => {
      const next = prev.filter((v) => v.id !== id);
      persistLocal('incomes', next);
      return next;
    });
    await deleteCompanyDoc(companyId, 'incomes', id);
  }, [companyId]);

  const saveTransfer = useCallback(async (data: Omit<AccountTransfer, 'id' | 'createdAt'>, transferId?: string) => {
    if (!companyId) return;
    const id = transferId || makeId('trf');
    const item: AccountTransfer = { ...data, id, createdAt: transferId ? transfers.find((v) => v.id === id)?.createdAt || Date.now() : Date.now() };
    setTransfers((prev) => {
      const next = transferId ? prev.map((v) => (v.id === id ? item : v)) : [item, ...prev];
      persistLocal('transfers', next);
      return next;
    });
    await saveCompanyDoc(companyId, 'transfers', id, item);
  }, [companyId, transfers]);

  const deleteTransfer = useCallback(async (id: string) => {
    if (!companyId) return;
    setTransfers((prev) => {
      const next = prev.filter((v) => v.id !== id);
      persistLocal('transfers', next);
      return next;
    });
    await deleteCompanyDoc(companyId, 'transfers', id);
  }, [companyId]);

  const saveAccount = useCallback(async (data: Omit<TreasuryAccount, 'id'>, accountId?: string) => {
    if (!companyId) return;
    const id = accountId || makeId('acc');
    const item: TreasuryAccount = { ...data, id };
    setAccounts((prev) => {
      const next = accountId ? prev.map((v) => (v.id === id ? item : v)) : [...prev, item];
      persistLocal('accounts', next);
      return next;
    });
    await saveCompanyDoc(companyId, 'accounts', id, item);
  }, [companyId]);

  const deleteAccount = useCallback(async (id: string) => {
    if (!companyId) return;
    setAccounts((prev) => {
      const next = prev.filter((v) => v.id !== id);
      persistLocal('accounts', next);
      return next;
    });
    await deleteCompanyDoc(companyId, 'accounts', id);
  }, [companyId]);

  const saveCard = useCallback(async (data: Omit<CreditCard, 'id'>, cardId?: string) => {
    if (!companyId) return;
    const id = cardId || makeId('card');
    const item: CreditCard = { ...data, id };
    setCards((prev) => {
      const next = cardId ? prev.map((v) => (v.id === id ? item : v)) : [...prev, item];
      persistLocal('cards', next);
      return next;
    });
    await saveCompanyDoc(companyId, 'cards', id, item);
  }, [companyId]);

  const deleteCard = useCallback(async (id: string) => {
    if (!companyId) return;
    setCards((prev) => {
      const next = prev.filter((v) => v.id !== id);
      persistLocal('cards', next);
      return next;
    });
    await deleteCompanyDoc(companyId, 'cards', id);
  }, [companyId]);

  const saveContact = useCallback(async (data: Omit<ContactPerson, 'id' | 'createdAt'>, contactId?: string) => {
    if (!companyId) return;
    const id = contactId || makeId('cont');
    const item: ContactPerson = { ...data, id, createdAt: contactId ? contacts.find((v) => v.id === id)?.createdAt || Date.now() : Date.now() };
    setContacts((prev) => {
      const next = contactId ? prev.map((v) => (v.id === id ? item : v)) : [...prev, item];
      persistLocal('contacts', next);
      return next;
    });
    await saveCompanyDoc(companyId, 'contacts', id, item);
  }, [companyId, contacts]);

  const deleteContact = useCallback(async (id: string) => {
    if (!companyId) return;
    setContacts((prev) => {
      const next = prev.filter((v) => v.id !== id);
      persistLocal('contacts', next);
      return next;
    });
    await deleteCompanyDoc(companyId, 'contacts', id);
  }, [companyId]);

  const saveRecurring = useCallback(async (data: Omit<RecurringBill, 'id' | 'createdAt'>, billId?: string) => {
    if (!companyId) return;
    const id = billId || makeId('rec');
    const item: RecurringBill = { ...data, id, createdAt: billId ? recurringBills.find((v) => v.id === id)?.createdAt || Date.now() : Date.now() };
    setRecurringBills((prev) => {
      const next = billId ? prev.map((v) => (v.id === id ? item : v)) : [...prev, item];
      persistLocal('recurring', next);
      return next;
    });
    await saveCompanyDoc(companyId, 'recurring', id, item);
  }, [companyId, recurringBills]);

  const deleteRecurring = useCallback(async (id: string) => {
    if (!companyId) return;
    setRecurringBills((prev) => {
      const next = prev.filter((v) => v.id !== id);
      persistLocal('recurring', next);
      return next;
    });
    await deleteCompanyDoc(companyId, 'recurring', id);
  }, [companyId]);

  const saveGoal = useCallback(async (data: Omit<FinancialGoal, 'id' | 'createdAt'>, goalId?: string) => {
    if (!companyId) return;
    const id = goalId || makeId('goal');
    const item: FinancialGoal = { ...data, id, createdAt: goalId ? goals.find((v) => v.id === id)?.createdAt || Date.now() : Date.now() };
    setGoals((prev) => {
      const next = goalId ? prev.map((v) => (v.id === id ? item : v)) : [...prev, item];
      persistLocal('goals', next);
      return next;
    });
    await saveCompanyDoc(companyId, 'goals', id, item);
  }, [companyId, goals]);

  const deleteGoal = useCallback(async (id: string) => {
    if (!companyId) return;
    setGoals((prev) => {
      const next = prev.filter((v) => v.id !== id);
      persistLocal('goals', next);
      return next;
    });
    await deleteCompanyDoc(companyId, 'goals', id);
  }, [companyId]);

  const saveCostCenter = useCallback(async (data: Omit<CostCenter, 'id' | 'createdAt'>, itemId?: string) => {
    if (!companyId) return;
    const id = itemId || makeId('cc');
    const item: CostCenter = { ...data, id, createdAt: itemId ? costCenters.find((v) => v.id === id)?.createdAt || Date.now() : Date.now() };
    setCostCenters((prev) => {
      const next = itemId ? prev.map((v) => (v.id === id ? item : v)) : [...prev, item];
      persistLocal('costCenters', next);
      return next;
    });
    await saveCompanyDoc(companyId, 'costCenters', id, item);
  }, [companyId, costCenters]);

  const deleteCostCenter = useCallback(async (id: string) => {
    if (!companyId) return;
    setCostCenters((prev) => {
      const next = prev.filter((v) => v.id !== id);
      persistLocal('costCenters', next);
      return next;
    });
    await deleteCompanyDoc(companyId, 'costCenters', id);
  }, [companyId]);

  const saveProposal = useCallback(async (data: Omit<Proposal, 'id' | 'createdAt'>, itemId?: string) => {
    if (!companyId) return;
    const id = itemId || makeId('prop');
    const item: Proposal = { ...data, id, createdAt: itemId ? proposals.find((v) => v.id === id)?.createdAt || Date.now() : Date.now() };
    setProposals((prev) => {
      const next = itemId ? prev.map((v) => (v.id === id ? item : v)) : [...prev, item];
      persistLocal('proposals', next);
      return next;
    });
    await saveCompanyDoc(companyId, 'proposals', id, item);
  }, [companyId, proposals]);

  const deleteProposal = useCallback(async (id: string) => {
    if (!companyId) return;
    setProposals((prev) => {
      const next = prev.filter((v) => v.id !== id);
      persistLocal('proposals', next);
      return next;
    });
    await deleteCompanyDoc(companyId, 'proposals', id);
  }, [companyId]);

  const saveEquipment = useCallback(async (data: Omit<Equipment, 'id'>, itemId?: string) => {
    if (!companyId) return;
    const id = itemId || makeId('eq');
    const item: Equipment = { ...data, id };
    setEquipment((prev) => {
      const next = itemId ? prev.map((v) => (v.id === id ? item : v)) : [...prev, item];
      persistLocal('equipment', next);
      return next;
    });
    await saveCompanyDoc(companyId, 'equipment', id, item);
  }, [companyId]);

  const deleteEquipment = useCallback(async (id: string) => {
    if (!companyId) return;
    setEquipment((prev) => {
      const next = prev.filter((v) => v.id !== id);
      persistLocal('equipment', next);
      return next;
    });
    await deleteCompanyDoc(companyId, 'equipment', id);
  }, [companyId]);

  const saveRental = useCallback(async (data: Omit<Rental, 'id' | 'createdAt'>, itemId?: string) => {
    if (!companyId) return;
    const id = itemId || makeId('rent');
    const item: Rental = { ...data, id, createdAt: itemId ? rentals.find((v) => v.id === id)?.createdAt || Date.now() : Date.now() };
    setRentals((prev) => {
      const next = itemId ? prev.map((v) => (v.id === id ? item : v)) : [...prev, item];
      persistLocal('rentals', next);
      return next;
    });
    await saveCompanyDoc(companyId, 'rentals', id, item);
  }, [companyId, rentals]);

  const deleteRental = useCallback(async (id: string) => {
    if (!companyId) return;
    setRentals((prev) => {
      const next = prev.filter((v) => v.id !== id);
      persistLocal('rentals', next);
      return next;
    });
    await deleteCompanyDoc(companyId, 'rentals', id);
  }, [companyId]);

  const addCategory = useCallback(async (data: Omit<Category, 'id'>) => {
    if (!companyId) return;
    const id = makeId('cat');
    const item: Category = { ...data, id };
    setCategories((prev) => {
      const next = [...prev, item];
      persistLocal('categories', next);
      return next;
    });
    await saveCompanyDoc(companyId, 'categories', id, item);
  }, [companyId]);

  const deleteCategory = useCallback(async (id: string) => {
    if (!companyId) return;
    setCategories((prev) => {
      const next = prev.filter((v) => v.id !== id);
      persistLocal('categories', next);
      return next;
    });
    await deleteCompanyDoc(companyId, 'categories', id);
  }, [companyId]);

  const updateCategoryBudget = useCallback(async (id: string, budgetLimit?: number) => {
    if (!companyId) return;
    const target = categories.find((category) => category.id === id);
    if (!target) return;
    const item = { ...target, budgetLimit };
    setCategories((prev) => {
      const next = prev.map((category) => (category.id === id ? item : category));
      persistLocal('categories', next);
      return next;
    });
    await saveCompanyDoc(companyId, 'categories', id, item);
  }, [companyId, categories]);

  const saveMonthlyBudget = useCallback(async (ym: string, amount: number) => {
    if (!companyId) return;
    setBudgets((prev) => {
      const next = { ...prev, [ym]: amount };
      localStorage.setItem(getStorageKey('budgets'), JSON.stringify(next));
      return next;
    });
    await saveCompanyDoc(companyId, 'budgets', ym, { id: ym, ym, amount });
  }, [companyId]);

  const resetData = useCallback(() => {
    if (!companyId) return;
    setExpenses(getInitialExpenses());
    setCategories(DEFAULT_CATEGORIES);
    setBudgets({ [getCurrentYearMonth()]: 3500 });
    setAccounts(DEFAULT_ACCOUNTS);
    setIncomes(getInitialIncomes());
    setTransfers(getInitialTransfers());
    setCards(DEFAULT_CREDIT_CARDS);
    setContacts(DEFAULT_CONTACTS);
    setRecurringBills(DEFAULT_RECURRING_BILLS);
    setGoals(DEFAULT_GOALS);
  }, [companyId]);

  const clearAllData = useCallback(async (keepDefaultCategories = true, createCleanDefaultAccount = true) => {
    if (!companyId) return;
    const cleanAccounts: TreasuryAccount[] = createCleanDefaultAccount
      ? [{ id: `acc-${Date.now()}`, name: 'Conta Corrente Principal', type: 'checking', initialBalance: 0, color: '#4f46e5', bankName: 'Banco Principal' }]
      : [];
    const targetCategories = keepDefaultCategories ? DEFAULT_CATEGORIES : [];

    setExpenses([]);
    setIncomes([]);
    setTransfers([]);
    setAccounts(cleanAccounts);
    setCards([]);
    setContacts([]);
    setRecurringBills([]);
    setGoals([]);
    setCostCenters([]);
    setProposals([]);
    setEquipment([]);
    setRentals([]);
    setCategories(targetCategories);
    setBudgets({ [getCurrentYearMonth()]: 0 });

    await clearCompanyData(companyId, keepDefaultCategories);
    if (cleanAccounts[0]) await saveCompanyDoc(companyId, 'accounts', cleanAccounts[0].id, cleanAccounts[0]);
    if (keepDefaultCategories) {
      await Promise.all(targetCategories.map((category) => saveCompanyDoc(companyId, 'categories', category.id, category)));
    }
  }, [companyId]);

  return {
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
    loading,
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
  };
}
