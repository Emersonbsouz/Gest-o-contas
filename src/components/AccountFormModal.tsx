import React, { useState, useEffect } from 'react';
import { X, Check, Landmark, DollarSign, Palette, ShieldCheck } from 'lucide-react';
import { TreasuryAccount, AccountType } from '../types';

interface AccountFormModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSave: (accountData: Omit<TreasuryAccount, 'id'>, accountId?: string) => void;
  editingAccount?: TreasuryAccount | null;
}

const ACCOUNT_TYPE_LABELS: Record<AccountType, { label: string; description: string }> = {
  checking: {
    label: 'Conta Corrente',
    description: 'Banco tradicional ou digital para transações do dia a dia',
  },
  cash: {
    label: 'Caixa Físico / Carteira',
    description: 'Dinheiro em espécie guardado em mãos ou cofre',
  },
  savings: {
    label: 'Poupança / Reserva',
    description: 'Reserva para emergências ou metas de médio prazo',
  },
  investment: {
    label: 'Investimentos & Aplicações',
    description: 'CDB, Tesouro Direto, Ações ou Fundos',
  },
};

const COLOR_PRESETS = [
  '#8b5cf6', // Violet
  '#3b82f6', // Blue
  '#0284c7', // Sky
  '#10b981', // Emerald
  '#14b8a6', // Teal
  '#f59e0b', // Amber
  '#ea580c', // Orange
  '#ec4899', // Pink
  '#64748b', // Slate
];

