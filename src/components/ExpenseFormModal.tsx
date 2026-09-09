import React, { useState, useEffect } from 'react';
import { X, Check, Calendar, CreditCard, FileText, Tag, DollarSign, Wallet, Users, Clock } from 'lucide-react';
import {
  Category,
  Expense,
  PaymentMethod,
  TreasuryAccount,
  CreditCard as CreditCardType,
  ContactPerson,
  PaymentStatus,
} from '../types';
import { PAYMENT_METHOD_LABELS } from '../utils/formatters';
import { CategoryIcon } from './CategoryIcon';

interface ExpenseFormModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSave: (expenseData: Omit<Expense, 'id' | 'createdAt'>, expenseId?: string) => void;
  editingExpense?: Expense | null;
  categories: Category[];
  accounts?: TreasuryAccount[];
  cards?: CreditCardType[];
  contacts?: ContactPerson[];
  defaultDate?: string;
}

export const ExpenseFormModal: React.FC<ExpenseFormModalProps> = ({
  isOpen,
  onClose,
  onSave,
  editingExpense,
  categories,
  accounts = [],
  cards = [],
  contacts = [],
  defaultDate,
}) => {
  const [description, setDescription] = useState('');
  const [amount, setAmount] = useState('');
  const [date, setDate] = useState('');
  const [categoryId, setCategoryId] = useState('');
  const [paymentMethod, setPaymentMethod] = useState<PaymentMethod>('credit_card');
  const [accountId, setAccountId] = useState('');
  const [cardId, setCardId] = useState('');
  const [contactId, setContactId] = useState('');
  const [status, setStatus] = useState<PaymentStatus>('paid');
  const [isInstallment, setIsInstallment] = useState(false);
  const [currentInstallment, setCurrentInstallment] = useState('1');
  const [totalInstallments, setTotalInstallments] = useState('1');
  const [notes, setNotes] = useState('');
  const [error, setError] = useState('');

  useEffect(() => {
    if (editingExpense) {
      setDescription(editingExpense.description);
      setAmount(editingExpense.amount.toString());
      setDate(editingExpense.date);
      setCategoryId(editingExpense.categoryId);
      setPaymentMethod(editingExpense.paymentMethod);
      setAccountId(editingExpense.accountId || accounts[0]?.id || '');
      setCardId(editingExpense.cardId || cards[0]?.id || '');
      setContactId(editingExpense.contactId || '');
      setStatus(editingExpense.status || 'paid');
      if (editingExpense.installments) {
        setIsInstallment(true);
        setCurrentInstallment(editingExpense.installments.current.toString());
        setTotalInstallments(editingExpense.installments.total.toString());
      } else {
        setIsInstallment(false);
        setCurrentInstallment('1');
        setTotalInstallments('1');
      }
      setNotes(editingExpense.notes || '');
    } else {
      const today = new Date().toISOString().split('T')[0];
      setDescription('');
      setAmount('');
      setDate(defaultDate || today);
      setCategoryId(categories[0]?.id || '');
      setPaymentMethod('credit_card');
      setAccountId(accounts[0]?.id || '');
      setCardId(cards[0]?.id || '');
      setContactId('');
      setStatus('paid');
      setIsInstallment(false);
      setCurrentInstallment('1');
      setTotalInstallments('1');
      setNotes('');
    }
    setError('');
  }, [editingExpense, isOpen, defaultDate, categories, accounts, cards]);

  if (!isOpen) return null;

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();

    const cleanDesc = description.trim();
    if (!cleanDesc) {
      setError('Por favor, informe a descrição do gasto.');
      return;
    }

    const numAmount = parseFloat(amount.replace(',', '.'));
    if (isNaN(numAmount) || numAmount <= 0) {
      setError('Informe um valor válido maior que zero.');
      return;
    }

    if (!date) {
      setError('Informe a data da despesa.');
      return;
    }

    if (!categoryId) {
      setError('Selecione uma categoria.');
      return;
    }

    let installmentsData = undefined;
    if (isInstallment) {
      const curr = parseInt(currentInstallment, 10);
      const tot = parseInt(totalInstallments, 10);
      if (!isNaN(curr) && !isNaN(tot) && tot > 1) {
        installmentsData = { current: Math.max(1, curr), total: tot };
      }
    }

    onSave(
      {
        description: cleanDesc,
        amount: Math.round(numAmount * 100) / 100,
        date,
        categoryId,
        paymentMethod,
        accountId: paymentMethod !== 'credit_card' ? accountId || (accounts[0] ? accounts[0].id : undefined) : undefined,
        cardId: paymentMethod === 'credit_card' ? cardId || (cards[0] ? cards[0].id : undefined) : undefined,
        contactId: contactId || undefined,
        status,
        installments: installmentsData,
        notes: notes.trim() || undefined,
      },
      editingExpense ? editingExpense.id : undefined
    );
    onClose();
  };



  return (
    <div className="fixed inset-0 z-50 overflow-y-auto bg-slate-900/60 backdrop-blur-xs flex items-center justify-center p-4">
      <div
        id="modal-expense-form"
        className="bg-white rounded-2xl max-w-lg w-full shadow-2xl border border-slate-200 overflow-hidden animate-in fade-in zoom-in-95 duration-200"
      >
        {/* Header */}
        <div className="flex items-center justify-between px-6 py-4 border-b border-slate-100 bg-slate-50/50">
          <div className="flex items-center gap-2.5">
            <div className="w-8 h-8 rounded-lg bg-indigo-100 text-indigo-700 flex items-center justify-center font-semibold">
              <DollarSign className="w-4 h-4" />
            </div>
            <div>
              <h3 className="text-base font-bold text-slate-900">
                {editingExpense ? 'Editar Despesa' : 'Nova Despesa'}
              </h3>
              <p className="text-xs text-slate-500">
                {editingExpense
                  ? 'Atualize os detalhes do lançamento'
                  : 'Preencha as informações para registrar o gasto'}
              </p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="w-8 h-8 rounded-lg text-slate-400 hover:text-slate-700 hover:bg-slate-100 flex items-center justify-center transition-colors"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        {/* Form */}
        <form onSubmit={handleSubmit} className="p-6 space-y-4">
          {error && (
            <div className="p-3 bg-rose-50 border border-rose-200 text-rose-700 rounded-lg text-xs font-medium">
              {error}
            </div>
          )}

          {/* Amount and Description */}
          <div className="grid grid-cols-1 sm:grid-cols-12 gap-3">
            <div className="sm:col-span-8">
              <label className="block text-xs font-semibold text-slate-700 mb-1">
                Descrição <span className="text-rose-500">*</span>
              </label>
              <input
                id="input-expense-description"
                type="text"
                required
                value={description}
                onChange={(e) => setDescription(e.target.value)}
                placeholder="Ex: Supermercado, Combustível, Farmácia"
                className="w-full px-3.5 py-2 rounded-lg border border-slate-300 text-slate-900 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500 transition-all placeholder:text-slate-400"
              />
            </div>

            <div className="sm:col-span-4">
              <label className="block text-xs font-semibold text-slate-700 mb-1">
                Valor (R$) <span className="text-rose-500">*</span>
              </label>
              <div className="relative">
                <span className="absolute left-3 top-2 text-slate-400 text-xs font-semibold">R$</span>
                <input
                  id="input-expense-amount"
                  type="number"
                  step="0.01"
                  min="0.01"
                  required
                  value={amount}
                  onChange={(e) => setAmount(e.target.value)}
                  placeholder="0,00"
                  className="w-full pl-8 pr-3 py-2 rounded-lg border border-slate-300 text-slate-900 text-sm font-semibold focus:outline-none focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500 transition-all placeholder:text-slate-400"
                />
              </div>
            </div>
          </div>

          {/* Date, Payment Method and Account / Card */}
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
            <div>
              <label className="block text-xs font-semibold text-slate-700 mb-1 flex items-center gap-1">
                <Calendar className="w-3.5 h-3.5 text-slate-500" />
                Data <span className="text-rose-500">*</span>
              </label>
              <input
                id="input-expense-date"
                type="date"
                required
                value={date}
                onChange={(e) => setDate(e.target.value)}
                className="w-full px-3 py-2 rounded-lg border border-slate-300 text-slate-900 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500 transition-all"
              />
            </div>

            <div>
              <label className="block text-xs font-semibold text-slate-700 mb-1 flex items-center gap-1">
                <CreditCard className="w-3.5 h-3.5 text-slate-500" />
                Forma de Pagamento
              </label>
              <select
                id="select-expense-payment-method"
                value={paymentMethod}
                onChange={(e) => setPaymentMethod(e.target.value as PaymentMethod)}
                className="w-full px-3 py-2 rounded-lg border border-slate-300 text-slate-900 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500 transition-all bg-white"
              >
                {Object.entries(PAYMENT_METHOD_LABELS).map(([key, label]) => (
                  <option key={key} value={key}>
                    {label}
                  </option>
                ))}
              </select>
            </div>

            <div>
              {paymentMethod === 'credit_card' ? (
                <div>
                  <label className="block text-xs font-semibold text-slate-700 mb-1 flex items-center gap-1">
                    <CreditCard className="w-3.5 h-3.5 text-indigo-600" />
                    Cartão de Crédito
                  </label>
                  <select
                    id="select-expense-card"
                    value={cardId}
                    onChange={(e) => setCardId(e.target.value)}
                    className="w-full px-3 py-2 rounded-lg border border-slate-300 text-slate-900 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500 transition-all bg-white"
                  >
                    {cards.map((c) => (
                      <option key={c.id} value={c.id}>
                        {c.name} ({c.brand.toUpperCase()})
                      </option>
                    ))}
                    {cards.length === 0 && (
                      <option value="">Nenhum cartão cadastrado</option>
                    )}
                  </select>
                </div>
              ) : (
                <div>
                  <label className="block text-xs font-semibold text-slate-700 mb-1 flex items-center gap-1">
                    <Wallet className="w-3.5 h-3.5 text-slate-500" />
                    Conta / Caixa
                  </label>
                  <select
                    id="select-expense-account"
                    value={accountId}
                    onChange={(e) => setAccountId(e.target.value)}
                    className="w-full px-3 py-2 rounded-lg border border-slate-300 text-slate-900 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500 transition-all bg-white"
                  >
                    {accounts.map((acc) => (
                      <option key={acc.id} value={acc.id}>
                        {acc.name}
                      </option>
                    ))}
                    {accounts.length === 0 && (
                      <option value="">Conta Padrão</option>
                    )}
                  </select>
                </div>
              )}
            </div>
          </div>

          {/* Favorecido / Fornecedor & Status do Pagamento */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            <div>
              <label className="block text-xs font-semibold text-slate-700 mb-1 flex items-center gap-1">
                <Users className="w-3.5 h-3.5 text-slate-500" />
                Favorecido / Fornecedor (Opcional)
              </label>
              <select
                id="select-expense-contact"
                value={contactId}
                onChange={(e) => setContactId(e.target.value)}
                className="w-full px-3 py-2 rounded-lg border border-slate-300 text-slate-900 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500 transition-all bg-white"
              >
                <option value="">Nenhum favorecido vinculado</option>
                {contacts.map((c) => (
                  <option key={c.id} value={c.id}>
                    {c.name}
                  </option>
                ))}
              </select>
            </div>

            <div>
              <label className="block text-xs font-semibold text-slate-700 mb-1 flex items-center gap-1">
                <Clock className="w-3.5 h-3.5 text-slate-500" />
                Situação do Pagamento
              </label>
              <div className="flex items-center gap-2">
                <button
                  type="button"
                  onClick={() => setStatus('paid')}
                  className={`flex-1 py-1.5 px-3 rounded-lg text-xs font-semibold border transition-all ${
                    status === 'paid'
                      ? 'border-emerald-500 bg-emerald-50 text-emerald-800 ring-1 ring-emerald-500'
                      : 'border-slate-200 bg-slate-50 text-slate-600 hover:bg-slate-100'
                  }`}
                >
                  ✓ Pago / Liquidado
                </button>
                <button
                  type="button"
                  onClick={() => setStatus('pending')}
                  className={`flex-1 py-1.5 px-3 rounded-lg text-xs font-semibold border transition-all ${
                    status === 'pending'
                      ? 'border-amber-500 bg-amber-50 text-amber-800 ring-1 ring-amber-500'
                      : 'border-slate-200 bg-slate-50 text-slate-600 hover:bg-slate-100'
                  }`}
                >
                  ⏳ A Pagar / Agendado
                </button>
              </div>
            </div>
          </div>

          {/* Installments Option */}
          <div className="p-3 bg-slate-50/80 rounded-xl border border-slate-200">
            <div className="flex items-center justify-between">
              <label className="flex items-center gap-2 text-xs font-semibold text-slate-700 cursor-pointer">
                <input
                  type="checkbox"
                  checked={isInstallment}
                  onChange={(e) => setIsInstallment(e.target.checked)}
                  className="rounded text-indigo-600 focus:ring-indigo-500 w-4 h-4"
                />
                Compra Parcelada / Cartão em Parcelas
              </label>
              {isInstallment && (
                <span className="text-[11px] font-bold text-indigo-600">
                  Parcela {currentInstallment} de {totalInstallments}
                </span>
              )}
            </div>

            {isInstallment && (
              <div className="grid grid-cols-2 gap-3 mt-2.5 pt-2 border-t border-slate-200">
                <div>
                  <label className="block text-[11px] text-slate-500 mb-1">Parcela Atual</label>
                  <input
                    type="number"
                    min="1"
                    value={currentInstallment}
                    onChange={(e) => setCurrentInstallment(e.target.value)}
                    className="w-full px-2.5 py-1.5 rounded-lg border border-slate-300 text-xs bg-white"
                  />
                </div>
                <div>
                  <label className="block text-[11px] text-slate-500 mb-1">Total de Parcelas</label>
                  <input
                    type="number"
                    min="2"
                    max="96"
                    value={totalInstallments}
                    onChange={(e) => setTotalInstallments(e.target.value)}
                    className="w-full px-2.5 py-1.5 rounded-lg border border-slate-300 text-xs bg-white"
                  />
                </div>
              </div>
            )}
          </div>

          {/* Category selection */}
          <div>
            <label className="block text-xs font-semibold text-slate-700 mb-1.5 flex items-center justify-between">
              <span className="flex items-center gap-1">
                <Tag className="w-3.5 h-3.5 text-slate-500" />
                Categoria <span className="text-rose-500">*</span>
              </span>
              <span className="text-[11px] text-slate-400 font-normal">Selecione uma opção</span>
            </label>

            <div className="grid grid-cols-2 sm:grid-cols-3 gap-2 max-h-44 overflow-y-auto p-1 border border-slate-200 rounded-lg bg-slate-50/50">
              {categories.map((cat) => {
                const isSelected = categoryId === cat.id;
                return (
                  <button
                    key={cat.id}
                    type="button"
                    onClick={() => setCategoryId(cat.id)}
                    className={`flex items-center gap-2 p-2 rounded-lg text-left text-xs font-medium transition-all ${
                      isSelected
                        ? 'bg-white shadow-xs border border-indigo-600 text-indigo-950 font-semibold ring-1 ring-indigo-600'
                        : 'bg-white hover:bg-slate-100 border border-slate-200 text-slate-700'
                    }`}
                  >
                    <div
                      className="w-5 h-5 rounded-md flex items-center justify-center text-white shrink-0"
                      style={{ backgroundColor: cat.color }}
                    >
                      <CategoryIcon name={cat.icon} className="w-3 h-3" />
                    </div>
                    <span className="truncate">{cat.name}</span>
                  </button>
                );
              })}
            </div>
          </div>

          {/* Notes (Optional) */}
          <div>
            <label className="block text-xs font-semibold text-slate-700 mb-1 flex items-center gap-1">
              <FileText className="w-3.5 h-3.5 text-slate-500" />
              Observações (Opcional)
            </label>
            <input
              id="input-expense-notes"
              type="text"
              value={notes}
              onChange={(e) => setNotes(e.target.value)}
              placeholder="Ex: Parcelado em 2x, compra com cashback..."
              className="w-full px-3 py-2 rounded-lg border border-slate-300 text-slate-800 text-xs focus:outline-none focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500 transition-all placeholder:text-slate-400"
            />
          </div>

          {/* Buttons */}
          <div className="pt-3 border-t border-slate-100 flex items-center justify-end gap-2.5">
            <button
              type="button"
              onClick={onClose}
              className="px-4 py-2 text-xs font-semibold text-slate-600 hover:text-slate-800 hover:bg-slate-100 rounded-lg transition-colors"
            >
              Cancelar
            </button>
            <button
              type="submit"
              id="btn-save-expense"
              className="px-5 py-2 bg-indigo-600 hover:bg-indigo-700 text-white text-xs font-bold rounded-lg shadow-xs transition-colors flex items-center gap-1.5"
            >
              <Check className="w-4 h-4" />
              {editingExpense ? 'Salvar Alterações' : 'Adicionar Despesa'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};
