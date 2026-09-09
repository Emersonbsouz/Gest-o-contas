import React, { useState, useEffect } from 'react';
import { X, CreditCard as CreditCardIcon, Calendar, DollarSign, Wallet, Shield } from 'lucide-react';
import { CreditCard, CardBrand, TreasuryAccount } from '../types';

interface CreditCardFormModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSave: (cardData: Omit<CreditCard, 'id'>, cardId?: string) => void;
  editingCard?: CreditCard | null;
  accounts: TreasuryAccount[];
}

const BRAND_OPTIONS: { value: CardBrand; label: string }[] = [
  { value: 'mastercard', label: 'Mastercard' },
  { value: 'visa', label: 'Visa' },
  { value: 'elo', label: 'Elo' },
  { value: 'amex', label: 'American Express' },
  { value: 'hipercard', label: 'Hipercard' },
  { value: 'other', label: 'Outra Bandeira' },
];

const COLOR_PRESETS = [
  '#820ad1', // Nubank purple
  '#ec7000', // Itaú orange
  '#cc092f', // Bradesco red
  '#003882', // Banco do Brasil blue
  '#008075', // Santander teal
  '#0f172a', // Slate black / Black card
  '#0284c7', // Sky blue
  '#059669', // Emerald
  '#e11d48', // Rose
];

