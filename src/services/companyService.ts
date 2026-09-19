import {
  collection,
  doc,
  getDocs,
  getDoc,
  setDoc,
  updateDoc,
  deleteDoc,
  query,
  where,
  onSnapshot,
  arrayUnion,
  arrayRemove,
  writeBatch,
} from 'firebase/firestore';
import { db, handleFirestoreError, OperationType } from '../lib/firebase';
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
  CompanyRole,
  MemberPermissions,
  DEFAULT_ROLE_PERMISSIONS,
} from '../types';
import { DEFAULT_CATEGORIES } from '../data/defaultCategories';
import { DEFAULT_ACCOUNTS, getInitialIncomes, getInitialTransfers } from '../data/defaultTreasury';
import { DEFAULT_CREDIT_CARDS, DEFAULT_CONTACTS, DEFAULT_RECURRING_BILLS, DEFAULT_GOALS } from '../data/defaultRegistries';
import { getInitialExpenses } from '../data/sampleExpenses';
import { getCurrentYearMonth } from '../utils/formatters';

// Initialize default companies when a user signs up or signs in for the first time
export async function ensureDefaultCompanies(userId: string, userEmail: string): Promise<Company[]> {
  const path = 'companies';
  try {
    const normalizedEmail = userEmail.toLowerCase().trim();
    const companiesRef = collection(db, path);
    
    // Check if user has any companies
    const q1 = query(companiesRef, where('ownerId', '==', userId));
    const snapshot1 = await getDocs(q1);

    const q2 = query(companiesRef, where('memberEmails', 'array-contains', normalizedEmail));
    const snapshot2 = await getDocs(q2);

    const map = new Map<string, Company>();
    snapshot1.forEach((d) => map.set(d.id, d.data() as Company));
    snapshot2.forEach((d) => map.set(d.id, d.data() as Company));

    if (map.size > 0) {
      return Array.from(map.values()).sort((a, b) => a.createdAt - b.createdAt);
    }

    // No companies found, initialize the requested 3 defaults
    const now = Date.now();
    const defaultCompanies: Company[] = [
      {
        id: `personal_${userId.slice(0, 8)}`,
        name: 'Despesas Pessoais (PF)',
        type: 'personal',
        ownerId: userId,
        ownerEmail: normalizedEmail,
        memberEmails: [normalizedEmail],
        color: '#4f46e5', // Indigo
        createdAt: now,
      },
      {
        id: `individual_${userId.slice(0, 8)}`,
        name: 'Minha Empresa Individual (PJ)',
        type: 'business',
        ownerId: userId,
        ownerEmail: normalizedEmail,
        memberEmails: [normalizedEmail],
        color: '#0284c7', // Sky Blue
        createdAt: now + 1,
      },
      {
        id: `cacto_${userId.slice(0, 8)}`,
        name: 'Empresa Cacto (PJ)',
        type: 'business',
        ownerId: userId,
        ownerEmail: normalizedEmail,
        memberEmails: [normalizedEmail, 'socio@cacto.com'],
        color: '#059669', // Emerald green (cacto)
        createdAt: now + 2,
      },
    ];

    for (const comp of defaultCompanies) {
      try {
        await setDoc(doc(db, 'companies', comp.id), comp);
        // Seed company initial default categories and accounts
        await seedCompanyDefaults(comp.id);
      } catch (e) {
        console.error(`[ensureDefaultCompanies] Erro ao criar empresa ${comp.id}:`, e);
        handleFirestoreError(e, OperationType.CREATE, `companies/${comp.id}`);
      }
    }

    return defaultCompanies;
  } catch (error) {
    handleFirestoreError(error, OperationType.GET, path);
    // This line is technically unreachable due to handleFirestoreError throwing, 
    // but added to satisfy TS return type if needed before actual throw
    return [];
  }
}

// Seed starter categories for a new company
async function seedCompanyDefaults(companyId: string) {
  try {
    const batch = writeBatch(db);

    // Only essential categories so user starts clean from scratch
    DEFAULT_CATEGORIES.forEach((cat) => {
      const ref = doc(db, 'companies', companyId, 'categories', cat.id);
      batch.set(ref, cat);
    });

    await batch.commit();
  } catch (e) {
    handleFirestoreError(e, OperationType.WRITE, `companies/${companyId}/defaults`);
  }
}

