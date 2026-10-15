
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
