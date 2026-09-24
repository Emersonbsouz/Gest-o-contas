import type { User as FirebaseUser } from 'firebase/auth';
import { collection, getDocs, query, where } from 'firebase/firestore';
import { db } from '../lib/firebase';
import { supabase } from '../lib/supabase';
import { DEFAULT_ROLE_PERMISSIONS, type CompanyRole } from '../types';

type LegacyDoc = { id: string; data: Record<string, any> };

type MigrationSummary = {
  companiesFound: number;
  companiesMigrated: number;
  sharedCompaniesPendingOwner: number;
  archivedDocuments: number;
  structuredDocuments: number;
  warnings: string[];
  errors: string[];
};

const COLLECTIONS = [
  'accounts',
  'cards',
  'categories',
  'contacts',
  'costCenters',
  'proposals',
  'equipment',
  'rentals',
  'recurring',
  'goals',
  'transfers',
  'expenses',
  'incomes',
  'budgets',
] as const;

function toJsonSafe(value: any): any {
  if (value == null) return value;
  if (Array.isArray(value)) return value.map(toJsonSafe);
  if (typeof value === 'object') {
    if (typeof value.toDate === 'function') {
      try {
        return value.toDate().toISOString();
      } catch {
        // fall through
      }
    }
    const out: Record<string, any> = {};
    Object.entries(value).forEach(([key, val]) => {
      out[key] = toJsonSafe(val);
    });
    return out;
  }
  return value;
}

function toIsoTimestamp(value: any): string | undefined {
  if (!value) return undefined;
  if (typeof value === 'number') return new Date(value).toISOString();
  if (typeof value === 'string') {
    const date = new Date(value);
    if (!Number.isNaN(date.getTime())) return date.toISOString();
    return undefined;
  }
  if (typeof value?.toDate === 'function') {
    try {
      return value.toDate().toISOString();
    } catch {
      return undefined;
    }
  }
  return undefined;
}

function toDateOnly(value: any): string | undefined {
  if (!value) return undefined;
  if (typeof value === 'string') return value.slice(0, 10);
  const ts = toIsoTimestamp(value);
  return ts?.slice(0, 10);
}

function numberOr(value: any, fallback = 0): number {
  const n = Number(value);
  return Number.isFinite(n) ? n : fallback;
}

function normalizeRole(role?: string): 'owner' | 'admin' | 'partner' | 'finance' | 'collaborator' | 'viewer' {
  switch (role) {
    case 'owner':
    case 'admin':
    case 'partner':
    case 'viewer':
      return role;
    case 'operator':
    case 'custom':
      return 'collaborator';
    case 'finance':
      return 'finance';
    default:
      return 'partner';
  }
}

function normalizeExpenseStatus(status?: string): 'pending' | 'paid' | 'overdue' | 'cancelled' {
  const value = String(status || '').toLowerCase();
  if (['paid', 'liquidated', 'pago', 'approved'].includes(value)) return 'paid';
  if (['overdue', 'vencido'].includes(value)) return 'overdue';
  if (['cancelled', 'cancelado', 'rejected'].includes(value)) return 'cancelled';
  return 'pending';
}

function normalizeIncomeStatus(status?: string): 'pending' | 'received' | 'overdue' | 'cancelled' {
  const value = String(status || '').toLowerCase();
  if (['paid', 'received', 'liquidated', 'pago', 'approved'].includes(value)) return 'received';
  if (['overdue', 'vencido'].includes(value)) return 'overdue';
  if (['cancelled', 'cancelado', 'rejected'].includes(value)) return 'cancelled';
  return 'pending';
}

async function readCompanyCollection(companyId: string, name: string): Promise<LegacyDoc[]> {
  const snapshot = await getDocs(collection(db, 'companies', companyId, name));
  return snapshot.docs.map((docSnap) => ({ id: docSnap.id, data: docSnap.data() as Record<string, any> }));
}

