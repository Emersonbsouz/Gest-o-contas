import React from 'react';
import {cleanup,fireEvent,render,screen,waitFor} from '@testing-library/react';
import {afterEach,expect,test,vi} from 'vitest';
import {dailyCashSummary,localToday} from '../utils/dailyCash';
import {calculateAccountBalances,getUnifiedTransactions,getTreasuryMonthSummary} from '../utils/treasuryHelpers';
import {DailyCashView} from './DailyCashView';
import {AccountFormModal} from './AccountFormModal';
import {FinancialFormModal} from './FinancialFormModal';
import {DEFAULT_CATEGORIES} from '../data/defaultCategories';
import type {TreasuryAccount,Income,Expense} from '../types';
afterEach(cleanup);
const account:TreasuryAccount={id:'cash',name:'Carteira Loja',type:'cash',initialBalance:100,openingDate:'2026-10-01',color:'#123456'};
const income:Income={id:'i',description:'Venda',amount:50,date:'2026-10-02',settlementDate:'2026-10-02',status:'paid',accountId:'cash',categoryId:'cat',createdAt:1};
const expense:Expense={id:'e',description:'Pagamento',amount:20,date:'2026-10-02',settlementDate:'2026-10-02',status:'paid',accountId:'cash',categoryId:'cat',paymentMethod:'cash',createdAt:1};
test('opening appears as one income entry in the wallet and never doubles the balance or operating revenue',()=>{
 const rows=getUnifiedTransactions([income],[expense],[],[account],[],{yearMonth:'2026-10',type:'income'});
 expect(rows.filter(row=>row.isOpeningBalance)).toEqual([expect.objectContaining({type:'income',amount:100,date:'2026-10-01',categoryName:'Saldo inicial de abertura'})]);
 expect(calculateAccountBalances([account],[income],[expense],[]).cash).toBe(130);
 expect(getTreasuryMonthSummary([account],[income],[expense],[],'2026-10').monthInflow).toBe(50);
 expect(getUnifiedTransactions([],[],[],[account],[],{yearMonth:'2026-11'})).toHaveLength(0);
});
test('cash day includes opening once and carries forward balance to following days',()=>{
 expect(dailyCashSummary(account,'2026-09-30',[],[],[]).expectedBalance).toBe(0);
 const first=dailyCashSummary(account,'2026-10-01',[income],[expense],[]);
 expect(first.openingBalance).toBe(0);expect(first.incomeTotal).toBe(100);expect(first.expectedBalance).toBe(100);
 const next=dailyCashSummary(account,'2026-10-02',[income],[expense],[]);
 expect(next.openingBalance).toBe(100);expect(next.incomeTotal).toBe(50);expect(next.expenseTotal).toBe(20);expect(next.expectedBalance).toBe(130);
 expect(dailyCashSummary(account,'2026-10-03',[income],[expense],[]).openingBalance).toBe(130);
});
test('legacy opening preserves balances and signature without inventing an opening date',()=>{
 const legacy={...account,openingDate:undefined};const summary=dailyCashSummary(legacy,'2026-10-01',[],[],[]);
 expect(summary.openingBalance).toBe(100);expect(summary.expectedBalance).toBe(100);expect(summary.movementSignature).toBe(JSON.stringify([100]));
 expect(getUnifiedTransactions([],[],[],[legacy],[])[0].date).toBe('');
});
test('cash entry buttons preserve selected wallet and cash day',()=>{
 const open=vi.fn();render(<DailyCashView accounts={[account]} incomes={[]} expenses={[]} transfers={[]} closings={[]} canClose onCloseDay={vi.fn()} onNewMovement={open} />);
 fireEvent.change(screen.getByLabelText('Data do fechamento'),{target:{value:'2026-10-01'}});
 expect(screen.getByText('Entrada de abertura — Carteira Loja')).toBeTruthy();
 expect(screen.getByRole('columnheader',{name:'Saldo acumulado'})).toBeTruthy();
 fireEvent.click(screen.getByRole('button',{name:'Registrar entrada no caixa'}));expect(open).toHaveBeenLastCalledWith('income','cash','2026-10-01');
 fireEvent.click(screen.getByRole('button',{name:'Registrar saída do caixa'}));expect(open).toHaveBeenLastCalledWith('expense','cash','2026-10-01');
});
test('new wallet stores the opening amount and its actual date together',async()=>{
 const save=vi.fn().mockResolvedValue(undefined);render(<AccountFormModal isOpen onClose={vi.fn()} onSave={save} defaultType="cash" />);
 fireEvent.change(document.getElementById('input-account-name')!,{target:{value:'Carteira'}});
 fireEvent.change(document.getElementById('input-account-initial-balance')!,{target:{value:'100'}});
 fireEvent.change(screen.getByLabelText('Data da abertura'),{target:{value:'2026-10-01'}});
 fireEvent.click(screen.getByRole('button',{name:'Criar Conta'}));
 await waitFor(()=>expect(save).toHaveBeenCalledWith(expect.objectContaining({type:'cash',initialBalance:100,openingDate:'2026-10-01'}),undefined));
});
test('daily cash receipt starts received in the selected wallet on the selected day',async()=>{
 const save=vi.fn().mockResolvedValue(undefined);const contact={id:'c',name:'Cliente',type:'client' as const};const center={id:'cc',name:'Loja',clientId:'',status:'active' as const,color:'#123',createdAt:1};
 render(<FinancialFormModal type="income" isOpen categories={DEFAULT_CATEGORIES} accounts={[{...account,id:'other'},account]} contacts={[contact]} costCenters={[center]} defaultAccountId="cash" defaultDate="2026-10-01" cashMovement onClose={vi.fn()} onSave={save} />);
 fireEvent.change(screen.getByPlaceholderText('Ex: Salário, Venda, Reembolso'),{target:{value:'Venda'}});fireEvent.change(screen.getByPlaceholderText('0,00'),{target:{value:'50'}});fireEvent.click(screen.getByRole('button',{name:'Continuar'}));
 expect((screen.getByLabelText('Data do recebimento') as HTMLInputElement).value).toBe('2026-10-01');
 fireEvent.change(screen.getByLabelText('Cliente / Origem da Receita'),{target:{value:'c'}});fireEvent.change(screen.getByLabelText('Centro de Custo'),{target:{value:'cc'}});fireEvent.click(screen.getByRole('button',{name:'Cadastrar Receita'}));
 await waitFor(()=>expect(save).toHaveBeenCalledWith(expect.objectContaining({accountId:'cash',date:'2026-10-01',settlementDate:'2026-10-01',status:'paid',paymentMethod:'cash'}),undefined));
});
