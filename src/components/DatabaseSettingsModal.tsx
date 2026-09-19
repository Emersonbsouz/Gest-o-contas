import React, { useState } from 'react';
import { 
  Database, 
  X, 
  CheckCircle2, 
  AlertCircle, 
  Loader2, 
  Link, 
  Info,
  ExternalLink,
  ShieldCheck
} from 'lucide-react';

interface DatabaseSettingsModalProps {
  isOpen: boolean;
  onClose: () => void;
  currentUrl?: string;
}

export const DatabaseSettingsModal: React.FC<DatabaseSettingsModalProps> = ({
  isOpen,
  onClose,
  currentUrl = ''
}) => {
  const [url, setUrl] = useState(currentUrl);
  const [isTesting, setIsTesting] = useState(false);
  const [testResult, setTestResult] = useState<{ success: boolean; message: string } | null>(null);

  if (!isOpen) return null;

  const handleTestConnection = async () => {
    if (!url) return;
    
    setIsTesting(true);
    setTestResult(null);
    
    try {
      const response = await fetch('/api/db/test', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ url }),
      });
      
      const data = await response.json();
      setTestResult({
        success: data.success,
        message: data.success ? 'Conexão estabelecida com sucesso!' : (data.error || 'Falha ao conectar ao banco.')
      });
    } catch (error) {
      setTestResult({
        success: false,
        message: 'Erro ao tentar comunicação com o servidor.'
      });
    } finally {
      setIsTesting(false);
    }
  };

  return (
    <div className="fixed inset-0 bg-slate-900/60 backdrop-blur-sm z-[100] flex items-center justify-center p-4 animate-in fade-in duration-300">
      <div className="bg-white rounded-3xl w-full max-w-xl shadow-2xl border border-slate-200 overflow-hidden animate-in zoom-in-95 duration-300">
        {/* Header */}
        <div className="px-6 py-4 bg-slate-50 border-b border-slate-200 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-indigo-600 flex items-center justify-center shadow-lg shadow-indigo-100">
              <Database className="w-5 h-5 text-white" />
            </div>
            <div>
              <h3 className="text-lg font-bold text-slate-900">Configuração SQL (Neon)</h3>
              <p className="text-xs text-slate-500">Resolva problemas de sincronização definitivamente.</p>
            </div>
          </div>
          <button 
            onClick={onClose}
            className="p-2 hover:bg-slate-200 rounded-full transition-colors text-slate-400 hover:text-slate-600"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        <div className="p-6 space-y-6">
          {/* Info Box */}
          <div className="bg-blue-50 border border-blue-100 rounded-2xl p-4 flex gap-4">
            <Info className="w-5 h-5 text-blue-600 flex-shrink-0 mt-0.5" />
            <div className="space-y-2">
              <p className="text-sm text-blue-900 leading-relaxed font-medium">
                Por que usar o Neon SQL?
              </p>
              <p className="text-xs text-blue-700 leading-relaxed">
                Diferente do armazenamento padrão do navegador, o Neon oferece um banco de dados relacional robusto. Isso garante que seus rateios e transações nunca sofram erros de permissão ou perda de conexão.
              </p>
            </div>
          </div>

          {/* Form */}
          <div className="space-y-4">
            <div className="space-y-2">
              <label className="text-sm font-bold text-slate-700 flex items-center gap-2">
                <Link className="w-4 h-4" />
                DATABASE_URL do Neon
              </label>
              <textarea
                value={url}
                onChange={(e) => setUrl(e.target.value)}
                placeholder="postgres://user:password@host/dbname?sslmode=require"
                className="w-full px-4 py-3 bg-slate-50 border border-slate-200 rounded-xl text-sm font-mono focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 outline-none transition-all resize-none h-24"
              />
              <p className="text-[10px] text-slate-500">
                Acesse o console do <a href="https://neon.tech" target="_blank" rel="noreferrer" className="text-indigo-600 font-bold hover:underline">Neon.tech</a>, copie sua Connection String e cole acima.
              </p>
            </div>

            {/* Test Result Alert */}
            {testResult && (
              <div className={`p-4 rounded-xl border flex items-center gap-3 animate-in slide-in-from-top-2 duration-300 ${
                testResult.success ? 'bg-emerald-50 border-emerald-100' : 'bg-rose-50 border-rose-100'
              }`}>
                {testResult.success ? (
                  <CheckCircle2 className="w-5 h-5 text-emerald-600 flex-shrink-0" />
                ) : (
                  <AlertCircle className="w-5 h-5 text-rose-600 flex-shrink-0" />
                )}
                <span className={`text-sm font-medium ${
                  testResult.success ? 'text-emerald-900' : 'text-rose-900'
                }`}>
                  {testResult.message}
                </span>
              </div>
            )}

            <button
              onClick={handleTestConnection}
              disabled={isTesting || !url}
              className="w-full flex items-center justify-center gap-2 px-6 py-3.5 bg-slate-900 text-white rounded-xl font-bold hover:bg-slate-800 disabled:opacity-50 disabled:cursor-not-allowed transition-all shadow-lg"
            >
              {isTesting ? (
                <>
                  <Loader2 className="w-4 h-4 animate-spin" />
                  Testando Conexão...
                </>
              ) : (
                <>
                  <ShieldCheck className="w-4 h-4" />
                  Testar Conexão
                </>
              )}
            </button>
          </div>

          {/* Setup Guide */}
          <div className="pt-4 border-t border-slate-100">
            <h4 className="text-xs font-bold text-slate-500 uppercase tracking-wider mb-3">Como aplicar a configuração:</h4>
            <div className="bg-slate-50 rounded-2xl p-4 space-y-3">
              <div className="flex items-start gap-3">
                <div className="w-5 h-5 rounded-full bg-indigo-100 text-indigo-700 flex items-center justify-center text-[10px] font-bold flex-shrink-0">1</div>
                <p className="text-xs text-slate-600 leading-relaxed">Após o teste ser aprovado, abra o menu de <strong>Configurações</strong> do AI Studio (ícone de engrenagem à esquerda).</p>
              </div>
              <div className="flex items-start gap-3">
                <div className="w-5 h-5 rounded-full bg-indigo-100 text-indigo-700 flex items-center justify-center text-[10px] font-bold flex-shrink-0">2</div>
                <p className="text-xs text-slate-600 leading-relaxed">Vá em <strong>Environment Variables</strong> e adicione a chave <code>DATABASE_URL</code> com o valor testado.</p>
              </div>
              <div className="flex items-start gap-3">
                <div className="w-5 h-5 rounded-full bg-indigo-100 text-indigo-700 flex items-center justify-center text-[10px] font-bold flex-shrink-0">3</div>
                <p className="text-xs text-slate-600 leading-relaxed">O sistema sincronizará seus dados automaticamente para o novo banco SQL.</p>
              </div>
            </div>
          </div>
        </div>

        {/* Footer */}
        <div className="px-6 py-4 bg-slate-50 border-t border-slate-200 flex justify-end gap-3">
          <button
            onClick={onClose}
            className="px-5 py-2 text-sm font-bold text-slate-600 hover:bg-slate-200 rounded-xl transition-all"
          >
            Fechar
          </button>
          <button
            onClick={() => window.open('https://neon.tech', '_blank')}
            className="flex items-center gap-2 px-5 py-2 text-sm font-bold bg-indigo-50 text-indigo-700 hover:bg-indigo-100 rounded-xl border border-indigo-200 transition-all"
          >
            Acessar Neon.tech
            <ExternalLink className="w-3.5 h-3.5" />
          </button>
        </div>
      </div>
    </div>
  );
};
