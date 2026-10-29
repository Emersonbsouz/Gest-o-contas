
import React from 'react';
import {cleanup,fireEvent,render,screen,waitFor,act} from '@testing-library/react';
import {afterEach,expect,test,vi} from 'vitest';
import {TransferFormModal} from './TransferFormModal';
import {validateTransfer} from '../utils/transfers';
import {calculateAccountBalances} from '../utils/treasuryHelpers';
import type {TreasuryAccount} from '../types';
afterEach(cleanup);
const accounts:TreasuryAccount[]=[
{id:'a',name:'Banco A',type:'checking',initialBalance:1000,color:'#000'},
{id:'b',name:'Banco B',type:'checking',initialBalance:100,color:'#000'},
{id:'c',name:'Caixa',type:'cash',initialBalance:200,color:'#000'},
{id:'d',name:'Conta da tesouraria',type:'checking',initialBalance:50,color:'#000',treasuryId:'t'}];
const treasuries=[{id:'t',name:'Tesouraria principal'}];
test.each([
['a','b',undefined],['a','c',undefined],['a','d','t'],['c','d','t']
])('conserva saldo ao transferir de %s para %s', (from,to,treasury)=>{
 const data={fromAccountId:from!,toAccountId:to!,amount:75,date:'2026-10-15',description:'Teste',toTreasuryId:treasury};
 expect(()=>validateTransfer(data,accounts,treasuries)).not.toThrow();
 const balances=calculateAccountBalances(accounts,[],[],[{...data,id:'tr',createdAt:1}]);
 expect(balances[from!]).toBe(accounts.find(a=>a.id===from)!.initialBalance-75);
 expect(balances[to!]).toBe(accounts.find(a=>a.id===to)!.initialBalance+75);
 expect(Object.values(balances).reduce((a,b)=>a+b,0)).toBe(1350);
});
test('rejeita mesma conta, tesouraria incorreta, valor e data inválidos',()=>{
 const data={fromAccountId:'a',toAccountId:'b',amount:75,date:'2026-10-15',description:''};
 for(const patch of [{toAccountId:'a'},{toTreasuryId:'t'},{amount:0},{amount:NaN},{date:'2026-02-30'},{toAccountId:'excluida'}]){
 expect(()=>validateTransfer({...data,...patch},accounts,treasuries)).toThrow();
 }
});
function open(save:any,close:any=vi.fn()){
 render(<TransferFormModal isOpen accounts={accounts} treasuries={treasuries} onSave={save} onClose={close} defaultDate="2026-10-15"/>);
 fireEvent.change(screen.getByLabelText('Valor da transferência'),{target:{value:'75'}});
}
test('seleciona tesouraria e aguarda confirmação do salvamento',async()=>{
 let resolve!:()=>void;const save=vi.fn(()=>new Promise<void>(r=>{resolve=r;})),close=vi.fn();open(save,close);
 fireEvent.change(screen.getByLabelText('Tipo de destino'),{target:{value:'treasury'}});
 fireEvent.change(screen.getByLabelText('Tesouraria de destino'),{target:{value:'t'}});
 fireEvent.click(screen.getByRole('button',{name:'Realizar Transferência'}));
 await waitFor(()=>expect(save).toHaveBeenCalledWith(expect.objectContaining({fromAccountId:'a',toAccountId:'d',toTreasuryId:'t',amount:75}),undefined));
 expect(close).not.toHaveBeenCalled();
 await act(async()=>resolve());expect(close).toHaveBeenCalledTimes(1);
});
test('mantém formulário e informa falha ao salvar',async()=>{
 const close=vi.fn();open(vi.fn().mockRejectedValue(new Error('Falha de conexão')),close);
 fireEvent.click(screen.getByRole('button',{name:'Realizar Transferência'}));
 await waitFor(()=>expect(screen.getByRole('alert')).toBeTruthy());
 expect(close).not.toHaveBeenCalled();
 expect((screen.getByLabelText('Valor da transferência') as HTMLInputElement).value).toBe('75');
});
