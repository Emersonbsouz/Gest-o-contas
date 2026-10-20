import { validCalendarDate } from './dailyCash';
export function transactionEntryDate(item: {entryDate?: string; createdAt?: number}): string {
  if (item.entryDate && validCalendarDate(item.entryDate)) return item.entryDate;
  if (!item.createdAt || !Number.isFinite(item.createdAt)) return '';
  const date = new Date(item.createdAt);
  if (Number.isNaN(date.getTime())) return '';
  return date.getFullYear() + '-' + String(date.getMonth() + 1).padStart(2, '0') + '-' + String(date.getDate()).padStart(2, '0');
}
