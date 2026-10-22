import {isOpen} from '../utils/financialStatus';
import React, { useMemo, useState } from 'react';
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
  TreasuryGroup, 
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
  treasuries?: TreasuryGroup[];
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
  treasuries = [],
  transfers,
  costCenters,
  proposals,
  onAction,
  onViewChange
}) => {
  const balances = useMemo(() => calculateAccountBalances(accounts, incomes, expenses, transfers), [accounts, incomes, expenses, transfers]);
  const [selectedIds,setSelectedIds] = useState<string[] | null>(null);
  const visibleAccounts = accounts.filter(account => selectedIds === null || selectedIds.includes(account.id));
  const selectedSet = new Set(visibleAccounts.map(account=>account.id));
  const totalBalance = visibleAccounts.reduce((sum,account)=>sum+(balances[account.id]||0),0);
  const scopedExpenses = expenses.filter(expense=>selectedIds===null || selectedSet.has(expense.accountId || ''));
  const openExpenses = scopedExpenses.filter(expense=>isOpen(expense.status) && expense.status!=='draft');
  function toggleAccounts(ids:string[],checked:boolean){
    setSelectedIds(previous=>{const next=new Set(previous===null?accounts.map(account=>account.id):previous);ids.forEach(id=>{if(checked)next.add(id);else next.delete(id);});return [...next];});
  }


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

      <section aria-label="Filtros do dashboard" className="space-y-4 rounded-xl border border-slate-200 bg-white p-5">
        <div className="flex flex-wrap items-center justify-between gap-3"><div><h3 className="text-base font-semibold text-slate-900">Personalizar visão financeira</h3><p className="mt-1 text-sm text-slate-500">Marque vários caixas, contas ou tesourarias. Cada conta entra uma única vez no total.</p></div><div className="flex gap-2"><button type="button" onClick={()=>setSelectedIds(null)} className="rounded-lg border border-slate-200 px-3 py-2 text-xs font-semibold">Selecionar todos</button><button type="button" onClick={()=>setSelectedIds([])} className="rounded-lg border border-slate-200 px-3 py-2 text-xs font-semibold">Limpar seleção</button></div></div>
        <div className="grid gap-4 lg:grid-cols-2">
          <fieldset className="rounded-lg border border-slate-200 p-3"><legend className="px-1 text-sm font-semibold">Tesourarias</legend><div className="max-h-48 space-y-2 overflow-y-auto">{treasuries.map(treasury=>{
            const linked=accounts.filter(account=>account.treasuryId===treasury.id),selected=linked.filter(account=>selectedSet.has(account.id));
            const checked=linked.length>0&&selected.length===linked.length,mixed=selected.length>0&&!checked;
            return <label key={treasury.id} className="flex items-center justify-between gap-3 rounded-lg bg-slate-50 p-2 text-sm"><span className="flex items-center gap-2"><input type="checkbox" aria-label={'Selecionar tesouraria '+treasury.name} aria-checked={mixed?'mixed':checked} checked={checked} ref={input=>{if(input)input.indeterminate=mixed;}} disabled={!linked.length} onChange={e=>toggleAccounts(linked.map(account=>account.id),e.target.checked)}/><span>{treasury.name}<small className="block text-slate-500">{selected.length} de {linked.length} contas / caixas selecionados</small></span></span><b className="whitespace-nowrap">{formatCurrency(selected.reduce((sum,account)=>sum+(balances[account.id]||0),0))}</b></label>;
          })}{!treasuries.length&&<p className="text-sm text-slate-500">Nenhuma tesouraria cadastrada. Selecione diretamente os caixas e contas.</p>}</div></fieldset>
          <fieldset className="rounded-lg border border-slate-200 p-3"><legend className="px-1 text-sm font-semibold">Caixas, carteiras e contas</legend><div className="max-h-48 space-y-2 overflow-y-auto">{accounts.map(account=><label key={account.id} className="flex items-center justify-between gap-3 rounded-lg bg-slate-50 p-2 text-sm"><span className="flex items-center gap-2"><input type="checkbox" aria-label={'Selecionar conta '+account.name} checked={selectedSet.has(account.id)} onChange={e=>toggleAccounts([account.id],e.target.checked)}/><span>{account.name}<small className="block text-slate-500">{treasuries.find(t=>t.id===account.treasuryId)?.name||'Sem tesouraria vinculada'}</small></span></span><b className="whitespace-nowrap">{formatCurrency(balances[account.id]||0)}</b></label>)}{!accounts.length&&<p className="text-sm text-slate-500">Cadastre um caixa ou conta para personalizar a visão.</p>}</div></fieldset>
        </div>
        <p role="status" className="text-sm font-medium text-indigo-700">{visibleAccounts.length} de {accounts.length} contas / caixas na visão · Saldo selecionado: {formatCurrency(totalBalance)}</p>
        {!visibleAccounts.length&&<p className="rounded-lg bg-amber-50 p-3 text-sm text-amber-800">Nenhum caixa ou conta selecionado. Marque os itens que deseja acompanhar.</p>}
        <p className="text-xs text-slate-500">A seleção filtra saldos e contas a pagar. Comercial e projetos mantêm a visão geral da empresa. Lançamentos sem conta vinculada aparecem somente na visão geral.</p>
      </section>

      {/* Hero Stats */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        <div className="bg-white p-6 rounded-3xl border border-slate-200 shadow-sm hover:shadow-md transition-shadow group">
          <div className="flex items-center justify-between mb-4">
            <div className="w-12 h-12 bg-indigo-50 rounded-2xl flex items-center justify-center text-indigo-600 group-hover:scale-110 transition-transform">
              <DollarSign className="w-6 h-6" />
            </div>
            <span className="text-[10px] font-bold text-indigo-600 bg-indigo-50 px-2 py-1 rounded-full uppercase tracking-wider">{selectedIds===null?'Saldo Global':'Saldo Selecionado'}</span>
          </div>
          <h3 className="text-2xl font-black text-slate-900 tracking-tight">{formatCurrency(totalBalance)}</h3>
          <p className="text-slate-400 text-[11px] font-medium mt-1">Consolidação de {visibleAccounts.length} contas / caixas</p>
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
            {openExpenses.length}
          </h3>
          <p className="text-slate-400 text-[11px] font-medium mt-1">Contas em aberto na visão</p>
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
              {visibleAccounts.map(acc => (
                <div key={acc.id} className="p-4 flex items-center justify-between hover:bg-slate-50 transition-colors">
                  <div className="flex items-center gap-3">
                    <div className="w-10 h-10 rounded-xl flex items-center justify-center text-white" style={{ backgroundColor: acc.color }}>
                      {acc.name[0].toUpperCase()}
                    </div>
                    <div>
                      <p className="text-sm font-bold text-slate-800">{acc.name}</p>
                      <p className="text-[10px] text-slate-400 uppercase font-bold tracking-tight">{treasuries.find(t=>t.id===acc.treasuryId)?.name || ({cash:'Caixa / Carteira',checking:'Conta corrente',savings:'Poupança',investment:'Investimento'}[acc.type])}</p>
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
              {openExpenses
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
              {openExpenses.length === 0 && (
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
