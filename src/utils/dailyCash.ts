import type { TreasuryAccount, Income, Expense, AccountTransfer } from '../types';
import { isSettled } from './financialStatus';

export function validCalendarDate(value: string) {
  if (!/^\d{4}-\d{2}-\d{2}$/.test(value)) return false;
  const parsed = new Date(value + 'T12:00:00Z');
  return !Number.isNaN(parsed.getTime()) && parsed.toISOString().slice(0,10) === value;
}

export function localToday() {
  const now = new Date();
  return `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, '0')}-${String(now.getDate()).padStart(2, '0')}`;
}

export function dailyCashSummary(account: TreasuryAccount, date: string, incomes: Income[], expenses: Expense[], transfers: AccountTransfer[]) {
  const receipts = incomes.filter(i => i.accountId === account.id && isSettled(i.status));
  const payments = expenses.filter(e => e.accountId === account.id && isSettled(e.status) && e.paymentMethod !== 'credit_card');
  const movements = [
    ...(account.openingDate && account.initialBalance !== 0 ? [{id:'opening:' + account.id, date:account.openingDate, description:'Entrada de abertura — ' + account.name, amount:account.initialBalance, kind:'opening' as const}] : []),
    ...receipts.map(i => ({id:`income:${i.id}`,date:i.settlementDate || i.date,description:i.description,amount:i.amount,kind:'income' as const})),
    ...payments.map(e => ({id:`expense:${e.id}`,date:e.settlementDate || e.date,description:e.description,amount:-e.amount,kind:'expense' as const})),
    ...transfers.filter(t => t.toAccountId === account.id && t.fromAccountId !== account.id).map(t => ({id:`transfer-in:${t.id}`,date:t.date,description:t.description,amount:t.amount,kind:'transferIn' as const})),
    ...transfers.filter(t => t.fromAccountId === account.id && t.toAccountId !== account.id).map(t => ({id:`transfer-out:${t.id}`,date:t.date,description:t.description,amount:-t.amount,kind:'transferOut' as const})),
  ].sort((a,b) => a.date.localeCompare(b.date) || (a.kind === 'opening' ? -1 : b.kind === 'opening' ? 1 : 0) || a.id.localeCompare(b.id));
  const round = (value: number) => Math.round((value + Number.EPSILON) * 100) / 100;
  const openingBalance = round((account.openingDate ? 0 : account.initialBalance) + movements.filter(m => m.date < date).reduce((sum,m) => sum + m.amount,0));
  const daily = movements.filter(m => m.date === date);
  const total = (kind: typeof daily[number]['kind']) => round(Math.abs(daily.filter(m => m.kind === kind).reduce((sum,m) => sum + m.amount,0)));
  // Includes opening history: edits to earlier days can also change this closing.
  const movementSignature = JSON.stringify([account.initialBalance, ...(account.openingDate ? [account.openingDate] : []), ...movements.filter(m => m.date <= date)]);
  return {openingBalance, incomeTotal:round(total('income') + daily.filter(m => m.kind === 'opening' && m.amount > 0).reduce((sum,m) => sum + m.amount,0)),expenseTotal:round(total('expense') + Math.abs(daily.filter(m => m.kind === 'opening' && m.amount < 0).reduce((sum,m) => sum + m.amount,0))),transferIn:total('transferIn'),transferOut:total('transferOut'),
    expectedBalance:round(openingBalance + daily.reduce((sum,m) => sum + m.amount,0)), movementCount:daily.length, movementSignature, movements:daily};
}
