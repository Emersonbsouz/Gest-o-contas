
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
 await waitFor(()=>expect(pay).toHaveBeenCalledWith('c','2026-11-05','bank',localToday()));
});
test('persistence failure is visible and keeps the invoice available for retry',async()=>{
 const pay=vi.fn().mockRejectedValue(new Error('Falha de gravação'));
 render(<CardInvoicePanel card={card} expenses={expenses} accounts={accounts} payments={[]} onPay={pay}/>);
 fireEvent.click(screen.getByRole('button',{name:'Pagar fatura de 05/11/2026'}));
 fireEvent.click(screen.getByRole('button',{name:'Confirmar pagamento integral'}));
 await waitFor(()=>expect(screen.getByRole('alert').textContent).toBe('Falha de gravação'));
 expect(screen.getByRole('button',{name:'Confirmar pagamento integral'})).toBeTruthy();
});
