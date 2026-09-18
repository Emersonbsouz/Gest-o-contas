import React, { useState } from 'react';
import {
  X,
  Users,
  UserPlus,
  Trash2,
  ShieldCheck,
  Shield,
  Building2,
  Mail,
  Crown,
  AlertCircle,
  CheckCircle2,
  Copy,
  Check,
  Sparkles,
  SlidersHorizontal,
  ChevronDown,
  ChevronUp,
  DollarSign,
  Edit3,
  BarChart3,
  FolderPlus,
} from 'lucide-react';
import {
  Company,
  CompanyRole,
  MemberPermissions,
  DEFAULT_ROLE_PERMISSIONS,
  CompanyMemberInfo,
} from '../types';
import { EditMemberPermissionsModal } from './EditMemberPermissionsModal';

interface ManageMembersModalProps {
  isOpen: boolean;
  onClose: () => void;
  company: Company | null;
  currentUserEmail?: string | null;
  onAddMember: (
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
  onRemoveMember: (companyId: string, email: string) => Promise<void>;
}

export const ManageMembersModal: React.FC<ManageMembersModalProps> = ({
  isOpen,
  onClose,
  company,
  currentUserEmail,
  onAddMember,
  onUpdateMember,
  onRemoveMember,
}) => {
  const [newEmail, setNewEmail] = useState('');
  const [newName, setNewName] = useState('');
  const [newRole, setNewRole] = useState<CompanyRole>('partner');
  const [newPermissions, setNewPermissions] = useState<MemberPermissions>(DEFAULT_ROLE_PERMISSIONS.partner);
  const [showAdvancedPerms, setShowAdvancedPerms] = useState(false);

  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');
  const [copiedLink, setCopiedLink] = useState(false);

  // Selected member for editing permissions modal
  const [editingMember, setEditingMember] = useState<CompanyMemberInfo | null>(null);

  if (!isOpen || !company) return null;

  const cleanUserEmail = (currentUserEmail || '').toLowerCase().trim();
  const isOwner = (company.ownerEmail || '').toLowerCase().trim() === cleanUserEmail;
  const currentMemberInfo = (company.membersInfo || []).find(
    (m) => m.email.toLowerCase().trim() === cleanUserEmail
  );
  const canManage = isOwner || currentMemberInfo?.role === 'admin' || currentMemberInfo?.permissions?.canManageMembers;

  const handleRolePresetSelect = (roleKey: CompanyRole) => {
    setNewRole(roleKey);
    if (roleKey !== 'custom') {
      setNewPermissions({ ...DEFAULT_ROLE_PERMISSIONS[roleKey] });
    }
  };

  const handleToggleNewPermission = (key: keyof MemberPermissions) => {
    setNewPermissions((prev) => {
      const next = { ...prev, [key]: !prev[key] };
      setNewRole('custom');
      return next;
    });
  };

  const handleAdd = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    setSuccess('');
    const emailToAdd = newEmail.trim().toLowerCase();

    if (!emailToAdd || !emailToAdd.includes('@')) {
      setError('Por favor, informe um e-mail válido.');
      return;
    }

    if ((company.memberEmails || []).map((m) => (m || '').toLowerCase()).includes(emailToAdd)) {
      setError('Este e-mail já tem acesso a esta empresa.');
      return;
    }

    try {
      setLoading(true);
      await onAddMember(company.id, emailToAdd, newName.trim(), newRole, newPermissions);
      setSuccess(`Acesso e permissões concedidos com sucesso para ${emailToAdd}!`);
      setNewEmail('');
      setNewName('');
      setNewRole('partner');
      setNewPermissions(DEFAULT_ROLE_PERMISSIONS.partner);
      setShowAdvancedPerms(false);
    } catch (err: any) {
      console.error('Erro ao adicionar membro:', err);
      setError('Não foi possível adicionar o membro. Tente novamente.');
    } finally {
      setLoading(false);
    }
  };

  const handleCopyInvite = () => {
    const inviteText = `Olá! Você recebeu acesso ao sistema financeiro da empresa "${company.name}". Acesse pelo link: ${window.location.origin} e entre com o e-mail: ${newEmail || 'seu e-mail cadastrado'}. Seus acessos são restritos a esta empresa.`;
    navigator.clipboard.writeText(inviteText);
    setCopiedLink(true);
    setTimeout(() => setCopiedLink(false), 2500);
  };

