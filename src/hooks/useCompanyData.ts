import { useState, useEffect, useCallback } from 'react';
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
import { db } from '../lib/firebase';
import { doc, writeBatch } from 'firebase/firestore';

export function useCompanyData(companyId: string | null) {
  const getStorageKey = (prefix: string) => `cg_${companyId || 'default'}_${prefix}`;

  // Local states
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
  const [cloudSyncStatus, setCloudSyncStatus] = useState<'synced' | 'syncing' | 'error'>('synced');
  const [lastError, setLastError] = useState<string | null>(null);

  const parseArray = <T>(key: string, fallback: T[]): T[] => {
    try {
      const raw = localStorage.getItem(key);
      if (raw === null) return fallback;
      const parsed = JSON.parse(raw);
      return Array.isArray(parsed) ? parsed : fallback;
    } catch {
      return fallback;
    }
  };

  // Load from local cache when company changes
  useEffect(() => {
    if (!companyId) return;

    try {
      setExpenses(parseArray<Expense>(getStorageKey('expenses'), []));
      setCategories(parseArray<Category>(getStorageKey('categories'), DEFAULT_CATEGORIES));

      const savedBudg = localStorage.getItem(getStorageKey('budgets'));
      if (savedBudg) {
        try {
          const parsedBudg = JSON.parse(savedBudg);
          setBudgets(parsedBudg && typeof parsedBudg === 'object' ? parsedBudg : { [getCurrentYearMonth()]: 0 });
        } catch {
          setBudgets({ [getCurrentYearMonth()]: 0 });
        }
      } else {
        setBudgets({ [getCurrentYearMonth()]: 0 });
      }

      setAccounts(parseArray<TreasuryAccount>(getStorageKey('accounts'), []));
      setIncomes(parseArray<Income>(getStorageKey('incomes'), []));
      setTransfers(parseArray<AccountTransfer>(getStorageKey('transfers'), []));
      setCards(parseArray<CreditCard>(getStorageKey('cards'), []));
      setContacts(parseArray<ContactPerson>(getStorageKey('contacts'), []));
      setRecurringBills(parseArray<RecurringBill>(getStorageKey('recurring'), []));
      setGoals(parseArray<FinancialGoal>(getStorageKey('goals'), []));
      setCostCenters(parseArray<CostCenter>(getStorageKey('costCenters'), []));
      setProposals(parseArray<Proposal>(getStorageKey('proposals'), []));
      setEquipment(parseArray<Equipment>(getStorageKey('equipment'), []));
      setRentals(parseArray<Rental>(getStorageKey('rentals'), []));
    } catch (e) {
      console.warn('Erro ao carregar dados locais da empresa:', e);
    } finally {
      setLoading(false);
    }
  }, [companyId]);

  // Firestore real-time listeners with anti-data-loss protection
  useEffect(() => {
    if (!companyId) return;

    const unsubs: (() => void)[] = [];

    // Expenses: if Firestore has 0 items but local cache has items, rescue local items to Firestore!
    unsubs.push(
      subscribeToCompanySubcollection<Expense>(companyId, 'expenses', (items) => {
        const localSaved = parseArray<Expense>(getStorageKey('expenses'), []);
        if ((!items || items.length === 0) && localSaved.length > 0) {
          // Rescue local data: upload to Firestore cloud so it is never lost during updates!
          localSaved.forEach((exp) => {
            saveCompanyDoc(companyId, 'expenses', exp.id, exp);
          });
          setExpenses(localSaved);
        } else {
          const list = items || [];
          setExpenses(list);
          localStorage.setItem(getStorageKey('expenses'), JSON.stringify(list));
        }
        setCloudSyncStatus('synced');
        setLastError(null);
      }, (err) => {
        setCloudSyncStatus('error');
        setLastError(err instanceof Error ? err.message : String(err));
      })
    );

    // Categories
    unsubs.push(
      subscribeToCompanySubcollection<Category>(companyId, 'categories', (items) => {
        if (!items || items.length === 0) {
          const localSaved = parseArray<Category>(getStorageKey('categories'), DEFAULT_CATEGORIES);
          localSaved.forEach((cat) => {
            saveCompanyDoc(companyId, 'categories', cat.id, cat);
          });
          setCategories(localSaved);
        } else {
          setCategories(items);
          localStorage.setItem(getStorageKey('categories'), JSON.stringify(items));
        }
      })
    );

    // Accounts
    unsubs.push(
      subscribeToCompanySubcollection<TreasuryAccount>(companyId, 'accounts', (items) => {
        const localSaved = parseArray<TreasuryAccount>(getStorageKey('accounts'), []);
        if ((!items || items.length === 0) && localSaved.length > 0) {
          localSaved.forEach((acc) => {
            saveCompanyDoc(companyId, 'accounts', acc.id, acc);
          });
          setAccounts(localSaved);
        } else {
          const list = items || [];
          setAccounts(list);
          localStorage.setItem(getStorageKey('accounts'), JSON.stringify(list));
        }
      })
    );

    // Incomes
    unsubs.push(
      subscribeToCompanySubcollection<Income>(companyId, 'incomes', (items) => {
        const localSaved = parseArray<Income>(getStorageKey('incomes'), []);
        if ((!items || items.length === 0) && localSaved.length > 0) {
          localSaved.forEach((inc) => {
            saveCompanyDoc(companyId, 'incomes', inc.id, inc);
          });
          setIncomes(localSaved);
        } else {
          const list = items || [];
          setIncomes(list);
          localStorage.setItem(getStorageKey('incomes'), JSON.stringify(list));
        }
      })
    );

    // Transfers
    unsubs.push(
      subscribeToCompanySubcollection<AccountTransfer>(companyId, 'transfers', (items) => {
        const localSaved = parseArray<AccountTransfer>(getStorageKey('transfers'), []);
        if ((!items || items.length === 0) && localSaved.length > 0) {
          localSaved.forEach((trf) => {
            saveCompanyDoc(companyId, 'transfers', trf.id, trf);
          });
          setTransfers(localSaved);
        } else {
          const list = items || [];
          setTransfers(list);
          localStorage.setItem(getStorageKey('transfers'), JSON.stringify(list));
        }
      })
    );

    // Cards
    unsubs.push(
      subscribeToCompanySubcollection<CreditCard>(companyId, 'cards', (items) => {
        const localSaved = parseArray<CreditCard>(getStorageKey('cards'), []);
        if ((!items || items.length === 0) && localSaved.length > 0) {
          localSaved.forEach((c) => {
            saveCompanyDoc(companyId, 'cards', c.id, c);
          });
          setCards(localSaved);
        } else {
          const list = items || [];
          setCards(list);
          localStorage.setItem(getStorageKey('cards'), JSON.stringify(list));
        }
      })
    );

    // Contacts
    unsubs.push(
      subscribeToCompanySubcollection<ContactPerson>(companyId, 'contacts', (items) => {
        const localSaved = parseArray<ContactPerson>(getStorageKey('contacts'), []);
        if ((!items || items.length === 0) && localSaved.length > 0) {
          localSaved.forEach((cp) => {
            saveCompanyDoc(companyId, 'contacts', cp.id, cp);
          });
          setContacts(localSaved);
        } else {
          const list = items || [];
          setContacts(list);
          localStorage.setItem(getStorageKey('contacts'), JSON.stringify(list));
        }
      })
    );

    // Recurring
    unsubs.push(
      subscribeToCompanySubcollection<RecurringBill>(companyId, 'recurring', (items) => {
        const localSaved = parseArray<RecurringBill>(getStorageKey('recurring'), []);
        if ((!items || items.length === 0) && localSaved.length > 0) {
          localSaved.forEach((r) => {
            saveCompanyDoc(companyId, 'recurring', r.id, r);
          });
          setRecurringBills(localSaved);
        } else {
          const list = items || [];
          setRecurringBills(list);
          localStorage.setItem(getStorageKey('recurring'), JSON.stringify(list));
        }
      })
    );

    // Goals
    unsubs.push(
      subscribeToCompanySubcollection<FinancialGoal>(companyId, 'goals', (items) => {
        const localSaved = parseArray<FinancialGoal>(getStorageKey('goals'), []);
        if ((!items || items.length === 0) && localSaved.length > 0) {
          localSaved.forEach((g) => {
            saveCompanyDoc(companyId, 'goals', g.id, g);
          });
          setGoals(localSaved);
        } else {
          const list = items || [];
          setGoals(list);
          localStorage.setItem(getStorageKey('goals'), JSON.stringify(list));
        }
      })
    );

      unsubs.push(
        subscribeToCompanySubcollection<CostCenter>(companyId, 'costCenters', (items) => {
          setCostCenters(items || []);
          localStorage.setItem(getStorageKey('costCenters'), JSON.stringify(items || []));
        })
      );
  
      unsubs.push(
        subscribeToCompanySubcollection<Proposal>(companyId, 'proposals', (items) => {
          setProposals(items || []);
          localStorage.setItem(getStorageKey('proposals'), JSON.stringify(items || []));
        })
      );
  
      unsubs.push(
        subscribeToCompanySubcollection<Equipment>(companyId, 'equipment', (items) => {
          setEquipment(items || []);
          localStorage.setItem(getStorageKey('equipment'), JSON.stringify(items || []));
        })
      );
  
      unsubs.push(
        subscribeToCompanySubcollection<Rental>(companyId, 'rentals', (items) => {
          setRentals(items || []);
          localStorage.setItem(getStorageKey('rentals'), JSON.stringify(items || []));
        })
      );
  
      return () => {
      unsubs.forEach((unsub) => unsub());
    };
  }, [companyId]);

  // Mutations
  const saveExpense = useCallback(
    async (expenseData: Omit<Expense, 'id' | 'createdAt'>, expenseId?: string) => {
      if (!companyId) return;
      setCloudSyncStatus('syncing');
      try {
        const id = expenseId || `exp-${Date.now()}-${Math.random().toString(36).substring(2, 6)}`;
        const newExpense: Expense = {
          ...expenseData,
          id,
          createdAt: expenseId ? (expenses.find((e) => e.id === expenseId)?.createdAt || Date.now()) : Date.now(),
        };

        setExpenses((prev) => {
          const next = expenseId ? prev.map((e) => (e.id === expenseId ? newExpense : e)) : [newExpense, ...prev];
          localStorage.setItem(getStorageKey('expenses'), JSON.stringify(next));
          return next;
        });

        await saveCompanyDoc(companyId, 'expenses', id, newExpense);
        setCloudSyncStatus('synced');
        setLastError(null);
        console.log(`[useCompanyData] Despesa salva com sucesso: ${id}`);
        return newExpense;
      } catch (err) {
        const errorMessage = err instanceof Error ? err.message : String(err);
        console.error('[useCompanyData] Erro ao salvar despesa:', errorMessage);
        setCloudSyncStatus('error');
        setLastError(`Erro ao salvar despesa: ${errorMessage}`);
        return undefined;
      }
    },
    [companyId, expenses]
  );

  const deleteExpense = useCallback(
    async (id: string) => {
      if (!companyId) return;
      setCloudSyncStatus('syncing');
      try {
        setExpenses((prev) => {
          const next = prev.filter((e) => e.id !== id);
          localStorage.setItem(getStorageKey('expenses'), JSON.stringify(next));
          return next;
        });
        await deleteCompanyDoc(companyId, 'expenses', id);
        setCloudSyncStatus('synced');
      } catch (err) {
        console.error('Erro ao excluir despesa:', err);
        setCloudSyncStatus('error');
      }
    },
    [companyId]
  );

  const saveIncome = useCallback(
    async (incomeData: Omit<Income, 'id' | 'createdAt'>, incomeId?: string) => {
      if (!companyId) return;
      setCloudSyncStatus('syncing');
      try {
        const id = incomeId || `inc-${Date.now()}-${Math.random().toString(36).substring(2, 6)}`;
        const newIncome: Income = {
          ...incomeData,
          id,
          createdAt: incomeId ? (incomes.find((i) => i.id === incomeId)?.createdAt || Date.now()) : Date.now(),
        };

        setIncomes((prev) => {
          const next = incomeId ? prev.map((i) => (i.id === incomeId ? newIncome : i)) : [newIncome, ...prev];
          localStorage.setItem(getStorageKey('incomes'), JSON.stringify(next));
          return next;
        });

        await saveCompanyDoc(companyId, 'incomes', id, newIncome);
        setCloudSyncStatus('synced');
        setLastError(null);
        console.log(`[useCompanyData] Receita salva com sucesso: ${id}`);
      } catch (err) {
        const errorMessage = err instanceof Error ? err.message : String(err);
        console.error('[useCompanyData] Erro ao salvar receita:', errorMessage);
        setCloudSyncStatus('error');
        setLastError(`Erro ao salvar receita: ${errorMessage}`);
      }
    },
    [companyId, incomes]
  );

  const deleteIncome = useCallback(
    async (id: string) => {
      if (!companyId) return;
      setCloudSyncStatus('syncing');
      try {
        setIncomes((prev) => {
          const next = prev.filter((i) => i.id !== id);
          localStorage.setItem(getStorageKey('incomes'), JSON.stringify(next));
          return next;
        });
        await deleteCompanyDoc(companyId, 'incomes', id);
        setCloudSyncStatus('synced');
      } catch (err) {
        console.error('Erro ao excluir receita:', err);
        setCloudSyncStatus('error');
      }
    },
    [companyId]
  );

  const saveTransfer = useCallback(
    async (transferData: Omit<AccountTransfer, 'id' | 'createdAt'>, transferId?: string) => {
      if (!companyId) return;
      setCloudSyncStatus('syncing');
      try {
        const id = transferId || `trf-${Date.now()}-${Math.random().toString(36).substring(2, 6)}`;
        const newTransfer: AccountTransfer = {
          ...transferData,
          id,
          createdAt: transferId ? (transfers.find((t) => t.id === transferId)?.createdAt || Date.now()) : Date.now(),
        };

        setTransfers((prev) => {
          const next = transferId ? prev.map((t) => (t.id === transferId ? newTransfer : t)) : [newTransfer, ...prev];
          localStorage.setItem(getStorageKey('transfers'), JSON.stringify(next));
          return next;
        });

        await saveCompanyDoc(companyId, 'transfers', id, newTransfer);
        setCloudSyncStatus('synced');
        setLastError(null);
        console.log(`[useCompanyData] Transferência salva com sucesso: ${id}`);
      } catch (err) {
        const errorMessage = err instanceof Error ? err.message : String(err);
        console.error('[useCompanyData] Erro ao salvar transferência:', errorMessage);
        setCloudSyncStatus('error');
        setLastError(`Erro ao salvar transferência: ${errorMessage}`);
      }
    },
    [companyId, transfers]
  );

  const deleteTransfer = useCallback(
    async (id: string) => {
      if (!companyId) return;
      setTransfers((prev) => {
        const next = prev.filter((t) => t.id !== id);
        localStorage.setItem(getStorageKey('transfers'), JSON.stringify(next));
        return next;
      });
      await deleteCompanyDoc(companyId, 'transfers', id);
    },
    [companyId]
  );

  const saveAccount = useCallback(
    async (accData: Omit<TreasuryAccount, 'id'>, accountId?: string) => {
      if (!companyId) return;
      setCloudSyncStatus('syncing');
      try {
        const id = accountId || `acc-${Date.now()}-${Math.random().toString(36).substring(2, 6)}`;
        const newAcc: TreasuryAccount = { ...accData, id };
  
        setAccounts((prev) => {
          const next = accountId ? prev.map((a) => (a.id === accountId ? newAcc : a)) : [...prev, newAcc];
          localStorage.setItem(getStorageKey('accounts'), JSON.stringify(next));
          return next;
        });
  
        await saveCompanyDoc(companyId, 'accounts', id, newAcc);
        setCloudSyncStatus('synced');
        setLastError(null);
      } catch (err) {
        const errorMessage = err instanceof Error ? err.message : String(err);
        console.error('[useCompanyData] Erro ao salvar conta:', errorMessage);
        setCloudSyncStatus('error');
        setLastError(`Erro ao salvar conta: ${errorMessage}`);
      }
    },
    [companyId]
  );

  const deleteAccount = useCallback(
    async (id: string) => {
      if (!companyId) return;
      setAccounts((prev) => {
        const next = prev.filter((a) => a.id !== id);
        localStorage.setItem(getStorageKey('accounts'), JSON.stringify(next));
        return next;
      });
      await deleteCompanyDoc(companyId, 'accounts', id);
    },
    [companyId]
  );

  const saveCard = useCallback(
    async (cardData: Omit<CreditCard, 'id'>, cardId?: string) => {
      if (!companyId) return;
      setCloudSyncStatus('syncing');
      try {
        const id = cardId || `card-${Date.now()}-${Math.random().toString(36).substring(2, 6)}`;
        const newCard: CreditCard = { ...cardData, id };

        setCards((prev) => {
          const next = cardId ? prev.map((c) => (c.id === cardId ? newCard : c)) : [...prev, newCard];
          localStorage.setItem(getStorageKey('cards'), JSON.stringify(next));
          return next;
        });

        await saveCompanyDoc(companyId, 'cards', id, newCard);
        setCloudSyncStatus('synced');
      } catch (err) {
        console.error('Erro ao salvar cartão:', err);
        setCloudSyncStatus('error');
      }
    },
    [companyId]
  );

  const deleteCard = useCallback(
    async (id: string) => {
      if (!companyId) return;
      setCards((prev) => {
        const next = prev.filter((c) => c.id !== id);
        localStorage.setItem(getStorageKey('cards'), JSON.stringify(next));
        return next;
      });
      await deleteCompanyDoc(companyId, 'cards', id);
    },
    [companyId]
  );

  const saveContact = useCallback(
    async (contactData: Omit<ContactPerson, 'id' | 'createdAt'>, contactId?: string) => {
      if (!companyId) return;
      setCloudSyncStatus('syncing');
      try {
        const id = contactId || `cont-${Date.now()}-${Math.random().toString(36).substring(2, 6)}`;
        const newContact: ContactPerson = {
          ...contactData,
          id,
          createdAt: contactId ? (contacts.find((c) => c.id === contactId)?.createdAt || Date.now()) : Date.now(),
        };

        setContacts((prev) => {
          const next = contactId ? prev.map((c) => (c.id === contactId ? newContact : c)) : [...prev, newContact];
          localStorage.setItem(getStorageKey('contacts'), JSON.stringify(next));
          return next;
        });

        await saveCompanyDoc(companyId, 'contacts', id, newContact);
        setCloudSyncStatus('synced');
      } catch (err) {
        console.error('Erro ao salvar contato:', err);
        setCloudSyncStatus('error');
      }
    },
    [companyId, contacts]
  );

  const deleteContact = useCallback(
    async (id: string) => {
      if (!companyId) return;
      setCloudSyncStatus('syncing');
      try {
        setContacts((prev) => {
          const next = prev.filter((c) => c.id !== id);
          localStorage.setItem(getStorageKey('contacts'), JSON.stringify(next));
          return next;
        });
        await deleteCompanyDoc(companyId, 'contacts', id);
        setCloudSyncStatus('synced');
      } catch (err) {
        console.error('Erro ao deletar contato:', err);
        setCloudSyncStatus('error');
      }
    },
    [companyId]
  );

  const saveRecurring = useCallback(
    async (billData: Omit<RecurringBill, 'id' | 'createdAt'>, billId?: string) => {
      if (!companyId) return;
      setCloudSyncStatus('syncing');
      try {
        const id = billId || `rec-${Date.now()}-${Math.random().toString(36).substring(2, 6)}`;
        const newBill: RecurringBill = {
          ...billData,
          id,
          createdAt: billId ? (recurringBills.find((b) => b.id === billId)?.createdAt || Date.now()) : Date.now(),
        };

        setRecurringBills((prev) => {
          const next = billId ? prev.map((b) => (b.id === billId ? newBill : b)) : [...prev, newBill];
          localStorage.setItem(getStorageKey('recurring'), JSON.stringify(next));
          return next;
        });

        await saveCompanyDoc(companyId, 'recurring', id, newBill);
        setCloudSyncStatus('synced');
      } catch (err) {
        console.error('Erro ao salvar conta recorrente:', err);
        setCloudSyncStatus('error');
      }
    },
    [companyId, recurringBills]
  );

  const deleteRecurring = useCallback(
    async (id: string) => {
      if (!companyId) return;
      setRecurringBills((prev) => {
        const next = prev.filter((b) => b.id !== id);
        localStorage.setItem(getStorageKey('recurring'), JSON.stringify(next));
        return next;
      });
      await deleteCompanyDoc(companyId, 'recurring', id);
    },
    [companyId]
  );

  const saveGoal = useCallback(
    async (goalData: Omit<FinancialGoal, 'id' | 'createdAt'>, goalId?: string) => {
      if (!companyId) return;
      setCloudSyncStatus('syncing');
      try {
        const id = goalId || `goal-${Date.now()}-${Math.random().toString(36).substring(2, 6)}`;
        const newGoal: FinancialGoal = {
          ...goalData,
          id,
          createdAt: goalId ? (goals.find((g) => g.id === goalId)?.createdAt || Date.now()) : Date.now(),
        };
  
        setGoals((prev) => {
          const next = goalId ? prev.map((g) => (g.id === goalId ? newGoal : g)) : [...prev, newGoal];
          localStorage.setItem(getStorageKey('goals'), JSON.stringify(next));
          return next;
        });
  
        await saveCompanyDoc(companyId, 'goals', id, newGoal);
        setCloudSyncStatus('synced');
        setLastError(null);
      } catch (err) {
        const errorMessage = err instanceof Error ? err.message : String(err);
        console.error('[useCompanyData] Erro ao salvar meta:', errorMessage);
        setCloudSyncStatus('error');
        setLastError(`Erro ao salvar meta: ${errorMessage}`);
      }
    },
    [companyId, goals]
  );

  const deleteGoal = useCallback(
    async (id: string) => {
      if (!companyId) return;
      setGoals((prev) => {
        const next = prev.filter((g) => g.id !== id);
        localStorage.setItem(getStorageKey('goals'), JSON.stringify(next));
        return next;
      });
      await deleteCompanyDoc(companyId, 'goals', id);
    },
    [companyId]
  );

  const saveCostCenter = useCallback(
    async (data: Omit<CostCenter, 'id' | 'createdAt'>, id?: string) => {
      if (!companyId) return;
      const docId = id || `cc-${Date.now()}`;
      const newObj: CostCenter = {
        ...data,
        id: docId,
        createdAt: id ? (costCenters.find((c) => c.id === id)?.createdAt || Date.now()) : Date.now(),
      };
      setCostCenters((prev) => {
        const next = id ? prev.map((c) => (c.id === id ? newObj : c)) : [...prev, newObj];
        localStorage.setItem(getStorageKey('costCenters'), JSON.stringify(next));
        return next;
      });
      await saveCompanyDoc(companyId, 'costCenters', docId, newObj);
    },
    [companyId, costCenters]
  );

  const deleteCostCenter = useCallback(
    async (id: string) => {
      if (!companyId) return;
      setCostCenters((prev) => {
        const next = prev.filter((c) => c.id !== id);
        localStorage.setItem(getStorageKey('costCenters'), JSON.stringify(next));
        return next;
      });
      await deleteCompanyDoc(companyId, 'costCenters', id);
    },
    [companyId]
  );

  const saveProposal = useCallback(
    async (data: Omit<Proposal, 'id' | 'createdAt'>, id?: string) => {
      if (!companyId) return;
      const docId = id || `prop-${Date.now()}`;
      const newObj: Proposal = {
        ...data,
        id: docId,
        createdAt: id ? (proposals.find((p) => p.id === id)?.createdAt || Date.now()) : Date.now(),
      };
      setProposals((prev) => {
        const next = id ? prev.map((p) => (p.id === id ? newObj : p)) : [...prev, newObj];
        localStorage.setItem(getStorageKey('proposals'), JSON.stringify(next));
        return next;
      });
      await saveCompanyDoc(companyId, 'proposals', docId, newObj);
    },
    [companyId, proposals]
  );

  const deleteProposal = useCallback(
    async (id: string) => {
      if (!companyId) return;
      setProposals((prev) => {
        const next = prev.filter((p) => p.id !== id);
        localStorage.setItem(getStorageKey('proposals'), JSON.stringify(next));
        return next;
      });
      await deleteCompanyDoc(companyId, 'proposals', id);
    },
    [companyId]
  );

  const saveEquipment = useCallback(
    async (data: Omit<Equipment, 'id'>, id?: string) => {
      if (!companyId) return;
      const docId = id || `eq-${Date.now()}`;
      const newObj: Equipment = { ...data, id: docId };
      setEquipment((prev) => {
        const next = id ? prev.map((e) => (e.id === id ? newObj : e)) : [...prev, newObj];
        localStorage.setItem(getStorageKey('equipment'), JSON.stringify(next));
        return next;
      });
      await saveCompanyDoc(companyId, 'equipment', docId, newObj);
    },
    [companyId]
  );

  const deleteEquipment = useCallback(
    async (id: string) => {
      if (!companyId) return;
      setEquipment((prev) => {
        const next = prev.filter((e) => e.id !== id);
        localStorage.setItem(getStorageKey('equipment'), JSON.stringify(next));
        return next;
      });
      await deleteCompanyDoc(companyId, 'equipment', id);
    },
    [companyId]
  );

  const saveRental = useCallback(
    async (data: Omit<Rental, 'id' | 'createdAt'>, id?: string) => {
      if (!companyId) return;
      const docId = id || `rent-${Date.now()}`;
      const newObj: Rental = {
        ...data,
        id: docId,
        createdAt: id ? (rentals.find((r) => r.id === id)?.createdAt || Date.now()) : Date.now(),
      };
      setRentals((prev) => {
        const next = id ? prev.map((r) => (r.id === id ? newObj : r)) : [...prev, newObj];
        localStorage.setItem(getStorageKey('rentals'), JSON.stringify(next));
        return next;
      });
      await saveCompanyDoc(companyId, 'rentals', docId, newObj);
    },
    [companyId, rentals]
  );

  const deleteRental = useCallback(
    async (id: string) => {
      if (!companyId) return;
      setRentals((prev) => {
        const next = prev.filter((r) => r.id !== id);
        localStorage.setItem(getStorageKey('rentals'), JSON.stringify(next));
        return next;
      });
      await deleteCompanyDoc(companyId, 'rentals', id);
    },
    [companyId]
  );

  const addCategory = useCallback(
    async (catData: Omit<Category, 'id'>) => {
      if (!companyId) return;
      const id = `cat-${Date.now()}`;
      const newCat: Category = { ...catData, id };

      setCategories((prev) => {
        const next = [...prev, newCat];
        localStorage.setItem(getStorageKey('categories'), JSON.stringify(next));
        return next;
      });

      await saveCompanyDoc(companyId, 'categories', id, newCat);
    },
    [companyId]
  );

  const deleteCategory = useCallback(
    async (id: string) => {
      if (!companyId) return;
      setCategories((prev) => {
        const next = prev.filter((c) => c.id !== id);
        localStorage.setItem(getStorageKey('categories'), JSON.stringify(next));
        return next;
      });
      await deleteCompanyDoc(companyId, 'categories', id);
    },
    [companyId]
  );

  const updateCategoryBudget = useCallback(
    async (catId: string, budgetLimit?: number) => {
      if (!companyId) return;
      setCategories((prev) => {
        const next = prev.map((c) => (c.id === catId ? { ...c, budgetLimit } : c));
        localStorage.setItem(getStorageKey('categories'), JSON.stringify(next));
        return next;
      });
      const target = categories.find((c) => c.id === catId);
      if (target) {
        await saveCompanyDoc(companyId, 'categories', catId, { ...target, budgetLimit });
      }
    },
    [companyId, categories]
  );

  const saveMonthlyBudget = useCallback(
    async (ym: string, amount: number) => {
      if (!companyId) return;
      setBudgets((prev) => {
        const next = { ...prev, [ym]: amount };
        localStorage.setItem(getStorageKey('budgets'), JSON.stringify(next));
        return next;
      });
      await saveCompanyDoc(companyId, 'budgets', ym, { amount, ym });
    },
    [companyId]
  );

  const resetData = useCallback(() => {
    if (!companyId) return;
    const initialExp = getInitialExpenses();
    const initialInc = getInitialIncomes();
    const initialTrf = getInitialTransfers();
    setExpenses(initialExp);
    setCategories(DEFAULT_CATEGORIES);
    setBudgets({ [getCurrentYearMonth()]: 3500 });
    setAccounts(DEFAULT_ACCOUNTS);
    setIncomes(initialInc);
    setTransfers(initialTrf);
    setCards(DEFAULT_CREDIT_CARDS);
    setContacts(DEFAULT_CONTACTS);
    setRecurringBills(DEFAULT_RECURRING_BILLS);
    setGoals(DEFAULT_GOALS);

    localStorage.removeItem(getStorageKey('expenses'));
    localStorage.removeItem(getStorageKey('categories'));
    localStorage.removeItem(getStorageKey('budgets'));
    localStorage.removeItem(getStorageKey('accounts'));
    localStorage.removeItem(getStorageKey('incomes'));
    localStorage.removeItem(getStorageKey('transfers'));
    localStorage.removeItem(getStorageKey('cards'));
    localStorage.removeItem(getStorageKey('contacts'));
    localStorage.removeItem(getStorageKey('recurring'));
    localStorage.removeItem(getStorageKey('goals'));
  }, [companyId]);

  const clearAllData = useCallback(
    async (keepDefaultCategories: boolean = true, createCleanDefaultAccount: boolean = true) => {
      if (!companyId) return;

      const cleanAccounts: TreasuryAccount[] = createCleanDefaultAccount
        ? [
            {
              id: 'acc_' + Date.now().toString(36),
              name: 'Conta Corrente Principal',
              type: 'checking',
              initialBalance: 0,
              color: '#4f46e5',
              bankName: 'Banco Principal',
            },
          ]
        : [];

      const targetCategories = keepDefaultCategories ? DEFAULT_CATEGORIES : [];

      // 1. Immediately clear local state so UI updates in real-time
      setExpenses([]);
      setIncomes([]);
      setTransfers([]);
      setAccounts(cleanAccounts);
      setCards([]);
      setContacts([]);
      setRecurringBills([]);
      setGoals([]);
      setCategories(targetCategories);
      setBudgets({ [getCurrentYearMonth()]: 0 });

      // 2. Persist in localStorage
      localStorage.setItem(getStorageKey('expenses'), JSON.stringify([]));
      localStorage.setItem(getStorageKey('incomes'), JSON.stringify([]));
      localStorage.setItem(getStorageKey('transfers'), JSON.stringify([]));
      localStorage.setItem(getStorageKey('accounts'), JSON.stringify(cleanAccounts));
      localStorage.setItem(getStorageKey('cards'), JSON.stringify([]));
      localStorage.setItem(getStorageKey('contacts'), JSON.stringify([]));
      localStorage.setItem(getStorageKey('recurring'), JSON.stringify([]));
      localStorage.setItem(getStorageKey('goals'), JSON.stringify([]));
      localStorage.setItem(getStorageKey('categories'), JSON.stringify(targetCategories));
      localStorage.setItem(getStorageKey('budgets'), JSON.stringify({ [getCurrentYearMonth()]: 0 }));

      // 3. Clear and sync with Firestore safely
      try {
        await clearCompanyData(companyId, keepDefaultCategories);
        if (createCleanDefaultAccount && cleanAccounts[0]) {
          await saveCompanyDoc(companyId, 'accounts', cleanAccounts[0].id, cleanAccounts[0]);
        }
        if (keepDefaultCategories && targetCategories.length > 0) {
          const batch = writeBatch(db);
          targetCategories.forEach((cat) => {
            const ref = doc(db, 'companies', companyId, 'categories', cat.id);
            batch.set(ref, cat);
          });
          await batch.commit();
        }
      } catch (err) {
        console.warn('Aviso ao sincronizar limpeza de dados com Firestore:', err);
      }
    },
    [companyId]
  );

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