async function findFirebaseCompanies(firebaseUser: FirebaseUser): Promise<LegacyDoc[]> {
  const email = (firebaseUser.email || '').toLowerCase().trim();
  const companiesRef = collection(db, 'companies');
  const results = new Map<string, LegacyDoc>();

  const ownerSnapshot = await getDocs(query(companiesRef, where('ownerId', '==', firebaseUser.uid)));
  ownerSnapshot.forEach((docSnap) => results.set(docSnap.id, { id: docSnap.id, data: docSnap.data() as Record<string, any> }));

  if (email) {
    const memberSnapshot = await getDocs(query(companiesRef, where('memberEmails', 'array-contains', email)));
    memberSnapshot.forEach((docSnap) => results.set(docSnap.id, { id: docSnap.id, data: docSnap.data() as Record<string, any> }));
  }

  return Array.from(results.values());
}

async function archiveDoc(companyId: string, collectionName: string, doc: LegacyDoc) {
  const { error } = await supabase.from('firebase_archive').upsert(
    {
      company_id: companyId,
      collection_name: collectionName,
      legacy_id: doc.id,
      payload: toJsonSafe(doc.data),
      migrated_at: new Date().toISOString(),
    },
    { onConflict: 'company_id,collection_name,legacy_id' }
  );
  if (error) throw error;
}

async function upsertLegacyRow(
  table: string,
  companyId: string,
  legacyId: string,
  values: Record<string, any>
): Promise<string> {
  const { data, error } = await supabase
    .from(table)
    .upsert(
      {
        ...values,
        company_id: companyId,
        legacy_id: legacyId,
      },
      { onConflict: 'company_id,legacy_id' }
    )
    .select('id')
    .single();

  if (error) throw error;
  return data.id as string;
}

async function upsertCompany(firebaseUser: FirebaseUser, companyDoc: LegacyDoc, supabaseUserId: string): Promise<string | null> {
  const source = companyDoc.data;
  const isOwner = source.ownerId === firebaseUser.uid ||
    (!!firebaseUser.email && String(source.ownerEmail || '').toLowerCase() === firebaseUser.email.toLowerCase());

  if (!isOwner) {
    const { data } = await supabase
      .from('companies')
      .select('id')
      .eq('legacy_id', companyDoc.id)
      .maybeSingle();
    return data?.id || null;
  }

  const { data, error } = await supabase
    .from('companies')
    .upsert(
      {
        name: source.name || 'Empresa migrada',
        type: source.type === 'personal' ? 'personal' : 'business',
        owner_id: supabaseUserId,
        color: source.color || '#4f46e5',
        created_at: toIsoTimestamp(source.createdAt) || new Date().toISOString(),
        updated_at: new Date().toISOString(),
        legacy_id: companyDoc.id,
        legacy_payload: toJsonSafe(source),
      },
      { onConflict: 'legacy_id' }
    )
    .select('id')
    .single();

  if (error) throw error;
  return data.id as string;
}

async function migrateMembers(companyId: string, source: Record<string, any>, currentEmail: string, currentUserId: string) {
  const memberEmails = new Set<string>(
    [source.ownerEmail, ...(source.memberEmails || [])]
      .filter(Boolean)
      .map((email: string) => email.toLowerCase().trim())
  );
  const infos = Array.isArray(source.membersInfo) ? source.membersInfo : [];

  for (const email of memberEmails) {
    const info = infos.find((item: any) => String(item.email || '').toLowerCase().trim() === email);
    const isOwner = email === String(source.ownerEmail || '').toLowerCase().trim();
    const legacyRole: CompanyRole = isOwner ? 'owner' : (info?.role || 'partner');
    const role = normalizeRole(legacyRole);
    const permissions = info?.permissions || DEFAULT_ROLE_PERMISSIONS[legacyRole] || DEFAULT_ROLE_PERMISSIONS.partner;

    const { error } = await supabase.from('company_members').upsert(
      {
        company_id: companyId,
        user_id: email === currentEmail ? currentUserId : null,
        email,
        name: info?.name || email.split('@')[0],
        role,
        permissions,
        created_at: toIsoTimestamp(info?.addedAt) || new Date().toISOString(),
        legacy_payload: toJsonSafe(info || { email, role: legacyRole }),
      },
      { onConflict: 'company_id,email' }
    );
    if (error) throw error;
  }
}

