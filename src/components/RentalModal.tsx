import React, { useState, useEffect } from 'react';
import { X, Settings2, Calendar, DollarSign, Package } from 'lucide-react';
import { Rental, ContactPerson, Equipment } from '../types';

interface RentalModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSave: (data: Omit<Rental, 'id' | 'createdAt'>, id?: string) => void;
  editingRental: Rental | null;
  contacts: ContactPerson[];
  equipment: Equipment[];
}

export const RentalModal: React.FC<RentalModalProps> = ({
  isOpen,
  onClose,
  onSave,
  editingRental,
  contacts,
  equipment
}) => {
  const [equipmentId, setEquipmentId] = useState('');
  const [clientId, setClientId] = useState('');
  const [startDate, setStartDate] = useState('');
  const [expectedReturnDate, setExpectedReturnDate] = useState('');
  const [amount, setAmount] = useState(0);
  const [status, setStatus] = useState<'active' | 'returned' | 'overdue'>('active');

  useEffect(() => {
    if (editingRental) {
      setEquipmentId(editingRental.equipmentId);
      setClientId(editingRental.clientId);
      setStartDate(editingRental.startDate);
      setExpectedReturnDate(editingRental.expectedReturnDate || '');
      setAmount(editingRental.amount);
      setStatus(editingRental.status);
    } else {
      setEquipmentId('');
      setClientId('');
      setStartDate(new Date().toISOString().split('T')[0]);
      setExpectedReturnDate('');
      setAmount(0);
      setStatus('active');
    }
  }, [editingRental, isOpen]);

  if (!isOpen) return null;

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    onSave({
      equipmentId,
      clientId,
      startDate,
      expectedReturnDate: expectedReturnDate || undefined,
      amount,
      status,
    }, editingRental?.id);
    onClose();
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-sm animate-in fade-in duration-200">
      <div className="bg-white w-full max-w-lg rounded-3xl shadow-2xl overflow-hidden flex flex-col max-h-[90vh]">
        <div className="px-6 py-4 border-b border-slate-100 flex items-center justify-between bg-slate-50/50">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-emerald-600 flex items-center justify-center text-white shadow-lg shadow-emerald-100">
              <Settings2 className="w-5 h-5" />
            </div>
            <div>
              <h3 className="font-bold text-slate-900">{editingRental ? 'Editar Locação' : 'Nova Saída de Equipamento'}</h3>
              <p className="text-[10px] text-slate-400 font-bold uppercase tracking-wider">Controle de Patrimônio</p>
            </div>
          </div>
          <button onClick={onClose} className="p-2 hover:bg-slate-200 rounded-xl transition-colors">
            <X className="w-5 h-5 text-slate-400" />
          </button>
        </div>

        <form onSubmit={handleSubmit} className="p-6 overflow-y-auto space-y-5">
          <div className="space-y-1.5">
            <label className="text-xs font-bold text-slate-500 uppercase tracking-wider ml-1">Equipamento / Ferramenta</label>
            <select
              required
              value={equipmentId}
              onChange={(e) => setEquipmentId(e.target.value)}
              className="w-full px-4 py-3 bg-slate-50 border border-slate-200 rounded-xl text-sm outline-none focus:ring-2 focus:ring-emerald-500 transition-all"
            >
              <option value="">Selecione um item do estoque...</option>
              {equipment.map(e => (
                <option key={e.id} value={e.id}>{e.name} ({e.serialNumber || 'S/N'})</option>
              ))}
            </select>
          </div>

          <div className="space-y-1.5">
            <label className="text-xs font-bold text-slate-500 uppercase tracking-wider ml-1">Locatário (Cliente/Obra)</label>
            <select
              required
              value={clientId}
              onChange={(e) => setClientId(e.target.value)}
              className="w-full px-4 py-3 bg-slate-50 border border-slate-200 rounded-xl text-sm outline-none focus:ring-2 focus:ring-emerald-500 transition-all"
            >
              <option value="">Selecione o responsável...</option>
              {contacts.filter(c => c.type === 'client').map(c => (
                <option key={c.id} value={c.id}>{c.name}</option>
              ))}
            </select>
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-1.5">
              <label className="text-xs font-bold text-slate-500 uppercase tracking-wider ml-1">Data de Saída</label>
              <input
                type="date"
                required
                value={startDate}
                onChange={(e) => setStartDate(e.target.value)}
                className="w-full px-4 py-3 bg-slate-50 border border-slate-200 rounded-xl text-sm outline-none focus:ring-2 focus:ring-emerald-500 transition-all"
              />
            </div>

            <div className="space-y-1.5">
              <label className="text-xs font-bold text-slate-500 uppercase tracking-wider ml-1">Previsão de Devolução</label>
              <input
                type="date"
                value={expectedReturnDate}
                onChange={(e) => setExpectedReturnDate(e.target.value)}
                className="w-full px-4 py-3 bg-slate-50 border border-slate-200 rounded-xl text-sm outline-none focus:ring-2 focus:ring-emerald-500 transition-all"
              />
            </div>
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-1.5">
              <label className="text-xs font-bold text-slate-500 uppercase tracking-wider ml-1">Valor da Locação (Total)</label>
              <div className="relative">
                <span className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-400 font-bold text-xs">R$</span>
                <input
                  type="number"
                  step="0.01"
                  value={amount}
                  onChange={(e) => setAmount(parseFloat(e.target.value))}
                  className="w-full pl-10 pr-4 py-3 bg-slate-50 border border-slate-200 rounded-xl text-sm outline-none focus:ring-2 focus:ring-emerald-500 transition-all"
                />
              </div>
            </div>

            <div className="space-y-1.5">
              <label className="text-xs font-bold text-slate-500 uppercase tracking-wider ml-1">Status da Posse</label>
              <select
                value={status}
                onChange={(e) => setStatus(e.target.value as any)}
                className="w-full px-4 py-3 bg-slate-50 border border-slate-200 rounded-xl text-sm outline-none focus:ring-2 focus:ring-emerald-500 transition-all"
              >
                <option value="active">Em Campo / Locado</option>
                <option value="returned">Devolvido ao Estoque</option>
                <option value="overdue">Atrasado</option>
              </select>
            </div>
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
              className="flex-[2] px-4 py-3 bg-emerald-600 text-white font-bold rounded-xl hover:bg-emerald-700 shadow-lg shadow-emerald-100 transition-all text-sm"
            >
              {editingRental ? 'Salvar Alterações' : 'Confirmar Locação'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};
