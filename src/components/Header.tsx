import React from 'react';
import {
  Wallet,
  ChevronLeft,
  ChevronRight,
  Plus,
  Tag,
  Download,
  Calendar,
  Landmark,
  PieChart,
  ArrowDownLeft,
  ArrowRightLeft,
  Layers,
  Sparkles,
  LogOut,
  User as UserIcon,
  ShieldCheck,
  RotateCcw,
  UserPlus,
} from 'lucide-react';
import {
  formatMonthYearLabel,
  getCurrentYearMonth,
  getRelativeMonth,
  formatCurrency,
} from '../utils/formatters';
import { Company } from '../types';
import { CompanySwitcher } from './CompanySwitcher';

interface HeaderProps {
  currentYearMonth: string;
  activeTab: 'expenses' | 'treasury' | 'registries';
  onTabChange: (tab: 'expenses' | 'treasury' | 'registries') => void;
  totalTreasuryBalance: number;
  onChangeMonth: (newYearMonth: string) => void;
  onOpenAddModal: () => void;
  onOpenCategoryModal: () => void;
  onOpenIncomeModal: () => void;
  onOpenTransferModal: () => void;
  onOpenQuickRegisterModal?: () => void;
  onExportData: () => void;
  onResetData: () => void;
  onOpenBackupModal?: () => void;
  cloudSyncStatus?: 'synced' | 'syncing' | 'error';
  // Multi-Company and Auth props
  companies: Company[];
  activeCompany: Company | null;
  onSelectCompany: (company: Company) => void;
  onOpenCreateCompany: () => void;
  onOpenManageMembers: () => void;
  currentUserEmail?: string | null;
  currentUserName?: string | null;
  onLogout?: () => void;
}

