import type { CreditCard, Expense, CardInvoicePayment } from '../types';
import { isOpen, isSettled } from './financialStatus';
import { recurringDate } from './cardSummary';
export function invoiceDueDate(card: CreditCard, purchaseDate: string): string {
  const [year, month] = purchaseDate.split('-').map(Number);
  const closingThisMonth = recurringDate(purchaseDate.slice(0,7),card.closingDay);
  const shift = purchaseDate > closingThisMonth ? 1 : 0;
  const closingMonth = new Date(year,month-1+shift,1);
  const closingYM = closingMonth.getFullYear()+'-'+String(closingMonth.getMonth()+1).padStart(2,'0');
  const closing = recurringDate(closingYM,card.closingDay);
  const sameMonthDue = recurringDate(closingYM,card.dueDay);
  if(sameMonthDue > closing) return sameMonthDue;
  const next = new Date(closingMonth.getFullYear(),closingMonth.getMonth()+1,1);
  return recurringDate(next.getFullYear()+'-'+String(next.getMonth()+1).padStart(2,'0'),card.dueDay);
}
export function invoiceExpenses(expenses: Expense[], cards: CreditCard[], payments: CardInvoicePayment[]): Expense[] {
  const paid = new Map<string,CardInvoicePayment>();
  payments.forEach(p=>p.expenseIds.forEach(id=>paid.set(id,p)));
  return expenses.map(e=>{
    if(e.paymentMethod !== 'credit_card' || !e.cardId) return e;
    const card=cards.find(c=>c.id===e.cardId);
    const payment=paid.get(e.id);
    const due=e.invoiceDueDate || (card && !isSettled(e.status) ? invoiceDueDate(card,e.purchaseDate || e.date) : e.date);
    return {...e, purchaseDate:e.purchaseDate || e.date, invoiceDueDate:due, date:due,
      ...(payment ? {status:'paid' as const,settlementDate:payment.paymentDate,accountId:payment.accountId,cardInvoicePaymentId:payment.id} : {})};
  });
}
export function getCardInvoices(cardId: string, expenses: Expense[]) {
  const groups=new Map<string,Expense[]>();
  expenses.filter(e=>e.cardId===cardId && e.paymentMethod==='credit_card' && isOpen(e.status) && e.status!=='draft').forEach(e=>{
    const due=e.invoiceDueDate || e.date;
    groups.set(due,[...(groups.get(due)||[]),e]);
  });
  return [...groups].sort(([a],[b])=>a.localeCompare(b)).map(([dueDate,items])=>({
    dueDate,items,amount:items.reduce((sum,e)=>sum+Math.round(e.amount*100),0)/100,
  }));
}
