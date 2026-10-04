import type { PaymentStatus } from '../types';

export function isSettled(status?: PaymentStatus): boolean {
  // Records from before status tracking were posted directly to the ledger.
  return !status || ['paid', 'liquidated', 'PAGO'].includes(status);
}

export function isCancelled(status?: PaymentStatus): boolean {
  return !!status && ['cancelled', 'CANCELADO', 'rejected'].includes(status);
}

export function isOpen(status?: PaymentStatus): boolean {
  return !isSettled(status) && !isCancelled(status);
}

export function statusLabel(status?: PaymentStatus, kind: 'income' | 'expense' = 'expense'): string {
  if (isCancelled(status)) return 'Cancelado';
  if (isSettled(status)) return kind === 'income' ? 'Recebido' : 'Pago';
  if (status === 'overdue' || status === 'VENCIDO') return 'Vencido';
  if (status === 'draft') return 'Rascunho';
  return 'Em aberto';
}
