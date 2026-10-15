
import { webcrypto } from 'node:crypto';
import { act, cleanup, renderHook, waitFor } from '@testing-library/react';
import { afterEach, beforeEach, expect, test, vi } from 'vitest';
import { useCompanyData } from './useCompanyData';
import { calculateAccountBalances } from '../utils/treasuryHelpers';
import { getCardSummary } from '../utils/cardSummary';
const db=vi.hoisted(()=>({rows:new Map<string,any[]>(),insert:vi.fn()}));
vi.mock('../services/companyService',()=>({
 subscribeToCompanySubcollection:vi.fn((company:string,collection:string,onRead:(v:any[])=>void)=>{onRead(db.rows.get(collection)||[]);return ()=>{};}),
 loadCompanySubcollection:vi.fn(async (_company:string,collection:string)=>db.rows.get(collection)||[]),
 createCompanyDoc:vi.fn(async (_company:string,collection:string,id:string,payload:any)=>{
  await db.insert();
  const rows=db.rows.get(collection)||[];
  if(rows.some(r=>r.id===id))throw Error('Duplicado');
  db.rows.set(collection,[...rows,payload]);
 }),
 saveCompanyDoc:vi.fn(),updateCompanyDoc:vi.fn(),deleteCompanyDoc:vi.fn(),clearCompanyData:vi.fn(),
}));
beforeEach(()=>{
 vi.clearAllMocks();localStorage.clear();db.rows.clear();db.insert.mockResolvedValue(undefined);vi.stubGlobal('crypto',webcrypto);
 db.rows.set('accounts',[{id:'bank',name:'Banco',type:'checking',initialBalance:1000,color:'#000'}]);
 db.rows.set('cards',[{id:'card',name:'Cartão',brand:'visa',limit:1000,closingDay:25,dueDay:5,color:'#000'}]);
 db.rows.set('expenses',[{id:'e',description:'Compra',amount:100,date:'2026-10-10',categoryId:'food',paymentMethod:'credit_card',cardId:'card',status:'pending',createdAt:1}]);
});
afterEach(()=>{cleanup();vi.unstubAllGlobals();});
test('one immutable payment persists, releases limit and debits account, then blocks duplicate and deletion',async()=>{
 const {result}=renderHook(()=>useCompanyData('company'));
 await waitFor(()=>expect(result.current.cards).toHaveLength(1));
 await act(async()=>{await result.current.payCardInvoice('card','2026-11-05','bank','2026-10-10');});
 expect(db.rows.get('cardPayments')).toHaveLength(1);
 expect(result.current.expenses[0].status).toBe('paid');
 expect(getCardSummary('card',result.current.expenses,[]).outstanding).toBe(0);
 expect(calculateAccountBalances(result.current.accounts,[],result.current.expenses,[]).bank).toBe(900);
 await expect(result.current.payCardInvoice('card','2026-11-05','bank','2026-10-10')).rejects.toThrow('Não há saldo');
 await expect(result.current.deleteExpense('e')).rejects.toThrow('fatura paga');
 expect(db.rows.get('cardPayments')).toHaveLength(1);
});
test('failed persistence never releases limit or debits cash',async()=>{
 db.insert.mockRejectedValueOnce(new Error('Falha ao salvar'));
 const {result}=renderHook(()=>useCompanyData('company'));
 await waitFor(()=>expect(result.current.cards).toHaveLength(1));
 await act(async()=>{await expect(result.current.payCardInvoice('card','2026-11-05','bank','2026-10-10')).rejects.toThrow('Falha ao salvar');});
 expect(result.current.cardPayments).toHaveLength(0);
 expect(result.current.expenses[0].status).toBe('pending');
 expect(getCardSummary('card',result.current.expenses,[]).outstanding).toBe(100);
 expect(calculateAccountBalances(result.current.accounts,[],result.current.expenses,[]).bank).toBe(1000);
});
test('invalid payment account is rejected before writing',async()=>{
 const {result}=renderHook(()=>useCompanyData('company'));
 await waitFor(()=>expect(result.current.cards).toHaveLength(1));
 await expect(result.current.payCardInvoice('card','2026-11-05','missing','2026-10-10')).rejects.toThrow('conta de pagamento');
 expect(db.insert).not.toHaveBeenCalled();
});

