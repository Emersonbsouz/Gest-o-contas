import React, { useState } from 'react';
import type { CostCenter, ContactPerson, Expense, Income } from '../types';
import { costCenterTotals } from '../utils/costCenterTotals';
import { formatCurrency } from '../utils/formatters';

interface Props {
  centers: CostCenter[];
  contacts: ContactPerson[];
  incomes: Income[];
  expenses: Expense[];
  onCreate: () => void;
  onEdit: (center: CostCenter) => void;
}

export function CostCenterRegistry({ centers, contacts, incomes, expenses, onCreate, onEdit }: Props) {
  const [search, setSearch] = useState('');
  return <section className="bg-white rounded-2xl border border-slate-200 p-5 space-y-4">
    <div className="flex flex-wrap justify-between gap-3">
      <div>
        <h3 className="text-lg font-bold text-slate-900">Centros de Custo</h3>
        <p className="text-sm text-slate-500">Organize receitas e despesas por departamento, atividade, obra ou projeto.</p>
        <p className="text-xs text-slate-500 mt-1">Totais de todos os lançamentos, incluindo valores a pagar e receber. Cancelados e rejeitados não entram nos totais.</p>
      </div>
      <button type="button" onClick={onCreate} className="bg-indigo-600 text-white px-4 py-2 rounded-xl text-sm font-bold">Cadastrar centro de custo</button>
    </div>
    <input aria-label="Buscar centro de custo" value={search} onChange={e => setSearch(e.target.value)}
      placeholder="Buscar centro de custo..." className="w-full rounded-lg border p-3 text-sm" />
    {centers.length === 0 && <p className="text-sm text-slate-500 py-4">Nenhum centro de custo cadastrado. Comece por Administrativo, Vendas ou um projeto.</p>}
    <div className="overflow-x-auto">
      <table className="w-full text-sm text-left">
        <thead><tr className="text-slate-500 border-b"><th className="p-2">Centro / Cliente</th><th className="p-2">Status</th><th className="p-2">Receitas</th><th className="p-2">Despesas</th><th className="p-2">Saldo previsto</th><th className="p-2">Ações</th></tr></thead>
        <tbody>{centers.filter(c => c.name.toLowerCase().includes(search.toLowerCase())).map(center => {
          const totals = costCenterTotals(center.id, incomes, expenses);
          return <tr key={center.id} className="border-b border-slate-100">
            <td className="p-2"><strong>{center.name}</strong><span className="block text-xs text-slate-500">{contacts.find(c => c.id === center.clientId)?.name || 'Sem cliente vinculado'}</span></td>
            <td className="p-2">{{active:'Ativo',completed:'Concluído',on_hold:'Suspenso'}[center.status]}</td>
            <td className="p-2 text-emerald-700">{formatCurrency(totals.revenue)}</td>
            <td className="p-2 text-rose-700">{formatCurrency(totals.expense)}</td>
            <td className="p-2 font-bold">{formatCurrency(totals.balance)}</td>
            <td className="p-2"><button type="button" onClick={() => onEdit(center)} aria-label={`Editar ${center.name}`} className="text-indigo-600 font-bold">Editar</button></td>
          </tr>;
        })}</tbody>
      </table>
    </div>
  </section>;
}