export const CreditCardFormModal: React.FC<CreditCardFormModalProps> = ({
  isOpen,
  onClose,
  onSave,
  editingCard,
  accounts,
}) => {
  const [name, setName] = useState('');
  const [brand, setBrand] = useState<CardBrand>('mastercard');
  const [limit, setLimit] = useState('');
  const [closingDay, setClosingDay] = useState('25');
  const [dueDay, setDueDay] = useState('5');
  const [color, setColor] = useState('#820ad1');
  const [linkedAccountId, setLinkedAccountId] = useState('');
  const [notes, setNotes] = useState('');
  const [error, setError] = useState('');

  useEffect(() => {
    if (editingCard) {
      setName(editingCard.name);
      setBrand(editingCard.brand);
      setLimit(editingCard.limit.toString());
      setClosingDay(editingCard.closingDay.toString());
      setDueDay(editingCard.dueDay.toString());
      setColor(editingCard.color);
      setLinkedAccountId(editingCard.linkedAccountId || '');
      setNotes(editingCard.notes || '');
    } else {
      setName('');
      setBrand('mastercard');
      setLimit('5000');
      setClosingDay('25');
      setDueDay('5');
      setColor('#820ad1');
      setLinkedAccountId(accounts[0]?.id || '');
      setNotes('');
    }
    setError('');
  }, [editingCard, isOpen, accounts]);

  if (!isOpen) return null;

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!name.trim()) {
      setError('Por favor, informe o nome de identificação do cartão.');
      return;
    }

    const parsedLimit = parseFloat(limit.replace(',', '.'));
    if (isNaN(parsedLimit) || parsedLimit < 0) {
      setError('Informe um limite de crédito válido maior ou igual a zero.');
      return;
    }

    const cDay = parseInt(closingDay, 10);
    const dDay = parseInt(dueDay, 10);

    if (isNaN(cDay) || cDay < 1 || cDay > 31) {
      setError('O dia de fechamento deve ser entre 1 e 31.');
      return;
    }

    if (isNaN(dDay) || dDay < 1 || dDay > 31) {
      setError('O dia de vencimento deve ser entre 1 e 31.');
      return;
    }

    onSave(
      {
        name: name.trim(),
        brand,
        limit: parsedLimit,
        closingDay: cDay,
        dueDay: dDay,
        color,
        linkedAccountId: linkedAccountId || undefined,
        notes: notes.trim() || undefined,
      },
      editingCard?.id
    );

    onClose();
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-xs overflow-y-auto">
      <div className="bg-white rounded-2xl shadow-xl w-full max-w-md overflow-hidden border border-slate-200 animate-in fade-in zoom-in-95 duration-150">
        {/* Modal Header */}
        <div className="px-6 py-4 border-b border-slate-100 flex items-center justify-between bg-slate-50/50">
          <div className="flex items-center gap-2.5">
            <div
              className="w-9 h-9 rounded-xl flex items-center justify-center text-white shadow-2xs"
              style={{ backgroundColor: color }}
            >
              <CreditCardIcon className="w-5 h-5" />
            </div>
            <div>
              <h2 className="text-base font-bold text-slate-900">
                {editingCard ? 'Editar Cartão de Crédito' : 'Cadastrar Novo Cartão de Crédito'}
              </h2>
              <p className="text-xs text-slate-500">
                Configure limites, datas de fatura e conta vinculada
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

        {/* Modal Body */}
        <form onSubmit={handleSubmit} className="p-6 space-y-4">
          {error && (
            <div className="p-3 rounded-lg bg-rose-50 border border-rose-200 text-rose-700 text-xs font-medium">
              {error}
            </div>
          )}

          {/* Card Preview Card */}
          <div
            className="rounded-xl p-4 text-white shadow-md transition-all duration-300 relative overflow-hidden"
            style={{
              background: `linear-gradient(135deg, ${color}, ${color}dd 70%, #0f172a 120%)`,
            }}
          >
            <div className="flex justify-between items-start mb-4">
              <div>
                <p className="text-[10px] uppercase tracking-wider text-white/80 font-semibold">Cartão de Crédito</p>
                <h3 className="text-base font-bold tracking-wide mt-0.5">
                  {name.trim() || 'Nome do Cartão'}
                </h3>
              </div>
              <span className="text-xs font-bold uppercase px-2 py-0.5 rounded-md bg-white/20 backdrop-blur-xs">
                {brand}
              </span>
            </div>
            <div className="flex items-center justify-between text-xs pt-2 border-t border-white/20">
              <div>
                <span className="text-[10px] text-white/70 block">Limite Total</span>
                <span className="font-semibold">
                  R$ {limit ? parseFloat(limit.replace(',', '.') || '0').toLocaleString('pt-BR', { minimumFractionDigits: 2 }) : '0,00'}
                </span>
              </div>
              <div className="text-right">
                <span className="text-[10px] text-white/70 block">Fechamento / Vcto</span>
                <span className="font-semibold">Dia {closingDay} / Dia {dueDay}</span>
              </div>
            </div>
          </div>

          {/* Name & Brand */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            <div>
              <label className="block text-xs font-semibold text-slate-700 mb-1">
                Nome do Cartão *
              </label>
              <input
                type="text"
                value={name}
                onChange={(e) => setName(e.target.value)}
                placeholder="Ex: Nubank, XP Infinite"
                className="w-full px-3 py-2 rounded-lg border border-slate-300 text-slate-900 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500"
                required
              />
            </div>
            <div>
              <label className="block text-xs font-semibold text-slate-700 mb-1">
                Bandeira
              </label>
              <select
                value={brand}
                onChange={(e) => setBrand(e.target.value as CardBrand)}
                className="w-full px-3 py-2 rounded-lg border border-slate-300 text-slate-900 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500 bg-white"
              >
                {BRAND_OPTIONS.map((b) => (
                  <option key={b.value} value={b.value}>
                    {b.label}
                  </option>
                ))}
              </select>
            </div>
          </div>

          {/* Limit, Closing Day & Due Day */}
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
            <div>
              <label className="block text-xs font-semibold text-slate-700 mb-1">
                Limite Total (R$) *
              </label>
              <div className="relative">
                <span className="absolute left-3 top-2.5 text-xs text-slate-400 font-bold">R$</span>
                <input
                  type="text"
                  value={limit}
                  onChange={(e) => setLimit(e.target.value)}
                  placeholder="5000,00"
                  className="w-full pl-8 pr-3 py-2 rounded-lg border border-slate-300 text-slate-900 text-sm font-semibold focus:outline-none focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500"
                  required
                />
              </div>
            </div>
            <div>
              <label className="block text-xs font-semibold text-slate-700 mb-1">
                Dia Fechamento
              </label>
              <input
                type="number"
                min="1"
                max="31"
                value={closingDay}
                onChange={(e) => setClosingDay(e.target.value)}
                className="w-full px-3 py-2 rounded-lg border border-slate-300 text-slate-900 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500"
                required
              />
            </div>
            <div>
              <label className="block text-xs font-semibold text-slate-700 mb-1">
                Dia Vencimento
              </label>
              <input
                type="number"
                min="1"
                max="31"
                value={dueDay}
                onChange={(e) => setDueDay(e.target.value)}
                className="w-full px-3 py-2 rounded-lg border border-slate-300 text-slate-900 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500"
                required
              />
            </div>
          </div>

          {/* Linked Treasury Account */}
          <div>
            <label className="block text-xs font-semibold text-slate-700 mb-1 flex items-center gap-1">
              <Wallet className="w-3.5 h-3.5 text-slate-400" />
              Conta para Débito / Pagamento da Fatura
            </label>
            <select
              value={linkedAccountId}
              onChange={(e) => setLinkedAccountId(e.target.value)}
              className="w-full px-3 py-2 rounded-lg border border-slate-300 text-slate-900 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500 bg-white"
            >
              <option value="">Nenhuma conta vinculada</option>
              {accounts.map((acc) => (
                <option key={acc.id} value={acc.id}>
                  {acc.name} ({acc.bankName || 'Conta'})
                </option>
              ))}
            </select>
          </div>

          {/* Color Picker */}
          <div>
            <label className="block text-xs font-semibold text-slate-700 mb-1.5">
              Cor do Cartão
            </label>
            <div className="flex items-center gap-2 flex-wrap">
              {COLOR_PRESETS.map((c) => (
                <button
                  type="button"
                  key={c}
                  onClick={() => setColor(c)}
                  className={`w-7 h-7 rounded-full transition-transform ${
                    color === c ? 'ring-2 ring-offset-2 ring-indigo-600 scale-110' : 'hover:scale-105'
                  }`}
                  style={{ backgroundColor: c }}
                />
              ))}
              <input
                type="color"
                value={color}
                onChange={(e) => setColor(e.target.value)}
                className="w-7 h-7 rounded-full p-0 border-0 cursor-pointer overflow-hidden"
                title="Personalizar cor"
              />
            </div>
          </div>

          {/* Notes */}
          <div>
            <label className="block text-xs font-semibold text-slate-700 mb-1">
              Observações
            </label>
            <textarea
              value={notes}
              onChange={(e) => setNotes(e.target.value)}
              placeholder="Ex: Cartão corporativo, pontuação Livelo 2.5 pts..."
              rows={2}
              className="w-full px-3 py-2 rounded-lg border border-slate-300 text-slate-900 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500"
            />
          </div>

          {/* Footer Buttons */}
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
              className="px-5 py-2 text-xs font-bold text-white bg-indigo-600 hover:bg-indigo-700 rounded-lg shadow-xs transition-colors"
            >
              {editingCard ? 'Salvar Alterações' : 'Cadastrar Cartão'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};
