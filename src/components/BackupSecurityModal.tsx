import React, { useState, useRef } from 'react';
import {
  ShieldCheck,
  Cloud,
  Download,
  Upload,
  CheckCircle2,
  AlertCircle,
  X,
  FileJson,
  Loader2,
  Database,
  Lock,
  RefreshCw,
} from 'lucide-react';
import { Company } from '../types';
import {
  generateFullSystemBackup,
  downloadBackupFile,
  restoreSystemBackup,
  SystemBackupFile,
} from '../services/backupService';

interface BackupSecurityModalProps {
  isOpen: boolean;
  onClose: () => void;
  companies: Company[];
  currentUserEmail?: string | null;
  cloudSyncStatus?: 'synced' | 'syncing' | 'error';
  onRefreshData?: () => void;
}

export const BackupSecurityModal: React.FC<BackupSecurityModalProps> = ({
  isOpen,
  onClose,
  companies,
  currentUserEmail,
  cloudSyncStatus = 'synced',
  onRefreshData,
}) => {
  const [isExporting, setIsExporting] = useState(false);
  const [isImporting, setIsImporting] = useState(false);
  const [feedbackMsg, setFeedbackMsg] = useState<{ type: 'success' | 'error'; text: string } | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  if (!isOpen) return null;

  const handleDownloadBackup = async () => {
    setFeedbackMsg(null);
    setIsExporting(true);
    try {
      const backup = await generateFullSystemBackup(companies, currentUserEmail || 'emersonbsouza@gmail.com');
      downloadBackupFile(backup);
      setFeedbackMsg({
        type: 'success',
        text: 'Backup gerado e baixado com sucesso! Guarde este arquivo em local seguro.',
      });
    } catch (err: any) {
      console.error('Erro ao gerar backup:', err);
      setFeedbackMsg({
        type: 'error',
        text: 'Não foi possível gerar o backup: ' + (err.message || 'Erro desconhecido'),
      });
    } finally {
      setIsExporting(false);
    }
  };

  const handleFileSelected = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    setFeedbackMsg(null);
    setIsImporting(true);
    try {
      const text = await file.text();
      const parsed: SystemBackupFile = JSON.parse(text);

      if (!parsed || !Array.isArray(parsed.companies)) {
        throw new Error('Formato de arquivo inválido. O arquivo selecionado não é um backup válido do sistema.');
      }

      const res = await restoreSystemBackup(parsed);
      setFeedbackMsg({
        type: 'success',
        text: res.message,
      });

      if (onRefreshData) {
        onRefreshData();
      }
    } catch (err: any) {
      console.error('Erro ao restaurar backup:', err);
      setFeedbackMsg({
        type: 'error',
        text: 'Falha ao restaurar: ' + (err.message || 'Verifique se o arquivo é um backup válido.'),
      });
    } finally {
      setIsImporting(false);
      if (fileInputRef.current) {
        fileInputRef.current.value = '';
      }
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-xs">
      <div className="bg-white rounded-2xl shadow-2xl max-w-lg w-full overflow-hidden border border-slate-200 animate-in fade-in zoom-in-95 duration-150">
        {/* Header */}
        <div className="flex items-center justify-between px-6 py-4 border-b border-slate-100 bg-gradient-to-r from-slate-900 to-indigo-950 text-white">
          <div className="flex items-center gap-3">
            <div className="w-9 h-9 rounded-xl bg-emerald-500/20 text-emerald-400 flex items-center justify-center border border-emerald-500/30">
              <ShieldCheck className="w-5 h-5" />
            </div>
            <div>
              <h3 className="font-bold text-base leading-tight">Segurança dos Dados & Backup</h3>
              <p className="text-xs text-slate-300">Como seus dados são protegidos e persistidos</p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-1.5 rounded-lg text-slate-400 hover:text-white hover:bg-white/10 transition"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Content */}
        <div className="p-6 space-y-5 max-h-[80vh] overflow-y-auto">
          {/* Real-time Cloud Status */}
          <div className="p-4 rounded-xl bg-emerald-50/80 border border-emerald-200">
            <div className="flex items-center gap-2.5 mb-1.5">
              <div className="w-3 h-3 rounded-full bg-emerald-500 animate-pulse" />
              <h4 className="text-sm font-bold text-emerald-950 flex items-center gap-1.5">
                <Cloud className="w-4 h-4 text-emerald-600" />
                Google Cloud Firestore Conectado
              </h4>
            </div>
            <p className="text-xs text-emerald-800 leading-relaxed">
              Todos os seus lançamentos, contas bancárias, cartões, categorias e permissões são gravados
              <strong> diretamente no banco de dados na nuvem da Google</strong>.
            </p>
          </div>

          {/* Explanation regarding system updates */}
          <div className="space-y-2">
            <h4 className="text-xs font-bold text-slate-700 uppercase tracking-wider flex items-center gap-1.5">
              <Database className="w-3.5 h-3.5 text-indigo-600" />
              Por que os dados não são perdidos com atualizações?
            </h4>
            <div className="text-xs text-slate-600 space-y-2 leading-relaxed bg-slate-50 p-3.5 rounded-xl border border-slate-200">
              <p>
                <strong>1. Armazenamento na Nuvem:</strong> Os dados não dependem da versão do código. Quando o sistema
                recebe uma atualização, o aplicativo se conecta ao Firestore e carrega todo o seu histórico intacto.
              </p>
              <p>
                <strong>2. Dupla Proteção (Cache Local + Nuvem):</strong> Mesmo se houver oscilação de conexão, o sistema
                mantém cópia local e sincroniza automaticamente com o servidor assim que reconectado.
              </p>
              <p>
                <strong>3. Vínculo ao seu E-mail:</strong> Suas empresas estão vinculadas a{' '}
                <span className="font-semibold text-indigo-700">{currentUserEmail || 'seu e-mail'}</span>.
              </p>
            </div>
          </div>

          {/* Backup & Restore Actions */}
          <div className="space-y-3 pt-2">
            <h4 className="text-xs font-bold text-slate-700 uppercase tracking-wider flex items-center gap-1.5">
              <FileJson className="w-3.5 h-3.5 text-indigo-600" />
              Cópia de Segurança Manual (Garantia Total)
            </h4>

            <p className="text-xs text-slate-500">
              Para maior tranquilidade, você pode baixar uma cópia completa de todos os seus dados para o seu
              computador ou restaurar um backup a qualquer momento:
            </p>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              <button
                type="button"
                onClick={handleDownloadBackup}
                disabled={isExporting || isImporting}
                className="flex items-center justify-center gap-2 p-3 bg-indigo-600 hover:bg-indigo-700 text-white rounded-xl text-xs font-bold transition shadow-xs disabled:opacity-50"
              >
                {isExporting ? (
                  <>
                    <Loader2 className="w-4 h-4 animate-spin" />
                    Gerando Backup...
                  </>
                ) : (
                  <>
                    <Download className="w-4 h-4" />
                    Baixar Backup (.JSON)
                  </>
                )}
              </button>

              <button
                type="button"
                onClick={() => fileInputRef.current?.click()}
                disabled={isExporting || isImporting}
                className="flex items-center justify-center gap-2 p-3 bg-white hover:bg-slate-50 text-slate-700 border border-slate-300 rounded-xl text-xs font-bold transition shadow-2xs disabled:opacity-50"
              >
                {isImporting ? (
                  <>
                    <Loader2 className="w-4 h-4 animate-spin text-indigo-600" />
                    Restaurando...
                  </>
                ) : (
                  <>
                    <Upload className="w-4 h-4 text-indigo-600" />
                    Restaurar Backup (.JSON)
                  </>
                )}
              </button>
            </div>

            <input
              type="file"
              ref={fileInputRef}
              onChange={handleFileSelected}
              accept=".json,application/json"
              className="hidden"
            />
          </div>

          {/* Feedback message */}
          {feedbackMsg && (
            <div
              className={`p-3 rounded-xl text-xs flex items-center gap-2 ${
                feedbackMsg.type === 'success'
                  ? 'bg-emerald-50 text-emerald-800 border border-emerald-200'
                  : 'bg-rose-50 text-rose-800 border border-rose-200'
              }`}
            >
              {feedbackMsg.type === 'success' ? (
                <CheckCircle2 className="w-4 h-4 shrink-0 text-emerald-600" />
              ) : (
                <AlertCircle className="w-4 h-4 shrink-0 text-rose-600" />
              )}
              <span>{feedbackMsg.text}</span>
            </div>
          )}
        </div>

        {/* Footer */}
        <div className="px-6 py-3.5 bg-slate-50 border-t border-slate-100 flex items-center justify-between text-xs text-slate-500">
          <span className="flex items-center gap-1.5">
            <Lock className="w-3.5 h-3.5 text-slate-400" />
            Isolamento criptográfico por empresa
          </span>
          <button
            type="button"
            onClick={onClose}
            className="px-4 py-1.5 bg-slate-200 hover:bg-slate-300 text-slate-700 font-semibold rounded-lg transition"
          >
            Fechar
          </button>
        </div>
      </div>
    </div>
  );
};
