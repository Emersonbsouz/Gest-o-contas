import React, { useState, useMemo } from 'react';
import {
  Search,
  Filter,
  ArrowUpDown,
  Edit2,
  Trash2,
  TrendingUp,
  Plus,
  ArrowDownLeft,
  CheckCircle2,
  Building2,
  Clock
} from 'lucide-react';
import { Income, Category, PaymentMethod, TreasuryAccount, ContactPerson, CostCenter } from '../types';
import {
  formatCurrency,
  formatDateBR,
  PAYMENT_METHOD_LABELS,
} from '../utils/formatters';
import { CategoryIcon } from './CategoryIcon';

interface IncomeListProps {
  incomes: Income[];
  categories: Category[];
  accounts?: TreasuryAccount[];
  contacts?: ContactPerson[];
  costCenters?: CostCenter[];
  currentYearMonth: string;
  onEditIncome: (income: Income) => void;
  onDeleteIncome: (incomeId: string) => void;
  onOpenAddModal: () => void;
  onLiquidateIncome?: (income: Income) => void;
}

type SortOption = 'date_desc' | 'date_asc' | 'amount_desc' | 'amount_asc';

export const IncomeList: React.FC<IncomeListProps> = ({
  incomes = [],
  categories = [],
  accounts = [],
  contacts = [],
  costCenters = [],
  currentYearMonth,
  onEditIncome,
  onDeleteIncome,
  onOpenAddModal,
  onLiquidateIncome,
}) => {
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedCategory, setSelectedCategory] = useState<string>('all');
  const [sortBy, setSortBy] = useState<SortOption>('date_desc');

  const contactMap = useMemo(() => {
    return new Map<string, string>(contacts.map((c) => [c.id, c.name]));
  }, [contacts]);

  const costCenterMap = useMemo(() => {
    return new Map<string, string>(costCenters.map((cc) => [cc.id, cc.name]));
  }, [costCenters]);

  const monthIncomes = useMemo(() => {
    const ym = currentYearMonth || '';
    return incomes.filter((i) => (ym ? i.date.startsWith(ym) : true));
  }, [incomes, currentYearMonth]);

  const filteredIncomes = useMemo(() => {
    return monthIncomes
      .filter((i) => {
        const matchesSearch =
          i.description.toLowerCase().includes(searchTerm.toLowerCase()) ||
          (i.notes && i.notes.toLowerCase().includes(searchTerm.toLowerCase()));

        const matchesCategory =
          selectedCategory === 'all' || i.categoryId === selectedCategory;

        return matchesSearch && matchesCategory;
      })
      .sort((a, b) => {
        if (sortBy === 'date_desc') return b.date.localeCompare(a.date);
        if (sortBy === 'date_asc') return a.date.localeCompare(b.date);
        if (sortBy === 'amount_desc') return b.amount - a.amount;
        if (sortBy === 'amount_asc') return a.amount - b.amount;
        return 0;
      });
  }, [monthIncomes, searchTerm, selectedCategory, sortBy]);

  const filteredTotal = filteredIncomes.reduce((sum, i) => sum + i.amount, 0);

  const getCategory = (catId: string) => {
    return (
      categories.find((c) => c.id === catId) || {
        id: catId,
        name: 'Outros',
        color: '#64748b',
        icon: 'MoreHorizontal',
      }
    );
  };

  return (
    <div className="bg-white rounded-xl border border-slate-200 shadow-xs overflow-hidden">
      <div className="p-4 sm:p-5 border-b border-slate-100 space-y-3">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
          <div>
            <h2 className="text-lg font-bold text-slate-900 flex items-center gap-2">
              <TrendingUp className="w-5 h-5 text-emerald-600" />
              Contas a Receber
            </h2>
            <p className="text-xs text-slate-500">
              {filteredIncomes.length} de {monthIncomes.length} receitas encontradas
            </p>
          </div>

          <button
            onClick={onOpenAddModal}
            className="self-start sm:self-auto inline-flex items-center gap-1.5 px-3.5 py-2 bg-emerald-600 hover:bg-emerald-700 text-white rounded-lg text-xs font-semibold shadow-xs transition-colors"
          >
            <Plus className="w-4 h-4" />
            Nova Receita
          </button>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-12 gap-2.5 pt-1">
          <div className="sm:col-span-6 relative">
            <Search className="w-4 h-4 absolute left-3 top-2.5 text-slate-400" />
            <input
              type="text"
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              placeholder="Buscar por cliente ou descrição..."
              className="w-full pl-9 pr-3 py-1.5 rounded-lg border border-slate-200 text-xs text-slate-900 focus:outline-none focus:ring-2 focus:ring-emerald-500/20 focus:border-emerald-500 transition-all"
            />
          </div>

          <div className="sm:col-span-3">
            <select
              value={selectedCategory}
              onChange={(e) => setSelectedCategory(e.target.value)}
              className="w-full px-2.5 py-1.5 rounded-lg border border-slate-200 text-xs text-slate-700 focus:outline-none focus:ring-2 focus:ring-emerald-500/20 focus:border-emerald-500 transition-all bg-white"
            >
              <option value="all">Todas as Categorias</option>
              {categories.filter(c => c.type === 'income').map((c) => (
                <option key={c.id} value={c.id}>{c.name}</option>
              ))}
            </select>
          </div>

          <div className="sm:col-span-3">
            <select
              value={sortBy}
              onChange={(e) => setSortBy(e.target.value as SortOption)}
              className="w-full px-2.5 py-1.5 rounded-lg border border-slate-200 text-xs text-slate-700 focus:outline-none focus:ring-2 focus:ring-emerald-500/20 focus:border-emerald-500 transition-all bg-white"
            >
              <option value="date_desc">Mais recentes</option>
              <option value="date_asc">Mais antigas</option>
              <option value="amount_desc">Maior valor</option>
              <option value="amount_asc">Menor valor</option>
            </select>
          </div>
        </div>
      </div>

      {filteredIncomes.length === 0 ? (
        <div className="py-12 px-4 text-center">
          <TrendingUp className="w-12 h-12 text-slate-200 mx-auto mb-3" />
          <h3 className="text-sm font-semibold text-slate-800">Nenhuma receita encontrada</h3>
        </div>
      ) : (
        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs border-collapse">
            <thead>
              <tr className="border-b border-slate-200 bg-slate-50/70 text-slate-500 font-semibold uppercase tracking-wider text-[11px]">
                <th className="py-3 px-4">Data</th>
                <th className="py-3 px-4">Descrição / Obra</th>
                <th className="py-3 px-4">Categoria</th>
                <th className="py-3 px-4 text-right">Valor</th>
                <th className="py-3 px-4 text-center w-24">Ações</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {filteredIncomes.map((income) => {
                const cat = getCategory(income.categoryId);
                return (
                  <tr
                    key={income.id}
                    className="hover:bg-slate-50/80 transition-colors group cursor-pointer"
                    onClick={() => onEditIncome(income)}
                  >
                    <td className="py-3 px-4 text-slate-500 font-medium whitespace-nowrap">
                      {formatDateBR(income.date)}
                    </td>
                    <td className="py-3 px-4">
                      <div className="flex items-center gap-1.5 flex-wrap">
                        <span className="font-semibold text-slate-900">{income.description}</span>
                        {(income.status === 'pending' || income.status === 'PENDENTE') && (
                          <span className="px-1.5 py-0.5 rounded text-[10px] font-bold bg-amber-50 text-amber-700 border border-amber-200 uppercase">
                            Pendente
                          </span>
                        )}
                        {(income.status === 'paid' || income.status === 'PAGO') && (
                          <span className="px-1.5 py-0.5 rounded text-[10px] font-bold bg-emerald-50 text-emerald-700 border border-emerald-200 uppercase">
                            Pago
                          </span>
                        )}
                        {(income.status === 'overdue' || income.status === 'VENCIDO') && (
                          <span className="px-1.5 py-0.5 rounded text-[10px] font-bold bg-rose-50 text-rose-700 border border-rose-200 uppercase">
                            Vencido
                          </span>
                        )}
                        {(income.status === 'cancelled' || income.status === 'CANCELADO') && (
                          <span className="px-1.5 py-0.5 rounded text-[10px] font-bold bg-slate-50 text-slate-700 border border-slate-200 uppercase">
                            Cancelado
                          </span>
                        )}
                        {income.isRecurring && (
                          <Clock className="w-3 h-3 text-indigo-500" />
                        )}
                      </div>
                      <div className="flex items-center gap-2 flex-wrap text-[11px] text-slate-400 mt-0.5">
                        {income.costCenterId && (
                          <span className="inline-flex items-center gap-1 text-indigo-600 font-medium">
                            <Building2 className="w-3 h-3" />
                            Obra: {costCenterMap.get(income.costCenterId)}
                          </span>
                        )}
                        {income.contactId && (
                          <span className="text-slate-500">
                            Cliente: {contactMap.get(income.contactId)}
                          </span>
                        )}
                      </div>
                    </td>
                    <td className="py-3 px-4 whitespace-nowrap">
                      <span
                        className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-md text-xs font-semibold"
                        style={{ backgroundColor: `${cat.color}15`, color: cat.color }}
                      >
                        <CategoryIcon name={cat.icon} className="w-3.5 h-3.5" />
                        <span>{cat.name}</span>
                      </span>
                    </td>
                    <td className="py-3 px-4 text-right whitespace-nowrap">
                      <span className="font-bold text-emerald-600 text-sm">
                        {formatCurrency(income.amount)}
                      </span>
                    </td>
                    <td className="py-3 px-4 text-center whitespace-nowrap">
                      <div className="flex items-center justify-center gap-1">
                        {income.status === 'pending' && onLiquidateIncome && (
                          <button
                            onClick={(e) => { e.stopPropagation(); onLiquidateIncome(income); }}
                            className="p-1.5 text-emerald-600 hover:bg-emerald-50 rounded-md transition-colors"
                          >
                            <CheckCircle2 className="w-3.5 h-3.5" />
                          </button>
                        )}
                        <button
                          onClick={(e) => { e.stopPropagation(); onEditIncome(income); }}
                          className="p-1.5 text-slate-400 hover:text-indigo-600 hover:bg-indigo-50 rounded-md transition-colors"
                        >
                          <Edit2 className="w-3.5 h-3.5" />
                        </button>
                        <button
                          onClick={(e) => {
                            e.stopPropagation();
                            if (window.confirm('Deseja excluir esta receita?')) onDeleteIncome(income.id);
                          }}
                          className="p-1.5 text-slate-400 hover:text-rose-600 hover:bg-rose-50 rounded-md transition-colors"
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
        </div>
      )}
    </div>
  );
};
