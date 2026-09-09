import React, { useState } from 'react';
import { X, Plus, Trash2, Tag, Check, Palette } from 'lucide-react';
import { Category } from '../types';
import { AVAILABLE_ICONS, CategoryIcon } from './CategoryIcon';

interface CategoryManagerModalProps {
  isOpen: boolean;
  onClose: () => void;
  categories: Category[];
  onAddCategory: (category: Omit<Category, 'id'>) => void;
  onDeleteCategory: (categoryId: string) => void;
  onUpdateCategoryBudget: (categoryId: string, budgetLimit: number | undefined) => void;
}

const PRESET_COLORS = [
  '#f97316', // Orange
  '#ef4444', // Red
  '#ec4899', // Pink
  '#8b5cf6', // Violet
  '#6366f1', // Indigo
  '#3b82f6', // Blue
  '#0284c7', // Sky
  '#14b8a6', // Teal
  '#10b981', // Emerald
  '#84cc16', // Lime
  '#eab308', // Yellow
  '#64748b', // Slate
];

export const CategoryManagerModal: React.FC<CategoryManagerModalProps> = ({
  isOpen,
  onClose,
  categories,
  onAddCategory,
  onDeleteCategory,
  onUpdateCategoryBudget,
}) => {
  const [isCreating, setIsCreating] = useState(false);
  const [newCatName, setNewCatName] = useState('');
  const [newCatColor, setNewCatColor] = useState(PRESET_COLORS[0]);
  const [newCatIcon, setNewCatIcon] = useState(AVAILABLE_ICONS[0].name);
  const [newCatLimit, setNewCatLimit] = useState('');
  const [error, setError] = useState('');

  if (!isOpen) return null;

  const handleCreateCategory = (e: React.FormEvent) => {
    e.preventDefault();
    const cleanName = newCatName.trim();
    if (!cleanName) {
      setError('Informe o nome da categoria.');
      return;
    }

    if (categories.some((c) => c.name.toLowerCase() === cleanName.toLowerCase())) {
      setError('Já existe uma categoria com este nome.');
      return;
    }

    const limit = newCatLimit ? parseFloat(newCatLimit) : undefined;

    onAddCategory({
      name: cleanName,
      color: newCatColor,
      icon: newCatIcon,
      budgetLimit: limit && limit > 0 ? limit : undefined,
    });

    setNewCatName('');
    setNewCatLimit('');
    setIsCreating(false);
    setError('');
  };

  return (
    <div className="fixed inset-0 z-50 overflow-y-auto bg-slate-900/60 backdrop-blur-xs flex items-center justify-center p-4">
      <div
        id="modal-category-manager"
        className="bg-white rounded-2xl max-w-lg w-full shadow-2xl border border-slate-200 overflow-hidden animate-in fade-in zoom-in-95 duration-200"
      >
        {/* Header */}
        <div className="flex items-center justify-between px-6 py-4 border-b border-slate-100 bg-slate-50/50">
          <div className="flex items-center gap-2.5">
            <div className="w-8 h-8 rounded-lg bg-indigo-100 text-indigo-700 flex items-center justify-center font-semibold">
              <Tag className="w-4 h-4" />
            </div>
            <div>
              <h3 className="text-base font-bold text-slate-900">Gerenciar Categorias</h3>
              <p className="text-xs text-slate-500">
                Personalize categorias para classificar suas despesas
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

        <div className="p-6 space-y-4">
          {/* Create category toggle */}
          {!isCreating ? (
            <button
              onClick={() => setIsCreating(true)}
              className="w-full py-2.5 px-4 border border-dashed border-indigo-300 hover:border-indigo-500 rounded-xl text-indigo-600 hover:text-indigo-700 text-xs font-semibold flex items-center justify-center gap-1.5 transition-colors bg-indigo-50/40"
            >
              <Plus className="w-4 h-4" />
              Criar Nova Categoria Personalizada
            </button>
          ) : (
            <form onSubmit={handleCreateCategory} className="p-4 border border-indigo-100 rounded-xl bg-indigo-50/30 space-y-3">
              <div className="flex items-center justify-between">
                <span className="text-xs font-bold text-slate-800">Nova Categoria</span>
                <button
                  type="button"
                  onClick={() => setIsCreating(false)}
                  className="text-xs text-slate-400 hover:text-slate-600"
                >
                  Cancelar
                </button>
              </div>

              {error && (
                <div className="p-2 bg-rose-50 border border-rose-200 text-rose-700 rounded text-xs">
                  {error}
                </div>
              )}

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                <div>
                  <label className="block text-[11px] font-semibold text-slate-600 mb-1">Nome</label>
                  <input
                    type="text"
                    required
                    value={newCatName}
                    onChange={(e) => setNewCatName(e.target.value)}
                    placeholder="Ex: Assinaturas Digitais"
                    className="w-full px-3 py-1.5 rounded-lg border border-slate-300 text-xs text-slate-900 bg-white focus:outline-none focus:ring-1 focus:ring-indigo-500"
                  />
                </div>
                <div>
                  <label className="block text-[11px] font-semibold text-slate-600 mb-1">Limite Opcional (R$)</label>
                  <input
                    type="number"
                    value={newCatLimit}
                    onChange={(e) => setNewCatLimit(e.target.value)}
                    placeholder="Ex: 500"
                    className="w-full px-3 py-1.5 rounded-lg border border-slate-300 text-xs text-slate-900 bg-white focus:outline-none focus:ring-1 focus:ring-indigo-500"
                  />
                </div>
              </div>

              {/* Select Color */}
              <div>
                <label className="block text-[11px] font-semibold text-slate-600 mb-1 flex items-center gap-1">
                  <Palette className="w-3 h-3" /> Cor
                </label>
                <div className="flex flex-wrap gap-1.5">
                  {PRESET_COLORS.map((c) => (
                    <button
                      key={c}
                      type="button"
                      onClick={() => setNewCatColor(c)}
                      className={`w-6 h-6 rounded-full border-2 transition-transform ${
                        newCatColor === c ? 'scale-110 border-slate-900 ring-2 ring-indigo-300' : 'border-white'
                      }`}
                      style={{ backgroundColor: c }}
                    />
                  ))}
                </div>
              </div>

              {/* Select Icon */}
              <div>
                <label className="block text-[11px] font-semibold text-slate-600 mb-1">Ícone</label>
                <div className="flex flex-wrap gap-1.5 max-h-24 overflow-y-auto p-1 bg-white border border-slate-200 rounded-lg">
                  {AVAILABLE_ICONS.map((ico) => (
                    <button
                      key={ico.name}
                      type="button"
                      onClick={() => setNewCatIcon(ico.name)}
                      title={ico.label}
                      className={`w-7 h-7 rounded flex items-center justify-center transition-colors ${
                        newCatIcon === ico.name
                          ? 'bg-indigo-600 text-white'
                          : 'bg-slate-100 text-slate-700 hover:bg-slate-200'
                      }`}
                    >
                      <CategoryIcon name={ico.name} className="w-3.5 h-3.5" />
                    </button>
                  ))}
                </div>
              </div>

              <div className="pt-2 flex justify-end">
                <button
                  type="submit"
                  className="px-4 py-1.5 bg-indigo-600 text-white rounded-lg text-xs font-semibold hover:bg-indigo-700 flex items-center gap-1"
                >
                  <Check className="w-3.5 h-3.5" />
                  Salvar Categoria
                </button>
              </div>
            </form>
          )}

          {/* List of existing categories */}
          <div className="space-y-2 max-h-64 overflow-y-auto pr-1">
            <h4 className="text-xs font-bold text-slate-700 uppercase tracking-wider">
              Categorias Ativas ({categories.length})
            </h4>

            {categories.map((cat) => (
              <div
                key={cat.id}
                className="flex items-center justify-between p-2.5 rounded-xl border border-slate-200 bg-white hover:border-slate-300 transition-colors"
              >
                <div className="flex items-center gap-2.5">
                  <div
                    className="w-7 h-7 rounded-lg flex items-center justify-center text-white shrink-0"
                    style={{ backgroundColor: cat.color }}
                  >
                    <CategoryIcon name={cat.icon} className="w-3.5 h-3.5" />
                  </div>
                  <div>
                    <span className="text-xs font-bold text-slate-800">{cat.name}</span>
                    {cat.budgetLimit && (
                      <span className="block text-[10px] text-slate-500">
                        Limite: R$ {cat.budgetLimit.toFixed(2)}
                      </span>
                    )}
                  </div>
                </div>

                <div className="flex items-center gap-1.5">
                  {categories.length > 2 && (
                    <button
                      onClick={() => {
                        if (
                          window.confirm(
                            `Excluir a categoria "${cat.name}"? As despesas existentes ficarão como "Outros".`
                          )
                        ) {
                          onDeleteCategory(cat.id);
                        }
                      }}
                      title="Excluir Categoria"
                      className="p-1.5 text-slate-400 hover:text-rose-600 hover:bg-rose-50 rounded-lg transition-colors"
                    >
                      <Trash2 className="w-3.5 h-3.5" />
                    </button>
                  )}
                </div>
              </div>
            ))}
          </div>
        </div>

        <div className="px-6 py-3 bg-slate-50 border-t border-slate-100 flex justify-end">
          <button
            onClick={onClose}
            className="px-4 py-2 bg-slate-800 hover:bg-slate-900 text-white rounded-lg text-xs font-semibold transition-colors"
          >
            Concluir
          </button>
        </div>
      </div>
    </div>
  );
};
