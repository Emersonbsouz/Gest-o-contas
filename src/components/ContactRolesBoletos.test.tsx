import React from 'react';
import { cleanup, fireEvent, render, screen, waitFor } from '@testing-library/react';
import { afterEach, expect, test, vi } from 'vitest';
import { ContactFormModal } from './ContactFormModal';
import { FinancialFormModal } from './FinancialFormModal';
import { DEFAULT_CATEGORIES } from '../data/defaultCategories';
import { hasContactRole } from '../utils/contactRoles';
import { buildBoletoInstallments } from '../utils/boletoInstallments';
import type { ContactPerson, Expense } from '../types';
afterEach(cleanup);
const contact: ContactPerson = {id:'person',name:'Pessoa única',type:'client',roles:['client','supplier','service_provider'],document:'123',createdAt:42};
const center = {id:'cc',name:'Administrativo',clientId:'',status:'active' as const,color:'#123',createdAt:1};
const base: Omit<Expense,'id'|'createdAt'> = {description:'Compra',amount:100,date:'2026-01-31',categoryId:'cat',paymentMethod:'boleto',billetData:{dueDate:'2026-01-31',digitableLine:'primeiro'}};

test('one contact keeps multiple roles and its existing identity', async () => {
  const save=vi.fn().mockResolvedValue(undefined);
  render(<ContactFormModal isOpen onClose={vi.fn()} onSave={save} editingContact={{...contact,roles:undefined}} fixedType />);
  expect((screen.getByRole('checkbox',{name:/Cliente/}) as HTMLInputElement).checked).toBe(true);
  fireEvent.click(screen.getByRole('checkbox',{name:/Fornecedor/}));
  fireEvent.click(screen.getByRole('checkbox',{name:/Terceirizado/}));
  fireEvent.click(screen.getByRole('button',{name:'Salvar Alterações'}));
  await waitFor(()=>expect(save).toHaveBeenCalledWith(expect.objectContaining({name:contact.name,document:'123',type:'client',roles:['client','supplier','service_provider']}),'person'));
  expect(hasContactRole({...contact,roles:undefined},'client')).toBe(true);
});

test.each(['income','expense'] as const)('same contact is available for %s', type=>{
  render(<FinancialFormModal type={type} isOpen categories={DEFAULT_CATEGORIES} contacts={[contact]} costCenters={[center]} onClose={vi.fn()} onSave={vi.fn()} />);
  fireEvent.change(screen.getByPlaceholderText(type==='income'?'Ex: Salário, Venda, Reembolso':'Ex: Mercado, Aluguel, Internet'),{target:{value:'Compra'}});
  fireEvent.change(screen.getByPlaceholderText('0,00'),{target:{value:'100'}});
  fireEvent.click(screen.getByRole('button',{name:'Continuar'}));
  expect(screen.getByRole('option',{name:contact.name})).toBeTruthy();
});

test('monthly boletos preserve the total, handle month end and have individual lines',()=>{
  const items=buildBoletoInstallments(base,3,'total',{1:{line:'segundo'},2:{date:'2026-04-02',line:'terceiro'}});
  expect(items.map(i=>i.amount)).toEqual([33.34,33.33,33.33]);
  expect(items.map(i=>i.date)).toEqual(['2026-01-31','2026-02-28','2026-04-02']);
  expect(items.map(i=>i.billetData?.digitableLine)).toEqual(['primeiro','segundo','terceiro']);
  expect(items.every(i=>i.date===i.billetData?.dueDate)).toBe(true);
  expect(buildBoletoInstallments(base,3,'each').map(i=>i.amount)).toEqual([100,100,100]);
});

test('installment allocations preserve every product and the purchase total in cents',()=>{
  const items=buildBoletoInstallments({...base,amount:0.03,splits:[{id:'a',costCenterId:'a',amount:0.01,categoryId:'cat'},{id:'b',costCenterId:'b',amount:0.02,categoryId:'cat'}]},3,'total');
  expect(items.map(i=>i.amount)).toEqual([0.01,0.01,0.01]);
  expect(items.reduce((sum,i)=>sum+Math.round(i.splits!.filter(s=>s.id==='b').reduce((n,s)=>n+s.amount,0)*100),0)).toBe(2);
});

test('boleto expense saves every installment once in a batch, using due dates',async()=>{
  const save=vi.fn();const batch=vi.fn().mockResolvedValue(undefined);
  const view=render(<FinancialFormModal type="expense" isOpen categories={DEFAULT_CATEGORIES} contacts={[contact]} costCenters={[center]} onClose={vi.fn()} onSave={save} onSaveExpenseInstallments={batch} />);
  fireEvent.change(screen.getByPlaceholderText('Ex: Mercado, Aluguel, Internet'),{target:{value:'Compra'}});
  fireEvent.change(screen.getByPlaceholderText('0,00'),{target:{value:'100'}});
  fireEvent.click(screen.getByRole('button',{name:'Continuar'}));
  const payment=[...view.container.querySelectorAll('select')].find(select=>[...select.options].some(option=>option.value==='boleto'))!;
  fireEvent.change(payment,{target:{value:'boleto'}});
  fireEvent.change(screen.getByLabelText('Fornecedor / Favorecido'),{target:{value:'person'}});
  fireEvent.change(screen.getByLabelText('Centro de Custo'),{target:{value:'cc'}});
  fireEvent.change(screen.getByLabelText('Vencimento do boleto'),{target:{value:'2026-01-31'}});
  fireEvent.click(screen.getByRole('checkbox',{name:'Compra Parcelada'}));
  fireEvent.change(screen.getByLabelText('Total de parcelas'),{target:{value:'3'}});
  fireEvent.click(screen.getByRole('button',{name:'Cadastrar Despesa'}));
  await waitFor(()=>expect(batch).toHaveBeenCalledTimes(1));
  expect(save).not.toHaveBeenCalled();
  expect(batch.mock.calls[0][0].map((item:Expense)=>item.amount)).toEqual([100,100,100]);
  expect(batch.mock.calls[0][0].map((item:Expense)=>item.date)).toEqual(['2026-01-31','2026-02-28','2026-03-31']);
});
