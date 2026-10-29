import { RegistryTable } from './RegistryTable';
import { contactRoles, CONTACT_ROLE_LABELS } from '../utils/contactRoles';
import { CardInvoicePanel } from './CardInvoicePanel';
import type { CardInvoicePayment, CardPaymentSelection } from '../types';
import { getCardSummary } from '../utils/cardSummary';
import React, { useState, useMemo } from 'react';
import {
  CreditCard as CreditCardIcon,
  Users,
  RefreshCw,
  Target,
  Wallet,
  Tag,
  Plus,
  Search,
  Edit2,
  Trash2,
  CheckCircle2,
  AlertCircle,
  ExternalLink,
  Phone,
  Mail,
  FileText,
  QrCode,
  Calendar,
  Check,
  TrendingUp,
  TrendingDown,
  ArrowDownLeft,
  ArrowUpRight,
  ShieldCheck,
  Sparkles,
  UserPlus,
  Crown,
  Copy,
  SlidersHorizontal,
  DollarSign,
  Edit3,
  BarChart3,
  FolderPlus,
  Shield,
  ChevronDown,
  ChevronUp,
  Package,
} from 'lucide-react';
import {
  CreditCard,
  ContactPerson,
  RecurringBill,
  FinancialGoal,
  TreasuryAccount,
  Category,
  Expense,
  Income,
  Company,
  CompanyRole,
  MemberPermissions,
  DEFAULT_ROLE_PERMISSIONS,
  CompanyMemberInfo,
  Equipment,
  CostCenter,
  TreasuryGroup,
  AccountTransfer,
} from '../types';
import { formatCurrency, formatDateBR } from '../utils/formatters';
import { TreasuryRegistry } from './TreasuryRegistry';
import { calculateAccountBalances } from '../utils/treasuryHelpers';
import { CostCenterRegistry } from './CostCenterRegistry';
import { CategoryIcon } from './CategoryIcon';
import { EditMemberPermissionsModal } from './EditMemberPermissionsModal';

interface RegistriesViewProps {
  cards: CreditCard[];
  cardPayments?: CardInvoicePayment[];
  onPayCardInvoice?: (cardId:string,dueDate:string,accountId:string,paymentDate:string,selection?:CardPaymentSelection)=>Promise<void>;
  contacts: ContactPerson[];
  recurringBills: RecurringBill[];
  goals: FinancialGoal[];
  accounts: TreasuryAccount[];
  categories: Category[];
  equipment: Equipment[];
  costCenters?: CostCenter[];
  incomes?: Income[];
  expenses?: Expense[];
  onOpenCostCenterModal?: (center?: CostCenter) => void;
  treasuries?: TreasuryGroup[];
  transfers?: AccountTransfer[];
  onSaveTreasury?: (data: Omit<TreasuryGroup, 'id'>, id?: string) => Promise<unknown>;
  onOpenCashModal?: () => void;
  currentYearMonth: string;

  activeCompany?: Company | null;
  currentUserEmail?: string | null;
  currentUserPermissions?: MemberPermissions;
  onAddMember?: (
    companyId: string,
    email: string,
    name?: string,
    role?: CompanyRole,
    permissions?: MemberPermissions
  ) => Promise<void>;
  onUpdateMember?: (
    companyId: string,
    email: string,
    updates: {
      name?: string;
      role: CompanyRole;
      permissions: MemberPermissions;
    }
  ) => Promise<void>;
  onRemoveMember?: (companyId: string, email: string) => Promise<void>;
  onOpenManageMembers?: () => void;

  // Modals / Triggers
  onOpenCardModal: (card?: CreditCard) => void;
  onDeleteCard: (cardId: string) => void;

  onOpenContactModal: (contact?: ContactPerson) => void;
  onDeleteContact: (contactId: string) => void;

  onOpenRecurringModal: (bill?: RecurringBill, subscription?: boolean) => void;
  onDeleteRecurring: (billId: string) => void;
  onTriggerRecurringBill: (bill: RecurringBill) => void;

  onOpenGoalModal: (goal?: FinancialGoal) => void;
  onDeleteGoal: (goalId: string) => void;
  onUpdateGoalAmount: (goalId: string, newAmount: number) => void;

  onOpenAccountModal: (account?: TreasuryAccount) => void;
  onDeleteAccount: (accountId: string) => void;

  onOpenCategoryModal: () => void;
  onOpenExpenseModal?: () => void;
  onOpenIncomeModal?: () => void;
  onOpenEquipmentModal: (item?: Equipment) => void;
  onDeleteEquipment: (id: string) => void;
}

type ActiveRegistryTab = 'subscriptions' | 'cards' | 'contacts' | 'recurring' | 'goals' | 'accounts' | 'categories' | 'members' | 'equipment' | 'costCenters' | 'treasuries';

