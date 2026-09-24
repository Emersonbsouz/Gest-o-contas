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
import { supabase } from '../lib/supabase';
import {
  createNewCompany,
  loadCompanySubcollection,
  saveCompanyDoc,
} from './companyService';

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

export async function generateFullSystemBackup(
  userCompanies: Company[],
  userEmail: string
): Promise<SystemBackupFile> {
  const companiesBackup: CompanyFullBackup[] = [];

  for (const company of userCompanies) {
    const [expenses, incomes, transfers, accounts, cards, categories, contacts, recurring, goals, budgetRows] =
      await Promise.all([
        loadCompanySubcollection<Expense>(company.id, 'expenses'),
        loadCompanySubcollection<Income>(company.id, 'incomes'),
        loadCompanySubcollection<AccountTransfer>(company.id, 'transfers'),
        loadCompanySubcollection<TreasuryAccount>(company.id, 'accounts'),
        loadCompanySubcollection<CreditCard>(company.id, 'cards'),
        loadCompanySubcollection<Category>(company.id, 'categories'),
        loadCompanySubcollection<ContactPerson>(company.id, 'contacts'),
        loadCompanySubcollection<RecurringBill>(company.id, 'recurring'),
        loadCompanySubcollection<FinancialGoal>(company.id, 'goals'),
        loadCompanySubcollection<{ id: string; ym: string; amount: number }>(company.id, 'budgets'),
      ]);

    const budgets: MonthlyBudget = {};
    budgetRows.forEach((row) => {
      if (row.ym) budgets[row.ym] = Number(row.amount) || 0;
    });

    companiesBackup.push({
      company,
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
    version: 2,
    exportedAt: new Date().toISOString(),
    exportedBy: userEmail,
    companies: companiesBackup,
  };
}

export function downloadBackupFile(backup: SystemBackupFile) {
  const dateStr = new Date().toISOString().split('T')[0];
  const filename = `backup-financeiro-${dateStr}.json`;
  const blob = new Blob([JSON.stringify(backup, null, 2)], { type: 'application/json' });
  const url = URL.createObjectURL(blob);
  const anchor = document.createElement('a');
  anchor.href = url;
  anchor.download = filename;
  document.body.appendChild(anchor);
  anchor.click();
  document.body.removeChild(anchor);
  URL.revokeObjectURL(url);
}

function isUuid(value: string): boolean {
  return /^[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i.test(value);
}

export async function restoreSystemBackup(
  backup: SystemBackupFile
): Promise<{ success: boolean; message: string }> {
  if (!backup || !Array.isArray(backup.companies)) {
    throw new Error('Arquivo de backup inválido: formato incompatível.');
  }

  const { data: sessionData, error: sessionError } = await supabase.auth.getSession();
  if (sessionError) throw sessionError;
  const user = sessionData.session?.user;
  if (!user?.email) throw new Error('Faça login no Supabase antes de restaurar um backup.');

  for (const companyBackup of backup.companies) {
    const original = companyBackup.company;
    if (!original) continue;

    let companyId: string | null = null;
    if (original.id && isUuid(original.id)) {
      const { data } = await supabase
        .from('companies')
        .select('id')
        .eq('id', original.id)
        .maybeSingle();
      companyId = data?.id || null;
    }

    if (!companyId) {
      const created = await createNewCompany(user.id, user.email, {
        name: original.name || 'Empresa restaurada',
        type: original.type || 'business',
        color: original.color || '#4f46e5',
      });
      companyId = created.id;
    }

    const saveList = async (collectionName: string, items: any[]) => {
      if (!Array.isArray(items)) return;
      await Promise.all(
        items
          .filter((item) => item?.id)
          .map((item) => saveCompanyDoc(companyId!, collectionName, item.id, item))
      );
    };

    await saveList('expenses', companyBackup.expenses);
    await saveList('incomes', companyBackup.incomes);
    await saveList('transfers', companyBackup.transfers);
    await saveList('accounts', companyBackup.accounts);
    await saveList('cards', companyBackup.cards);
    await saveList('categories', companyBackup.categories);
    await saveList('contacts', companyBackup.contacts);
    await saveList('recurring', companyBackup.recurring);
    await saveList('goals', companyBackup.goals);

    if (companyBackup.budgets) {
      await Promise.all(
        Object.entries(companyBackup.budgets).map(([ym, amount]) =>
          saveCompanyDoc(companyId!, 'budgets', ym, { id: ym, ym, amount })
        )
      );
    }
  }

  return {
    success: true,
    message: `Restauração concluída no Supabase. ${backup.companies.length} empresa(s) processada(s).`,
  };
}
