import React from 'react';
import { cleanup, fireEvent, render, screen, waitFor } from '@testing-library/react';
import { afterEach, expect, test, vi } from 'vitest';
import { FinancialFormModal } from './FinancialFormModal';
import { CostCenterModal } from './CostCenterModal';
import { RegistriesView } from './RegistriesView';
import { DEFAULT_CATEGORIES } from '../data/defaultCategories';
import type { ContactPerson, CostCenter } from '../types';
afterEach(cleanup);
const contacts: ContactPerson[] = [
  {id:'client-a',name:'Cliente Alfa',type:'client',createdAt:1},
  {id:'supplier-a',name:'Fornecedor Beta',type:'supplier',createdAt:1},
];
const centers: CostCenter[] = [{id:'center-a',name:'Administrativo',clientId:'',status:'active',color:'#123456',createdAt:1}];

function props(type: 'income' | 'expense' = 'income') {
  return {type,isOpen:true,onClose:vi.fn(),onSave:vi.fn().mockResolvedValue(undefined),categories:DEFAULT_CATEGORIES,
    contacts,costCenters:centers,defaultDate:'2026-10-04'};
}
function fill(type: 'income' | 'expense' = 'income') {
  fireEvent.change(screen.getByPlaceholderText(type === 'income' ? 'Ex: Salário, Venda, Reembolso' : 'Ex: Mercado, Aluguel, Internet'), {target:{value:'Venda de serviço'}});
  fireEvent.change(screen.getByPlaceholderText('0,00'), {target:{value:'120'}});
  fireEvent.click(screen.getByRole('button',{name:'Continuar'}));
}

test('revenue requires a source and a cost center and saves both references', async () => {
  const p = props(); render(<FinancialFormModal {...p} />); fill();
  fireEvent.click(screen.getByRole('button',{name:'Cadastrar Receita'}));
  expect(await screen.findByText('Selecione o cliente ou a origem desta receita.')).toBeTruthy();
  fireEvent.change(screen.getByLabelText('Cliente / Origem da Receita'), {target:{value:'client-a'}});
  expect(screen.queryByRole('option',{name:'Fornecedor Beta'})).toBeNull();
  fireEvent.click(screen.getByRole('button',{name:'Cadastrar Receita'}));
  expect(await screen.findByText('Selecione um centro de custo para identificar este lançamento.')).toBeTruthy();
  fireEvent.change(screen.getByLabelText('Centro de Custo'), {target:{value:'center-a'}});
  fireEvent.click(screen.getByRole('button',{name:'Cadastrar Receita'}));
  await waitFor(() => expect(p.onSave).toHaveBeenCalledWith(expect.objectContaining({contactId:'client-a',costCenterId:'center-a',amount:120}),undefined));
  expect(p.onClose).toHaveBeenCalled();
});

test('expense offers suppliers and preserves the form when saving fails', async () => {
  const p = props('expense'); p.onSave.mockRejectedValue(new TypeError('Failed to fetch'));
  render(<FinancialFormModal {...p} />); fill('expense');
  expect(screen.queryByRole('option',{name:'Cliente Alfa'})).toBeNull();
  fireEvent.change(screen.getByLabelText('Fornecedor / Favorecido'), {target:{value:'supplier-a'}});
  fireEvent.change(screen.getByLabelText('Centro de Custo'), {target:{value:'center-a'}});
  fireEvent.click(screen.getByRole('button',{name:'Cadastrar Despesa'}));
  expect(await screen.findByText(/O cadastro ainda não foi salvo/)).toBeTruthy();
  expect(p.onClose).not.toHaveBeenCalled();
});

test('one expense saves two named products with different cost centers', async () => {
  const p=props('expense');
  render(<FinancialFormModal {...p} costCenters={[...centers,{...centers[0],id:'center-b',name:'Obra B'}]} />); fill('expense');
  fireEvent.change(screen.getByLabelText('Fornecedor / Favorecido'),{target:{value:'supplier-a'}});
  fireEvent.click(screen.getByRole('button',{name:'Adicionar produtos'}));
  fireEvent.change(screen.getByLabelText('Produto 1'),{target:{value:'Cimento'}});
  fireEvent.change(screen.getByLabelText('Centro de custo do produto 1'),{target:{value:'center-a'}});
  fireEvent.change(screen.getByLabelText('Valor do produto 1'),{target:{value:'80'}});
  fireEvent.click(screen.getByRole('button',{name:'Adicionar outro produto'}));
  fireEvent.change(screen.getByLabelText('Produto 2'),{target:{value:'Areia'}});
  fireEvent.change(screen.getByLabelText('Centro de custo do produto 2'),{target:{value:'center-b'}});
  fireEvent.change(screen.getByLabelText('Valor do produto 2'),{target:{value:'39.99'}});
  fireEvent.click(screen.getByRole('button',{name:'Cadastrar Despesa'}));
  expect(p.onSave).not.toHaveBeenCalled();expect(await screen.findByText(/deve ser igual ao valor total/)).toBeTruthy();
  fireEvent.change(screen.getByLabelText('Valor do produto 2'),{target:{value:'40'}});
  fireEvent.click(screen.getByRole('button',{name:'Cadastrar Despesa'}));
  await waitFor(()=>expect(p.onSave).toHaveBeenCalledTimes(1));
  expect(p.onSave.mock.calls[0][0]).toMatchObject({amount:120,costCenterId:undefined,splits:[{id:expect.any(String),description:'Cimento',amount:80,costCenterId:'center-a'},{id:expect.any(String),description:'Areia',amount:40,costCenterId:'center-b'}]});
});

