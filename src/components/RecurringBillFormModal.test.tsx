
import React from 'react';
import { cleanup, fireEvent, render, screen, waitFor } from '@testing-library/react';
import { afterEach, expect, test, vi } from 'vitest';
import { RecurringBillFormModal } from './RecurringBillFormModal';
afterEach(cleanup);
const card = {id:'card-a',name:'Cartão teste',brand:'visa' as const,limit:1000,closingDay:25,dueDay:5,color:'#000'};
test('saves subscription with selected card and no bank account',async()=>{
 const save=vi.fn().mockResolvedValue(undefined);
 render(<RecurringBillFormModal isOpen initialSubscription onClose={vi.fn()} onSave={save} cards={[card]} accounts={[{id:'bank',name:'Banco',type:'checking',initialBalance:0,color:'#000'}]} />);
 fireEvent.change(screen.getByPlaceholderText('Ex: Aluguel, Internet Fibra, Netflix, Salário Fixo'),{target:{value:'Streaming'}});
 fireEvent.change(screen.getByPlaceholderText('150,00'),{target:{value:'49,90'}});
 fireEvent.click(screen.getByRole('button',{name:'Cartão de Crédito'}));
 fireEvent.click(screen.getByRole('button',{name:'Cadastrar Assinatura'}));
 await waitFor(()=>expect(save).toHaveBeenCalledWith(expect.objectContaining({kind:'subscription',type:'expense',cardId:'card-a',accountId:undefined,amount:49.9}),undefined));
});
test('does not save a subscription linked to a missing card',async()=>{
 const save=vi.fn();
 render(<RecurringBillFormModal isOpen initialSubscription onClose={vi.fn()} onSave={save} />);
 fireEvent.change(screen.getByPlaceholderText('Ex: Aluguel, Internet Fibra, Netflix, Salário Fixo'),{target:{value:'Streaming'}});
 fireEvent.change(screen.getByPlaceholderText('150,00'),{target:{value:'49,90'}});
 fireEvent.click(screen.getByRole('button',{name:'Cartão de Crédito'}));
 fireEvent.click(screen.getByRole('button',{name:'Cadastrar Assinatura'}));
 expect(save).not.toHaveBeenCalled();
 expect(screen.getByText('Cadastre e selecione um cartão válido para vincular esta assinatura ou recorrência.')).toBeTruthy();
});
