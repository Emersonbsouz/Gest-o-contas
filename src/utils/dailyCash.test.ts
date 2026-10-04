import { expect, test } from 'vitest';
import { dailyCashSummary, validCalendarDate } from './dailyCash';
import type { Expense, Income, TreasuryAccount } from '../types';
const account: TreasuryAccount = {id:'cash',name:'Loja',type:'cash',initialBalance:100,color:'#123456'};
const expense = (id:string,date:string,amount:number,status:Expense['status']='paid'): Expense => ({id,date,amount,status,description:id,categoryId:'c',paymentMethod:'cash',accountId:'cash',createdAt:1});
const income = (id:string,date:string,amount:number,status:Income['status']='paid'): Income => ({id,date,amount,status,description:id,categoryId:'c',accountId:'cash',createdAt:1});
test('daily closing uses settlement dates and history, excluding pending and credit card payments', () => {
 const summary=dailyCashSummary(account,'2026-10-04',[income('old','2026-10-03',50),income('today','2026-10-04',200),income('pending','2026-10-04',500,'pending')],[expense('before','2026-10-03',30),{...expense('late','2026-07-22',80),settlementDate:'2026-10-04'},{...expense('card','2026-10-04',999),paymentMethod:'credit_card'}],[{id:'in',date:'2026-10-04',fromAccountId:'bank',toAccountId:'cash',amount:40,description:'in',createdAt:1},{id:'out',date:'2026-10-04',fromAccountId:'cash',toAccountId:'bank',amount:10,description:'out',createdAt:1}]);
 expect(summary).toMatchObject({openingBalance:120,incomeTotal:200,expenseTotal:80,transferIn:40,transferOut:10,expectedBalance:270,movementCount:4});
});
test('signature detects prior history changes and ignores future movements', () => {
 const base=dailyCashSummary(account,'2026-10-04',[],[expense('a','2026-10-03',10)],[]);
 expect(dailyCashSummary(account,'2026-10-04',[],[expense('a','2026-10-03',20)],[]).movementSignature).not.toBe(base.movementSignature);
 expect(dailyCashSummary(account,'2026-10-04',[income('future','2026-10-05',200)],[expense('a','2026-10-03',10)],[]).movementSignature).toBe(base.movementSignature);
});
test('calendar validation rejects impossible dates', () => {expect(validCalendarDate('2026-02-30')).toBe(false);expect(validCalendarDate('2024-02-29')).toBe(true);expect(validCalendarDate('')).toBe(false);});
