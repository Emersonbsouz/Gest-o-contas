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
  const [activeTab, setActiveTab] = useState<'expense' | 'income'>('expense');
  const [isCreating, setIsCreating] = useState(false);
  const [newCatName, setNewCatName] = useState('');
  const [newCatColor, setNewCatColor] = useState(PRESET_COLORS[0]);
  const [newCatIcon, setNewCatIcon] = useState(AVAILABLE_ICONS[0].name);
  const [newCatLimit, setNewCatLimit] = useState('');
  const [newCatParentId, setNewCatParentId] = useState('');
  const [error, setError] = useState('');

  if (!isOpen) return null;

  const filteredCategories = categories.filter((c) => c.type === activeTab);
  
  // Potential parents (only top-level categories)
  const potentialParents = filteredCategories.filter(c => !c.parentId);

  const handleCreateCategory = (e: React.FormEvent) => {
    e.preventDefault();
    const cleanName = newCatName.trim();
    if (!cleanName) {
      setError('Informe o nome da categoria.');
      return;
    }

    if (categories.some((c) => c.name.toLowerCase() === cleanName.toLowerCase() && c.type === activeTab && c.parentId === (newCatParentId || undefined))) {
      setError('Já existe uma categoria com este nome neste nível.');
      return;
    }

    const limit = newCatLimit ? parseFloat(newCatLimit) : undefined;

    onAddCategory({
      name: cleanName,
      color: newCatColor,
      icon: newCatIcon,
      type: activeTab,
      budgetLimit: activeTab === 'expense' && limit && limit > 0 ? limit : undefined,
      parentId: newCatParentId || undefined
    });

    setNewCatName('');
    setNewCatLimit('');
    setNewCatParentId('');
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
                Personalize categorias para classificar suas finanças
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

        {/* Tabs for Expense/Income */}
        <div className="flex border-b border-slate-100">
          <button
            onClick={() => { setActiveTab('expense'); setIsCreating(false); }}
            className={`flex-1 py-3 text-xs font-bold transition-all border-b-2 ${
              activeTab === 'expense'
                ? 'text-indigo-600 border-indigo-600 bg-indigo-50/30'
                : 'text-slate-500 border-transparent hover:text-slate-700'
            }`}
          >
            Categorias de Despesa
          </button>
          <button
            onClick={() => { setActiveTab('income'); setIsCreating(false); }}
            className={`flex-1 py-3 text-xs font-bold transition-all border-b-2 ${
              activeTab === 'income'
                ? 'text-emerald-600 border-emerald-600 bg-emerald-50/30'
                : 'text-slate-500 border-transparent hover:text-slate-700'
            }`}
          >
            Categorias de Receita
          </button>
        </div>

        <div className="p-6 space-y-4">
          {/* Create category toggle */}
          {!isCreating ? (
            <button
              onClick={() => setIsCreating(true)}
              className={`w-full py-2.5 px-4 border border-dashed rounded-xl text-xs font-semibold flex items-center justify-center gap-1.5 transition-colors ${
                activeTab === 'expense'
                  ? 'border-indigo-300 hover:border-indigo-500 text-indigo-600 bg-indigo-50/40'
                  : 'border-emerald-300 hover:border-emerald-500 text-emerald-600 bg-emerald-50/40'
              }`}
            >
              <Plus className="w-4 h-4" />
              Criar Nova Categoria de {activeTab === 'expense' ? 'Despesa' : 'Receita'}
            </button>
          ) : (
            <form onSubmit={handleCreateCategory} className={`p-4 border rounded-xl space-y-3 ${
              activeTab === 'expense' ? 'border-indigo-100 bg-indigo-50/30' : 'border-emerald-100 bg-emerald-50/30'
            }`}>
              <div className="flex items-center justify-between">
                <span className="text-xs font-bold text-slate-800">Nova Categoria ({activeTab === 'expense' ? 'Despesa' : 'Receita'})</span>
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
                <div className={activeTab === 'income' ? 'col-span-2' : ''}>
                  <label className="block text-[11px] font-semibold text-slate-600 mb-1">Nome</label>
                  <input
                    type="text"
                    required
                    value={newCatName}
                    onChange={(e) => setNewCatName(e.target.value)}
                    placeholder={activeTab === 'expense' ? "Ex: Alimentação" : "Ex: Vendas Online"}
                    className="w-full px-3 py-1.5 rounded-lg border border-slate-300 text-xs text-slate-900 bg-white focus:outline-none focus:ring-1 focus:ring-indigo-500"
                  />
                </div>
                {activeTab === 'expense' && (
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
                )}
              </div>

              <div>
                <label className="block text-[11px] font-semibold text-slate-600 mb-1">Hierarquia (Opcional)</label>
                <select
                  value={newCatParentId}
                  onChange={(e) => setNewCatParentId(e.target.value)}
                  className="w-full px-3 py-1.5 rounded-lg border border-slate-300 text-xs text-slate-900 bg-white focus:outline-none focus:ring-1 focus:ring-indigo-500"
                >
                  <option value="">Categoria Principal (Nível 1)</option>
                  {potentialParents.map(p => (
                    <option key={p.id} value={p.id}>Sub-categoria de: {p.name}</option>
                  ))}
                </select>
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
                          ? (activeTab === 'expense' ? 'bg-indigo-600 text-white' : 'bg-emerald-600 text-white')
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
                  className={`px-4 py-1.5 text-white rounded-lg text-xs font-semibold flex items-center gap-1 ${
                    activeTab === 'expense' ? 'bg-indigo-600 hover:bg-indigo-700' : 'bg-emerald-600 hover:bg-emerald-700'
                  }`}
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
              Categorias de {activeTab === 'expense' ? 'Despesa' : 'Receita'} Ativas ({filteredCategories.length})
            </h4>

            {potentialParents.map((parent) => (
              <React.Fragment key={parent.id}>
                {/* Parent Category */}
                <div
                  className="flex items-center justify-between p-2.5 rounded-xl border border-slate-200 bg-white hover:border-slate-300 transition-colors"
                >
                    <div>
                      <div className="flex items-center gap-2.5">
                        <div
                          className="w-7 h-7 rounded-lg flex items-center justify-center text-white shrink-0"
                          style={{ backgroundColor: parent.color }}
                        >
                          <CategoryIcon name={parent.icon} className="w-3.5 h-3.5" />
                        </div>
                        <div>
                          <span className="text-xs font-black text-slate-900">{parent.name}</span>
                        </div>
                      </div>
                      {activeTab === 'expense' && (
                        <div className="mt-2 flex items-center gap-2 pl-9">
                          <span className="text-[10px] text-slate-400 font-bold uppercase">Meta:</span>
                          <input
                            type="number"
                            defaultValue={parent.budgetLimit}
                            placeholder="Limite R$"
                            onBlur={(e) => {
                              const val = e.target.value ? parseFloat(e.target.value) : undefined;
                              if (val !== parent.budgetLimit) {
                                onUpdateCategoryBudget(parent.id, val);
                              }
                            }}
                            className="w-20 px-2 py-0.5 text-[10px] border border-slate-200 rounded focus:border-indigo-300 outline-none font-bold text-slate-700"
                          />
                        </div>
                      )}
                    </div>

                  <div className="flex items-center gap-1.5">
                    <button
                      onClick={() => {
                        if (
                          window.confirm(
                            `Excluir a categoria "${parent.name}"? Lançamentos existentes ficarão como "Outros".`
                          )
                        ) {
                          onDeleteCategory(parent.id);
                        }
                      }}
                      title="Excluir Categoria"
                      className="p-1.5 text-slate-400 hover:text-rose-600 hover:bg-rose-50 rounded-lg transition-colors"
                    >
                      <Trash2 className="w-3.5 h-3.5" />
                    </button>
                  </div>
                </div>

                {/* Subcategories */}
                {filteredCategories.filter(child => child.parentId === parent.id).map(child => (
                  <div
                    key={child.id}
                    className="ml-8 flex items-center justify-between p-2 rounded-xl border border-slate-100 bg-slate-50/50 hover:border-slate-200 transition-colors"
                  >
                    <div className="flex items-center gap-2.5">
                      <div className="w-1.5 h-1.5 rounded-full bg-slate-300 ml-1" />
                      <div
                        className="w-5 h-5 rounded flex items-center justify-center text-white shrink-0"
                        style={{ backgroundColor: child.color }}
                      >
                        <CategoryIcon name={child.icon} className="w-2.5 h-2.5" />
                      </div>
                      <span className="text-xs text-slate-700 font-medium">{child.name}</span>
                    </div>
                    <button
                      onClick={() => {
                        if (window.confirm(`Excluir a sub-categoria "${child.name}"?`)) {
                          onDeleteCategory(child.id);
                        }
                      }}
                      className="p-1 text-slate-400 hover:text-rose-600 rounded transition-colors"
                    >
                      <Trash2 className="w-3 h-3" />
                    </button>
                  </div>
                ))}
              </React.Fragment>
            ))}

            {filteredCategories.length === 0 && (
              <div className="text-center py-8">
                <Tag className="w-8 h-8 text-slate-200 mx-auto mb-2" />
                <p className="text-xs text-slate-400">Nenhuma categoria de {activeTab === 'expense' ? 'despesa' : 'receita'} personalizada.</p>
              </div>
            )}
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
