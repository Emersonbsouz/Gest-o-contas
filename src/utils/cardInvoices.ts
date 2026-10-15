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
// Paid portions and the outstanding portion sum to the original purchase.
// This keeps category totals intact while cash leaves the right account on each payment date.
export function invoiceExpenses(expenses: Expense[], cards: CreditCard[], payments: CardInvoicePayment[]): Expense[] {
  const cents=(n:number)=>Math.round(n*100);
  const portion=(e:Expense, amount:number):Expense => {
    if(!e.splits?.length) return {...e,amount};
    let remaining=cents(amount);
    const splits=e.splits.map((split,index)=>{
      const value=index===e.splits!.length-1 ? remaining : Math.min(remaining,Math.round(cents(split.amount)*amount/e.amount));
      remaining-=value;
      return {...split,amount:value/100};
    });
    return {...e,amount,splits};
  };
  return expenses.flatMap(e=>{
    if(e.paymentMethod !== 'credit_card' || !e.cardId) return [e];
    const card=cards.find(c=>c.id===e.cardId);
    const due=e.invoiceDueDate || (card && !isSettled(e.status) ? invoiceDueDate(card,e.purchaseDate || e.date) : e.date);
    const base={...e,purchaseDate:e.purchaseDate || e.date,invoiceDueDate:due,date:due};
    const allocations=payments.filter(p=>p.cardId===e.cardId).flatMap(p=>{
      const value=p.allocations ? p.allocations.filter(a=>a.expenseId===e.id).reduce((n,a)=>n+cents(a.amount),0) : p.expenseIds.includes(e.id) ? cents(e.amount) : 0;
      return value>0 ? [{payment:p,value}] : [];
    });
    if(!allocations.length) return [base];
    let remaining=cents(e.amount);
    const paid:Expense[]=[];
    for(const {payment,value} of allocations) {
      const applied=Math.min(remaining,value); if(applied<=0) continue; remaining-=applied;
      paid.push({...portion(base,applied/100),id:'paid:'+e.id+':'+payment.id,sourceExpenseId:e.id,cardPurchaseAmount:e.amount,status:'paid',settlementDate:payment.paymentDate,accountId:payment.accountId,cardInvoicePaymentId:payment.id,description:e.description+(applied<cents(e.amount)?' (pagamento parcial)':'')});
    }
    if(remaining>0) return [{...portion(base,remaining/100),cardPurchaseAmount:e.amount,status:'pending',accountId:undefined,settlementDate:undefined},...paid];
    if(paid.length===1) paid[0].id=e.id;
    return paid;
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
