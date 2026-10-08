import React from 'react';
import { createPortal } from 'react-dom';
import { ContactPerson, Proposal } from '../types';
import { formatCurrency, formatDateBR } from '../utils/formatters';

export function ProposalReport({ proposal, client, companyName, onClose }: {
  proposal: Proposal; client?: ContactPerson; companyName: string; onClose: () => void;
}) {
  const items = proposal.items?.length ? proposal.items : [{ description: proposal.title, quantity: 1, unitPrice: proposal.amount, total: proposal.amount }];
  return createPortal(<div id="proposal-report-container" className="fixed inset-0 z-50 overflow-y-auto bg-slate-900/60 p-4" role="dialog" aria-modal="true" aria-label="Relatório da proposta">
    <div className="mx-auto max-w-4xl">
      <div className="proposal-report-toolbar flex justify-between gap-3 py-3">
        <button type="button" onClick={onClose} className="rounded-xl bg-white px-4 py-2 font-bold text-slate-700">Fechar relatório</button>
        <button type="button" onClick={() => window.print()} className="rounded-xl bg-indigo-600 px-4 py-2 font-bold text-white">Imprimir / Salvar PDF</button>
      </div>
      <article id="proposal-report" className="rounded-xl bg-white p-6 sm:p-12 text-slate-800 shadow-xl">
        <header className="flex flex-wrap justify-between gap-4 border-b-4 border-indigo-600 pb-6">
          <div><p className="text-2xl font-bold text-slate-900">{companyName}</p></div>
          <div className="text-right"><p className="text-xs font-bold uppercase tracking-widest text-indigo-600">Proposta comercial</p><p className="text-sm mt-2">Referência: {proposal.id}</p></div>
        </header>
        <h1 className="mt-7 text-2xl font-bold">{proposal.title}</h1>
        <div className="mt-3 flex flex-wrap gap-6 text-sm text-slate-500"><span>Emissão: {formatDateBR(proposal.date)}</span>{proposal.validUntil && <span>Válida até: {formatDateBR(proposal.validUntil)}</span>}</div>
        <section className="mt-6 rounded-xl border border-slate-200 bg-slate-50 p-5">
          <p className="text-xs font-bold uppercase tracking-wider text-slate-500">Proposta apresentada a</p>
          <h2 className="mt-1 text-lg font-bold">{client?.name || 'Cliente indisponível no cadastro'}</h2>
          <div className="mt-3 grid gap-2 text-sm sm:grid-cols-2">
            {client?.document && <p>CPF / CNPJ: {client.document}</p>}
            {client?.phone && <p>Telefone: {client.phone}</p>}
            {client?.email && <p>E-mail: {client.email}</p>}
            {client?.address && <p>Endereço: {client.address}</p>}
          </div>
        </section>
        {proposal.description && <section className="mt-6"><h2 className="font-bold">Objeto e escopo</h2><p className="mt-2 whitespace-pre-wrap text-sm">{proposal.description}</p></section>}
        <section className="mt-6"><h2 className="font-bold">Serviços e investimento</h2>
          <table className="mt-3 w-full text-sm"><thead className="bg-slate-50 text-xs text-slate-500"><tr><th className="p-3 text-left">Descrição</th><th className="p-3 text-right">Qtd.</th><th className="p-3 text-right">Valor unitário</th><th className="p-3 text-right">Total</th></tr></thead>
            <tbody>{items.map((item, index) => <tr key={index} className="border-b border-slate-200"><td className="p-3">{item.description}</td><td className="p-3 text-right">{item.quantity}</td><td className="p-3 text-right">{formatCurrency(item.unitPrice)}</td><td className="p-3 text-right">{formatCurrency(item.total)}</td></tr>)}</tbody>
          </table>
          <div className="mt-4 flex justify-between gap-4 rounded-xl bg-indigo-50 p-5 text-indigo-800"><span className="font-bold">Valor da proposta</span><strong className="text-xl">{formatCurrency(proposal.amount)}</strong></div>
        </section>
        {(proposal.commercialTerms || proposal.deliveryTime) && <section className="mt-6"><h2 className="font-bold">Condições comerciais</h2><div className="mt-3 grid gap-4 sm:grid-cols-2">
          {proposal.commercialTerms && <div className="rounded-xl border border-slate-200 p-4"><p className="whitespace-pre-wrap text-sm">{proposal.commercialTerms}</p></div>}
          {proposal.deliveryTime && <div className="rounded-xl border border-slate-200 p-4"><p className="text-xs font-bold text-slate-500">Prazo de entrega</p><p className="mt-2 whitespace-pre-wrap text-sm">{proposal.deliveryTime}</p></div>}
        </div></section>}
        <section className="mt-7"><h2 className="font-bold">Aceite</h2><p className="mt-2 text-sm text-slate-500">A aprovação confirma a concordância com o escopo, o investimento e as condições apresentados nesta proposta.</p>
          <div className="mt-12 grid grid-cols-2 gap-8 text-center text-xs"><div className="border-t border-slate-400 pt-3"><strong>{companyName}</strong><p>Responsável pela proposta</p></div><div className="border-t border-slate-400 pt-3"><strong>{client?.name || 'Cliente'}</strong><p>Aceite do cliente · Data: ____ / ____ / ______</p></div></div>
        </section>
        <footer className="mt-8 border-t border-slate-200 pt-3 text-xs text-slate-400">Proposta comercial · {proposal.id}</footer>
      </article>
    </div>
  </div>, document.body);
}
