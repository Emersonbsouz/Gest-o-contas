import React, { useState } from 'react';
import { cleanup, fireEvent, render, screen, waitFor } from '@testing-library/react';
import { afterEach, beforeEach, expect, test, vi } from 'vitest';
import { ExpenseList } from './ExpenseList';
import { FinancialFormModal } from './FinancialFormModal';
import { useCompanyData } from '../hooks/useCompanyData';
import { DEFAULT_CATEGORIES } from '../data/defaultCategories';
import type { Expense } from '../types';

const service = vi.hoisted(() => ({
  subscribeToCompanySubcollection: vi.fn(() => () => {}),
  saveCompanyDoc: vi.fn(), updateCompanyDoc: vi.fn(), createCompanyDoc: vi.fn(),
}));
vi.mock('../services/companyService', () => service);
beforeEach(() => { vi.clearAllMocks(); localStorage.clear(); });
afterEach(cleanup);
const original: Expense = {
  id: 'expense-existing', createdAt: 123, description: 'Conta antiga', amount: 100,
  date: '2026-10-01', categoryId: DEFAULT_CATEGORIES.find(c => c.type === 'expense')!.id,
  paymentMethod: 'pix', notes: 'Manter observação', documentNumber: 'NF-42',
};

function Harness() {
  const data = useCompanyData('company-test');
  const [editing, setEditing] = useState<Expense | null>(null);
  return <>
    <ExpenseList expenses={data.expenses} categories={DEFAULT_CATEGORIES} currentYearMonth="2026-10"
      onEditExpense={setEditing} onDeleteExpense={vi.fn()} onOpenAddModal={vi.fn()} />
    <FinancialFormModal type="expense" isOpen={!!editing} editingItem={editing}
      categories={DEFAULT_CATEGORIES} contacts={data.contacts} costCenters={data.costCenters}
      accounts={data.accounts} cards={data.cards} onClose={() => setEditing(null)} onSave={data.saveExpense} />
  </>;
}
function seed(expense = original) {
  localStorage.setItem('cg_company-test_expenses', JSON.stringify([expense]));
}
function edit() {
  fireEvent.click(screen.getByTitle('Editar Despesa'));
  expect(screen.getByPlaceholderText('Ex: Mercado, Aluguel, Internet').getAttribute('value')).toBe(original.description);
  fireEvent.change(screen.getByPlaceholderText('Ex: Mercado, Aluguel, Internet'), {target:{value:'Conta revisada'}});
  fireEvent.change(screen.getByPlaceholderText('0,00'), {target:{value:'125.50'}});
  fireEvent.click(screen.getByRole('button', {name:'Continuar'}));
  fireEvent.click(screen.getByRole('button', {name:'Salvar Alterações'}));
}

test('Editar opens a legacy expense and updates the same record, preserving identity and data after reload', async () => {
  seed(); const view = render(<Harness />); edit();
  await waitFor(() => expect(service.updateCompanyDoc).toHaveBeenCalledWith('company-test', 'expenses', original.id,
    expect.objectContaining({...original, description:'Conta revisada', amount:125.5}), original));
  expect(service.saveCompanyDoc).not.toHaveBeenCalled();
  await waitFor(() => expect(screen.queryByText('Editar: Despesa')).toBeNull());
  const saved = JSON.parse(localStorage.getItem('cg_company-test_expenses')!);
  expect(saved).toHaveLength(1);
  expect(saved[0]).toMatchObject({...original, description:'Conta revisada', amount:125.5});
  view.unmount(); render(<Harness />);
  fireEvent.click(screen.getByTitle('Editar Despesa'));
  expect(screen.getByPlaceholderText('0,00').getAttribute('value')).toBe('125.5');
});

test('failed update keeps the original record and the editing form open', async () => {
  seed(); service.updateCompanyDoc.mockRejectedValueOnce(new Error('Conflito na atualização'));
  render(<Harness />); edit();
  await waitFor(() => expect(service.updateCompanyDoc).toHaveBeenCalled());
  expect(await screen.findByText('Editar: Despesa')).toBeTruthy();
  expect(JSON.parse(localStorage.getItem('cg_company-test_expenses')!)).toEqual([original]);
});

test('cancel closes editing without saving', () => {
  seed(); render(<Harness />); fireEvent.click(screen.getByTitle('Editar Despesa'));
  fireEvent.click(screen.getByRole('button', {name:'Cancelar'}));
  expect(service.updateCompanyDoc).not.toHaveBeenCalled();
  expect(JSON.parse(localStorage.getItem('cg_company-test_expenses')!)).toEqual([original]);
});

test('editing a paid legacy expense does not assign the first available bank account', async () => {
  seed({...original, status:'paid', settlementDate:'2026-10-02'});
  localStorage.setItem('cg_company-test_accounts', JSON.stringify([{id:'bank',name:'Banco',type:'checking',initialBalance:0,color:'#123456'}]));
  render(<Harness />); edit();
  await waitFor(() => expect(service.updateCompanyDoc).toHaveBeenCalled());
  expect(service.updateCompanyDoc.mock.calls[0][3]).toMatchObject({status:'paid',settlementDate:'2026-10-02'});
  expect(service.updateCompanyDoc.mock.calls[0][3].accountId).toBeUndefined();
});

test('editing an expense with named products preserves their IDs and associations', async () => {
  const splits = [{id:'product-1',description:'Cimento',amount:125.5,costCenterId:'center',categoryId:original.categoryId}];
  seed({...original, amount:125.5, contactId:'supplier', splits});
  localStorage.setItem('cg_company-test_contacts', JSON.stringify([{id:'supplier',name:'Fornecedor',type:'supplier'}]));
  localStorage.setItem('cg_company-test_costCenters', JSON.stringify([{id:'center',name:'Obra',clientId:'',status:'active',color:'#123456'}]));
  render(<Harness />); edit();
  await waitFor(() => expect(service.updateCompanyDoc).toHaveBeenCalled());
  expect(service.updateCompanyDoc.mock.calls[0][3]).toMatchObject({contactId:'supplier',splits});
});

test('marking a pending legacy expense paid still requires a valid payment account', () => {
  seed({...original,status:'pending'}); render(<Harness />);
  fireEvent.click(screen.getByTitle('Editar Despesa'));
  fireEvent.click(screen.getByRole('button',{name:'Continuar'}));
  fireEvent.change(screen.getByLabelText('Situação do lançamento'), {target:{value:'paid'}});
  fireEvent.click(screen.getByRole('button',{name:'Salvar Alterações'}));
  expect(screen.getByText('Selecione a conta ou o cartão utilizado no pagamento ou recebimento.')).toBeTruthy();
  expect(service.updateCompanyDoc).not.toHaveBeenCalled();
});