  const handleRemove = async (emailToRemove: string) => {
    if (emailToRemove.toLowerCase() === (company.ownerEmail || '').toLowerCase()) {
      setError('O proprietário da empresa não pode ser removido.');
      return;
    }

    if (!window.confirm(`Deseja revogar o acesso de ${emailToRemove} a esta empresa? O usuário deixará de ter acesso a este sistema.`)) {
      return;
    }

    try {
      setLoading(true);
      setError('');
      setSuccess('');
      await onRemoveMember(company.id, emailToRemove);
      setSuccess(`Acesso de ${emailToRemove} removido com sucesso.`);
    } catch (err: any) {
      console.error('Erro ao remover membro:', err);
      setError('Não foi possível remover o membro.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <>
      <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-xs">
        <div className="bg-white w-full max-w-2xl rounded-2xl shadow-2xl border border-slate-100 overflow-hidden animate-in fade-in zoom-in-95 duration-150 max-h-[92vh] flex flex-col">
          {/* Header */}
          <div className="flex items-center justify-between px-6 py-4 border-b border-slate-100 bg-slate-50/70 shrink-0">
            <div className="flex items-center gap-3">
              <div
                className="w-10 h-10 rounded-xl flex items-center justify-center text-white font-bold shadow-xs shrink-0"
                style={{ backgroundColor: company.color || '#4f46e5' }}
              >
                <Users className="w-5 h-5" />
              </div>
              <div>
                <h2 className="text-base font-bold text-slate-900 flex items-center gap-2">
                  Cadastrar Pessoas & Gerenciar Permissões
                </h2>
                <div className="flex items-center gap-1.5 text-xs text-slate-500 mt-0.5">
                  <span>Empresa:</span>
                  <span className="font-semibold text-slate-800 bg-slate-100 px-2 py-0.5 rounded-md">
                    {company.name}
                  </span>
                  <span className="text-slate-300">•</span>
                  <span className="text-emerald-700 font-medium">Sistema Independente</span>
                </div>
              </div>
            </div>
            <button
              onClick={onClose}
              className="text-slate-400 hover:text-slate-600 p-1.5 rounded-lg hover:bg-slate-100 transition"
            >
              <X className="w-5 h-5" />
            </button>
          </div>

          <div className="p-6 space-y-5 overflow-y-auto flex-1">
            {/* Multi-tenant isolation reassurance banner */}
            <div className="p-3.5 bg-emerald-50 border border-emerald-200/80 rounded-xl text-xs text-emerald-950 flex items-start gap-3">
              <ShieldCheck className="w-5 h-5 text-emerald-600 shrink-0 mt-0.5" />
              <div>
                <p className="font-bold text-emerald-950">Isolamento Completo entre Empresas</p>
                <p className="text-emerald-800 text-[11px] mt-0.5 leading-relaxed">
                  Cada empresa possui um sistema financeiro 100% independente. As pessoas cadastradas aqui terão acesso <strong>exclusivamente aos dados de {company.name}</strong> e <strong>NÃO terão acesso</strong> a nenhuma outra empresa nem às suas finanças pessoais.
                </p>
              </div>
            </div>

            {error && (
              <div className="p-3 bg-rose-50 border border-rose-200 text-rose-700 text-xs rounded-xl flex items-center gap-2">
                <AlertCircle className="w-4 h-4 shrink-0" />
                <span>{error}</span>
              </div>
            )}

            {success && (
              <div className="p-3 bg-emerald-50 border border-emerald-200 text-emerald-700 text-xs rounded-xl flex items-center gap-2">
                <CheckCircle2 className="w-4 h-4 shrink-0 text-emerald-600" />
                <span>{success}</span>
              </div>
            )}

            {/* Registration Form with Granular Permissions */}
            {canManage ? (
              <form onSubmit={handleAdd} className="p-4 bg-slate-50 border border-slate-200 rounded-2xl space-y-4">
                <div className="flex items-center justify-between">
                  <h3 className="text-xs font-bold text-slate-800 uppercase tracking-wider flex items-center gap-1.5">
                    <UserPlus className="w-4 h-4 text-indigo-600" />
                    Cadastrar Pessoa para ter Acesso e Atribuir Permissões
                  </h3>
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
                        value={newEmail}
                        onChange={(e) => setNewEmail(e.target.value)}
                        placeholder="usuario@email.com"
                        className="w-full pl-8 pr-3 py-1.5 border border-slate-300 rounded-lg text-xs text-slate-900 placeholder:text-slate-400 focus:outline-none focus:ring-2 focus:ring-indigo-500 bg-white"
                      />
                    </div>
                  </div>

                  <div>
                    <label className="block text-[11px] font-semibold text-slate-700 mb-1">
                      Nome / Cargo (Opcional)
                    </label>
                    <input
                      type="text"
                      value={newName}
                      onChange={(e) => setNewName(e.target.value)}
                      placeholder="Ex: Carlos (Sócio) ou Ana (Financeiro)"
                      className="w-full px-3 py-1.5 border border-slate-300 rounded-lg text-xs text-slate-900 placeholder:text-slate-400 focus:outline-none focus:ring-2 focus:ring-indigo-500 bg-white"
                    />
                  </div>
                </div>

                {/* Role presets */}
                <div>
                  <label className="block text-[11px] font-semibold text-slate-700 mb-1.5">
                    Perfil de Acesso (Função):
                  </label>
                  <div className="grid grid-cols-2 sm:grid-cols-4 gap-2">
                    {[
                      { id: 'partner', label: 'Sócio / Gestor', desc: 'Acesso total a lançamentos' },
                      { id: 'admin', label: 'Administrador', desc: 'Total + Convidar membros' },
                      { id: 'operator', label: 'Operador / Lançador', desc: 'Lança (sem exclusão)' },
                      { id: 'viewer', label: 'Visualizador', desc: 'Apenas relatórios e consulta' },
                    ].map((item) => {
                      const active = newRole === item.id;
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
                <div className="border border-slate-200 rounded-xl overflow-hidden bg-white">
                  <button
                    type="button"
                    onClick={() => setShowAdvancedPerms((prev) => !prev)}
                    className="w-full px-3.5 py-2.5 flex items-center justify-between text-xs font-semibold text-slate-700 hover:bg-slate-50 transition"
                  >
                    <div className="flex items-center gap-2">
                      <SlidersHorizontal className="w-3.5 h-3.5 text-indigo-600" />
                      <span>Ver e Personalizar Permissões Detalhadas</span>
                      {newRole === 'custom' && (
                        <span className="text-[10px] bg-indigo-100 text-indigo-700 px-2 py-0.5 rounded-full font-bold">
                          Personalizado
                        </span>
                      )}
                    </div>
                    {showAdvancedPerms ? <ChevronUp className="w-4 h-4" /> : <ChevronDown className="w-4 h-4" />}
                  </button>

                  {showAdvancedPerms && (
                    <div className="p-3 border-t border-slate-100 divide-y divide-slate-100 space-y-2">
                      <label className="flex items-start gap-2.5 pt-1.5 cursor-pointer">
                        <input
                          type="checkbox"
                          checked={newPermissions.canCreateTransactions}
                          onChange={() => handleToggleNewPermission('canCreateTransactions')}
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
                          checked={newPermissions.canEditTransactions}
                          onChange={() => handleToggleNewPermission('canEditTransactions')}
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
                          checked={newPermissions.canDeleteTransactions}
                          onChange={() => handleToggleNewPermission('canDeleteTransactions')}
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
                          checked={newPermissions.canManageRegistries}
                          onChange={() => handleToggleNewPermission('canManageRegistries')}
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
                          checked={newPermissions.canViewReports}
                          onChange={() => handleToggleNewPermission('canViewReports')}
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
                          checked={newPermissions.canManageMembers}
                          onChange={() => handleToggleNewPermission('canManageMembers')}
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
                    disabled={loading}
                    className="flex items-center justify-center gap-1.5 px-5 py-2.5 bg-indigo-600 hover:bg-indigo-700 text-white text-xs font-bold rounded-xl transition shadow-xs disabled:opacity-50"
                  >
                    <UserPlus className="w-4 h-4" />
                    {loading ? 'Cadastrando...' : 'Cadastrar e Conceder Permissões'}
                  </button>
                </div>
              </form>
            ) : (
              <div className="p-4 bg-slate-100 rounded-xl text-xs text-slate-600">
                Você tem permissão de visualização dos membros desta empresa. O proprietário ({company.ownerEmail}) ou administradores gerenciam os acessos.
              </div>
            )}

            {/* Quick invite link & instructions */}
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
                  {copiedLink ? <Check className="w-3 h-3 text-emerald-600" /> : <Copy className="w-3 h-3" />}
                  {copiedLink ? 'Link Copiado!' : 'Copiar Convite'}
                </button>
              </div>
              <p className="text-indigo-800 text-[11px] leading-relaxed">
                Basta a pessoa acessar o sistema com o <strong>mesmo e-mail</strong> cadastrado. Ela entrará direto no ambiente independente de <strong>{company.name}</strong> com as permissões atribuídas.
              </p>
            </div>

            {/* Current members list with Edit Permissions button */}
            <div>
              <div className="flex items-center justify-between mb-2">
                <h3 className="text-xs font-bold text-slate-700 uppercase tracking-wider">
                  Pessoas com Acesso Cadastradas ({company.memberEmails.length})
                </h3>
              </div>

              <div className="border border-slate-200 rounded-2xl divide-y divide-slate-100 overflow-hidden bg-white shadow-2xs">
                {(company.memberEmails || []).map((email) => {
                  const cleanEmail = email.toLowerCase().trim();
                  const isThisOwner = cleanEmail === (company.ownerEmail || '').toLowerCase().trim();
                  const isCurrentUser = cleanEmail === cleanUserEmail;
                  const memberInfo = (company.membersInfo || []).find(
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
                      className="p-3.5 hover:bg-slate-50 transition flex flex-col sm:flex-row sm:items-center justify-between gap-3 text-xs"
                    >
                      <div className="flex items-start gap-3 min-w-0">
                        <div className="w-9 h-9 rounded-xl bg-indigo-50 border border-indigo-100 text-indigo-700 flex items-center justify-center font-bold text-xs uppercase shrink-0 mt-0.5">
                          {email.slice(0, 2)}
                        </div>
                        <div className="min-w-0">
                          <div className="font-bold text-xs text-slate-900 flex items-center gap-1.5 flex-wrap">
                            <span className="truncate">{memberInfo?.name || email}</span>
                            {isCurrentUser && (
                              <span className="text-[10px] bg-slate-100 text-slate-700 px-1.5 py-0.2 rounded font-semibold shrink-0">
                                Você
                              </span>
                            )}
                          </div>
                          <div className="text-[11px] text-slate-500 truncate mt-0.5 flex items-center gap-1">
                            <Mail className="w-3 h-3" /> {email}
                          </div>

                          {/* Role and Permissions Badges */}
                          <div className="mt-1.5 flex items-center gap-1.5 flex-wrap">
                            {isThisOwner ? (
                              <span className="inline-flex items-center gap-1 text-[10px] font-bold text-amber-800 bg-amber-50 px-2 py-0.5 rounded-full border border-amber-200">
                                <Crown className="w-3 h-3 text-amber-500" /> Proprietário (Acesso Total)
                              </span>
                            ) : (
                              <span className="inline-flex items-center gap-1 text-[10px] font-bold text-indigo-800 bg-indigo-50 px-2 py-0.5 rounded-full border border-indigo-200">
                                <Shield className="w-3 h-3 text-indigo-500" /> {roleLabel}
                              </span>
                            )}

                            {!isThisOwner && perms && (
                              <>
                                {perms.canCreateTransactions && (
                                  <span className="text-[10px] text-emerald-700 bg-emerald-50 px-1.5 py-0.2 rounded font-medium border border-emerald-100">
                                    Lança
                                  </span>
                                )}
                                {perms.canEditTransactions && (
                                  <span className="text-[10px] text-amber-700 bg-amber-50 px-1.5 py-0.2 rounded font-medium border border-amber-100">
                                    Edita
                                  </span>
                                )}
                                {!perms.canDeleteTransactions && (
                                  <span className="text-[10px] text-slate-600 bg-slate-100 px-1.5 py-0.2 rounded font-medium">
                                    Sem Exclusão
                                  </span>
                                )}
                                {perms.canViewReports && (
                                  <span className="text-[10px] text-purple-700 bg-purple-50 px-1.5 py-0.2 rounded font-medium border border-purple-100">
                                    Relatórios
                                  </span>
                                )}
                              </>
                            )}
                          </div>
                        </div>
                      </div>

                      {/* Actions: Edit permissions / Revoke */}
                      <div className="flex items-center gap-1.5 self-end sm:self-center shrink-0">
                        {canManage && !isThisOwner && onUpdateMember && (
                          <button
                            type="button"
                            onClick={() =>
                              setEditingMember({
                                email,
                                name: memberInfo?.name || '',
                                role: memberInfo?.role || 'partner',
                                permissions: perms,
                                addedAt: memberInfo?.addedAt || Date.now(),
                              })
                            }
                            className="inline-flex items-center gap-1 px-2.5 py-1 text-xs font-semibold text-slate-700 bg-white border border-slate-200 hover:bg-indigo-50 hover:text-indigo-700 hover:border-indigo-200 rounded-lg transition"
                          >
                            <SlidersHorizontal className="w-3.5 h-3.5" />
                            Editar Permissões
                          </button>
                        )}

                        {canManage && !isThisOwner && (
                          <button
                            type="button"
                            onClick={() => handleRemove(email)}
                            disabled={loading}
                            className="p-1.5 text-slate-400 hover:text-rose-600 hover:bg-rose-50 rounded-lg transition"
                            title="Revogar acesso desta pessoa a esta empresa"
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

          {/* Footer */}
          <div className="px-6 py-3 border-t border-slate-100 bg-slate-50 flex justify-end shrink-0">
            <button
              type="button"
              onClick={onClose}
              className="px-4 py-2 text-xs font-semibold bg-white border border-slate-200 hover:bg-slate-100 text-slate-800 rounded-xl transition shadow-2xs"
            >
              Fechar
            </button>
          </div>
        </div>
      </div>

      {/* Permissions Editor Modal */}
      {editingMember && onUpdateMember && (
        <EditMemberPermissionsModal
          isOpen={!!editingMember}
          onClose={() => setEditingMember(null)}
          company={company}
          member={editingMember}
          currentUserEmail={currentUserEmail}
          onSave={onUpdateMember}
        />
      )}
    </>
  );
};
