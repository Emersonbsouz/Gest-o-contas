import React, { useState, useEffect } from 'react';
import { X, RefreshCw, Calendar, DollarSign, Wallet, CreditCard as CreditCardIcon, Users } from 'lucide-react';
import {
  RecurringBill,
  Category,
  TreasuryAccount,
  CreditCard,
  ContactPerson,
} from '../types';

interface RecurringBillFormModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSave: (billData: Omit<RecurringBill, 'id'>, billId?: string) => void;
  editingBill?: RecurringBill | null;
  categories?: Category[];
  accounts?: TreasuryAccount[];
  cards?: CreditCard[];
  contacts?: ContactPerson[];
}

export const RecurringBillFormModal: React.FC<RecurringBillFormModalProps> = ({
  isOpen,
  onClose,
  onSave,
  editingBill,
  categories = [],
  accounts = [],
  cards = [],
  contacts = [],
}) => {
  const [description, setDescription] = useState('');
  const [type, setType] = useState<'expense' | 'income'>('expense');
  const [amount, setAmount] = useState('');
  const [dueDay, setDueDay] = useState('10');
  const [categoryId, setCategoryId] = useState('');
  const [paymentSource, setPaymentSource] = useState<'account' | 'card'>('account');
  const [accountId, setAccountId] = useState('');
  const [cardId, setCardId] = useState('');
  const [contactId, setContactId] = useState('');
  const [active, setActive] = useState(true);
  const [notes, setNotes] = useState('');
  const [error, setError] = useState('');

  useEffect(() => {
    if (editingBill) {
      setDescription(editingBill.description);
      setType(editingBill.type);
      setAmount(editingBill.amount.toString());
      setDueDay(editingBill.dueDay.toString());
      setCategoryId(editingBill.categoryId);
      if (editingBill.cardId) {
        setPaymentSource('card');
        setCardId(editingBill.cardId);
      } else {
        setPaymentSource('account');
        setAccountId(editingBill.accountId || accounts?.[0]?.id || '');
      }
      setContactId(editingBill.contactId || '');
      setActive(editingBill.active);
      setNotes(editingBill.notes || '');
    } else {
      setDescription('');
      setType('expense');
      setAmount('');
      setDueDay('10');
      setCategoryId(categories?.[0]?.id || '');
      setPaymentSource('account');
      setAccountId(accounts?.[0]?.id || '');
      setCardId(cards?.[0]?.id || '');
      setContactId('');
      setActive(true);
      setNotes('');
    }
    setError('');
  }, [editingBill, isOpen, categories, accounts, cards]);

  if (!isOpen) return null;

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!description.trim()) {
      setError('Informe a descrição ou nome da conta fixa/recorrente.');
      return;
    }

    const parsedAmount = parseFloat(amount.replace(',', '.'));
    if (isNaN(parsedAmount) || parsedAmount <= 0) {
      setError('Informe um valor monetário válido maior que zero.');
      return;
    }

    const parsedDueDay = parseInt(dueDay, 10);
    if (isNaN(parsedDueDay) || parsedDueDay < 1 || parsedDueDay > 31) {
      setError('O dia de vencimento deve estar entre 1 e 31.');
      return;
    }

    onSave(
      {
        description: description.trim(),
        type,
        amount: parsedAmount,
        dueDay: parsedDueDay,
        categoryId: categoryId || categories[0]?.id || 'cat-outros',
        accountId: paymentSource === 'account' ? accountId || undefined : undefined,
        cardId: paymentSource === 'card' ? cardId || undefined : undefined,
        contactId: contactId || undefined,
        active,
        notes: notes.trim() || undefined,
      },
      editingBill?.id
    );

    onClose();
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-xs overflow-y-auto">
      <div className="bg-white rounded-2xl shadow-xl w-full max-w-md overflow-hidden border border-slate-200 animate-in fade-in zoom-in-95 duration-150">
        {/* Header */}
        <div className="px-6 py-4 border-b border-slate-100 flex items-center justify-between bg-slate-50/50">
          <div className="flex items-center gap-2.5">
            <div className="w-9 h-9 rounded-xl bg-amber-500 text-white flex items-center justify-center shadow-2xs">
              <RefreshCw className="w-5 h-5" />
            </div>
            <div>
              <h2 className="text-base font-bold text-slate-900">
                {editingBill ? 'Editar Conta Recorrente' : 'Cadastrar Conta Recorrente'}
              </h2>
              <p className="text-xs text-slate-500">
                Despesas e receitas mensais automáticas ou agendadas
              </p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-1.5 rounded-lg text-slate-400 hover:text-slate-600 hover:bg-slate-100 transition-colors"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        {/* Body */}
        <form onSubmit={handleSubmit} className="p-6 space-y-4">
          {error && (
            <div className="p-3 rounded-lg bg-rose-50 border border-rose-200 text-rose-700 text-xs font-medium">
              {error}
            </div>
          )}

          {/* Type Toggle: Despesa vs Receita */}
          <div className="flex items-center gap-2 p-1 bg-slate-100 rounded-xl">
            <button
              type="button"
              onClick={() => setType('expense')}
              className={`flex-1 py-1.5 rounded-lg text-xs font-bold transition-all ${
                type === 'expense'
                  ? 'bg-white text-rose-600 shadow-2xs ring-1 ring-slate-200'
                  : 'text-slate-600 hover:text-slate-900'
              }`}
            >
              Despesa Fixa / Mensal
            </button>
            <button
              type="button"
              onClick={() => setType('income')}
              className={`flex-1 py-1.5 rounded-lg text-xs font-bold transition-all ${
                type === 'income'
                  ? 'bg-white text-emerald-600 shadow-2xs ring-1 ring-slate-200'
                  : 'text-slate-600 hover:text-slate-900'
              }`}
            >
              Receita Fixa / Mensal
            </button>
          </div>

          {/* Description */}
          <div>
            <label className="block text-xs font-semibold text-slate-700 mb-1">
              Descrição da Conta *
            </label>
            <input
              type="text"
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              placeholder="Ex: Aluguel, Internet Fibra, Netflix, Salário Fixo"
              className="w-full px-3 py-2 rounded-lg border border-slate-300 text-slate-900 text-sm focus:outline-none focus:ring-2 focus:ring-amber-500/20 focus:border-amber-500"
              required
            />
          </div>

          {/* Amount & Due Day */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            <div>
              <label className="block text-xs font-semibold text-slate-700 mb-1">
                Valor Previsto (R$) *
              </label>
              <div className="relative">
                <span className="absolute left-3 top-2.5 text-xs text-slate-400 font-bold">R$</span>
                <input
                  type="text"
                  value={amount}
                  onChange={(e) => setAmount(e.target.value)}
                  placeholder="150,00"
                  className="w-full pl-8 pr-3 py-2 rounded-lg border border-slate-300 text-slate-900 text-sm font-semibold focus:outline-none focus:ring-2 focus:ring-amber-500/20 focus:border-amber-500"
                  required
                />
              </div>
            </div>
            <div>
              <label className="block text-xs font-semibold text-slate-700 mb-1 flex items-center gap-1">
                <Calendar className="w-3.5 h-3.5 text-slate-400" />
                Dia do Vencimento (1 a 31)
              </label>
              <input
                type="number"
                min="1"
                max="31"
                value={dueDay}
                onChange={(e) => setDueDay(e.target.value)}
                className="w-full px-3 py-2 rounded-lg border border-slate-300 text-slate-900 text-sm focus:outline-none focus:ring-2 focus:ring-amber-500/20 focus:border-amber-500"
                required
              />
            </div>
          </div>

          {/* Category */}
          <div>
            <label className="block text-xs font-semibold text-slate-700 mb-1">
              Categoria
            </label>
            <select
              value={categoryId}
              onChange={(e) => setCategoryId(e.target.value)}
              className="w-full px-3 py-2 rounded-lg border border-slate-300 text-slate-900 text-sm focus:outline-none focus:ring-2 focus:ring-amber-500/20 focus:border-amber-500 bg-white"
            >
              {categories.map((c) => (
                <option key={c.id} value={c.id}>
                  {c.name}
                </option>
              ))}
            </select>
          </div>

          {/* Payment Source: Account or Card (if expense) */}
          {type === 'expense' ? (
            <div className="space-y-2">
              <label className="block text-xs font-semibold text-slate-700">
                Forma / Meio de Pagamento Habitual
              </label>
              <div className="flex items-center gap-2 mb-2">
                <button
                  type="button"
                  onClick={() => setPaymentSource('account')}
                  className={`flex-1 py-1.5 px-3 rounded-lg text-xs font-medium border flex items-center justify-center gap-1.5 transition-all ${
                    paymentSource === 'account'
                      ? 'border-amber-500 bg-amber-50 text-amber-900 font-semibold'
                      : 'border-slate-200 bg-slate-50 text-slate-600'
                  }`}
                >
                  <Wallet className="w-3.5 h-3.5" />
                  Conta / Caixa
                </button>
                <button
                  type="button"
                  onClick={() => setPaymentSource('card')}
                  className={`flex-1 py-1.5 px-3 rounded-lg text-xs font-medium border flex items-center justify-center gap-1.5 transition-all ${
                    paymentSource === 'card'
                      ? 'border-amber-500 bg-amber-50 text-amber-900 font-semibold'
                      : 'border-slate-200 bg-slate-50 text-slate-600'
                  }`}
                >
                  <CreditCardIcon className="w-3.5 h-3.5" />
                  Cartão de Crédito
                </button>
              </div>

              {paymentSource === 'account' ? (
                <select
                  value={accountId}
                  onChange={(e) => setAccountId(e.target.value)}
                  className="w-full px-3 py-2 rounded-lg border border-slate-300 text-slate-900 text-sm focus:outline-none focus:ring-2 focus:ring-amber-500/20 focus:border-amber-500 bg-white"
                >
                  {accounts.map((a) => (
                    <option key={a.id} value={a.id}>
                      {a.name}
                    </option>
                  ))}
                </select>
              ) : (
                <select
                  value={cardId}
                  onChange={(e) => setCardId(e.target.value)}
                  className="w-full px-3 py-2 rounded-lg border border-slate-300 text-slate-900 text-sm focus:outline-none focus:ring-2 focus:ring-amber-500/20 focus:border-amber-500 bg-white"
                >
                  {cards.map((c) => (
                    <option key={c.id} value={c.id}>
                      {c.name} (Fecha dia {c.closingDay})
                    </option>
                  ))}
                  {cards.length === 0 && (
                    <option value="">Nenhum cartão cadastrado</option>
                  )}
                </select>
              )}
            </div>
          ) : (
            <div>
              <label className="block text-xs font-semibold text-slate-700 mb-1 flex items-center gap-1">
                <Wallet className="w-3.5 h-3.5 text-slate-400" />
                Conta de Depósito da Receita
              </label>
              <select
                value={accountId}
                onChange={(e) => setAccountId(e.target.value)}
                className="w-full px-3 py-2 rounded-lg border border-slate-300 text-slate-900 text-sm focus:outline-none focus:ring-2 focus:ring-amber-500/20 focus:border-amber-500 bg-white"
              >
                {accounts.map((a) => (
                  <option key={a.id} value={a.id}>
                    {a.name}
                  </option>
                ))}
              </select>
            </div>
          )}

          {/* Contact (Fornecedor / Favorecido / Cliente) */}
          <div>
            <label className="block text-xs font-semibold text-slate-700 mb-1 flex items-center gap-1">
              <Users className="w-3.5 h-3.5 text-slate-400" />
              Favorecido / Fornecedor Vinculado
            </label>
            <select
              value={contactId}
              onChange={(e) => setContactId(e.target.value)}
              className="w-full px-3 py-2 rounded-lg border border-slate-300 text-slate-900 text-sm focus:outline-none focus:ring-2 focus:ring-amber-500/20 focus:border-amber-500 bg-white"
            >
              <option value="">Nenhum contato vinculado</option>
              {contacts.map((c) => (
                <option key={c.id} value={c.id}>
                  {c.name}
                </option>
              ))}
            </select>
          </div>

          {/* Active switch */}
          <div className="flex items-center gap-2 pt-1">
            <input
              type="checkbox"
              id="recurrent-active-check"
              checked={active}
              onChange={(e) => setActive(e.target.checked)}
              className="w-4 h-4 rounded text-amber-600 focus:ring-amber-500 border-slate-300"
            />
            <label htmlFor="recurrent-active-check" className="text-xs font-medium text-slate-700">
              Manter esta conta recorrente ativa no sistema
            </label>
          </div>

          {/* Notes */}
          <div>
            <label className="block text-xs font-semibold text-slate-700 mb-1">
              Observações
            </label>
            <textarea
              value={notes}
              onChange={(e) => setNotes(e.target.value)}
              placeholder="Ex: Código do débito automático, instruções de pagamento..."
              rows={2}
              className="w-full px-3 py-2 rounded-lg border border-slate-300 text-slate-900 text-sm focus:outline-none focus:ring-2 focus:ring-amber-500/20 focus:border-amber-500"
            />
          </div>

          {/* Footer */}
          <div className="flex items-center justify-end gap-3 pt-4 border-t border-slate-100">
            <button
              type="button"
              onClick={onClose}
              className="px-4 py-2 text-xs font-semibold text-slate-700 hover:bg-slate-100 rounded-lg transition-colors"
            >
              Cancelar
            </button>
            <button
              type="submit"
              className="px-5 py-2 text-xs font-bold text-white bg-amber-600 hover:bg-amber-700 rounded-lg shadow-xs transition-colors"
            >
              {editingBill ? 'Salvar Alterações' : 'Cadastrar Conta Recorrente'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};