export const RegistriesView: React.FC<RegistriesViewProps> = ({
  cards = [],
  cardPayments = [],
  onPayCardInvoice,
  contacts = [],
  recurringBills = [],
  goals = [],
  accounts = [],
  categories = [],
  equipment = [],
  costCenters = [],
  incomes = [],
  expenses = [],
  onOpenCostCenterModal,
  treasuries = [],
  transfers = [],
  onSaveTreasury,
  onOpenCashModal,
  currentYearMonth,
  activeCompany,
  currentUserEmail,
  currentUserPermissions,
  onAddMember,
  onUpdateMember,
  onRemoveMember,
  onOpenManageMembers,
  onOpenCardModal,
  onDeleteCard,
  onOpenContactModal,
  onDeleteContact,
  onOpenRecurringModal,
  onDeleteRecurring,
  onTriggerRecurringBill,
  onOpenGoalModal,
  onDeleteGoal,
  onUpdateGoalAmount,
  onOpenAccountModal,
  onDeleteAccount,
  onOpenCategoryModal,
  onOpenExpenseModal,
  onOpenIncomeModal,
  onOpenEquipmentModal,
  onDeleteEquipment,
}) => {
  const [activeTab, setActiveTab] = useState<ActiveRegistryTab>('contacts');
  const [searchQuery, setSearchQuery] = useState('');
  const [typeFilter, setTypeFilter] = useState('all');
  const [contactSort,setContactSort] = useState('name_asc');

  // Member management state
  const [newMemberEmail, setNewMemberEmail] = useState('');
  const [newMemberName, setNewMemberName] = useState('');
  const [newMemberRole, setNewMemberRole] = useState<CompanyRole>('partner');
  const [newMemberPermissions, setNewMemberPermissions] = useState<MemberPermissions>(DEFAULT_ROLE_PERMISSIONS.partner);
  const [showMemberPermsDrawer, setShowMemberPermsDrawer] = useState(false);
  const [editingMemberForPerms, setEditingMemberForPerms] = useState<CompanyMemberInfo | null>(null);

  const [memberLoading, setMemberLoading] = useState(false);
  const [memberError, setMemberError] = useState('');
  const [memberSuccess, setMemberSuccess] = useState('');
  const [copiedInvite, setCopiedInvite] = useState(false);

  const isCompanyOwner =
    activeCompany &&
    (activeCompany.ownerEmail || '').toLowerCase().trim() === (currentUserEmail || '').toLowerCase().trim();
  const canManageMembers = isCompanyOwner || currentUserPermissions?.canManageMembers;

  const handleRolePresetSelect = (roleKey: CompanyRole) => {
    setNewMemberRole(roleKey);
    if (roleKey !== 'custom') {
      setNewMemberPermissions({ ...DEFAULT_ROLE_PERMISSIONS[roleKey] });
    }
  };

  const handleToggleNewPerm = (key: keyof MemberPermissions) => {
    setNewMemberPermissions((prev) => {
      const next = { ...prev, [key]: !prev[key] };
      setNewMemberRole('custom');
      return next;
    });
  };

  const handleAddMemberSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!activeCompany || !onAddMember) return;
    setMemberError('');
    setMemberSuccess('');
    const cleanEmail = newMemberEmail.trim().toLowerCase();
    if (!cleanEmail || !cleanEmail.includes('@')) {
      setMemberError('Por favor, informe um e-mail válido.');
      return;
    }
    if ((activeCompany.memberEmails || []).map((m) => m.toLowerCase().trim()).includes(cleanEmail)) {
      setMemberError('Este e-mail já tem acesso cadastrado a esta empresa.');
      return;
    }

    try {
      setMemberLoading(true);
      await onAddMember(activeCompany.id, cleanEmail, newMemberName.trim(), newMemberRole, newMemberPermissions);
      setMemberSuccess(`Acesso e permissões concedidos com sucesso para ${cleanEmail}!`);
      setNewMemberEmail('');
      setNewMemberName('');
      setNewMemberRole('partner');
      setNewMemberPermissions(DEFAULT_ROLE_PERMISSIONS.partner);
      setShowMemberPermsDrawer(false);
    } catch (err) {
      console.error(err);
      setMemberError('Não foi possível cadastrar a pessoa. Verifique a conexão.');
    } finally {
      setMemberLoading(false);
    }
  };

  const handleCopyInvite = () => {
    if (!activeCompany) return;
    const inviteText = `Olá! Você foi convidado para acessar a gestão financeira da empresa "${activeCompany.name}". Acesse pelo link: ${window.location.origin} e entre utilizando seu e-mail cadastrado.`;
    navigator.clipboard.writeText(inviteText);
    setCopiedInvite(true);
    setTimeout(() => setCopiedInvite(false), 2500);
  };

  const handleRemoveMemberAction = async (emailToRemove: string) => {
    if (!activeCompany || !onRemoveMember) return;
    if (emailToRemove.toLowerCase() === (activeCompany.ownerEmail || '').toLowerCase()) {
      alert('O proprietário da empresa não pode ser removido.');
      return;
    }
    if (!window.confirm(`Deseja revogar o acesso de ${emailToRemove} a esta empresa?`)) {
      return;
    }
    try {
      setMemberLoading(true);
      setMemberError('');
      setMemberSuccess('');
      await onRemoveMember(activeCompany.id, emailToRemove);
      setMemberSuccess(`Acesso de ${emailToRemove} removido com sucesso.`);
    } catch (err) {
      console.error(err);
      setMemberError('Não foi possível remover o acesso.');
    } finally {
      setMemberLoading(false);
    }
  };

  const safeCategories = categories || [];
  const safeAccounts = accounts || [];
  const safeContacts = contacts || [];
  const safeCards = cards || [];
  const safeRecurring = recurringBills || [];
  const safeGoals = goals || [];

  const categoryMap = useMemo(() => {
    return new Map<string, string>(safeCategories.map((c) => [c.id, c.name]));
  }, [safeCategories]);

  const accountMap = useMemo(() => {
    return new Map<string, string>(safeAccounts.map((a) => [a.id, a.name]));
  }, [safeAccounts]);

  const contactMap = useMemo(() => {
    return new Map<string, string>(safeContacts.map((c) => [c.id, c.name]));
  }, [safeContacts]);

  // Filtered Cards
  const filteredCards = useMemo(() => {
    return safeCards.filter(
      (c) =>
        (c.name || '').toLowerCase().includes(searchQuery.toLowerCase()) ||
        (c.brand || '').toLowerCase().includes(searchQuery.toLowerCase())
    );
  }, [safeCards, searchQuery]);

  // Filtered Contacts
  const filteredContacts = useMemo(() => {
    return safeContacts.filter((c) => {
      const matchSearch =
        c.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
        (c.document && c.document.includes(searchQuery)) ||
        (c.phone && c.phone.includes(searchQuery)) ||
        (c.email && c.email.toLowerCase().includes(searchQuery.toLowerCase()));
      const matchType = typeFilter === 'all' || contactRoles(c).some(role => role === typeFilter);
      return matchSearch && matchType;
    }).sort((a,b)=>{
      const field=contactSort.startsWith('document')?'document':contactSort.startsWith('email')?'email':'name';
      const av=a[field]||'',bv=b[field]||'';
      if(!av)return bv?1:0;if(!bv)return -1;
      const result=av.localeCompare(bv,'pt-BR',{sensitivity:'base',numeric:true});
      return contactSort.endsWith('_desc')?-result:result;
    });
  }, [safeContacts, searchQuery, typeFilter, contactSort]);

  // Filtered Recurring Bills
  const filteredRecurring = useMemo(() => {
    return safeRecurring.filter((b) => {
      const matchSearch =
        b.description.toLowerCase().includes(searchQuery.toLowerCase()) ||
        (b.notes && b.notes.toLowerCase().includes(searchQuery.toLowerCase()));
      const matchType = typeFilter === 'all' || b.type === typeFilter;
      const matchKind = activeTab === 'subscriptions' ? b.kind === 'subscription' : b.kind !== 'subscription';
      return matchSearch && matchType && matchKind;
    });
  }, [safeRecurring, searchQuery, typeFilter, activeTab]);

  // Filtered Goals
  const filteredGoals = useMemo(() => {
    return safeGoals.filter((g) =>
      g.title.toLowerCase().includes(searchQuery.toLowerCase())
    );
  }, [safeGoals, searchQuery]);

  // Total Recurring expenses and incomes
  const totalRecurringExpenses = useMemo(() => {
    return safeRecurring
      .filter((b) => b.type === 'expense' && b.active)
      .reduce((sum, b) => sum + b.amount, 0);
  }, [safeRecurring]);

  const totalRecurringIncomes = useMemo(() => {
    return safeRecurring
      .filter((b) => b.type === 'income' && b.active)
      .reduce((sum, b) => sum + b.amount, 0);
  }, [safeRecurring]);

  const accountBalances = useMemo(() => calculateAccountBalances(accounts, incomes, expenses, transfers), [accounts, incomes, expenses, transfers]);

  const totalCreditLimit = useMemo(() => {
    return safeCards.reduce((sum, c) => sum + c.limit, 0);
  }, [safeCards]);

  return (
    <div id="registry-center" className="space-y-5">
      <div className="rounded-xl border border-slate-200 bg-white p-5 sm:p-6">
        <div className="flex flex-wrap items-center justify-between gap-4">
          <div><p className="text-xs font-bold uppercase tracking-wider text-indigo-600">Organização financeira</p><h2 className="mt-1 text-2xl font-bold text-slate-900">Central de Cadastros</h2><p className="mt-2 text-sm text-slate-500">Administre os dados da empresa com cadastros organizados e ações de manutenção em cada registro.</p></div>
        </div>
      </div>
      <nav aria-label="Áreas de cadastro" className="grid grid-cols-2 gap-3 sm:grid-cols-3 lg:grid-cols-5">
        {([
          ['contacts', 'Clientes e Fornecedores', 'Pessoas e empresas', contacts.length, Users],
          ['costCenters', 'Centros de Custo', 'Departamentos e projetos', costCenters.length, BarChart3],
          ['accounts', 'Contas e Caixas', 'Bancos e dinheiro em espécie', accounts.length, Wallet],
          ['treasuries', 'Tesourarias', 'Agrupe contas e caixas', treasuries.length, DollarSign],
          ['categories', 'Categorias', 'Classifique seus lançamentos', categories.length, Tag],
          ['cards', 'Cartões', 'Limites e vencimentos', cards.length, CreditCardIcon],
          ['recurring', 'Contas Recorrentes', 'Compromissos mensais', recurringBills.filter(b => b.kind !== 'subscription').length, RefreshCw],
          ['subscriptions', 'Assinaturas', 'Serviços mensais e cartões', recurringBills.filter(b => b.kind === 'subscription').length, RefreshCw],
          ['goals', 'Metas', 'Objetivos financeiros', goals.length, Target],
          ['equipment', 'Patrimônio', 'Equipamentos e ferramentas', equipment.length, Package],
          ['members', 'Acessos', 'Equipe e permissões', activeCompany?.memberEmails?.length || 1, Users],
        ] as const).map(([tab, title, description, count, Icon]) => <button key={tab} aria-label={`${title} (${count})`} aria-pressed={activeTab === tab} onClick={() => {setActiveTab(tab); setSearchQuery(''); setTypeFilter('all');}}
          className={`rounded-lg border p-3 text-left transition-colors ${activeTab === tab ? 'border-indigo-600 bg-indigo-50 ring-1 ring-indigo-600' : 'border-slate-200 bg-white hover:border-indigo-300'}`}>
          <div className="mb-2 flex items-center justify-between"><Icon className="h-5 w-5 text-indigo-600" /><span className="rounded-full bg-slate-100 px-2 text-xs font-bold text-slate-600">{count}</span></div><span className="block text-sm font-bold text-slate-900">{title}</span><span className="mt-1 block text-xs text-slate-500">{description}</span>
        </button>)}
      </nav>
      {!['costCenters', 'members'].includes(activeTab) && <input aria-label="Pesquisar cadastros" value={searchQuery} onChange={e => setSearchQuery(e.target.value)} placeholder="Pesquisar nesta área..." className="w-full rounded-xl border border-slate-200 bg-white p-3 text-sm" />}
      {activeTab === 'costCenters' && <CostCenterRegistry centers={costCenters} contacts={contacts} incomes={incomes} expenses={expenses} onCreate={()=>onOpenCostCenterModal?.()} onEdit={center=>onOpenCostCenterModal?.(center)} />}
      {activeTab === 'treasuries' && onSaveTreasury && <TreasuryRegistry treasuries={treasuries} accounts={accounts} incomes={incomes} expenses={expenses} transfers={transfers} search={searchQuery} onSave={onSaveTreasury} />}

      {/* TAB 1: CARTÕES DE CRÉDITO */}
      {activeTab === 'cards' && <RegistryTable title="Cartões de crédito" description="Limites, fechamento e vencimento dos cartões." items={filteredCards} onCreate={()=>onOpenCardModal()} createLabel="Novo Cartão"
        columns={[{label:'Cartão',render:card=><strong>{card.name}</strong>},{label:'Bandeira',render:card=>card.brand.toUpperCase()},{label:'Limite',sortValue:card=>card.limit,render:card=>formatCurrency(card.limit)},{label:'Fechamento / Vencimento',sortValue:card=>card.closingDay,render:card=>'Dia '+card.closingDay+' / Dia '+card.dueDay},{label:'Conta vinculada',render:card=>accountMap.get(card.linkedAccountId||'')||'Não vinculada'}]}
        actions={[{label:'Editar',run:card=>onOpenCardModal(card)},{label:'Excluir',destructive:true,confirm:card=>'Excluir o cartão "'+card.name+'"?',run:card=>onDeleteCard(card.id)}]} />}

      {/* TAB 2: FAVORECIDOS & FORNECEDORES */}
      {activeTab === 'contacts' && (
        <div className="space-y-4">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 bg-white p-5 rounded-2xl border border-slate-200 shadow-2xs">
            <div className="flex items-center gap-4">
              <div className="w-12 h-12 rounded-2xl bg-indigo-100 text-indigo-700 flex items-center justify-center shadow-2xs shrink-0">
                <Users className="w-6 h-6" />
              </div>
              <div>
                <h3 className="text-base font-bold text-slate-900 leading-tight">Interface de Cadastro: Fornecedores & Favorecidos</h3>
                <p className="text-xs text-slate-500 mt-0.5">
                  Gerencie lojas, prestadores de serviço e clientes para facilitar seus lançamentos de despesas e receitas.
                </p>
              </div>
            </div>

            <div className="flex items-center gap-2 flex-wrap sm:shrink-0">
              <select
                value={typeFilter}
                onChange={(e) => setTypeFilter(e.target.value)}
                className="px-3.5 py-2 text-xs rounded-xl border border-slate-300 bg-white font-bold text-slate-700 focus:outline-none focus:ring-2 focus:ring-indigo-500/20"
              >
                <option value="all">Todos os Contatos</option>
                <option value="supplier">Apenas Fornecedores / Favorecidos</option>
                <option value="client">Apenas Clientes / Pagadores</option>
                <option value="service_provider">Apenas Terceirizados / Prestadores</option>
                <option value="other">Outros Contatos</option>
              </select>

              <button
                onClick={() => onOpenContactModal()}
                className="inline-flex items-center gap-2 px-4 py-2.5 text-sm font-black text-white bg-indigo-600 hover:bg-indigo-700 rounded-xl shadow-xs transition-all active:scale-95"
              >
                <UserPlus className="w-4 h-4" />
                Novo Cadastro
              </button>
            </div>
          </div>

          <label className="block text-xs font-semibold text-slate-600">Ordenar clientes e fornecedores
            <select aria-label="Ordenar clientes e fornecedores" value={contactSort} onChange={e=>setContactSort(e.target.value)} className="ml-2 rounded-lg border border-slate-200 bg-white p-2">
              <option value="name_asc">Nome: A → Z</option><option value="name_desc">Nome: Z → A</option>
              <option value="document_asc">CPF / CNPJ: crescente</option><option value="document_desc">CPF / CNPJ: decrescente</option>
              <option value="email_asc">E-mail: A → Z</option><option value="email_desc">E-mail: Z → A</option>
            </select>
          </label>
          {/* Table of Contacts */}
          <div className="bg-white rounded-2xl border border-slate-200 shadow-2xs overflow-hidden">
            <div className="overflow-x-auto">
              <table className="w-full text-left text-xs text-slate-700">
                <thead className="bg-slate-50/80 text-[11px] font-bold text-slate-500 uppercase tracking-wider border-b border-slate-200">
                  <tr>
                    <th className="py-3 px-4">Nome / Razão Social</th>
                    <th className="py-3 px-4">Tipo</th>
                    <th className="py-3 px-4">CPF / CNPJ</th>
                    <th className="py-3 px-4">Telefone / E-mail</th>
                    <th className="py-3 px-4">Chave PIX</th>
                    <th className="py-3 px-4 text-right">Ações</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100">
                  {filteredContacts.map((contact) => {
                    const badgeStyles = {
                      supplier: 'bg-rose-50 text-rose-700 border-rose-200',
                      client: 'bg-emerald-50 text-emerald-700 border-emerald-200',
                      service_provider: 'bg-purple-50 text-purple-700 border-purple-200',
                      other: 'bg-slate-100 text-slate-700 border-slate-200',
                    }[contact.type] || 'bg-slate-100 text-slate-700 border-slate-200';

                    const typeLabels = {
                      supplier: 'Fornecedor',
                      client: 'Cliente',
                      service_provider: 'Prestador',
                      other: 'Contato',
                    }[contact.type] || 'Contato';

                    return (
                      <tr
                        key={contact.id}
                        className="hover:bg-slate-50/70 transition-colors group cursor-pointer"
                        onClick={() => onOpenContactModal(contact)}
                      >
                        <td className="py-3 px-4">
                          <div className="font-bold text-slate-900 group-hover:text-indigo-600 transition-colors">{contact.name}</div>
                          {contact.notes && (
                            <p className="text-[10px] text-slate-400 mt-0.5 line-clamp-1 italic">
                              "{contact.notes}"
                            </p>
                          )}
                        </td>
                        <td className="py-3 px-4">
                          <span
                            className={`inline-flex items-center px-2 py-0.5 rounded-full text-[10px] font-bold uppercase border ${badgeStyles}`}
                          >
                            {contactRoles(contact).map(role => CONTACT_ROLE_LABELS[role]).join(' / ')}
                          </span>
                        </td>
                        <td className="py-3 px-4 text-slate-600 font-mono text-[11px]">
                          {contact.document || '—'}
                        </td>
                        <td className="py-3 px-4 text-slate-600">
                          {contact.phone && (
                            <div className="flex items-center gap-1 text-[11px]">
                              <Phone className="w-3 h-3 text-slate-400" />
                              {contact.phone}
                            </div>
                          )}
                          {contact.email && (
                            <div className="flex items-center gap-1 text-[11px] text-slate-500">
                              <Mail className="w-3 h-3 text-slate-400" />
                              {contact.email}
                            </div>
                          )}
                          {!contact.phone && !contact.email && '—'}
                        </td>
                        <td className="py-3 px-4 text-slate-600">
                          {contact.pixKey ? (
                            <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded bg-slate-100 font-mono text-[10px] text-slate-700">
                              <QrCode className="w-3 h-3 text-slate-500" />
                              {contact.pixKey}
                            </span>
                          ) : (
                            '—'
                          )}
                        </td>
                        <td className="py-3 px-4 text-right">
                          <div className="inline-flex items-center gap-1">
                          <button
                            onClick={(e) => {
                              e.stopPropagation();
                              onOpenContactModal(contact);
                            }}
                            className="inline-flex items-center gap-1.5 border border-slate-200 px-3 py-2 text-slate-500 hover:text-indigo-600 hover:bg-indigo-50 rounded-lg transition-colors"
                            title="Editar contato" aria-label={"Editar " + contact.name}
                          >
                            <Edit2 className="w-3.5 h-3.5" /><span>Editar</span>
                          </button>
                            <button
                              onClick={(e) => {
                                e.stopPropagation();
                                if (window.confirm(`Excluir o contato "${contact.name}"?`)) {
                                  onDeleteContact(contact.id);
                                }
                              }}
                              className="inline-flex items-center gap-1.5 border border-rose-200 px-3 py-2 text-slate-400 hover:text-rose-600 hover:bg-rose-50 rounded-lg transition-colors"
                              title="Excluir contato" aria-label={"Excluir " + contact.name}
                            >
                              <Trash2 className="w-3.5 h-3.5" /><span>Excluir</span>
                            </button>
                          </div>
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>

              {filteredContacts.length === 0 && (
                <div className="text-center py-12 p-8">
                  <Users className="w-10 h-10 text-slate-300 mx-auto mb-2" />
                  <h4 className="text-sm font-bold text-slate-800">Nenhum favorecido cadastrado</h4>
                  <p className="text-xs text-slate-500 mt-1 max-w-sm mx-auto">
                    Cadastre fornecedores, supermercados, clientes ou prestadores para vincular aos seus lançamentos.
                  </p>
                  <button
                    onClick={() => onOpenContactModal()}
                    className="mt-4 px-4 py-2 bg-indigo-600 text-white rounded-xl text-xs font-bold hover:bg-indigo-700 transition-colors"
                  >
                    Cadastrar Primeiro Favorecido
                  </button>
                </div>
              )}
            </div>
          </div>
        </div>
      )}

      {/* TAB 3: CONTAS RECORRENTES / FIXAS */}
      {(activeTab === 'recurring' || activeTab === 'subscriptions') && <RegistryTable title={activeTab==='subscriptions'?'Assinaturas mensais':'Contas recorrentes'} description="Compromissos, valores e datas de vencimento." items={filteredRecurring} onCreate={()=>onOpenRecurringModal(undefined,activeTab==='subscriptions')} createLabel={activeTab==='subscriptions'?'Nova Assinatura':'Nova Conta Recorrente'}
        columns={[{label:'Descrição',render:bill=><strong>{bill.description}</strong>},{label:'Tipo',render:bill=>bill.type==='expense'?'Despesa':'Receita'},{label:'Valor mensal',sortValue:bill=>bill.amount,render:bill=>formatCurrency(bill.amount)},{label:'Vencimento',sortValue:bill=>bill.dueDay,render:bill=>'Dia '+bill.dueDay},{label:'Categoria',render:bill=>categoryMap.get(bill.categoryId)||'Geral'},{label:'Conta / Cartão',render:bill=>accountMap.get(bill.accountId||'')||safeCards.find(c=>c.id===bill.cardId)?.name||'Não vinculado'},{label:'Situação',render:bill=>bill.active?'Ativo':'Inativo'}]}
        actions={[{label:'Editar',run:bill=>onOpenRecurringModal(bill)},{label:'Excluir',destructive:true,confirm:bill=>'Excluir "'+bill.description+'"?',run:bill=>onDeleteRecurring(bill.id)}]} />}

      {activeTab === 'goals' && <RegistryTable title="Metas financeiras" description="Objetivos e valores planejados." items={filteredGoals} onCreate={()=>onOpenGoalModal()} createLabel="Nova Meta"
        columns={[{label:'Meta',render:goal=><strong>{goal.title}</strong>},{label:'Valor alvo',sortValue:goal=>goal.targetAmount,render:goal=>formatCurrency(goal.targetAmount)},{label:'Acumulado',sortValue:goal=>goal.currentAmount,render:goal=>formatCurrency(goal.currentAmount)},{label:'Prazo',sortValue:goal=>goal.deadline,render:goal=>goal.deadline?formatDateBR(goal.deadline):'Sem prazo'}]}
        actions={[{label:'Editar',run:goal=>onOpenGoalModal(goal)},{label:'Excluir',destructive:true,confirm:goal=>'Excluir a meta "'+goal.title+'"?',run:goal=>onDeleteGoal(goal.id)}]} />}

      {/* TAB 5: CONTAS BANCÁRIAS & CAIXAS */}
      {activeTab === 'accounts' && <RegistryTable title="Contas bancárias e caixas" description="Contas, carteiras e saldos realizados da empresa." items={safeAccounts.filter(account=>account.name.toLowerCase().includes(searchQuery.toLowerCase()))} onCreate={()=>onOpenAccountModal()} createLabel="Nova Conta" toolbar={onOpenCashModal&&<button type="button" onClick={onOpenCashModal} className="rounded-lg border border-indigo-200 px-4 py-2.5 text-sm font-semibold text-indigo-700">Novo Caixa</button>}
        columns={[{label:'Conta / Caixa',render:account=><strong>{account.name}</strong>},{label:'Tipo',render:account=>({checking:'Conta corrente',cash:'Caixa / Carteira',savings:'Poupança',investment:'Investimento'}[account.type])},{label:'Instituição',render:account=>account.bankName||'Não informada'},{label:'Tesouraria',render:account=>treasuries.find(t=>t.id===account.treasuryId)?.name||'Sem vínculo'},{label:'Saldo de abertura',sortValue:account=>account.initialBalance,render:account=>formatCurrency(account.initialBalance)},{label:'Saldo atual',sortValue:account=>accountBalances[account.id]||0,render:account=>formatCurrency(accountBalances[account.id]||0)}]}
        actions={[{label:'Editar',run:account=>onOpenAccountModal(account)},{label:'Excluir',destructive:true,confirm:account=>'Excluir a conta "'+account.name+'"?',run:account=>onDeleteAccount(account.id)}]} />}

      {/* TAB 6: GESTÃO DE CATEGORIAS */}
      {activeTab === 'categories' && <RegistryTable title="Categorias financeiras" description="Classificação de receitas e despesas. Use Gerenciar para manter as categorias e seus limites." items={categories.filter(category=>category.name.toLowerCase().includes(searchQuery.toLowerCase()))} onCreate={onOpenCategoryModal} createLabel="Gerenciar Categorias"
        columns={[{label:'Categoria',render:category=><span className="flex items-center gap-2"><CategoryIcon name={category.icon} className="h-4 w-4"/><strong>{category.name}</strong></span>},{label:'Tipo',render:category=>category.type==='income'?'Receita':'Despesa'},{label:'Categoria principal',render:category=>categories.find(c=>c.id===category.parentId)?.name||'Principal'},{label:'Limite mensal',sortValue:category=>category.budgetLimit,render:category=>category.budgetLimit?formatCurrency(category.budgetLimit):'Sem limite'}]}
        actions={[{label:'Gerenciar',run:()=>onOpenCategoryModal()}]} />}

      {/* TAB 7: PESSOAS COM ACESSO & USUÁRIOS */}
      {activeTab === 'members' && (
        <div className="space-y-5">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
            <div>
              <h3 className="text-sm font-bold text-slate-900 flex items-center gap-2">
                Pessoas com Acesso à Empresa
                {activeCompany && (
                  <span className="text-xs font-semibold px-2 py-0.5 rounded-full bg-indigo-50 text-indigo-700 border border-indigo-200">
                    {activeCompany.name}
                  </span>
                )}
              </h3>
              <p className="text-xs text-slate-500">
                Cadastre sócios, gestores e colaboradores para visualizarem e lançarem dados nesta empresa
              </p>
            </div>
            {onOpenManageMembers && (
              <button
                type="button"
                onClick={onOpenManageMembers}
                className="inline-flex items-center gap-1.5 px-3 py-1.5 text-xs font-bold text-indigo-700 bg-indigo-50 hover:bg-indigo-100 border border-indigo-200 rounded-lg transition-colors shrink-0"
              >
                <UserPlus className="w-3.5 h-3.5" />
                Gerenciador Completo de Acessos
              </button>
            )}
          </div>

          {/* Privacy isolation banner */}
          <div className="p-3.5 bg-emerald-50/80 border border-emerald-200/80 rounded-xl text-xs text-emerald-900 flex items-start gap-2.5">
            <ShieldCheck className="w-5 h-5 text-emerald-600 shrink-0 mt-0.5" />
            <div>
              <p className="font-bold text-emerald-950">Isolamento Seguro de Dados por Empresa</p>
              <p className="text-emerald-800 text-[11px] mt-0.5 leading-relaxed">
                As pessoas adicionadas aqui terão acesso <strong>exclusivamente aos lançamentos de {activeCompany?.name || 'esta empresa'}</strong>.
                Suas despesas pessoais e outras empresas permanecem <strong>100% privadas e invisíveis</strong> para elas.
              </p>
            </div>
          </div>

          {memberError && (
            <div className="p-3 bg-rose-50 border border-rose-200 text-rose-700 text-xs rounded-xl flex items-center gap-2">
              <AlertCircle className="w-4 h-4 shrink-0" />
              <span>{memberError}</span>
            </div>
          )}

          {memberSuccess && (
            <div className="p-3 bg-emerald-50 border border-emerald-200 text-emerald-700 text-xs rounded-xl flex items-center gap-2">
              <CheckCircle2 className="w-4 h-4 shrink-0 text-emerald-600" />
              <span>{memberSuccess}</span>
            </div>
          )}

          {/* Direct Cadastro de Nova Pessoa Form */}
          {activeCompany && canManageMembers ? (
            <form onSubmit={handleAddMemberSubmit} className="p-4 bg-white border border-slate-200 rounded-2xl shadow-2xs space-y-4">
              <div className="flex items-center justify-between">
                <h4 className="text-xs font-bold text-slate-800 uppercase tracking-wider flex items-center gap-1.5">
                  <UserPlus className="w-4 h-4 text-indigo-600" />
                  Cadastrar Pessoa para ter Acesso a esta Empresa
                </h4>
                <span className="text-[11px] text-emerald-700 font-medium bg-emerald-50 px-2 py-0.5 rounded-full border border-emerald-100">
                  Sistema Isolado para {activeCompany.name}
                </span>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div>
                  <label className="block text-[11px] font-semibold text-slate-700 mb-1">
                    E-mail da Pessoa *
                  </label>
                  <div className="relative">
                    <Mail className="w-3.5 h-3.5 text-slate-400 absolute left-3 top-2.5" />
                    <input
                      type="email"
                      required
                      value={newMemberEmail}
                      onChange={(e) => setNewMemberEmail(e.target.value)}
                      placeholder="socio@exemplo.com"
                      className="w-full pl-8 pr-3 py-1.5 border border-slate-300 rounded-xl text-xs text-slate-900 placeholder:text-slate-400 focus:outline-none focus:ring-2 focus:ring-indigo-500 bg-white"
                    />
                  </div>
                </div>

                <div>
                  <label className="block text-[11px] font-semibold text-slate-700 mb-1">
                    Nome / Cargo (Opcional)
                  </label>
                  <input
                    type="text"
                    value={newMemberName}
                    onChange={(e) => setNewMemberName(e.target.value)}
                    placeholder="Ex: Carlos (Sócio Comercial) ou Ana (Financeiro)"
                    className="w-full px-3 py-1.5 border border-slate-300 rounded-xl text-xs text-slate-900 placeholder:text-slate-400 focus:outline-none focus:ring-2 focus:ring-indigo-500 bg-white"
                  />
                </div>
              </div>

              {/* Role Presets */}
              <div>
                <label className="block text-[11px] font-semibold text-slate-700 mb-1.5">
                  Perfil de Acesso (Função):
                </label>
                <div className="grid grid-cols-2 sm:grid-cols-4 gap-2">
                  {[
                    { id: 'partner', label: 'Sócio / Gestor', desc: 'Acesso total a lançamentos' },
                    { id: 'admin', label: 'Administrador', desc: 'Total + Convidar membros' },
                    { id: 'operator', label: 'Operador / Lançador', desc: 'Lança e cadastra (sem exclusão)' },
                    { id: 'viewer', label: 'Visualizador', desc: 'Apenas relatórios e consulta' },
                  ].map((item) => {
                    const active = newMemberRole === item.id;
                    return (
                      <button
                        key={item.id}
                        type="button"
                        onClick={() => handleRolePresetSelect(item.id as CompanyRole)}
                        className={`p-2 rounded-xl text-left border transition flex flex-col justify-between ${
                          active
                            ? 'bg-indigo-50 border-indigo-500 ring-2 ring-indigo-500/20 text-indigo-950 font-bold'
                            : 'bg-white border-slate-200 hover:border-slate-300 text-slate-700 font-medium'
                        }`}
                      >
                        <span className="text-xs">{item.label}</span>
                        <span className="text-[10px] text-slate-500 font-normal mt-0.5">{item.desc}</span>
                      </button>
                    );
                  })}
                </div>
              </div>

              {/* Expandable detailed permissions */}
              <div className="border border-slate-200 rounded-xl overflow-hidden bg-slate-50/50">
                <button
                  type="button"
                  onClick={() => setShowMemberPermsDrawer((prev) => !prev)}
                  className="w-full px-3.5 py-2 flex items-center justify-between text-xs font-semibold text-slate-700 hover:bg-slate-100 transition"
                >
                  <div className="flex items-center gap-2">
                    <SlidersHorizontal className="w-3.5 h-3.5 text-indigo-600" />
                    <span>Ver e Personalizar Permissões Detalhadas</span>
                    {newMemberRole === 'custom' && (
                      <span className="text-[10px] bg-indigo-100 text-indigo-700 px-2 py-0.5 rounded-full font-bold">
                        Personalizado
                      </span>
                    )}
                  </div>
                  {showMemberPermsDrawer ? <ChevronUp className="w-4 h-4" /> : <ChevronDown className="w-4 h-4" />}
                </button>

                {showMemberPermsDrawer && (
                  <div className="p-3 bg-white border-t border-slate-200 divide-y divide-slate-100 space-y-2">
                    <label className="flex items-start gap-2.5 pt-1.5 cursor-pointer">
                      <input
                        type="checkbox"
                        checked={newMemberPermissions.canCreateTransactions}
                        onChange={() => handleToggleNewPerm('canCreateTransactions')}
                        className="mt-0.5 w-4 h-4 rounded text-indigo-600 focus:ring-indigo-500 border-slate-300"
                      />
                      <div>
                        <div className="text-xs font-bold text-slate-800 flex items-center gap-1.5">
                          <DollarSign className="w-3.5 h-3.5 text-emerald-600" />
                          Lançar Despesas, Receitas e Transferências
                        </div>
                        <p className="text-[11px] text-slate-500">Permite registrar novas movimentações financeiras.</p>
                      </div>
                    </label>

                    <label className="flex items-start gap-2.5 pt-2 cursor-pointer">
                      <input
                        type="checkbox"
                        checked={newMemberPermissions.canEditTransactions}
                        onChange={() => handleToggleNewPerm('canEditTransactions')}
                        className="mt-0.5 w-4 h-4 rounded text-indigo-600 focus:ring-indigo-500 border-slate-300"
                      />
                      <div>
                        <div className="text-xs font-bold text-slate-800 flex items-center gap-1.5">
                          <Edit3 className="w-3.5 h-3.5 text-amber-600" />
                          Editar Lançamentos Existentes
                        </div>
                        <p className="text-[11px] text-slate-500">Permite editar dados de lançamentos já salvos.</p>
                      </div>
                    </label>

                    <label className="flex items-start gap-2.5 pt-2 cursor-pointer">
                      <input
                        type="checkbox"
                        checked={newMemberPermissions.canDeleteTransactions}
                        onChange={() => handleToggleNewPerm('canDeleteTransactions')}
                        className="mt-0.5 w-4 h-4 rounded text-rose-600 focus:ring-rose-500 border-slate-300"
                      />
                      <div>
                        <div className="text-xs font-bold text-slate-800 flex items-center gap-1.5">
                          <Trash2 className="w-3.5 h-3.5 text-rose-600" />
                          Excluir Lançamentos
                        </div>
                        <p className="text-[11px] text-slate-500">Permite remover despesas ou receitas do sistema.</p>
                      </div>
                    </label>

                    <label className="flex items-start gap-2.5 pt-2 cursor-pointer">
                      <input
                        type="checkbox"
                        checked={newMemberPermissions.canManageRegistries}
                        onChange={() => handleToggleNewPerm('canManageRegistries')}
                        className="mt-0.5 w-4 h-4 rounded text-indigo-600 focus:ring-indigo-500 border-slate-300"
                      />
                      <div>
                        <div className="text-xs font-bold text-slate-800 flex items-center gap-1.5">
                          <FolderPlus className="w-3.5 h-3.5 text-blue-600" />
                          Gerenciar Contas Bancárias, Cartões e Favorecidos
                        </div>
                        <p className="text-[11px] text-slate-500">Permite cadastrar e alterar contas, cartões e fornecedores.</p>
                      </div>
                    </label>

                    <label className="flex items-start gap-2.5 pt-2 cursor-pointer">
                      <input
                        type="checkbox"
                        checked={newMemberPermissions.canViewReports}
                        onChange={() => handleToggleNewPerm('canViewReports')}
                        className="mt-0.5 w-4 h-4 rounded text-indigo-600 focus:ring-indigo-500 border-slate-300"
                      />
                      <div>
                        <div className="text-xs font-bold text-slate-800 flex items-center gap-1.5">
                          <BarChart3 className="w-3.5 h-3.5 text-purple-600" />
                          Visualizar Relatórios e DRE
                        </div>
                        <p className="text-[11px] text-slate-500">Permite acesso aos demonstrativos e gráficos comparativos.</p>
                      </div>
                    </label>

                    <label className="flex items-start gap-2.5 pt-2 cursor-pointer">
                      <input
                        type="checkbox"
                        checked={newMemberPermissions.canManageMembers}
                        onChange={() => handleToggleNewPerm('canManageMembers')}
                        className="mt-0.5 w-4 h-4 rounded text-indigo-600 focus:ring-indigo-500 border-slate-300"
                      />
                      <div>
                        <div className="text-xs font-bold text-slate-800 flex items-center gap-1.5">
                          <Users className="w-3.5 h-3.5 text-indigo-600" />
                          Convidar e Gerenciar Outros Membros
                        </div>
                        <p className="text-[11px] text-slate-500">Permite adicionar ou alterar permissões de outros usuários.</p>
                      </div>
                    </label>
                  </div>
                )}
              </div>

              <div className="flex justify-end pt-1">
                <button
                  type="submit"
                  disabled={memberLoading}
                  className="inline-flex items-center gap-1.5 px-5 py-2.5 bg-indigo-600 hover:bg-indigo-700 disabled:opacity-50 text-white text-xs font-bold rounded-xl transition shadow-xs"
                >
                  <UserPlus className="w-4 h-4" />
                  {memberLoading ? 'Cadastrando...' : 'Cadastrar e Conceder Permissões'}
                </button>
              </div>
            </form>
          ) : (
            <div className="p-3.5 bg-slate-50 border border-slate-200 rounded-xl text-xs text-slate-600">
              Você está visualizando esta empresa como membro autorizado. O proprietário ({activeCompany?.ownerEmail}) gerencia os cadastros de acesso.
            </div>
          )}

          {/* Quick guide on how access works */}
          <div className="p-3.5 bg-indigo-50/70 border border-indigo-100 rounded-xl text-xs space-y-2">
            <div className="flex items-center justify-between">
              <span className="font-bold text-indigo-950 flex items-center gap-1.5">
                <Sparkles className="w-3.5 h-3.5 text-indigo-600" />
                Como a pessoa cadastrada entra no sistema?
              </span>
              <button
                type="button"
                onClick={handleCopyInvite}
                className="inline-flex items-center gap-1 px-2.5 py-1 text-[11px] font-semibold bg-white hover:bg-indigo-100 text-indigo-700 border border-indigo-200 rounded-lg transition"
              >
                {copiedInvite ? <Check className="w-3 h-3 text-emerald-600" /> : <Copy className="w-3 h-3" />}
                {copiedInvite ? 'Link Copiado!' : 'Copiar Convite'}
              </button>
            </div>
            <p className="text-indigo-800 text-[11px] leading-relaxed">
              1. Envie o link da aplicação para a pessoa.<br />
              2. Na tela de login, ela simplesmente entra ou cadastra uma senha usando o <strong>mesmo e-mail</strong> adicionado acima.<br />
              3. O ambiente independente da empresa <strong>{activeCompany?.name}</strong> aparecerá imediatamente disponível para ela com as permissões atribuídas!
            </p>
          </div>

          {/* List of members with search filter */}
          <div>
            <h4 className="text-xs font-bold text-slate-700 uppercase tracking-wider mb-2.5">
              Pessoas Cadastradas nesta Empresa ({activeCompany?.memberEmails?.length || 0})
            </h4>

            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-3">
              {(activeCompany?.memberEmails || [])
                .filter((email) => {
                  if (!searchQuery) return true;
                  const query = searchQuery.toLowerCase();
                  const memberInfo = (activeCompany?.membersInfo || []).find(
                    (m) => (m.email || '').toLowerCase() === email.toLowerCase()
                  );
                  return (
                    email.toLowerCase().includes(query) ||
                    (memberInfo?.name || '').toLowerCase().includes(query)
                  );
                })
                .map((email) => {
                  const cleanEmail = email.toLowerCase().trim();
                  const isThisOwner = cleanEmail === (activeCompany?.ownerEmail || '').toLowerCase().trim();
                  const isCurrentUser = cleanEmail === (currentUserEmail || '').toLowerCase().trim();
                  const memberInfo = (activeCompany?.membersInfo || []).find(
                    (m) => (m.email || '').toLowerCase().trim() === cleanEmail
                  );

                  const role = isThisOwner ? 'owner' : (memberInfo?.role || 'partner');
                  const roleLabel =
                    role === 'owner'
                      ? 'Proprietário'
                      : role === 'admin'
                      ? 'Administrador'
                      : role === 'operator'
                      ? 'Operador / Lançador'
                      : role === 'viewer'
                      ? 'Visualizador (Consulta)'
                      : role === 'custom'
                      ? 'Personalizado'
                      : 'Sócio / Gestor';

                  const perms = memberInfo?.permissions || DEFAULT_ROLE_PERMISSIONS[role as CompanyRole] || DEFAULT_ROLE_PERMISSIONS.partner;

                  return (
                    <div
                      key={email}
                      className="p-4 rounded-2xl border border-slate-200 bg-white shadow-2xs flex flex-col justify-between gap-3 hover:shadow-xs transition"
                    >
                      <div className="flex items-start gap-3 min-w-0">
                        <div className="w-10 h-10 rounded-xl bg-indigo-50 border border-indigo-100 text-indigo-700 flex items-center justify-center font-bold text-sm uppercase shrink-0 mt-0.5">
                          {email.slice(0, 2)}
                        </div>
                        <div className="min-w-0 flex-1">
                          <div className="font-bold text-xs text-slate-900 flex items-center gap-1.5 flex-wrap">
                            <span className="truncate">{memberInfo?.name || email}</span>
                            {isCurrentUser && (
                              <span className="text-[10px] bg-slate-100 text-slate-700 px-1.5 py-0.2 rounded font-semibold shrink-0">
                                Você
                              </span>
                            )}
                          </div>
                          <div className="text-[11px] text-slate-500 truncate mt-0.5">
                            {email}
                          </div>

                          <div className="mt-1.5 flex items-center gap-1 flex-wrap">
                            {isThisOwner ? (
                              <span className="inline-flex items-center gap-1 text-[10px] font-bold text-amber-700 bg-amber-50 px-2 py-0.5 rounded-full border border-amber-200">
                                <Crown className="w-3 h-3 text-amber-500" /> {roleLabel}
                              </span>
                            ) : (
                              <span className="inline-flex items-center gap-1 text-[10px] font-bold text-indigo-700 bg-indigo-50 px-2 py-0.5 rounded-full border border-indigo-200">
                                <Shield className="w-3 h-3 text-indigo-500" /> {roleLabel}
                              </span>
                            )}

                            {!isThisOwner && perms && (
                              <>
                                {perms.canCreateTransactions && (
                                  <span className="text-[9px] text-emerald-700 bg-emerald-50 px-1.5 py-0.2 rounded font-medium border border-emerald-100">
                                    Lança
                                  </span>
                                )}
                                {!perms.canDeleteTransactions && (
                                  <span className="text-[9px] text-slate-600 bg-slate-100 px-1.5 py-0.2 rounded font-medium">
                                    Sem Exclusão
                                  </span>
                                )}
                              </>
                            )}
                          </div>
                        </div>
                      </div>

                      {/* Actions: Edit permissions or delete */}
                      <div className="flex items-center justify-end gap-1.5 pt-2 border-t border-slate-100">
                        {canManageMembers && !isThisOwner && onUpdateMember && (
                          <button
                            type="button"
                            onClick={() =>
                              setEditingMemberForPerms({
                                email,
                                name: memberInfo?.name || '',
                                role: (memberInfo?.role || 'partner') as CompanyRole,
                                permissions: perms,
                                addedAt: memberInfo?.addedAt || Date.now(),
                              })
                            }
                            className="inline-flex items-center gap-1 px-2.5 py-1 text-xs font-semibold text-slate-700 bg-slate-50 hover:bg-indigo-50 hover:text-indigo-700 hover:border-indigo-200 border border-slate-200 rounded-lg transition"
                          >
                            <SlidersHorizontal className="w-3.5 h-3.5" />
                            Editar Permissões
                          </button>
                        )}

                        {canManageMembers && !isThisOwner && (
                          <button
                            type="button"
                            onClick={() => handleRemoveMemberAction(email)}
                            disabled={memberLoading}
                            className="inline-flex items-center gap-1.5 border border-rose-200 px-3 py-2 text-xs font-semibold text-rose-700 hover:bg-rose-50 rounded-lg transition"
                            title="Revogar acesso"
                          >
                            <Trash2 className="w-4 h-4" /><span>Revogar acesso</span>
                          </button>
                        )}
                      </div>
                    </div>
                  );
                })}
            </div>
          </div>
        </div>
      )}

      {/* TAB: PATRIMÔNIO / EQUIPAMENTOS */}
      {activeTab === 'equipment' && <RegistryTable title="Patrimônio e equipamentos" description="Inventário de equipamentos, ferramentas e valores de locação." items={equipment.filter(item=>(item.name+' '+(item.brand||'')+' '+(item.serialNumber||'')).toLowerCase().includes(searchQuery.toLowerCase()))} onCreate={()=>onOpenEquipmentModal()} createLabel="Novo Equipamento"
        columns={[{label:'Equipamento',render:item=><strong>{item.name}</strong>},{label:'Marca',render:item=>item.brand||'Não informada'},{label:'Nº de série',render:item=>item.serialNumber||'Não informado'},{label:'Situação',render:item=>({available:'Disponível',rented:'Locado',maintenance:'Manutenção',broken:'Avariado'}[item.status])},{label:'Diária',sortValue:item=>item.dailyRate,render:item=>formatCurrency(item.dailyRate)}]}
        actions={[{label:'Editar',run:item=>onOpenEquipmentModal(item)},{label:'Excluir',destructive:true,confirm:item=>'Excluir o equipamento "'+item.name+'"?',run:item=>onDeleteEquipment(item.id)}]} />}

      {/* Permissions Modal from Registries tab */}
      {editingMemberForPerms && onUpdateMember && activeCompany && (
        <EditMemberPermissionsModal
          isOpen={!!editingMemberForPerms}
          onClose={() => setEditingMemberForPerms(null)}
          company={activeCompany}
          member={editingMemberForPerms}
          currentUserEmail={currentUserEmail}
          onSave={onUpdateMember}
        />
      )}
    </div>
  );
};
