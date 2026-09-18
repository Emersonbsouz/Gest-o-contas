import React, { useState } from 'react';
import { X, Building2, User, Sparkles, Check } from 'lucide-react';
import { CompanyType } from '../types';

interface CreateCompanyModalProps {
  isOpen: boolean;
  onClose: () => void;
  onCreate: (data: { name: string; type: CompanyType; color: string }) => Promise<void>;
}

const COLOR_PRESETS = [
  { label: 'Esmeralda / Verde', value: '#059669' },
  { label: 'Índigo / Roxo', value: '#4f46e5' },
  { label: 'Azul Celeste', value: '#0284c7' },
  { label: 'Âmbar / Laranja', value: '#d97706' },
  { label: 'Rosa Magenta', value: '#db2777' },
  { label: 'Grafite / Preto', value: '#334155' },
];

export const CreateCompanyModal: React.FC<CreateCompanyModalProps> = ({
  isOpen,
  onClose,
  onCreate,
}) => {
  const [name, setName] = useState('');
  const [type, setType] = useState<CompanyType>('business');
  const [color, setColor] = useState('#059669');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  if (!isOpen) return null;

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!name.trim()) {
      setError('Por favor, informe o nome da empresa ou perfil.');
      return;
    }

    try {
      setLoading(true);
      setError('');
      await onCreate({ name: name.trim(), type, color });
      setName('');
      onClose();
    } catch (err: any) {
      console.error('Erro ao criar empresa:', err);
      setError('Ocorreu um erro ao salvar a empresa.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-xs">
      <div className="bg-white w-full max-w-md rounded-2xl shadow-xl border border-slate-100 overflow-hidden animate-in fade-in zoom-in-95 duration-150">
        {/* Header */}
        <div className="flex items-center justify-between px-6 py-4 border-b border-slate-100 bg-slate-50/50">
          <div className="flex items-center gap-2.5">
            <div className="w-9 h-9 rounded-xl bg-indigo-100 text-indigo-700 flex items-center justify-center">
              <Building2 className="w-5 h-5" />
            </div>
            <div>
              <h2 className="text-base font-bold text-slate-900">Nova Empresa ou Perfil</h2>
              <p className="text-xs text-slate-500">Crie um ambiente financeiro com dados 100% isolados</p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="text-slate-400 hover:text-slate-600 p-1.5 rounded-lg hover:bg-slate-100 transition"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Form */}
        <form onSubmit={handleSubmit} className="p-6 space-y-4">
          {error && (
            <div className="p-3 bg-rose-50 border border-rose-200 text-rose-700 text-xs rounded-xl">
              {error}
            </div>
          )}

          {/* Type selector */}
          <div>
            <label className="block text-xs font-semibold text-slate-700 mb-2">
              Tipo do Ambiente
            </label>
            <div className="grid grid-cols-2 gap-3">
              <button
                type="button"
                onClick={() => {
                  setType('business');
                  setColor('#059669');
                }}
                className={`flex items-center gap-2.5 p-3 rounded-xl border text-left transition ${
                  type === 'business'
                    ? 'border-emerald-500 bg-emerald-50/50 text-emerald-900 ring-2 ring-emerald-500/20'
                    : 'border-slate-200 hover:bg-slate-50 text-slate-700'
                }`}
              >
                <div className="w-8 h-8 rounded-lg bg-emerald-100 text-emerald-700 flex items-center justify-center">
                  <Building2 className="w-4 h-4" />
                </div>
                <div>
                  <div className="text-xs font-bold">Empresa (PJ)</div>
                  <div className="text-[10px] text-slate-500">Com CNPJ, sócios, etc.</div>
                </div>
              </button>

              <button
                type="button"
                onClick={() => {
                  setType('personal');
                  setColor('#4f46e5');
                }}
                className={`flex items-center gap-2.5 p-3 rounded-xl border text-left transition ${
                  type === 'personal'
                    ? 'border-indigo-500 bg-indigo-50/50 text-indigo-900 ring-2 ring-indigo-500/20'
                    : 'border-slate-200 hover:bg-slate-50 text-slate-700'
                }`}
              >
                <div className="w-8 h-8 rounded-lg bg-indigo-100 text-indigo-700 flex items-center justify-center">
                  <User className="w-4 h-4" />
                </div>
                <div>
                  <div className="text-xs font-bold">Pessoal (PF)</div>
                  <div className="text-[10px] text-slate-500">Gastos domésticos</div>
                </div>
              </button>
            </div>
          </div>

          {/* Name input */}
          <div>
            <label className="block text-xs font-semibold text-slate-700 mb-1.5">
              Nome da Empresa ou Perfil
            </label>
            <input
              type="text"
              required
              value={name}
              onChange={(e) => setName(e.target.value)}
              placeholder={type === 'business' ? 'Ex: Empresa Cacto, Minha Construtora' : 'Ex: Despesas Pessoais'}
              className="w-full px-3 py-2 border border-slate-300 rounded-xl text-sm text-slate-900 placeholder:text-slate-400 focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500"
            />
          </div>

          {/* Color preset */}
          <div>
            <label className="block text-xs font-semibold text-slate-700 mb-1.5">
              Cor de Identificação
            </label>
            <div className="flex items-center gap-2 flex-wrap">
              {COLOR_PRESETS.map((preset) => (
                <button
                  key={preset.value}
                  type="button"
                  onClick={() => setColor(preset.value)}
                  className={`w-7 h-7 rounded-full flex items-center justify-center transition-transform ${
                    color === preset.value ? 'scale-110 ring-2 ring-offset-2 ring-slate-400' : 'hover:scale-105'
                  }`}
                  style={{ backgroundColor: preset.value }}
                  title={preset.label}
                >
                  {color === preset.value && <Check className="w-3.5 h-3.5 text-white" />}
                </button>
              ))}
            </div>
          </div>

          {/* Info box */}
          <div className="p-3 bg-slate-50 border border-slate-200/80 rounded-xl text-xs text-slate-600 space-y-1">
            <p className="font-semibold text-slate-800 flex items-center gap-1.5">
              <Sparkles className="w-3.5 h-3.5 text-indigo-600" />
              Privacidade Garantida
            </p>
            <p className="text-[11px]">
              Cada empresa possui seu próprio caixa, cartões, receitas e relatórios independentes. Você poderá convidar sócios para acessar essa empresa sem expor as demais.
            </p>
          </div>

          {/* Buttons */}
          <div className="flex items-center justify-end gap-2 pt-2">
            <button
              type="button"
              onClick={onClose}
              className="px-4 py-2 text-xs font-semibold text-slate-700 hover:bg-slate-100 rounded-xl transition"
            >
              Cancelar
            </button>
            <button
              type="submit"
              disabled={loading}
              className="px-4 py-2 bg-indigo-600 hover:bg-indigo-700 text-white text-xs font-semibold rounded-xl transition shadow-xs disabled:opacity-50"
            >
              {loading ? 'Criando...' : 'Criar Empresa'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};
