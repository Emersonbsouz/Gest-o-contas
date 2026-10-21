import React, {useState} from 'react';
import type {CostCenter,ContactPerson,Expense,Income} from '../types';
import {costCenterTotals} from '../utils/costCenterTotals';
import {formatCurrency} from '../utils/formatters';
import {RegistryTable} from './RegistryTable';
interface Props {centers:CostCenter[];contacts:ContactPerson[];incomes:Income[];expenses:Expense[];onCreate:()=>void;onEdit:(center:CostCenter)=>void;}
export function CostCenterRegistry({centers,contacts,incomes,expenses,onCreate,onEdit}:Props){
 const [search,setSearch]=useState('');
 return <div className="space-y-3"><label className="block text-xs font-semibold text-slate-600">Pesquisar centros de custo<input aria-label="Buscar centro de custo" value={search} onChange={e=>setSearch(e.target.value)} placeholder="Nome do centro de custo..." className="mt-1 w-full rounded-lg border border-slate-200 bg-white p-3 text-sm"/></label>
  <RegistryTable title="Centros de Custo" description="Departamentos, atividades e projetos. Totais previstos incluem lançamentos em aberto e excluem cancelados." items={centers.filter(center=>center.name.toLowerCase().includes(search.toLowerCase()))} onCreate={onCreate} createLabel="Novo Centro de Custo" createAriaLabel="Cadastrar centro de custo"
    columns={[{label:'Centro / Cliente',render:center=><><strong>{center.name}</strong><span className="block text-xs text-slate-500">{contacts.find(contact=>contact.id===center.clientId)?.name||'Sem cliente vinculado'}</span></>},{label:'Situação',render:center=>({active:'Ativo',completed:'Concluído',on_hold:'Suspenso'}[center.status])},{label:'Receitas',render:center=>formatCurrency(costCenterTotals(center.id,incomes,expenses).revenue)},{label:'Despesas',render:center=>formatCurrency(costCenterTotals(center.id,incomes,expenses).expense)},{label:'Saldo previsto',render:center=>formatCurrency(costCenterTotals(center.id,incomes,expenses).balance)}]}
    actions={[{label:'Editar',run:onEdit}]} />
 </div>;
}
