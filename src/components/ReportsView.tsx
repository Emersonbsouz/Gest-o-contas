import React, { useEffect, useMemo, useState } from 'react';
import { BarChart3, Download, Printer } from 'lucide-react';
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, Legend } from 'recharts';
import type { Expense, Income, Category, TreasuryAccount, ContactPerson, CostCenter, TreasuryGroup } from '../types';
import { formatCurrency, formatDateBR, getRelativeMonth } from '../utils/formatters';
import { csvCell, monthRange, reportRows, ReportFilters } from '../utils/financialReports';
import { isCancelled, isOpen, isSettled, statusLabel } from '../utils/financialStatus';

interface ReportsViewProps {
  expenses: Expense[]; incomes: Income[]; categories: Category[]; accounts: TreasuryAccount[];
  contacts?: ContactPerson[]; costCenters?: CostCenter[]; treasuries?: TreasuryGroup[];
  companyName?: string;
  selectedMonth: string; onMonthChange: (month: string) => void;
}
const statusNames = {all: 'Ativos (pagos e em aberto)', open: 'Em aberto', settled: 'Pagos / Recebidos', cancelled: 'Cancelados / Rejeitados'};
export const ReportsView: React.FC<ReportsViewProps> = ({ expenses = [], incomes = [], categories = [], accounts = [], contacts = [], costCenters = [], treasuries = [], selectedMonth, companyName = '' }) => {
  const month = selectedMonth || new Date().toISOString().slice(0, 7);
  const [range, setRange] = useState(() => monthRange(month));
  const [preset, setPreset] = useState('month');
  const [status, setStatus] = useState<ReportFilters['status']>('all');
  const [kind, setKind] = useState<ReportFilters['kind']>('all');
  const [accountId, setAccountId] = useState('all');
  const [costCenterId, setCostCenterId] = useState('all');
  const [treasuryId, setTreasuryId] = useState('all');
  const [search, setSearch] = useState('');
  const name = (items: {id: string; name: string}[], id?: string) => items.find(item => item.id === id)?.name || '';
  const centerNames = (item: Income | Expense) => {
    const splits = (item as Expense).splits;
    return splits?.length ? splits.filter(s => costCenterId === 'all' || s.costCenterId === costCenterId).map(s => `${s.description || s.notes || 'Item'} — ${name(costCenters, s.costCenterId) || 'Centro indisponível'} (${formatCurrency(s.amount)})`).join(' / ') : name(costCenters, item.costCenterId);
  };
  const invalidRange = !!(range.start && range.end && range.start > range.end);
  const rows = useMemo(() => invalidRange ? [] : reportRows(incomes, expenses,
    { ...range, status, kind, accountId, costCenterId, search }, item => `${name(contacts, item.contactId)} ${centerNames(item)} ${name(accounts, item.accountId)}`)
    .filter(({item}) => treasuryId === 'all' || accounts.find(a => a.id === item.accountId)?.treasuryId === treasuryId),
    [incomes, expenses, range, status, kind, accountId, costCenterId, search, contacts, costCenters, accounts, treasuryId, invalidRange]);
  const total = (type: 'income' | 'expense', predicate: typeof isOpen) => rows.filter(row => row.kind === type && predicate(row.item.status)).reduce((sum, row) => sum + row.amount, 0);
  const received = total('income', isSettled), paid = total('expense', isSettled), receivable = total('income', isOpen), payable = total('expense', isOpen);
  const chartData = useMemo(() => {
    const months = new Map<string, {name: string; Recebido: number; Pago: number; 'A receber': number; 'A pagar': number}>();
    rows.forEach(({item, kind: type, amount}) => {
      if (isCancelled(item.status)) return;
      const key = item.date.slice(0, 7), data = months.get(key) || {name: key, Recebido: 0, Pago: 0, 'A receber': 0, 'A pagar': 0};
      const field = isSettled(item.status) ? (type === 'income' ? 'Recebido' : 'Pago') : (type === 'income' ? 'A receber' : 'A pagar');
      data[field] += amount; months.set(key, data);
    });
    return [...months.values()].sort((a, b) => a.name.localeCompare(b.name));
  }, [rows]);
  useEffect(() => {
    if (preset === 'month') setRange(monthRange(month));
    if (preset === 'quarter') setRange({start: `${getRelativeMonth(month, -2)}-01`, end: monthRange(month).end});
    if (preset === 'year') setRange({start: `${month.slice(0, 4)}-01-01`, end: `${month.slice(0, 4)}-12-31`});
    if (preset === 'all') setRange({start: '', end: ''});
  }, [month, preset]);
  function choosePeriod(value: string) { setPreset(value); }
  const periodLabel = `${range.start ? formatDateBR(range.start) : 'Início do histórico'} a ${range.end ? formatDateBR(range.end) : 'Fim do histórico'}`;
  function exportReport() {
    const headers = ['Vencimento', 'Tipo', 'Descrição', 'Cliente / Fornecedor', 'Centro de custo', 'Conta / Caixa', 'Tesouraria', 'Categoria', 'Valor (R$)', 'Situação'];
    const data = rows.map(({item, kind: type, amount}) => [formatDateBR(item.date), type === 'income' ? 'Receita' : 'Despesa', item.description, name(contacts, item.contactId), centerNames(item), name(accounts, item.accountId), name(treasuries, accounts.find(a => a.id === item.accountId)?.treasuryId), name(categories, item.categoryId), amount.toFixed(2).replace('.', ','), statusLabel(item.status, type)]);
    const metadata = [['Relatório financeiro'], ['Empresa', companyName], ['Período', periodLabel], ['Situação', statusNames[status]], ['Tipo', kind === 'all' ? 'Receitas e despesas' : kind === 'income' ? 'Receitas' : 'Despesas'], ['Conta / Caixa', accountId === 'all' ? 'Todas' : name(accounts, accountId)], ['Tesouraria', treasuryId === 'all' ? 'Todas' : name(treasuries, treasuryId)], ['Centro de custo', costCenterId === 'all' ? 'Todos' : name(costCenters, costCenterId)], ['Busca', search], ['Recebido', received.toFixed(2).replace('.', ',')], ['Pago', paid.toFixed(2).replace('.', ',')], ['A receber', receivable.toFixed(2).replace('.', ',')], ['A pagar', payable.toFixed(2).replace('.', ',')], []];
    const blob = new Blob(['\uFEFF' + [...metadata, headers, ...data].map(row => row.map(csvCell).join(';')).join('\r\n')], {type: 'text/csv;charset=utf-8'});
    const url = URL.createObjectURL(blob), link = document.createElement('a');
    link.href = url; link.download = `relatorio_${range.start || 'inicio'}_${range.end || 'fim'}_${status}.csv`;
    document.body.appendChild(link); link.click(); link.remove(); URL.revokeObjectURL(url);
  }
  const inputClass = 'w-full rounded-xl border border-slate-200 bg-white px-3 py-2 text-sm text-slate-800';
  return <section className="space-y-5" id="financial-report">
    <div className="flex flex-wrap justify-between gap-3"><div><h2 className="flex items-center gap-2 text-2xl font-bold text-slate-900"><BarChart3 className="text-indigo-600" />Relatórios financeiros</h2><p className="mt-1 text-sm text-slate-500">Escolha o período e acompanhe valores realizados e em aberto.</p>{companyName && <p className="mt-1 text-sm font-semibold text-indigo-700">{companyName}</p>}</div>
      <div className="flex items-center gap-2 print:hidden"><button onClick={() => window.print()} disabled={invalidRange} className="flex items-center gap-2 rounded-xl border bg-white px-4 py-2 text-sm"><Printer size={16} />Imprimir / PDF</button><button onClick={exportReport} disabled={invalidRange} className="flex items-center gap-2 rounded-xl bg-indigo-600 px-4 py-2 text-sm font-bold text-white disabled:opacity-50"><Download size={16} />Exportar relatório</button></div></div>
    <div className="rounded-2xl border border-slate-200 bg-white p-5 print:hidden"><div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-4">
      <label className="space-y-1 text-xs font-semibold text-slate-600">Período<select aria-label="Período" value={preset} onChange={e => choosePeriod(e.target.value)} className={inputClass}><option value="month">Mês selecionado</option><option value="quarter">Últimos 3 meses</option><option value="year">Ano selecionado</option><option value="all">Todo o histórico</option><option value="custom">Personalizado</option></select></label>
      <label className="space-y-1 text-xs font-semibold text-slate-600">Data inicial<input aria-label="Data inicial" type="date" value={range.start} onChange={e => {setPreset('custom'); setRange({...range, start: e.target.value});}} className={inputClass} /></label>
      <label className="space-y-1 text-xs font-semibold text-slate-600">Data final<input aria-label="Data final" type="date" value={range.end} onChange={e => {setPreset('custom'); setRange({...range, end: e.target.value});}} className={inputClass} /></label>
      <label className="space-y-1 text-xs font-semibold text-slate-600">Situação<select aria-label="Situação do relatório" value={status} onChange={e => setStatus(e.target.value as ReportFilters['status'])} className={inputClass}>{Object.entries(statusNames).map(([value, label]) => <option key={value} value={value}>{label}</option>)}</select></label>
      <label className="space-y-1 text-xs font-semibold text-slate-600">Tipo<select aria-label="Tipo do relatório" value={kind} onChange={e => setKind(e.target.value as ReportFilters['kind'])} className={inputClass}><option value="all">Receitas e despesas</option><option value="income">Receitas</option><option value="expense">Despesas</option></select></label>
      <label className="space-y-1 text-xs font-semibold text-slate-600">Conta / Caixa<select aria-label="Conta / Caixa" value={accountId} onChange={e => setAccountId(e.target.value)} className={inputClass}><option value="all">Todas as contas e caixas</option>{accounts.map(a => <option key={a.id} value={a.id}>{a.name}</option>)}</select></label>
      <label className="space-y-1 text-xs font-semibold text-slate-600">Centro de custo<select aria-label="Centro de custo do relatório" value={costCenterId} onChange={e => setCostCenterId(e.target.value)} className={inputClass}><option value="all">Todos os centros</option>{costCenters.map(c => <option key={c.id} value={c.id}>{c.name}</option>)}</select></label>
      <label className="space-y-1 text-xs font-semibold text-slate-600">Tesouraria<select aria-label="Tesouraria do relatório" value={treasuryId} onChange={e => setTreasuryId(e.target.value)} className={inputClass}><option value="all">Todas as tesourarias</option>{treasuries.map(t => <option key={t.id} value={t.id}>{t.name}</option>)}</select></label>
    </div><input aria-label="Buscar no relatório" value={search} onChange={e => setSearch(e.target.value)} placeholder="Buscar descrição, cliente, fornecedor ou centro..." className={`${inputClass} mt-4`} />{invalidRange && <p role="alert" className="mt-3 text-sm text-rose-600">A data final deve ser igual ou posterior à data inicial.</p>}</div>
    <p className="text-xs text-slate-500">{periodLabel} · {statusNames[status]} · {rows.length} lançamentos. Período pela data de vencimento. Conta: {accountId === "all" ? "Todas" : name(accounts, accountId)}. Tesouraria: {treasuryId === "all" ? "Todas" : name(treasuries, treasuryId)}. Centro: {costCenterId === "all" ? "Todos" : name(costCenters, costCenterId)}. {costCenterId !== 'all' && 'Valores correspondentes somente aos produtos destinados ao centro selecionado.'}</p>
    <div className="grid grid-cols-2 gap-3 lg:grid-cols-4">{[["Recebido", received, 'text-emerald-700'], ["Pago", paid, 'text-rose-700'], ["A receber", receivable, 'text-amber-700'], ["A pagar", payable, 'text-amber-700']].map(([label, value, color]) => <div key={String(label)} className="rounded-2xl border border-slate-200 bg-white p-4"><p className="text-xs font-semibold text-slate-500">{label}</p><p className={`mt-2 text-xl font-bold ${color}`}>{formatCurrency(Number(value))}</p></div>)}</div>
    <div className="flex flex-wrap gap-5 rounded-xl bg-indigo-50 p-4 text-sm text-indigo-900"><span>Resultado realizado: <b>{formatCurrency(received - paid)}</b></span><span>Resultado previsto: <b>{formatCurrency(received + receivable - paid - payable)}</b></span></div>
    {chartData.length > 0 && <div className="rounded-2xl border bg-white p-5 print:hidden"><h3 className="mb-4 text-sm font-bold">Evolução no período</h3><div className="h-64"><ResponsiveContainer width="100%" height="100%"><BarChart data={chartData}><CartesianGrid strokeDasharray="3 3" /><XAxis dataKey="name" /><YAxis /><Tooltip formatter={(v: number) => formatCurrency(v)} /><Legend /><Bar dataKey="Recebido" fill="#059669" /><Bar dataKey="Pago" fill="#e11d48" /><Bar dataKey="A receber" fill="#84cc16" /><Bar dataKey="A pagar" fill="#f59e0b" /></BarChart></ResponsiveContainer></div></div>}
    <div className="overflow-x-auto rounded-2xl border bg-white"><table className="w-full text-left text-xs"><thead className="bg-slate-50 text-slate-500"><tr>{['Vencimento', 'Tipo / Descrição', 'Cliente / Fornecedor', 'Centro de custo', 'Conta / Caixa', 'Valor', 'Situação'].map(h => <th key={h} className="p-3">{h}</th>)}</tr></thead><tbody>{rows.map(({item, kind: type, amount}) => <tr key={`${type}-${item.id}`} className="border-t border-slate-100"><td className="whitespace-nowrap p-3">{formatDateBR(item.date)}</td><td className="p-3"><span className="block text-slate-500">{type === 'income' ? 'Receita' : 'Despesa'}</span><b>{item.description}</b></td><td className="p-3">{name(contacts, item.contactId) || '—'}</td><td className="p-3">{centerNames(item) || '—'}</td><td className="p-3">{name(accounts, item.accountId) || 'Não definida'}</td><td className={`whitespace-nowrap p-3 font-bold ${type === 'income' ? 'text-emerald-700' : 'text-rose-700'}`}>{formatCurrency(amount)}</td><td className="whitespace-nowrap p-3"><span className={`rounded-full px-2 py-1 ${isOpen(item.status) ? 'bg-amber-50 text-amber-800' : 'bg-slate-100 text-slate-700'}`}>{statusLabel(item.status, type)}</span></td></tr>)}</tbody></table>{!rows.length && <p className="p-8 text-center text-sm text-slate-500">Nenhum lançamento encontrado para estes filtros.</p>}</div>
  </section>;
};
