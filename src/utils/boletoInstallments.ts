import type { Expense } from '../types';
import { validCalendarDate } from './dailyCash';
export function installmentDate(first: string, offset: number) {
  if (!validCalendarDate(first)) throw new Error('Informe um vencimento válido.');
  const [year, month, day] = first.split('-').map(Number);
  const target = new Date(year, month - 1 + offset, 1, 12);
  const lastDay = new Date(target.getFullYear(), target.getMonth() + 1, 0, 12).getDate();
  return target.getFullYear() + '-' + String(target.getMonth() + 1).padStart(2, '0') + '-' + String(Math.min(day, lastDay)).padStart(2, '0');
}
export function buildBoletoInstallments(base: Omit<Expense, 'id' | 'createdAt'>, count: number, mode: 'total' | 'each', overrides: Record<number, {date?: string; line?: string}> = {}) {
  if (!Number.isInteger(count) || count < 1 || count > 120) throw new Error('Informe entre 1 e 120 parcelas.');
  const cents = Math.round(base.amount * 100);
  if (!Number.isFinite(cents) || cents < (mode === 'total' ? count : 1)) throw new Error('O valor deve permitir pelo menos R$ 0,01 por parcela.');
  const divide = (value: number, index: number) => mode === 'each' ? value : Math.floor(value / count) + (index < value % count ? 1 : 0);
  const remainingSplits = base.splits?.map(split => Math.round(split.amount * 100));
  return Array.from({length: count}, (_, index) => {
    const dueDate = overrides[index]?.date || installmentDate(base.billetData?.dueDate || base.date, index);
    if (!validCalendarDate(dueDate)) throw new Error('Confira o vencimento de cada boleto.');
    let splits = base.splits;
    if (base.splits?.length && remainingSplits && mode === 'total') {
      const target = divide(cents, index);
      const remainingTotal = remainingSplits.reduce((sum, value) => sum + value, 0);
      if (remainingTotal !== cents - Array.from({length: index}, (_, i) => divide(cents, i)).reduce((sum, value) => sum + value, 0)) throw new Error('O rateio deve corresponder ao total da compra.');
      const shares = remainingSplits.map(value => Math.floor(value * target / remainingTotal));
      let remainder = target - shares.reduce((sum, value) => sum + value, 0);
      for (let i = 0; remainder > 0 && i < shares.length; i++) if (shares[i] < remainingSplits[i]) { shares[i]++; remainder--; }
      splits = base.splits.map((split, i) => { remainingSplits[i] -= shares[i]; return {...split, amount: shares[i] / 100}; }).filter(split => split.amount > 0);
    }
    const amount = splits?.length ? splits.reduce((sum, split) => sum + Math.round(split.amount * 100), 0) / 100 : divide(cents, index) / 100;
    if (amount <= 0) throw new Error('Confira o rateio: cada parcela precisa ter valor positivo.');
    return {...base, amount, splits, date: dueDate, description: base.description + ' (' + (index + 1) + '/' + count + ')',
      installments: {current: index + 1, total: count},
      billetData: {...base.billetData, dueDate, barcode: index === 0 ? base.billetData?.barcode : undefined,
        digitableLine: overrides[index]?.line ?? (index === 0 ? base.billetData?.digitableLine : undefined)},
      linha_digitavel: overrides[index]?.line ?? (index === 0 ? base.linha_digitavel : undefined),
      transacao_id_banco: index === 0 ? base.transacao_id_banco : undefined,
    };
  });
}
