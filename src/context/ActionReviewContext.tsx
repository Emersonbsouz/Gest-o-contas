import React, {createContext, useCallback, useContext, useEffect, useId, useRef, useState} from 'react';
import {createPortal} from 'react-dom';
import {formatDateBR} from '../utils/formatters';

export interface ReviewDetails {title:string; fields:Array<{label:string;value:string}>;}
interface ReviewApi {review:(details:ReviewDetails)=>Promise<boolean>; reviewForm:(form:HTMLFormElement,title:string)=>Promise<boolean>;}
function labelText(element:Element|null):string {
 if(!element)return '';
 const clone=element.cloneNode(true) as Element;
 clone.querySelectorAll('input,select,textarea,button,svg').forEach(child=>child.remove());
 return (clone.textContent||'').replace(/\s+/g,' ').trim();
}
export function formReviewDetails(form:HTMLFormElement,title:string):ReviewDetails {
 const fields=Array.from(form.querySelectorAll<HTMLInputElement|HTMLSelectElement|HTMLTextAreaElement>('input,select,textarea')).flatMap(control=>{
  if(control.closest('[data-review-exclude]') || (control instanceof HTMLInputElement && ['hidden','password','file','submit','button'].includes(control.type)))return [];
  if(control instanceof HTMLInputElement && control.type==='radio' && !control.checked)return [];
  const label=control.getAttribute('aria-label') || labelText(control.labels?.[0]||control.closest('label')) ||
   (control.previousElementSibling?.tagName==='LABEL'?labelText(control.previousElementSibling):control.parentElement?.previousElementSibling?.tagName==='LABEL'?labelText(control.parentElement.previousElementSibling):'') || control.getAttribute('placeholder') || control.name || 'Campo';
  let value=control instanceof HTMLSelectElement?Array.from(control.selectedOptions).map(option=>option.text).join(', '):control.value;
  if(control instanceof HTMLInputElement && control.type==='checkbox')value=control.checked?'Sim':'Não';
  if(control instanceof HTMLInputElement && control.type==='date' && value)value=formatDateBR(value);
  return value.trim()?[{label,value}]:[];
 });
 return {title,fields};
}
// Isolated components keep their existing behavior; the application root enables review for all flows.
const fallback:ReviewApi={review:async()=>true,reviewForm:async()=>true};
const Context=createContext<ReviewApi>(fallback);
export const useActionReview=()=>useContext(Context);
export function ActionReviewProvider({children}:{children:React.ReactNode}) {
 const [details,setDetails]=useState<ReviewDetails|null>(null);
 const pending=useRef<((answer:boolean)=>void)|null>(null);
 const dialog=useRef<HTMLDivElement>(null);
 const returnButton=useRef<HTMLButtonElement>(null);
 const titleId=useId();
 const review=useCallback((next:ReviewDetails)=>{
  if(pending.current)return Promise.resolve(false);
  return new Promise<boolean>(resolve=>{pending.current=resolve;setDetails(next);});
 },[]);
 const finish=useCallback((answer:boolean)=>{const resolve=pending.current;pending.current=null;setDetails(null);resolve?.(answer);},[]);
 const reviewForm=useCallback((form:HTMLFormElement,title:string)=>review(formReviewDetails(form,title)),[review]);
 useEffect(()=>()=>{pending.current?.(false);pending.current=null;},[]);
 useEffect(()=>{
  if(!details)return;
  const previous=document.activeElement as HTMLElement|null;
  const root=document.getElementById('root');
  const wasInert=root?.inert;
  if(root)root.inert=true;
  const overflow=document.body.style.overflow;document.body.style.overflow='hidden';
  returnButton.current?.focus();
  const keydown=(event:KeyboardEvent)=>{
   if(event.key==='Escape'){event.preventDefault();finish(false);}
   if(event.key==='Tab'){
    const buttons=dialog.current?.querySelectorAll<HTMLButtonElement>('button');
    if(!buttons?.length)return;
    const first=buttons[0],last=buttons[buttons.length-1];
    if(event.shiftKey && (document.activeElement===first || !dialog.current?.contains(document.activeElement))){event.preventDefault();last.focus();}
    else if(!event.shiftKey && (document.activeElement===last || !dialog.current?.contains(document.activeElement))){event.preventDefault();first.focus();}
   }
  };
  document.addEventListener('keydown',keydown);
  return ()=>{document.removeEventListener('keydown',keydown);document.body.style.overflow=overflow;if(root)root.inert=wasInert||false;if(previous?.isConnected)previous.focus();};
 },[details,finish]);
 return <Context.Provider value={{review,reviewForm}}>{children}{details&&createPortal(
  <div className="fixed inset-0 z-[200] flex items-center justify-center bg-slate-900/70 p-4">
   <div ref={dialog} role="dialog" aria-modal="true" aria-labelledby={titleId} className="flex max-h-[85dvh] w-full max-w-xl flex-col rounded-2xl bg-white shadow-2xl">
    <div className="border-b px-5 py-4"><h2 id={titleId} className="text-lg font-bold text-slate-900">{details.title}</h2><p className="mt-1 text-sm text-slate-500">Confira os dados antes de finalizar. A gravação será feita somente após confirmar.</p></div>
    <dl className="space-y-3 overflow-y-auto p-5">{details.fields.map((field,index)=><div key={index} className="grid gap-1 border-b border-slate-100 pb-2 sm:grid-cols-2"><dt className="text-xs font-semibold text-slate-500">{field.label}</dt><dd className="break-words whitespace-pre-wrap text-sm text-slate-900">{field.value}</dd></div>)}{!details.fields.length&&<p className="text-sm text-slate-600">Confirme para concluir esta ação.</p>}</dl>
    <div className="flex flex-wrap justify-end gap-2 border-t px-5 py-4"><button ref={returnButton} type="button" onClick={()=>finish(false)} className="rounded-xl border border-slate-300 px-4 py-2 text-sm font-bold text-slate-700">Voltar para revisar</button><button type="button" onClick={()=>finish(true)} className="rounded-xl bg-indigo-600 px-4 py-2 text-sm font-bold text-white">Confirmar e finalizar</button></div>
   </div>
  </div>,document.body)}</Context.Provider>;
}
