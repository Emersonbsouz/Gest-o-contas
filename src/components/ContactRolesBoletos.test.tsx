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
  fireEvent.change(screen.getByLabelText('Data de lançamento *'),{target:{value:'2026-01-10'}});
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
  fireEvent.change(screen.getByLabelText('Data de lançamento *'),{target:{value:'2026-01-10'}});
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
  expect(batch.mock.calls[0][0].map((item:Expense)=>item.entryDate)).toEqual(['2026-01-10','2026-01-10','2026-01-10']);
  expect(batch.mock.calls[0][0].map((item:Expense)=>item.date)).toEqual(['2026-01-31','2026-02-28','2026-03-31']);
});

test.each(['expense','income'] as const)('%s saves independent registration and due dates',async type=>{
  const save=vi.fn().mockResolvedValue(undefined);
  render(<FinancialFormModal type={type} isOpen categories={DEFAULT_CATEGORIES} contacts={[contact]} costCenters={[center]} onClose={vi.fn()} onSave={save} />);
  fireEvent.change(screen.getByPlaceholderText(type==='income'?'Ex: Salário, Venda, Reembolso':'Ex: Mercado, Aluguel, Internet'),{target:{value:'Registro'}});
  fireEvent.change(screen.getByPlaceholderText('0,00'),{target:{value:'100'}});
  fireEvent.change(screen.getByLabelText('Data de lançamento *'),{target:{value:'2026-10-20'}});
  fireEvent.change(screen.getByLabelText('Data de vencimento *'),{target:{value:'2026-11-15'}});
  fireEvent.click(screen.getByRole('button',{name:'Continuar'}));
  fireEvent.change(screen.getByLabelText(type==='income'?'Cliente / Origem da Receita':'Fornecedor / Favorecido'),{target:{value:'person'}});
  fireEvent.change(screen.getByLabelText('Centro de Custo'),{target:{value:'cc'}});
  fireEvent.click(screen.getByRole('button',{name:type==='income'?'Cadastrar Receita':'Cadastrar Despesa'}));
  await waitFor(()=>expect(save).toHaveBeenCalledWith(expect.objectContaining({entryDate:'2026-10-20',date:'2026-11-15'}),undefined));
});


test('new credit card purchase creates all installments in one batch instead of a single expense', async()=>{
 const save=vi.fn(); const batch=vi.fn().mockResolvedValue(undefined);
 const card={id:'card',name:'Cartão teste',brand:'visa' as const,limit:1000,closingDay:20,dueDay:5,color:'#000'};
 const view=render(<FinancialFormModal type="expense" isOpen cards={[card]} categories={DEFAULT_CATEGORIES} contacts={[contact]} costCenters={[center]} onClose={vi.fn()} onSave={save} onSaveExpenseInstallments={batch}/>);
 fireEvent.change(screen.getByPlaceholderText('Ex: Mercado, Aluguel, Internet'),{target:{value:'Compra parcelada'}});
 fireEvent.change(screen.getByPlaceholderText('0,00'),{target:{value:'200'}});
 fireEvent.change(screen.getByLabelText('Data de lançamento *'),{target:{value:'2026-10-21'}});
 fireEvent.change(screen.getByLabelText('Data de vencimento *'),{target:{value:'2026-10-21'}});
 fireEvent.click(screen.getByRole('button',{name:'Continuar'}));
 const payment=[...view.container.querySelectorAll('select')].find(select=>[...select.options].some(option=>option.value==='credit_card'))!;
 fireEvent.change(payment,{target:{value:'credit_card'}});
 const cardSelect=[...view.container.querySelectorAll('select')].find(select=>[...select.options].some(option=>option.value==='card'))!;
 fireEvent.change(cardSelect,{target:{value:'card'}});
 fireEvent.change(screen.getByLabelText('Fornecedor / Favorecido'),{target:{value:'person'}});
 fireEvent.change(screen.getByLabelText('Centro de Custo'),{target:{value:'cc'}});
 fireEvent.click(screen.getByRole('checkbox',{name:'Compra Parcelada'}));
 fireEvent.change(screen.getByLabelText('Total de parcelas'),{target:{value:'2'}});
 fireEvent.click(screen.getByRole('button',{name:'Cadastrar Despesa'}));
 await waitFor(()=>expect(batch).toHaveBeenCalledTimes(1));
 expect(save).not.toHaveBeenCalled();
 const items=batch.mock.calls[0][0] as Expense[];
 expect(items.map(i=>i.amount)).toEqual([100,100]);
 expect(items.map(i=>i.invoiceDueDate)).toEqual(['2026-12-05','2027-01-05']);
 expect(items.every(i=>i.purchaseDate==='2026-10-21')).toBe(true);
});


