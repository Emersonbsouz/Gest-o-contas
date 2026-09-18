import React, { useState, useEffect } from 'react';
import {
  X,
  Shield,
  ShieldCheck,
  CheckCircle2,
  AlertCircle,
  Building2,
  Mail,
  User,
  Crown,
  Lock,
  DollarSign,
  Edit3,
  Trash2,
  FolderPlus,
  BarChart3,
  Users,
} from 'lucide-react';
import { Company, CompanyRole, MemberPermissions, DEFAULT_ROLE_PERMISSIONS, CompanyMemberInfo } from '../types';

interface EditMemberPermissionsModalProps {
  isOpen: boolean;
  onClose: () => void;
  company: Company | null;
  member: CompanyMemberInfo | null;
  currentUserEmail?: string | null;
  onSave: (
    companyId: string,
    email: string,
    updates: {
      name?: string;
      role: CompanyRole;
      permissions: MemberPermissions;
    }
  ) => Promise<void>;
}

export const EditMemberPermissionsModal: React.FC<EditMemberPermissionsModalProps> = ({
  isOpen,
  onClose,
  company,
  member,
  currentUserEmail,
  onSave,
}) => {
  const [name, setName] = useState('');
  const [role, setRole] = useState<CompanyRole>('partner');
  const [permissions, setPermissions] = useState<MemberPermissions>(DEFAULT_ROLE_PERMISSIONS.partner);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');

  useEffect(() => {
    if (member) {
      setName(member.name || '');
      const memberRole = member.role || 'partner';
      setRole(memberRole);
      setPermissions(
        member.permissions || DEFAULT_ROLE_PERMISSIONS[memberRole] || DEFAULT_ROLE_PERMISSIONS.partner
      );
      setError('');
      setSuccess('');
    }
  }, [member, isOpen]);

  if (!isOpen || !company || !member) return null;

  const isOwner = (member.email || '').toLowerCase() === (company.ownerEmail || '').toLowerCase();

  const handleRoleChange = (newRole: CompanyRole) => {
    setRole(newRole);
    if (newRole !== 'custom') {
      setPermissions({ ...DEFAULT_ROLE_PERMISSIONS[newRole] });
    }
  };

  const handleTogglePermission = (key: keyof MemberPermissions) => {
    if (isOwner) return; // Owner permissions cannot be modified
    setPermissions((prev) => {
      const next = { ...prev, [key]: !prev[key] };
      setRole('custom'); // Any manual toggle switches role to custom
      return next;
    });
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (isOwner) {
      onClose();
      return;
    }

    try {
      setLoading(true);
      setError('');
      setSuccess('');
      await onSave(company.id, member.email, {
        name: name.trim(),
        role,
        permissions,
      });
      setSuccess('Permissões salvas com sucesso!');
      setTimeout(() => {
        onClose();
      }, 1000);
    } catch (err: any) {
      console.error('Erro ao salvar permissões:', err);
      setError('Não foi possível salvar as permissões. Tente novamente.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-xs">
      <div className="bg-white w-full max-w-lg rounded-2xl shadow-xl border border-slate-100 overflow-hidden animate-in fade-in zoom-in-95 duration-150 max-h-[90vh] flex flex-col">
        {/* Header */}
        <div className="flex items-center justify-between px-6 py-4 border-b border-slate-100 bg-slate-50/70 shrink-0">
          <div className="flex items-center gap-2.5">
            <div className="w-9 h-9 rounded-xl bg-indigo-50 border border-indigo-100 flex items-center justify-center text-indigo-600 font-bold shadow-xs">
              <Shield className="w-5 h-5" />
            </div>
            <div>
              <h2 className="text-base font-bold text-slate-900 flex items-center gap-2">
                Gerenciar Permissões
                <span className="text-[10px] uppercase font-semibold px-2 py-0.5 rounded-full bg-slate-200 text-slate-700">
                  {company.name}
                </span>
              </h2>
              <p className="text-xs text-slate-500">
                Defina o que esta pessoa pode fazer nesta empresa
              </p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="text-slate-400 hover:text-slate-600 p-1.5 rounded-lg hover:bg-slate-100 transition"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        <form onSubmit={handleSubmit} className="p-6 space-y-5 overflow-y-auto flex-1">
          {/* Member Card */}
          <div className="p-3.5 bg-slate-50 border border-slate-200/80 rounded-xl flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-indigo-600 text-white flex items-center justify-center font-bold text-sm uppercase shrink-0">
              {member.email.slice(0, 2)}
            </div>
            <div className="min-w-0 flex-1">
              <div className="font-semibold text-xs text-slate-900 flex items-center gap-2">
                <span className="truncate">{member.name || member.email}</span>
                {isOwner && (
                  <span className="text-[10px] bg-amber-50 text-amber-700 font-bold border border-amber-200 px-1.5 py-0.5 rounded-full flex items-center gap-1">
                    <Crown className="w-3 h-3 text-amber-500" /> Proprietário
                  </span>
                )}
              </div>
              <div className="text-[11px] text-slate-500 truncate mt-0.5 flex items-center gap-1">
                <Mail className="w-3 h-3" /> {member.email}
              </div>
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

          {isOwner ? (
            <div className="p-4 bg-amber-50 border border-amber-200 rounded-xl text-xs text-amber-800 flex items-start gap-2.5">
              <Lock className="w-4 h-4 text-amber-600 shrink-0 mt-0.5" />
              <div>
                <p className="font-bold text-amber-950">Acesso Total Irrestrito</p>
                <p className="text-[11px] text-amber-800 mt-0.5 leading-relaxed">
                  Como proprietário(a) e criador(a) desta empresa, este usuário possui permissão total de gerenciamento de dados, cadastros, relatórios e membros.
                </p>
              </div>
            </div>
          ) : (
            <>
              {/* Name field */}
              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">
                  Nome / Identificação no Sistema
                </label>
                <div className="relative">
                  <User className="w-3.5 h-3.5 text-slate-400 absolute left-3 top-2.5" />
                  <input
                    type="text"
                    value={name}
                    onChange={(e) => setName(e.target.value)}
                    placeholder="Ex: Ana Paula (Sócia Comercial)"
                    className="w-full pl-8 pr-3 py-1.5 border border-slate-300 rounded-lg text-xs text-slate-900 focus:outline-none focus:ring-2 focus:ring-indigo-500 bg-white"
                  />
                </div>
              </div>

              {/* Role preset selection */}
              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1.5">
                  Perfil de Acesso Pré-definido
                </label>
                <div className="grid grid-cols-2 sm:grid-cols-3 gap-2">
                  {[
                    { id: 'partner', label: 'Sócio / Gestor', desc: 'Acesso total a lançamentos e cadastros' },
                    { id: 'admin', label: 'Administrador', desc: 'Total + Convidar membros' },
                    { id: 'operator', label: 'Operador / Lançador', desc: 'Lança e cadastra (sem exclusão)' },
                    { id: 'viewer', label: 'Visualizador', desc: 'Apenas consulta e relatórios' },
                    { id: 'custom', label: 'Personalizado', desc: 'Permissões sob medida' },
                  ].map((p) => {
                    const active = role === p.id;
                    return (
                      <button
                        key={p.id}
                        type="button"
                        onClick={() => handleRoleChange(p.id as CompanyRole)}
                        className={`text-left p-2.5 rounded-xl border transition flex flex-col justify-between ${
                          active
                            ? 'bg-indigo-50/80 border-indigo-500 ring-2 ring-indigo-500/20 text-indigo-950'
                            : 'bg-white border-slate-200 hover:border-slate-300 text-slate-700'
                        }`}
                      >
                        <span className="text-xs font-bold block">{p.label}</span>
                        <span className="text-[10px] text-slate-500 mt-1 line-clamp-2">{p.desc}</span>
                      </button>
                    );
                  })}
                </div>
              </div>

              {/* Granular Permissions switches */}
              <div className="space-y-2 pt-1">
                <div className="flex items-center justify-between">
                  <label className="text-xs font-bold text-slate-800 uppercase tracking-wider">
                    Permissões Detalhadas
                  </label>
                  <span className="text-[10px] text-indigo-600 font-medium">
                    {role === 'custom' ? 'Configuração Manual' : 'Baseado no Perfil'}
                  </span>
                </div>

                <div className="border border-slate-200 rounded-xl divide-y divide-slate-100 overflow-hidden bg-white">
                  {/* 1. canCreateTransactions */}
                  <label className="flex items-start gap-3 p-3 hover:bg-slate-50 cursor-pointer transition">
                    <input
                      type="checkbox"
                      checked={permissions.canCreateTransactions}
                      onChange={() => handleTogglePermission('canCreateTransactions')}
                      className="mt-0.5 w-4 h-4 rounded text-indigo-600 focus:ring-indigo-500 border-slate-300"
                    />
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-1.5 text-xs font-bold text-slate-900">
                        <DollarSign className="w-3.5 h-3.5 text-emerald-600" />
                        Lançar Despesas, Receitas e Transferências
                      </div>
                      <p className="text-[11px] text-slate-500 mt-0.5">
                        Permite registrar novos pagamentos, recebimentos e transferências entre contas.
                      </p>
                    </div>
                  </label>

                  {/* 2. canEditTransactions */}
                  <label className="flex items-start gap-3 p-3 hover:bg-slate-50 cursor-pointer transition">
                    <input
                      type="checkbox"
                      checked={permissions.canEditTransactions}
                      onChange={() => handleTogglePermission('canEditTransactions')}
                      className="mt-0.5 w-4 h-4 rounded text-indigo-600 focus:ring-indigo-500 border-slate-300"
                    />
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-1.5 text-xs font-bold text-slate-900">
                        <Edit3 className="w-3.5 h-3.5 text-amber-600" />
                        Editar Lançamentos Existentes
                      </div>
                      <p className="text-[11px] text-slate-500 mt-0.5">
                        Permite alterar datas, valores, categorias e descrições de despesas já lançadas.
                      </p>
                    </div>
                  </label>

                  {/* 3. canDeleteTransactions */}
                  <label className="flex items-start gap-3 p-3 hover:bg-slate-50 cursor-pointer transition">
                    <input
                      type="checkbox"
                      checked={permissions.canDeleteTransactions}
                      onChange={() => handleTogglePermission('canDeleteTransactions')}
                      className="mt-0.5 w-4 h-4 rounded text-rose-600 focus:ring-rose-500 border-slate-300"
                    />
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-1.5 text-xs font-bold text-slate-900">
                        <Trash2 className="w-3.5 h-3.5 text-rose-600" />
                        Excluir Lançamentos
                      </div>
                      <p className="text-[11px] text-slate-500 mt-0.5">
                        Permite remover do sistema despesas, receitas ou transferências cadastradas.
                      </p>
                    </div>
                  </label>

                  {/* 4. canManageRegistries */}
                  <label className="flex items-start gap-3 p-3 hover:bg-slate-50 cursor-pointer transition">
                    <input
                      type="checkbox"
                      checked={permissions.canManageRegistries}
                      onChange={() => handleTogglePermission('canManageRegistries')}
                      className="mt-0.5 w-4 h-4 rounded text-indigo-600 focus:ring-indigo-500 border-slate-300"
                    />
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-1.5 text-xs font-bold text-slate-900">
                        <FolderPlus className="w-3.5 h-3.5 text-blue-600" />
                        Gerenciar Contas Bancárias, Cartões e Favorecidos
                      </div>
                      <p className="text-[11px] text-slate-500 mt-0.5">
                        Permite criar e alterar contas bancárias, cartões de crédito, fornecedores, metas e categorias.
                      </p>
                    </div>
                  </label>

                  {/* 5. canViewReports */}
                  <label className="flex items-start gap-3 p-3 hover:bg-slate-50 cursor-pointer transition">
                    <input
                      type="checkbox"
                      checked={permissions.canViewReports}
                      onChange={() => handleTogglePermission('canViewReports')}
                      className="mt-0.5 w-4 h-4 rounded text-indigo-600 focus:ring-indigo-500 border-slate-300"
                    />
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-1.5 text-xs font-bold text-slate-900">
                        <BarChart3 className="w-3.5 h-3.5 text-purple-600" />
                        Visualizar Relatórios e DRE
                      </div>
                      <p className="text-[11px] text-slate-500 mt-0.5">
                        Permite acesso aos gráficos comparativos, metas financeiras e relatórios consolidados da empresa.
                      </p>
                    </div>
                  </label>

                  {/* 6. canManageMembers */}
                  <label className="flex items-start gap-3 p-3 hover:bg-slate-50 cursor-pointer transition">
                    <input
                      type="checkbox"
                      checked={permissions.canManageMembers}
                      onChange={() => handleTogglePermission('canManageMembers')}
                      className="mt-0.5 w-4 h-4 rounded text-indigo-600 focus:ring-indigo-500 border-slate-300"
                    />
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-1.5 text-xs font-bold text-slate-900">
                        <Users className="w-3.5 h-3.5 text-indigo-600" />
                        Convidar e Gerenciar Outros Membros
                      </div>
                      <p className="text-[11px] text-slate-500 mt-0.5">
                        Permite cadastrar novas pessoas para ter acesso ou alterar permissões de outros usuários desta empresa.
                      </p>
                    </div>
                  </label>
                </div>
              </div>
            </>
          )}

          {/* Isolation reassurance */}
          <div className="p-3 bg-emerald-50/80 border border-emerald-200/80 rounded-xl text-xs text-emerald-950 flex items-start gap-2">
            <ShieldCheck className="w-4 h-4 text-emerald-600 shrink-0 mt-0.5" />
            <span className="text-[11px] text-emerald-900 leading-relaxed">
              Estas permissões são <strong>exclusivas para {company.name}</strong>. Este usuário não terá visibilidade nem acesso a nenhuma outra empresa ou finança pessoal.
            </span>
          </div>
        </form>

        {/* Footer */}
        <div className="px-6 py-3 border-t border-slate-100 bg-slate-50 flex items-center justify-end gap-2 shrink-0">
          <button
            type="button"
            onClick={onClose}
            className="px-4 py-2 text-xs font-semibold text-slate-600 hover:text-slate-800 rounded-xl transition"
          >
            Cancelar
          </button>
          {!isOwner && (
            <button
              type="button"
              onClick={handleSubmit}
              disabled={loading}
              className="flex items-center gap-1.5 px-4 py-2 bg-indigo-600 hover:bg-indigo-700 text-white text-xs font-bold rounded-xl transition shadow-xs disabled:opacity-50"
            >
              <ShieldCheck className="w-4 h-4" />
              {loading ? 'Salvando...' : 'Salvar Permissões'}
            </button>
          )}
        </div>
      </div>
    </div>
  );
};
