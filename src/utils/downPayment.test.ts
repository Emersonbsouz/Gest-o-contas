import {expect,test} from 'vitest';
import {buildDownPaymentPlan} from './downPayment';
import {dailyCashSummary} from './dailyCash';
import {getCardInvoices} from './cardInvoices';
import type {Expense,Income} from '../types';
const base={description:'Compra',amount:1000,date:'2026-11-05',entryDate:'2026-10-28',categoryId:'cat',paymentMethod:'pix' as const,accountId:'bank'};
const options={amount:200,date:'2026-10-28',accountId:'bank',paymentMethod:'pix' as const,count:2};
test('entry and open installments conserve the total and only entry moves cash',()=>{
 const plan=buildDownPaymentPlan(base,options);
 expect(plan.map(i=>i.amount)).toEqual([200,400,400]);
 expect(plan.map(i=>i.date)).toEqual(['2026-10-28','2026-11-05','2026-12-05']);
 expect(plan.map(i=>i.status)).toEqual(['paid','pending','pending']);
 expect(plan[0]).toMatchObject({isDownPayment:true,settlementDate:options.date,accountId:'bank'});
 expect(plan.slice(1).every(i=>!i.settlementDate)).toBe(true);
 const account={id:'bank',name:'Banco',type:'checking' as const,initialBalance:1000,color:'#000'};
 const expenses=plan.map((i,n)=>({...i,id:String(n),createdAt:1}));
 expect(dailyCashSummary(account,options.date,[],expenses,[])).toMatchObject({expenseTotal:200,expectedBalance:800,movementCount:1});
 const incomes=expenses.map(i=>({...i,accountId:i.accountId||''})) as Income[];
 expect(dailyCashSummary(account,options.date,incomes,[],[])).toMatchObject({incomeTotal:200,expectedBalance:1200,movementCount:1});
});
test('credit card finances only the remainder while entry is settled outside the invoice',()=>{
 const card={id:'card',name:'Cartão',brand:'visa' as const,limit:5000,closingDay:20,dueDay:5,color:'#000'};
 const plan=buildDownPaymentPlan({...base,date:'2026-10-28',paymentMethod:'credit_card',cardId:'card'}, {...options,card});
 expect(plan[0].cardId).toBeUndefined();
 const invoices=getCardInvoices('card',plan.map((i,n)=>({...i,id:String(n),createdAt:1})));
 expect(invoices.map(i=>i.amount)).toEqual([400,400]);
 expect(invoices.map(i=>i.dueDate)).toEqual(['2026-12-05','2027-01-05']);
});
test('cost allocations and rounding conserve each product across entry and remainder',()=>{
 const plan=buildDownPaymentPlan({...base,amount:100,splits:[{id:'a',categoryId:'cat',costCenterId:'a',amount:33.33},{id:'b',categoryId:'cat',costCenterId:'b',amount:66.67}]},{...options,amount:20.01,count:3});
 expect(plan.reduce((n,i)=>n+Math.round(i.amount*100),0)).toBe(10000);
 for(const id of ['a','b'])expect(plan.reduce((n,i)=>n+i.splits!.filter(s=>s.id===id).reduce((sum,s)=>sum+Math.round(s.amount*100),0),0)).toBe(id==='a'?3333:6667);
 expect(plan.every(i=>Math.round(i.amount*100)===i.splits!.reduce((n,s)=>n+Math.round(s.amount*100),0))).toBe(true);
});
test.each([0,-1,1000,1001,NaN])('reject invalid entry %s before generating records',amount=>{
 expect(()=>buildDownPaymentPlan(base,{...options,amount})).toThrow();
});
test('reject entry without valid date or account and balance before entry',()=>{
 expect(()=>buildDownPaymentPlan(base,{...options,accountId:''})).toThrow();
 expect(()=>buildDownPaymentPlan(base,{...options,date:'2026-02-30'})).toThrow();
 expect(()=>buildDownPaymentPlan({...base,date:'2026-10-01'},options)).toThrow();
});


test('custom amounts and dates preserve every product allocation and total',()=>{
 const plan=buildDownPaymentPlan({...base,splits:[{id:'a',categoryId:'cat',costCenterId:'a',amount:350},{id:'b',categoryId:'cat',costCenterId:'b',amount:650}]},
 {...options,overrides:{0:{amount:300,date:'2026-11-09'},1:{amount:500,date:'2026-12-19'}}});
 expect(plan.map(i=>i.amount)).toEqual([200,300,500]);
 expect(plan.map(i=>i.date)).toEqual(['2026-10-28','2026-11-09','2026-12-19']);
 for(const id of ['a','b'])expect(plan.reduce((n,i)=>n+i.splits!.filter(s=>s.id===id).reduce((sum,s)=>sum+Math.round(s.amount*100),0),0)).toBe(id==='a'?35000:65000);
 expect(plan.every(i=>Math.round(i.amount*100)===i.splits!.reduce((n,s)=>n+Math.round(s.amount*100),0))).toBe(true);
});
test('custom dates are used as boleto due dates and card invoice dates',()=>{
 const overrides={0:{date:'2026-11-09'},1:{date:'2026-12-19'}};
 const boletos=buildDownPaymentPlan({...base,paymentMethod:'boleto'}, {...options,overrides});
 expect(boletos.slice(1).map(i=>i.billetData?.dueDate)).toEqual(['2026-11-09','2026-12-19']);
 const card={id:'c',name:'Cartão',brand:'visa' as const,limit:5000,closingDay:20,dueDay:5,color:'#000'};
 const cards=buildDownPaymentPlan({...base,paymentMethod:'credit_card',cardId:'c'}, {...options,card,overrides});
 expect(cards.slice(1).map(i=>i.invoiceDueDate)).toEqual(['2026-11-09','2026-12-19']);
});
test('invalid custom totals, values and dates are rejected',()=>{
 expect(()=>buildDownPaymentPlan(base,{...options,overrides:{0:{amount:300}}})).toThrow('soma das parcelas');
 expect(()=>buildDownPaymentPlan(base,{...options,overrides:{0:{amount:0},1:{amount:800}}})).toThrow('maior que zero');
 expect(()=>buildDownPaymentPlan(base,{...options,overrides:{0:{date:'2026-02-30'}}})).toThrow('vencimento');
 expect(()=>buildDownPaymentPlan(base,{...options,overrides:{0:{date:'2026-10-01'}}})).toThrow('anterior');
});
