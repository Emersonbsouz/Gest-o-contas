import { expect, test } from 'vitest';
import { buildCardInstallments } from './cardInstallments';
import { getCardInvoices } from './cardInvoices';
const card = {id:'card', name:'Cartão', brand:'visa' as const, limit:1000, closingDay:20, dueDay:5, color:'#000'};
const base = {description:'Compra', amount:200, date:'2026-10-21', categoryId:'cat', paymentMethod:'credit_card' as const, cardId:'card', status:'paid' as const};
test('two installments create separate monthly invoices after closing, preserving purchase date', () => {
 const items = buildCardInstallments(base, card, 2, 'total');
 expect(items.map(i=>i.amount)).toEqual([100,100]);
 expect(items.map(i=>i.invoiceDueDate)).toEqual(['2026-12-05','2027-01-05']);
 expect(items.every(i=>i.purchaseDate===base.date && i.status==='pending' && !i.settlementDate && !i.accountId)).toBe(true);
 const invoices = getCardInvoices(card.id, items.map((i,n)=>({...i,id:String(n),createdAt:1})));
 expect(invoices.map(i=>i.amount)).toEqual([100,100]);
});
test('due dates recover day 31 after February and amounts conserve cents and cost allocations', () => {
 const items = buildCardInstallments({...base,date:'2026-01-01',amount:100,splits:[{id:'s',categoryId:'cat',costCenterId:'cc',amount:100}]}, {...card,closingDay:10,dueDay:31},3,'total');
 expect(items.map(i=>i.date)).toEqual(['2026-01-31','2026-02-28','2026-03-31']);
 expect(items.map(i=>i.amount)).toEqual([33.34,33.33,33.33]);
 expect(items.reduce((n,i)=>n+Math.round(i.splits![0].amount*100),0)).toBe(10000);
 expect(items.map(i=>i.installments)).toEqual([{current:1,total:3},{current:2,total:3},{current:3,total:3}]);
});
test('per installment mode preserves each value and invalid count is rejected', () => {
 expect(buildCardInstallments(base,card,2,'each').map(i=>i.amount)).toEqual([200,200]);
 expect(()=>buildCardInstallments(base,card,0,'total')).toThrow();
 expect(()=>buildCardInstallments({...base,amount:0.01},card,2,'total')).toThrow();
});
