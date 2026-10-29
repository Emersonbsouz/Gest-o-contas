import type { Expense, CreditCard, PaymentMethod } from '../types';
import { buildBoletoInstallments } from './boletoInstallments';
import { buildCardInstallments } from './cardInstallments';
import { localToday, validCalendarDate } from './dailyCash';

type Payload = Omit<Expense, 'id' | 'createdAt'>;
interface Options {amount:number; date:string; accountId:string; paymentMethod:PaymentMethod; count:number; card?:CreditCard; overrides?:Record<number,{date?:string; amount?:number}>;}
export function buildDownPaymentPlan(base:Payload, options:Options) {
 const total=Math.round(base.amount*100), down=Math.round(options.amount*100);
 if(!Number.isFinite(total)||!Number.isFinite(down)||down<=0||down>=total)throw new Error('A entrada deve ser maior que zero e menor que o valor total.');
 if(!validCalendarDate(options.date)||options.date>localToday())throw new Error('Informe uma data válida para a entrada, até hoje.');
 if(!options.accountId || ['credit_card','boleto'].includes(options.paymentMethod))throw new Error('Informe a conta e o meio de pagamento da entrada.');
 if(!Number.isInteger(options.count)||options.count<1||options.count>120)throw new Error('Informe entre 1 e 120 parcelas para o saldo.');
 if(!validCalendarDate(base.date))throw new Error('Informe a data da compra ou do primeiro vencimento.');
 let entrySplits=base.splits, remainingSplits=base.splits;
 if(base.splits?.length){
  const cents=base.splits.map(s=>Math.round(s.amount*100));
  if(cents.reduce((n,v)=>n+v,0)!==total)throw new Error('O rateio deve corresponder ao total da compra.');
  const shares=cents.map(value=>Math.floor(value*down/total));
  let rest=down-shares.reduce((n,v)=>n+v,0);
  for(let i=0;rest>0&&i<shares.length;i++)if(shares[i]<cents[i]){shares[i]++;rest--;}
  entrySplits=base.splits.map((s,i)=>({...s,amount:shares[i]/100})).filter(s=>s.amount>0);
  remainingSplits=base.splits.map((s,i)=>({...s,amount:(cents[i]-shares[i])/100})).filter(s=>s.amount>0);
 }
 const entry:Payload={...base,description:base.description+' (Entrada)',amount:down/100,date:options.date,
  settlementDate:options.date,accountId:options.accountId,paymentMethod:options.paymentMethod,status:'paid',isDownPayment:true,
  splits:entrySplits,installments:undefined,cardId:undefined,purchaseDate:undefined,invoiceDueDate:undefined,
  cardInvoicePaymentId:undefined,purchaseStatus:undefined,billetData:undefined,linha_digitavel:undefined,transacao_id_banco:undefined,isRecurring:false};
 const remaining:Payload={...base,amount:(total-down)/100,splits:remainingSplits,status:'pending',settlementDate:undefined,isDownPayment:false,isRecurring:false};
 let parts:Payload[];
 if(base.paymentMethod==='credit_card'){
  if(!options.card)throw new Error('Selecione o cartão do saldo parcelado.');
  parts=buildCardInstallments(remaining,options.card,options.count,'total');
 }else{
  parts=buildBoletoInstallments(remaining,options.count,'total').map(part=>({...part,
   billetData:base.paymentMethod==='boleto'?part.billetData:undefined,
   linha_digitavel:base.paymentMethod==='boleto'?part.linha_digitavel:undefined}));
 }
 const values=parts.map((part,index)=>Math.round((options.overrides?.[index]?.amount ?? part.amount)*100));
 if(values.some(value=>!Number.isFinite(value)||value<=0))throw new Error('Cada parcela precisa ter um valor maior que zero.');
 if(values.reduce((sum,value)=>sum+value,0)!==total-down)throw new Error('A soma das parcelas deve ser igual ao saldo restante.');
 const splitPool=remainingSplits?.map(split=>Math.round(split.amount*100));
 parts=parts.map((part,index)=>{
  const due=options.overrides?.[index]?.date ?? part.date;
  if(!validCalendarDate(due))throw new Error('Confira o vencimento de cada parcela.');
  let splits=part.splits;
  if(remainingSplits?.length && splitPool){
   const poolTotal=splitPool.reduce((sum,value)=>sum+value,0);
   const shares=splitPool.map(value=>Math.floor(value*values[index]/poolTotal));
   let rest=values[index]-shares.reduce((sum,value)=>sum+value,0);
   for(let i=0;rest>0&&i<shares.length;i++)if(shares[i]<splitPool[i]){shares[i]++;rest--;}
   splits=remainingSplits.map((split,i)=>{splitPool[i]-=shares[i];return {...split,amount:shares[i]/100};}).filter(split=>split.amount>0);
  }
  return {...part,amount:values[index]/100,splits,date:due,
   invoiceDueDate:base.paymentMethod==='credit_card'?due:undefined,
   billetData:part.billetData?{...part.billetData,dueDate:due}:undefined};
 });
 if(parts.some(p=>p.date<options.date))throw new Error('O vencimento do saldo não pode ser anterior à entrada.');
 return [entry,...parts];
}
