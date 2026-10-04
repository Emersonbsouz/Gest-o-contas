import React, { useMemo, useState } from 'react';
import type { TreasuryAccount, Income, Expense, AccountTransfer, DailyCashClosing } from '../types';
import { dailyCashSummary, localToday } from '../utils/dailyCash';
import { formatCurrency, formatDateBR } from '../utils/formatters';
import { csvCell } from '../utils/financialReports';
import { getSaveErrorMessage } from '../utils/saveErrors';

interface Props {
  accounts: TreasuryAccount[]; incomes: Income[]; expenses: Expense[]; transfers: AccountTransfer[];
  closings: DailyCashClosing[]; canClose: boolean; companyName?: string;
  onCloseDay: (accountId: string, date: string, counted: number, notes?: string, signature?: string) => Promise<unknown>;
}
export const DailyCashView: React.FC<Props> = ({accounts,incomes,expenses,transfers,closings,canClose,onCloseDay,companyName}) => {
  const cashAccounts = accounts.filter(a => a.type === 'cash');
  const [accountId,setAccountId] = useState(''), [date,setDate] = useState(localToday);
  const [counted,setCounted] = useState(''), [notes,setNotes] = useState(''), [saving,setSaving] = useState(false), [error,setError] = useState('');
  const activeId = accountId || cashAccounts[0]?.id || '';
  const account = cashAccounts.find(a => a.id === activeId);
  const summary = useMemo(() => account ? dailyCashSummary(account,date,incomes,expenses,transfers) : null,[account,date,incomes,expenses,transfers]);
  const closing = closings.find(c => c.accountId === activeId && c.date === date);
  const view = closing || summary;
  const countedValue = Number(counted.replace(',','.'));
  const changed = closing && summary && closing.movementSignature !== summary.movementSignature;
  const difference = closing?.difference ?? (counted.trim() && summary && Number.isFinite(countedValue) ? Math.round((countedValue-summary.expectedBalance)*100)/100 : null);
  function resetInputs() {setCounted('');setNotes('');setError('');}
  async function submit(e: React.FormEvent) {
    e.preventDefault();
    if (!counted.trim() || !Number.isFinite(countedValue) || countedValue < 0) {setError('Informe o saldo contado no caixa.'); return;}
    if (!account || !date || date > localToday()) {setError('Selecione um caixa e uma data até hoje.'); return;}
    if (closing) {setError('Este caixa já foi fechado nessa data.'); return;}
    if (!canClose) {setError('Você não tem permissão para fechar o caixa.'); return;}
    if (difference !== 0 && !notes.trim()) {setError('Descreva o motivo da diferença antes de fechar.'); return;}
    setSaving(true);setError('');
    try {await onCloseDay(activeId,date,countedValue,notes,summary?.movementSignature);setCounted('');setNotes('');}
    catch(err) {const detail = err as {code?:string;message?:string}; setError(detail?.code === '23505' ? 'Este caixa já foi fechado nessa data. Atualize a consulta.' : /Selecione|Informe|diferença|fechado|movimentos mudaram/.test(detail?.message || '') ? detail.message! : getSaveErrorMessage(err));}
    finally {setSaving(false);}
  }
  function exportClosing() {
    if (!view || !account) return;
    const rows = [['Fechamento diário de caixa'], ['Empresa',companyName || ''], ['Caixa',closing?.accountName || account.name], ['Data',formatDateBR(date)], ['Situação',closing ? 'Fechado' : 'Prévia'],
      ['Abertura',view.openingBalance],['Recebimentos',view.incomeTotal],['Pagamentos',view.expenseTotal],['Transferências recebidas',view.transferIn],['Transferências enviadas',view.transferOut],['Saldo esperado',view.expectedBalance],['Saldo contado',closing?.countedBalance ?? counted],['Diferença',difference ?? ''],['Responsável',closing?.closedBy || ''],['Observações',closing?.notes || notes]];
    const blob = new Blob(['\uFEFF'+rows.map(r => r.map(csvCell).join(';')).join('\r\n')],{type:'text/csv;charset=utf-8'});
    const url=URL.createObjectURL(blob), a=document.createElement('a');a.href=url;a.download=`fechamento_${date}_${activeId}.csv`;document.body.appendChild(a);a.click();a.remove();URL.revokeObjectURL(url);
  }
  return <section className="space-y-5">
    <div><h3 className="text-xl font-bold">Fechamento diário de caixa</h3><p className="mt-1 text-sm text-slate-500">Confira os movimentos realizados e registre o dinheiro contado no fim do dia.</p></div>
    <div className="flex flex-wrap gap-3 rounded-2xl border bg-white p-4">
      <label className="text-sm">Caixa<select aria-label="Caixa do fechamento" value={activeId} onChange={e => {setAccountId(e.target.value);resetInputs();}} className="ml-2 rounded-lg border bg-white p-2">{!cashAccounts.length && <option value="">Nenhum caixa cadastrado</option>}{cashAccounts.map(a => <option key={a.id} value={a.id}>{a.name}</option>)}</select></label>
      <label className="text-sm">Data<input aria-label="Data do fechamento" type="date" max={localToday()} value={date} onChange={e => {setDate(e.target.value);resetInputs();}} className="ml-2 rounded-lg border p-2" /></label>
      <button onClick={exportClosing} disabled={!view} className="rounded-lg border px-3 py-2 text-sm">Exportar fechamento</button>
      <span className="self-center text-sm font-bold text-indigo-700">{closing ? 'Fechado' : 'Aberto para conferência'}</span>
    </div>
    {!account && <p className="rounded-xl bg-amber-50 p-4 text-sm">Cadastre um caixa em Cadastros → Contas e Caixas → Novo Caixa.</p>}
    {view && <><div className="grid grid-cols-2 gap-3 lg:grid-cols-3">{[['Saldo de abertura',view.openingBalance],['Recebimentos',view.incomeTotal],['Pagamentos',view.expenseTotal],['Transferências recebidas',view.transferIn],['Transferências enviadas',view.transferOut],['Saldo esperado',view.expectedBalance]].map(([label,value]) => <div key={String(label)} className="rounded-xl border bg-white p-4"><p className="text-xs text-slate-500">{label}</p><p className="mt-2 text-xl font-bold">{formatCurrency(Number(value))}</p></div>)}</div>
      {changed && <p role="alert" className="rounded-xl bg-amber-50 p-4 text-sm text-amber-900">Os movimentos ou o saldo inicial foram alterados após este fechamento. O registro abaixo preserva os valores conferidos originalmente. Saldo esperado na consulta atual: {formatCurrency(summary!.expectedBalance)}.</p>}
      {closing ? <div className="rounded-2xl border bg-white p-5"><h4 className="font-bold">Fechamento registrado</h4><p className="mt-2">Saldo contado: <b>{formatCurrency(closing.countedBalance)}</b> · Diferença: <b>{formatCurrency(closing.difference)}</b></p><p className="mt-2 text-xs text-slate-500">Responsável: {closing.closedBy} · {new Date(closing.closedAt).toLocaleString('pt-BR')}</p>{closing.notes && <p className="mt-2 text-sm">{closing.notes}</p>}</div>
        : <form onSubmit={submit} className="space-y-4 rounded-2xl border bg-white p-5">{error && <p role="alert" className="text-sm text-rose-600">{error}</p>}<label className="block text-sm font-semibold">Saldo contado (R$)<input aria-label="Saldo contado" type="text" inputMode="decimal" value={counted} onChange={e => setCounted(e.target.value)} className="mt-1 w-full rounded-xl border p-3" placeholder="0,00" /></label>
          <p className="text-sm">Diferença: <b>{difference === null ? 'Informe o saldo contado' : formatCurrency(difference)}</b></p><label className="block text-sm">Observações / motivo da diferença<textarea aria-label="Observações do fechamento" value={notes} onChange={e => setNotes(e.target.value)} className="mt-1 w-full rounded-xl border p-3" /></label>
          <p className="text-xs text-slate-500">O fechamento registra a conferência. Uma diferença não cria receita, despesa ou ajuste de saldo automaticamente.</p><button disabled={saving || !canClose || !date || date > localToday()} className="rounded-xl bg-indigo-600 px-5 py-3 font-bold text-white disabled:opacity-50">{saving ? 'Salvando...' : 'Confirmar fechamento diário'}</button></form>}
      {!closing && summary && <div className="overflow-x-auto rounded-xl border bg-white"><table className="w-full text-left text-sm"><thead><tr><th className="p-3">Movimentos do dia</th><th className="p-3 text-right">Valor</th></tr></thead><tbody>{summary.movements.map(m => <tr key={m.id} className="border-t"><td className="p-3">{m.description}</td><td className="p-3 text-right">{formatCurrency(m.amount)}</td></tr>)}</tbody></table>{!summary.movements.length && <p className="p-4 text-sm text-slate-500">Sem movimentos realizados neste dia.</p>}</div>}
      <p className="text-xs text-slate-500">Abertura pelo saldo inicial e movimentos anteriores. Pagamentos e recebimentos usam a data da baixa; registros antigos sem essa data usam o vencimento. Pendências não entram no fechamento.</p></>}
    <div className="rounded-2xl border bg-white p-5"><h4 className="mb-3 font-bold">Histórico de fechamentos</h4><div className="space-y-2">{closings.filter(c => !activeId || c.accountId === activeId).sort((a,b) => b.date.localeCompare(a.date)).map(c => <button key={c.id} onClick={() => {setAccountId(c.accountId);setDate(c.date);resetInputs();}} className="flex w-full flex-wrap justify-between gap-2 rounded-xl bg-slate-50 p-3 text-left text-sm"><span>{formatDateBR(c.date)} · {c.accountName}</span><span>Contado: {formatCurrency(c.countedBalance)} · Diferença: {formatCurrency(c.difference)}</span></button>)}{!closings.length && <p className="text-sm text-slate-500">Nenhum fechamento registrado.</p>}</div></div>
  </section>;
};
