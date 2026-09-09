import React, { useState, useEffect } from 'react';
import { X, Check, Calendar, ArrowDownLeft, Wallet, Tag, FileText, Users, Clock } from 'lucide-react';
import { Income, TreasuryAccount, ContactPerson, PaymentStatus } from '../types';
import { INCOME_CATEGORIES } from '../data/defaultTreasury';

interface IncomeFormModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSave: (incomeData: Omit<Income, 'id' | 'createdAt'>, incomeId?: string) => void;
  editingIncome?: Income | null;
  accounts: TreasuryAccount[];
  contacts?: ContactPerson[];
  defaultDate?: string;
}

export const IncomeFormModal: React.FC<IncomeFormModalProps> = ({
  isOpen,
  onClose,
  onSave,
  editingIncome,
  accounts,
  contacts = [],
  defaultDate,
}) => {
  const [description, setDescription] = useState('');
  const [amount, setAmount] = useState('');
  const [date, setDate] = useState('');
  const [accountId, setAccountId] = useState('');
  const [category, setCategory] = useState(INCOME_CATEGORIES[0]);
  const [contactId, setContactId] = useState('');
  const [status, setStatus] = useState<PaymentStatus>('paid');
  const [notes, setNotes] = useState('');
  const [error, setError] = useState('');

  useEffect(() => {
    if (editingIncome) {
      setDescription(editingIncome.description);
      setAmount(editingIncome.amount.toString());
      setDate(editingIncome.date);
      setAccountId(editingIncome.accountId);
      setCategory(editingIncome.category);
      setContactId(editingIncome.contactId || '');
      setStatus(editingIncome.status || 'paid');
      setNotes(editingIncome.notes || '');
    } else {
      const today = new Date().toISOString().split('T')[0];
      setDescription('');
      setAmount('');
      setDate(defaultDate || today);
      setAccountId(accounts[0]?.id || '');
      setCategory(INCOME_CATEGORIES[0]);
      setContactId('');
      setStatus('paid');
      setNotes('');
    }
    setError('');
  }, [editingIncome, isOpen, defaultDate, accounts]);

  if (!isOpen) return null;

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();

    const cleanDesc = description.trim();
    if (!cleanDesc) {
      setError('Por favor, informe a descrição da receita.');
      return;
    }

    const numAmount = parseFloat(amount.replace(',', '.'));
    if (isNaN(numAmount) || numAmount <= 0) {
      setError('Informe um valor válido maior que zero.');
      return;
    }

    if (!date) {
      setError('Informe a data de recebimento.');
      return;
    }

    if (!accountId) {
      setError('Selecione a conta de destino.');
      return;
    }

    onSave(
      {
        description: cleanDesc,
        amount: Math.round(numAmount * 100) / 100,
        date,
        accountId,
        category,
        contactId: contactId || undefined,
        status,
        notes: notes.trim() || undefined,
      },
      editingIncome ? editingIncome.id : undefined
    );
    onClose();
  };

  return (
    <div className="fixed inset-0 z-50 overflow-y-auto bg-slate-900/60 backdrop-blur-xs flex items-center justify-center p-4">
      <div
        id="modal-income-form"
        className="bg-white rounded-2xl max-w-lg w-full shadow-2xl border border-slate-200 overflow-hidden animate-in fade-in zoom-in-95 duration-200"
      >
        {/* Header */}
        <div className="flex items-center justify-between px-6 py-4 border-b border-slate-100 bg-emerald-50/50">
          <div className="flex items-center gap-2.5">
            <div className="w-8 h-8 rounded-lg bg-emerald-100 text-emerald-700 flex items-center justify-center font-semibold">
              <ArrowDownLeft className="w-4 h-4" />
            </div>
            <div>
              <h3 className="text-base font-bold text-slate-900">
                {editingIncome ? 'Editar Receita (Tesouraria)' : 'Nova Entrada / Receita'}
              </h3>
              <p className="text-xs text-slate-500">
                Crédito financeiro no caixa ou conta bancária
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

          {/* Description & Amount */}
          <div className="grid grid-cols-1 sm:grid-cols-12 gap-3">
            <div className="sm:col-span-8">
              <label className="block text-xs font-semibold text-slate-700 mb-1">
                Descrição da Receita <span className="text-rose-500">*</span>
              </label>
              <input
                id="input-income-description"
                type="text"
                required
                value={description}
                onChange={(e) => setDescription(e.target.value)}
                placeholder="Ex: Salário, Consultoria, Venda, Rendimento"
                className="w-full px-3.5 py-2 rounded-lg border border-slate-300 text-slate-900 text-sm focus:outline-none focus:ring-2 focus:ring-emerald-500/20 focus:border-emerald-500 transition-all placeholder:text-slate-400"
              />
            </div>

            <div className="sm:col-span-4">
              <label className="block text-xs font-semibold text-slate-700 mb-1">
                Valor (R$) <span className="text-rose-500">*</span>
              </label>
              <div className="relative">
                <span className="absolute left-3 top-2 text-slate-400 text-xs font-semibold">R$</span>
                <input
                  id="input-income-amount"
                  type="number"
                  step="0.01"
                  min="0.01"
                  required
                  value={amount}
                  onChange={(e) => setAmount(e.target.value)}
                  placeholder="0,00"
                  className="w-full pl-8 pr-3 py-2 rounded-lg border border-slate-300 text-slate-900 text-sm font-semibold focus:outline-none focus:ring-2 focus:ring-emerald-500/20 focus:border-emerald-500 transition-all placeholder:text-slate-400"
                />
              </div>
            </div>
          </div>

          {/* Date, Account & Category */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            <div>
              <label className="block text-xs font-semibold text-slate-700 mb-1 flex items-center gap-1">
                <Calendar className="w-3.5 h-3.5 text-slate-500" />
                Data de Entrada <span className="text-rose-500">*</span>
              </label>
              <input
                id="input-income-date"
                type="date"
                required
                value={date}
                onChange={(e) => setDate(e.target.value)}
                className="w-full px-3 py-2 rounded-lg border border-slate-300 text-slate-900 text-sm focus:outline-none focus:ring-2 focus:ring-emerald-500/20 focus:border-emerald-500 transition-all"
              />
            </div>

            <div>
              <label className="block text-xs font-semibold text-slate-700 mb-1 flex items-center gap-1">
                <Wallet className="w-3.5 h-3.5 text-slate-500" />
                Conta de Depósito <span className="text-rose-500">*</span>
              </label>
              <select
                id="select-income-account"
                value={accountId}
                onChange={(e) => setAccountId(e.target.value)}
                className="w-full px-3 py-2 rounded-lg border border-slate-300 text-slate-900 text-sm focus:outline-none focus:ring-2 focus:ring-emerald-500/20 focus:border-emerald-500 transition-all bg-white"
              >
                {accounts.map((acc) => (
                  <option key={acc.id} value={acc.id}>
                    {acc.name}
                  </option>
                ))}
              </select>
            </div>
          </div>

          {/* Category & Contact */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            <div>
              <label className="block text-xs font-semibold text-slate-700 mb-1 flex items-center gap-1">
                <Tag className="w-3.5 h-3.5 text-slate-500" />
                Categoria da Receita
              </label>
              <select
                id="select-income-category"
                value={category}
                onChange={(e) => setCategory(e.target.value)}
                className="w-full px-3 py-2 rounded-lg border border-slate-300 text-slate-900 text-sm focus:outline-none focus:ring-2 focus:ring-emerald-500/20 focus:border-emerald-500 transition-all bg-white"
              >
                {INCOME_CATEGORIES.map((cat) => (
                  <option key={cat} value={cat}>
                    {cat}
                  </option>
                ))}
              </select>
            </div>

            <div>
              <label className="block text-xs font-semibold text-slate-700 mb-1 flex items-center gap-1">
                <Users className="w-3.5 h-3.5 text-slate-500" />
                Fonte Pagadora / Cliente
              </label>
              <select
                id="select-income-contact"
                value={contactId}
                onChange={(e) => setContactId(e.target.value)}
                className="w-full px-3 py-2 rounded-lg border border-slate-300 text-slate-900 text-sm focus:outline-none focus:ring-2 focus:ring-emerald-500/20 focus:border-emerald-500 transition-all bg-white"
              >
                <option value="">Sem cliente específico</option>
                {contacts.map((c) => (
                  <option key={c.id} value={c.id}>
                    {c.name}
                  </option>
                ))}
              </select>
            </div>
          </div>

          {/* Status da Receita */}
          <div>
            <label className="block text-xs font-semibold text-slate-700 mb-1 flex items-center gap-1">
              <Clock className="w-3.5 h-3.5 text-slate-500" />
              Situação da Receita
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
                ✓ Já Recebido (Entrou no Caixa)
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
                ⏳ A Receber / Previsto
              </button>
            </div>
          </div>

          {/* Notes */}
          <div>
            <label className="block text-xs font-semibold text-slate-700 mb-1 flex items-center gap-1">
              <FileText className="w-3.5 h-3.5 text-slate-500" />
              Observações (Opcional)
            </label>
            <input
              id="input-income-notes"
              type="text"
              value={notes}
              onChange={(e) => setNotes(e.target.value)}
              placeholder="Ex: Pagamento referente ao contrato #12..."
              className="w-full px-3 py-2 rounded-lg border border-slate-300 text-slate-800 text-xs focus:outline-none focus:ring-2 focus:ring-emerald-500/20 focus:border-emerald-500 transition-all placeholder:text-slate-400"
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
              id="btn-save-income"
              className="px-5 py-2 bg-emerald-600 hover:bg-emerald-700 text-white text-xs font-bold rounded-lg shadow-xs transition-colors flex items-center gap-1.5"
            >
              <Check className="w-4 h-4" />
              {editingIncome ? 'Salvar Alterações' : 'Confirmar Entrada'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};