// Create a new custom company
export async function createNewCompany(
  userId: string,
  userEmail: string,
  data: { name: string; type: 'personal' | 'business'; color: string }
): Promise<Company> {
  const normalizedEmail = userEmail.toLowerCase().trim();
  const id = `company_${Date.now()}_${Math.random().toString(36).substr(2, 6)}`;
  const company: Company = {
    id,
    name: data.name,
    type: data.type,
    ownerId: userId,
    ownerEmail: normalizedEmail,
    memberEmails: [normalizedEmail],
    color: data.color || '#4f46e5',
    createdAt: Date.now(),
  };

  await setDoc(doc(db, 'companies', id), company);
  await seedCompanyDefaults(id);
  return company;
}

// Add member by email to a company with optional name, role and granular permissions
export async function addCompanyMember(
  companyId: string,
  email: string,
  name?: string,
  role: CompanyRole = 'partner',
  permissions?: MemberPermissions
): Promise<void> {
  const normalizedEmail = email.toLowerCase().trim();
  const companyRef = doc(db, 'companies', companyId);
  
  const effectivePermissions = permissions || DEFAULT_ROLE_PERMISSIONS[role] || DEFAULT_ROLE_PERMISSIONS.partner;

  try {
    const compSnap = await getDoc(companyRef);
    if (compSnap.exists()) {
      const currentData = compSnap.data() as Company;
      const currentMembers = currentData.memberEmails || [];
      const currentInfo = currentData.membersInfo || [];

      const updatedMembers = Array.from(new Set([...currentMembers, normalizedEmail]));
      const existingInfoIndex = currentInfo.findIndex((m) => (m.email || '').toLowerCase() === normalizedEmail);
      const newMemberObj = {
        email: normalizedEmail,
        name: name?.trim() || normalizedEmail.split('@')[0],
        role,
        permissions: effectivePermissions,
        addedAt: Date.now(),
      };

      let updatedInfo = [...currentInfo];
      if (existingInfoIndex >= 0) {
        updatedInfo[existingInfoIndex] = { ...updatedInfo[existingInfoIndex], ...newMemberObj };
      } else {
        updatedInfo.push(newMemberObj);
      }

      await updateDoc(companyRef, {
        memberEmails: updatedMembers,
        membersInfo: updatedInfo,
      });
    }
  } catch (e) {
    handleFirestoreError(e, OperationType.UPDATE, `companies/${companyId}`);
  }
}

// Update existing member permissions and role
export async function updateCompanyMember(
  companyId: string,
  email: string,
  updates: {
    name?: string;
    role?: CompanyRole;
    permissions?: MemberPermissions;
  }
): Promise<void> {
  const normalizedEmail = email.toLowerCase().trim();
  const companyRef = doc(db, 'companies', companyId);

  try {
    const compSnap = await getDoc(companyRef);
    if (compSnap.exists()) {
      const currentData = compSnap.data() as Company;
      const currentInfo = currentData.membersInfo || [];
      const existingInfoIndex = currentInfo.findIndex((m) => (m.email || '').toLowerCase() === normalizedEmail);

      const effectiveRole = updates.role || (existingInfoIndex >= 0 ? currentInfo[existingInfoIndex].role : 'partner') || 'partner';
      const effectivePermissions = updates.permissions || (existingInfoIndex >= 0 && currentInfo[existingInfoIndex].permissions ? currentInfo[existingInfoIndex].permissions : DEFAULT_ROLE_PERMISSIONS[effectiveRole]);

      const updatedObj = {
        email: normalizedEmail,
        name: updates.name !== undefined ? updates.name.trim() : (existingInfoIndex >= 0 ? currentInfo[existingInfoIndex].name : normalizedEmail.split('@')[0]),
        role: effectiveRole,
        permissions: effectivePermissions,
        addedAt: existingInfoIndex >= 0 && currentInfo[existingInfoIndex].addedAt ? currentInfo[existingInfoIndex].addedAt : Date.now(),
      };

      let updatedInfo = [...currentInfo];
      if (existingInfoIndex >= 0) {
        updatedInfo[existingInfoIndex] = updatedObj;
      } else {
        updatedInfo.push(updatedObj);
      }

      await updateDoc(companyRef, {
        membersInfo: updatedInfo,
      });
    }
  } catch (e) {
    handleFirestoreError(e, OperationType.UPDATE, `companies/${companyId}`);
  }
}

