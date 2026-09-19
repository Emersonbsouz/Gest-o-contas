import React, { useState, useMemo } from 'react';
import {
  Landmark,
  Plus,
  ArrowDownLeft,
  ArrowUpRight,
  ArrowRightLeft,
  Calendar,
  ChevronLeft,
  ChevronRight,
  Search,
  Download,
  Trash2,
  Edit2,
  Wallet,
  PiggyBank,
  CircleDollarSign,
  TrendingUp,
  AlertCircle,
  CheckCircle2,
  Filter,
} from 'lucide-react';
import {
  TreasuryAccount,
  Income,
  Expense,
  AccountTransfer,
  Category,
  AccountType,
} from '../types';
import {
  formatCurrency,
  formatDateBR,
  formatMonthYearLabel,
  getRelativeMonth,
} from '../utils/formatters';
import {
  getTreasuryMonthSummary,
  getUnifiedTransactions,
  calculateAccountBalances,
} from '../utils/treasuryHelpers';
import { TreasuryCharts } from './TreasuryCharts';

interface TreasuryViewProps {
  accounts?: TreasuryAccount[];
  incomes?: Income[];
  expenses?: Expense[];
  transfers?: AccountTransfer[];
  categories?: Category[];
  selectedMonth?: string;
  currentYearMonth?: string;
  onMonthChange?: (month: string) => void;
  onOpenIncomeModal?: (preselectedAccountId?: string) => void;
  onOpenAddIncomeModal?: (preselectedAccountId?: string) => void;
  onOpenTransferModal?: (preselectedAccountId?: string) => void;
  onOpenAddTransferModal?: (preselectedAccountId?: string) => void;
  onOpenExpenseModal: () => void;
  onOpenAccountModal: (account?: TreasuryAccount) => void;
  onDeleteAccount: (accountId: string) => void;
  onDeleteIncome: (incomeId: string) => void;
  onDeleteTransfer: (transferId: string) => void;
  onDeleteExpense: (expenseId: string) => void;
  onEditIncome: (income: Income) => void;
  onEditTransfer: (transfer: AccountTransfer) => void;
  onEditExpense: (expense: Expense) => void;
  onLiquidateExpense?: (expense: Expense) => void;
  onLiquidateIncome?: (income: Income) => void;
}

const ACCOUNT_TYPE_CONFIG: Record<
  AccountType,
  { label: string; icon: React.ComponentType<{ className?: string }> }
> = {
  checking: { label: 'Conta Corrente', icon: Landmark },
  cash: { label: 'Caixa / Carteira', icon: Wallet },
  savings: { label: 'Poupança / Reserva', icon: PiggyBank },
  investment: { label: 'Investimentos', icon: CircleDollarSign },
};

