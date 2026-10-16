
import type {AccountTransfer,TreasuryAccount,TreasuryGroup} from '../types';
import {validCalendarDate} from './dailyCash';
export function validateTransfer(data:Omit<AccountTransfer,'id'|'createdAt'>,accounts:TreasuryAccount[],treasuries:TreasuryGroup[]) {
 const from=accounts.find(a=>a.id===data.fromAccountId),to=accounts.find(a=>a.id===data.toAccountId);
 if(!from || !to)throw new Error('Selecione uma conta ou caixa válido na origem e no destino.');
 if(from.id===to.id)throw new Error('Origem e destino precisam ser contas ou caixas diferentes.');
 if(!Number.isFinite(data.amount)||Math.round(data.amount*100)<=0)throw new Error('Informe um valor de transferência maior que zero.');
 if(!validCalendarDate(data.date))throw new Error('Informe uma data de transferência válida.');
 for(const [id,account] of [[data.fromTreasuryId,from],[data.toTreasuryId,to]] as const){
  if(id && (!treasuries.some(t=>t.id===id)||account.treasuryId!==id))throw new Error('A conta ou caixa escolhido não pertence à tesouraria selecionada.');
 }
}
