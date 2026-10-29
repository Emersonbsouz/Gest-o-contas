import {useActionReview} from '../context/ActionReviewContext';

import React, { useState } from 'react';
import type { CreditCard, Expense, TreasuryAccount, CardInvoicePayment, CardPaymentSelection, ContactPerson } from '../types';
import { getCardInvoices, getInvoiceHistory } from '../utils/cardInvoices';
import { localToday } from '../utils/dailyCash';
import { formatCurrency, formatDateBR } from '../utils/formatters';
interface Props {
 contacts?: ContactPerson[];
 card: CreditCard; expenses: Expense[]; accounts: TreasuryAccount[]; payments: CardInvoicePayment[];
 onCancelPayment?:(id:string)=>Promise<void>;
 onUpdatePayment?:(id:string,patch:{amount:number;accountId:string;paymentDate:string})=>Promise<void>;
 onPay?: (cardId:string,dueDate:string,accountId:string,paymentDate:string,selection?:CardPaymentSelection)=>Promise<void>;
}
export function CardInvoicePanel({contacts=[],card,expenses,accounts,payments,onPay,onCancelPayment,onUpdatePayment}:Props) {
 const {reviewForm}=useActionReview();
 const contactMap=new Map(contacts.map(c=>[c.id,c.name]));
 const purchaseInfo=(e:Expense)=><span className="block text-[11px] text-slate-500">Compra: {e.purchaseDate?formatDateBR(e.purchaseDate):'Data não informada'} · Fornecedor: {e.contactId?contactMap.get(e.contactId)||'Cadastro indisponível':'Não informado'}</span>;
 const purchasesFor=(due:string)=>{
   const grouped=new Map<string,Expense>();
   expenses.filter(e=>e.cardId===card.id && e.paymentMethod==='credit_card' && (e.invoiceDueDate||e.date)===due && !['cancelled','CANCELADO','rejected','draft'].includes(e.status||'')).forEach(e=>{
     const id=e.sourceExpenseId||e.id;const prior=grouped.get(id);
     grouped.set(id,prior?{...prior,amount:Math.round((prior.amount+e.amount)*100)/100}:{...e,description:e.description.replace(/ \(pagamento parcial\)$/,'')});
   });
   return [...grouped.values()];
 };
 const invoices=getCardInvoices(card.id,expenses);
 const [selected,setSelected]=useState<string|null>(null);
 const [ids,setIds]=useState<string[]>([]);
 const [amount,setAmount]=useState('');
 const [accountId,setAccountId]=useState(card.linkedAccountId || accounts[0]?.id || '');
 const [date,setDate]=useState(localToday());
 const [busy,setBusy]=useState(false);
 const [error,setError]=useState('');
 const [historyError,setHistoryError]=useState('');
 const [historyFilter,setHistoryFilter]=useState('all');
 const [editing,setEditing]=useState<string|null>(null);
 const [editAmount,setEditAmount]=useState('');
 const [editAccount,setEditAccount]=useState('');
 const [editDate,setEditDate]=useState('');
 const cycles=getInvoiceHistory(card.id,expenses,localToday());
 const shownCycles=cycles.filter(c=>historyFilter==='all'||c.status===historyFilter);
 const invoice=invoices.find(i=>i.dueDate===selected);
 const selectedTotal=invoice?.items.filter(e=>ids.includes(e.id)).reduce((n,e)=>n+Math.round(e.amount*100),0) || 0;
 const value=Number(amount.replace(',','.'));
 const valueCents=Math.round(value*100);
 const partial=Number.isFinite(value) && valueCents<selectedTotal;
 const updateSelection=(next:string[])=>{
   setIds(next);
   setAmount(((invoice?.items.filter(e=>next.includes(e.id)).reduce((n,e)=>n+Math.round(e.amount*100),0)||0)/100).toFixed(2));
 };
 const history=payments.filter(p=>p.cardId===card.id).sort((a,b)=>b.createdAt-a.createdAt);
 return <div className="space-y-4 text-sm">
   <h3 className="font-bold text-slate-900">Faturas do cartão</h3>
   <p className="text-xs text-slate-500">Selecione as compras e informe o valor pago. Só esse valor sai da conta e libera limite. O saldo restante continua em aberto; juros não são calculados automaticamente.</p>
   {invoices.map(i=><div key={i.dueDate} className="rounded-xl border p-4 space-y-2 bg-white">
     <div className="flex justify-between"><strong>Vence {formatDateBR(i.dueDate)}</strong><strong className="text-rose-700">{formatCurrency(i.amount)}</strong></div>
     <p className="text-xs">{i.dueDate<localToday()?'Vencida':'Em aberto'} · {i.items.length} compra(s)</p>
     <details><summary className="cursor-pointer text-xs">Ver compras da fatura</summary>{i.items.map(e=><p key={e.id} className="flex justify-between py-1"><span>{e.description}{purchaseInfo(e)}</span><span>{formatCurrency(e.amount)}</span></p>)}</details>
     {onPay && <button type="button" disabled={busy} onClick={()=>{setSelected(i.dueDate);setIds(i.items.map(e=>e.id));setAmount(i.amount.toFixed(2));setError('');setAccountId(card.linkedAccountId || accounts[0]?.id || '');setDate(localToday());}} className="rounded-lg bg-emerald-600 px-3 py-2 font-bold text-white">Pagar fatura de {formatDateBR(i.dueDate)}</button>}
   </div>)}
   {invoices.length===0 && <p className="text-emerald-700">Nenhuma fatura em aberto.</p>}
   {invoice && <form onSubmit={async e=>{
      e.preventDefault();if(busy || !onPay)return;
      if(!ids.length || !Number.isFinite(value) || valueCents<=0 || valueCents>selectedTotal){setError('Selecione despesas e um valor maior que zero, até o total selecionado.');return;}
      if(!await reviewForm(e.currentTarget as HTMLFormElement,'Revisar pagamento: '+card.name+' · '+formatDateBR(invoice.dueDate)))return;
      setBusy(true);setError('');
      try{await onPay(card.id,invoice.dueDate,accountId,date,{expenseIds:ids,amount:valueCents/100,expectedBalance:selectedTotal/100});setSelected(null);}
      catch(err){setError(err instanceof Error?err.message:'Não foi possível pagar a fatura.');}finally{setBusy(false);}
   }} className="p-4 rounded-xl border border-emerald-200 bg-emerald-50 space-y-3">
     <strong>Pagamento da fatura de {formatDateBR(invoice.dueDate)}</strong>
     <fieldset disabled={busy} className="space-y-2">
       <legend className="font-semibold text-sm">Despesas para pagamento</legend>
       <label className="flex items-center gap-2"><input type="checkbox" checked={ids.length===invoice.items.length} onChange={e=>updateSelection(e.target.checked?invoice.items.map(v=>v.id):[])}/>Selecionar todas as despesas</label>
       {invoice.items.map(e=><label key={e.id} className="flex items-center gap-2 bg-white p-2 rounded"><input aria-label={'Selecionar '+e.description} type="checkbox" checked={ids.includes(e.id)} onChange={event=>updateSelection(event.target.checked?[...ids,e.id]:ids.filter(id=>id!==e.id))}/><span className="flex-1">{e.description}{purchaseInfo(e)}</span><strong>{formatCurrency(e.amount)}</strong></label>)}
       <p>Total selecionado: <strong>{formatCurrency(selectedTotal/100)}</strong></p>
       <label className="block">Valor do pagamento<input aria-label="Valor do pagamento" inputMode="decimal" required value={amount} onChange={e=>setAmount(e.target.value)} className="block w-full rounded border p-2"/></label>
       <p className="text-xs">{partial?'Pagamento parcial':'Pagamento do total selecionado'} · Saldo restante da fatura: {formatCurrency(Math.max(0,invoice.amount-(Number.isFinite(value)?valueCents/100:0)))}</p>
       <p className="text-xs">Pagamento parcial é distribuído por data da compra entre as despesas selecionadas. Este registro não transfere dinheiro no banco.</p>
       <label className="block">Conta de saída<select aria-label="Conta de saída da fatura" required value={accountId} onChange={e=>setAccountId(e.target.value)} className="block w-full border p-2 rounded bg-white"><option value="">Selecione uma conta</option>{accounts.map(a=><option key={a.id} value={a.id}>{a.name}</option>)}</select></label>
       <label className="block">Data do pagamento<input aria-label="Data do pagamento da fatura" type="date" required max={localToday()} value={date} onChange={e=>setDate(e.target.value)} className="block w-full border p-2 rounded bg-white"/></label>
     </fieldset>
     {error && <p role="alert" className="text-rose-700">{error}</p>}
     <div className="flex gap-2"><button type="submit" disabled={busy||!accountId||!ids.length} className="rounded bg-emerald-700 p-2 text-white font-bold">{busy?'Registrando...':partial?'Confirmar pagamento parcial':'Confirmar pagamento integral'}</button><button type="button" disabled={busy} onClick={()=>setSelected(null)}>Cancelar</button></div>
   </form>}
   <section aria-label="Histórico de faturas" className="border-t pt-4 space-y-3">
     <h4 className="font-bold">Histórico de faturas</h4>
     <label className="block text-xs">Visualizar faturas<select aria-label="Filtrar histórico de faturas" value={historyFilter} onChange={e=>setHistoryFilter(e.target.value)} className="ml-2 rounded border p-2"><option value="all">Todas</option><option value="overdue">Vencidas em aberto</option><option value="paid">Pagas</option><option value="open">A vencer</option></select></label>
     {shownCycles.map(c=><div key={c.dueDate} className="p-3 rounded-lg border bg-slate-50 text-xs"><strong>Fatura de {formatDateBR(c.dueDate)}</strong><p>{c.status==='paid'?'Paga':c.status==='overdue'?'Vencida':'A vencer'}{c.paid>0 && c.remaining>0?' · Parcialmente paga':''}</p><p>Total {formatCurrency(c.total)} · Pago {formatCurrency(c.paid)} · Em aberto {formatCurrency(c.remaining)}</p><div className="mt-2 space-y-1">{history.filter(p=>p.dueDate===c.dueDate && p.status!=='cancelled').map(p=><p key={p.id}>Data de pagamento: {formatDateBR(p.paymentDate)} · {formatCurrency(p.amount)}</p>)}{!history.some(p=>p.dueDate===c.dueDate && p.status!=='cancelled') && <p>Data de pagamento: {c.paid>0?'Não informada':'Em aberto'}</p>}</div><details className="mt-2"><summary className="cursor-pointer">Compras desta fatura</summary>{purchasesFor(c.dueDate).map(e=><div key={e.id} className="flex justify-between gap-2 py-2"><span>{e.description}{purchaseInfo(e)}</span><strong>{formatCurrency(e.amount)}</strong></div>)}</details></div>)}
     {shownCycles.length===0 && <p className="text-xs text-slate-500">Nenhuma fatura neste filtro.</p>}
   </section>
   {history.length>0 && <section aria-label="Pagamentos registrados" className="space-y-3 border-t pt-4">
     <h4 className="font-bold">Histórico de pagamentos da fatura</h4>
     {historyError && <p role="alert" className="text-rose-700">{historyError}</p>}
     {history.map(p=><article key={p.id} className="p-3 rounded-lg border text-xs space-y-2">
       <p className="font-bold">Fatura {formatDateBR(p.dueDate)} · {formatCurrency(p.amount)} · {p.status==='cancelled'?'Pagamento cancelado':'Pagamento registrado'}</p>
       <p>Data de pagamento: {formatDateBR(p.paymentDate)} · {accounts.find(a=>a.id===p.accountId)?.name||'Conta removida'}</p>
       {p.status==='cancelled' && <p className="text-amber-800">Cancelamento registrado. Este pagamento não baixa mais as despesas nem o saldo da conta.</p>}
       {p.status!=='cancelled' && <div className="flex gap-2">
         {onUpdatePayment && <button type="button" disabled={busy} className="p-2 bg-indigo-50 text-indigo-700 rounded font-bold" onClick={()=>{setEditing(p.id);setEditAmount(p.amount.toFixed(2));setEditAccount(p.accountId);setEditDate(p.paymentDate);setHistoryError('');}}>Modificar pagamento</button>}
         {onCancelPayment && <button type="button" disabled={busy} className="p-2 bg-rose-50 text-rose-700 rounded font-bold" onClick={async()=>{
           if(!window.confirm('Cancelar este pagamento registrado? As despesas correspondentes voltarão a ficar em aberto, o limite será recomprometido e a saída será desfeita no saldo da conta. Isso não estorna dinheiro no banco.'))return;
           setBusy(true);setHistoryError('');
           try{await onCancelPayment(p.id);if(editing===p.id)setEditing(null);}catch(err){setHistoryError(err instanceof Error?err.message:'Falha ao cancelar.');}finally{setBusy(false);}
         }}>Cancelar pagamento</button>}
       </div>}
       {editing===p.id && p.status!=='cancelled' && onUpdatePayment && <form className="p-3 bg-indigo-50 rounded space-y-2" onSubmit={async e=>{
         e.preventDefault();if(busy)return;if(!await reviewForm(e.currentTarget as HTMLFormElement,'Revisar correção do pagamento'))return;setBusy(true);setHistoryError('');
         try{await onUpdatePayment(p.id,{amount:Number(editAmount.replace(',','.')),accountId:editAccount,paymentDate:editDate});setEditing(null);}catch(err){setHistoryError(err instanceof Error?err.message:'Falha ao corrigir.');}finally{setBusy(false);}
       }}>
         <p>Corrigir o registro recalcula o saldo em aberto e o valor descontado da conta. O cartão e o vencimento desta fatura são preservados.</p>
         <label className="block">Valor corrigido<input aria-label="Valor corrigido do pagamento" inputMode="decimal" required value={editAmount} onChange={e=>setEditAmount(e.target.value)} className="block border rounded p-2"/></label>
         <label className="block">Conta de saída<select aria-label="Conta corrigida do pagamento" value={editAccount} onChange={e=>setEditAccount(e.target.value)} className="block border rounded p-2">{accounts.map(a=><option key={a.id} value={a.id}>{a.name}</option>)}</select></label>
         <label className="block">Data corrigida<input aria-label="Data corrigida do pagamento" type="date" required max={localToday()} value={editDate} onChange={e=>setEditDate(e.target.value)} className="block border rounded p-2"/></label>
         <button type="submit" disabled={busy} className="bg-indigo-700 text-white rounded p-2">Salvar correção</button>
         <button type="button" disabled={busy} onClick={()=>setEditing(null)} className="p-2">Fechar edição</button>
       </form>}
       {!!p.revisions?.length && <details><summary className="cursor-pointer">Alterações anteriores ({p.revisions.length})</summary>{p.revisions.map((r,index)=><p key={index}>Antes de {r.action==='cancel'?'cancelar':'modificar'}: {formatCurrency(r.amount)} · {formatDateBR(r.paymentDate)} · {accounts.find(a=>a.id===r.accountId)?.name||r.accountId}</p>)}</details>}
     </article>)}
   </section>}

 </div>;
}
