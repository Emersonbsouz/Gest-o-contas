import React, { useState, useMemo } from 'react';
import {
  Search,
  Filter,
  ArrowUpDown,
  Edit2,
  Trash2,
  Receipt,
  Plus,
  CreditCard as CreditCardIcon,
  Wallet,
} from 'lucide-react';
import { Expense, Category, PaymentMethod, TreasuryAccount, CreditCard, ContactPerson } from '../types';
import {
  formatCurrency,
  formatDateBR,
  PAYMENT_METHOD_LABELS,
} from '../utils/formatters';
import { CategoryIcon } from './CategoryIcon';

interface ExpenseListProps {
  expenses: Expense[];
  categories: Category[];
  accounts?: TreasuryAccount[];
  cards?: CreditCard[];
  contacts?: ContactPerson[];
  currentYearMonth: string;
  onEditExpense: (expense: Expense) => void;
  onDeleteExpense: (expenseId: string) => void;
  onOpenAddModal: () => void;
}

type SortOption = 'date_desc' | 'date_asc' | 'amount_desc' | 'amount_asc';

export const ExpenseList: React.FC<ExpenseListProps> = ({
  expenses,
  categories,
  accounts = [],
  cards = [],
  contacts = [],
  currentYearMonth,
  onEditExpense,
  onDeleteExpense,
  onOpenAddModal,
}) => {
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedCategory, setSelectedCategory] = useState<string>('all');
  const [selectedPayment, setSelectedPayment] = useState<string>('all');
  const [sortBy, setSortBy] = useState<SortOption>('date_desc');

  const accountMap = useMemo(() => {
    return new Map<string, string>(accounts.map((a) => [a.id, a.name]));
  }, [accounts]);

  const cardMap = useMemo(() => {
    return new Map<string, string>(cards.map((c) => [c.id, c.name]));
  }, [cards]);

  const contactMap = useMemo(() => {
    return new Map<string, string>(contacts.map((c) => [c.id, c.name]));
  }, [contacts]);


  // Filter expenses for current month
  const monthExpenses = useMemo(() => {
    return expenses.filter((e) => e.date.startsWith(currentYearMonth));
  }, [expenses, currentYearMonth]);

  // Filter and sort
  const filteredExpenses = useMemo(() => {
    return monthExpenses
      .filter((e) => {
        const matchesSearch =
          e.description.toLowerCase().includes(searchTerm.toLowerCase()) ||
          (e.notes && e.notes.toLowerCase().includes(searchTerm.toLowerCase()));

        const matchesCategory =
          selectedCategory === 'all' || e.categoryId === selectedCategory;

        const matchesPayment =
          selectedPayment === 'all' || e.paymentMethod === selectedPayment;

        return matchesSearch && matchesCategory && matchesPayment;
      })
      .sort((a, b) => {
        if (sortBy === 'date_desc') return b.date.localeCompare(a.date);
        if (sortBy === 'date_asc') return a.date.localeCompare(b.date);
        if (sortBy === 'amount_desc') return b.amount - a.amount;
        if (sortBy === 'amount_asc') return a.amount - b.amount;
        return 0;
      });
  }, [monthExpenses, searchTerm, selectedCategory, selectedPayment, sortBy]);

  const filteredTotal = filteredExpenses.reduce((sum, e) => sum + e.amount, 0);

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
    <div id="section-expense-list" className="bg-white rounded-xl border border-slate-200 shadow-xs overflow-hidden">
      {/* Header & Controls */}
      <div className="p-4 sm:p-5 border-b border-slate-100 space-y-3">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
          <div>
            <h2 className="text-lg font-bold text-slate-900 flex items-center gap-2">
              <Receipt className="w-5 h-5 text-indigo-600" />
              Lançamentos do Mês
            </h2>
            <p className="text-xs text-slate-500">
              {filteredExpenses.length} de {monthExpenses.length} despesas encontradas
              {filteredExpenses.length !== monthExpenses.length && (
                <span> (Subtotal filtrado: <strong>{formatCurrency(filteredTotal)}</strong>)</span>
              )}
            </p>
          </div>

          <button
            id="btn-add-expense-from-list"
            onClick={onOpenAddModal}
            className="self-start sm:self-auto inline-flex items-center gap-1.5 px-3.5 py-2 bg-indigo-600 hover:bg-indigo-700 text-white rounded-lg text-xs font-semibold shadow-xs transition-colors"
          >
            <Plus className="w-4 h-4" />
            Nova Despesa
          </button>
        </div>

        {/* Filter controls row */}
        <div className="grid grid-cols-1 sm:grid-cols-12 gap-2.5 pt-1">
          {/* Search Input */}
          <div className="sm:col-span-5 relative">
            <Search className="w-4 h-4 absolute left-3 top-2.5 text-slate-400" />
            <input
              id="input-search-expenses"
              type="text"
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              placeholder="Buscar por descrição ou nota..."
              className="w-full pl-9 pr-3 py-1.5 rounded-lg border border-slate-200 text-xs text-slate-900 focus:outline-none focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500 transition-all placeholder:text-slate-400"
            />
          </div>

          {/* Category Filter */}
          <div className="sm:col-span-3">
            <select
              id="select-filter-category"
              value={selectedCategory}
              onChange={(e) => setSelectedCategory(e.target.value)}
              className="w-full px-2.5 py-1.5 rounded-lg border border-slate-200 text-xs text-slate-700 focus:outline-none focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500 transition-all bg-white"
            >
              <option value="all">Todas as Categorias</option>
              {categories.map((c) => (
                <option key={c.id} value={c.id}>
                  {c.name}
                </option>
              ))}
            </select>
          </div>

          {/* Payment Method Filter */}
          <div className="sm:col-span-2">
            <select
              id="select-filter-payment"
              value={selectedPayment}
              onChange={(e) => setSelectedPayment(e.target.value)}
              className="w-full px-2.5 py-1.5 rounded-lg border border-slate-200 text-xs text-slate-700 focus:outline-none focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500 transition-all bg-white"
            >
              <option value="all">Pagamentos</option>
              {Object.entries(PAYMENT_METHOD_LABELS).map(([val, label]) => (
                <option key={val} value={val}>
                  {label}
                </option>
              ))}
            </select>
          </div>

          {/* Sort By */}
          <div className="sm:col-span-2">
            <select
              id="select-sort-expenses"
              value={sortBy}
              onChange={(e) => setSortBy(e.target.value as SortOption)}
              className="w-full px-2.5 py-1.5 rounded-lg border border-slate-200 text-xs text-slate-700 focus:outline-none focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500 transition-all bg-white"
            >
              <option value="date_desc">Mais recentes</option>
              <option value="date_asc">Mais antigas</option>
              <option value="amount_desc">Maior valor</option>
              <option value="amount_asc">Menor valor</option>
            </select>
          </div>
        </div>
      </div>

      {/* Table / List */}
      {filteredExpenses.length === 0 ? (
        <div className="py-12 px-4 text-center">
          <div className="w-12 h-12 rounded-full bg-slate-100 text-slate-400 mx-auto flex items-center justify-center mb-3">
            <Filter className="w-5 h-5" />
          </div>
          <h3 className="text-sm font-semibold text-slate-800">Nenhum gasto encontrado</h3>
          <p className="text-xs text-slate-500 max-w-sm mx-auto mt-1">
            {monthExpenses.length === 0
              ? 'Você ainda não registrou despesas neste mês. Clique em "Nova Despesa" para começar!'
              : 'Nenhum lançamento corresponde aos filtros de busca selecionados.'}
          </p>
          {monthExpenses.length === 0 && (
            <button
              onClick={onOpenAddModal}
              className="mt-4 inline-flex items-center gap-1.5 px-4 py-2 bg-indigo-600 hover:bg-indigo-700 text-white rounded-lg text-xs font-semibold transition-colors"
            >
              <Plus className="w-4 h-4" />
              Adicionar primeira despesa
            </button>
          )}
        </div>
      ) : (
        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs border-collapse">
            <thead>
              <tr className="border-b border-slate-200 bg-slate-50/70 text-slate-500 font-semibold uppercase tracking-wider text-[11px]">
                <th className="py-3 px-4">Data</th>
                <th className="py-3 px-4">Descrição</th>
                <th className="py-3 px-4">Categoria</th>
                <th className="py-3 px-4 hidden md:table-cell">Pagamento</th>
                <th className="py-3 px-4 text-right">Valor</th>
                <th className="py-3 px-4 text-center w-24">Ações</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {filteredExpenses.map((expense) => {
                const cat = getCategory(expense.categoryId);
                return (
                  <tr
                    key={expense.id}
                    id={`expense-row-${expense.id}`}
                    className="hover:bg-slate-50/80 transition-colors group"
                  >
                    {/* Date */}
                    <td className="py-3 px-4 text-slate-500 font-medium whitespace-nowrap">
                      {formatDateBR(expense.date)}
                    </td>

                    {/* Description & Note & Badges */}
                    <td className="py-3 px-4">
                      <div className="flex items-center gap-1.5 flex-wrap">
                        <span className="font-semibold text-slate-900">{expense.description}</span>
                        {expense.status === 'pending' && (
                          <span className="px-1.5 py-0.5 rounded text-[10px] font-bold bg-amber-50 text-amber-700 border border-amber-200">
                            A Pagar
                          </span>
                        )}
                        {expense.installments && (
                          <span className="px-1.5 py-0.5 rounded text-[10px] font-semibold bg-indigo-50 text-indigo-700 border border-indigo-100">
                            {expense.installments.current}/{expense.installments.total}x
                          </span>
                        )}
                      </div>
                      <div className="flex items-center gap-2 flex-wrap text-[11px] text-slate-400 mt-0.5">
                        {expense.contactId && contactMap.get(expense.contactId) && (
                          <span className="text-violet-600 font-medium">
                            Favorecido: {contactMap.get(expense.contactId)}
                          </span>
                        )}
                        {expense.notes && (
                          <span className="truncate max-w-xs">{expense.notes}</span>
                        )}
                      </div>
                    </td>

                    {/* Category */}
                    <td className="py-3 px-4 whitespace-nowrap">
                      <span
                        className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-md text-xs font-semibold"
                        style={{
                          backgroundColor: `${cat.color}15`,
                          color: cat.color,
                        }}
                      >
                        <CategoryIcon name={cat.icon} className="w-3.5 h-3.5" />
                        <span>{cat.name}</span>
                      </span>
                    </td>

                    {/* Payment Method & Account / Card */}
                    <td className="py-3 px-4 hidden md:table-cell whitespace-nowrap text-slate-600">
                      <div className="flex flex-col gap-1 items-start">
                        <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full bg-slate-100 text-[11px] text-slate-700 font-medium">
                          <CreditCardIcon className="w-3 h-3 text-slate-400" />
                          {PAYMENT_METHOD_LABELS[expense.paymentMethod] || expense.paymentMethod}
                        </span>
                        {expense.cardId && cardMap.get(expense.cardId) && (
                          <span className="inline-flex items-center gap-1 text-[10px] text-indigo-600 font-medium pl-1">
                            Cartão: {cardMap.get(expense.cardId)}
                          </span>
                        )}
                        {!expense.cardId && expense.accountId && accountMap.get(expense.accountId) && (
                          <span className="inline-flex items-center gap-1 text-[10px] text-slate-500 font-medium pl-1">
                            <Wallet className="w-2.5 h-2.5 text-slate-400" />
                            {accountMap.get(expense.accountId)}
                          </span>
                        )}
                      </div>
                    </td>

                    {/* Amount */}
                    <td className="py-3 px-4 text-right whitespace-nowrap">
                      <span className="font-bold text-slate-900 text-sm">
                        {formatCurrency(expense.amount)}
                      </span>
                    </td>

                    {/* Actions */}
                    <td className="py-3 px-4 text-center whitespace-nowrap">
                      <div className="flex items-center justify-center gap-1 opacity-80 group-hover:opacity-100">
                        <button
                          onClick={() => onEditExpense(expense)}
                          title="Editar Despesa"
                          className="p-1.5 text-slate-400 hover:text-indigo-600 hover:bg-indigo-50 rounded-md transition-colors"
                        >
                          <Edit2 className="w-3.5 h-3.5" />
                        </button>
                        <button
                          onClick={() => {
                            if (window.confirm(`Deseja realmente excluir "${expense.description}"?`)) {
                              onDeleteExpense(expense.id);
                            }
                          }}
                          title="Excluir Despesa"
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
