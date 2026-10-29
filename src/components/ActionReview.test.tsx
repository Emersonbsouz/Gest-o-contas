import React,{useState} from 'react';
import {cleanup,fireEvent,render,screen,waitFor,within} from '@testing-library/react';
import {afterEach,expect,test,vi} from 'vitest';
import {ActionReviewProvider,formReviewDetails,useActionReview} from '../context/ActionReviewContext';
import {ContactFormModal} from './ContactFormModal';
import {FinancialFormModal} from './FinancialFormModal';
import {DailyCashView} from './DailyCashView';
import {DEFAULT_CATEGORIES} from '../data/defaultCategories';
import {localToday} from '../utils/dailyCash';

afterEach(cleanup);
test('review shows contact data before writing; going back preserves inputs and confirming saves once',async()=>{
 const save=vi.fn().mockResolvedValue(undefined),close=vi.fn();
 render(<ActionReviewProvider><ContactFormModal isOpen onClose={close} onSave={save}/></ActionReviewProvider>);
 const name=screen.getByPlaceholderText('Ex: Supermercado Pão de Açúcar, Dr. Lucas, Tech Solutions');
 fireEvent.change(name,{target:{value:'Fornecedor inicial'}});
 fireEvent.change(screen.getByPlaceholderText('contato@empresa.com'),{target:{value:'contato@example.com'}});
 fireEvent.click(screen.getByRole('button',{name:'Cadastrar Contato'}));
 const dialog=await screen.findByRole('dialog');
 expect(within(dialog).getByText('Fornecedor inicial')).toBeTruthy();
 expect(within(dialog).getByText('contato@example.com')).toBeTruthy();
 expect(save).not.toHaveBeenCalled();expect(close).not.toHaveBeenCalled();
 fireEvent.click(within(dialog).getByRole('button',{name:'Voltar para revisar'}));
 await waitFor(()=>expect(screen.queryByRole('dialog')).toBeNull());
 expect((name as HTMLInputElement).value).toBe('Fornecedor inicial');
 fireEvent.change(name,{target:{value:'Fornecedor revisado'}});
 fireEvent.click(screen.getByRole('button',{name:'Cadastrar Contato'}));
 const confirm=within(await screen.findByRole('dialog')).getByRole('button',{name:'Confirmar e finalizar'});
 fireEvent.click(confirm);fireEvent.click(confirm);
 await waitFor(()=>expect(save).toHaveBeenCalledTimes(1));
 expect(save).toHaveBeenCalledWith(expect.objectContaining({name:'Fornecedor revisado'}),undefined);
 await waitFor(()=>expect(close).toHaveBeenCalledTimes(1));
});

test('invalid registrations stay in the form without opening a review',()=>{
 const save=vi.fn();render(<ActionReviewProvider><ContactFormModal isOpen onClose={vi.fn()} onSave={save}/></ActionReviewProvider>);
 fireEvent.submit(screen.getByRole('button',{name:'Cadastrar Contato'}).closest('form')!);
 expect(screen.queryByRole('dialog')).toBeNull();expect(save).not.toHaveBeenCalled();
});

