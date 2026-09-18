import { collection, doc, getDocs, writeBatch } from 'firebase/firestore';
import { db } from '../lib/firebase';
import {
  Company,
  Expense,
  Income,
  TreasuryAccount,
  CreditCard,
  Category,
  ContactPerson,
  RecurringBill,
  FinancialGoal,
  AccountTransfer,
  MonthlyBudget,
} from '../types';

export interface CompanyFullBackup {
  company: Company;
  expenses: Expense[];
  incomes: Income[];
  transfers: AccountTransfer[];
  accounts: TreasuryAccount[];
  cards: CreditCard[];
  categories: Category[];
  contacts: ContactPerson[];
  recurring: RecurringBill[];
  goals: FinancialGoal[];
  budgets?: MonthlyBudget;
}

export interface SystemBackupFile {
  version: number;
  exportedAt: string;
  exportedBy: string;
  companies: CompanyFullBackup[];
}

// Generate complete system backup
export async function generateFullSystemBackup(
  userCompanies: Company[],
  userEmail: string
): Promise<SystemBackupFile> {
  const companiesBackup: CompanyFullBackup[] = [];

  for (const comp of userCompanies) {
    const fetchSub = async <T>(subName: string): Promise<T[]> => {
      try {
        const col = collection(db, 'companies', comp.id, subName);
        const snap = await getDocs(col);
        const items: T[] = [];
        snap.forEach((d) => items.push(d.data() as T));
        return items;
      } catch (err) {
        console.warn(`Aviso ao exportar subcoleção ${subName} da empresa ${comp.name}:`, err);
        return [];
      }
    };

    const [expenses, incomes, transfers, accounts, cards, categories, contacts, recurring, goals] =
      await Promise.all([
        fetchSub<Expense>('expenses'),
        fetchSub<Income>('incomes'),
        fetchSub<AccountTransfer>('transfers'),
        fetchSub<TreasuryAccount>('accounts'),
        fetchSub<CreditCard>('cards'),
        fetchSub<Category>('categories'),
        fetchSub<ContactPerson>('contacts'),
        fetchSub<RecurringBill>('recurring'),
        fetchSub<FinancialGoal>('goals'),
      ]);

    // Also get budgets if stored
    let budgets: MonthlyBudget = {};
    try {
      const bCol = collection(db, 'companies', comp.id, 'budgets');
      const bSnap = await getDocs(bCol);
      bSnap.forEach((d) => {
        budgets = { ...budgets, ...(d.data() as MonthlyBudget) };
      });
    } catch {}

    companiesBackup.push({
      company: comp,
      expenses,
      incomes,
      transfers,
      accounts,
      cards,
      categories,
      contacts,
      recurring,
      goals,
      budgets,
    });
  }

  return {
    version: 1,
    exportedAt: new Date().toISOString(),
    exportedBy: userEmail,
    companies: companiesBackup,
  };
}

// Download backup as JSON file to user's device
export function downloadBackupFile(backup: SystemBackupFile) {
  const dateStr = new Date().toISOString().split('T')[0];
  const filename = `backup-financeiro-${dateStr}.json`;
  const blob = new Blob([JSON.stringify(backup, null, 2)], { type: 'application/json' });
  const url = URL.createObjectURL(blob);
  const a = document.createElement('a');
  a.href = url;
  a.download = filename;
  document.body.appendChild(a);
  a.click();
  document.body.removeChild(a);
  URL.revokeObjectURL(url);
}

// Restore system data from a backup JSON
export async function restoreSystemBackup(backup: SystemBackupFile): Promise<{ success: boolean; message: string }> {
  if (!backup || !Array.isArray(backup.companies)) {
    throw new Error('Arquivo de backup inválido: formato incompatível.');
  }

  for (const compBackup of backup.companies) {
    const comp = compBackup.company;
    if (!comp || !comp.id) continue;

    // Save company doc
    const compRef = doc(db, 'companies', comp.id);
    const batch = writeBatch(db);
    batch.set(compRef, comp, { merge: true });

    // Save subcollections
    const saveEntities = (subName: string, items: any[]) => {
      if (!Array.isArray(items)) return;
      for (const item of items) {
        if (!item || !item.id) continue;
        const itemRef = doc(db, 'companies', comp.id, subName, item.id);
        batch.set(itemRef, item, { merge: true });
      }
    };

    saveEntities('expenses', compBackup.expenses);
    saveEntities('incomes', compBackup.incomes);
    saveEntities('transfers', compBackup.transfers);
    saveEntities('accounts', compBackup.accounts);
    saveEntities('cards', compBackup.cards);
    saveEntities('categories', compBackup.categories);
    saveEntities('contacts', compBackup.contacts);
    saveEntities('recurring', compBackup.recurring);
    saveEntities('goals', compBackup.goals);

    await batch.commit();

    // Also update local storage cache for each subcollection so UI reflects immediately
    const prefix = `cg_${comp.id}_`;
    localStorage.setItem(`${prefix}expenses`, JSON.stringify(compBackup.expenses || []));
    localStorage.setItem(`${prefix}incomes`, JSON.stringify(compBackup.incomes || []));
    localStorage.setItem(`${prefix}transfers`, JSON.stringify(compBackup.transfers || []));
    localStorage.setItem(`${prefix}accounts`, JSON.stringify(compBackup.accounts || []));
    localStorage.setItem(`${prefix}cards`, JSON.stringify(compBackup.cards || []));
    localStorage.setItem(`${prefix}categories`, JSON.stringify(compBackup.categories || []));
    localStorage.setItem(`${prefix}contacts`, JSON.stringify(compBackup.contacts || []));
    localStorage.setItem(`${prefix}recurring`, JSON.stringify(compBackup.recurring || []));
    localStorage.setItem(`${prefix}goals`, JSON.stringify(compBackup.goals || []));
  }

  return {
    success: true,
    message: `Restauração concluída com sucesso! ${backup.companies.length} empresa(s) restaurada(s).`,
  };
}
