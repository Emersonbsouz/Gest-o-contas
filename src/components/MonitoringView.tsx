
import React, {useState} from 'react';
import type {CreditCard,Expense,Income,RecurringBill,TreasuryAccount,AccountTransfer,CardInvoicePayment,CardPaymentSelection,ContactPerson,FinancialGoal,CostCenter,TreasuryGroup,Equipment,Category} from '../types';
import {CardInvoicePanel} from './CardInvoicePanel';
import {getCardSummary} from '../utils/cardSummary';
import {calculateAccountBalances} from '../utils/treasuryHelpers';
import {formatCurrency,formatDateBR} from '../utils/formatters';
import {isOpen} from '../utils/financialStatus';
interface Props {
 cards:CreditCard[];expenses:Expense[];incomes:Income[];recurring:RecurringBill[];accounts:TreasuryAccount[];transfers:AccountTransfer[];payments:CardInvoicePayment[];
 treasuries?:TreasuryGroup[];equipment?:Equipment[];categories?:Category[];
 contacts:ContactPerson[];goals:FinancialGoal[];costCenters:CostCenter[];month:string;
 onCancelPayment?:(id:string)=>Promise<void>;
 onUpdatePayment?:(id:string,patch:{amount:number;accountId:string;paymentDate:string})=>Promise<void>;
 onPay:(card:string,due:string,account:string,date:string,selection?:CardPaymentSelection)=>Promise<void>;
 onTrigger:(bill:RecurringBill)=>void;onUpdateGoal:(id:string,amount:number)=>void;canEdit:boolean;
}
export function MonitoringView(p:Props) {
 const [tab,setTab]=useState('cards');
 const balances=calculateAccountBalances(p.accounts,p.incomes,p.expenses,p.transfers);
 const tabs=[['cards','Cartões e faturas'],['recurring','Assinaturas e recorrências'],['accounts','Contas e caixas'],['contacts','Clientes e fornecedores'],['goals','Metas'],['projects','Centros de custo'],['treasuries','Tesourarias'],['equipment','Patrimônio'],['categories','Categorias']];
 return <section className="space-y-5">
 <div><h2 className="text-2xl font-bold">Acompanhamento</h2><p className="text-slate-500">Saldos, cobranças e evolução dos itens cadastrados.</p></div>
 <nav aria-label="Áreas de acompanhamento" className="flex gap-2 flex-wrap">{tabs.map(([id,label])=><button key={id} aria-pressed={tab===id} onClick={()=>setTab(id)} className={'px-4 py-2 rounded-lg border text-sm font-bold '+(tab===id?'bg-indigo-600 text-white':'bg-white')}>{label}</button>)}</nav>
 {tab==='cards' && <div className="grid gap-4 lg:grid-cols-2">{p.cards.map(card=>{
 const s=getCardSummary(card.id,p.expenses,p.recurring);
 return <article key={card.id} className="rounded-xl bg-white border p-5 space-y-4"><h3 className="text-lg font-bold">{card.name}</h3><div className="grid grid-cols-3 gap-2 text-xs"><div>Limite total<strong className="block">{formatCurrency(card.limit)}</strong></div><div>Utilizado<strong className="block text-rose-700">{formatCurrency(s.outstanding)}</strong></div><div>Disponível<strong className="block text-emerald-700">{formatCurrency(Math.max(0,card.limit-s.outstanding))}</strong></div></div><p className="text-xs">Fechamento dia {card.closingDay} · Vencimento dia {card.dueDay} · Assinaturas ativas: {formatCurrency(s.monthlySubscriptions)}/mês</p><CardInvoicePanel onCancelPayment={p.canEdit?p.onCancelPayment:undefined} onUpdatePayment={p.canEdit?p.onUpdatePayment:undefined} card={card} expenses={p.expenses} accounts={p.accounts} payments={p.payments} onPay={p.canEdit?p.onPay:undefined}/></article>;
 })}{p.cards.length===0 && <p>Cadastre um cartão em Cadastros para acompanhar suas faturas.</p>}</div>}
 {tab==='recurring' && <div className="grid gap-3 md:grid-cols-2">{p.recurring.map(b=>{
 const launched=p.expenses.some(e=>e.recurringBillId===b.id && e.recurringMonth===p.month && !['cancelled','CANCELADO','rejected'].includes(e.status||''));
 return <article key={b.id} className="p-4 rounded-xl border bg-white space-y-2"><h3 className="font-bold">{b.description}</h3><p>{formatCurrency(b.amount)}/mês · Dia {b.dueDay} · {b.active?'Ativa':'Inativa'}</p><p className="text-xs">{p.cards.find(c=>c.id===b.cardId)?.name || p.accounts.find(a=>a.id===b.accountId)?.name || 'Sem vínculo'}</p>{p.canEdit && <button disabled={!b.active||launched} onClick={()=>p.onTrigger(b)} className="p-2 rounded bg-indigo-50 text-indigo-700 font-bold disabled:opacity-50">{launched?'Já lançado em '+p.month:'Lançar no mês '+p.month}</button>}</article>;
 })}{p.recurring.length===0 && <p>Nenhuma assinatura ou recorrência cadastrada.</p>}</div>}
 {tab==='accounts' && <div className="grid gap-3 md:grid-cols-3">{p.accounts.map(a=><article key={a.id} className="p-4 border rounded-xl bg-white"><h3 className="font-bold">{a.name}</h3><p>Saldo atual: {formatCurrency(balances[a.id]||0)}</p></article>)}</div>}
 {tab==='contacts' && <div className="space-y-3">{p.contacts.map(c=><article key={c.id} className="p-4 border rounded-xl bg-white"><h3 className="font-bold">{c.name}</h3><p>Despesas em aberto: {formatCurrency(p.expenses.filter(e=>e.contactId===c.id && isOpen(e.status)).reduce((n,e)=>n+e.amount,0))} · Receitas em aberto: {formatCurrency(p.incomes.filter(i=>i.contactId===c.id && isOpen(i.status)).reduce((n,i)=>n+i.amount,0))}</p></article>)}</div>}
 {tab==='goals' && <div className="grid gap-3 md:grid-cols-2">{p.goals.map(g=><article key={g.id} className="p-4 border rounded-xl bg-white space-y-2"><h3 className="font-bold">{g.title}</h3><p>{formatCurrency(g.currentAmount)} de {formatCurrency(g.targetAmount)}</p><progress className="w-full" max={g.targetAmount||1} value={g.currentAmount}/>{p.canEdit && <button onClick={()=>{const raw=prompt('Novo valor acumulado da meta:',String(g.currentAmount));if(raw===null)return;const amount=Number(raw.replace(',','.'));if(Number.isFinite(amount)&&amount>=0)p.onUpdateGoal(g.id,amount);}} className="p-2 bg-indigo-50 rounded">Atualizar valor acumulado</button>}</article>)}</div>}
 {tab==='projects' && <div className="grid gap-3 md:grid-cols-2">{p.costCenters.map(c=><article key={c.id} className="p-4 border rounded-xl bg-white"><h3 className="font-bold">{c.name}</h3><p>Despesas: {formatCurrency(p.expenses.reduce((n,e)=>n+(e.splits?.length?e.splits.filter(s=>s.costCenterId===c.id).reduce((a,s)=>a+s.amount,0):e.costCenterId===c.id?e.amount:0),0))}</p></article>)}</div>}
 {tab==='treasuries' && <div className="grid gap-3 md:grid-cols-2">{(p.treasuries||[]).map(t=><article key={t.id} className="p-4 bg-white border rounded-xl"><h3 className="font-bold">{t.name}</h3><p>Saldo das contas vinculadas: {formatCurrency(p.accounts.filter(a=>a.treasuryId===t.id).reduce((n,a)=>n+(balances[a.id]||0),0))}</p></article>)}</div>}
 {tab==='equipment' && <div className="grid gap-3 md:grid-cols-2">{(p.equipment||[]).map(e=><article key={e.id} className="p-4 bg-white border rounded-xl"><h3 className="font-bold">{e.name}</h3><p>Situação: {e.status} · Diária: {formatCurrency(e.dailyRate)}</p></article>)}</div>}
 {tab==='categories' && <div className="grid gap-3 md:grid-cols-2">{(p.categories||[]).map(c=><article key={c.id} className="p-4 bg-white border rounded-xl"><h3 className="font-bold">{c.name}</h3><p>Total de despesas: {formatCurrency(p.expenses.filter(e=>e.categoryId===c.id && !['cancelled','CANCELADO','rejected','draft'].includes(e.status||'')).reduce((n,e)=>n+e.amount,0))}</p></article>)}</div>}
 </section>;
}
