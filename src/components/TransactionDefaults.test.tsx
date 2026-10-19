import React from 'react';
import { cleanup, fireEvent, render, screen } from '@testing-library/react';
import { afterEach, expect, test, vi } from 'vitest';
import { FinancialFormModal } from './FinancialFormModal';
import { ExpenseList } from './ExpenseList';
import type { Expense } from '../types';

afterEach(() => { cleanup(); vi.useRealTimers(); });

test.each(['expense', 'income'] as const)('%s starts on the local registration day and refreshes when reopened', type => {
  vi.useFakeTimers();
  vi.setSystemTime(new Date(2026, 9, 19, 23, 30));
  const props = { type, isOpen: true, categories: [], onClose: vi.fn(), onSave: vi.fn() };
  const view = render(<FinancialFormModal {...props} />);
  const date = () => view.container.querySelector<HTMLInputElement>('input[type="date"]')!.value;
  expect(date()).toBe('2026-10-19');
  view.rerender(<FinancialFormModal {...props} isOpen={false} />);
  vi.setSystemTime(new Date(2026, 9, 20, 0, 30));
  view.rerender(<FinancialFormModal {...props} />);
  expect(date()).toBe('2026-10-20');
  view.rerender(<FinancialFormModal {...props} editingItem={{ id: 'old', description: 'Anterior', amount: 10, date: '2026-09-03' }} />);
  expect(date()).toBe('2026-09-03');
});

test('expenses can be ordered in both directions by date and amount', () => {
  const expenses: Expense[] = [
    { id: 'a', description: 'Antiga', date: '2026-09-01', amount: 90, categoryId: 'cat', paymentMethod: 'pix', createdAt: new Date(2026, 9, 20, 14).getTime() },
    { id: 'b', description: 'Recente', date: '2026-10-19', amount: 10, categoryId: 'cat', paymentMethod: 'pix', createdAt: new Date(2026, 9, 19, 10).getTime() },
  ];
  const view = render(<ExpenseList expenses={expenses} categories={[]} currentYearMonth="2026-10"
    onEditExpense={vi.fn()} onDeleteExpense={vi.fn()} onOpenAddModal={vi.fn()} />);
  const order = () => [...view.container.querySelectorAll('tbody tr')].map(row => row.id);
  const sort = screen.getByLabelText('Ordenar despesas');
  expect(screen.getByRole('columnheader', { name: 'Data de lançamento' })).toBeTruthy();
  expect(order()).toEqual(['expense-row-b', 'expense-row-a']);
  fireEvent.change(sort, { target: { value: 'date_asc' } });
  expect(order()).toEqual(['expense-row-a', 'expense-row-b']);
  fireEvent.change(sort, { target: { value: 'amount_asc' } });
  expect(order()).toEqual(['expense-row-b', 'expense-row-a']);
  fireEvent.change(sort, { target: { value: 'amount_desc' } });
  expect(order()).toEqual(['expense-row-a', 'expense-row-b']);
  fireEvent.change(sort, { target: { value: 'created_asc' } });
  expect(order()).toEqual(['expense-row-b', 'expense-row-a']);
  fireEvent.change(sort, { target: { value: 'created_desc' } });
  expect(order()).toEqual(['expense-row-a', 'expense-row-b']);
});
