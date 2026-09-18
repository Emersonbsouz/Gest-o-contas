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
} from '../types';
import { formatCurrency, formatDateBR } from '../utils/formatters';
import { EditMemberPermissionsModal } from './EditMemberPermissionsModal';

interface RegistriesViewProps {
  cards: CreditCard[];
  contacts: ContactPerson[];
  recurringBills: RecurringBill[];
  goals: FinancialGoal[];
  accounts: TreasuryAccount[];
  categories: Category[];
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

  onOpenRecurringModal: (bill?: RecurringBill) => void;
  onDeleteRecurring: (billId: string) => void;
  onTriggerRecurringBill: (bill: RecurringBill) => void;

  onOpenGoalModal: (goal?: FinancialGoal) => void;
  onDeleteGoal: (goalId: string) => void;
  onUpdateGoalAmount: (goalId: string, newAmount: number) => void;

  onOpenAccountModal: (account?: TreasuryAccount) => void;
  onDeleteAccount: (accountId: string) => void;

  onOpenCategoryModal: () => void;
}

type ActiveRegistryTab = 'cards' | 'contacts' | 'recurring' | 'goals' | 'accounts' | 'members';

export const RegistriesView: React.FC<RegistriesViewProps> = ({
  cards = [],
  contacts = [],
  recurringBills = [],
  goals = [],
  accounts = [],
  categories = [],
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
}) => {
  const [activeTab, setActiveTab] = useState<ActiveRegistryTab>('cards');
  const [searchQuery, setSearchQuery] = useState('');
  const [typeFilter, setTypeFilter] = useState('all');

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
    return contacts.filter((c) => {
      const matchSearch =
        c.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
        (c.document && c.document.includes(searchQuery)) ||
        (c.phone && c.phone.includes(searchQuery)) ||
        (c.email && c.email.toLowerCase().includes(searchQuery.toLowerCase()));
      const matchType = typeFilter === 'all' || c.type === typeFilter;
      return matchSearch && matchType;
    });
  }, [contacts, searchQuery, typeFilter]);

  // Filtered Recurring Bills
  const filteredRecurring = useMemo(() => {
    return recurringBills.filter((b) => {
      const matchSearch =
        b.description.toLowerCase().includes(searchQuery.toLowerCase()) ||
        (b.notes && b.notes.toLowerCase().includes(searchQuery.toLowerCase()));
      const matchType = typeFilter === 'all' || b.type === typeFilter;
      return matchSearch && matchType;
    });
  }, [recurringBills, searchQuery, typeFilter]);

  // Filtered Goals
  const filteredGoals = useMemo(() => {
    return goals.filter((g) =>
      g.title.toLowerCase().includes(searchQuery.toLowerCase())
    );
  }, [goals, searchQuery]);

  // Total Recurring expenses and incomes
  const totalRecurringExpenses = useMemo(() => {
    return recurringBills
      .filter((b) => b.type === 'expense' && b.active)
      .reduce((sum, b) => sum + b.amount, 0);
  }, [recurringBills]);

  const totalRecurringIncomes = useMemo(() => {
    return recurringBills
      .filter((b) => b.type === 'income' && b.active)
      .reduce((sum, b) => sum + b.amount, 0);
  }, [recurringBills]);

  const totalCreditLimit = useMemo(() => {
    return cards.reduce((sum, c) => sum + c.limit, 0);
  }, [cards]);

  return (
    <div className="space-y-6">
      {/* Top Banner & Hub Title */}
      <div className="bg-white rounded-2xl p-5 sm:p-6 border border-slate-200 shadow-2xs">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div>
            <div className="flex items-center gap-2 mb-1">
              <span className="px-2.5 py-0.5 rounded-full bg-indigo-50 text-indigo-700 text-xs font-bold uppercase tracking-wider border border-indigo-100">
                Hub de Configuração & Parâmetros
              </span>
              <span className="text-xs text-slate-400">• Cadastre tudo necessário</span>
            </div>
            <h2 className="text-xl sm:text-2xl font-black text-slate-900 tracking-tight">
              Central de Cadastros Financeiros
            </h2>
            <p className="text-xs sm:text-sm text-slate-500 mt-1">
              Gerencie cartões de crédito, fornecedores, contas recorrentes, metas de economia, categorias e contas bancárias.
            </p>
          </div>

          <div className="flex items-center gap-2 flex-wrap">
            <button
              onClick={onOpenCategoryModal}
              className="inline-flex items-center gap-1.5 px-3 py-2 text-xs font-semibold text-slate-700 hover:text-slate-900 bg-slate-50 hover:bg-slate-100 border border-slate-200 rounded-xl transition-colors"
            >
              <Tag className="w-3.5 h-3.5 text-indigo-600" />
              Categorias & Tetos
            </button>

            <button
              onClick={() => {
                if (activeTab === 'cards') onOpenCardModal();
                else if (activeTab === 'contacts') onOpenContactModal();
                else if (activeTab === 'recurring') onOpenRecurringModal();
                else if (activeTab === 'goals') onOpenGoalModal();
                else if (activeTab === 'accounts') onOpenAccountModal();
              }}
              className="inline-flex items-center gap-1.5 px-4 py-2 text-xs font-bold text-white bg-indigo-600 hover:bg-indigo-700 rounded-xl shadow-xs transition-colors"
            >
              <Plus className="w-4 h-4" />
              {activeTab === 'cards' && 'Novo Cartão'}
              {activeTab === 'contacts' && 'Novo Contato / Fornecedor'}
              {activeTab === 'recurring' && 'Nova Conta Recorrente'}
              {activeTab === 'goals' && 'Nova Meta Financeira'}
              {activeTab === 'accounts' && 'Nova Conta / Caixa'}
            </button>
          </div>
        </div>

        {/* Quick KPI Bar for Registered Entities */}
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 mt-5 pt-5 border-t border-slate-100">
          <div className="p-3 rounded-xl bg-slate-50/80 border border-slate-100">
            <span className="text-[11px] font-semibold text-slate-500 block">Cartões de Crédito</span>
            <span className="text-base font-bold text-slate-900">{cards.length} cadastrados</span>
            <span className="text-[10px] text-slate-400 block mt-0.5">Limite: {formatCurrency(totalCreditLimit)}</span>
          </div>

          <div className="p-3 rounded-xl bg-slate-50/80 border border-slate-100">
            <span className="text-[11px] font-semibold text-slate-500 block">Favorecidos & Fornecedores</span>
            <span className="text-base font-bold text-slate-900">{contacts.length} cadastrados</span>
            <span className="text-[10px] text-slate-400 block mt-0.5">Comércios, clientes e prestadores</span>
          </div>

          <div className="p-3 rounded-xl bg-slate-50/80 border border-slate-100">
            <span className="text-[11px] font-semibold text-slate-500 block">Contas Fixas / Mês</span>
            <span className="text-base font-bold text-slate-900">{formatCurrency(totalRecurringExpenses)}</span>
            <span className="text-[10px] text-slate-400 block mt-0.5">Receitas fixas: {formatCurrency(totalRecurringIncomes)}</span>
          </div>

          <div className="p-3 rounded-xl bg-slate-50/80 border border-slate-100">
            <span className="text-[11px] font-semibold text-slate-500 block">Metas em Progresso</span>
            <span className="text-base font-bold text-slate-900">{goals.length} objetivos</span>
            <span className="text-[10px] text-slate-400 block mt-0.5">Reservas e projetos de vida</span>
          </div>
        </div>
      </div>

      {/* Tabs Selector Navigation */}
      <div className="flex items-center justify-between gap-3 border-b border-slate-200 pb-2 overflow-x-auto">
        <div className="flex items-center gap-1.5 shrink-0">
          <button
            onClick={() => {
              setActiveTab('cards');
              setSearchQuery('');
              setTypeFilter('all');
            }}
            className={`flex items-center gap-2 px-3.5 py-2 rounded-xl text-xs font-bold transition-all ${
              activeTab === 'cards'
                ? 'bg-indigo-600 text-white shadow-xs'
                : 'bg-white text-slate-600 hover:text-slate-900 hover:bg-slate-100 border border-slate-200/80'
            }`}
          >
            <CreditCardIcon className="w-3.5 h-3.5" />
            Cartões de Crédito ({cards.length})
          </button>

          <button
            onClick={() => {
              setActiveTab('contacts');
              setSearchQuery('');
              setTypeFilter('all');
            }}
            className={`flex items-center gap-2 px-3.5 py-2 rounded-xl text-xs font-bold transition-all ${
              activeTab === 'contacts'
                ? 'bg-indigo-600 text-white shadow-xs'
                : 'bg-white text-slate-600 hover:text-slate-900 hover:bg-slate-100 border border-slate-200/80'
            }`}
          >
            <Users className="w-3.5 h-3.5" />
            Favorecidos & Fornecedores ({contacts.length})
          </button>

          <button
            onClick={() => {
              setActiveTab('recurring');
              setSearchQuery('');
              setTypeFilter('all');
            }}
            className={`flex items-center gap-2 px-3.5 py-2 rounded-xl text-xs font-bold transition-all ${
              activeTab === 'recurring'
                ? 'bg-indigo-600 text-white shadow-xs'
                : 'bg-white text-slate-600 hover:text-slate-900 hover:bg-slate-100 border border-slate-200/80'
            }`}
          >
            <RefreshCw className="w-3.5 h-3.5" />
            Contas Recorrentes ({recurringBills.length})
          </button>

          <button
            onClick={() => {
              setActiveTab('goals');
              setSearchQuery('');
              setTypeFilter('all');
            }}
            className={`flex items-center gap-2 px-3.5 py-2 rounded-xl text-xs font-bold transition-all ${
              activeTab === 'goals'
                ? 'bg-indigo-600 text-white shadow-xs'
                : 'bg-white text-slate-600 hover:text-slate-900 hover:bg-slate-100 border border-slate-200/80'
            }`}
          >
            <Target className="w-3.5 h-3.5" />
            Metas & Sonhos ({goals.length})
          </button>

          <button
            onClick={() => {
              setActiveTab('accounts');
              setSearchQuery('');
              setTypeFilter('all');
            }}
            className={`flex items-center gap-2 px-3.5 py-2 rounded-xl text-xs font-bold transition-all ${
              activeTab === 'accounts'
                ? 'bg-indigo-600 text-white shadow-xs'
                : 'bg-white text-slate-600 hover:text-slate-900 hover:bg-slate-100 border border-slate-200/80'
            }`}
          >
            <Wallet className="w-3.5 h-3.5" />
            Contas & Caixas ({accounts.length})
          </button>

          <button
            onClick={() => {
              setActiveTab('members');
              setSearchQuery('');
              setTypeFilter('all');
            }}
            className={`flex items-center gap-2 px-3.5 py-2 rounded-xl text-xs font-bold transition-all shrink-0 ${
              activeTab === 'members'
                ? 'bg-indigo-600 text-white shadow-xs'
                : 'bg-white text-slate-600 hover:text-slate-900 hover:bg-slate-100 border border-slate-200/80'
            }`}
          >
            <UserPlus className="w-3.5 h-3.5" />
            Pessoas com Acesso ({activeCompany?.memberEmails?.length || 1})
          </button>
        </div>

        {/* Search Input */}
        <div className="relative min-w-44 max-w-xs shrink-0">
          <Search className="w-3.5 h-3.5 text-slate-400 absolute left-3 top-2.5" />
          <input
            type="text"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            placeholder="Buscar cadastro..."
            className="w-full pl-8 pr-3 py-1.5 text-xs rounded-xl border border-slate-200 bg-white focus:outline-none focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500"
          />
        </div>
      </div>

      {/* TAB 1: CARTÕES DE CRÉDITO */}
      {activeTab === 'cards' && (
        <div className="space-y-4">
          <div className="flex items-center justify-between">
            <div>
              <h3 className="text-sm font-bold text-slate-900">Cartões de Crédito Cadastrados</h3>
              <p className="text-xs text-slate-500">
                Defina limites, dia de fechamento da fatura e dia de vencimento para controle de gastos
              </p>
            </div>
            <button
              onClick={() => onOpenCardModal()}
              className="inline-flex items-center gap-1 px-3 py-1.5 text-xs font-bold text-indigo-600 hover:text-indigo-700 bg-indigo-50 hover:bg-indigo-100 rounded-lg transition-colors"
            >
              <Plus className="w-3.5 h-3.5" />
              Novo Cartão
            </button>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {filteredCards.map((card) => (
              <div
                key={card.id}
                className="rounded-2xl border border-slate-200 bg-white shadow-2xs overflow-hidden flex flex-col justify-between hover:shadow-xs transition-shadow"
              >
                {/* Visual Card simulation */}
                <div
                  className="p-5 text-white relative overflow-hidden"
                  style={{
                    background: `linear-gradient(135deg, ${card.color}, ${card.color}cc 70%, #0f172a 120%)`,
                  }}
                >
                  <div className="flex justify-between items-start mb-6">
                    <div>
                      <span className="text-[10px] uppercase font-bold tracking-wider text-white/80">
                        Cartão de Crédito
                      </span>
                      <h4 className="text-base font-black tracking-wide mt-0.5">{card.name}</h4>
                    </div>
                    <span className="text-[11px] font-black uppercase px-2 py-0.5 rounded-md bg-white/20 backdrop-blur-xs">
                      {card.brand}
                    </span>
                  </div>

                  <div className="flex items-end justify-between text-xs pt-3 border-t border-white/20">
                    <div>
                      <span className="text-[10px] text-white/70 block">Limite Total</span>
                      <span className="text-base font-black tracking-tight">
                        {formatCurrency(card.limit)}
                      </span>
                    </div>
                    <div className="text-right">
                      <span className="text-[10px] text-white/70 block">Fechamento / Vcto</span>
                      <span className="font-bold">Dia {card.closingDay} / Dia {card.dueDay}</span>
                    </div>
                  </div>
                </div>

                {/* Card Details & Actions */}
                <div className="p-4 bg-white flex-1 flex flex-col justify-between text-xs space-y-3">
                  <div className="space-y-1.5 text-slate-600">
                    <div className="flex justify-between items-center">
                      <span className="text-slate-400">Conta p/ Pagamento:</span>
                      <span className="font-semibold text-slate-800">
                        {card.linkedAccountId ? accountMap.get(card.linkedAccountId) || 'Não vinculada' : 'Não vinculada'}
                      </span>
                    </div>
                    {card.notes && (
                      <p className="text-[11px] text-slate-500 italic line-clamp-2 pt-1">
                        "{card.notes}"
                      </p>
                    )}
                  </div>

                  <div className="flex items-center justify-end gap-1.5 pt-3 border-t border-slate-100">
                    <button
                      onClick={() => onOpenCardModal(card)}
                      className="inline-flex items-center gap-1 px-2.5 py-1 text-slate-600 hover:text-indigo-600 hover:bg-indigo-50 rounded-lg transition-colors font-medium"
                    >
                      <Edit2 className="w-3.5 h-3.5" />
                      Editar
                    </button>
                    <button
                      onClick={() => {
                        if (window.confirm(`Deseja excluir o cartão "${card.name}"?`)) {
                          onDeleteCard(card.id);
                        }
                      }}
                      className="inline-flex items-center gap-1 px-2.5 py-1 text-slate-400 hover:text-rose-600 hover:bg-rose-50 rounded-lg transition-colors font-medium"
                    >
                      <Trash2 className="w-3.5 h-3.5" />
                      Excluir
                    </button>
                  </div>
                </div>
              </div>
            ))}

            {filteredCards.length === 0 && (
              <div className="col-span-full text-center py-12 bg-white rounded-2xl border border-slate-200 p-8">
                <CreditCardIcon className="w-10 h-10 text-slate-300 mx-auto mb-2" />
                <h4 className="text-sm font-bold text-slate-800">Nenhum cartão encontrado</h4>
                <p className="text-xs text-slate-500 mt-1 max-w-sm mx-auto">
                  Cadastre seus cartões de crédito para registrar compras parceladas e datas de fatura.
                </p>
                <button
                  onClick={() => onOpenCardModal()}
                  className="mt-4 px-4 py-2 bg-indigo-600 text-white rounded-xl text-xs font-bold hover:bg-indigo-700 transition-colors"
                >
                  Cadastrar Primeiro Cartão
                </button>
              </div>
            )}
          </div>
        </div>
      )}

      {/* TAB 2: FAVORECIDOS & FORNECEDORES */}
      {activeTab === 'contacts' && (
        <div className="space-y-4">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
            <div>
              <h3 className="text-sm font-bold text-slate-900">Fornecedores, Clientes & Favorecidos</h3>
              <p className="text-xs text-slate-500">
                Cadastro de lojas, prestadores de serviço e clientes com dados de contato e Chave PIX
              </p>
            </div>

            {/* Filter by Contact Type */}
            <div className="flex items-center gap-2 flex-wrap">
              <select
                value={typeFilter}
                onChange={(e) => setTypeFilter(e.target.value)}
                className="px-3 py-1.5 text-xs rounded-xl border border-slate-200 bg-white font-medium text-slate-700 focus:outline-none focus:ring-2 focus:ring-indigo-500/20"
              >
                <option value="all">Todos os Tipos</option>
                <option value="supplier">Fornecedores / Lojas</option>
                <option value="customer">Clientes / Pagadores</option>
                <option value="service_provider">Prestadores de Serviços</option>
                <option value="other">Outros</option>
              </select>

              <button
                onClick={() => onOpenContactModal()}
                className="inline-flex items-center gap-1 px-3 py-1.5 text-xs font-bold text-indigo-600 hover:text-indigo-700 bg-indigo-50 hover:bg-indigo-100 rounded-lg transition-colors"
              >
                <Plus className="w-3.5 h-3.5" />
                Novo Favorecido
              </button>
            </div>
          </div>

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
                      customer: 'bg-emerald-50 text-emerald-700 border-emerald-200',
                      service_provider: 'bg-purple-50 text-purple-700 border-purple-200',
                      other: 'bg-slate-100 text-slate-700 border-slate-200',
                    }[contact.type] || 'bg-slate-100 text-slate-700 border-slate-200';

                    const typeLabels = {
                      supplier: 'Fornecedor',
                      customer: 'Cliente',
                      service_provider: 'Prestador',
                      other: 'Contato',
                    }[contact.type] || 'Contato';

                    return (
                      <tr key={contact.id} className="hover:bg-slate-50/70 transition-colors">
                        <td className="py-3 px-4">
                          <div className="font-bold text-slate-900">{contact.name}</div>
                          {contact.notes && (
                            <p className="text-[10px] text-slate-400 mt-0.5 line-clamp-1">
                              {contact.notes}
                            </p>
                          )}
                        </td>
                        <td className="py-3 px-4">
                          <span
                            className={`inline-flex items-center px-2 py-0.5 rounded-full text-[10px] font-bold uppercase border ${badgeStyles}`}
                          >
                            {typeLabels}
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
                              onClick={() => onOpenContactModal(contact)}
                              className="p-1.5 text-slate-500 hover:text-indigo-600 hover:bg-indigo-50 rounded-lg transition-colors"
                              title="Editar contato"
                            >
                              <Edit2 className="w-3.5 h-3.5" />
                            </button>
                            <button
                              onClick={() => {
                                if (window.confirm(`Excluir o contato "${contact.name}"?`)) {
                                  onDeleteContact(contact.id);
                                }
                              }}
                              className="p-1.5 text-slate-400 hover:text-rose-600 hover:bg-rose-50 rounded-lg transition-colors"
                              title="Excluir contato"
                            >
                              <Trash2 className="w-3.5 h-3.5" />
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
      {activeTab === 'recurring' && (
        <div className="space-y-4">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
            <div>
              <h3 className="text-sm font-bold text-slate-900">Contas Fixas & Recorrentes</h3>
              <p className="text-xs text-slate-500">
                Despesas e receitas que acontecem todos os meses (aluguel, condomínio, internet, salários).
              </p>
            </div>

            <div className="flex items-center gap-2 flex-wrap">
              <select
                value={typeFilter}
                onChange={(e) => setTypeFilter(e.target.value)}
                className="px-3 py-1.5 text-xs rounded-xl border border-slate-200 bg-white font-medium text-slate-700 focus:outline-none focus:ring-2 focus:ring-indigo-500/20"
              >
                <option value="all">Todas as Contas</option>
                <option value="expense">Apenas Despesas Fixas</option>
                <option value="income">Apenas Receitas Fixas</option>
              </select>

              <button
                onClick={() => onOpenRecurringModal()}
                className="inline-flex items-center gap-1 px-3 py-1.5 text-xs font-bold text-indigo-600 hover:text-indigo-700 bg-indigo-50 hover:bg-indigo-100 rounded-lg transition-colors"
              >
                <Plus className="w-3.5 h-3.5" />
                Nova Conta Recorrente
              </button>
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {filteredRecurring.map((bill) => {
              const isExpense = bill.type === 'expense';
              return (
                <div
                  key={bill.id}
                  className={`rounded-2xl border p-4 bg-white shadow-2xs flex flex-col justify-between transition-all ${
                    bill.active ? 'border-slate-200' : 'border-slate-200 opacity-60 bg-slate-50/50'
                  }`}
                >
                  <div>
                    {/* Header with Type and Due Day */}
                    <div className="flex items-center justify-between gap-2 mb-3">
                      <span
                        className={`inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-[10px] font-bold uppercase border ${
                          isExpense
                            ? 'bg-rose-50 text-rose-700 border-rose-200'
                            : 'bg-emerald-50 text-emerald-700 border-emerald-200'
                        }`}
                      >
                        {isExpense ? <ArrowUpRight className="w-3 h-3" /> : <ArrowDownLeft className="w-3 h-3" />}
                        {isExpense ? 'Despesa Fixa' : 'Receita Fixa'}
                      </span>

                      <span className="inline-flex items-center gap-1 text-xs font-bold text-slate-700 bg-slate-100 px-2 py-0.5 rounded-md">
                        <Calendar className="w-3 h-3 text-slate-500" />
                        Dia {bill.dueDay}
                      </span>
                    </div>

                    <h4 className="text-sm font-bold text-slate-900">{bill.description}</h4>

                    <div className="mt-2 flex items-baseline gap-1">
                      <span className={`text-lg font-black ${isExpense ? 'text-rose-600' : 'text-emerald-600'}`}>
                        {formatCurrency(bill.amount)}
                      </span>
                      <span className="text-[10px] text-slate-400">/mês</span>
                    </div>

                    <div className="mt-3 space-y-1 text-xs text-slate-500">
                      <div className="flex justify-between">
                        <span>Categoria:</span>
                        <span className="font-semibold text-slate-700">
                          {categoryMap.get(bill.categoryId) || 'Geral'}
                        </span>
                      </div>
                      <div className="flex justify-between">
                        <span>Conta / Cartão:</span>
                        <span className="font-semibold text-slate-700">
                          {bill.accountId
                            ? accountMap.get(bill.accountId) || 'Conta'
                            : bill.cardId
                            ? 'Cartão de Crédito'
                            : 'Padrão'}
                        </span>
                      </div>
                      {bill.contactId && (
                        <div className="flex justify-between">
                          <span>Favorecido:</span>
                          <span className="font-semibold text-slate-700">
                            {contactMap.get(bill.contactId) || 'Contato'}
                          </span>
                        </div>
                      )}
                    </div>
                  </div>

                  {/* Actions: Quick Trigger in current month & Edit */}
                  <div className="mt-4 pt-3 border-t border-slate-100 flex items-center justify-between gap-2">
                    <button
                      onClick={() => onTriggerRecurringBill(bill)}
                      title={`Lançar instantaneamente em ${currentYearMonth}`}
                      className="inline-flex items-center gap-1 px-3 py-1.5 text-xs font-bold text-indigo-700 bg-indigo-50 hover:bg-indigo-100 rounded-lg transition-colors"
                    >
                      <Sparkles className="w-3 h-3" />
                      Lançar no Mês
                    </button>

                    <div className="flex items-center gap-1">
                      <button
                        onClick={() => onOpenRecurringModal(bill)}
                        className="p-1.5 text-slate-400 hover:text-slate-700 rounded-lg transition-colors"
                        title="Editar"
                      >
                        <Edit2 className="w-3.5 h-3.5" />
                      </button>
                      <button
                        onClick={() => {
                          if (window.confirm(`Excluir a conta recorrente "${bill.description}"?`)) {
                            onDeleteRecurring(bill.id);
                          }
                        }}
                        className="p-1.5 text-slate-400 hover:text-rose-600 rounded-lg transition-colors"
                        title="Excluir"
                      >
                        <Trash2 className="w-3.5 h-3.5" />
                      </button>
                    </div>
                  </div>
                </div>
              );
            })}

            {filteredRecurring.length === 0 && (
              <div className="col-span-full text-center py-12 bg-white rounded-2xl border border-slate-200 p-8">
                <RefreshCw className="w-10 h-10 text-slate-300 mx-auto mb-2" />
                <h4 className="text-sm font-bold text-slate-800">Nenhuma conta recorrente cadastrada</h4>
                <p className="text-xs text-slate-500 mt-1 max-w-sm mx-auto">
                  Cadastre suas despesas e receitas fixas mensais para poder lançá-las rapidamente a cada virada de mês.
                </p>
                <button
                  onClick={() => onOpenRecurringModal()}
                  className="mt-4 px-4 py-2 bg-indigo-600 text-white rounded-xl text-xs font-bold hover:bg-indigo-700 transition-colors"
                >
                  Cadastrar Primeira Conta Recorrente
                </button>
              </div>
            )}
          </div>
        </div>
      )}

      {/* TAB 4: METAS & OBJETIVOS FINANCEIROS */}
      {activeTab === 'goals' && (
        <div className="space-y-4">
          <div className="flex items-center justify-between">
            <div>
              <h3 className="text-sm font-bold text-slate-900">Metas Financeiras & Sonhos</h3>
              <p className="text-xs text-slate-500">
                Acompanhe o acúmulo de reservas de emergência, viagens, aquisições e planos futuros
              </p>
            </div>
            <button
              onClick={() => onOpenGoalModal()}
              className="inline-flex items-center gap-1 px-3 py-1.5 text-xs font-bold text-indigo-600 hover:text-indigo-700 bg-indigo-50 hover:bg-indigo-100 rounded-lg transition-colors"
            >
              <Plus className="w-3.5 h-3.5" />
              Nova Meta
            </button>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {filteredGoals.map((goal) => {
              const percentage = Math.min(
                100,
                Math.round((goal.currentAmount / (goal.targetAmount || 1)) * 100)
              );
              const isCompleted = goal.currentAmount >= goal.targetAmount;

              return (
                <div
                  key={goal.id}
                  className="rounded-2xl border border-slate-200 bg-white p-5 shadow-2xs flex flex-col justify-between hover:shadow-xs transition-shadow"
                >
                  <div>
                    <div className="flex items-start justify-between gap-3 mb-3">
                      <div className="flex items-center gap-2.5">
                        <div
                          className="w-9 h-9 rounded-xl flex items-center justify-center text-white shadow-2xs shrink-0"
                          style={{ backgroundColor: goal.color }}
                        >
                          <Target className="w-5 h-5" />
                        </div>
                        <div>
                          <h4 className="text-sm font-bold text-slate-900">{goal.title}</h4>
                          {goal.category && (
                            <span className="text-[10px] text-slate-500 font-medium">{goal.category}</span>
                          )}
                        </div>
                      </div>

                      {isCompleted ? (
                        <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full bg-emerald-100 text-emerald-800 text-[10px] font-bold">
                          <CheckCircle2 className="w-3 h-3" />
                          Concluído!
                        </span>
                      ) : (
                        <span className="text-xs font-black text-slate-800">{percentage}%</span>
                      )}
                    </div>

                    {/* Progress Bar */}
                    <div className="w-full bg-slate-100 rounded-full h-2.5 overflow-hidden my-3">
                      <div
                        className="h-full transition-all duration-500 rounded-full"
                        style={{
                          width: `${percentage}%`,
                          backgroundColor: goal.color,
                        }}
                      />
                    </div>

                    {/* Amounts */}
                    <div className="flex items-center justify-between text-xs mt-2">
                      <div>
                        <span className="text-[10px] text-slate-400 block">Acumulado</span>
                        <span className="font-bold text-slate-900">
                          {formatCurrency(goal.currentAmount)}
                        </span>
                      </div>
                      <div className="text-right">
                        <span className="text-[10px] text-slate-400 block">Meta Alvo</span>
                        <span className="font-bold text-slate-600">
                          {formatCurrency(goal.targetAmount)}
                        </span>
                      </div>
                    </div>

                    {goal.deadline && (
                      <div className="mt-3 text-[11px] text-slate-500 flex items-center gap-1">
                        <Calendar className="w-3 h-3 text-slate-400" />
                        Prazo: {formatDateBR(goal.deadline)}
                      </div>
                    )}

                    {goal.notes && (
                      <p className="text-[11px] text-slate-500 italic mt-2 line-clamp-2">
                        "{goal.notes}"
                      </p>
                    )}
                  </div>

                  {/* Quick Deposit/Withdraw Actions & Edit */}
                  <div className="mt-4 pt-3 border-t border-slate-100 flex items-center justify-between gap-2">
                    <div className="flex items-center gap-1.5">
                      <button
                        onClick={() => {
                          const val = prompt('Informe o valor a depositar/aportar nesta meta (R$):');
                          if (val) {
                            const parsed = parseFloat(val.replace(',', '.'));
                            if (!isNaN(parsed) && parsed > 0) {
                              onUpdateGoalAmount(goal.id, goal.currentAmount + parsed);
                            }
                          }
                        }}
                        className="px-2.5 py-1 text-xs font-bold text-emerald-700 bg-emerald-50 hover:bg-emerald-100 rounded-lg transition-colors"
                      >
                        + Aportar
                      </button>
                      <button
                        onClick={() => {
                          const val = prompt('Informe o valor a resgatar desta meta (R$):');
                          if (val) {
                            const parsed = parseFloat(val.replace(',', '.'));
                            if (!isNaN(parsed) && parsed > 0) {
                              onUpdateGoalAmount(goal.id, Math.max(0, goal.currentAmount - parsed));
                            }
                          }
                        }}
                        className="px-2.5 py-1 text-xs font-semibold text-slate-600 hover:bg-slate-100 rounded-lg transition-colors"
                      >
                        Resgatar
                      </button>
                    </div>

                    <div className="flex items-center gap-1">
                      <button
                        onClick={() => onOpenGoalModal(goal)}
                        className="p-1.5 text-slate-400 hover:text-slate-700 rounded-lg transition-colors"
                        title="Editar"
                      >
                        <Edit2 className="w-3.5 h-3.5" />
                      </button>
                      <button
                        onClick={() => {
                          if (window.confirm(`Excluir a meta "${goal.title}"?`)) {
                            onDeleteGoal(goal.id);
                          }
                        }}
                        className="p-1.5 text-slate-400 hover:text-rose-600 rounded-lg transition-colors"
                        title="Excluir"
                      >
                        <Trash2 className="w-3.5 h-3.5" />
                      </button>
                    </div>
                  </div>
                </div>
              );
            })}

            {filteredGoals.length === 0 && (
              <div className="col-span-full text-center py-12 bg-white rounded-2xl border border-slate-200 p-8">
                <Target className="w-10 h-10 text-slate-300 mx-auto mb-2" />
                <h4 className="text-sm font-bold text-slate-800">Nenhuma meta financeira cadastrada</h4>
                <p className="text-xs text-slate-500 mt-1 max-w-sm mx-auto">
                  Defina metas e objetivos financeiros com prazos para acompanhar seu crescimento patrimonial.
                </p>
                <button
                  onClick={() => onOpenGoalModal()}
                  className="mt-4 px-4 py-2 bg-indigo-600 text-white rounded-xl text-xs font-bold hover:bg-indigo-700 transition-colors"
                >
                  Cadastrar Primeira Meta
                </button>
              </div>
            )}
          </div>
        </div>
      )}

      {/* TAB 5: CONTAS BANCÁRIAS & CAIXAS */}
      {activeTab === 'accounts' && (
        <div className="space-y-4">
          <div className="flex items-center justify-between">
            <div>
              <h3 className="text-sm font-bold text-slate-900">Contas Bancárias & Caixas da Tesouraria</h3>
              <p className="text-xs text-slate-500">
                Configure os locais onde seu dinheiro está guardado (contas corrente, caixas físicos, poupança, investimentos)
              </p>
            </div>
            <button
              onClick={() => onOpenAccountModal()}
              className="inline-flex items-center gap-1 px-3 py-1.5 text-xs font-bold text-indigo-600 hover:text-indigo-700 bg-indigo-50 hover:bg-indigo-100 rounded-lg transition-colors"
            >
              <Plus className="w-3.5 h-3.5" />
              Nova Conta / Caixa
            </button>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
            {accounts.map((acc) => {
              const typeLabels = {
                checking: 'Conta Corrente',
                cash: 'Caixa Físico / Espécie',
                savings: 'Poupança / Reserva',
                investment: 'Investimentos',
              }[acc.type] || 'Conta';

              return (
                <div
                  key={acc.id}
                  className="rounded-2xl border border-slate-200 bg-white p-4 shadow-2xs flex flex-col justify-between hover:shadow-xs transition-shadow"
                >
                  <div>
                    <div className="flex items-center justify-between gap-2 mb-3">
                      <div
                        className="w-9 h-9 rounded-xl flex items-center justify-center text-white shadow-2xs"
                        style={{ backgroundColor: acc.color }}
                      >
                        <Wallet className="w-4 h-4" />
                      </div>
                      <span className="text-[10px] uppercase font-bold px-2 py-0.5 rounded-full bg-slate-100 text-slate-600">
                        {typeLabels}
                      </span>
                    </div>

                    <h4 className="text-sm font-bold text-slate-900">{acc.name}</h4>
                    {acc.bankName && (
                      <p className="text-xs text-slate-500 mt-0.5">{acc.bankName}</p>
                    )}
                    {acc.accountNumber && (
                      <p className="text-[10px] text-slate-400 font-mono mt-0.5">
                        {acc.accountNumber}
                      </p>
                    )}

                    <div className="mt-3 pt-3 border-t border-slate-100">
                      <span className="text-[10px] text-slate-400 block">Saldo Inicial</span>
                      <span className="text-base font-bold text-slate-800">
                        {formatCurrency(acc.initialBalance)}
                      </span>
                    </div>
                  </div>

                  <div className="mt-4 pt-3 border-t border-slate-100 flex items-center justify-end gap-1">
                    <button
                      onClick={() => onOpenAccountModal(acc)}
                      className="p-1.5 text-slate-400 hover:text-indigo-600 rounded-lg transition-colors"
                      title="Editar"
                    >
                      <Edit2 className="w-3.5 h-3.5" />
                    </button>
                    <button
                      onClick={() => onDeleteAccount(acc.id)}
                      className="p-1.5 text-slate-400 hover:text-rose-600 rounded-lg transition-colors"
                      title="Excluir"
                    >
                      <Trash2 className="w-3.5 h-3.5" />
                    </button>
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      )}
      {/* TAB 6: PESSOAS COM ACESSO & USUÁRIOS */}
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
                            className="p-1.5 text-slate-400 hover:text-rose-600 hover:bg-rose-50 rounded-lg transition"
                            title="Revogar acesso"
                          >
                            <Trash2 className="w-4 h-4" />
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
