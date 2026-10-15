
import React from 'react';
import { cleanup, fireEvent, render, screen, waitFor } from '@testing-library/react';
import { afterEach, expect, test, vi } from 'vitest';
import { CardInvoicePanel } from './CardInvoicePanel';
import { localToday } from '../utils/dailyCash';
afterEach(cleanup);
const card={id:'c',name:'Cartão',brand:'visa' as const,limit:1000,closingDay:25,dueDay:5,color:'#000',linkedAccountId:'bank'};
const expenses=[{id:'e',description:'Compra teste',amount:100,date:'2026-11-05',invoiceDueDate:'2026-11-05',paymentMethod:'credit_card' as const,cardId:'c',categoryId:'food',createdAt:1,status:'pending' as const}];
const accounts=[{id:'bank',name:'Conta de teste',type:'checking' as const,initialBalance:1000,color:'#000'}];
test('invoice payment asks for account and real payment date before submitting',async()=>{
 const pay=vi.fn().mockResolvedValue(undefined);
 render(<CardInvoicePanel card={card} expenses={expenses} accounts={accounts} payments={[]} onPay={pay}/>);
 fireEvent.click(screen.getByRole('button',{name:'Pagar fatura de 05/11/2026'}));
 expect(screen.getByLabelText('Conta de saída da fatura')).toBeTruthy();
 fireEvent.click(screen.getByRole('button',{name:'Confirmar pagamento integral'}));
 await waitFor(()=>expect(pay).toHaveBeenCalledWith('c','2026-11-05','bank',localToday(),{expenseIds:['e'],amount:100,expectedBalance:100}));
});
test('persistence failure is visible and keeps the invoice available for retry',async()=>{
 const pay=vi.fn().mockRejectedValue(new Error('Falha de gravação'));
 render(<CardInvoicePanel card={card} expenses={expenses} accounts={accounts} payments={[]} onPay={pay}/>);
 fireEvent.click(screen.getByRole('button',{name:'Pagar fatura de 05/11/2026'}));
 fireEvent.click(screen.getByRole('button',{name:'Confirmar pagamento integral'}));
 await waitFor(()=>expect(screen.getByRole('alert').textContent).toBe('Falha de gravação'));
 expect(screen.getByRole('button',{name:'Confirmar pagamento integral'})).toBeTruthy();
});

test('select all recalculates totals and partial amount is submitted with selected purchases',async()=>{
 const pay=vi.fn().mockResolvedValue(undefined);
 render(<CardInvoicePanel card={card} expenses={[...expenses,{...expenses[0],id:'second',description:'Segunda compra',amount:200}]} accounts={accounts} payments={[]} onPay={pay}/>);
 fireEvent.click(screen.getByRole('button',{name:'Pagar fatura de 05/11/2026'}));
 const all=screen.getByLabelText('Selecionar todas as despesas');
 fireEvent.click(all);
 expect((screen.getByLabelText('Valor do pagamento') as HTMLInputElement).value).toBe('0.00');
 fireEvent.click(all);
 expect((screen.getByLabelText('Valor do pagamento') as HTMLInputElement).value).toBe('300.00');
 fireEvent.click(screen.getByLabelText('Selecionar Segunda compra'));
 expect((screen.getByLabelText('Valor do pagamento') as HTMLInputElement).value).toBe('100.00');
 fireEvent.change(screen.getByLabelText('Valor do pagamento'),{target:{value:'40,00'}});
 fireEvent.click(screen.getByRole('button',{name:'Confirmar pagamento parcial'}));
 await waitFor(()=>expect(pay).toHaveBeenCalledWith('c','2026-11-05','bank',localToday(),{expenseIds:['e'],amount:40,expectedBalance:100}));
});

test('paid invoice history offers cancellation and correcting the payment amount',async()=>{
 const cancel=vi.fn().mockResolvedValue(undefined);const update=vi.fn().mockResolvedValue(undefined);
 const confirm=vi.spyOn(window,'confirm').mockReturnValue(true);
 const payment={id:'p',cardId:'c',dueDate:'2026-11-05',paymentDate:'2026-10-10',accountId:'bank',amount:100,expenseIds:['e'],createdAt:1};
 render(<CardInvoicePanel card={card} expenses={[{...expenses[0],status:'paid'}]} accounts={accounts} payments={[payment]} onCancelPayment={cancel} onUpdatePayment={update}/>);
 fireEvent.change(screen.getByLabelText('Filtrar histórico de faturas'),{target:{value:'paid'}});
 expect(screen.getByText('Paga')).toBeTruthy();
 fireEvent.click(screen.getByRole('button',{name:'Modificar pagamento'}));
 fireEvent.change(screen.getByLabelText('Valor corrigido do pagamento'),{target:{value:'40'}});
 fireEvent.click(screen.getByRole('button',{name:'Salvar correção'}));
 await waitFor(()=>expect(update).toHaveBeenCalledWith('p',{amount:40,accountId:'bank',paymentDate:'2026-10-10'}));
 fireEvent.click(screen.getByRole('button',{name:'Cancelar pagamento'}));
 await waitFor(()=>expect(cancel).toHaveBeenCalledWith('p'));
 confirm.mockRestore();
});