export const AccountFormModal: React.FC<AccountFormModalProps> = ({
  isOpen,
  onClose,
  onSave,
  editingAccount,
}) => {
  const [name, setName] = useState('');
  const [type, setType] = useState<AccountType>('checking');
  const [initialBalance, setInitialBalance] = useState('');
  const [bankName, setBankName] = useState('');
  const [accountNumber, setAccountNumber] = useState('');
  const [color, setColor] = useState(COLOR_PRESETS[0]);
  const [error, setError] = useState('');

  useEffect(() => {
    if (editingAccount) {
      setName(editingAccount.name);
      setType(editingAccount.type);
      setInitialBalance(editingAccount.initialBalance.toString());
      setBankName(editingAccount.bankName || '');
      setAccountNumber(editingAccount.accountNumber || '');
      setColor(editingAccount.color || COLOR_PRESETS[0]);
    } else {
      setName('');
      setType('checking');
      setInitialBalance('0');
      setBankName('');
      setAccountNumber('');
      setColor(COLOR_PRESETS[0]);
    }
    setError('');
  }, [editingAccount, isOpen]);

  if (!isOpen) return null;

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();

    const cleanName = name.trim();
    if (!cleanName) {
      setError('Informe o nome da conta ou caixa.');
      return;
    }

    const numBalance = parseFloat(initialBalance.replace(',', '.'));
    if (isNaN(numBalance)) {
      setError('Informe um valor de saldo inicial válido (pode ser 0).');
      return;
    }

    onSave(
      {
        name: cleanName,
        type,
        initialBalance: Math.round(numBalance * 100) / 100,
        color,
        bankName: bankName.trim() || undefined,
        accountNumber: accountNumber.trim() || undefined,
      },
      editingAccount ? editingAccount.id : undefined
    );
    onClose();
  };

  return (
    <div className="fixed inset-0 z-50 overflow-y-auto bg-slate-900/60 backdrop-blur-xs flex items-center justify-center p-4">
      <div
        id="modal-account-form"
        className="bg-white rounded-2xl max-w-lg w-full shadow-2xl border border-slate-200 overflow-hidden animate-in fade-in zoom-in-95 duration-200"
      >
        {/* Header */}
        <div className="flex items-center justify-between px-6 py-4 border-b border-slate-100 bg-slate-50">
          <div className="flex items-center gap-2.5">
            <div
              className="w-8 h-8 rounded-lg flex items-center justify-center text-white font-semibold"
              style={{ backgroundColor: color }}
            >
              <Landmark className="w-4 h-4" />
            </div>
            <div>
              <h3 className="text-base font-bold text-slate-900">
                {editingAccount ? 'Editar Conta / Caixa' : 'Nova Conta Bancária ou Caixa'}
              </h3>
              <p className="text-xs text-slate-500">
                Configuração de conta para controle da tesouraria
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

          {/* Account Name */}
          <div>
            <label className="block text-xs font-semibold text-slate-700 mb-1">
              Nome da Conta / Caixa <span className="text-rose-500">*</span>
            </label>
            <input
              id="input-account-name"
              type="text"
              required
              value={name}
              onChange={(e) => setName(e.target.value)}
              placeholder="Ex: Nubank, Banco do Brasil, Carteira de Dinheiro"
              className="w-full px-3.5 py-2 rounded-lg border border-slate-300 text-slate-900 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500 transition-all placeholder:text-slate-400"
            />
          </div>

          {/* Type */}
          <div>
            <label className="block text-xs font-semibold text-slate-700 mb-1.5">
              Tipo de Conta
            </label>
            <div className="grid grid-cols-2 gap-2">
              {(Object.keys(ACCOUNT_TYPE_LABELS) as AccountType[]).map((t) => (
                <button
                  type="button"
                  key={t}
                  onClick={() => setType(t)}
                  className={`p-2.5 text-left rounded-lg border text-xs transition-all ${
                    type === t
                      ? 'border-indigo-600 bg-indigo-50/50 text-indigo-900 font-semibold'
                      : 'border-slate-200 bg-white text-slate-700 hover:border-slate-300'
                  }`}
                >
                  <p className="font-medium">{ACCOUNT_TYPE_LABELS[t].label}</p>
                  <p className="text-[10px] text-slate-500 mt-0.5 leading-tight">
                    {ACCOUNT_TYPE_LABELS[t].description}
                  </p>
                </button>
              ))}
            </div>
          </div>

          {/* Initial Balance */}
          <div>
            <label className="block text-xs font-semibold text-slate-700 mb-1">
              Saldo Inicial de Abertura (R$) <span className="text-rose-500">*</span>
            </label>
            <div className="relative">
              <span className="absolute left-3 top-2 text-slate-400 text-xs font-semibold">R$</span>
              <input
                id="input-account-initial-balance"
                type="number"
                step="0.01"
                required
                value={initialBalance}
                onChange={(e) => setInitialBalance(e.target.value)}
                placeholder="0,00"
                className="w-full pl-8 pr-3 py-2 rounded-lg border border-slate-300 text-slate-900 text-sm font-semibold focus:outline-none focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500 transition-all"
              />
            </div>
            <p className="text-[11px] text-slate-500 mt-1">
              O saldo atual será calculado automaticamente somando receitas e subtraindo despesas desta conta.
            </p>
          </div>

          {/* Optional Bank and Details */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            <div>
              <label className="block text-xs font-semibold text-slate-700 mb-1">
                Instituição / Banco (Opcional)
              </label>
              <input
                id="input-account-bank"
                type="text"
                value={bankName}
                onChange={(e) => setBankName(e.target.value)}
                placeholder="Ex: Itaú, Santander, Caixa"
                className="w-full px-3 py-2 rounded-lg border border-slate-300 text-slate-900 text-xs focus:outline-none focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500 transition-all placeholder:text-slate-400"
              />
            </div>

            <div>
              <label className="block text-xs font-semibold text-slate-700 mb-1">
                Agência / Número (Opcional)
              </label>
              <input
                id="input-account-number"
                type="text"
                value={accountNumber}
                onChange={(e) => setAccountNumber(e.target.value)}
                placeholder="Ex: Ag 0001 • C/C 12345-6"
                className="w-full px-3 py-2 rounded-lg border border-slate-300 text-slate-900 text-xs focus:outline-none focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500 transition-all placeholder:text-slate-400"
              />
            </div>
          </div>

          {/* Color Selection */}
          <div>
            <label className="block text-xs font-semibold text-slate-700 mb-1.5 flex items-center gap-1">
              <Palette className="w-3.5 h-3.5 text-slate-500" />
              Cor de Identificação
            </label>
            <div className="flex items-center gap-2 flex-wrap">
              {COLOR_PRESETS.map((c) => (
                <button
                  type="button"
                  key={c}
                  onClick={() => setColor(c)}
                  className={`w-7 h-7 rounded-full transition-transform ${
                    color === c ? 'scale-110 ring-2 ring-offset-2 ring-slate-400' : 'hover:scale-105'
                  }`}
                  style={{ backgroundColor: c }}
                />
              ))}
            </div>
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
              id="btn-save-account"
              className="px-5 py-2 bg-indigo-600 hover:bg-indigo-700 text-white text-xs font-bold rounded-lg shadow-xs transition-colors flex items-center gap-1.5"
            >
              <Check className="w-4 h-4" />
              {editingAccount ? 'Salvar Alterações' : 'Criar Conta'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};
