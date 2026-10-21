import {FinancialView} from './FinancialView';
import {calculateAccountBalances} from '../utils/treasuryHelpers';
import React from 'react';
import {cleanup,fireEvent,render,screen,waitFor} from '@testing-library/react';
import {afterEach,expect,test,vi} from 'vitest';
import {TransferReport} from './TransferReport';
import {TransferFormModal} from './TransferFormModal';
import {localToday} from '../utils/dailyCash';
import type {TreasuryAccount} from '../types';
afterEach(()=>{cleanup();vi.restoreAllMocks();vi.unstubAllGlobals();});
const accounts:TreasuryAccount[]=[{id:'bank',name:'Banco',type:'checking',initialBalance:500,color:'#123'},{id:'wallet',name:'Carteira',type:'cash',initialBalance:100,color:'#123'},{id:'cash',name:'Caixa loja',type:'cash',initialBalance:0,color:'#123'}];
const transfers=[{id:'one',fromAccountId:'wallet',toAccountId:'cash',amount:30,date:'2026-10-21',description:'Troco loja',createdAt:2},{id:'two',fromAccountId:'bank',toAccountId:'wallet',amount:100,date:'2026-09-15',description:'Retirada banco',createdAt:1}];
test('wallet to cash transfer preserves selected origin, defaults to today and saves both endpoints',async()=>{
 const save=vi.fn().mockResolvedValue(undefined);render(<TransferFormModal isOpen onClose={vi.fn()} onSave={save} accounts={accounts} defaultFromAccountId="wallet"/>);
 expect((screen.getByLabelText('Conta de origem') as HTMLSelectElement).value).toBe('wallet');
 expect((screen.getByLabelText('Data da transferência') as HTMLInputElement).value).toBe(localToday());
 fireEvent.change(screen.getByLabelText('Conta de destino'),{target:{value:'cash'}});
 fireEvent.change(screen.getByLabelText('Valor da transferência'),{target:{value:'30'}});
 fireEvent.click(screen.getByRole('button',{name:'Realizar Transferência'}));
 await waitFor(()=>expect(save).toHaveBeenCalledWith(expect.objectContaining({fromAccountId:'wallet',toAccountId:'cash',amount:30}),undefined));
});
test('report filters dates, origin and destination and exports exactly displayed transfers',()=>{
 let content='';vi.stubGlobal('Blob',class {constructor(parts:string[]){content=parts.join('');}});URL.createObjectURL=vi.fn(()=>'blob:report');URL.revokeObjectURL=vi.fn();vi.spyOn(HTMLAnchorElement.prototype,'click').mockImplementation(()=>{});
 render(<TransferReport transfers={transfers} accounts={accounts} onBack={vi.fn()} companyName="Empresa"/>);
 expect(screen.getByText('Troco loja')).toBeTruthy();expect(screen.getByText('Retirada banco')).toBeTruthy();
 fireEvent.change(screen.getByLabelText('Origem das transferências'),{target:{value:'wallet'}});fireEvent.change(screen.getByLabelText('Destino das transferências'),{target:{value:'cash'}});fireEvent.change(screen.getByLabelText('Data inicial das transferências'),{target:{value:'2026-10-01'}});
 expect(screen.queryByText('Retirada banco')).toBeNull();fireEvent.click(screen.getByRole('button',{name:'Exportar transferências'}));expect(content).toContain('Troco loja');expect(content).toContain('30,00');expect(content).not.toContain('Retirada banco');
 fireEvent.change(screen.getByLabelText('Data final das transferências'),{target:{value:'2026-09-01'}});expect(screen.getByRole('alert')).toBeTruthy();expect((screen.getByRole('button',{name:'Exportar transferências'}) as HTMLButtonElement).disabled).toBe(true);
});

test('transfer from the wallet card forwards its account to the parent and preserves total funds',()=>{
 const open=vi.fn(),noop=vi.fn();render(<FinancialView expenses={[]} incomes={[]} accounts={accounts} transfers={[]} categories={[]} cards={[]} contacts={[]} costCenters={[]} currentYearMonth="2026-10" onMonthChange={noop} onOpenExpenseModal={noop} onOpenIncomeModal={noop} onOpenTransferModal={open} onEditExpense={noop} onDeleteExpense={noop} onEditIncome={noop} onDeleteIncome={noop} onEditTransfer={noop} onDeleteTransfer={noop} onLiquidateExpense={noop} onLiquidateIncome={noop} onOpenAccountModal={noop} onDeleteAccount={noop}/>);
 fireEvent.click(screen.getByRole('button',{name:'Tesouraria'}));fireEvent.click(screen.getByTitle('Transferir a partir da conta Carteira'));expect(open).toHaveBeenCalledWith('wallet');
 const balances=calculateAccountBalances(accounts,[],[],[transfers[0]]);expect(balances.wallet).toBe(70);expect(balances.cash).toBe(30);expect(Object.values(balances).reduce((sum,value)=>sum+value,0)).toBe(600);
});

test('cash funding report shows only wallet-to-cash contributions and exports the same scope',()=>{
 let content='';vi.stubGlobal('Blob',class {constructor(parts:string[]){content=parts.join('');}});URL.createObjectURL=vi.fn(()=>'blob:report');URL.revokeObjectURL=vi.fn();vi.spyOn(HTMLAnchorElement.prototype,'click').mockImplementation(()=>{});
 render(<TransferReport transfers={transfers} accounts={accounts} initialScope="cash" onBack={vi.fn()}/>);
 expect(screen.getByRole('heading',{name:'Relatório de aportes entre caixas'})).toBeTruthy();expect(screen.getByText('Troco loja')).toBeTruthy();expect(screen.queryByText('Retirada banco')).toBeNull();
 expect(screen.queryByRole('option',{name:'Banco'})).toBeNull();fireEvent.click(screen.getByRole('button',{name:'Exportar aportes'}));expect(content).toContain('Total aportado');expect(content).toContain('Troco loja');expect(content).not.toContain('Retirada banco');
});
