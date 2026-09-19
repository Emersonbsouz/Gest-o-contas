import React, { useState, useEffect } from 'react';
import { X, Hammer, MapPin, Calendar, Info } from 'lucide-react';
import { CostCenter, ContactPerson } from '../types';

interface CostCenterModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSave: (data: Omit<CostCenter, 'id' | 'createdAt'>, id?: string) => void;
  editingCC: CostCenter | null;
  contacts: ContactPerson[];
}

export const CostCenterModal: React.FC<CostCenterModalProps> = ({
  isOpen,
  onClose,
  onSave,
  editingCC,
  contacts
}) => {
  const [name, setName] = useState('');
  const [clientId, setClientId] = useState('');
  const [status, setStatus] = useState<'active' | 'completed' | 'on_hold'>('active');
  const [budget, setBudget] = useState(0);
  const [startDate, setStartDate] = useState('');
  const [color, setColor] = useState('#4f46e5');

  useEffect(() => {
    if (editingCC) {
      setName(editingCC.name);
      setClientId(editingCC.clientId);
      setStatus(editingCC.status);
      setBudget(editingCC.budget || 0);
      setStartDate(editingCC.startDate || '');
      setColor(editingCC.color || '#4f46e5');
    } else {
      setName('');
      setClientId('');
      setStatus('active');
      setBudget(0);
      setStartDate(new Date().toISOString().split('T')[0]);
      setColor('#4f46e5');
    }
  }, [editingCC, isOpen]);

  if (!isOpen) return null;

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    onSave({
      name,
      clientId,
      status,
      budget,
      startDate,
      color,
    }, editingCC?.id);
    onClose();
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-sm animate-in fade-in duration-200">
      <div className="bg-white w-full max-w-lg rounded-3xl shadow-2xl overflow-hidden flex flex-col max-h-[90vh]">
        <div className="px-6 py-4 border-b border-slate-100 flex items-center justify-between bg-slate-50/50">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-indigo-600 flex items-center justify-center text-white shadow-lg shadow-indigo-100">
              <Hammer className="w-5 h-5" />
            </div>
            <div>
              <h3 className="font-bold text-slate-900">{editingCC ? 'Editar Centro de Custo' : 'Novo Centro de Custo'}</h3>
              <p className="text-[10px] text-slate-400 font-bold uppercase tracking-wider">Gestão de Obra / Projeto</p>
            </div>
          </div>
          <button onClick={onClose} className="p-2 hover:bg-slate-200 rounded-xl transition-colors">
            <X className="w-5 h-5 text-slate-400" />
          </button>
        </div>

        <form onSubmit={handleSubmit} className="p-6 overflow-y-auto space-y-5">
          <div className="space-y-1.5">
            <label className="text-xs font-bold text-slate-500 uppercase tracking-wider ml-1">Nome do Projeto/Obra</label>
            <input
              autoFocus
              required
              type="text"
              value={name}
              onChange={(e) => setName(e.target.value)}
              placeholder="Ex: Reforma Apartamento 402 - Ed. Central"
              className="w-full px-4 py-3 bg-slate-50 border border-slate-200 rounded-xl text-sm focus:ring-2 focus:ring-indigo-500 focus:border-transparent transition-all outline-none"
            />
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-1.5">
              <label className="text-xs font-bold text-slate-500 uppercase tracking-wider ml-1">Cliente Vinculado</label>
              <select
                required
                value={clientId}
                onChange={(e) => setClientId(e.target.value)}
                className="w-full px-4 py-3 bg-slate-50 border border-slate-200 rounded-xl text-sm outline-none focus:ring-2 focus:ring-indigo-500 transition-all"
              >
                <option value="">Selecione um cliente...</option>
                {contacts.filter(c => c.type === 'client').map(c => (
                  <option key={c.id} value={c.id}>{c.name}</option>
                ))}
              </select>
            </div>

            <div className="space-y-1.5">
              <label className="text-xs font-bold text-slate-500 uppercase tracking-wider ml-1">Status Atual</label>
              <select
                value={status}
                onChange={(e) => setStatus(e.target.value as any)}
                className="w-full px-4 py-3 bg-slate-50 border border-slate-200 rounded-xl text-sm outline-none focus:ring-2 focus:ring-indigo-500 transition-all"
              >
                <option value="active">Em Andamento</option>
                <option value="completed">Concluído</option>
                <option value="on_hold">Suspenso / Aguardando</option>
              </select>
            </div>
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-1.5">
              <label className="text-xs font-bold text-slate-500 uppercase tracking-wider ml-1">Orçamento Previsto</label>
              <div className="relative">
                <span className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-400 font-bold text-xs">R$</span>
                <input
                  type="number"
                  step="0.01"
                  value={budget}
                  onChange={(e) => setBudget(parseFloat(e.target.value))}
                  className="w-full pl-10 pr-4 py-3 bg-slate-50 border border-slate-200 rounded-xl text-sm outline-none focus:ring-2 focus:ring-indigo-500 transition-all"
                />
              </div>
            </div>

            <div className="space-y-1.5">
              <label className="text-xs font-bold text-slate-500 uppercase tracking-wider ml-1">Data de Início</label>
              <input
                type="date"
                value={startDate}
                onChange={(e) => setStartDate(e.target.value)}
                className="w-full px-4 py-3 bg-slate-50 border border-slate-200 rounded-xl text-sm outline-none focus:ring-2 focus:ring-indigo-500 transition-all"
              />
            </div>
          </div>

          <div className="space-y-1.5">
            <label className="text-xs font-bold text-slate-500 uppercase tracking-wider ml-1">Cor Identificadora</label>
            <div className="flex items-center gap-3">
              <input
                type="color"
                value={color}
                onChange={(e) => setColor(e.target.value)}
                className="w-12 h-12 rounded-xl border-0 p-0 overflow-hidden cursor-pointer shadow-sm"
              />
              <p className="text-[10px] text-slate-400 font-medium italic">
                Esta cor será usada para identificar esta obra nos gráficos e extratos.
              </p>
            </div>
          </div>

          <div className="bg-indigo-50 p-4 rounded-2xl flex gap-3">
            <Info className="w-5 h-5 text-indigo-600 shrink-0 mt-0.5" />
            <p className="text-xs text-indigo-800 leading-relaxed">
              O <strong>Centro de Custo</strong> é o coração da sua gestão. Todos os lançamentos financeiros vinculados a ele comporão a DRE da obra automaticamente.
            </p>
          </div>

          <div className="flex gap-3 pt-4">
            <button
              type="button"
              onClick={onClose}
              className="flex-1 px-4 py-3 border border-slate-200 text-slate-600 font-bold rounded-xl hover:bg-slate-50 transition-all text-sm"
            >
              Cancelar
            </button>
            <button
              type="submit"
              className="flex-[2] px-4 py-3 bg-indigo-600 text-white font-bold rounded-xl hover:bg-indigo-700 shadow-lg shadow-indigo-100 transition-all text-sm"
            >
              {editingCC ? 'Salvar Alterações' : 'Criar Centro de Custo'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};