export const TreasuryView: React.FC<TreasuryViewProps> = ({
  accounts = [],
  incomes = [],
  expenses = [],
  transfers = [],
  categories = [],
  selectedMonth,
  currentYearMonth,
  onMonthChange,
  onOpenIncomeModal,
  onOpenAddIncomeModal,
  onOpenTransferModal,
  onOpenAddTransferModal,
  onOpenExpenseModal,
  onOpenAccountModal,
  onDeleteAccount,
  onDeleteIncome,
  onDeleteTransfer,
  onDeleteExpense,
  onEditIncome,
  onEditTransfer,
  onEditExpense,
  onLiquidateExpense,
  onLiquidateIncome,
}) => {
  const handleOpenIncome = onOpenIncomeModal || onOpenAddIncomeModal || (() => {});
  const handleOpenTransfer = onOpenTransferModal || onOpenAddTransferModal || (() => {});
  const activeMonth = selectedMonth || currentYearMonth || new Date().toISOString().slice(0, 7);
  const handleMonthChange = onMonthChange || (() => {});

  const [filterAccount, setFilterAccount] = useState<string>('all');
  const [filterType, setFilterType] = useState<'all' | 'income' | 'expense' | 'transfer'>('all');
  const [searchTerm, setSearchTerm] = useState('');
  const [showCharts, setShowCharts] = useState(true);

  // Month summary & balances
  const summary = useMemo(
    () => getTreasuryMonthSummary(accounts, incomes, expenses, transfers, activeMonth),
    [accounts, incomes, expenses, transfers, activeMonth]
  );

  const balances = useMemo(
    () => calculateAccountBalances(accounts, incomes, expenses, transfers),
    [accounts, incomes, expenses, transfers]
  );

  // Unified transactions list for the ledger
  const transactions = useMemo(
    () =>
      getUnifiedTransactions(incomes, expenses, transfers, accounts, categories, {
        yearMonth: activeMonth,
        accountId: filterAccount,
        type: filterType,
        searchTerm,
      }),
    [incomes, expenses, transfers, accounts, categories, activeMonth, filterAccount, filterType, searchTerm]
  );

  // CSV Export for Treasury Ledger
  const handleExportCSV = () => {
    const headers = ['Data', 'Tipo', 'Descricao', 'Conta', 'Destino', 'Categoria', 'Valor (R$)', 'Observacoes'];
    const rows = (transactions || []).map((t) => [
      t.date,
      t.type === 'income' ? 'Entrada' : t.type === 'expense' ? 'Saida' : 'Transferencia',
      `"${(t.description || '').replace(/"/g, '""')}"`,
      `"${t.accountName}"`,
      t.toAccountName ? `"${t.toAccountName}"` : '',
      `"${t.categoryName}"`,
      t.type === 'expense' ? `-${t.amount.toFixed(2)}` : t.amount.toFixed(2),
      `"${(t.notes || '').replace(/"/g, '""')}"`,
    ]);

    const csvContent = 'data:text/csv;charset=utf-8,' + [headers.join(','), ...rows.map((e) => e.join(','))].join('\n');
    const encodedUri = encodeURI(csvContent);
    const link = document.createElement('a');
    link.setAttribute('href', encodedUri);
    link.setAttribute('download', `extrato_tesouraria_${activeMonth}.csv`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  const handlePrevMonth = () => {
    handleMonthChange(getRelativeMonth(activeMonth, -1));
  };

  const handleNextMonth = () => {
    handleMonthChange(getRelativeMonth(activeMonth, 1));
  };

  const handleCurrentMonth = () => {
    const now = new Date();
    const ym = `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, '0')}`;
    handleMonthChange(ym);
  };

  const isNetPositive = summary.monthNet >= 0;

  return (
    <div id="treasury-view-container" className="space-y-6">
      {/* Top Toolbar: Month & Action Buttons */}
      <div className="flex flex-col md:flex-row items-start md:items-center justify-between gap-4 bg-white p-4 rounded-xl border border-slate-200/80 shadow-xs">
        {/* Month Selector */}
        <div className="flex items-center gap-2">
          <div className="flex items-center bg-slate-100 rounded-lg p-1">
            <button
              onClick={handlePrevMonth}
              id="btn-treasury-prev-month"
              title="Mês anterior"
              className="p-1.5 rounded-md hover:bg-white text-slate-600 hover:text-slate-900 transition-colors"
            >
              <ChevronLeft className="w-4 h-4" />
            </button>
            <div className="px-3 py-1 flex items-center gap-2">
              <Calendar className="w-4 h-4 text-slate-500" />
              <span className="text-sm font-bold text-slate-800">
                {formatMonthYearLabel(selectedMonth)}
              </span>
            </div>
            <button
              onClick={handleNextMonth}
              id="btn-treasury-next-month"
              title="Próximo mês"
              className="p-1.5 rounded-md hover:bg-white text-slate-600 hover:text-slate-900 transition-colors"
            >
              <ChevronRight className="w-4 h-4" />
            </button>
          </div>

          <button
            onClick={handleCurrentMonth}
            className="px-2.5 py-1.5 text-xs font-semibold text-slate-600 hover:text-slate-900 hover:bg-slate-100 rounded-lg border border-slate-200 transition-colors"
          >
            Mês Atual
          </button>
        </div>

        {/* Action Buttons */}
        <div className="flex items-center gap-2 flex-wrap w-full md:w-auto">
          <button
            onClick={() => handleOpenIncome()}
            id="btn-add-income"
            className="flex-1 sm:flex-initial px-3.5 py-2 bg-emerald-600 hover:bg-emerald-700 text-white text-xs font-bold rounded-lg shadow-xs transition-colors flex items-center justify-center gap-1.5"
          >
            <ArrowDownLeft className="w-4 h-4" />
            Nova Receita
          </button>

          <button
            onClick={() => handleOpenTransfer()}
            id="btn-add-transfer"
            className="flex-1 sm:flex-initial px-3.5 py-2 bg-sky-600 hover:bg-sky-700 text-white text-xs font-bold rounded-lg shadow-xs transition-colors flex items-center justify-center gap-1.5"
          >
            <ArrowRightLeft className="w-4 h-4" />
            Transferir
          </button>

          <button
            onClick={onOpenExpenseModal}
            id="btn-add-expense-treasury"
            className="flex-1 sm:flex-initial px-3.5 py-2 bg-indigo-600 hover:bg-indigo-700 text-white text-xs font-bold rounded-lg shadow-xs transition-colors flex items-center justify-center gap-1.5"
          >
            <ArrowUpRight className="w-4 h-4" />
            Nova Despesa
          </button>

          <button
            onClick={() => onOpenAccountModal()}
            id="btn-add-account"
            className="flex-1 sm:flex-initial px-3 py-2 bg-white hover:bg-slate-50 text-slate-700 border border-slate-200 text-xs font-semibold rounded-lg transition-colors flex items-center justify-center gap-1.5"
          >
            <Plus className="w-4 h-4 text-slate-500" />
            Nova Conta
          </button>
        </div>
      </div>

      {/* 4 Treasury Metric Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        {/* Total Treasury Balance */}
        <div className="bg-white rounded-xl p-4 border border-slate-200/80 shadow-xs relative overflow-hidden">
          <div className="flex items-center justify-between mb-2">
            <span className="text-xs font-semibold text-slate-500">Saldo Total em Caixa/Bancos</span>
            <div className="w-7 h-7 rounded-lg bg-indigo-50 text-indigo-600 flex items-center justify-center">
              <Landmark className="w-3.5 h-3.5" />
            </div>
          </div>
          <div className="text-2xl font-extrabold text-slate-900 tracking-tight">
            {formatCurrency(summary.totalBalance)}
          </div>
          <div className="mt-2 flex items-center gap-1.5 text-xs text-slate-500">
            <span className="font-semibold text-slate-700">{accounts.length}</span> contas ativas na tesouraria
          </div>
        </div>

        {/* Month Inflows */}
        <div className="bg-white rounded-xl p-4 border border-slate-200/80 shadow-xs">
          <div className="flex items-center justify-between mb-2">
            <span className="text-xs font-semibold text-slate-500">Entradas no Mês</span>
            <div className="w-7 h-7 rounded-lg bg-emerald-50 text-emerald-600 flex items-center justify-center">
              <ArrowDownLeft className="w-3.5 h-3.5" />
            </div>
          </div>
          <div className="text-2xl font-extrabold text-emerald-600 tracking-tight">
            +{formatCurrency(summary.monthInflow)}
          </div>
          <div className="mt-2 flex items-center gap-1.5 text-xs text-slate-500">
            <span className="font-semibold text-slate-700">{summary.incomesCount}</span> recebimentos registrados
          </div>
        </div>

        {/* Month Outflows */}
        <div className="bg-white rounded-xl p-4 border border-slate-200/80 shadow-xs">
          <div className="flex items-center justify-between mb-2">
            <span className="text-xs font-semibold text-slate-500">Saídas no Mês</span>
            <div className="w-7 h-7 rounded-lg bg-rose-50 text-rose-600 flex items-center justify-center">
              <ArrowUpRight className="w-3.5 h-3.5" />
            </div>
          </div>
          <div className="text-2xl font-extrabold text-rose-600 tracking-tight">
            -{formatCurrency(summary.monthOutflow)}
          </div>
          <div className="mt-2 flex items-center gap-1.5 text-xs text-slate-500">
            <span className="font-semibold text-slate-700">{summary.expensesCount}</span> despesas computadas
          </div>
        </div>

        {/* Month Net Result */}
        <div className="bg-white rounded-xl p-4 border border-slate-200/80 shadow-xs">
          <div className="flex items-center justify-between mb-2">
            <span className="text-xs font-semibold text-slate-500">Resultado do Mês</span>
            <div
              className={`w-7 h-7 rounded-lg flex items-center justify-center ${
                isNetPositive ? 'bg-emerald-50 text-emerald-600' : 'bg-rose-50 text-rose-600'
              }`}
            >
              <TrendingUp className="w-3.5 h-3.5" />
            </div>
          </div>
          <div
            className={`text-2xl font-extrabold tracking-tight ${
              isNetPositive ? 'text-emerald-600' : 'text-rose-600'
            }`}
          >
            {isNetPositive ? '+' : ''}
            {formatCurrency(summary.monthNet)}
          </div>
          <div className="mt-2 flex items-center gap-1.5 text-xs">
            <span
              className={`px-2 py-0.5 rounded-full text-[10px] font-bold ${
                isNetPositive ? 'bg-emerald-100 text-emerald-700' : 'bg-rose-100 text-rose-700'
              }`}
            >
              {isNetPositive ? 'Superávit Financeiro' : 'Déficit no Mês'}
            </span>
          </div>
        </div>
      </div>

      {/* Accounts & Cashbooks Grid */}
      <div className="bg-white rounded-xl p-5 border border-slate-200/80 shadow-xs">
        <div className="flex items-center justify-between mb-4">
          <div className="flex items-center gap-2">
            <div className="w-7 h-7 rounded-lg bg-indigo-50 text-indigo-600 flex items-center justify-center">
              <Landmark className="w-4 h-4" />
            </div>
            <div>
              <h3 className="text-sm font-bold text-slate-900">
                Contas Bancárias & Caixas da Tesouraria
              </h3>
              <p className="text-xs text-slate-500">
                Saldos em tempo real considerando entradas, despesas e transferências
              </p>
            </div>
          </div>
          <button
            onClick={() => onOpenAccountModal()}
            className="text-xs font-semibold text-indigo-600 hover:text-indigo-700 flex items-center gap-1"
          >
            <Plus className="w-3.5 h-3.5" />
            Adicionar Conta
          </button>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
          {accounts.map((acc) => {
            const accBalance = balances[acc.id] || 0;
            const TypeIcon = ACCOUNT_TYPE_CONFIG[acc.type]?.icon || Landmark;
            const typeLabel = ACCOUNT_TYPE_CONFIG[acc.type]?.label || 'Conta';

            return (
              <div
                key={acc.id}
                id={`card-account-${acc.id}`}
                className="rounded-xl border border-slate-200 bg-slate-50/50 p-4 hover:border-slate-300 transition-all flex flex-col justify-between"
              >
                <div>
                  <div className="flex items-start justify-between gap-2 mb-3">
                    <div className="flex items-center gap-2.5 min-w-0">
                      <div
                        className="w-8 h-8 rounded-lg flex items-center justify-center text-white shrink-0 shadow-xs"
                        style={{ backgroundColor: acc.color }}
                      >
                        <TypeIcon className="w-4 h-4" />
                      </div>
                      <div className="min-w-0">
                        <h4 className="text-xs font-bold text-slate-900 truncate" title={acc.name}>
                          {acc.name}
                        </h4>
                        <span className="text-[10px] text-slate-500 block truncate">
                          {acc.bankName || typeLabel}
                        </span>
                      </div>
                    </div>

                    <div className="flex items-center gap-1 shrink-0">
                      <button
                        onClick={() => onOpenAccountModal(acc)}
                        title="Editar Conta"
                        className="p-1 text-slate-400 hover:text-slate-700 hover:bg-slate-200/60 rounded-md transition-colors"
                      >
                        <Edit2 className="w-3.5 h-3.5" />
                      </button>
                      {accounts.length > 1 && (
                        <button
                          onClick={() => onDeleteAccount(acc.id)}
                          title="Excluir Conta"
                          className="p-1 text-slate-400 hover:text-rose-600 hover:bg-rose-50 rounded-md transition-colors"
                        >
                          <Trash2 className="w-3.5 h-3.5" />
                        </button>
                      )}
                    </div>
                  </div>

                  <div className="mb-2">
                    <span className="text-[10px] uppercase tracking-wider font-semibold text-slate-400 block">
                      Saldo Atual
                    </span>
                    <span
                      className={`text-lg font-bold block ${
                        accBalance >= 0 ? 'text-slate-900' : 'text-rose-600'
                      }`}
                    >
                      {formatCurrency(accBalance)}
                    </span>
                    {acc.accountNumber && (
                      <span className="text-[10px] text-slate-400 font-mono mt-0.5 block truncate">
                        {acc.accountNumber}
                      </span>
                    )}
                  </div>
                </div>

                {/* Quick Account Actions */}
                <div className="pt-3 border-t border-slate-200/60 flex items-center gap-1.5">
                  <button
                    onClick={() => handleOpenIncome(acc.id)}
                    className="flex-1 py-1 px-2 bg-emerald-50 hover:bg-emerald-100 text-emerald-700 text-[11px] font-semibold rounded-md transition-colors flex items-center justify-center gap-1"
                    title={`Adicionar receita na conta ${acc.name}`}
                  >
                    <ArrowDownLeft className="w-3 h-3" />
                    + Receita
                  </button>
                  <button
                    onClick={() => handleOpenTransfer(acc.id)}
                    className="flex-1 py-1 px-2 bg-sky-50 hover:bg-sky-100 text-sky-700 text-[11px] font-semibold rounded-md transition-colors flex items-center justify-center gap-1"
                    title={`Transferir a partir da conta ${acc.name}`}
                  >
                    <ArrowRightLeft className="w-3 h-3" />
                    Transferir
                  </button>
                </div>
              </div>
            );
          })}
        </div>
      </div>

      {/* Visual Charts Component */}
      {showCharts && (
        <TreasuryCharts
          accounts={accounts}
          incomes={incomes}
          expenses={expenses}
          currentYearMonth={selectedMonth}
          balances={balances}
        />
      )}

      {/* Unified Treasury Ledger / Livro-Caixa */}
      <div className="bg-white rounded-xl border border-slate-200/80 shadow-xs overflow-hidden">
        {/* Ledger Header & Filters */}
        <div className="p-5 border-b border-slate-100">
          <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
            <div>
              <h3 className="text-base font-bold text-slate-900">
                Livro-Caixa & Extrato Geral da Tesouraria
              </h3>
              <p className="text-xs text-slate-500">
                Lançamentos de {formatMonthYearLabel(selectedMonth)} • {transactions.length} movimentações encontradas
              </p>
            </div>

            <div className="flex items-center gap-2">
              <button
                onClick={handleExportCSV}
                className="px-3 py-1.5 text-xs font-semibold text-slate-700 bg-slate-100 hover:bg-slate-200 rounded-lg flex items-center gap-1.5 transition-colors"
                title="Exportar extrato em CSV"
              >
                <Download className="w-3.5 h-3.5 text-slate-500" />
                Exportar CSV
              </button>
            </div>
          </div>

          {/* Filter Bar */}
          <div className="mt-4 grid grid-cols-1 sm:grid-cols-12 gap-3 pt-3 border-t border-slate-100">
            {/* Search Input */}
            <div className="sm:col-span-5 relative">
              <Search className="w-4 h-4 text-slate-400 absolute left-3 top-2.5" />
              <input
                type="text"
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                placeholder="Buscar por descrição, notas ou categoria..."
                className="w-full pl-9 pr-3 py-1.5 text-xs rounded-lg border border-slate-200 focus:outline-none focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500 placeholder:text-slate-400"
              />
            </div>

            {/* Filter by Account */}
            <div className="sm:col-span-4">
              <select
                value={filterAccount}
                onChange={(e) => setFilterAccount(e.target.value)}
                className="w-full px-3 py-1.5 text-xs rounded-lg border border-slate-200 focus:outline-none focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500 bg-white text-slate-700"
              >
                <option value="all">Todas as Contas / Caixas</option>
                {accounts.map((acc) => (
                  <option key={acc.id} value={acc.id}>
                    {acc.name}
                  </option>
                ))}
              </select>
            </div>

            {/* Filter by Type */}
            <div className="sm:col-span-3">
              <select
                value={filterType}
                onChange={(e) => setFilterType(e.target.value as any)}
                className="w-full px-3 py-1.5 text-xs rounded-lg border border-slate-200 focus:outline-none focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500 bg-white text-slate-700"
              >
                <option value="all">Todos os Tipos</option>
                <option value="income">Entradas (Receitas)</option>
                <option value="expense">Saídas (Despesas)</option>
                <option value="transfer">Transferências</option>
              </select>
            </div>
          </div>
        </div>

        {/* Ledger Table */}
        <div className="overflow-x-auto">
          {transactions.length === 0 ? (
            <div className="text-center py-12 px-4">
              <AlertCircle className="w-8 h-8 text-slate-300 mx-auto mb-2" />
              <p className="text-xs font-semibold text-slate-600">Nenhum lançamento encontrado</p>
              <p className="text-[11px] text-slate-400 mt-0.5">
                Utilize os botões de ação acima para registrar novas entradas, saídas ou transferências.
              </p>
            </div>
          ) : (
            <table className="w-full text-left text-xs border-collapse">
              <thead>
                <tr className="border-b border-slate-100 bg-slate-50/70 text-slate-500 font-semibold">
                  <th className="py-2.5 px-4">Data</th>
                  <th className="py-2.5 px-3">Tipo</th>
                  <th className="py-2.5 px-4">Descrição</th>
                  <th className="py-2.5 px-3">Conta / Origem</th>
                  <th className="py-2.5 px-3">Categoria / Destino</th>
                  <th className="py-2.5 px-4 text-right">Valor</th>
                  <th className="py-2.5 px-4 text-center">Ações</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {transactions.map((tr) => {
                  const isIncome = tr.type === 'income';
                  const isExpense = tr.type === 'expense';
                  const isTransfer = tr.type === 'transfer';

                    return (
                      <tr
                        key={`${tr.type}-${tr.id}`}
                        className="hover:bg-slate-50/80 transition-colors cursor-pointer"
                        onClick={() => {
                          if (isIncome) {
                            const item = incomes.find((i) => i.id === tr.id);
                            if (item) onEditIncome(item);
                          } else if (isExpense) {
                            const item = expenses.find((e) => e.id === tr.id);
                            if (item) onEditExpense(item);
                          } else if (isTransfer) {
                            const item = transfers.find((t) => t.id === tr.id);
                            if (item) onEditTransfer(item);
                          }
                        }}
                      >
                      {/* Date */}
                      <td className="py-3 px-4 text-slate-600 font-medium whitespace-nowrap">
                        {formatDateBR(tr.date)}
                      </td>

                      {/* Type Badge */}
                      <td className="py-3 px-3 whitespace-nowrap">
                        {isIncome && (
                          <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[10px] font-bold bg-emerald-100 text-emerald-700">
                            <ArrowDownLeft className="w-3 h-3" />
                            Entrada
                          </span>
                        )}
                        {isExpense && (
                          <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[10px] font-bold bg-rose-100 text-rose-700">
                            <ArrowUpRight className="w-3 h-3" />
                            Saída
                          </span>
                        )}
                        {isTransfer && (
                          <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[10px] font-bold bg-sky-100 text-sky-700">
                            <ArrowRightLeft className="w-3 h-3" />
                            Transferência
                          </span>
                        )}
                      </td>

                      {/* Description & Notes */}
                      <td className="py-3 px-4">
                        <div className="flex items-start gap-2">
                          <div>
                            <span className="font-semibold text-slate-800 block">{tr.description}</span>
                            {tr.notes && (
                              <span className="text-[11px] text-slate-400 block truncate max-w-xs">
                                {tr.notes}
                              </span>
                            )}
                            {tr.paymentMethod === 'boleto' && (
                              <div className="mt-1 flex items-center gap-1.5">
                                <span className="inline-flex items-center px-1.5 py-0.5 rounded text-[9px] font-bold bg-indigo-50 text-indigo-600 border border-indigo-100 uppercase tracking-tighter">
                                  Boleto
                                </span>
                                {tr.billetData?.dueDate && (
                                  <span className="text-[10px] text-slate-500 font-medium">
                                    Venc: {formatDateBR(tr.billetData.dueDate)}
                                  </span>
                                )}
                              </div>
                            )}
                          </div>
                        </div>
                      </td>

                      {/* Account */}
                      <td className="py-3 px-3 text-slate-700 whitespace-nowrap">
                        <span className="inline-flex items-center gap-1 font-medium">
                          <Wallet className="w-3 h-3 text-slate-400" />
                          {tr.accountName}
                        </span>
                      </td>

                      {/* Category or Destination */}
                      <td className="py-3 px-3 whitespace-nowrap">
                        {isTransfer ? (
                          <span className="text-sky-700 font-medium flex items-center gap-1 text-[11px]">
                            → {tr.toAccountName}
                          </span>
                        ) : (
                          <span className="text-slate-600 text-[11px] bg-slate-100 px-2 py-0.5 rounded-md">
                            {tr.categoryName}
                          </span>
                        )}
                      </td>

                      {/* Amount */}
                      <td className="py-3 px-4 text-right whitespace-nowrap">
                        <span
                          className={`font-bold ${
                            isIncome
                              ? 'text-emerald-600'
                              : isExpense
                              ? 'text-rose-600'
                              : 'text-sky-600'
                          }`}
                        >
                          {isIncome && '+'}
                          {isExpense && '-'}
                          {isTransfer && '⇄ '}
                          {formatCurrency(tr.amount)}
                        </span>
                      </td>

                      {/* Actions */}
                      <td className="py-3 px-4 text-center whitespace-nowrap">
                        <div className="flex items-center justify-center gap-1">
                          {isIncome && (
                            <>
                              {incomes.find(i => i.id === tr.id)?.status === 'pending' && onLiquidateIncome && (
                                <button
                                  onClick={(e) => {
                                    e.stopPropagation();
                                    const item = incomes.find((i) => i.id === tr.id);
                                    if (item) onLiquidateIncome(item);
                                  }}
                                  title="Liquidar Receita"
                                  className="p-1 text-emerald-600 hover:bg-emerald-50 rounded-md transition-colors"
                                >
                                  <CheckCircle2 className="w-3.5 h-3.5" />
                                </button>
                              )}
                              <button
                                onClick={(e) => {
                                  e.stopPropagation();
                                  const item = incomes.find((i) => i.id === tr.id);
                                  if (item) onEditIncome(item);
                                }}
                                title="Editar Receita"
                                className="p-1 text-slate-400 hover:text-slate-700 hover:bg-slate-100 rounded-md transition-colors"
                              >
                                <Edit2 className="w-3.5 h-3.5" />
                              </button>
                              <button
                                onClick={(e) => {
                                  e.stopPropagation();
                                  if (window.confirm('Excluir esta receita?')) {
                                    onDeleteIncome(tr.id);
                                  }
                                }}
                                title="Excluir Receita"
                                className="p-1 text-slate-400 hover:text-rose-600 hover:bg-rose-50 rounded-md transition-colors"
                              >
                                <Trash2 className="w-3.5 h-3.5" />
                              </button>
                            </>
                          )}

                          {isExpense && (
                            <>
                              {expenses.find(exp => exp.id === tr.id)?.status === 'pending' && onLiquidateExpense && (
                                <button
                                  onClick={(e) => {
                                    e.stopPropagation();
                                    const item = expenses.find((exp) => exp.id === tr.id);
                                    if (item) onLiquidateExpense(item);
                                  }}
                                  title="Liquidar Despesa"
                                  className="p-1 text-emerald-600 hover:bg-emerald-50 rounded-md transition-colors"
                                >
                                  <CheckCircle2 className="w-3.5 h-3.5" />
                                </button>
                              )}
                              <button
                                onClick={(e) => {
                                  e.stopPropagation();
                                  const item = expenses.find((e) => e.id === tr.id);
                                  if (item) onEditExpense(item);
                                }}
                                title="Editar Despesa"
                                className="p-1 text-slate-400 hover:text-slate-700 hover:bg-slate-100 rounded-md transition-colors"
                              >
                                <Edit2 className="w-3.5 h-3.5" />
                              </button>
                              <button
                                onClick={(e) => {
                                  e.stopPropagation();
                                  if (window.confirm('Excluir esta despesa?')) {
                                    onDeleteExpense(tr.id);
                                  }
                                }}
                                title="Excluir Despesa"
                                className="p-1 text-slate-400 hover:text-rose-600 hover:bg-rose-50 rounded-md transition-colors"
                              >
                                <Trash2 className="w-3.5 h-3.5" />
                              </button>
                            </>
                          )}

                          {isTransfer && (
                            <>
                              <button
                                onClick={(e) => {
                                  e.stopPropagation();
                                  const item = transfers.find((t) => t.id === tr.id);
                                  if (item) onEditTransfer(item);
                                }}
                                title="Editar Transferência"
                                className="p-1 text-slate-400 hover:text-slate-700 hover:bg-slate-100 rounded-md transition-colors"
                              >
                                <Edit2 className="w-3.5 h-3.5" />
                              </button>
                              <button
                                onClick={(e) => {
                                  e.stopPropagation();
                                  if (window.confirm('Excluir esta transferência?')) {
                                    onDeleteTransfer(tr.id);
                                  }
                                }}
                                title="Excluir Transferência"
                                className="p-1 text-slate-400 hover:text-rose-600 hover:bg-rose-50 rounded-md transition-colors"
                              >
                                <Trash2 className="w-3.5 h-3.5" />
                              </button>
                            </>
                          )}
                        </div>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          )}
        </div>
      </div>
    </div>
  );
};