// Remove member from a company
export async function removeCompanyMember(companyId: string, email: string): Promise<void> {
  const normalizedEmail = email.toLowerCase().trim();
  const companyRef = doc(db, 'companies', companyId);

  try {
    const compSnap = await getDoc(companyRef);
    if (compSnap.exists()) {
      const currentData = compSnap.data() as Company;
      const updatedMembers = (currentData.memberEmails || []).filter(
        (m) => (m || '').toLowerCase() !== normalizedEmail
      );
      const updatedInfo = (currentData.membersInfo || []).filter(
        (m) => (m.email || '').toLowerCase() !== normalizedEmail
      );

      await updateDoc(companyRef, {
        memberEmails: updatedMembers,
        membersInfo: updatedInfo,
      });
    }
  } catch (e) {
    handleFirestoreError(e, OperationType.UPDATE, `companies/${companyId}`);
  }
}

// Subscribe to companies for a user in realtime
export function subscribeToUserCompanies(
  userId: string,
  userEmail: string,
  onUpdate: (companies: Company[]) => void
) {
  const normalizedEmail = userEmail.toLowerCase().trim();
  const companiesRef = collection(db, 'companies');

  // Query where user is owner OR email is in memberEmails
  const q = query(companiesRef, where('memberEmails', 'array-contains', normalizedEmail));

  return onSnapshot(
    q,
    (snapshot) => {
      const list: Company[] = [];
      snapshot.forEach((d) => list.push(d.data() as Company));
      list.sort((a, b) => a.createdAt - b.createdAt);
      onUpdate(list);
    },
    (err) => {
      handleFirestoreError(err, OperationType.LIST, 'companies');
    }
  );
}

// Real-time synchronization for all company collections
export function subscribeToCompanySubcollection<T>(
  companyId: string,
  subcollectionName: string,
  onUpdate: (items: T[]) => void,
  onError?: (err: any) => void
) {
  const colRef = collection(db, 'companies', companyId, subcollectionName);
  return onSnapshot(
    colRef,
    (snapshot) => {
      const items: T[] = [];
      snapshot.forEach((d) => items.push(d.data() as T));
      onUpdate(items);
    },
    (err) => {
      if (onError) onError(err);
      handleFirestoreError(err, OperationType.LIST, `companies/${companyId}/${subcollectionName}`);
    }
  );
}

// Generic save document to company subcollection
export async function saveCompanyDoc(companyId: string, subcollection: string, docId: string, data: any) {
  const path = `companies/${companyId}/${subcollection}/${docId}`;
  try {
    const ref = doc(db, 'companies', companyId, subcollection, docId);
    await setDoc(ref, data, { merge: true });
  } catch (e) {
    handleFirestoreError(e, OperationType.WRITE, path);
  }
}

// Generic delete document from company subcollection
export async function deleteCompanyDoc(companyId: string, subcollection: string, docId: string) {
  const path = `companies/${companyId}/${subcollection}/${docId}`;
  try {
    const ref = doc(db, 'companies', companyId, subcollection, docId);
    await deleteDoc(ref);
  } catch (e) {
    handleFirestoreError(e, OperationType.DELETE, path);
  }
}

// Clear all financial records for a company (start from scratch)
export async function clearCompanyData(companyId: string, keepCategories: boolean = true): Promise<void> {
  const subcollections = [
    'expenses',
    'incomes',
    'transfers',
    'accounts',
    'cards',
    'contacts',
    'recurring',
    'goals',
    'budgets',
  ];

  if (!keepCategories) {
    subcollections.push('categories');
  }

  for (const sub of subcollections) {
    try {
      const colRef = collection(db, 'companies', companyId, sub);
      const snap = await getDocs(colRef);
      if (snap.empty) continue;

      const docs = snap.docs;
      // Firestore batches support up to 500 writes; chunk into groups of 300
      for (let i = 0; i < docs.length; i += 300) {
        const chunk = docs.slice(i, i + 300);
        if (chunk.length === 0) continue;
        const batch = writeBatch(db);
        chunk.forEach((docSnap) => {
          batch.delete(docSnap.ref);
        });
        await batch.commit();
      }
    } catch (err) {
      handleFirestoreError(err, OperationType.DELETE, `companies/${companyId}/${sub}`);
    }
  }
}
