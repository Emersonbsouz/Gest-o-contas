
import React, { useState } from 'react';
import type { CreditCard, Expense, TreasuryAccount, CardInvoicePayment, CardPaymentSelection } from '../types';
import { getCardInvoices } from '../utils/cardInvoices';
import { localToday } from '../utils/dailyCash';
import { formatCurrency, formatDateBR } from '../utils/formatters';
interface Props {
 card: CreditCard; expenses: Expense[]; accounts: TreasuryAccount[]; payments: CardInvoicePayment[];
 onPay?: (cardId:string,dueDate:string,accountId:string,paymentDate:string,selection?:CardPaymentSelection)=>Promise<void>;
}
export function CardInvoicePanel({card,expenses,accounts,payments,onPay}:Props) {
 const invoices=getCardInvoices(card.id,expenses);
 const [selected,setSelected]=useState<string|null>(null);
 const [ids,setIds]=useState<string[]>([]);
 const [amount,setAmount]=useState('');
 const [accountId,setAccountId]=useState(card.linkedAccountId || accounts[0]?.id || '');
 const [date,setDate]=useState(localToday());
 const [busy,setBusy]=useState(false);
 const [error,setError]=useState('');
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
     <details><summary className="cursor-pointer text-xs">Ver compras da fatura</summary>{i.items.map(e=><p key={e.id} className="flex justify-between py-1"><span>{e.description}</span><span>{formatCurrency(e.amount)}</span></p>)}</details>
     {onPay && <button type="button" disabled={busy} onClick={()=>{setSelected(i.dueDate);setIds(i.items.map(e=>e.id));setAmount(i.amount.toFixed(2));setError('');setAccountId(card.linkedAccountId || accounts[0]?.id || '');setDate(localToday());}} className="rounded-lg bg-emerald-600 px-3 py-2 font-bold text-white">Pagar fatura de {formatDateBR(i.dueDate)}</button>}
   </div>)}
   {invoices.length===0 && <p className="text-emerald-700">Nenhuma fatura em aberto.</p>}
   {invoice && <form onSubmit={async e=>{
      e.preventDefault();if(busy || !onPay)return;
      if(!ids.length || !Number.isFinite(value) || valueCents<=0 || valueCents>selectedTotal){setError('Selecione despesas e um valor maior que zero, até o total selecionado.');return;}
      setBusy(true);setError('');
      try{await onPay(card.id,invoice.dueDate,accountId,date,{expenseIds:ids,amount:valueCents/100,expectedBalance:selectedTotal/100});setSelected(null);}
      catch(err){setError(err instanceof Error?err.message:'Não foi possível pagar a fatura.');}finally{setBusy(false);}
   }} className="p-4 rounded-xl border border-emerald-200 bg-emerald-50 space-y-3">
     <strong>Pagamento da fatura de {formatDateBR(invoice.dueDate)}</strong>
     <fieldset disabled={busy} className="space-y-2">
       <legend className="font-semibold text-sm">Despesas para pagamento</legend>
       <label className="flex items-center gap-2"><input type="checkbox" checked={ids.length===invoice.items.length} onChange={e=>updateSelection(e.target.checked?invoice.items.map(v=>v.id):[])}/>Selecionar todas as despesas</label>
       {invoice.items.map(e=><label key={e.id} className="flex items-center gap-2 bg-white p-2 rounded"><input aria-label={'Selecionar '+e.description} type="checkbox" checked={ids.includes(e.id)} onChange={event=>updateSelection(event.target.checked?[...ids,e.id]:ids.filter(id=>id!==e.id))}/><span className="flex-1">{e.description}</span><strong>{formatCurrency(e.amount)}</strong></label>)}
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
   {history.length>0 && <details><summary className="cursor-pointer font-bold">Histórico de pagamentos da fatura</summary>{history.map(p=><div key={p.id} className="py-2 border-b"><p>Fatura {formatDateBR(p.dueDate)} · Pago {formatCurrency(p.amount)}</p><p>Em {formatDateBR(p.paymentDate)} · {accounts.find(a=>a.id===p.accountId)?.name || 'Conta removida'}</p></div>)}</details>}
 </div>;
}
