import {useActionReview} from '../context/ActionReviewContext';

import React, { useState, useEffect, useRef } from 'react';
import { X, ArrowRightLeft } from 'lucide-react';
import type { AccountTransfer, TreasuryAccount, TreasuryGroup } from '../types';
import { localToday } from '../utils/dailyCash';
import { validateTransfer } from '../utils/transfers';
import { getSaveErrorMessage } from '../utils/saveErrors';
type Kind='all'|'account'|'cash'|'treasury';
interface Props {
 isOpen:boolean;onClose:()=>void;
 onSave:(data:Omit<AccountTransfer,'id'|'createdAt'>,id?:string)=>void|Promise<unknown>;
 editingTransfer?:AccountTransfer|null;accounts:TreasuryAccount[];treasuries?:TreasuryGroup[];
 defaultDate?:string;defaultFromAccountId?:string;
}
export function TransferFormModal({isOpen,onClose,onSave,editingTransfer,accounts=[],treasuries=[],defaultDate,defaultFromAccountId}:Props) {
 const {reviewForm}=useActionReview();
 const [fromId,setFromId]=useState(''),[toId,setToId]=useState('');
 const [fromKind,setFromKind]=useState<Kind>('account'),[toKind,setToKind]=useState<Kind>('account');
 const [fromTreasury,setFromTreasury]=useState(''),[toTreasury,setToTreasury]=useState('');
 const [amount,setAmount]=useState(''),[date,setDate]=useState(''),[description,setDescription]=useState('');
 const [error,setError]=useState(''),[saving,setSaving]=useState(false);
 const savingRef=useRef(false);
 useEffect(()=>{
   if(!isOpen)return;
   const from=editingTransfer?.fromAccountId||defaultFromAccountId||accounts[0]?.id||'';
   const to=editingTransfer?.toAccountId||accounts.find(a=>a.id!==from)?.id||'';
   setFromId(from);setToId(to);
   setFromKind(editingTransfer ? (editingTransfer.fromTreasuryId?'treasury':accounts.find(a=>a.id===from)?.type==='cash'?'cash':'account') : 'all');
   setToKind(editingTransfer ? (editingTransfer.toTreasuryId?'treasury':accounts.find(a=>a.id===to)?.type==='cash'?'cash':'account') : 'all');
   setFromTreasury(editingTransfer?.fromTreasuryId||'');setToTreasury(editingTransfer?.toTreasuryId||'');
   setAmount(editingTransfer?String(editingTransfer.amount):'');setDate(editingTransfer?.date||defaultDate||localToday());setDescription(editingTransfer?.description||'');setError('');
 },[isOpen,editingTransfer,defaultDate,defaultFromAccountId]);
 if(!isOpen)return null;
 const options=(kind:Kind,treasury:string)=>accounts.filter(a=>kind==='all'?true:kind==='treasury'?a.treasuryId===treasury:kind==='cash'?a.type==='cash':a.type!=='cash');
 const endpoint=(side:'from'|'to')=>{
   const origin=side==='from';const kind=origin?fromKind:toKind;const treasury=origin?fromTreasury:toTreasury;
   const id=origin?fromId:toId;const other=origin?toId:fromId;
   const setId=origin?setFromId:setToId;const setKind=origin?setFromKind:setToKind;const setTreasury=origin?setFromTreasury:setToTreasury;
   const name=origin?'origem':'destino';const choices=options(kind,treasury);
   return <fieldset className="space-y-2 p-3 border rounded-xl">
    <legend className="font-bold text-sm">{origin?'Origem · sai de':'Destino · entra em'}</legend>
    <label className="block text-xs">Tipo de {name}<select aria-label={'Tipo de '+name} value={kind} onChange={e=>{const next=e.target.value as Kind;setKind(next);setTreasury('');setId(options(next,'').find(a=>a.id===id && a.id!==other)?.id||options(next,'').find(a=>a.id!==other)?.id||'');}} className="block w-full border rounded p-2 mt-1"><option value="all">Todas: contas, carteiras e caixas</option><option value="account">Conta bancária</option><option value="cash">Caixa / Carteira</option><option value="treasury">Tesouraria</option></select></label>
    {kind==='treasury' && <label className="block text-xs">Tesouraria de {name}<select aria-label={'Tesouraria de '+name} required value={treasury} onChange={e=>{setTreasury(e.target.value);setId(accounts.find(a=>a.treasuryId===e.target.value && a.id!==other)?.id||'');}} className="block w-full border rounded p-2 mt-1"><option value="">Selecione uma tesouraria</option>{treasuries.map(t=><option key={t.id} value={t.id}>{t.name}</option>)}</select></label>}
    <label className="block text-xs">{kind==='treasury'?'Conta ou caixa vinculado':'Conta ou caixa de '+name}<select id={origin?'select-transfer-from':'select-transfer-to'} aria-label={'Conta de '+name} required value={id} onChange={e=>setId(e.target.value)} className="block w-full border rounded p-2 mt-1"><option value="">Selecione</option>{choices.map(a=><option key={a.id} value={a.id} disabled={a.id===other}>{a.name}{a.type==='cash'?' · Caixa / Carteira':''}{a.treasuryId?' · '+(treasuries.find(t=>t.id===a.treasuryId)?.name||'Tesouraria'):''}</option>)}</select></label>
    {kind==='treasury' && treasury && choices.length===0 && <p className="text-xs text-amber-800">Vincule uma conta ou caixa a esta tesouraria em Cadastros → Contas e Caixas.</p>}
   </fieldset>;
 };
 async function submit(e:React.FormEvent) {
  e.preventDefault();if(savingRef.current)return;
  const value=Number(amount.replace(',','.'));
  const data={fromAccountId:fromId,toAccountId:toId,amount:Math.round(value*100)/100,date,description:description.trim()||'Transferência interna',fromTreasuryId:fromKind==='treasury'?fromTreasury:undefined,toTreasuryId:toKind==='treasury'?toTreasury:undefined};
  try{validateTransfer(data,accounts,treasuries);}catch(err){setError(err instanceof Error?err.message:'Confira os dados.');return;}
    if (!await reviewForm(e.currentTarget as HTMLFormElement, 'Revisar transferência')) return;
  savingRef.current=true;setSaving(true);setError('');
  try{await onSave(data,editingTransfer?.id);onClose();}catch(err){setError(getSaveErrorMessage(err));}finally{savingRef.current=false;setSaving(false);}
 }
 return <div className="fixed inset-0 z-50 flex items-center justify-center p-4 overflow-y-auto bg-slate-900/60">
  <form id="modal-transfer-form" onSubmit={submit} className="w-full max-w-xl rounded-2xl bg-white shadow-xl p-6 space-y-4">
   <div className="flex justify-between items-center"><h3 className="font-bold flex items-center gap-2"><ArrowRightLeft size={18}/>{editingTransfer?'Editar Transferência':'Transferência interna'}</h3><button type="button" aria-label="Fechar transferência" disabled={saving} onClick={onClose}><X size={20}/></button></div>
   <p className="text-xs text-slate-500">Transfira entre carteiras, caixas, contas bancárias e tesourarias. A tesouraria movimenta uma de suas contas ou caixas vinculados. A transferência não é receita nem despesa.</p>
   {error && <p role="alert" className="p-3 rounded bg-rose-50 text-rose-700 text-sm">{error}</p>}
   <fieldset disabled={saving} className="space-y-4">
    <div className="grid sm:grid-cols-2 gap-3">{endpoint('from')}{endpoint('to')}</div>
    <div className="grid grid-cols-2 gap-3"><label className="text-xs">Valor da transferência<input id="input-transfer-amount" aria-label="Valor da transferência" type="number" min="0.01" step="0.01" required value={amount} onChange={e=>setAmount(e.target.value)} className="block w-full border rounded p-2 mt-1"/></label><label className="text-xs">Data da transferência<input aria-label="Data da transferência" type="date" required value={date} onChange={e=>setDate(e.target.value)} className="block w-full border rounded p-2 mt-1"/></label></div>
    <label className="block text-xs">Descrição<input id="input-transfer-description" value={description} onChange={e=>setDescription(e.target.value)} className="block w-full border rounded p-2 mt-1"/></label>
   </fieldset>
   <div className="flex justify-end gap-2"><button type="button" disabled={saving} onClick={onClose} className="p-2">Cancelar</button><button id="btn-save-transfer" type="submit" disabled={saving} className="bg-sky-700 text-white rounded-lg px-4 py-2 font-bold">{saving?'Salvando...':editingTransfer?'Salvar Alterações':'Realizar Transferência'}</button></div>
  </form>
 </div>;
}
