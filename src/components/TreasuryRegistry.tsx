import {useActionReview} from '../context/ActionReviewContext';
import { RegistryTable } from './RegistryTable';
import React, { useState } from 'react';
import { Landmark, Plus, X } from 'lucide-react';
import type { TreasuryGroup, TreasuryAccount, Income, Expense, AccountTransfer } from '../types';
import { calculateAccountBalances } from '../utils/treasuryHelpers';
import { formatCurrency } from '../utils/formatters';
import { getSaveErrorMessage } from '../utils/saveErrors';

interface Props {
  treasuries: TreasuryGroup[]; accounts: TreasuryAccount[]; incomes: Income[]; expenses: Expense[];
  transfers?: AccountTransfer[]; search?: string;
  onSave: (data: Omit<TreasuryGroup, 'id'>, id?: string) => Promise<unknown>;
}
export const TreasuryRegistry: React.FC<Props> = ({treasuries, accounts, incomes, expenses, transfers = [], search = '', onSave}) => {
  const {reviewForm}=useActionReview();
  const [editing, setEditing] = useState<TreasuryGroup | null>(null);
  const [show, setShow] = useState(false), [name, setName] = useState(''), [notes, setNotes] = useState('');
  const [saving, setSaving] = useState(false), [error, setError] = useState('');
  const balances = calculateAccountBalances(accounts, incomes, expenses, transfers);
  function open(item?: TreasuryGroup) {setEditing(item || null); setName(item?.name || ''); setNotes(item?.notes || ''); setError(''); setShow(true);}
  async function submit(e: React.FormEvent) {
    e.preventDefault(); if (!name.trim()) {setError('Informe o nome da tesouraria.'); return;}
    if (!await reviewForm(e.currentTarget as HTMLFormElement, 'Revisar tesouraria')) return;
    setSaving(true); setError('');
    try {await onSave({name: name.trim(), notes: notes.trim() || undefined}, editing?.id); setShow(false);}
    catch (err) {setError(err instanceof Error && /tesouraria|esse nome/.test(err.message) ? err.message : getSaveErrorMessage(err));} finally {setSaving(false);}
  }
  return <div className="space-y-4">
    <RegistryTable title="Tesourarias" description="Agrupe contas e caixas e consulte o saldo consolidado." items={treasuries.filter(t=>(t.name+' '+(t.notes||'')).toLowerCase().includes(search.toLowerCase()))} onCreate={()=>open()} createLabel="Nova Tesouraria"
      columns={[{label:'Tesouraria',render:item=><strong>{item.name}</strong>},{label:'Contas e caixas',render:item=>accounts.filter(a=>a.treasuryId===item.id).map(a=>a.name).join(', ')||'Nenhuma conta vinculada'},{label:'Saldo consolidado',sortValue:item=>accounts.filter(a=>a.treasuryId===item.id).reduce((sum,a)=>sum+(balances[a.id]||0),0),render:item=>formatCurrency(accounts.filter(a=>a.treasuryId===item.id).reduce((sum,a)=>sum+(balances[a.id]||0),0))},{label:'Observações',render:item=>item.notes||'—'}]}
      actions={[{label:'Editar',run:item=>open(item)}]} />
    {show && <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/60 p-4"><form onSubmit={submit} className="w-full max-w-md space-y-4 rounded-2xl bg-white p-6"><div className="flex items-center justify-between"><h3 className="font-bold">{editing ? 'Editar Tesouraria' : 'Nova Tesouraria'}</h3><button type="button" aria-label="Fechar tesouraria" disabled={saving} onClick={() => setShow(false)}><X size={20} /></button></div>
      {error && <p role="alert" className="text-sm text-rose-600">{error}</p>}
      <label className="block text-sm">Nome da tesouraria<input aria-label="Nome da tesouraria" autoFocus required value={name} onChange={e => setName(e.target.value)} className="mt-1 w-full rounded-xl border p-3" /></label>
      <label className="block text-sm">Observações<textarea value={notes} onChange={e => setNotes(e.target.value)} className="mt-1 w-full rounded-xl border p-3" /></label>
      <button disabled={saving} className="w-full rounded-xl bg-indigo-600 p-3 font-bold text-white disabled:opacity-50">{saving ? 'Salvando...' : 'Salvar Tesouraria'}</button></form></div>}
  </div>;
};
