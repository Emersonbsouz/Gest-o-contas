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
  const [editing, setEditing] = useState<TreasuryGroup | null>(null);
  const [show, setShow] = useState(false), [name, setName] = useState(''), [notes, setNotes] = useState('');
  const [saving, setSaving] = useState(false), [error, setError] = useState('');
  const balances = calculateAccountBalances(accounts, incomes, expenses, transfers);
  function open(item?: TreasuryGroup) {setEditing(item || null); setName(item?.name || ''); setNotes(item?.notes || ''); setError(''); setShow(true);}
  async function submit(e: React.FormEvent) {
    e.preventDefault(); if (!name.trim()) {setError('Informe o nome da tesouraria.'); return;}
    setSaving(true); setError('');
    try {await onSave({name: name.trim(), notes: notes.trim() || undefined}, editing?.id); setShow(false);}
    catch (err) {setError(err instanceof Error && /tesouraria|esse nome/.test(err.message) ? err.message : getSaveErrorMessage(err));} finally {setSaving(false);}
  }
  return <div className="space-y-4">
    <div className="flex flex-wrap items-center justify-between gap-3"><div><h3 className="font-bold text-slate-900">Tesourarias</h3><p className="text-sm text-slate-500">Agrupe caixas e contas. Vincule cada um em seu cadastro.</p></div><button onClick={() => open()} className="flex items-center gap-2 rounded-xl bg-indigo-600 px-4 py-2 text-sm font-bold text-white"><Plus size={16} />Nova Tesouraria</button></div>
    <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">{treasuries.filter(t => `${t.name} ${t.notes || ''}`.toLowerCase().includes(search.toLowerCase())).map(t => {
      const linked = accounts.filter(a => a.treasuryId === t.id);
      return <button key={t.id} onClick={() => open(t)} className="rounded-2xl border border-slate-200 bg-white p-5 text-left hover:border-indigo-400"><Landmark className="mb-3 text-indigo-600" /><h4 className="font-bold">{t.name}</h4><p className="mt-1 text-xs text-slate-500">{linked.length} caixas / contas vinculados</p><p className="mt-3 text-xl font-bold">{formatCurrency(linked.reduce((sum, a) => sum + (balances[a.id] || 0), 0))}</p><p className="text-xs text-slate-500">Saldo realizado consolidado</p><p className="mt-2 text-xs text-slate-600">{linked.map(a => a.name).join(', ') || 'Vincule um caixa ou conta para começar.'}</p></button>;
    })}</div>
    {!treasuries.length && <div className="rounded-2xl border border-dashed p-8 text-center text-sm text-slate-500">Crie uma tesouraria, como Tesouraria Principal, e vincule os caixas em Contas e Caixas.</div>}
    {show && <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/60 p-4"><form onSubmit={submit} className="w-full max-w-md space-y-4 rounded-2xl bg-white p-6"><div className="flex items-center justify-between"><h3 className="font-bold">{editing ? 'Editar Tesouraria' : 'Nova Tesouraria'}</h3><button type="button" aria-label="Fechar tesouraria" disabled={saving} onClick={() => setShow(false)}><X size={20} /></button></div>
      {error && <p role="alert" className="text-sm text-rose-600">{error}</p>}
      <label className="block text-sm">Nome da tesouraria<input aria-label="Nome da tesouraria" autoFocus required value={name} onChange={e => setName(e.target.value)} className="mt-1 w-full rounded-xl border p-3" /></label>
      <label className="block text-sm">Observações<textarea value={notes} onChange={e => setNotes(e.target.value)} className="mt-1 w-full rounded-xl border p-3" /></label>
      <button disabled={saving} className="w-full rounded-xl bg-indigo-600 p-3 font-bold text-white disabled:opacity-50">{saving ? 'Salvando...' : 'Salvar Tesouraria'}</button></form></div>}
  </div>;
};
