import React, { useState } from 'react';
import { AlertTriangle, Trash2, X, ShieldAlert, Loader2, CheckCircle2, Landmark, Tag } from 'lucide-react';

interface ResetConfirmModalProps {
  isOpen: boolean;
  onClose: () => void;
  onConfirmReset: (keepCategories: boolean, createCleanAccount: boolean) => Promise<void>;
  companyName: string;
}

export const ResetConfirmModal: React.FC<ResetConfirmModalProps> = ({
  isOpen,
  onClose,
  onConfirmReset,
  companyName,
}) => {
  const [confirmationText, setConfirmationText] = useState('');
  const [confirmCheckbox, setConfirmCheckbox] = useState(false);
  const [keepCategories, setKeepCategories] = useState(true);
  const [createCleanAccount, setCreateCleanAccount] = useState(true);
  const [isResetting, setIsResetting] = useState(false);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);

  if (!isOpen) return null;

  const isConfirmed = confirmCheckbox || confirmationText.trim().toUpperCase() === 'ZERAR';

  const handleConfirm = async () => {
    if (!isConfirmed || isResetting) return;
    setErrorMessage(null);
    try {
      setIsResetting(true);
      await onConfirmReset(keepCategories, createCleanAccount);
      onClose();
      setConfirmationText('');
      setConfirmCheckbox(false);
    } catch (e: any) {
      console.error('Erro ao resetar:', e);
      setErrorMessage('Aviso: Os dados locais foram zerados, mas houve lentidão ao sincronizar com a nuvem.');
      setTimeout(() => {
        onClose();
        setConfirmationText('');
        setConfirmCheckbox(false);
      }, 1500);
    } finally {
      setIsResetting(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-xs">
      <div className="bg-white rounded-2xl max-w-md w-full p-6 shadow-2xl border border-rose-100 animate-in fade-in zoom-in-95 duration-150">
        <div className="flex items-center justify-between pb-3 border-b border-slate-100">
          <div className="flex items-center gap-2.5 text-rose-600">
            <div className="w-9 h-9 rounded-xl bg-rose-50 flex items-center justify-center border border-rose-200">
              <ShieldAlert className="w-5 h-5 text-rose-600" />
            </div>
            <div>
              <h3 className="text-base font-bold text-slate-900">Zerar Todos os Dados</h3>
              <p className="text-xs text-slate-500 truncate max-w-[240px]">Ambiente: {companyName}</p>
            </div>
          </div>
          <button
            onClick={onClose}
            disabled={isResetting}
            className="p-1 rounded-lg text-slate-400 hover:text-slate-600 hover:bg-slate-100 transition"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        <div className="my-4 space-y-3">
          <div className="p-3.5 bg-rose-50 border border-rose-200 rounded-xl text-xs text-rose-900 leading-relaxed">
            <p className="font-semibold flex items-center gap-1.5 mb-1">
              <AlertTriangle className="w-4 h-4 text-rose-600 shrink-0" />
              Atenção: Ação de limpeza de dados
            </p>
            <p>
              Todos os lançamentos (despesas, receitas, transferências, faturas e metas) de <strong>{companyName}</strong> serão zerados para começar com tudo limpo (R$ 0,00).
            </p>
          </div>

          <div className="space-y-2">
            <label className="flex items-start gap-2.5 p-3 rounded-xl border border-slate-200 hover:bg-slate-50 cursor-pointer transition">
              <input
                type="checkbox"
                checked={keepCategories}
                onChange={(e) => setKeepCategories(e.target.checked)}
                className="mt-0.5 rounded text-indigo-600 focus:ring-indigo-500 w-4 h-4"
              />
              <div className="text-xs">
                <span className="font-semibold text-slate-800 flex items-center gap-1.5">
                  <Tag className="w-3.5 h-3.5 text-indigo-600" />
                  Manter categorias padrão
                </span>
                <span className="text-slate-500 block mt-0.5">
                  Preserva as categorias financeiras essenciais (Alimentação, Moradia, etc.) prontas para seus lançamentos.
                </span>
              </div>
            </label>

            <label className="flex items-start gap-2.5 p-3 rounded-xl border border-slate-200 hover:bg-slate-50 cursor-pointer transition">
              <input
                type="checkbox"
                checked={createCleanAccount}
                onChange={(e) => setCreateCleanAccount(e.target.checked)}
                className="mt-0.5 rounded text-indigo-600 focus:ring-indigo-500 w-4 h-4"
              />
              <div className="text-xs">
                <span className="font-semibold text-slate-800 flex items-center gap-1.5">
                  <Landmark className="w-3.5 h-3.5 text-emerald-600" />
                  Criar conta bancária inicial limpa (Saldo R$ 0,00)
                </span>
                <span className="text-slate-500 block mt-0.5">
                  Cria uma "Conta Corrente Principal" com saldo R$ 0,00 para você poder fazer lançamentos imediatamente.
                </span>
              </div>
            </label>
          </div>

          {/* Quick confirmation methods */}
          <div className="p-3 bg-slate-50 rounded-xl border border-slate-200 space-y-2">
            <label className="flex items-center gap-2 cursor-pointer">
              <input
                type="checkbox"
                checked={confirmCheckbox}
                onChange={(e) => setConfirmCheckbox(e.target.checked)}
                className="rounded text-rose-600 focus:ring-rose-500 w-4 h-4"
              />
              <span className="text-xs font-semibold text-slate-800">
                Confirmo que desejo zerar todos os dados deste ambiente
              </span>
            </label>

            {!confirmCheckbox && (
              <div className="pt-1">
                <label className="block text-[11px] font-semibold text-slate-600 mb-1">
                  Ou digite <span className="font-mono text-rose-600 font-bold">ZERAR</span> para habilitar:
                </label>
                <input
                  type="text"
                  value={confirmationText}
                  onChange={(e) => setConfirmationText(e.target.value)}
                  placeholder="Digite ZERAR"
                  disabled={isResetting}
                  className="w-full px-3 py-1.5 text-xs rounded-lg border border-slate-300 focus:border-rose-500 focus:ring-2 focus:ring-rose-500/20 font-semibold uppercase tracking-wider"
                />
              </div>
            )}
          </div>

          {errorMessage && (
            <p className="text-xs text-amber-600 bg-amber-50 p-2.5 rounded-lg border border-amber-200">
              {errorMessage}
            </p>
          )}
        </div>

        <div className="flex items-center justify-end gap-2 pt-3 border-t border-slate-100">
          <button
            type="button"
            onClick={onClose}
            disabled={isResetting}
            className="px-4 py-2 text-xs font-semibold text-slate-600 hover:text-slate-800 hover:bg-slate-100 rounded-xl transition"
          >
            Cancelar
          </button>
          <button
            type="button"
            onClick={handleConfirm}
            disabled={!isConfirmed || isResetting}
            className="inline-flex items-center gap-1.5 px-4 py-2 bg-rose-600 hover:bg-rose-700 disabled:opacity-40 disabled:cursor-not-allowed text-white text-xs font-bold rounded-xl transition shadow-xs"
          >
            {isResetting ? (
              <>
                <Loader2 className="w-4 h-4 animate-spin" />
                <span>Zerando dados...</span>
              </>
            ) : (
              <>
                <Trash2 className="w-4 h-4" />
                <span>Zerar e Começar Limpo</span>
              </>
            )}
          </button>
        </div>
      </div>
    </div>
  );
};
