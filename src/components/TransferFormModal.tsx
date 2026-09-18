import React, { useState, useEffect } from 'react';
import { X, Check, Calendar, ArrowRightLeft, DollarSign, FileText } from 'lucide-react';
import { AccountTransfer, TreasuryAccount } from '../types';

interface TransferFormModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSave: (transferData: Omit<AccountTransfer, 'id' | 'createdAt'>, transferId?: string) => void;
  editingTransfer?: AccountTransfer | null;
  accounts: TreasuryAccount[];
  defaultDate?: string;
  defaultFromAccountId?: string;
}

export const TransferFormModal: React.FC<TransferFormModalProps> = ({
  isOpen,
  onClose,
  onSave,
  editingTransfer,
  accounts = [],
  defaultDate,
  defaultFromAccountId,
}) => {
  const [fromAccountId, setFromAccountId] = useState('');
  const [toAccountId, setToAccountId] = useState('');
  const [amount, setAmount] = useState('');
  const [date, setDate] = useState('');
  const [description, setDescription] = useState('');
  const [error, setError] = useState('');

  useEffect(() => {
    if (editingTransfer) {
      setFromAccountId(editingTransfer.fromAccountId);
      setToAccountId(editingTransfer.toAccountId);
      setAmount(editingTransfer.amount.toString());
      setDate(editingTransfer.date);
      setDescription(editingTransfer.description || '');
    } else {
      const today = new Date().toISOString().split('T')[0];
      const from = defaultFromAccountId || accounts?.[0]?.id || '';
      const to = accounts?.find((a) => a.id !== from)?.id || accounts?.[1]?.id || '';
      setFromAccountId(from);
      setToAccountId(to);
      setAmount('');
      setDate(defaultDate || today);
      setDescription('');
    }
    setError('');
  }, [editingTransfer, isOpen, defaultDate, defaultFromAccountId, accounts]);

  if (!isOpen) return null;

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();

    if (!fromAccountId) {
      setError('Selecione a conta de origem.');
      return;
    }

    if (!toAccountId) {
      setError('Selecione a conta de destino.');
      return;
    }

    if (fromAccountId === toAccountId) {
      setError('A conta de origem e a conta de destino não podem ser iguais.');
      return;
    }

    const numAmount = parseFloat(amount.replace(',', '.'));
    if (isNaN(numAmount) || numAmount <= 0) {
      setError('Informe um valor de transferência válido maior que zero.');
      return;
    }

    if (!date) {
      setError('Informe a data da transferência.');
      return;
    }

    const cleanDesc = description.trim() || 'Transferência entre contas';

    onSave(
      {
        fromAccountId,
        toAccountId,
        amount: Math.round(numAmount * 100) / 100,
        date,
        description: cleanDesc,
      },
      editingTransfer ? editingTransfer.id : undefined
    );
    onClose();
  };

  return (
    <div className="fixed inset-0 z-50 overflow-y-auto bg-slate-900/60 backdrop-blur-xs flex items-center justify-center p-4">
      <div
        id="modal-transfer-form"
        className="bg-white rounded-2xl max-w-lg w-full shadow-2xl border border-slate-200 overflow-hidden animate-in fade-in zoom-in-95 duration-200"
      >
        {/* Header */}
        <div className="flex items-center justify-between px-6 py-4 border-b border-slate-100 bg-sky-50/50">
          <div className="flex items-center gap-2.5">
            <div className="w-8 h-8 rounded-lg bg-sky-100 text-sky-700 flex items-center justify-center font-semibold">
              <ArrowRightLeft className="w-4 h-4" />
            </div>
            <div>
              <h3 className="text-base font-bold text-slate-900">
                {editingTransfer ? 'Editar Transferência' : 'Transferência entre Contas / Caixas'}
              </h3>
              <p className="text-xs text-slate-500">
                Movimentação interna da tesouraria sem impacto no resultado mensal
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

          {/* From and To Accounts */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            <div>
              <label className="block text-xs font-semibold text-slate-700 mb-1">
                Conta de Origem (Sai de) <span className="text-rose-500">*</span>
              </label>
              <select
                id="select-transfer-from"
                value={fromAccountId}
                onChange={(e) => setFromAccountId(e.target.value)}
                className="w-full px-3 py-2 rounded-lg border border-slate-300 text-slate-900 text-sm focus:outline-none focus:ring-2 focus:ring-sky-500/20 focus:border-sky-500 transition-all bg-white"
              >
                {accounts.map((acc) => (
                  <option key={acc.id} value={acc.id} disabled={acc.id === toAccountId}>
                    {acc.name}
                  </option>
                ))}
              </select>
            </div>

            <div>
              <label className="block text-xs font-semibold text-slate-700 mb-1">
                Conta de Destino (Vai para) <span className="text-rose-500">*</span>
              </label>
              <select
                id="select-transfer-to"
                value={toAccountId}
                onChange={(e) => setToAccountId(e.target.value)}
                className="w-full px-3 py-2 rounded-lg border border-slate-300 text-slate-900 text-sm focus:outline-none focus:ring-2 focus:ring-sky-500/20 focus:border-sky-500 transition-all bg-white"
              >
                {accounts.map((acc) => (
                  <option key={acc.id} value={acc.id} disabled={acc.id === fromAccountId}>
                    {acc.name}
                  </option>
                ))}
              </select>
            </div>
          </div>

          {/* Amount & Date */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            <div>
              <label className="block text-xs font-semibold text-slate-700 mb-1">
                Valor da Transferência (R$) <span className="text-rose-500">*</span>
              </label>
              <div className="relative">
                <span className="absolute left-3 top-2 text-slate-400 text-xs font-semibold">R$</span>
                <input
                  id="input-transfer-amount"
                  type="number"
                  step="0.01"
                  min="0.01"
                  required
                  value={amount}
                  onChange={(e) => setAmount(e.target.value)}
                  placeholder="0,00"
                  className="w-full pl-8 pr-3 py-2 rounded-lg border border-slate-300 text-slate-900 text-sm font-semibold focus:outline-none focus:ring-2 focus:ring-sky-500/20 focus:border-sky-500 transition-all placeholder:text-slate-400"
                />
              </div>
            </div>

            <div>
              <label className="block text-xs font-semibold text-slate-700 mb-1 flex items-center gap-1">
                <Calendar className="w-3.5 h-3.5 text-slate-500" />
                Data da Operação <span className="text-rose-500">*</span>
              </label>
              <input
                id="input-transfer-date"
                type="date"
                required
                value={date}
                onChange={(e) => setDate(e.target.value)}
                className="w-full px-3 py-2 rounded-lg border border-slate-300 text-slate-900 text-sm focus:outline-none focus:ring-2 focus:ring-sky-500/20 focus:border-sky-500 transition-all"
              />
            </div>
          </div>

          {/* Description */}
          <div>
            <label className="block text-xs font-semibold text-slate-700 mb-1 flex items-center gap-1">
              <FileText className="w-3.5 h-3.5 text-slate-500" />
              Motivo / Descrição
            </label>
            <input
              id="input-transfer-description"
              type="text"
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              placeholder="Ex: Saque para carteira, Aporte na reserva de emergência"
              className="w-full px-3 py-2 rounded-lg border border-slate-300 text-slate-900 text-sm focus:outline-none focus:ring-2 focus:ring-sky-500/20 focus:border-sky-500 transition-all placeholder:text-slate-400"
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
              id="btn-save-transfer"
              className="px-5 py-2 bg-sky-600 hover:bg-sky-700 text-white text-xs font-bold rounded-lg shadow-xs transition-colors flex items-center gap-1.5"
            >
              <Check className="w-4 h-4" />
              {editingTransfer ? 'Salvar Alterações' : 'Realizar Transferência'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};
