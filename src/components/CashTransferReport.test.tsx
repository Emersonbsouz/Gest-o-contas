import React from 'react';
import {afterEach,expect,test,vi} from 'vitest';
import {cleanup,fireEvent,render,screen,within} from '@testing-library/react';
import {DailyCashView} from './DailyCashView';
import {dailyCashSummary} from '../utils/dailyCash';
import type {TreasuryAccount,AccountTransfer} from '../types';
afterEach(()=>{cleanup();vi.restoreAllMocks();vi.unstubAllGlobals();});
const accounts:TreasuryAccount[]=[{id:'a',name:'Caixa Loja',type:'cash',initialBalance:100,color:'#123'},{id:'b',name:'Carteira Gestor',type:'cash',initialBalance:500,color:'#123'},{id:'c',name:'Banco Central',type:'checking',initialBalance:1000,color:'#123'}];
const date='2026-11-10';
const transfers:AccountTransfer[]=[{id:'in',fromAccountId:'b',toAccountId:'a',amount:100,date,description:'Aporte para troco',createdAt:1},{id:'out',fromAccountId:'a',toAccountId:'c',amount:30,date,description:'Depósito no banco',createdAt:2},{id:'other',fromAccountId:'b',toAccountId:'c',amount:200,date,description:'Outra movimentação',createdAt:3}];
function exportSetup(){let content='';vi.stubGlobal('Blob',class {constructor(parts:string[]){content=parts.join('');}});URL.createObjectURL=vi.fn(()=>'blob:cash');URL.revokeObjectURL=vi.fn();vi.spyOn(HTMLAnchorElement.prototype,'click').mockImplementation(()=>{});return ()=>content;}
test('cash report identifies received and sent internal transfers with both endpoints and conserved balances',()=>{
 render(<DailyCashView accounts={accounts} incomes={[]} expenses={[]} transfers={transfers} closings={[]} canClose onCloseDay={vi.fn()}/>);fireEvent.change(screen.getByLabelText('Data do fechamento'),{target:{value:date}});
 const table=screen.getByRole('table',{name:'Movimentos do caixa'});
 const incoming=within(table).getByText('Aporte para troco').closest('tr')!;expect(incoming.textContent).toContain('Transferência interna recebida');expect(incoming.textContent).toContain('Carteira Gestor');expect(incoming.textContent).toContain('Caixa Loja');
 const outgoing=within(table).getByText('Depósito no banco').closest('tr')!;expect(outgoing.textContent).toContain('Transferência interna enviada');expect(outgoing.textContent).toContain('Banco Central');expect(outgoing.textContent).toContain('-R$');
 expect(screen.queryByText('Outra movimentação')).toBeNull();const summary=dailyCashSummary(accounts[0],date,[],[],transfers);expect(summary.incomeTotal).toBe(0);expect(summary.expenseTotal).toBe(0);expect(summary.transferIn).toBe(100);expect(summary.transferOut).toBe(30);expect(summary.expectedBalance).toBe(170);
});
test('cash CSV includes transfer details for only the chosen cash and date',()=>{
 const content=exportSetup();render(<DailyCashView accounts={accounts} incomes={[]} expenses={[]} transfers={transfers} closings={[]} canClose onCloseDay={vi.fn()}/>);fireEvent.change(screen.getByLabelText('Data do fechamento'),{target:{value:date}});fireEvent.click(screen.getByRole('button',{name:'Exportar fechamento'}));
 expect(content()).toContain('Transferência interna recebida');expect(content()).toContain('Transferência interna enviada');expect(content()).toContain('Carteira Gestor');expect(content()).toContain('Banco Central');expect(content()).toContain('Saldo acumulado (R$)');expect(content()).toContain('170,00');expect(content()).not.toContain('Outra movimentação');
});
test('changed historical closing exports its original summary separately from current movements',()=>{
 const content=exportSetup();const original=dailyCashSummary(accounts[0],date,[],[],transfers);
 render(<DailyCashView accounts={accounts} incomes={[]} expenses={[]} transfers={transfers.map(t=>t.id==='in'?{...t,amount:200}:t)} closings={[{...original,id:'close',date,accountId:'a',accountName:'Caixa Loja',countedBalance:170,difference:0,closedAt:'2026-11-10T20:00:00Z',closedBy:'Teste'}]} canClose onCloseDay={vi.fn()}/>);fireEvent.change(screen.getByLabelText('Data do fechamento'),{target:{value:date}});fireEvent.click(screen.getByRole('button',{name:'Exportar fechamento'}));
 expect(content()).toContain('Movimentos atuais — alterados após o fechamento');expect(content()).toContain('"Saldo esperado";"170"');expect(content()).toContain('"Saldo esperado na consulta atual";"270"');
});
