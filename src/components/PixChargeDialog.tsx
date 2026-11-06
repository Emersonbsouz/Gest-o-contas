import { useEffect, useId, useRef, useState } from 'react';
import { createPortal } from 'react-dom';
import type { Income } from '../types';
import { formatCurrency, formatDateBR } from '../utils/formatters';

interface Props {
  income: Income;
  clientName: string;
  companyName: string;
  bankName?: string;
  onClose: () => void;
}

export function PixChargeDialog({ income, clientName, companyName, bankName, onClose }: Props) {
  const dialog = useRef<HTMLDialogElement>(null);
  const titleId = useId();
  const [receiver, setReceiver] = useState(companyName);
  const [bank, setBank] = useState(bankName ?? '');
  const [key, setKey] = useState('');
  const canPrint = Boolean(receiver.trim() && key.trim());

  useEffect(() => {
    const element = dialog.current;
    element?.showModal();
    return () => element?.close();
  }, []);

  return createPortal(
    <dialog
      ref={dialog}
      id="pix-charge-dialog"
      aria-labelledby={titleId}
      onCancel={event => { event.preventDefault(); onClose(); }}
      className="m-auto max-h-[90dvh] w-[calc(100%-2rem)] max-w-xl overflow-y-auto rounded-2xl bg-white p-6 text-slate-900 shadow-xl backdrop:bg-slate-900/60"
    >
      <article className="space-y-5">
        <header className="border-b pb-4">
          <h2 id={titleId} className="text-xl font-bold">Cobrança Pix</h2>
          <p className="mt-1 text-sm text-slate-600">{companyName}</p>
        </header>

        <dl className="grid gap-3 text-sm sm:grid-cols-2">
          <div><dt>Cliente</dt><dd className="font-semibold">{clientName}</dd></div>
          <div><dt>Descrição</dt><dd className="font-semibold">{income.description}</dd></div>
          <div><dt>Vencimento</dt><dd className="font-semibold">{formatDateBR(income.date)}</dd></div>
          <div><dt>Valor a pagar</dt><dd className="text-lg font-bold">{formatCurrency(income.amount)}</dd></div>
        </dl>

        <section className="space-y-3 rounded-xl border p-4">
          <h3 className="font-semibold">Dados para pagamento</h3>
          <div className="space-y-3 print:hidden">
            <label className="block text-sm">Nome do recebedor
              <input value={receiver} onChange={event => setReceiver(event.target.value)} className="mt-1 block w-full rounded-lg border p-2" />
            </label>
            <label className="block text-sm">Instituição financeira (opcional)
              <input value={bank} onChange={event => setBank(event.target.value)} className="mt-1 block w-full rounded-lg border p-2" />
            </label>
            <label className="block text-sm">Chave Pix do recebedor
              <input value={key} onChange={event => setKey(event.target.value)} autoComplete="off" spellCheck={false} className="mt-1 block w-full rounded-lg border p-2" />
            </label>
          </div>
          <dl className="hidden space-y-2 text-sm print:block">
            <div><dt>Recebedor</dt><dd className="font-semibold">{receiver.trim()}</dd></div>
            {bank.trim() && <div><dt>Instituição financeira</dt><dd>{bank.trim()}</dd></div>}
            <div><dt>Chave Pix</dt><dd className="break-all font-semibold">{key.trim()}</dd></div>
          </dl>
        </section>

        <p className="text-sm text-slate-600">Use a chave Pix no seu banco e confira o nome do recebedor e o valor antes de pagar.</p>
        <footer className="flex flex-wrap justify-end gap-2 border-t pt-4 print:hidden">
          <button type="button" onClick={onClose} className="rounded-lg border px-4 py-2 text-sm font-semibold">Fechar</button>
          <button type="button" disabled={!canPrint} onClick={() => window.print()} className="rounded-lg bg-indigo-600 px-4 py-2 text-sm font-semibold text-white disabled:opacity-50">Imprimir / Salvar PDF</button>
        </footer>
      </article>
    </dialog>,
    document.body,
  );
}
