import type { CreditCard, Expense } from '../types';
import { buildBoletoInstallments, installmentDate } from './boletoInstallments';
import { invoiceDueDate } from './cardInvoices';
import { recurringDate } from './cardSummary';
import { isSettled } from './financialStatus';

export function buildCardInstallments(base: Omit<Expense, 'id' | 'createdAt'>, card: CreditCard, count: number, mode: 'total' | 'each') {
  const firstDue = invoiceDueDate(card, base.date);
  const parts = buildBoletoInstallments({...base, date: firstDue}, count, mode);
  return parts.map((part, index) => {
    const due = recurringDate(installmentDate(firstDue.slice(0, 7) + '-01', index).slice(0, 7), card.dueDay);
    return {...part, paymentMethod: 'credit_card' as const, cardId: card.id,
      purchaseDate: base.date, date: due, invoiceDueDate: due,
      purchaseStatus: base.status, status: isSettled(base.status) ? 'pending' as const : base.status,
      accountId: undefined, settlementDate: undefined, cardInvoicePaymentId: undefined,
      billetData: undefined, linha_digitavel: undefined, transacao_id_banco: undefined};
  });
}
