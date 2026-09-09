import React, { useState, useEffect } from 'react';
import { X, Target, Calendar, DollarSign, Tag, TrendingUp } from 'lucide-react';
import { FinancialGoal } from '../types';

interface GoalFormModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSave: (goalData: Omit<FinancialGoal, 'id'>, goalId?: string) => void;
  editingGoal?: FinancialGoal | null;
}

const COLOR_PRESETS = [
  '#10b981', // Emerald
  '#0284c7', // Sky blue
  '#8b5cf6', // Violet
  '#f59e0b', // Amber
  '#ec4899', // Pink
  '#6366f1', // Indigo
  '#14b8a6', // Teal
];

export const GoalFormModal: React.FC<GoalFormModalProps> = ({
  isOpen,
  onClose,
  onSave,
  editingGoal,
}) => {
  const [title, setTitle] = useState('');
  const [targetAmount, setTargetAmount] = useState('');
  const [currentAmount, setCurrentAmount] = useState('');
  const [deadline, setDeadline] = useState('');
  const [color, setColor] = useState('#10b981');
  const [category, setCategory] = useState('');
  const [notes, setNotes] = useState('');
  const [error, setError] = useState('');

  useEffect(() => {
    if (editingGoal) {
      setTitle(editingGoal.title);
      setTargetAmount(editingGoal.targetAmount.toString());
      setCurrentAmount(editingGoal.currentAmount.toString());
      setDeadline(editingGoal.deadline || '');
      setColor(editingGoal.color);
      setCategory(editingGoal.category || '');
      setNotes(editingGoal.notes || '');
    } else {
      setTitle('');
      setTargetAmount('10000');
      setCurrentAmount('0');
      setDeadline('');
      setColor('#10b981');
      setCategory('Reserva');
      setNotes('');
    }
    setError('');
  }, [editingGoal, isOpen]);

  if (!isOpen) return null;

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!title.trim()) {
      setError('Por favor, dê um título para a meta financeira.');
      return;
    }

    const parsedTarget = parseFloat(targetAmount.replace(',', '.'));
    if (isNaN(parsedTarget) || parsedTarget <= 0) {
      setError('Informe um valor alvo válido maior que zero.');
      return;
    }

    const parsedCurrent = parseFloat((currentAmount || '0').replace(',', '.'));
    if (isNaN(parsedCurrent) || parsedCurrent < 0) {
      setError('Informe um valor atual válido.');
      return;
    }

    onSave(
      {
        title: title.trim(),
        targetAmount: parsedTarget,
        currentAmount: parsedCurrent,
        deadline: deadline || undefined,
        color,
        category: category.trim() || undefined,
        notes: notes.trim() || undefined,
      },
      editingGoal?.id
    );

    onClose();
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-xs overflow-y-auto">
      <div className="bg-white rounded-2xl shadow-xl w-full max-w-md overflow-hidden border border-slate-200 animate-in fade-in zoom-in-95 duration-150">
        {/* Header */}
        <div className="px-6 py-4 border-b border-slate-100 flex items-center justify-between bg-slate-50/50">
          <div className="flex items-center gap-2.5">
            <div
              className="w-9 h-9 rounded-xl flex items-center justify-center text-white shadow-2xs"
              style={{ backgroundColor: color }}
            >
              <Target className="w-5 h-5" />
            </div>
            <div>
              <h2 className="text-base font-bold text-slate-900">
                {editingGoal ? 'Editar Meta Financeira' : 'Cadastrar Nova Meta'}
              </h2>
              <p className="text-xs text-slate-500">
                Acompanhe o progresso de sonhos, reservas e aquisições
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

          {/* Title */}
          <div>
            <label className="block text-xs font-semibold text-slate-700 mb-1">
              Título da Meta / Sonho *
            </label>
            <input
              type="text"
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              placeholder="Ex: Reserva de Emergência, Viagem para a Europa, Carro Novo"
              className="w-full px-3 py-2 rounded-lg border border-slate-300 text-slate-900 text-sm focus:outline-none focus:ring-2 focus:ring-emerald-500/20 focus:border-emerald-500"
              required
            />
          </div>

          {/* Target and Current Amount */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            <div>
              <label className="block text-xs font-semibold text-slate-700 mb-1">
                Valor Alvo Desejado (R$) *
              </label>
              <div className="relative">
                <span className="absolute left-3 top-2.5 text-xs text-slate-400 font-bold">R$</span>
                <input
                  type="text"
                  value={targetAmount}
                  onChange={(e) => setTargetAmount(e.target.value)}
                  placeholder="10000,00"
                  className="w-full pl-8 pr-3 py-2 rounded-lg border border-slate-300 text-slate-900 text-sm font-semibold focus:outline-none focus:ring-2 focus:ring-emerald-500/20 focus:border-emerald-500"
                  required
                />
              </div>
            </div>
            <div>
              <label className="block text-xs font-semibold text-slate-700 mb-1">
                Valor Já Acumulado (R$)
              </label>
              <div className="relative">
                <span className="absolute left-3 top-2.5 text-xs text-slate-400 font-bold">R$</span>
                <input
                  type="text"
                  value={currentAmount}
                  onChange={(e) => setCurrentAmount(e.target.value)}
                  placeholder="0,00"
                  className="w-full pl-8 pr-3 py-2 rounded-lg border border-slate-300 text-slate-900 text-sm font-semibold focus:outline-none focus:ring-2 focus:ring-emerald-500/20 focus:border-emerald-500"
                />
              </div>
            </div>
          </div>

          {/* Category & Deadline */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            <div>
              <label className="block text-xs font-semibold text-slate-700 mb-1 flex items-center gap-1">
                <Tag className="w-3.5 h-3.5 text-slate-400" />
                Categoria / Classificação
              </label>
              <input
                type="text"
                value={category}
                onChange={(e) => setCategory(e.target.value)}
                placeholder="Ex: Segurança, Lazer, Estudos"
                className="w-full px-3 py-2 rounded-lg border border-slate-300 text-slate-900 text-sm focus:outline-none focus:ring-2 focus:ring-emerald-500/20 focus:border-emerald-500"
              />
            </div>
            <div>
              <label className="block text-xs font-semibold text-slate-700 mb-1 flex items-center gap-1">
                <Calendar className="w-3.5 h-3.5 text-slate-400" />
                Data Limite Desejada
              </label>
              <input
                type="date"
                value={deadline}
                onChange={(e) => setDeadline(e.target.value)}
                className="w-full px-3 py-2 rounded-lg border border-slate-300 text-slate-900 text-sm focus:outline-none focus:ring-2 focus:ring-emerald-500/20 focus:border-emerald-500 bg-white"
              />
            </div>
          </div>

          {/* Color Presets */}
          <div>
            <label className="block text-xs font-semibold text-slate-700 mb-1.5">
              Cor de Identificação
            </label>
            <div className="flex items-center gap-2 flex-wrap">
              {COLOR_PRESETS.map((c) => (
                <button
                  type="button"
                  key={c}
                  onClick={() => setColor(c)}
                  className={`w-7 h-7 rounded-full transition-transform ${
                    color === c ? 'ring-2 ring-offset-2 ring-emerald-600 scale-110' : 'hover:scale-105'
                  }`}
                  style={{ backgroundColor: c }}
                />
              ))}
              <input
                type="color"
                value={color}
                onChange={(e) => setColor(e.target.value)}
                className="w-7 h-7 rounded-full p-0 border-0 cursor-pointer overflow-hidden"
              />
            </div>
          </div>

          {/* Notes */}
          <div>
            <label className="block text-xs font-semibold text-slate-700 mb-1">
              Observações / Planejamento
            </label>
            <textarea
              value={notes}
              onChange={(e) => setNotes(e.target.value)}
              placeholder="Ex: Aportar R$ 500 todos os meses no Tesouro Selic..."
              rows={2}
              className="w-full px-3 py-2 rounded-lg border border-slate-300 text-slate-900 text-sm focus:outline-none focus:ring-2 focus:ring-emerald-500/20 focus:border-emerald-500"
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
              className="px-5 py-2 text-xs font-bold text-white bg-emerald-600 hover:bg-emerald-700 rounded-lg shadow-xs transition-colors"
            >
              {editingGoal ? 'Salvar Alterações' : 'Cadastrar Meta'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};