test('one review covers entry and all balance installments, preserving dates and amounts on return',async()=>{
 const batch=vi.fn().mockResolvedValue(undefined),single=vi.fn();
 render(<ActionReviewProvider><FinancialFormModal type="expense" isOpen onClose={vi.fn()} onSave={single} onSaveExpenseInstallments={batch}
 categories={DEFAULT_CATEGORIES} accounts={[{id:'bank',name:'Banco',type:'checking',initialBalance:0,color:'#000'}]}
 contacts={[{id:'person',name:'Fornecedor',type:'supplier'}]} costCenters={[{id:'cc',name:'Obra',clientId:'',status:'active',color:'#000',createdAt:1}]}/></ActionReviewProvider>);
 fireEvent.change(screen.getByPlaceholderText('Ex: Mercado, Aluguel, Internet'),{target:{value:'Compra revisada'}});
 fireEvent.change(screen.getByPlaceholderText('0,00'),{target:{value:'1000'}});
 fireEvent.change(screen.getByLabelText('Data de vencimento *'),{target:{value:'2027-01-10'}});
 fireEvent.click(screen.getByRole('button',{name:'Continuar'}));
 expect(screen.queryByRole('dialog')).toBeNull();
 fireEvent.change(screen.getByLabelText('Fornecedor / Favorecido'),{target:{value:'person'}});
 fireEvent.change(screen.getByLabelText('Centro de Custo'),{target:{value:'cc'}});
 fireEvent.click(screen.getByRole('checkbox',{name:'Tem entrada?'}));
 fireEvent.change(screen.getByLabelText('Valor da entrada'),{target:{value:'200'}});
 fireEvent.click(screen.getByRole('checkbox',{name:'Compra Parcelada'}));
 fireEvent.change(screen.getByLabelText('Total de parcelas'),{target:{value:'2'}});
 fireEvent.change(screen.getByLabelText('Valor da parcela do saldo 1'),{target:{value:'300'}});
 fireEvent.change(screen.getByLabelText('Valor da parcela do saldo 2'),{target:{value:'500'}});
 fireEvent.change(screen.getByLabelText('Vencimento da parcela do saldo 2'),{target:{value:'2027-03-15'}});
 fireEvent.click(screen.getByRole('button',{name:'Cadastrar Despesa'}));
 const dialog=await screen.findByRole('dialog');
 expect(within(dialog).getByText('Compra revisada')).toBeTruthy();
 expect(within(dialog).getByText('Valor total')).toBeTruthy();
 expect(within(dialog).getByText('Situação da entrada')).toBeTruthy();
 expect(within(dialog).getByText('Valor da entrada')).toBeTruthy();
 expect(within(dialog).getByText('15/03/2027')).toBeTruthy();
 expect(batch).not.toHaveBeenCalled();
 fireEvent.click(within(dialog).getByRole('button',{name:'Voltar para revisar'}));
 await waitFor(()=>expect(screen.queryByRole('dialog')).toBeNull());
 expect((screen.getByLabelText('Valor da parcela do saldo 1') as HTMLInputElement).value).toBe('300');
 expect((screen.getByLabelText('Vencimento da parcela do saldo 2') as HTMLInputElement).value).toBe('2027-03-15');
 fireEvent.click(screen.getByRole('button',{name:'Cadastrar Despesa'}));
 fireEvent.click(within(await screen.findByRole('dialog')).getByRole('button',{name:'Confirmar e finalizar'}));
 await waitFor(()=>expect(batch).toHaveBeenCalledTimes(1));
 expect(batch.mock.calls[0][0].map((i:{amount:number})=>i.amount)).toEqual([200,300,500]);
 expect(single).not.toHaveBeenCalled();
});

test('daily cash closing waits for review with account and counted balance',async()=>{
 const close=vi.fn().mockResolvedValue(undefined);
 render(<ActionReviewProvider><DailyCashView accounts={[{id:'cash',name:'Caixa teste',type:'cash',initialBalance:100,color:'#000'}]} incomes={[]} expenses={[]} transfers={[]} closings={[]} canClose onCloseDay={close}/></ActionReviewProvider>);
 fireEvent.change(screen.getByLabelText('Saldo contado'),{target:{value:'100'}});
 fireEvent.click(screen.getByRole('button',{name:'Confirmar fechamento diário'}));
 const dialog=await screen.findByRole('dialog');expect(within(dialog).getByText('Caixa teste')).toBeTruthy();expect(close).not.toHaveBeenCalled();
 fireEvent.click(within(dialog).getByRole('button',{name:'Confirmar e finalizar'}));
 await waitFor(()=>expect(close).toHaveBeenCalledTimes(1));
 expect(close).toHaveBeenCalledWith('cash',localToday(),100,'',expect.any(String));
});

test('form summaries exclude secrets and use selected labels and checkbox states',()=>{
 const form=document.createElement('form');
 form.innerHTML='<label>Nome<input value="Exemplo"></label><label>Senha<input type="password" value="secret"></label><input type="hidden" value="token"><label>Tipo<select><option value="internal" selected>Conta corrente</option></select></label><label>Tem entrada?<input type="checkbox" checked></label>';
 const details=formReviewDetails(form,'Revisar');
 expect(details.fields).toEqual([{label:'Nome',value:'Exemplo'},{label:'Tipo',value:'Conta corrente'},{label:'Tem entrada?',value:'Sim'}]);
});

function Harness(){const {review}=useActionReview();const [result,setResult]=useState('');return <><button onClick={async()=>setResult(String(await review({title:'Revisar tarefa',fields:[{label:'Tarefa',value:'Concluir operação'}]})))}>Finalizar tarefa</button><span>{result}</span></>;}
test('escape returns to review without completing and focus returns to the initiating control',async()=>{
 render(<ActionReviewProvider><Harness/></ActionReviewProvider>);
 const start=screen.getByRole('button',{name:'Finalizar tarefa'});start.focus();fireEvent.click(start);
 const dialog=await screen.findByRole('dialog');expect(document.activeElement).toBe(within(dialog).getByRole('button',{name:'Voltar para revisar'}));
 fireEvent.keyDown(document,{key:'Escape'});
 await screen.findByText('false');expect(document.activeElement).toBe(start);
});