export const Header: React.FC<HeaderProps> = ({
  currentYearMonth,
  activeTab,
  onTabChange,
  totalTreasuryBalance,
  onChangeMonth,
  onOpenAddModal,
  onOpenCategoryModal,
  onOpenIncomeModal,
  onOpenTransferModal,
  onOpenQuickRegisterModal,
  onExportData,
  onResetData,
  onOpenBackupModal,
  cloudSyncStatus = 'synced',
  companies,
  activeCompany,
  onSelectCompany,
  onOpenCreateCompany,
  onOpenManageMembers,
  currentUserEmail,
  currentUserName,
  onLogout,
}) => {
  const currentActualMonth = getCurrentYearMonth();
  const isActualMonth = currentYearMonth === currentActualMonth;

  return (
    <header className="bg-white border-b border-slate-200 sticky top-0 z-30 shadow-2xs">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-2.5">
        {/* Top bar: Company Selector + User Status */}
        <div className="flex items-center justify-between pb-2 mb-2 border-b border-slate-100 gap-3 flex-wrap">
          <div className="flex items-center gap-3">
            <CompanySwitcher
              companies={companies}
              activeCompany={activeCompany}
              onSelectCompany={onSelectCompany}
              onOpenCreateCompany={onOpenCreateCompany}
              onOpenManageMembers={onOpenManageMembers}
              currentUserEmail={currentUserEmail}
            />

            {onOpenBackupModal && (
              <button
                type="button"
                onClick={onOpenBackupModal}
                className="flex items-center gap-1.5 text-[11px] text-emerald-800 bg-emerald-50 hover:bg-emerald-100/80 px-2.5 py-1 rounded-lg border border-emerald-200 font-semibold transition cursor-pointer"
                title="Clique para ver o status da nuvem ou fazer download do backup"
              >
                <span className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse" />
                <ShieldCheck className="w-3.5 h-3.5 text-emerald-600 shrink-0" />
                <span>Nuvem Ativa & Backup</span>
              </button>
            )}
          </div>

          {/* User profile, Reset data & Logout */}
          <div className="flex items-center gap-2 sm:gap-3 ml-auto">
            {onOpenBackupModal && (
              <button
                type="button"
                onClick={onOpenBackupModal}
                className="hidden md:inline-flex items-center gap-1.5 px-2.5 py-1 text-xs font-semibold text-emerald-700 hover:text-emerald-800 bg-emerald-50 hover:bg-emerald-100 border border-emerald-200 rounded-lg transition"
                title="Fazer Backup ou Restaurar Dados do Sistema"
              >
                <Download className="w-3.5 h-3.5 text-emerald-600" />
                <span>Backup (.JSON)</span>
              </button>
            )}

            <button
              type="button"
              onClick={onOpenManageMembers}
              className="inline-flex items-center gap-1.5 px-2.5 py-1 text-xs font-semibold text-indigo-700 hover:text-indigo-800 bg-indigo-50 hover:bg-indigo-100 border border-indigo-200 rounded-lg transition"
              title="Cadastrar pessoas para ter acesso a esta empresa"
            >
              <UserPlus className="w-3.5 h-3.5 text-indigo-600" />
              <span className="hidden sm:inline">Pessoas com Acesso</span>
              <span className="inline-flex items-center justify-center px-1.5 py-0.2 text-[10px] bg-indigo-200/60 text-indigo-900 rounded-full font-bold">
                {activeCompany?.memberEmails?.length || 1}
              </span>
            </button>

            <button
              type="button"
              onClick={onResetData}
              className="inline-flex items-center gap-1.5 px-2.5 py-1 text-xs font-semibold text-rose-600 hover:text-rose-700 bg-rose-50 hover:bg-rose-100 border border-rose-200 rounded-lg transition"
              title="Zerar dados deste ambiente e começar limpo do zero"
            >
              <RotateCcw className="w-3.5 h-3.5" />
              <span className="hidden sm:inline">Zerar Dados</span>
            </button>

            <button
              type="button"
              onClick={onExportData}
              className="inline-flex items-center gap-1.5 px-2.5 py-1 text-xs font-semibold text-slate-600 hover:text-slate-900 bg-slate-100 hover:bg-slate-200 rounded-lg transition"
              title="Exportar despesas em CSV"
            >
              <Download className="w-3.5 h-3.5" />
              <span className="hidden sm:inline">Exportar</span>
            </button>

            <div className="flex items-center gap-2 text-xs pl-1 border-l border-slate-200">
              <div className="w-7 h-7 rounded-full bg-slate-100 border border-slate-200 text-slate-700 flex items-center justify-center font-bold text-[11px] uppercase">
                {currentUserName ? currentUserName.slice(0, 2) : currentUserEmail?.slice(0, 2) || 'US'}
              </div>
              <div className="hidden md:block text-left leading-tight">
                <div className="font-semibold text-slate-800 truncate max-w-[140px]">
                  {currentUserName || currentUserEmail?.split('@')[0]}
                </div>
                <div className="text-[10px] text-slate-400 truncate max-w-[140px]">
                  {currentUserEmail}
                </div>
              </div>
            </div>

            {onLogout && (
              <button
                type="button"
                onClick={onLogout}
                className="p-1.5 text-slate-400 hover:text-rose-600 hover:bg-rose-50 rounded-lg transition"
                title="Sair da conta"
              >
                <LogOut className="w-4 h-4" />
              </button>
            )}
          </div>
        </div>

        <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-3">
          {/* Logo & Module Segmented Controls */}
          <div className="flex items-center justify-between gap-4 flex-wrap">
            <div className="flex items-center gap-3">
              <div className="w-9 h-9 rounded-xl bg-gradient-to-tr from-indigo-600 to-violet-600 text-white flex items-center justify-center shadow-xs">
                <Wallet className="w-4.5 h-4.5" />
              </div>
              <div>
                <h1 className="text-base font-bold text-slate-900 tracking-tight flex items-center gap-2">
                  Gestão Financeira
                  <span className="text-[10px] uppercase font-semibold px-2 py-0.5 rounded-full bg-indigo-50 text-indigo-700 border border-indigo-100">
                    {activeCompany?.name || 'Geral'}
                  </span>
                </h1>
                <p className="text-xs text-slate-500">
                  Despesas, tesouraria, cartões, fornecedores e metas
                </p>
              </div>
            </div>

            {/* Navigation Tabs between Despesas, Tesouraria, and Cadastros */}
            <div className="flex items-center bg-slate-100 p-1 rounded-xl border border-slate-200/80 overflow-x-auto">
              <button
                onClick={() => onTabChange('expenses')}
                id="tab-btn-expenses"
                className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-bold transition-all whitespace-nowrap ${
                  activeTab === 'expenses'
                    ? 'bg-white text-indigo-700 shadow-xs ring-1 ring-slate-200'
                    : 'text-slate-600 hover:text-slate-900 hover:bg-slate-200/50'
                }`}
              >
                <PieChart className="w-3.5 h-3.5" />
                Despesas & Gráficos
              </button>

              <button
                onClick={() => onTabChange('treasury')}
                id="tab-btn-treasury"
                className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-bold transition-all whitespace-nowrap ${
                  activeTab === 'treasury'
                    ? 'bg-white text-indigo-700 shadow-xs ring-1 ring-slate-200'
                    : 'text-slate-600 hover:text-slate-900 hover:bg-slate-200/50'
                }`}
              >
                <Landmark className="w-3.5 h-3.5 text-emerald-600" />
                Tesouraria & Caixa
                <span className="hidden sm:inline-block ml-1 text-[10px] font-semibold px-1.5 py-0.2 bg-emerald-50 text-emerald-700 rounded-md border border-emerald-200">
                  {formatCurrency(totalTreasuryBalance)}
                </span>
              </button>

              <button
                onClick={() => onTabChange('registries')}
                id="tab-btn-registries"
                className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-bold transition-all whitespace-nowrap ${
                  activeTab === 'registries'
                    ? 'bg-white text-indigo-700 shadow-xs ring-1 ring-slate-200'
                    : 'text-slate-600 hover:text-slate-900 hover:bg-slate-200/50'
                }`}
              >
                <Layers className="w-3.5 h-3.5 text-violet-600" />
                Cadastros Gerais
              </button>
            </div>
          </div>

          {/* Month Selector & Quick Actions */}
          <div className="flex items-center justify-between lg:justify-end gap-2 flex-wrap">
            {/* Month Selector in Header */}
            <div className="flex items-center gap-1 bg-slate-100/90 p-1 rounded-xl">
              <button
                id="btn-prev-month"
                onClick={() => onChangeMonth(getRelativeMonth(currentYearMonth, -1))}
                title="Mês Anterior"
                className="p-1.5 rounded-lg text-slate-600 hover:text-slate-900 hover:bg-white transition-all"
              >
                <ChevronLeft className="w-4 h-4" />
              </button>

              <div className="px-2.5 py-1 flex items-center gap-1.5 text-xs font-bold text-slate-800 select-none min-w-32 justify-center">
                <Calendar className="w-3.5 h-3.5 text-indigo-600 shrink-0" />
                <span>{formatMonthYearLabel(currentYearMonth)}</span>
              </div>

              <button
                id="btn-next-month"
                onClick={() => onChangeMonth(getRelativeMonth(currentYearMonth, 1))}
                title="Próximo Mês"
                className="p-1.5 rounded-lg text-slate-600 hover:text-slate-900 hover:bg-white transition-all"
              >
                <ChevronRight className="w-4 h-4" />
              </button>

              {!isActualMonth && (
                <button
                  onClick={() => onChangeMonth(currentActualMonth)}
                  className="ml-1 text-[10px] font-semibold text-indigo-600 hover:text-indigo-800 bg-white px-2 py-0.5 rounded-lg border border-slate-200 transition-all shadow-2xs"
                >
                  Hoje
                </button>
              )}
            </div>

            {/* Quick Register Master Button */}
            {onOpenQuickRegisterModal && (
              <button
                onClick={onOpenQuickRegisterModal}
                id="btn-quick-register-all"
                className="inline-flex items-center gap-1.5 px-3 py-2 bg-gradient-to-r from-indigo-600 to-violet-600 hover:from-indigo-700 hover:to-violet-700 text-white text-xs font-bold rounded-xl shadow-xs transition-all"
              >
                <Plus className="w-4 h-4" />
                <span>+ Cadastrar</span>
              </button>
            )}

            {/* Actions based on active tab */}
            <div className="flex items-center gap-2">
              {activeTab === 'expenses' && (
                <>
                  <button
                    id="btn-open-categories"
                    onClick={onOpenCategoryModal}
                    className="inline-flex items-center gap-1.5 px-3 py-2 text-xs font-semibold text-slate-700 hover:text-slate-900 bg-white hover:bg-slate-50 border border-slate-200 rounded-lg transition-colors shadow-2xs"
                  >
                    <Tag className="w-3.5 h-3.5 text-slate-500" />
                    <span className="hidden sm:inline">Categorias</span>
                  </button>

                  <button
                    id="btn-header-add-expense"
                    onClick={onOpenAddModal}
                    className="inline-flex items-center gap-1.5 px-3.5 py-2 bg-indigo-600 hover:bg-indigo-700 text-white text-xs font-bold rounded-lg shadow-xs transition-colors"
                  >
                    <Plus className="w-4 h-4" />
                    Nova Despesa
                  </button>
                </>
              )}

              {activeTab === 'treasury' && (
                <>
                  <button
                    id="btn-header-add-income"
                    onClick={onOpenIncomeModal}
                    className="inline-flex items-center gap-1.5 px-3 py-2 bg-emerald-600 hover:bg-emerald-700 text-white text-xs font-bold rounded-lg shadow-xs transition-colors"
                  >
                    <ArrowDownLeft className="w-3.5 h-3.5" />
                    + Receita
                  </button>

                  <button
                    id="btn-header-add-transfer"
                    onClick={onOpenTransferModal}
                    className="inline-flex items-center gap-1.5 px-3 py-2 bg-sky-600 hover:bg-sky-700 text-white text-xs font-bold rounded-lg shadow-xs transition-colors"
                  >
                    <ArrowRightLeft className="w-3.5 h-3.5" />
                    Transferir
                  </button>
                </>
              )}
            </div>
          </div>
        </div>
      </div>
    </header>
  );
};


