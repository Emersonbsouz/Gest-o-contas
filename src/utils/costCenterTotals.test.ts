import { expect, test } from 'vitest';
import { costCenterTotals } from './costCenterTotals';
import type { Expense, Income } from '../types';

test('totals allocate split expenses without double counting and exclude cancelled entries', () => {
  const incomes = [{amount:1000,costCenterId:'a',status:'pending'},{amount:700,costCenterId:'a',status:'cancelled'},
    {amount:900,costCenterId:'b',status:'paid'}] as Income[];
  const expenses = [{amount:100,costCenterId:'a',status:'paid'},
    {amount:300,costCenterId:'a',status:'pending',splits:[{costCenterId:'a',amount:200},{costCenterId:'b',amount:100}]},
    {amount:500,costCenterId:'a',status:'CANCELADO'}] as Expense[];
  expect(costCenterTotals('a',incomes,expenses)).toEqual({revenue:1000,expense:300,balance:700});
  expect(costCenterTotals('b',incomes,expenses)).toEqual({revenue:900,expense:100,balance:800});
});
