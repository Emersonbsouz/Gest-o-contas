
import { expect, test } from 'vitest';
import { invoiceDueDate, invoiceExpenses, getCardInvoices, validatePaidPurchaseEdit } from './cardInvoices';
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

test('partial payments preserve category totals, unpaid remainder and separate account debits',()=>{
 const purchase={...buy('a','2026-10-10',100),splits:[{id:'s1',costCenterId:'p1',amount:60,categoryId:'food'},{id:'s2',costCenterId:'p2',amount:40,categoryId:'food'}]};
 const first:CardInvoicePayment={id:'p1',cardId:'card',dueDate:'2026-11-05',accountId:'bank',paymentDate:'2026-10-12',amount:30,expenseIds:['a'],allocations:[{expenseId:'a',amount:30}],createdAt:2};
 const effective=invoiceExpenses([purchase],[card],[first]);
 expect(effective.reduce((n,e)=>n+e.amount,0)).toBe(100);
 expect(getCardSummary('card',effective,[]).outstanding).toBe(70);
 expect(getCardInvoices('card',effective)[0].amount).toBe(70);
 expect(effective.reduce((n,e)=>n+(e.splits?.reduce((s,v)=>s+v.amount,0)||0),0)).toBe(100);
 const account={id:'bank',name:'Bank',type:'checking' as const,initialBalance:1000,color:'#000'};
 expect(calculateAccountBalances([account],[],effective,[]).bank).toBe(970);
 const second:CardInvoicePayment={...first,id:'p2',accountId:'other',amount:70,allocations:[{expenseId:'a',amount:70}],createdAt:3};
 const settled=invoiceExpenses([purchase],[card],[first,second]);
 expect(getCardSummary('card',settled,[]).outstanding).toBe(0);
 expect(settled.reduce((n,e)=>n+e.amount,0)).toBe(100);
 expect(calculateAccountBalances([account,{...account,id:'other'}],[],settled,[])).toEqual({bank:970,other:930});
});

test('paid purchase metadata may change while settled allocations remain protected',()=>{
 const original={...buy('a','2026-10-10',100),purchaseDate:'2026-10-10',date:'2026-11-05',invoiceDueDate:'2026-11-05'};
 const payment:CardInvoicePayment={id:'p',cardId:'card',dueDate:'2026-11-05',accountId:'bank',paymentDate:'2026-10-10',amount:40,expenseIds:['a'],allocations:[{expenseId:'a',amount:40}],createdAt:1};
 const data={...original,date:'2026-10-10',description:'Descrição corrigida'};
 expect(()=>validatePaidPurchaseEdit(original,data,[payment])).not.toThrow();
 expect(()=>validatePaidPurchaseEdit(original,{...data,amount:60},[payment])).not.toThrow();
 expect(()=>validatePaidPurchaseEdit(original,{...data,amount:39.99},[payment])).toThrow('abaixo');
 expect(()=>validatePaidPurchaseEdit(original,{...data,cardId:'outro'},[payment])).toThrow('Preserve');
 expect(()=>validatePaidPurchaseEdit(original,{...data,date:'2026-10-11'},[payment])).toThrow('Preserve');
 expect(()=>validatePaidPurchaseEdit(original,{...data,status:'cancelled'},[payment])).toThrow('cancelar');
 expect(()=>validatePaidPurchaseEdit(original,{...data,amount:120},[{...payment,allocations:undefined}])).toThrow('pagamento antigo');
 expect(()=>validatePaidPurchaseEdit(original,data,[{...payment,allocations:undefined}])).not.toThrow();
});
