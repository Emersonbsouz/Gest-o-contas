import React from 'react';
import {
  X,
  PlusCircle,
  CreditCard,
  Wallet,
  Users,
  Tag,
  RefreshCw,
  Target,
  ArrowDownLeft,
  ArrowUpRight,
  ArrowRightLeft,
} from 'lucide-react';

interface QuickRegisterModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSelectAction: (
    action:
      | 'expense'
      | 'income'
      | 'transfer'
      | 'account'
      | 'card'
      | 'contact'
      | 'category'
      | 'recurring'
      | 'goal'
  ) => void;
}

export const QuickRegisterModal: React.FC<QuickRegisterModalProps> = ({
  isOpen,
  onClose,
  onSelectAction,
}) => {
  if (!isOpen) return null;

  const handleSelect = (
    action:
      | 'expense'
      | 'income'
      | 'transfer'
      | 'account'
      | 'card'
      | 'contact'
      | 'category'
      | 'recurring'
      | 'goal'
  ) => {
    onClose();
    onSelectAction(action);
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-xs overflow-y-auto">
      <div className="bg-white rounded-2xl shadow-xl w-full max-w-xl overflow-hidden border border-slate-200 animate-in fade-in zoom-in-95 duration-150">
        {/* Header */}
        <div className="px-6 py-4 border-b border-slate-100 flex items-center justify-between bg-slate-50/50">
          <div className="flex items-center gap-2.5">
            <div className="w-9 h-9 rounded-xl bg-indigo-600 text-white flex items-center justify-center shadow-2xs">
              <PlusCircle className="w-5 h-5" />
            </div>
            <div>
              <h2 className="text-base font-bold text-slate-900">
                O que você deseja cadastrar?
              </h2>
              <p className="text-xs text-slate-500">
                Selecione o tipo de cadastro ou lançamento rápido
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

        {/* Action groups */}
        <div className="p-6 space-y-5">
          {/* Lançamentos Financeiros */}
          <div>
            <h3 className="text-[11px] font-bold uppercase tracking-wider text-slate-400 mb-2">
              Lançamentos & Movimentações
            </h3>
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-2.5">
              <button
                onClick={() => handleSelect('expense')}
                className="p-3 rounded-xl border border-rose-100 bg-rose-50/40 hover:bg-rose-50 hover:border-rose-300 text-left transition-all group"
              >
                <div className="w-8 h-8 rounded-lg bg-rose-500 text-white flex items-center justify-center mb-2 shadow-2xs group-hover:scale-105 transition-transform">
                  <ArrowUpRight className="w-4 h-4" />
                </div>
                <h4 className="text-xs font-bold text-rose-900">Nova Despesa</h4>
                <p className="text-[10px] text-slate-500 leading-tight mt-0.5">
                  Gastos diários, compras e pagamentos
                </p>
              </button>

              <button
                onClick={() => handleSelect('income')}
                className="p-3 rounded-xl border border-emerald-100 bg-emerald-50/40 hover:bg-emerald-50 hover:border-emerald-300 text-left transition-all group"
              >
                <div className="w-8 h-8 rounded-lg bg-emerald-600 text-white flex items-center justify-center mb-2 shadow-2xs group-hover:scale-105 transition-transform">
                  <ArrowDownLeft className="w-4 h-4" />
                </div>
                <h4 className="text-xs font-bold text-emerald-900">Nova Receita</h4>
                <p className="text-[10px] text-slate-500 leading-tight mt-0.5">
                  Salários, vendas e entradas de caixa
                </p>
              </button>

              <button
                onClick={() => handleSelect('transfer')}
                className="p-3 rounded-xl border border-sky-100 bg-sky-50/40 hover:bg-sky-50 hover:border-sky-300 text-left transition-all group"
              >
                <div className="w-8 h-8 rounded-lg bg-sky-600 text-white flex items-center justify-center mb-2 shadow-2xs group-hover:scale-105 transition-transform">
                  <ArrowRightLeft className="w-4 h-4" />
                </div>
                <h4 className="text-xs font-bold text-sky-900">Transferência</h4>
                <p className="text-[10px] text-slate-500 leading-tight mt-0.5">
                  Movimentar entre contas e caixas
                </p>
              </button>
            </div>
          </div>

          {/* Contas, Cartões & Contatos */}
          <div>
            <h3 className="text-[11px] font-bold uppercase tracking-wider text-slate-400 mb-2">
              Contas, Cartões & Favorecidos
            </h3>
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-2.5">
              <button
                onClick={() => handleSelect('account')}
                className="p-3 rounded-xl border border-slate-200 bg-white hover:bg-slate-50 hover:border-indigo-300 text-left transition-all group"
              >
                <div className="w-8 h-8 rounded-lg bg-indigo-600 text-white flex items-center justify-center mb-2 shadow-2xs group-hover:scale-105 transition-transform">
                  <Wallet className="w-4 h-4" />
                </div>
                <h4 className="text-xs font-bold text-slate-900">Conta / Caixa</h4>
                <p className="text-[10px] text-slate-500 leading-tight mt-0.5">
                  Conta corrente, caixa físico, poupança
                </p>
              </button>

              <button
                onClick={() => handleSelect('card')}
                className="p-3 rounded-xl border border-slate-200 bg-white hover:bg-slate-50 hover:border-indigo-300 text-left transition-all group"
              >
                <div className="w-8 h-8 rounded-lg bg-violet-600 text-white flex items-center justify-center mb-2 shadow-2xs group-hover:scale-105 transition-transform">
                  <CreditCard className="w-4 h-4" />
                </div>
                <h4 className="text-xs font-bold text-slate-900">Cartão de Crédito</h4>
                <p className="text-[10px] text-slate-500 leading-tight mt-0.5">
                  Limite, vencimento e fechamento
                </p>
              </button>

              <button
                onClick={() => handleSelect('contact')}
                className="p-3 rounded-xl border border-slate-200 bg-white hover:bg-slate-50 hover:border-indigo-300 text-left transition-all group"
              >
                <div className="w-8 h-8 rounded-lg bg-purple-600 text-white flex items-center justify-center mb-2 shadow-2xs group-hover:scale-105 transition-transform">
                  <Users className="w-4 h-4" />
                </div>
                <h4 className="text-xs font-bold text-slate-900">Favorecido / Fornecedor</h4>
                <p className="text-[10px] text-slate-500 leading-tight mt-0.5">
                  Lojas, prestadores, clientes, PIX
                </p>
              </button>
            </div>
          </div>

          {/* Planejamento, Categorias & Metas */}
          <div>
            <h3 className="text-[11px] font-bold uppercase tracking-wider text-slate-400 mb-2">
              Planejamento, Categorias & Metas
            </h3>
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-2.5">
              <button
                onClick={() => handleSelect('category')}
                className="p-3 rounded-xl border border-slate-200 bg-white hover:bg-slate-50 hover:border-indigo-300 text-left transition-all group"
              >
                <div className="w-8 h-8 rounded-lg bg-teal-600 text-white flex items-center justify-center mb-2 shadow-2xs group-hover:scale-105 transition-transform">
                  <Tag className="w-4 h-4" />
                </div>
                <h4 className="text-xs font-bold text-slate-900">Categoria</h4>
                <p className="text-[10px] text-slate-500 leading-tight mt-0.5">
                  Classificação e tetos de gastos
                </p>
              </button>

              <button
                onClick={() => handleSelect('recurring')}
                className="p-3 rounded-xl border border-slate-200 bg-white hover:bg-slate-50 hover:border-indigo-300 text-left transition-all group"
              >
                <div className="w-8 h-8 rounded-lg bg-amber-500 text-white flex items-center justify-center mb-2 shadow-2xs group-hover:scale-105 transition-transform">
                  <RefreshCw className="w-4 h-4" />
                </div>
                <h4 className="text-xs font-bold text-slate-900">Conta Recorrente</h4>
                <p className="text-[10px] text-slate-500 leading-tight mt-0.5">
                  Contas fixas, assinaturas e aluguel
                </p>
              </button>

              <button
                onClick={() => handleSelect('goal')}
                className="p-3 rounded-xl border border-slate-200 bg-white hover:bg-slate-50 hover:border-indigo-300 text-left transition-all group"
              >
                <div className="w-8 h-8 rounded-lg bg-emerald-600 text-white flex items-center justify-center mb-2 shadow-2xs group-hover:scale-105 transition-transform">
                  <Target className="w-4 h-4" />
                </div>
                <h4 className="text-xs font-bold text-slate-900">Meta Financeira</h4>
                <p className="text-[10px] text-slate-500 leading-tight mt-0.5">
                  Reservas, viagens, aquisições
                </p>
              </button>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};
