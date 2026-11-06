import type { CompanyProfile } from '../types';
import { useEffect, useId, useRef, useState } from 'react';
import { createPortal } from 'react-dom';
import type { Income, TreasuryAccount } from '../types';
import { formatCurrency, formatDateBR } from '../utils/formatters';

interface Props {
  income: Income;
  clientName: string;
  companyName: string;
  accounts: TreasuryAccount[];
  companyProfile?: CompanyProfile;
  onClose: () => void;
}

export function PixChargeDialog({ income, clientName, companyName, accounts, companyProfile, onClose }: Props) {
  const dialog = useRef<HTMLDialogElement>(null);
  const titleId = useId();
  const pixAccounts = accounts.filter(account => account.pixKey?.trim());
  const incomeAccount = accounts.find(account => account.id === income.accountId);
  const [selectedAccountId, setSelectedAccountId] = useState(
    incomeAccount?.pixKey?.trim() ? incomeAccount.id : '',
  );
  const selectedAccount = pixAccounts.find(account => account.id === selectedAccountId);
  const [manualReceiver, setReceiver] = useState(companyProfile?.pixReceiver || companyName);
  const [manualBank, setBank] = useState(companyProfile?.pixBank || incomeAccount?.bankName || '');
  const [manualKey, setKey] = useState(companyProfile?.pixKey ?? '');
  const receiver = selectedAccountId ? selectedAccount?.pixReceiver?.trim() || companyName : manualReceiver;
  const bank = selectedAccountId ? selectedAccount?.bankName ?? '' : manualBank;
  const key = selectedAccountId ? selectedAccount?.pixKey ?? '' : manualKey;
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
          {companyProfile?.document && <p className="text-sm text-slate-600">{companyProfile.document}</p>}
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
            <label className="block text-sm">Selecionar Pix cadastrado
              <select value={selectedAccountId} onChange={event => setSelectedAccountId(event.target.value)} className="mt-1 block w-full rounded-lg border p-2">
                <option value="">{companyProfile?.pixKey ? 'Pix da empresa / preenchimento manual' : 'Preencher manualmente'}</option>
                {pixAccounts.map(account => (
                  <option key={account.id} value={account.id}>{account.name}{account.bankName ? ' · ' + account.bankName : ''}</option>
                ))}
              </select>
            </label>
            {!pixAccounts.length && <p className="text-xs text-slate-600">Cadastre uma chave em Cadastros → Contas e Caixas para selecionar aqui.</p>}
            {selectedAccountId && !selectedAccount && <p role="alert" className="text-xs text-rose-700">Esta chave não está mais disponível. Selecione outra opção.</p>}
            <label className="block text-sm">Nome do recebedor
              <input readOnly={!!selectedAccountId} value={receiver} onChange={event => setReceiver(event.target.value)} className="mt-1 block w-full rounded-lg border p-2" />
            </label>
            <label className="block text-sm">Instituição financeira (opcional)
              <input readOnly={!!selectedAccountId} value={bank} onChange={event => setBank(event.target.value)} className="mt-1 block w-full rounded-lg border p-2" />
            </label>
            <label className="block text-sm">Chave Pix do recebedor
              <input readOnly={!!selectedAccountId} value={key} onChange={event => setKey(event.target.value)} autoComplete="off" spellCheck={false} className="mt-1 block w-full rounded-lg border p-2" />
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