async function migrateCompanyData(companyLegacyId: string, companyId: string, summary: MigrationSummary) {
  const allCollections: Record<string, LegacyDoc[]> = {};

  for (const name of COLLECTIONS) {
    const docs = await readCompanyCollection(companyLegacyId, name);
    allCollections[name] = docs;
    for (const doc of docs) {
      try {
        await archiveDoc(companyId, name, doc);
        summary.archivedDocuments += 1;
      } catch (error: any) {
        summary.errors.push(`${companyLegacyId}/${name}/${doc.id}: falha ao arquivar: ${error?.message || error}`);
      }
    }
  }

  const accountMap = new Map<string, string>();
  for (const doc of allCollections.accounts || []) {
    try {
      const id = await upsertLegacyRow('treasury_accounts', companyId, doc.id, {
        name: doc.data.name || 'Conta',
        type: doc.data.type || 'checking',
        initial_balance: numberOr(doc.data.initialBalance),
        color: doc.data.color || '#64748b',
        bank_name: doc.data.bankName || null,
        account_number: doc.data.accountNumber || null,
        active: true,
        legacy_payload: toJsonSafe(doc.data),
      });
      accountMap.set(doc.id, id);
      summary.structuredDocuments += 1;
    } catch (error: any) {
      summary.errors.push(`${companyLegacyId}/accounts/${doc.id}: ${error?.message || error}`);
    }
  }

  const categoryMap = new Map<string, string>();
  for (const doc of allCollections.categories || []) {
    try {
      const id = await upsertLegacyRow('categories', companyId, doc.id, {
        name: doc.data.name || 'Categoria',
        type: doc.data.type === 'income' ? 'income' : 'expense',
        color: doc.data.color || '#64748b',
        icon: doc.data.icon || null,
        active: true,
        budget_limit: doc.data.budgetLimit ?? null,
        legacy_parent_id: doc.data.parentId || null,
        legacy_payload: toJsonSafe(doc.data),
      });
      categoryMap.set(doc.id, id);
      summary.structuredDocuments += 1;
    } catch (error: any) {
      summary.errors.push(`${companyLegacyId}/categories/${doc.id}: ${error?.message || error}`);
    }
  }

  for (const doc of allCollections.categories || []) {
    if (!doc.data.parentId) continue;
    const id = categoryMap.get(doc.id);
    const parentId = categoryMap.get(doc.data.parentId);
    if (!id || !parentId) continue;
    const { error } = await supabase.from('categories').update({ parent_id: parentId }).eq('id', id);
    if (error) summary.warnings.push(`${companyLegacyId}/categories/${doc.id}: parent_id não atualizado`);
  }

  const contactMap = new Map<string, string>();
  for (const doc of allCollections.contacts || []) {
    try {
      const id = await upsertLegacyRow('contacts', companyId, doc.id, {
        name: doc.data.name || 'Contato',
        type: doc.data.type || 'other',
        document: doc.data.document || null,
        phone: doc.data.phone || null,
        email: doc.data.email || null,
        address: doc.data.address || null,
        pix_key: doc.data.pixKey || null,
        notes: doc.data.notes || null,
        created_at: toIsoTimestamp(doc.data.createdAt) || new Date().toISOString(),
        legacy_payload: toJsonSafe(doc.data),
      });
      contactMap.set(doc.id, id);
      summary.structuredDocuments += 1;
    } catch (error: any) {
      summary.errors.push(`${companyLegacyId}/contacts/${doc.id}: ${error?.message || error}`);
    }
  }

  const costCenterMap = new Map<string, string>();
  for (const doc of allCollections.costCenters || []) {
    try {
      const id = await upsertLegacyRow('cost_centers', companyId, doc.id, {
        name: doc.data.name || 'Centro de custo',
        client_id: doc.data.clientId ? contactMap.get(doc.data.clientId) || null : null,
        status: doc.data.status || 'active',
        start_date: toDateOnly(doc.data.startDate) || null,
        end_date: toDateOnly(doc.data.endDate) || null,
        budget: doc.data.budget ?? null,
        color: doc.data.color || '#64748b',
        notes: doc.data.notes || null,
        created_at: toIsoTimestamp(doc.data.createdAt) || new Date().toISOString(),
        legacy_client_id: doc.data.clientId || null,
        legacy_payload: toJsonSafe(doc.data),
      });
      costCenterMap.set(doc.id, id);
      summary.structuredDocuments += 1;
    } catch (error: any) {
      summary.errors.push(`${companyLegacyId}/costCenters/${doc.id}: ${error?.message || error}`);
    }
  }

  const cardMap = new Map<string, string>();
  for (const doc of allCollections.cards || []) {
    try {
      const id = await upsertLegacyRow('credit_cards', companyId, doc.id, {
        name: doc.data.name || 'Cartão',
        brand: doc.data.brand || 'other',
        credit_limit: numberOr(doc.data.limit),
        closing_day: doc.data.closingDay ?? null,
        due_day: doc.data.dueDay ?? null,
        linked_account_id: doc.data.linkedAccountId ? accountMap.get(doc.data.linkedAccountId) || null : null,
        color: doc.data.color || '#64748b',
        notes: doc.data.notes || null,
        active: true,
        legacy_payload: toJsonSafe(doc.data),
      });
      cardMap.set(doc.id, id);
      summary.structuredDocuments += 1;
    } catch (error: any) {
      summary.errors.push(`${companyLegacyId}/cards/${doc.id}: ${error?.message || error}`);
    }
  }

  const equipmentMap = new Map<string, string>();
  for (const doc of allCollections.equipment || []) {
    try {
      const id = await upsertLegacyRow('equipment', companyId, doc.id, {
        name: doc.data.name || 'Equipamento',
        brand: doc.data.brand || null,
        serial_number: doc.data.serialNumber || null,
        asset_number: doc.data.assetNumber || null,
        status: doc.data.status || 'available',
        daily_rate: numberOr(doc.data.dailyRate),
        notes: doc.data.notes || null,
        legacy_payload: toJsonSafe(doc.data),
      });
      equipmentMap.set(doc.id, id);
      summary.structuredDocuments += 1;
    } catch (error: any) {
      summary.errors.push(`${companyLegacyId}/equipment/${doc.id}: ${error?.message || error}`);
    }
  }

  for (const doc of allCollections.recurring || []) {
    try {
      await upsertLegacyRow('recurring_bills', companyId, doc.id, {
        description: doc.data.description || 'Recorrência',
        type: doc.data.type === 'income' ? 'income' : 'expense',
        amount: numberOr(doc.data.amount),
        due_day: numberOr(doc.data.dueDay, 1),
        category_id: doc.data.categoryId ? categoryMap.get(doc.data.categoryId) || null : null,
        account_id: doc.data.accountId ? accountMap.get(doc.data.accountId) || null : null,
        card_id: doc.data.cardId ? cardMap.get(doc.data.cardId) || null : null,
        contact_id: doc.data.contactId ? contactMap.get(doc.data.contactId) || null : null,
        cost_center_id: doc.data.costCenterId ? costCenterMap.get(doc.data.costCenterId) || null : null,
        active: doc.data.active !== false,
        notes: doc.data.notes || null,
        created_at: toIsoTimestamp(doc.data.createdAt) || new Date().toISOString(),
        legacy_payload: toJsonSafe(doc.data),
      });
      summary.structuredDocuments += 1;
    } catch (error: any) {
      summary.errors.push(`${companyLegacyId}/recurring/${doc.id}: ${error?.message || error}`);
    }
  }

  for (const doc of allCollections.goals || []) {
    try {
      await upsertLegacyRow('financial_goals', companyId, doc.id, {
        title: doc.data.title || 'Meta',
        target_amount: numberOr(doc.data.targetAmount),
        current_amount: numberOr(doc.data.currentAmount),
        deadline: toDateOnly(doc.data.deadline) || null,
        color: doc.data.color || '#64748b',
        category: doc.data.category || null,
        notes: doc.data.notes || null,
        created_at: toIsoTimestamp(doc.data.createdAt) || new Date().toISOString(),
        legacy_payload: toJsonSafe(doc.data),
      });
      summary.structuredDocuments += 1;
    } catch (error: any) {
      summary.errors.push(`${companyLegacyId}/goals/${doc.id}: ${error?.message || error}`);
    }
  }

  for (const doc of allCollections.proposals || []) {
    try {
      await upsertLegacyRow('proposals', companyId, doc.id, {
        client_id: doc.data.clientId ? contactMap.get(doc.data.clientId) || null : null,
        title: doc.data.title || 'Proposta',
        description: doc.data.description || null,
        amount: numberOr(doc.data.amount),
        status: doc.data.status || 'draft',
        proposal_date: toDateOnly(doc.data.date) || new Date().toISOString().slice(0, 10),
        valid_until: toDateOnly(doc.data.validUntil) || null,
        items: toJsonSafe(doc.data.items || []),
        notes: doc.data.notes || null,
        cost_center_id: doc.data.costCenterId ? costCenterMap.get(doc.data.costCenterId) || null : null,
        created_at: toIsoTimestamp(doc.data.createdAt) || new Date().toISOString(),
        legacy_payload: toJsonSafe(doc.data),
      });
      summary.structuredDocuments += 1;
    } catch (error: any) {
      summary.errors.push(`${companyLegacyId}/proposals/${doc.id}: ${error?.message || error}`);
    }
  }

  for (const doc of allCollections.rentals || []) {
    try {
      const equipmentId = equipmentMap.get(doc.data.equipmentId);
      if (!equipmentId) throw new Error('equipamento vinculado não encontrado');
      await upsertLegacyRow('rentals', companyId, doc.id, {
        equipment_id: equipmentId,
        client_id: doc.data.clientId ? contactMap.get(doc.data.clientId) || null : null,
        start_date: toDateOnly(doc.data.startDate) || new Date().toISOString().slice(0, 10),
        expected_return_date: toDateOnly(doc.data.expectedReturnDate) || null,
        actual_return_date: toDateOnly(doc.data.actualReturnDate) || null,
        daily_rate: numberOr(doc.data.dailyRate),
        amount: numberOr(doc.data.amount),
        status: doc.data.status || 'active',
        cost_center_id: doc.data.costCenterId ? costCenterMap.get(doc.data.costCenterId) || null : null,
        notes: doc.data.notes || null,
        created_at: toIsoTimestamp(doc.data.createdAt) || new Date().toISOString(),
        legacy_payload: toJsonSafe(doc.data),
      });
      summary.structuredDocuments += 1;
    } catch (error: any) {
      summary.errors.push(`${companyLegacyId}/rentals/${doc.id}: ${error?.message || error}`);
    }
  }

  for (const doc of allCollections.transfers || []) {
    try {
      const fromAccount = accountMap.get(doc.data.fromAccountId);
      const toAccount = accountMap.get(doc.data.toAccountId);
      if (!fromAccount || !toAccount) throw new Error('conta de origem/destino não encontrada');
      await upsertLegacyRow('account_transfers', companyId, doc.id, {
        from_account_id: fromAccount,
        to_account_id: toAccount,
        amount: numberOr(doc.data.amount),
        transfer_date: toDateOnly(doc.data.date) || new Date().toISOString().slice(0, 10),
        description: doc.data.description || null,
        created_at: toIsoTimestamp(doc.data.createdAt) || new Date().toISOString(),
        legacy_payload: toJsonSafe(doc.data),
      });
      summary.structuredDocuments += 1;
    } catch (error: any) {
      summary.errors.push(`${companyLegacyId}/transfers/${doc.id}: ${error?.message || error}`);
    }
  }

  const expenseMap = new Map<string, string>();
  for (const doc of allCollections.expenses || []) {
    try {
      const id = await upsertLegacyRow('expenses', companyId, doc.id, {
        description: doc.data.description || 'Despesa',
        amount: numberOr(doc.data.amount),
        due_date: toDateOnly(doc.data.date) || new Date().toISOString().slice(0, 10),
        paid_at: normalizeExpenseStatus(doc.data.status) === 'paid' ? (toDateOnly(doc.data.date) || null) : null,
        status: normalizeExpenseStatus(doc.data.status),
        category_id: doc.data.categoryId ? categoryMap.get(doc.data.categoryId) || null : null,
        account_id: doc.data.accountId ? accountMap.get(doc.data.accountId) || null : null,
        card_id: doc.data.cardId ? cardMap.get(doc.data.cardId) || null : null,
        contact_id: doc.data.contactId ? contactMap.get(doc.data.contactId) || null : null,
        cost_center_id: doc.data.costCenterId ? costCenterMap.get(doc.data.costCenterId) || null : null,
        payment_method: doc.data.paymentMethod || null,
        document_number: doc.data.documentNumber || null,
        notes: doc.data.notes || null,
        installment_number: doc.data.installments?.current ?? doc.data.installmentNumber ?? null,
        total_installments: doc.data.installments?.total ?? doc.data.totalInstallments ?? null,
        created_at: toIsoTimestamp(doc.data.createdAt) || new Date().toISOString(),
        updated_at: new Date().toISOString(),
        legacy_payload: toJsonSafe(doc.data),
      });
      expenseMap.set(doc.id, id);
      summary.structuredDocuments += 1;
    } catch (error: any) {
      summary.errors.push(`${companyLegacyId}/expenses/${doc.id}: ${error?.message || error}`);
    }
  }

  for (const doc of allCollections.expenses || []) {
    if (!doc.data.parentTransactionId) continue;
    const id = expenseMap.get(doc.id);
    const parentId = expenseMap.get(doc.data.parentTransactionId);
    if (!id || !parentId) continue;
    await supabase.from('expenses').update({ parent_transaction_id: parentId }).eq('id', id);
  }

  const incomeMap = new Map<string, string>();
  for (const doc of allCollections.incomes || []) {
    try {
      const id = await upsertLegacyRow('incomes', companyId, doc.id, {
        description: doc.data.description || 'Receita',
        amount: numberOr(doc.data.amount),
        due_date: toDateOnly(doc.data.date) || new Date().toISOString().slice(0, 10),
        received_at: normalizeIncomeStatus(doc.data.status) === 'received' ? (toDateOnly(doc.data.date) || null) : null,
        status: normalizeIncomeStatus(doc.data.status),
        category_id: doc.data.categoryId ? categoryMap.get(doc.data.categoryId) || null : null,
        account_id: doc.data.accountId ? accountMap.get(doc.data.accountId) || null : null,
        contact_id: doc.data.contactId ? contactMap.get(doc.data.contactId) || null : null,
        cost_center_id: doc.data.costCenterId ? costCenterMap.get(doc.data.costCenterId) || null : null,
        payment_method: doc.data.paymentMethod || null,
        notes: doc.data.notes || null,
        installment_number: doc.data.installmentNumber ?? null,
        total_installments: doc.data.totalInstallments ?? null,
        created_at: toIsoTimestamp(doc.data.createdAt) || new Date().toISOString(),
        updated_at: new Date().toISOString(),
        legacy_payload: toJsonSafe(doc.data),
      });
      incomeMap.set(doc.id, id);
      summary.structuredDocuments += 1;
    } catch (error: any) {
      summary.errors.push(`${companyLegacyId}/incomes/${doc.id}: ${error?.message || error}`);
    }
  }

  for (const doc of allCollections.incomes || []) {
    if (!doc.data.parentTransactionId) continue;
    const id = incomeMap.get(doc.id);
    const parentId = incomeMap.get(doc.data.parentTransactionId);
    if (!id || !parentId) continue;
    await supabase.from('incomes').update({ parent_transaction_id: parentId }).eq('id', id);
  }

  for (const doc of allCollections.budgets || []) {
    try {
      const { error } = await supabase.from('monthly_budgets').upsert(
        {
          company_id: companyId,
          legacy_id: doc.id,
          budgets: toJsonSafe(doc.data),
          legacy_payload: toJsonSafe(doc.data),
          updated_at: new Date().toISOString(),
        },
        { onConflict: 'company_id,legacy_id' }
      );
      if (error) throw error;
      summary.structuredDocuments += 1;
    } catch (error: any) {
      summary.errors.push(`${companyLegacyId}/budgets/${doc.id}: ${error?.message || error}`);
    }
  }
}

