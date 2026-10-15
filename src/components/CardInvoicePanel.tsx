
import React, { useState } from 'react';
import type { CreditCard, Expense, TreasuryAccount, CardInvoicePayment } from '../types';
import { getCardInvoices } from '../utils/cardInvoices';
import { localToday } from '../utils/dailyCash';
import { formatCurrency, formatDateBR } from '../utils/formatters';

interface Props {
 card: CreditCard; expenses: Expense[]; accounts: TreasuryAccount[]; payments: CardInvoicePayment[];
 onPay?: (cardId:string,dueDate:string,accountId:string,paymentDate:string)=>Promise<void>;
}
export function CardInvoicePanel({card,expenses,accounts,payments,onPay}:Props) {
 const invoices=getCardInvoices(card.id,expenses);
 const [selected,setSelected]=useState<string|null>(null);
 const [accountId,setAccountId]=useState(card.linkedAccountId || accounts[0]?.id || '');
 const [date,setDate]=useState(localToday());
 const [busy,setBusy]=useState(false);
 const [error,setError]=useState('');
 const invoice=invoices.find(i=>i.dueDate===selected);
 const history=payments.filter(p=>p.cardId===card.id).sort((a,b)=>b.paymentDate.localeCompare(a.paymentDate));
 return <div onClick={e=>e.stopPropagation()} className="p-4 space-y-3 border-t text-xs">
   <h5 className="font-bold text-slate-900">Faturas do cartão</h5>
   <p className="text-slate-500">Compras até o dia do fechamento entram na mesma fatura. Compras posteriores vão para a próxima. Pagar a fatura baixa as compras, debita a conta escolhida e libera o limite.</p>
   {invoices.map(i=><div key={i.dueDate} className="rounded-lg border p-3 space-y-2">
     <div className="flex justify-between gap-2"><strong>Vence {formatDateBR(i.dueDate)}</strong><strong className="text-rose-700">{formatCurrency(i.amount)}</strong></div>
     <p>{i.dueDate < localToday() ? 'Vencida' : 'Em aberto'} · {i.items.length} lançamento(s)</p>
     <details><summary className="cursor-pointer">Ver compras da fatura</summary>{i.items.map(e=><p key={e.id} className="flex justify-between gap-2 py-1"><span>{e.description}{e.installments ? ' · parcela '+e.installments.current+'/'+e.installments.total : ''}</span><span>{formatCurrency(e.amount)}</span></p>)}</details>
     {onPay && <button type="button" disabled={busy} onClick={()=>{setSelected(i.dueDate);setError('');setAccountId(card.linkedAccountId || accounts[0]?.id || '');setDate(localToday());}} className="rounded-lg bg-emerald-600 px-3 py-2 font-bold text-white">Pagar fatura de {formatDateBR(i.dueDate)}</button>}
   </div>)}
   {invoices.length===0 && <p className="text-emerald-700">Nenhuma fatura em aberto.</p>}
   {invoice && <form onSubmit={async e=>{
      e.preventDefault(); if(busy || !onPay)return; setBusy(true);setError('');
      try { await onPay(card.id,invoice.dueDate,accountId,date);setSelected(null); }
      catch(err){setError(err instanceof Error?err.message:'Não foi possível pagar a fatura.');}
      finally{setBusy(false);}
   }} className="p-3 rounded-lg border border-emerald-200 bg-emerald-50 space-y-2">
     <strong>Registrar pagamento integral: {formatCurrency(invoice.amount)}</strong>
     <p>Este registro não transfere dinheiro no banco. Informe um pagamento que você realizou.</p>
     <label className="block">Conta de saída<select aria-label="Conta de saída da fatura" required value={accountId} onChange={e=>setAccountId(e.target.value)} className="block w-full border p-2 rounded bg-white"><option value="">Selecione uma conta</option>{accounts.map(a=><option key={a.id} value={a.id}>{a.name}</option>)}</select></label>
     <label className="block">Data do pagamento<input aria-label="Data do pagamento da fatura" type="date" required max={localToday()} value={date} onChange={e=>setDate(e.target.value)} className="block w-full border p-2 rounded bg-white"/></label>
     {error && <p role="alert" className="text-rose-700">{error}</p>}
     <div className="flex gap-2"><button type="submit" disabled={busy || !accountId} className="rounded bg-emerald-700 p-2 text-white font-bold">{busy?'Registrando...':'Confirmar pagamento integral'}</button><button type="button" disabled={busy} onClick={()=>setSelected(null)}>Cancelar</button></div>
   </form>}
   {history.length>0 && <details><summary className="cursor-pointer font-bold">Histórico de faturas pagas</summary>{history.map(p=><div key={p.id} className="py-2 border-b"><p>Fatura {formatDateBR(p.dueDate)} · {formatCurrency(p.amount)}</p><p>Pago em {formatDateBR(p.paymentDate)} · {accounts.find(a=>a.id===p.accountId)?.name || 'Conta removida'}</p></div>)}</details>}
 </div>;
}
