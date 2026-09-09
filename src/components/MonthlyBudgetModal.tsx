import React, { useState, useEffect } from 'react';
import { X, Target, Check } from 'lucide-react';
import { formatCurrency, formatMonthYearLabel } from '../utils/formatters';

interface MonthlyBudgetModalProps {
  isOpen: boolean;
  onClose: () => void;
  yearMonth: string;
  currentBudget: number;
  onSaveBudget: (yearMonth: string, amount: number) => void;
}

export const MonthlyBudgetModal: React.FC<MonthlyBudgetModalProps> = ({
  isOpen,
  onClose,
  yearMonth,
  currentBudget,
  onSaveBudget,
}) => {
  const [budgetVal, setBudgetVal] = useState('');

  useEffect(() => {
    if (isOpen) {
      setBudgetVal(currentBudget > 0 ? currentBudget.toString() : '');
    }
  }, [isOpen, currentBudget]);

  if (!isOpen) return null;

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    const val = parseFloat(budgetVal.replace(',', '.'));
    onSaveBudget(yearMonth, !isNaN(val) && val >= 0 ? val : 0);
    onClose();
  };

  return (
    <div className="fixed inset-0 z-50 overflow-y-auto bg-slate-900/60 backdrop-blur-xs flex items-center justify-center p-4">
      <div
        id="modal-budget-config"
        className="bg-white rounded-2xl max-w-sm w-full shadow-2xl border border-slate-200 overflow-hidden animate-in fade-in zoom-in-95 duration-200"
      >
        <div className="flex items-center justify-between px-5 py-4 border-b border-slate-100 bg-slate-50/50">
          <div className="flex items-center gap-2">
            <div className="w-8 h-8 rounded-lg bg-amber-100 text-amber-700 flex items-center justify-center font-semibold">
              <Target className="w-4 h-4" />
            </div>
            <div>
              <h3 className="text-sm font-bold text-slate-900">Meta de Orçamento</h3>
              <p className="text-[11px] text-slate-500">{formatMonthYearLabel(yearMonth)}</p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="w-7 h-7 rounded-lg text-slate-400 hover:text-slate-700 hover:bg-slate-100 flex items-center justify-center transition-colors"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        <form onSubmit={handleSubmit} className="p-5 space-y-4">
          <div>
            <label className="block text-xs font-semibold text-slate-700 mb-1">
              Limite Máximo Desejado (R$)
            </label>
            <div className="relative">
              <span className="absolute left-3 top-2 text-slate-400 text-xs font-semibold">R$</span>
              <input
                id="input-monthly-budget-amount"
                type="number"
                step="10"
                min="0"
                value={budgetVal}
                onChange={(e) => setBudgetVal(e.target.value)}
                placeholder="Ex: 3500"
                className="w-full pl-8 pr-3 py-2 rounded-lg border border-slate-300 text-sm font-bold text-slate-900 focus:outline-none focus:ring-2 focus:ring-amber-500/20 focus:border-amber-500"
              />
            </div>
            <p className="text-[11px] text-slate-500 mt-1">
              Deixe em branco ou zero para desativar o alerta de orçamento deste mês.
            </p>
          </div>

          <div className="pt-2 flex items-center justify-end gap-2">
            <button
              type="button"
              onClick={onClose}
              className="px-3.5 py-1.5 text-xs font-semibold text-slate-600 hover:bg-slate-100 rounded-lg"
            >
              Cancelar
            </button>
            <button
              type="submit"
              id="btn-save-monthly-budget"
              className="px-4 py-1.5 bg-amber-600 hover:bg-amber-700 text-white rounded-lg text-xs font-bold shadow-xs transition-colors flex items-center gap-1.5"
            >
              <Check className="w-3.5 h-3.5" />
              Salvar Meta
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};
