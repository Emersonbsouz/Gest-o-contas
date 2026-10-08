import React, { useState, useEffect } from 'react';
import { X, FileText, Calendar, DollarSign, Info } from 'lucide-react';
import { Proposal, ContactPerson } from '../types';
import { ContactFormModal } from './ContactFormModal';
import { getSaveErrorMessage } from '../utils/saveErrors';

interface ProposalModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSave: (data: Omit<Proposal, 'id' | 'createdAt'>, id?: string, original?: Proposal) => Promise<unknown>;
  onSaveClient: (data: Omit<ContactPerson, 'id' | 'createdAt'>) => Promise<ContactPerson>;
  editingProposal: Proposal | null;
  contacts: ContactPerson[];
}

export const ProposalModal: React.FC<ProposalModalProps> = ({
  isOpen,
  onClose,
  onSave,
  onSaveClient,
  editingProposal,
  contacts
}) => {
  const [title, setTitle] = useState('');
  const [clientId, setClientId] = useState('');
  const [amount, setAmount] = useState(0);
  const [date, setDate] = useState('');
  const [status, setStatus] = useState<'draft' | 'sent' | 'approved' | 'rejected' | 'converted'>('draft');
  const [notes, setNotes] = useState('');
  const [description, setDescription] = useState('');
  const [validUntil, setValidUntil] = useState('');
  const [commercialTerms, setCommercialTerms] = useState('');
  const [deliveryTime, setDeliveryTime] = useState('');
  const [error, setError] = useState('');
  const [isSaving, setIsSaving] = useState(false);
  const [isClientOpen, setIsClientOpen] = useState(false);
  const [savedClient, setSavedClient] = useState<ContactPerson | null>(null);

  useEffect(() => {
    setError('');
    setIsClientOpen(false);
    setSavedClient(null);
    setDescription(editingProposal?.description || '');
    setValidUntil(editingProposal?.validUntil || '');
    setCommercialTerms(editingProposal?.commercialTerms || '');
    setDeliveryTime(editingProposal?.deliveryTime || '');
    if (editingProposal) {
      setTitle(editingProposal.title);
      setClientId(editingProposal.clientId);
      setAmount(editingProposal.amount);
      setDate(editingProposal.date);
      setStatus(editingProposal.status);
      setNotes(editingProposal.notes || '');
    } else {
      setTitle('');
      setClientId('');
      setAmount(0);
      setDate(new Date().toISOString().split('T')[0]);
      setStatus('draft');
      setNotes('');
    }
  }, [editingProposal, isOpen]);

  if (!isOpen) return null;

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (isSaving) return;
    if (!title.trim() || !clientId || !date || !Number.isFinite(amount) || amount < 0) {
      setError('Informe título, cliente, data e um valor válido.');
      return;
    }
    setIsSaving(true);
    setError('');
    try {
      await onSave({
        ...editingProposal,
        title: title.trim(),
        clientId,
        amount,
        date,
        status,
        notes,
        description: description || undefined,
        validUntil: validUntil || undefined,
        commercialTerms: commercialTerms || undefined,
        deliveryTime: deliveryTime || undefined,
      }, editingProposal?.id, editingProposal || undefined);
      onClose();
    } catch (err) {
      setError(err instanceof Error && /Esta proposta|Proposta não encontrada/.test(err.message) ? err.message : getSaveErrorMessage(err));
    } finally {
      setIsSaving(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-sm animate-in fade-in duration-200">
      <div className="bg-white w-full max-w-lg rounded-3xl shadow-2xl overflow-hidden flex flex-col max-h-[90vh]">
        <div className="px-6 py-4 border-b border-slate-100 flex items-center justify-between bg-slate-50/50">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-violet-600 flex items-center justify-center text-white shadow-lg shadow-violet-100">
              <FileText className="w-5 h-5" />
            </div>
            <div>
              <h3 className="font-bold text-slate-900">{editingProposal ? 'Editar Proposta' : 'Nova Proposta Técnica'}</h3>
              <p className="text-[10px] text-slate-400 font-bold uppercase tracking-wider">Módulo Comercial</p>
            </div>
          </div>
          <button disabled={isSaving || isClientOpen} onClick={onClose} aria-label="Fechar proposta" className="p-2 hover:bg-slate-200 rounded-xl transition-colors">
            <X className="w-5 h-5 text-slate-400" />
          </button>
        </div>

        <form onSubmit={handleSubmit} className="p-6 overflow-y-auto space-y-5">
          {error && <p role="alert" className="text-sm text-rose-700">{error}</p>}
          <fieldset disabled={isSaving || isClientOpen} className="space-y-5">
          <div className="space-y-1.5">
            <label className="text-xs font-bold text-slate-500 uppercase tracking-wider ml-1">Título da Proposta</label>
            <input
              autoFocus
              required
              type="text"
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              placeholder="Ex: Projeto Estrutural - Residência Silva"
              className="w-full px-4 py-3 bg-slate-50 border border-slate-200 rounded-xl text-sm focus:ring-2 focus:ring-violet-500 focus:border-transparent transition-all outline-none"
            />
          </div>

          <div className="space-y-1.5">
            <div className="flex items-center justify-between">
              <label htmlFor="proposal-client" className="text-xs font-bold text-slate-500 uppercase tracking-wider ml-1">Cliente</label>
              <button type="button" onClick={() => setIsClientOpen(true)} className="text-xs font-bold text-violet-600">Cadastrar cliente</button>
            </div>
            <select
              id="proposal-client"
              required
              value={clientId}
              onChange={(e) => setClientId(e.target.value)}
              className="w-full px-4 py-3 bg-slate-50 border border-slate-200 rounded-xl text-sm outline-none focus:ring-2 focus:ring-violet-500 transition-all"
            >
              <option value="">Selecione um cliente...</option>
              {clientId && !contacts.some(c => c.id === clientId && c.type === 'client') && savedClient?.id !== clientId && (
                <option value={clientId}>Cliente vinculado (indisponível no cadastro)</option>
              )}
              {savedClient && !contacts.some(c => c.id === savedClient.id) && <option value={savedClient.id}>{savedClient.name}</option>}
              {contacts.filter(c => c.type === 'client').map(c => (
                <option key={c.id} value={c.id}>{c.name}</option>
              ))}
            </select>
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-1.5">
              <label className="text-xs font-bold text-slate-500 uppercase tracking-wider ml-1">Valor do Orçamento</label>
              <div className="relative">
                <span className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-400 font-bold text-xs">R$</span>
                <input
                  type="number"
                  min="0"
                  required
                  step="0.01"
                  value={amount}
                  onChange={(e) => setAmount(parseFloat(e.target.value))}
                  className="w-full pl-10 pr-4 py-3 bg-slate-50 border border-slate-200 rounded-xl text-sm outline-none focus:ring-2 focus:ring-violet-500 transition-all"
                />
              </div>
            </div>

            <div className="space-y-1.5">
              <label className="text-xs font-bold text-slate-500 uppercase tracking-wider ml-1">Data da Emissão</label>
              <input
                type="date"
                required
                value={date}
                onChange={(e) => setDate(e.target.value)}
                className="w-full px-4 py-3 bg-slate-50 border border-slate-200 rounded-xl text-sm outline-none focus:ring-2 focus:ring-violet-500 transition-all"
              />
            </div>
          </div>

          <div className="space-y-1.5">
            <label className="text-xs font-bold text-slate-500 uppercase tracking-wider ml-1">Status Comercial</label>
            <div className="grid grid-cols-5 gap-1">
              {(['draft', 'sent', 'approved', 'rejected', 'converted'] as const).map((s) => (
                <button
                  key={s}
                  type="button"
                  disabled={!!editingProposal?.costCenterId || editingProposal?.status === 'converted'}
                  onClick={() => setStatus(s)}
                  className={`py-2 text-[9px] font-bold rounded-lg border transition-all uppercase tracking-tight ${
                    status === s 
                      ? 'bg-violet-600 border-violet-600 text-white' 
                      : 'bg-white border-slate-200 text-slate-500 hover:border-violet-300'
                  }`}
                >
                  {s === 'draft' ? 'Rasc' : s === 'sent' ? 'Env' : s === 'approved' ? 'Aprov' : s === 'rejected' ? 'Recus' : 'Conv'}
                </button>
              ))}
            </div>
          </div>

          <div className="space-y-1.5">
            <label htmlFor="proposal-description" className="text-xs font-bold text-slate-500">Objeto e escopo (aparece no relatório)</label>
            <textarea id="proposal-description" value={description} onChange={e => setDescription(e.target.value)} rows={3} className="w-full px-4 py-3 bg-slate-50 border border-slate-200 rounded-xl text-sm" />
          </div>
          <div className="space-y-1.5">
            <label htmlFor="proposal-validity" className="text-xs font-bold text-slate-500">Válida até</label>
            <input id="proposal-validity" type="date" min={date} value={validUntil} onChange={e => setValidUntil(e.target.value)} className="w-full px-4 py-3 bg-slate-50 border border-slate-200 rounded-xl text-sm" />
          </div>
          <div className="space-y-1.5">
            <label htmlFor="proposal-terms" className="text-xs font-bold text-slate-500">Condições comerciais (aparece no relatório)</label>
            <textarea id="proposal-terms" value={commercialTerms} onChange={e => setCommercialTerms(e.target.value)} rows={2} className="w-full px-4 py-3 bg-slate-50 border border-slate-200 rounded-xl text-sm" />
          </div>
          <div className="space-y-1.5">
            <label htmlFor="proposal-delivery" className="text-xs font-bold text-slate-500">Prazo de entrega</label>
            <input id="proposal-delivery" value={deliveryTime} onChange={e => setDeliveryTime(e.target.value)} className="w-full px-4 py-3 bg-slate-50 border border-slate-200 rounded-xl text-sm" />
          </div>
          <div className="space-y-1.5">
            <label className="text-xs font-bold text-slate-500 uppercase tracking-wider ml-1">Observações Internas</label>
            <textarea
              value={notes}
              onChange={(e) => setNotes(e.target.value)}
              rows={3}
              className="w-full px-4 py-3 bg-slate-50 border border-slate-200 rounded-xl text-sm outline-none focus:ring-2 focus:ring-violet-500 transition-all resize-none"
              placeholder="Notas sobre negociação, descontos ou escopo..."
            />
          </div>

          {status === 'approved' && (
            <div className="bg-emerald-50 p-4 rounded-2xl flex gap-3 animate-in slide-in-from-top-2">
              <Info className="w-5 h-5 text-emerald-600 shrink-0 mt-0.5" />
              <p className="text-xs text-emerald-800 leading-relaxed">
                Ao marcar como <strong>Aprovada</strong>, o sistema permitirá a conversão automática desta proposta em um novo <strong>Centro de Custo</strong> no módulo de Projetos.
              </p>
            </div>
          )}

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
              className="flex-[2] px-4 py-3 bg-violet-600 text-white font-bold rounded-xl hover:bg-violet-700 shadow-lg shadow-violet-100 transition-all text-sm"
            >
              {isSaving ? 'Salvando...' : editingProposal ? 'Salvar Alterações' : 'Emitir Proposta'}
            </button>
          </div>
          </fieldset>
        </form>
      </div>
      <ContactFormModal isOpen={isClientOpen} onClose={() => setIsClientOpen(false)} defaultType="client" fixedType
        onSave={async data => {
          const client = await onSaveClient({ ...data, type: 'client' });
          setSavedClient(client);
          setClientId(client.id);
        }} />
    </div>
  );
};
