import { supabase } from '../lib/supabase';
import {
  Company,
  CompanyRole,
  MemberPermissions,
  DEFAULT_ROLE_PERMISSIONS,
  CompanyMemberInfo,
} from '../types';
import { DEFAULT_CATEGORIES } from '../data/defaultCategories';

const POLL_INTERVAL_MS = 8000;

function fromDbRole(role?: string | null): CompanyRole {
  switch (role) {
    case 'owner':
    case 'admin':
    case 'partner':
    case 'viewer':
      return role;
    case 'finance':
      return 'partner';
    case 'collaborator':
    default:
      return 'operator';
  }
}

function toDbRole(role: CompanyRole): 'owner' | 'admin' | 'partner' | 'finance' | 'collaborator' | 'viewer' {
  switch (role) {
    case 'owner':
    case 'admin':
    case 'partner':
    case 'viewer':
      return role;
    case 'operator':
    case 'custom':
    default:
      return 'collaborator';
  }
}

function timestamp(value?: string | null): number {
  if (!value) return Date.now();
  const parsed = Date.parse(value);
  return Number.isFinite(parsed) ? parsed : Date.now();
}

async function hydrateCompanies(rows: any[], fallbackEmail: string): Promise<Company[]> {
  if (!rows.length) return [];
  const companyIds = rows.map((row) => row.id);
  const { data: members, error: membersError } = await supabase
    .from('company_members')
    .select('company_id,email,name,role,permissions,created_at')
    .in('company_id', companyIds);

  if (membersError) throw membersError;

  return rows.map((row) => {
    const related = (members || []).filter((member: any) => member.company_id === row.id);
    const ownerMember = related.find((member: any) => member.role === 'owner');
    const memberEmails = related.map((member: any) => String(member.email || '').toLowerCase()).filter(Boolean);
    const membersInfo: CompanyMemberInfo[] = related.map((member: any) => ({
      email: member.email,
      name: member.name || undefined,
      role: fromDbRole(member.role),
      permissions: member.permissions || DEFAULT_ROLE_PERMISSIONS[fromDbRole(member.role)],
      addedAt: timestamp(member.created_at),
    }));

    const normalizedFallback = fallbackEmail.toLowerCase().trim();
    const ownerEmail = ownerMember?.email || normalizedFallback;
    if (ownerEmail && !memberEmails.includes(ownerEmail)) memberEmails.unshift(ownerEmail);

    return {
      id: row.id,
      name: row.name,
      type: row.type,
      ownerId: row.owner_id,
      ownerEmail,
      memberEmails,
      membersInfo,
      color: row.color || '#4f46e5',
      createdAt: timestamp(row.created_at),
    } as Company;
  });
}

async function loadAccessibleCompanies(userEmail: string): Promise<Company[]> {
  const { data, error } = await supabase
    .from('companies')
    .select('id,name,type,owner_id,color,created_at')
    .order('created_at', { ascending: true });
  if (error) throw error;
  return hydrateCompanies(data || [], userEmail);
}

async function seedCompanyDefaults(companyId: string) {
  await Promise.all(
    DEFAULT_CATEGORIES.map((category) =>
      saveCompanyDoc(companyId, 'categories', category.id, category)
    )
  );
}

async function createCompanyRow(
  userId: string,
  userEmail: string,
  data: { name: string; type: 'personal' | 'business'; color: string; legacyId?: string }
): Promise<Company> {
  const normalizedEmail = userEmail.toLowerCase().trim();
  const { data: row, error } = await supabase
    .from('companies')
    .insert({
      name: data.name.trim(),
      type: data.type,
      owner_id: userId,
      color: data.color || '#4f46e5',
      legacy_id: data.legacyId || null,
    })
    .select('id,name,type,owner_id,color,created_at')
    .single();
  if (error) throw error;

  const ownerPermissions = DEFAULT_ROLE_PERMISSIONS.owner;
  const { error: memberError } = await supabase.from('company_members').insert({
    company_id: row.id,
    user_id: userId,
    email: normalizedEmail,
    name: normalizedEmail.split('@')[0] || 'Proprietário',
    role: 'owner',
    permissions: ownerPermissions,
  });
  if (memberError) throw memberError;

  await seedCompanyDefaults(row.id);
  const hydrated = await hydrateCompanies([row], normalizedEmail);
  return hydrated[0];
}

export async function ensureDefaultCompanies(userId: string, userEmail: string): Promise<Company[]> {
  const existing = await loadAccessibleCompanies(userEmail);
  if (existing.length > 0) return existing;

  const suffix = userId.slice(0, 8);
  const defaults = [
    { name: 'Despesas Pessoais (PF)', type: 'personal' as const, color: '#4f46e5', legacyId: `personal_${suffix}` },
    { name: 'Minha Empresa Individual (PJ)', type: 'business' as const, color: '#0284c7', legacyId: `individual_${suffix}` },
    { name: 'Empresa Cacto (PJ)', type: 'business' as const, color: '#059669', legacyId: `cacto_${suffix}` },
  ];

  const created: Company[] = [];
  for (const item of defaults) {
    created.push(await createCompanyRow(userId, userEmail, item));
  }
  return created;
}

