import React, {useState} from 'react';
import {Plus, Edit2, Trash2} from 'lucide-react';
import {getSaveErrorMessage} from '../utils/saveErrors';
export interface RegistryColumn<T> {label:string; render:(item:T)=>React.ReactNode;}
export interface RegistryAction<T> {label:string; run:(item:T)=>unknown|Promise<unknown>; destructive?:boolean; confirm?:(item:T)=>string;}
interface Props<T extends {id:string}> {
 title:string; description?:string; items:T[]; columns:RegistryColumn<T>[]; actions:RegistryAction<T>[];
 onCreate?:()=>void; createLabel?:string; createAriaLabel?:string; toolbar?:React.ReactNode; emptyMessage?:string;
}
export function RegistryTable<T extends {id:string}>({title,description,items,columns,actions,onCreate,createLabel='Novo cadastro',createAriaLabel,toolbar,emptyMessage='Nenhum cadastro encontrado. Use o botão acima para cadastrar.'}:Props<T>){
 const labelOf=(item:T)=>{const record=item as T & {name?:string;title?:string;description?:string};return record.name||record.title||record.description||title;};
 const [busy,setBusy]=useState<string|null>(null),[error,setError]=useState('');
 async function run(action:RegistryAction<T>,item:T){
  if(busy)return;
  if(action.destructive&&!window.confirm(action.confirm?.(item)||'Deseja excluir este cadastro?'))return;
  setError('');setBusy(item.id);
  try{await action.run(item);}catch(err){setError(getSaveErrorMessage(err));}finally{setBusy(null);}
 }
 return <section className="overflow-hidden rounded-xl border border-slate-200 bg-white shadow-xs">
  <div className="flex flex-wrap items-center justify-between gap-4 border-b border-slate-200 px-5 py-4"><div><h3 className="text-base font-semibold text-slate-900">{title}</h3>{description&&<p className="mt-1 text-sm text-slate-500">{description}</p>}<p className="mt-2 text-xs font-medium text-slate-500">{items.length} registro(s) encontrado(s)</p></div><div className="flex flex-wrap items-center gap-2">{toolbar}{onCreate&&<button type="button" aria-label={createAriaLabel} onClick={onCreate} className="inline-flex items-center gap-2 rounded-lg bg-indigo-600 px-4 py-2.5 text-sm font-semibold text-white hover:bg-indigo-700"><Plus size={16}/>{createLabel}</button>}</div></div>
  {error&&<p role="alert" className="m-4 rounded-lg border border-rose-200 bg-rose-50 p-3 text-sm text-rose-700">{error}</p>}
  <div className="overflow-x-auto"><table aria-label={title} className="w-full text-left text-sm"><thead className="border-b border-slate-200 bg-slate-50 text-xs font-semibold text-slate-500"><tr>{columns.map(c=><th key={c.label} scope="col" className="whitespace-nowrap px-5 py-3">{c.label}</th>)}<th scope="col" className="px-5 py-3 text-right">Ações</th></tr></thead><tbody className="divide-y divide-slate-100">{items.map(item=><tr key={item.id} className="hover:bg-slate-50/80">{columns.map(c=><td key={c.label} className="px-5 py-4 align-middle text-slate-700">{c.render(item)}</td>)}<td className="px-5 py-3"><div className="flex justify-end gap-2">{actions.map(action=><button key={action.label} type="button" disabled={busy!==null} aria-label={action.label+' '+labelOf(item)} onClick={()=>void run(action,item)} className={'inline-flex items-center gap-1.5 whitespace-nowrap rounded-lg border px-3 py-2 text-xs font-semibold transition-colors disabled:opacity-50 '+(action.destructive?'border-rose-200 text-rose-700 hover:bg-rose-50':'border-slate-200 text-slate-700 hover:border-indigo-300 hover:bg-indigo-50 hover:text-indigo-700')}>{action.destructive?<Trash2 size={14}/>:<Edit2 size={14}/>} {busy===item.id?'Aguarde...':action.label}</button>)}</div></td></tr>)}</tbody></table></div>
  {!items.length&&<p className="px-5 py-12 text-center text-sm text-slate-500">{emptyMessage}</p>}
 </section>;
}
