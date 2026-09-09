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
} from 'lucide-react';
import {
  formatMonthYearLabel,
  getCurrentYearMonth,
  getRelativeMonth,
  formatCurrency,
} from '../utils/formatters';

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
}) => {
  const currentActualMonth = getCurrentYearMonth();
  const isActualMonth = currentYearMonth === currentActualMonth;

  return (
    <header className="bg-white border-b border-slate-200 sticky top-0 z-30 shadow-2xs">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-3">
        <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-3">
          {/* Logo & Module Segmented Controls */}
          <div className="flex items-center justify-between gap-4 flex-wrap">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-xl bg-gradient-to-tr from-indigo-600 to-violet-600 text-white flex items-center justify-center shadow-xs">
                <Wallet className="w-5 h-5" />
              </div>
              <div>
                <h1 className="text-base sm:text-lg font-bold text-slate-900 tracking-tight flex items-center gap-2">
                  Gestão Financeira
                  <span className="text-[10px] uppercase font-semibold px-2 py-0.5 rounded-full bg-indigo-50 text-indigo-700 border border-indigo-100">
                    Completa
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