export async function createNewCompany(
  userId: string,
  userEmail: string,
  data: { name: string; type: 'personal' | 'business'; color: string }
): Promise<Company> {
  return createCompanyRow(userId, userEmail, data);
}

export async function addCompanyMember(
  companyId: string,
  email: string,
  name?: string,
  role: CompanyRole = 'partner',
  permissions?: MemberPermissions
): Promise<void> {
  const normalizedEmail = email.toLowerCase().trim();
  const effectivePermissions = permissions || DEFAULT_ROLE_PERMISSIONS[role] || DEFAULT_ROLE_PERMISSIONS.partner;
  const { error } = await supabase.from('company_members').upsert(
    {
      company_id: companyId,
      email: normalizedEmail,
      name: name?.trim() || normalizedEmail.split('@')[0],
      role: toDbRole(role),
      permissions: effectivePermissions,
    },
    { onConflict: 'company_id,email' }
  );
  if (error) throw error;
}

export async function updateCompanyMember(
  companyId: string,
  email: string,
  updates: { name?: string; role?: CompanyRole; permissions?: MemberPermissions }
): Promise<void> {
  const normalizedEmail = email.toLowerCase().trim();
  const patch: Record<string, unknown> = {};
  if (updates.name !== undefined) patch.name = updates.name.trim();
  if (updates.role !== undefined) patch.role = toDbRole(updates.role);
  if (updates.permissions !== undefined) patch.permissions = updates.permissions;
  const { error } = await supabase
    .from('company_members')
    .update(patch)
    .eq('company_id', companyId)
    .eq('email', normalizedEmail);
  if (error) throw error;
}

export async function removeCompanyMember(companyId: string, email: string): Promise<void> {
  const { error } = await supabase
    .from('company_members')
    .delete()
    .eq('company_id', companyId)
    .eq('email', email.toLowerCase().trim());
  if (error) throw error;
}

export function subscribeToUserCompanies(
  _userId: string,
  userEmail: string,
  onUpdate: (companies: Company[]) => void
) {
  let active = true;
  const load = async () => {
    try {
      const companies = await loadAccessibleCompanies(userEmail);
      if (active) onUpdate(companies);
    } catch (error) {
      console.error('[Supabase] Erro ao atualizar empresas:', error);
    }
  };
  void load();
  const timer = window.setInterval(load, POLL_INTERVAL_MS);
  return () => {
    active = false;
    window.clearInterval(timer);
  };
}

export async function loadCompanySubcollection<T>(companyId: string, collectionName: string): Promise<T[]> {
  const { data, error } = await supabase
    .from('company_documents')
    .select('doc_id,payload,created_at')
    .eq('company_id', companyId)
    .eq('collection_name', collectionName)
    .order('created_at', { ascending: true });
  if (error) throw error;
  return (data || []).map((row: any) => ({ ...(row.payload || {}), id: row.payload?.id || row.doc_id } as T));
}

export function subscribeToCompanySubcollection<T>(
  companyId: string,
  collectionName: string,
  onUpdate: (items: T[]) => void,
  onError?: (err: unknown) => void
) {
  let active = true;
  const load = async () => {
    try {
      const items = await loadCompanySubcollection<T>(companyId, collectionName);
      if (active) onUpdate(items);
    } catch (error) {
      if (active && onError) onError(error);
      else console.error(`[Supabase] Erro em ${collectionName}:`, error);
    }
  };
  void load();
  const timer = window.setInterval(load, POLL_INTERVAL_MS);
  return () => {
    active = false;
    window.clearInterval(timer);
  };
}

export async function saveCompanyDoc(companyId: string, collectionName: string, docId: string, data: any) {
  const payload = { ...(data || {}), id: data?.id || docId };
  const { error } = await supabase.from('company_documents').upsert(
    {
      company_id: companyId,
      collection_name: collectionName,
      doc_id: docId,
      payload,
      updated_at: new Date().toISOString(),
    },
    { onConflict: 'company_id,collection_name,doc_id' }
  );
  if (error) throw error;
}

export async function deleteCompanyDoc(companyId: string, collectionName: string, docId: string) {
  const { error } = await supabase
    .from('company_documents')
    .delete()
    .eq('company_id', companyId)
    .eq('collection_name', collectionName)
    .eq('doc_id', docId);
  if (error) throw error;
}

export async function clearCompanyData(companyId: string, keepCategories: boolean = true): Promise<void> {
  let request = supabase.from('company_documents').delete().eq('company_id', companyId);
  if (keepCategories) request = request.neq('collection_name', 'categories');
  const { error } = await request;
  if (error) throw error;
}
