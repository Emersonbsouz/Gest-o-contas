import { cleanup, fireEvent, render, screen, within } from '@testing-library/react';
import { afterEach, expect, test, vi } from 'vitest';
import { IncomeList } from './IncomeList';
import type { Income } from '../types';

const originalShowModal = Object.getOwnPropertyDescriptor(HTMLDialogElement.prototype, 'showModal');
const originalClose = Object.getOwnPropertyDescriptor(HTMLDialogElement.prototype, 'close');

afterEach(() => {
  cleanup();
  vi.restoreAllMocks();
  if (originalShowModal) Object.defineProperty(HTMLDialogElement.prototype, 'showModal', originalShowModal);
  else Reflect.deleteProperty(HTMLDialogElement.prototype, 'showModal');
  if (originalClose) Object.defineProperty(HTMLDialogElement.prototype, 'close', originalClose);
  else Reflect.deleteProperty(HTMLDialogElement.prototype, 'close');
});

test('issues a Pix charge only for outstanding income and requires the receiver key', () => {
  Object.defineProperty(HTMLDialogElement.prototype, 'showModal', {
    configurable: true, value(this: HTMLDialogElement) { this.open = true; },
  });
  Object.defineProperty(HTMLDialogElement.prototype, 'close', {
    configurable: true, value(this: HTMLDialogElement) { this.open = false; },
  });
  const print = vi.spyOn(window, 'print').mockImplementation(() => {});
  const edit = vi.fn();
  const income: Income = {
    id: 'income', description: 'Serviço', amount: 250, date: '2026-11-20',
    accountId: 'account', categoryId: 'cat', contactId: 'client', status: 'pending', createdAt: 1,
  };

  render(<IncomeList
    incomes={[income, { ...income, id: 'paid', status: 'paid' }, { ...income, id: 'draft', status: 'draft' }]}
    categories={[]} contacts={[{ id: 'client', name: 'Cliente exemplo', type: 'client', pixKey: 'chave-do-cliente' }]}
    companyName="Empresa exemplo" currentYearMonth="2026-11"
    onEditIncome={edit} onDeleteIncome={vi.fn()} onOpenAddModal={vi.fn()}
  />);

  fireEvent.click(screen.getByRole('button', { name: 'Emitir cobrança Pix' }));
  const dialog = within(screen.getByRole('dialog', { name: 'Cobrança Pix' }));
  expect(dialog.getByText('Cliente exemplo')).toBeTruthy();
  expect(edit).not.toHaveBeenCalled();
  const key = dialog.getByLabelText('Chave Pix do recebedor') as HTMLInputElement;
  expect(key.value).toBe('');
  const printButton = dialog.getByRole('button', { name: 'Imprimir / Salvar PDF' }) as HTMLButtonElement;
  expect(printButton.disabled).toBe(true);
  fireEvent.change(key, { target: { value: 'chave-do-recebedor' } });
  fireEvent.click(printButton);
  expect(print).toHaveBeenCalledOnce();

  fireEvent.click(dialog.getByRole('button', { name: 'Fechar' }));
  cleanup();
  render(<IncomeList
    incomes={[income]} categories={[]} companyName="Empresa exemplo"
    accounts={[
      { id: 'account', name: 'Banco sem Pix', type: 'checking', color: '#000000', initialBalance: 0 },
      { id: 'cash', name: 'Caixa Loja', type: 'cash', color: '#000000', initialBalance: 0, pixKey: 'pix-do-caixa', pixReceiver: 'Titular do caixa' },
    ]}
    companyProfile={{ pixKey: 'pix-da-empresa', pixReceiver: 'Titular exemplo', pixBank: 'Banco exemplo' }}
    currentYearMonth="2026-11" onEditIncome={edit} onDeleteIncome={vi.fn()} onOpenAddModal={vi.fn()}
  />);
  fireEvent.click(screen.getByRole('button', { name: 'Emitir cobrança Pix' }));
  const configured = within(screen.getByRole('dialog', { name: 'Cobrança Pix' }));
  expect((configured.getByLabelText('Chave Pix do recebedor') as HTMLInputElement).value).toBe('pix-da-empresa');
  expect((configured.getByLabelText('Nome do recebedor') as HTMLInputElement).value).toBe('Titular exemplo');
  expect((configured.getByRole('button', { name: 'Imprimir / Salvar PDF' }) as HTMLButtonElement).disabled).toBe(false);
  expect(configured.queryByRole('option', { name: 'Banco sem Pix' })).toBeNull();
  fireEvent.change(configured.getByLabelText('Selecionar Pix cadastrado'), { target: { value: 'cash' } });
  expect((configured.getByLabelText('Chave Pix do recebedor') as HTMLInputElement).value).toBe('pix-do-caixa');
  expect((configured.getByLabelText('Nome do recebedor') as HTMLInputElement).value).toBe('Titular do caixa');
});
