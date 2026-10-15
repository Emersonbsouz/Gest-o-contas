
import { expect, test } from 'vitest';
import { invoiceDueDate, invoiceExpenses, getCardInvoices } from './cardInvoices';
import { getCardSummary } from './cardSummary';
import { calculateAccountBalances } from './treasuryHelpers';
import type { CreditCard, Expense, CardInvoicePayment } from '../types';
const card: CreditCard={id:'card',name:'Teste',brand:'visa',limit:1000,closingDay:25,dueDay:5,color:'#000'};
const buy=(id:string,date:string,amount:number):Expense=>({id,date,amount,description:id,createdAt:1,categoryId:'food',paymentMethod:'credit_card',cardId:'card',status:'pending'});
test('closing day is inclusive; next-day purchases move to next invoice with year rollover',()=>{
 expect(invoiceDueDate(card,'2026-10-25')).toBe('2026-11-05');
 expect(invoiceDueDate(card,'2026-10-26')).toBe('2026-12-05');
 expect(invoiceDueDate(card,'2026-12-26')).toBe('2027-02-05');
 expect(invoiceDueDate({...card,closingDay:10,dueDay:20},'2026-10-10')).toBe('2026-10-20');
});
test('dates 29-31 are clamped in short months including leap years',()=>{
 expect(invoiceDueDate({...card,closingDay:31,dueDay:31},'2026-02-28')).toBe('2026-03-31');
 expect(invoiceDueDate({...card,closingDay:31,dueDay:31},'2028-02-29')).toBe('2028-03-31');
});
test('payment releases only its invoice and debits cash exactly once without increasing expenses',()=>{
 const purchases=[buy('a','2026-10-10',100),buy('b','2026-10-26',200)];
 const open=invoiceExpenses(purchases,[card],[]);
 expect(getCardInvoices('card',open).map(i=>i.amount)).toEqual([100,200]);
 const account={id:'bank',name:'Banco',type:'checking' as const,initialBalance:1000,color:'#000'};
 expect(calculateAccountBalances([account],[],open,[]).bank).toBe(1000);
 expect(card.limit-getCardSummary('card',open,[]).outstanding).toBe(700);
 const payment:CardInvoicePayment={id:'p',cardId:'card',dueDate:'2026-11-05',accountId:'bank',paymentDate:'2026-11-04',amount:100,expenseIds:['a'],createdAt:2};
 const paid=invoiceExpenses(purchases,[card],[payment]);
 expect(paid).toHaveLength(2);
 expect(paid.reduce((sum,e)=>sum+e.amount,0)).toBe(300);
 expect(card.limit-getCardSummary('card',paid,[]).outstanding).toBe(800);
 expect(calculateAccountBalances([account],[],paid,[]).bank).toBe(900);
 expect(getCardInvoices('card',paid).map(i=>i.dueDate)).toEqual(['2026-12-05']);
 expect(paid[0].settlementDate).toBe('2026-11-04');
 expect(paid[1].status).toBe('pending');
});
test('new purchases after early payment can reopen the same due date, without settling them',()=>{
 const payment:CardInvoicePayment={id:'p',cardId:'card',dueDate:'2026-11-05',accountId:'bank',paymentDate:'2026-10-20',amount:100,expenseIds:['old'],createdAt:2};
 const effective=invoiceExpenses([buy('old','2026-10-10',100),buy('new','2026-10-21',50)],[card],[payment]);
 expect(getCardInvoices('card',effective)[0].amount).toBe(50);
 expect(getCardSummary('card',effective,[]).outstanding).toBe(50);
});
test('future installments keep consuming limit after the first invoice is paid',()=>{
 const purchases=[buy('1','2026-10-10',100),buy('2','2026-11-10',100),buy('3','2026-12-10',100)];
 const payment:CardInvoicePayment={id:'p',cardId:'card',dueDate:'2026-11-05',accountId:'bank',paymentDate:'2026-11-05',amount:100,expenseIds:['1'],createdAt:2};
 const effective=invoiceExpenses(purchases,[card],[payment]);
 expect(getCardSummary('card',effective,[]).outstanding).toBe(200);
 expect(getCardInvoices('card',effective)).toHaveLength(2);
});
