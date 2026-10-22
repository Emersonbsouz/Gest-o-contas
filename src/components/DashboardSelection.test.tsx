import React from 'react';
import {cleanup,fireEvent,render,screen} from '@testing-library/react';
import {afterEach,expect,test,vi} from 'vitest';
import {DashboardView} from './DashboardView';
import type {TreasuryAccount,Expense} from '../types';
afterEach(cleanup);
const accounts:TreasuryAccount[]=[{id:'a',name:'Caixa A',type:'cash',initialBalance:100,treasuryId:'t1',color:'#123'},{id:'b',name:'Carteira B',type:'cash',initialBalance:200,treasuryId:'t1',color:'#123'},{id:'c',name:'Banco C',type:'checking',initialBalance:300,treasuryId:'t2',color:'#123'},{id:'d',name:'Reserva D',type:'savings',initialBalance:400,color:'#123'}];
const expenses:Expense[]=[{id:'ea',description:'Pendente Caixa A',amount:10,date:'2026-11-01',categoryId:'cat',accountId:'a',status:'PENDENTE',paymentMethod:'cash',createdAt:1},{id:'ec',description:'Pendente Banco C',amount:20,date:'2026-11-02',categoryId:'cat',accountId:'c',status:'pending',paymentMethod:'pix',createdAt:1}];
function props(){return {accounts,expenses,incomes:[],transfers:[{id:'transfer',fromAccountId:'a',toAccountId:'c',amount:50,date:'2026-10-21',description:'Transferência',createdAt:1}],treasuries:[{id:'t1',name:'Tesouraria 1'},{id:'t2',name:'Tesouraria 2'}],costCenters:[],proposals:[],onAction:vi.fn(),onViewChange:vi.fn()};}
function check(name:string){fireEvent.click(screen.getByRole('checkbox',{name}));}
test('dashboard selects multiple treasuries and individual wallets without counting any account twice',()=>{
 render(<DashboardView {...props()}/>);
 expect(screen.getByRole('heading',{name:/R\$\s*1\.000,00/})).toBeTruthy();
 fireEvent.click(screen.getByRole('button',{name:'Limpar seleção'}));expect(screen.getByRole('heading',{name:/R\$\s*0,00/})).toBeTruthy();
 check('Selecionar tesouraria Tesouraria 1');expect(screen.getByRole('heading',{name:/R\$\s*250,00/})).toBeTruthy();
 expect((screen.getByRole('checkbox',{name:'Selecionar conta Caixa A'}) as HTMLInputElement).checked).toBe(true);
 expect(screen.queryByText('Pendente Banco C')).toBeNull();expect(screen.getByText('Pendente Caixa A')).toBeTruthy();
 check('Selecionar tesouraria Tesouraria 2');expect(screen.getByRole('heading',{name:/R\$\s*600,00/})).toBeTruthy();
 check('Selecionar conta Caixa A');expect(screen.getByRole('heading',{name:/R\$\s*550,00/})).toBeTruthy();
 expect((screen.getByRole('checkbox',{name:'Selecionar tesouraria Tesouraria 1'}) as HTMLInputElement).indeterminate).toBe(true);
 expect(screen.queryByText('Pendente Caixa A')).toBeNull();expect(screen.getByText('Pendente Banco C')).toBeTruthy();
 check('Selecionar conta Reserva D');expect(screen.getByRole('heading',{name:/R\$\s*950,00/})).toBeTruthy();
 fireEvent.click(screen.getByRole('button',{name:'Selecionar todos'}));expect(screen.getByRole('heading',{name:/R\$\s*1\.000,00/})).toBeTruthy();
});
test('clearing every account produces an explicit empty scope and leaves no unrelated payable displayed',()=>{
 render(<DashboardView {...props()}/>);fireEvent.click(screen.getByRole('button',{name:'Limpar seleção'}));expect(screen.getByText(/Nenhum caixa ou conta selecionado/)).toBeTruthy();expect(screen.queryByText('Pendente Caixa A')).toBeNull();expect(screen.queryByText('Pendente Banco C')).toBeNull();
});
test('all selected accounts are listed beyond the former limit of five',()=>{
 const more=Array.from({length:7},(_,index)=>({...accounts[0],id:'extra-'+index,name:'Caixa adicional '+index}));
 render(<DashboardView {...props()} accounts={more}/>);expect(screen.getByRole('checkbox',{name:'Selecionar conta Caixa adicional 6'})).toBeTruthy();expect(screen.getAllByText('Caixa adicional 6')).toHaveLength(2);
});
