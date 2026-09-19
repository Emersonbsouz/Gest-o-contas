import React, { useMemo } from 'react';
import { 
  DollarSign, 
  TrendingUp, 
  TrendingDown, 
  Briefcase, 
  Hammer,
  Plus,
  ArrowRight
} from 'lucide-react';
import { 
  Expense, 
  Income, 
  TreasuryAccount, 
  AccountTransfer,
  CostCenter,
  Proposal
} from '../types';
import { formatCurrency, formatDateBR } from '../utils/formatters';
import { calculateAccountBalances } from '../utils/treasuryHelpers';

interface DashboardViewProps {
  expenses: Expense[];
  incomes: Income[];
  accounts: TreasuryAccount[];
  transfers: AccountTransfer[];
  costCenters: CostCenter[];
  proposals: Proposal[];
  onAction: (type: any) => void;
  onViewChange: (view: string) => void;
}

export const DashboardView: React.FC<DashboardViewProps> = ({
  expenses,
  incomes,
  accounts,
  transfers,
  costCenters,
  proposals,
  onAction,
  onViewChange
}) => {
  const balances = useMemo(() => calculateAccountBalances(accounts, incomes, expenses, transfers), [accounts, incomes, expenses, transfers]);
  const totalBalance = Object.values(balances).reduce((acc, val) => acc + val, 0);

  const activeProjects = costCenters.filter(c => c.status === 'active').length;
  const pendingProposals = proposals.filter(p => p.status === 'draft' || p.status === 'sent').length;

  return (
    <div className="space-y-8 animate-in fade-in duration-500">
      {/* Welcome Header */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <h2 className="text-2xl font-bold text-slate-900">Dashboard Central</h2>
          <p className="text-slate-500 text-sm">Visão geral do seu escritório e obras.</p>
        </div>
        <div className="flex items-center gap-2">
          <button 
            onClick={() => onAction('expense')}
            className="flex items-center gap-2 px-4 py-2.5 bg-rose-600 hover:bg-rose-700 text-white rounded-xl text-sm font-bold shadow-lg shadow-rose-100 transition-all"
          >
            <Plus className="w-4 h-4" />
            Nova Despesa
          </button>
          <button 
            onClick={() => onAction('income')}
            className="flex items-center gap-2 px-4 py-2.5 bg-emerald-600 hover:bg-emerald-700 text-white rounded-xl text-sm font-bold shadow-lg shadow-emerald-100 transition-all"
          >
            <Plus className="w-4 h-4" />
            Nova Receita
          </button>
        </div>
      </div>

      {/* Hero Stats */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        <div className="bg-white p-6 rounded-3xl border border-slate-200 shadow-sm hover:shadow-md transition-shadow group">
          <div className="flex items-center justify-between mb-4">
            <div className="w-12 h-12 bg-indigo-50 rounded-2xl flex items-center justify-center text-indigo-600 group-hover:scale-110 transition-transform">
              <DollarSign className="w-6 h-6" />
            </div>
            <span className="text-[10px] font-bold text-indigo-600 bg-indigo-50 px-2 py-1 rounded-full uppercase tracking-wider">Saldo Global</span>
          </div>
          <h3 className="text-2xl font-black text-slate-900 tracking-tight">{formatCurrency(totalBalance)}</h3>
          <p className="text-slate-400 text-[11px] font-medium mt-1">Consolidação de {accounts.length} caixas</p>
        </div>

        <div className="bg-white p-6 rounded-3xl border border-slate-200 shadow-sm hover:shadow-md transition-shadow group">
          <div className="flex items-center justify-between mb-4">
            <div className="w-12 h-12 bg-emerald-50 rounded-2xl flex items-center justify-center text-emerald-600 group-hover:scale-110 transition-transform">
              <TrendingUp className="w-6 h-6" />
            </div>
            <span className="text-[10px] font-bold text-emerald-600 bg-emerald-50 px-2 py-1 rounded-full uppercase tracking-wider">Comercial</span>
          </div>
          <h3 className="text-2xl font-black text-slate-900 tracking-tight">{pendingProposals}</h3>
          <p className="text-slate-400 text-[11px] font-medium mt-1">Propostas aguardando retorno</p>
        </div>

        <div className="bg-white p-6 rounded-3xl border border-slate-200 shadow-sm hover:shadow-md transition-shadow group">
          <div className="flex items-center justify-between mb-4">
            <div className="w-12 h-12 bg-amber-50 rounded-2xl flex items-center justify-center text-amber-600 group-hover:scale-110 transition-transform">
              <Hammer className="w-6 h-6" />
            </div>
            <span className="text-[10px] font-bold text-amber-600 bg-amber-50 px-2 py-1 rounded-full uppercase tracking-wider">Obras</span>
          </div>
          <h3 className="text-2xl font-black text-slate-900 tracking-tight">{activeProjects}</h3>
          <p className="text-slate-400 text-[11px] font-medium mt-1">Centros de custo ativos</p>
        </div>

        <div className="bg-white p-6 rounded-3xl border border-slate-200 shadow-sm hover:shadow-md transition-shadow group">
          <div className="flex items-center justify-between mb-4">
            <div className="w-12 h-12 bg-rose-50 rounded-2xl flex items-center justify-center text-rose-600 group-hover:scale-110 transition-transform">
              <TrendingDown className="w-6 h-6" />
            </div>
            <span className="text-[10px] font-bold text-rose-600 bg-rose-50 px-2 py-1 rounded-full uppercase tracking-wider">Pagar</span>
          </div>
          <h3 className="text-2xl font-black text-slate-900 tracking-tight">
            {expenses.filter(e => e.status === 'pending').length}
          </h3>
          <p className="text-slate-400 text-[11px] font-medium mt-1">Contas vencendo em breve</p>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        {/* Main Content: Recent Activity */}
        <div className="lg:col-span-2 space-y-6">
          <div className="bg-white rounded-3xl border border-slate-200 shadow-sm overflow-hidden">
            <div className="p-6 border-b border-slate-100 flex items-center justify-between">
              <h3 className="font-bold text-slate-900">Caixas e Saldos</h3>
              <button 
                onClick={() => onViewChange('financeiro')}
                className="text-xs font-bold text-indigo-600 hover:text-indigo-700 flex items-center gap-1"
              >
                Ver todos <ArrowRight className="w-3 h-3" />
              </button>
            </div>
            <div className="divide-y divide-slate-50">
              {accounts.slice(0, 5).map(acc => (
                <div key={acc.id} className="p-4 flex items-center justify-between hover:bg-slate-50 transition-colors">
                  <div className="flex items-center gap-3">
                    <div className="w-10 h-10 rounded-xl flex items-center justify-center text-white" style={{ backgroundColor: acc.color }}>
                      {acc.name[0].toUpperCase()}
                    </div>
                    <div>
                      <p className="text-sm font-bold text-slate-800">{acc.name}</p>
                      <p className="text-[10px] text-slate-400 uppercase font-bold tracking-tight">{acc.type}</p>
                    </div>
                  </div>
                  <div className="text-right">
                    <p className={`text-sm font-black ${balances[acc.id] < 0 ? 'text-rose-600' : 'text-slate-900'}`}>
                      {formatCurrency(balances[acc.id])}
                    </p>
                  </div>
                </div>
              ))}
            </div>
          </div>

          <div className="bg-white rounded-3xl border border-slate-200 shadow-sm overflow-hidden">
            <div className="p-6 border-b border-slate-100 flex items-center justify-between">
              <h3 className="font-bold text-slate-900">Próximos Vencimentos</h3>
              <button 
                onClick={() => onViewChange('financeiro')}
                className="text-xs font-bold text-indigo-600 hover:text-indigo-700 flex items-center gap-1"
              >
                Ver fluxo completo <ArrowRight className="w-3 h-3" />
              </button>
            </div>
            <div className="divide-y divide-slate-50">
              {expenses
                .filter(e => e.status === 'pending')
                .sort((a, b) => a.date.localeCompare(b.date))
                .slice(0, 5)
                .map(exp => (
                  <div key={exp.id} className="p-4 flex items-center justify-between hover:bg-slate-50 transition-colors">
                    <div className="flex items-center gap-3">
                      <div className="w-10 h-10 rounded-xl bg-slate-50 flex flex-col items-center justify-center border border-slate-100">
                        <span className="text-[8px] font-bold text-slate-400 uppercase">{exp.date.split('-')[1]}</span>
                        <span className="text-sm font-black text-slate-700 leading-none">{exp.date.split('-')[2]}</span>
                      </div>
                      <div>
                        <p className="text-sm font-bold text-slate-800 truncate max-w-[200px]">{exp.description}</p>
                        <p className="text-[10px] text-rose-500 font-bold uppercase tracking-tight">Vence em {formatDateBR(exp.date)}</p>
                      </div>
                    </div>
                    <div className="text-right">
                      <p className="text-sm font-black text-rose-600">
                        {formatCurrency(exp.amount)}
                      </p>
                    </div>
                  </div>
                ))}
              {expenses.filter(e => e.status === 'pending').length === 0 && (
                <div className="p-8 text-center text-slate-400 text-sm italic">
                  Nenhuma conta pendente para os próximos dias.
                </div>
              )}
            </div>
          </div>
        </div>

        {/* Sidebar content: Shortcuts / Quick Stats */}
        <div className="space-y-6">
          <div className="bg-indigo-600 rounded-3xl p-6 text-white shadow-xl shadow-indigo-100">
            <div className="flex items-center gap-3 mb-6">
              <div className="w-10 h-10 bg-white/20 rounded-xl flex items-center justify-center">
                <Briefcase className="w-5 h-5" />
              </div>
              <h3 className="font-bold">Ações Rápidas</h3>
            </div>
            <div className="space-y-3">
              <button 
                onClick={() => onAction('proposal')}
                className="w-full py-3 px-4 bg-white/10 hover:bg-white/20 rounded-2xl text-sm font-bold text-left transition-colors flex items-center justify-between"
              >
                Criar Proposta Técnica <Plus className="w-4 h-4 opacity-60" />
              </button>
              <button 
                onClick={() => onAction('costCenter')}
                className="w-full py-3 px-4 bg-white/10 hover:bg-white/20 rounded-2xl text-sm font-bold text-left transition-colors flex items-center justify-between"
              >
                Abrir Nova Obra <Plus className="w-4 h-4 opacity-60" />
              </button>
              <button 
                onClick={() => onAction('transfer')}
                className="w-full py-3 px-4 bg-white/10 hover:bg-white/20 rounded-2xl text-sm font-bold text-left transition-colors flex items-center justify-between"
              >
                Transferência Interna <Plus className="w-4 h-4 opacity-60" />
              </button>
            </div>
          </div>

          <div className="bg-white rounded-3xl border border-slate-200 p-6">
            <h3 className="font-bold text-slate-900 mb-4">Metas do Escritório</h3>
            <div className="space-y-6">
              {/* This could be populated from goals state */}
              <div className="text-center py-4 text-slate-400 text-xs italic">
                Nenhuma meta definida. 
                <button 
                  onClick={() => onAction('goal')}
                  className="text-indigo-600 font-bold block mx-auto mt-2 hover:underline"
                >
                  Definir Meta +
                </button>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};