test('products require names and remain editable when a row is removed', () => {
  const p=props('expense');render(<FinancialFormModal {...p} />);fill('expense');
  fireEvent.change(screen.getByLabelText('Fornecedor / Favorecido'),{target:{value:'supplier-a'}});
  fireEvent.click(screen.getByRole('button',{name:'Adicionar produtos'}));
  fireEvent.click(screen.getByRole('button',{name:'Cadastrar Despesa'}));
  expect(screen.getByText('Informe o produto ou serviço em cada item da despesa.')).toBeTruthy();expect(p.onSave).not.toHaveBeenCalled();
  fireEvent.click(screen.getByRole('button',{name:'Adicionar outro produto'}));
  fireEvent.click(screen.getByRole('button',{name:'Remover produto 1'}));
  expect(screen.getAllByLabelText(/Produto \d/)).toHaveLength(1);
});

test('a category refresh does not erase an unfinished financial form', () => {
  const p = props(); const view = render(<FinancialFormModal {...p} />);
  const description = screen.getByPlaceholderText('Ex: Salário, Venda, Reembolso');
  fireEvent.change(description,{target:{value:'Venda em andamento'}});
  view.rerender(<FinancialFormModal {...p} categories={DEFAULT_CATEGORIES.map(c => ({...c}))} />);
  expect((screen.getByPlaceholderText('Ex: Salário, Venda, Reembolso') as HTMLInputElement).value).toBe('Venda em andamento');
});

test('an administrative cost center does not require a customer and waits for persistence', async () => {
  const onSave = vi.fn().mockResolvedValue(undefined); const onClose = vi.fn();
  render(<CostCenterModal isOpen onClose={onClose} onSave={onSave} editingCC={null} contacts={[]} />);
  expect((screen.getByLabelText('Cliente vinculado (opcional)') as HTMLSelectElement).required).toBe(false);
  fireEvent.change(screen.getByLabelText('Nome do Centro de Custo'),{target:{value:' Administrativo '}});
  fireEvent.click(screen.getByRole('button',{name:'Criar Centro de Custo'}));
  await waitFor(() => expect(onSave).toHaveBeenCalledWith(expect.objectContaining({name:'Administrativo',clientId:''}),undefined));
  expect(onClose).toHaveBeenCalled();
});

test('a cost center save error keeps the dialog open', async () => {
  const onClose = vi.fn();
  render(<CostCenterModal isOpen onClose={onClose} onSave={vi.fn().mockRejectedValue({code:'42501'})} editingCC={null} contacts={[]} />);
  fireEvent.change(screen.getByLabelText('Nome do Centro de Custo'),{target:{value:'Administrativo'}});
  fireEvent.click(screen.getByRole('button',{name:'Criar Centro de Custo'}));
  expect(await screen.findByRole('alert')).toBeTruthy();
  expect(onClose).not.toHaveBeenCalled();
});

test('registries display registered clients with the client filter and provide cost centers', () => {
  const noop = vi.fn();
  render(<RegistriesView contacts={contacts} cards={[]} accounts={[]} categories={[]} recurringBills={[]} goals={[]} equipment={[]}
    costCenters={centers} currentYearMonth="2026-10" onOpenCardModal={noop} onDeleteCard={noop} onOpenContactModal={noop}
    onDeleteContact={noop} onOpenRecurringModal={noop} onDeleteRecurring={noop} onTriggerRecurringBill={noop}
    onOpenGoalModal={noop} onDeleteGoal={noop} onUpdateGoalAmount={noop} onOpenAccountModal={noop} onDeleteAccount={noop}
    onOpenCategoryModal={noop} onOpenEquipmentModal={noop} onDeleteEquipment={noop} onOpenCostCenterModal={noop} />);
  fireEvent.click(screen.getByRole('button',{name:'Clientes e Fornecedores (2)'}));
  const filter = screen.getByRole('option',{name:'Apenas Clientes / Pagadores'}).parentElement!;
  fireEvent.change(filter,{target:{value:'client'}});
  expect(screen.getByText('Cliente Alfa')).toBeTruthy();
  expect(screen.queryByText('Fornecedor Beta')).toBeNull();
  fireEvent.click(screen.getByRole('button',{name:'Centros de Custo (1)'}));
  expect(screen.getByText('Administrativo')).toBeTruthy();
  fireEvent.click(screen.getByRole('button',{name:'Cadastrar centro de custo'}));
  expect(noop).toHaveBeenCalled();
});