test('two partial payments release only paid amounts and ultimately close the invoice',async()=>{
 const {result}=renderHook(()=>useCompanyData('company'));
 await waitFor(()=>expect(result.current.cards).toHaveLength(1));
 await act(async()=>{await result.current.payCardInvoice('card','2026-11-05','bank','2026-10-10',{expenseIds:['e'],amount:40,expectedBalance:100});});
 expect(getCardSummary('card',result.current.expenses,[]).outstanding).toBe(60);
 expect(calculateAccountBalances(result.current.accounts,[],result.current.expenses,[]).bank).toBe(960);
 await act(async()=>{await result.current.payCardInvoice('card','2026-11-05','bank','2026-10-10',{expenseIds:['e'],amount:60,expectedBalance:60});});
 expect(result.current.cardPayments).toHaveLength(2);
 expect(getCardSummary('card',result.current.expenses,[]).outstanding).toBe(0);
 expect(result.current.expenses.reduce((n,e)=>n+e.amount,0)).toBe(100);
 expect(calculateAccountBalances(result.current.accounts,[],result.current.expenses,[]).bank).toBe(900);
});
test.each([0,-1,101,NaN])('rejects invalid payment amount %s',async amount=>{
 const {result}=renderHook(()=>useCompanyData('company'));
 await waitFor(()=>expect(result.current.cards).toHaveLength(1));
 await expect(result.current.payCardInvoice('card','2026-11-05','bank','2026-10-10',{expenseIds:['e'],amount,expectedBalance:100})).rejects.toThrow('pagamento deve');
 expect(db.insert).not.toHaveBeenCalled();
});
test('only selected purchases receive allocations',async()=>{
 db.rows.get('expenses')!.push({...db.rows.get('expenses')![0],id:'other',amount:200});
 const {result}=renderHook(()=>useCompanyData('company'));
 await waitFor(()=>expect(result.current.cards).toHaveLength(1));
 await act(async()=>{await result.current.payCardInvoice('card','2026-11-05','bank','2026-10-10',{expenseIds:['other'],amount:80,expectedBalance:200});});
 expect(result.current.cardPayments[0].allocations).toEqual([{expenseId:'other',amount:80}]);
 expect(result.current.expenses.find(e=>e.id==='e')!.amount).toBe(100);
 expect(getCardSummary('card',result.current.expenses,[]).outstanding).toBe(220);
});
test('a paid purchase on credit card becomes invoice debt and does not debit cash',async()=>{
 const {result}=renderHook(()=>useCompanyData('company'));
 await waitFor(()=>expect(result.current.cards).toHaveLength(1));
 await act(async()=>{await result.current.saveExpense({description:'Compra paga ao fornecedor',amount:50,date:'2026-10-10',categoryId:'food',paymentMethod:'credit_card',cardId:'card',status:'paid'});});
 const purchase=result.current.expenses.find(e=>e.description==='Compra paga ao fornecedor')!;
 expect(purchase.status).toBe('pending');expect(purchase.purchaseStatus).toBe('paid');
 expect(purchase.date).toBe('2026-11-05');
 expect(calculateAccountBalances(result.current.accounts,[],result.current.expenses,[]).bank).toBe(1000);
 expect(getCardSummary('card',result.current.expenses,[]).outstanding).toBe(150);
});
test('stale selected balance cannot be paid silently',async()=>{
 const {result}=renderHook(()=>useCompanyData('company'));
 await waitFor(()=>expect(result.current.cards).toHaveLength(1));
 await expect(result.current.payCardInvoice('card','2026-11-05','bank','2026-10-10',{expenseIds:['e'],amount:40,expectedBalance:90})).rejects.toThrow('saldo mudou');
 expect(db.insert).not.toHaveBeenCalled();
});

test('editing a fully paid purchase changes description without reopening the invoice or moving cash',async()=>{
 const {result}=renderHook(()=>useCompanyData('company'));
 await waitFor(()=>expect(result.current.cards).toHaveLength(1));
 await act(async()=>{await result.current.payCardInvoice('card','2026-11-05','bank','2026-10-10');});
 const original=result.current.getExpenseForEditing('e')!;
 await act(async()=>{await result.current.saveExpense({...original,date:original.purchaseDate||original.date,description:'Compra corrigida'},'e');});
 expect(result.current.expenses[0].description).toBe('Compra corrigida');
 expect(getCardSummary('card',result.current.expenses,[]).outstanding).toBe(0);
 expect(calculateAccountBalances(result.current.accounts,[],result.current.expenses,[]).bank).toBe(900);
});
test('editing paid purchase value retains settled amount and adds only the difference to invoice',async()=>{
 const {result}=renderHook(()=>useCompanyData('company'));
 await waitFor(()=>expect(result.current.cards).toHaveLength(1));
 await act(async()=>{await result.current.payCardInvoice('card','2026-11-05','bank','2026-10-10');});
 const original=result.current.getExpenseForEditing('e')!;
 await act(async()=>{await result.current.saveExpense({...original,date:original.purchaseDate||original.date,amount:120},'e');});
 expect(getCardSummary('card',result.current.expenses,[]).outstanding).toBe(20);
 expect(calculateAccountBalances(result.current.accounts,[],result.current.expenses,[]).bank).toBe(900);
 await expect(result.current.saveExpense({...original,date:original.purchaseDate||original.date,amount:80},'e')).rejects.toThrow('abaixo');
});