export async function migrateFirebaseDataToSupabase(firebaseUser: FirebaseUser): Promise<MigrationSummary> {
  const { data: sessionData } = await supabase.auth.getSession();
  const supabaseUser = sessionData.session?.user;
  if (!supabaseUser) throw new Error('Sessão Supabase não encontrada para executar a migração.');

  const currentEmail = (supabaseUser.email || firebaseUser.email || '').toLowerCase().trim();
  const summary: MigrationSummary = {
    companiesFound: 0,
    companiesMigrated: 0,
    sharedCompaniesPendingOwner: 0,
    archivedDocuments: 0,
    structuredDocuments: 0,
    warnings: [],
    errors: [],
  };

  await supabase.from('data_migrations').upsert(
    {
      user_id: supabaseUser.id,
      source: 'firebase',
      source_user_id: firebaseUser.uid,
      status: 'running',
      summary: {},
      started_at: new Date().toISOString(),
      completed_at: null,
    },
    { onConflict: 'user_id,source' }
  );

  const companies = await findFirebaseCompanies(firebaseUser);
  summary.companiesFound = companies.length;

  for (const companyDoc of companies) {
    try {
      const source = companyDoc.data;
      const isOwner = source.ownerId === firebaseUser.uid ||
        (!!firebaseUser.email && String(source.ownerEmail || '').toLowerCase() === firebaseUser.email.toLowerCase());
      const companyId = await upsertCompany(firebaseUser, companyDoc, supabaseUser.id);

      if (!companyId) {
        summary.sharedCompaniesPendingOwner += 1;
        summary.warnings.push(`Empresa compartilhada ${source.name || companyDoc.id} aguardando migração pelo proprietário.`);
        continue;
      }

      if (isOwner) {
        await migrateMembers(companyId, source, currentEmail, supabaseUser.id);
        await migrateCompanyData(companyDoc.id, companyId, summary);
        summary.companiesMigrated += 1;
      }
    } catch (error: any) {
      summary.errors.push(`Empresa ${companyDoc.data.name || companyDoc.id}: ${error?.message || error}`);
    }
  }

  const finalStatus = summary.errors.length ? 'completed_with_warnings' : 'completed';
  await supabase.from('data_migrations').upsert(
    {
      user_id: supabaseUser.id,
      source: 'firebase',
      source_user_id: firebaseUser.uid,
      status: finalStatus,
      summary,
      completed_at: new Date().toISOString(),
    },
    { onConflict: 'user_id,source' }
  );

  return summary;
}