test.each(['expense','income'] as const)('%s records entry and only installments the remaining balance',async type=>{
 const single=vi.fn(),batch=vi.fn().mockResolvedValue(undefined);
 const accounts=[{id:'bank',name:'Banco teste',type:'checking' as const,initialBalance:0,color:'#000'}];
 render(<FinancialFormModal type={type} isOpen accounts={accounts} categories={DEFAULT_CATEGORIES} contacts={[contact]} costCenters={[center]} onClose={vi.fn()} onSave={single} onSaveExpenseInstallments={batch} onSaveIncomeInstallments={batch}/>);
 fireEvent.change(screen.getByPlaceholderText(type==='expense'?'Ex: Mercado, Aluguel, Internet':'Ex: Salário, Venda, Reembolso'),{target:{value:'Compra com entrada'}});
 fireEvent.change(screen.getByPlaceholderText('0,00'),{target:{value:'1000'}});
 fireEvent.change(screen.getByLabelText('Data de lançamento *'),{target:{value:'2026-10-28'}});
 fireEvent.change(screen.getByLabelText('Data de vencimento *'),{target:{value:'2026-11-05'}});
 fireEvent.click(screen.getByRole('button',{name:'Continuar'}));
 fireEvent.change(screen.getByLabelText(type==='expense'?'Fornecedor / Favorecido':'Cliente / Origem da Receita'),{target:{value:'person'}});
 fireEvent.change(screen.getByLabelText('Centro de Custo'),{target:{value:'cc'}});
 fireEvent.click(screen.getByRole('checkbox',{name:type==='expense'?'Compra Parcelada':'Gerar Parcelas Automáticas'}));
 fireEvent.change(screen.getByLabelText('Total de parcelas'),{target:{value:'2'}});
 const entryCheckbox=screen.getByRole('checkbox',{name:'Tem entrada?'});
 expect(entryCheckbox.compareDocumentPosition(screen.getByLabelText('Situação do lançamento')) & Node.DOCUMENT_POSITION_FOLLOWING).toBeTruthy();
 fireEvent.click(entryCheckbox);
 fireEvent.change(screen.getByLabelText('Valor da entrada'),{target:{value:'200'}});
 fireEvent.change(screen.getByLabelText('Data da entrada'),{target:{value:'2026-10-28'}});
 expect((screen.getByLabelText('Situação do lançamento') as HTMLSelectElement).value).toBe('pending');
 expect((screen.getByLabelText('Valor da parcela do saldo 1') as HTMLInputElement).value).toBe('400.00');
 expect((screen.getByLabelText('Vencimento da parcela do saldo 1') as HTMLInputElement).value).toBe('2026-11-05');
 fireEvent.change(screen.getByLabelText('Valor da parcela do saldo 1'),{target:{value:'300'}});
 fireEvent.click(screen.getByRole('button',{name:type==='expense'?'Cadastrar Despesa':'Cadastrar Receita'}));
 await screen.findByText('A soma das parcelas deve ser igual ao saldo restante.');
 expect(batch).not.toHaveBeenCalled();
 fireEvent.change(screen.getByLabelText('Valor da parcela do saldo 2'),{target:{value:'500'}});
 fireEvent.change(screen.getByLabelText('Vencimento da parcela do saldo 1'),{target:{value:'2026-11-09'}});
 fireEvent.change(screen.getByLabelText('Vencimento da parcela do saldo 2'),{target:{value:'2026-12-19'}});
 fireEvent.click(screen.getByRole('button',{name:type==='expense'?'Cadastrar Despesa':'Cadastrar Receita'}));
 await waitFor(()=>expect(batch).toHaveBeenCalledTimes(1));expect(single).not.toHaveBeenCalled();
 const plan=batch.mock.calls[0][0];
 expect(plan.map((i:Expense)=>i.amount)).toEqual([200,300,500]);
 expect(plan.map((i:Expense)=>i.date)).toEqual(['2026-10-28','2026-11-09','2026-12-19']);
 expect(plan.map((i:Expense)=>i.status)).toEqual(['paid','pending','pending']);
 expect(plan[0]).toMatchObject({isDownPayment:true,accountId:'bank',paymentMethod:'pix',settlementDate:'2026-10-28'});
});
