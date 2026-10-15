
import { expect, test } from 'vitest';
import { getCardSummary, recurringDate } from './cardSummary';
import type { Expense, RecurringBill } from '../types';
const expense = (data: Partial<Expense>): Expense => ({ id: 'e', description:'Compra', date:'2026-10-01', amount:100, createdAt:1, categoryId:'cat', paymentMethod:'credit_card', cardId:'card-a', status:'pending', ...data });
test('debt includes pending future installments but excludes paid, cancelled, draft and other cards', () => {
 const list = [expense({amount:30.10}), expense({amount:20.20,date:'2027-01-10',installments:{current:2,total:3}}), ...['paid','PAGO','liquidated','cancelled','CANCELADO','rejected','draft'].map(status=>expense({status:status as Expense['status']})), expense({cardId:'other'}),expense({paymentMethod:'pix'})];
 const summary = getCardSummary('card-a',list,[]);
 expect(summary.outstanding).toBe(50.3); expect(summary.openExpenses).toHaveLength(2);
});
test('subscription forecast does not double count actual expenses and excludes inactive templates', () => {
 const bill = {id:'s',kind:'subscription',type:'expense',amount:49.9,dueDay:10,categoryId:'cat',cardId:'card-a',active:true,description:'Serviço'} as RecurringBill;
 const summary = getCardSummary('card-a',[expense({amount:49.9})],[bill,{...bill,id:'inactive',active:false},{...bill,id:'other',cardId:'other'},{...bill,id:'fixed',kind:'recurring'}]);
 expect(summary.outstanding).toBe(49.9); expect(summary.monthlySubscriptions).toBe(49.9);
});
test('recurrence retains days 29-31 where valid and clamps only at the end of short months', () => {
 expect(recurringDate('2026-10',31)).toBe('2026-10-31');
 expect(recurringDate('2026-02',31)).toBe('2026-02-28');
 expect(recurringDate('2028-02',31)).toBe('2028-02-29');
 expect(recurringDate('2026-04',31)).toBe('2026-04-30');
});
