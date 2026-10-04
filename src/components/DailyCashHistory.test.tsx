import React from 'react';
import { afterEach, expect, test, vi } from 'vitest';
import { cleanup, fireEvent, render, screen } from '@testing-library/react';
import { ExpenseList } from './ExpenseList';
import { DailyCashView } from './DailyCashView';
import { dailyCashSummary, localToday } from '../utils/dailyCash';
import type { Expense, TreasuryAccount } from '../types';
afterEach(cleanup);
const expenses:Expense[] = ['Taxas de desdobro Cartório','TRT DE CONSTRUÇÃO'].map((description,i)=>({id:String(i),description,amount:100,date:i?'2026-09-07':'2026-07-22',status:'pending',paymentMethod:'cash',categoryId:'c',createdAt:1}));
test('old outstanding PJ expenses are visible without changing the current month', () => {
 render(<ExpenseList expenses={expenses} categories={[]} currentYearMonth="2026-10" onEditExpense={vi.fn()} onDeleteExpense={vi.fn()} onOpenAddModal={vi.fn()} />);
 expect(screen.getByText(expenses[0].description)).toBeTruthy(); expect(screen.getByText(expenses[1].description)).toBeTruthy();
 fireEvent.change(screen.getByLabelText('Período da consulta'),{target:{value:'month'}});expect(screen.queryByText(expenses[0].description)).toBeNull();
 fireEvent.change(screen.getByLabelText('Período da consulta'),{target:{value:'all'}});
 fireEvent.change(screen.getByLabelText('Situação da consulta'),{target:{value:'settled'}});expect(screen.queryByText(expenses[0].description)).toBeNull();
 fireEvent.change(screen.getByLabelText('Situação da consulta'),{target:{value:'open'}});expect(screen.getByText(expenses[0].description)).toBeTruthy();
});
const account:TreasuryAccount={id:'cash',name:'Loja',type:'cash',initialBalance:100,color:'#123456'};
const props={accounts:[account],incomes:[],expenses:[],transfers:[],closings:[],canClose:true};
test('difference needs explanation and failed save stays open',async()=>{
 const save=vi.fn().mockRejectedValue(new Error('offline'));render(<DailyCashView {...props} onCloseDay={save} />);
 fireEvent.change(screen.getByLabelText('Saldo contado'),{target:{value:'90'}});fireEvent.click(screen.getByRole('button',{name:'Confirmar fechamento diário'}));
 expect(save).not.toHaveBeenCalled();expect(screen.getByRole('alert').textContent).toContain('diferença');
 fireEvent.change(screen.getByLabelText('Observações do fechamento'),{target:{value:'Conferir troco'}});fireEvent.click(screen.getByRole('button',{name:'Confirmar fechamento diário'}));
 await screen.findByRole('alert');expect(save).toHaveBeenCalledWith('cash',localToday(),90,'Conferir troco',expect.any(String));expect(screen.getByLabelText('Saldo contado')).toBeTruthy();
});
test('completed closure displays preserved balances and detects later edits',()=>{
 const totals=dailyCashSummary(account,localToday(),[],[],[]);
 render(<DailyCashView {...props} accounts={[{...account,initialBalance:200}]} closings={[{...totals,id:'closed',accountId:'cash',accountName:'Loja',date:localToday(),countedBalance:100,difference:0,closedAt:new Date().toISOString(),closedBy:'owner'}]} onCloseDay={vi.fn()} />);
 expect(screen.queryByRole('button',{name:'Confirmar fechamento diário'})).toBeNull();expect(screen.getByRole('alert').textContent).toContain('alterados após');expect(screen.getByText('Fechamento registrado')).toBeTruthy();
});
