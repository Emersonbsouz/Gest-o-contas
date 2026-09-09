import React from 'react';
import { TrendingDown, TrendingUp, DollarSign, PieChart, Calendar, Target, AlertCircle, CheckCircle2 } from 'lucide-react';
import { Category } from '../types';
import { formatCurrency } from '../utils/formatters';
import { CategoryIcon } from './CategoryIcon';

interface ExpenseSummaryCardsProps {
  total: number;
  count: number;
  dailyAverage: number;
  deltaPercent: number | null;
  topCategory?: {
    category: Category;
    amount: number;
    percentage: number;
  };
  budgetLimit: number;
  onOpenBudgetModal: () => void;
}

export const ExpenseSummaryCards: React.FC<ExpenseSummaryCardsProps> = ({
  total,
  count,
  dailyAverage,
  deltaPercent,
  topCategory,
  budgetLimit,
  onOpenBudgetModal,
}) => {
  const budgetPercentage = budgetLimit > 0 ? (total / budgetLimit) * 100 : 0;
  const remainingBudget = budgetLimit > 0 ? budgetLimit - total : 0;
  const isBudgetExceeded = budgetLimit > 0 && total > budgetLimit;

  return (
    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
      {/* Total Gasto no Mês */}
      <div id="card-total-gasto" className="bg-white rounded-xl border border-slate-200 p-5 shadow-xs flex flex-col justify-between">
        <div>
          <div className="flex items-center justify-between text-slate-500 mb-2">
            <span className="text-xs font-semibold uppercase tracking-wider">Total no Mês</span>
            <div className="w-8 h-8 rounded-lg bg-emerald-50 text-emerald-600 flex items-center justify-center">
              <DollarSign className="w-4 h-4" />
            </div>
          </div>
          <div className="text-2xl font-bold text-slate-900 tracking-tight">
            {formatCurrency(total)}
          </div>
        </div>

        <div className="mt-3 pt-3 border-t border-slate-100 flex items-center text-xs">
          {deltaPercent !== null ? (
            <div
              className={`flex items-center gap-1 font-medium ${
                deltaPercent > 0 ? 'text-rose-600' : 'text-emerald-600'
              }`}
            >
              {deltaPercent > 0 ? (
                <>
                  <TrendingUp className="w-3.5 h-3.5" />
                  <span>+{deltaPercent.toFixed(1)}%</span>
                </>
              ) : (
                <>
                  <TrendingDown className="w-3.5 h-3.5" />
                  <span>{deltaPercent.toFixed(1)}%</span>
                </>
              )}
              <span className="text-slate-500 font-normal">vs mês anterior</span>
            </div>
          ) : (
            <span className="text-slate-400">Primeiro mês registrado</span>
          )}
        </div>
      </div>

      {/* Maior Categoria */}
      <div id="card-maior-categoria" className="bg-white rounded-xl border border-slate-200 p-5 shadow-xs flex flex-col justify-between">
        <div>
          <div className="flex items-center justify-between text-slate-500 mb-2">
            <span className="text-xs font-semibold uppercase tracking-wider">Maior Despesa</span>
            <div className="w-8 h-8 rounded-lg bg-indigo-50 text-indigo-600 flex items-center justify-center">
              <PieChart className="w-4 h-4" />
            </div>
          </div>
          {topCategory ? (
            <div>
              <div className="flex items-center gap-2 mb-1">
                <div
                  className="w-5 h-5 rounded-md flex items-center justify-center text-white"
                  style={{ backgroundColor: topCategory.category.color }}
                >
                  <CategoryIcon name={topCategory.category.icon} className="w-3 h-3" />
                </div>
                <span className="font-semibold text-slate-800 text-base truncate">
                  {topCategory.category.name}
                </span>
              </div>
              <div className="text-xl font-bold text-slate-900">
                {formatCurrency(topCategory.amount)}
              </div>
            </div>
          ) : (
            <div className="text-slate-400 text-sm py-1">Nenhum gasto neste mês</div>
          )}
        </div>

        <div className="mt-3 pt-3 border-t border-slate-100 flex items-center justify-between text-xs text-slate-500">
          {topCategory ? (
            <>
              <span>Representa do total</span>
              <span className="font-semibold text-slate-700">{topCategory.percentage.toFixed(1)}%</span>
            </>
          ) : (
            <span>Sem registros</span>
          )}
        </div>
      </div>

      {/* Média Diária & Qtd */}
      <div id="card-media-diaria" className="bg-white rounded-xl border border-slate-200 p-5 shadow-xs flex flex-col justify-between">
        <div>
          <div className="flex items-center justify-between text-slate-500 mb-2">
            <span className="text-xs font-semibold uppercase tracking-wider">Média Diária</span>
            <div className="w-8 h-8 rounded-lg bg-sky-50 text-sky-600 flex items-center justify-center">
              <Calendar className="w-4 h-4" />
            </div>
          </div>
          <div className="text-2xl font-bold text-slate-900 tracking-tight">
            {formatCurrency(dailyAverage)}
          </div>
        </div>

        <div className="mt-3 pt-3 border-t border-slate-100 flex items-center justify-between text-xs text-slate-500">
          <span>Lançamentos</span>
          <span className="font-semibold text-slate-700 bg-slate-100 px-2 py-0.5 rounded-full">
            {count} {count === 1 ? 'despesa' : 'despesas'}
          </span>
        </div>
      </div>

      {/* Orçamento Mensal */}
      <div id="card-meta-orcamento" className="bg-white rounded-xl border border-slate-200 p-5 shadow-xs flex flex-col justify-between">
        <div>
          <div className="flex items-center justify-between text-slate-500 mb-2">
            <span className="text-xs font-semibold uppercase tracking-wider">Limite Mensal</span>
            <button
              onClick={onOpenBudgetModal}
              title="Configurar Orçamento"
              className="w-8 h-8 rounded-lg bg-amber-50 text-amber-600 hover:bg-amber-100 transition-colors flex items-center justify-center"
            >
              <Target className="w-4 h-4" />
            </button>
          </div>

          {budgetLimit > 0 ? (
            <div>
              <div className="flex items-baseline justify-between">
                <span className="text-2xl font-bold text-slate-900">
                  {formatCurrency(budgetLimit)}
                </span>
                <span className={`text-xs font-semibold ${isBudgetExceeded ? 'text-rose-600' : 'text-slate-600'}`}>
                  {budgetPercentage.toFixed(0)}% usado
                </span>
              </div>

              {/* Progress bar */}
              <div className="w-full bg-slate-100 rounded-full h-2 mt-2 overflow-hidden">
                <div
                  className={`h-full rounded-full transition-all duration-500 ${
                    budgetPercentage > 100
                      ? 'bg-rose-500'
                      : budgetPercentage > 85
                      ? 'bg-amber-500'
                      : 'bg-emerald-500'
                  }`}
                  style={{ width: `${Math.min(100, budgetPercentage)}%` }}
                />
              </div>
            </div>
          ) : (
            <div className="py-1">
              <button
                onClick={onOpenBudgetModal}
                className="text-sm text-indigo-600 hover:text-indigo-700 font-medium hover:underline flex items-center gap-1"
              >
                + Definir limite de orçamento
              </button>
            </div>
          )}
        </div>

        <div className="mt-3 pt-3 border-t border-slate-100 flex items-center justify-between text-xs">
          {budgetLimit > 0 ? (
            isBudgetExceeded ? (
              <span className="text-rose-600 font-medium flex items-center gap-1">
                <AlertCircle className="w-3.5 h-3.5" />
                Ultrapassou em {formatCurrency(Math.abs(remainingBudget))}
              </span>
            ) : (
              <span className="text-slate-600 flex items-center gap-1">
                <CheckCircle2 className="w-3.5 h-3.5 text-emerald-600" />
                Resta: <strong className="text-slate-800">{formatCurrency(remainingBudget)}</strong>
              </span>
            )
          ) : (
            <span className="text-slate-400">Ajuda a controlar seus limites</span>
          )}
        </div>
      </div>
    </div>
  );
};
