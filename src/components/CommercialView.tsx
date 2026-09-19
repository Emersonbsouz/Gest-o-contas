import React from 'react';
import { Briefcase, Plus, FileText, Settings2 } from 'lucide-react';
import { Proposal, Rental, ContactPerson, Equipment } from '../types';
import { formatCurrency, formatDateBR } from '../utils/formatters';

interface CommercialViewProps {
  proposals: Proposal[];
  rentals: Rental[];
  contacts: ContactPerson[];
  equipment: Equipment[];
  onOpenProposalModal: (proposal?: Proposal) => void;
  onDeleteProposal: (id: string) => void;
  onOpenRentalModal: (rental?: Rental) => void;
  onDeleteRental: (id: string) => void;
  onConvertProposal: (proposal: Proposal) => void;
}

export const CommercialView: React.FC<CommercialViewProps> = ({
  proposals,
  rentals,
  contacts,
  equipment,
  onOpenProposalModal,
  onDeleteProposal,
  onOpenRentalModal,
  onDeleteRental,
  onConvertProposal
}) => {
  return (
    <div className="space-y-6 animate-in fade-in duration-500">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-2xl font-bold text-slate-900">Módulo Comercial</h2>
          <p className="text-slate-500 text-sm">Gestão de propostas, orçamentos e locações.</p>
        </div>
        <div className="flex gap-2">
          <button 
            onClick={() => onOpenProposalModal()}
            className="flex items-center gap-2 px-4 py-2 bg-indigo-600 text-white rounded-xl text-sm font-bold shadow-lg shadow-indigo-100 hover:bg-indigo-700 transition-all"
          >
            <Plus className="w-4 h-4" />
            Nova Proposta
          </button>
          <button 
            onClick={() => onOpenRentalModal()}
            className="flex items-center gap-2 px-4 py-2 bg-emerald-600 text-white rounded-xl text-sm font-bold shadow-lg shadow-emerald-100 hover:bg-emerald-700 transition-all"
          >
            <Plus className="w-4 h-4" />
            Nova Locação
          </button>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Propostas */}
        <div className="bg-white rounded-3xl border border-slate-200 shadow-sm overflow-hidden">
          <div className="p-6 border-b border-slate-100 flex items-center justify-between bg-slate-50/50">
            <h3 className="font-bold text-slate-900 flex items-center gap-2">
              <FileText className="w-4 h-4 text-indigo-600" />
              Gestão de Propostas
            </h3>
          </div>
          <div className="divide-y divide-slate-100">
            {proposals.length === 0 ? (
              <div className="p-12 text-center text-slate-400 text-sm italic">
                Nenhuma proposta emitida ainda.
              </div>
            ) : (
              proposals.map(prop => (
                <div key={prop.id} className="p-4 flex items-center justify-between hover:bg-slate-50">
                  <div>
                    <p className="text-sm font-bold text-slate-800">{prop.title}</p>
                    <p className="text-[10px] text-slate-400 font-bold uppercase tracking-tight">
                      {contacts.find(c => c.id === prop.clientId)?.name || 'Cliente desconhecido'} • {formatDateBR(prop.date)}
                    </p>
                  </div>
                  <div className="text-right flex flex-col items-end gap-2">
                    <p className="text-sm font-black text-slate-900">{formatCurrency(prop.amount)}</p>
                    <div className="flex items-center gap-2">
                      {prop.status === 'approved' && (
                        <button 
                          onClick={() => onConvertProposal(prop)}
                          className="text-[10px] font-bold bg-indigo-600 text-white px-2 py-0.5 rounded-full hover:bg-indigo-700 transition-colors uppercase"
                          title="Transformar em Centro de Custo (Obra)"
                        >
                          Converter em Obra
                        </button>
                      )}
                      <span className={`text-[10px] font-bold px-2 py-0.5 rounded-full uppercase ${
                        prop.status === 'approved' ? 'bg-emerald-100 text-emerald-700' :
                        prop.status === 'rejected' ? 'bg-rose-100 text-rose-700' :
                        'bg-amber-100 text-amber-700'
                      }`}>
                        {prop.status}
                      </span>
                    </div>
                  </div>
                </div>
              ))
            )}
          </div>
        </div>

        {/* Locações */}
        <div className="bg-white rounded-3xl border border-slate-200 shadow-sm overflow-hidden">
          <div className="p-6 border-b border-slate-100 flex items-center justify-between bg-slate-50/50">
            <h3 className="font-bold text-slate-900 flex items-center gap-2">
              <Settings2 className="w-4 h-4 text-emerald-600" />
              Controle de Locações
            </h3>
          </div>
          <div className="divide-y divide-slate-100">
            {rentals.length === 0 ? (
              <div className="p-12 text-center text-slate-400 text-sm italic">
                Nenhuma locação ativa no momento.
              </div>
            ) : (
              rentals.map(rent => (
                <div key={rent.id} className="p-4 flex items-center justify-between hover:bg-slate-50">
                  <div>
                    <p className="text-sm font-bold text-slate-800">
                      {equipment.find(e => e.id === rent.equipmentId)?.name || 'Equipamento'}
                    </p>
                    <p className="text-[10px] text-slate-400 font-bold uppercase tracking-tight">
                      {contacts.find(c => c.id === rent.clientId)?.name || 'Cliente'} • Início: {formatDateBR(rent.startDate)}
                    </p>
                  </div>
                  <div className="text-right">
                    <p className="text-sm font-black text-slate-900">{formatCurrency(rent.amount)}</p>
                    <span className={`text-[10px] font-bold px-2 py-0.5 rounded-full uppercase ${
                      rent.status === 'active' ? 'bg-amber-100 text-amber-700' : 'bg-emerald-100 text-emerald-700'
                    }`}>
                      {rent.status}
                    </span>
                  </div>
                </div>
              ))
            )}
          </div>
        </div>
      </div>
    </div>
  );
};
