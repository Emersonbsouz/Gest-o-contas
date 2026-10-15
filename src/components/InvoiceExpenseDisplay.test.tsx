
import React from 'react';
import { cleanup, fireEvent, render, screen, within } from '@testing-library/react';
import { afterEach, expect, test, vi } from 'vitest';
import { ExpenseList } from './ExpenseList';
import { invoiceExpenses } from '../utils/cardInvoices';
import type { Expense } from '../types';
afterEach(cleanup);
const card={id:'c',name:'Cartão principal',brand:'visa' as const,limit:1000,closingDay:25,dueDay:5,color:'#000'};
const purchase:Expense={id:'purchase',description:'Compra no cartão',date:'2026-10-10',amount:125,categoryId:'food',paymentMethod:'credit_card',cardId:'c',purchaseStatus:'paid',status:'pending',createdAt:1};
test('card purchase is highlighted with invoice due date and redirects payment to invoice without extra expense rows',()=>{
 const open=vi.fn(); const liquidate=vi.fn();
 const effective=invoiceExpenses([purchase,{...purchase,id:'direct',description:'Conta comum',paymentMethod:'pix',cardId:undefined,date:'2026-11-10',amount:40}], [card],[]);
 render(<ExpenseList expenses={effective} cards={[card]} categories={[]} currentYearMonth="2026-11" onEditExpense={vi.fn()} onDeleteExpense={vi.fn()} onOpenAddModal={vi.fn()} onLiquidateExpense={liquidate} onOpenCardInvoices={open}/>);
 fireEvent.change(screen.getByRole('combobox',{name:'Período da consulta'}),{target:{value:'month'}});
 const row=document.getElementById('expense-row-purchase')!;
 expect(within(row).getByText('05/11/2026')).toBeTruthy();
 expect(within(row).getByText('Vencimento da fatura')).toBeTruthy();
 expect(within(row).getByText('Fatura em aberto')).toBeTruthy();
 expect(within(row).getByText('Pago no cartão')).toBeTruthy();
 expect(within(row).getByRole('button',{name:'Modificar despesa paga Compra no cartão'})).toBeTruthy();
 expect(row.className).toContain('bg-violet');
 expect(screen.getAllByRole('row')).toHaveLength(3);
 expect(screen.getByRole('region',{name:'Faturas incluídas nas despesas'})).toBeTruthy();
 fireEvent.click(within(row).getByTitle('Pagar pela fatura do cartão'));
 expect(open).toHaveBeenCalledOnce(); expect(liquidate).not.toHaveBeenCalled();
 expect(within(document.getElementById('expense-row-direct')!).getByTitle('Liquidar Despesa')).toBeTruthy();
 fireEvent.change(screen.getByRole('combobox',{name:'Situação da consulta'}),{target:{value:'settled'}});
 expect(document.getElementById('expense-row-purchase')).toBeTruthy();
 expect(document.getElementById('expense-row-direct')).toBeNull();
});
test('cancelled card purchase is not described as an invoice payment',()=>{
 render(<ExpenseList expenses={[{...purchase,status:'cancelled'}]} cards={[card]} categories={[]} currentYearMonth="2026-10" onEditExpense={vi.fn()} onDeleteExpense={vi.fn()} onOpenAddModal={vi.fn()}/>);
 expect(screen.queryByText('Pagamento da fatura')).toBeNull();
 expect(screen.queryByRole('region',{name:'Faturas incluídas nas despesas'})).toBeNull();
});
