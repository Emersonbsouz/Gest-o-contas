import { expect, test } from 'vitest';
import type { Income, Expense, TreasuryAccount } from '../types';
import { csvCell, monthRange, reportRows, ReportFilters } from './financialReports';
import { calculateAccountBalances, getTreasuryMonthSummary, getTreasuryCashflowHistory } from './treasuryHelpers';
import { isOpen, isSettled } from './financialStatus';

const income = (id: string, date: string, status: Income['status'], amount = 100): Income => ({id, date, status, amount, description:id, accountId:'cash', categoryId:'sales', createdAt:1});
const expense = (id: string, status: Expense['status'], amount = 40): Expense => ({id, date:'2026-01-31', status, amount, description:id, accountId:'cash', categoryId:'cost', paymentMethod:'cash', createdAt:1});
const filters: ReportFilters = {start:'2026-01-01',end:'2026-03-31',status:'all',kind:'all',accountId:'all',costCenterId:'all',search:''};
test('inclusive multi-month reports distinguish settled, overdue, pending and cancelled records', () => {
  const incomes = [income('start','2026-01-01','PAGO'),income('end','2026-03-31','pending'),income('outside','2026-04-01','paid'),income('cancelled','2026-02-01','CANCELADO')];
  const expenses = [expense('overdue','VENCIDO'),expense('paid','liquidated'),expense('draft','draft')];
  expect(reportRows(incomes,expenses,filters).map(r => r.item.id)).toEqual(['start','draft','overdue','paid','end']);
  expect(reportRows(incomes,expenses,{...filters,status:'open'}).map(r => r.item.id)).toEqual(['draft','overdue','end']);
  expect(reportRows(incomes,expenses,{...filters,status:'settled'}).map(r => r.item.id)).toEqual(['start','paid']);
  expect(reportRows(incomes,expenses,{...filters,status:'cancelled'}).map(r => r.item.id)).toEqual(['cancelled']);
});
test('report filters include split centers and associated names without duplicating a transaction', () => {
  const e = {...expense('purchase','pending'),splits:[{id:'s1',costCenterId:'a',amount:20,categoryId:'cost'},{id:'s2',costCenterId:'b',amount:20,categoryId:'cost'}]};
  expect(reportRows([], [e], {...filters,costCenterId:'b',search:'Fornecedor'}, () => 'Fornecedor Beta')).toHaveLength(1);
  expect(reportRows([], [e], {...filters,accountId:'other'})).toHaveLength(0);
});
test('pending receipts and payments do not move cash and internal transfers preserve consolidated balance', () => {
  const accounts: TreasuryAccount[] = [{id:'cash',name:'Caixa',type:'cash',color:'#123456',initialBalance:50},{id:'bank',name:'Banco',type:'checking',color:'#123456',initialBalance:0}];
  const incomes = [income('paid','2026-01-01','paid'),income('open','2026-01-01','pending',500),income('cancelled','2026-01-01','cancelled',900),{...income('unassigned','2026-01-01','paid',999),accountId:'missing'}];
  const expenses = [expense('paid','PAGO'),expense('open','PENDENTE',700),expense('overdue','overdue',200)];
  const transfers = [{id:'t',fromAccountId:'cash',toAccountId:'bank',amount:30,date:'2026-01-02',description:'Depositar',createdAt:1}];
  expect(calculateAccountBalances(accounts,incomes,expenses,transfers)).toEqual({cash:80,bank:30});
  const summary = getTreasuryMonthSummary(accounts,incomes.slice(0,3),expenses,transfers,'2026-01');
  expect(summary.monthInflow).toBe(100); expect(summary.monthOutflow).toBe(40);
  expect(getTreasuryCashflowHistory(incomes.slice(0,3),expenses,'2026-01',1)[0].net).toBe(60);
});
test('legacy records without status remain settled and open states include Portuguese aliases', () => {
  expect(isSettled(undefined)).toBe(true); expect(isOpen('VENCIDO')).toBe(true); expect(isOpen('approved')).toBe(true); expect(isOpen('rejected')).toBe(false);
});

test('treasury cashflow uses the payment date for an old settled invoice', () => {
 const paid={...expense('old invoice','paid',80),settlementDate:'2026-10-04'};
 expect(getTreasuryMonthSummary([],[],[paid],[],'2026-10').monthOutflow).toBe(80);
 expect(getTreasuryMonthSummary([],[],[paid],[],'2026-01').monthOutflow).toBe(0);
 expect(getTreasuryCashflowHistory([],[paid],'2026-10',1)[0].outflow).toBe(80);
});
test('month ranges include leap years and exports quote separators, line breaks and formula text', () => {
  expect(monthRange('2024-02')).toEqual({start:'2024-02-01',end:'2024-02-29'});
  expect(csvCell('Fornecedor; "A"\nB')).toBe('"Fornecedor; ""A""\nB"');
  expect(csvCell('=1+1')).toBe('"\'=1+1"');
});

test('a center report includes only its products and never mutates the original expense', () => {
 const e={...expense('purchase','pending',120),costCenterId:'stale',splits:[{id:'one',description:'Cimento',amount:80,costCenterId:'a',categoryId:'cost'},{id:'two',description:'Areia',amount:40,costCenterId:'b',categoryId:'cost'}]};
 expect(reportRows([],[e],{...filters,costCenterId:'a'})[0].amount).toBe(80);
 expect(reportRows([],[e],{...filters,costCenterId:'b'})[0].amount).toBe(40);
 expect(reportRows([],[e],{...filters,costCenterId:'stale'})).toEqual([]);
 expect(reportRows([],[e],filters)[0].amount).toBe(120);
 expect(reportRows([],[e],{...filters,search:'Cimento'})).toHaveLength(1);expect(e.amount).toBe(120);
});
