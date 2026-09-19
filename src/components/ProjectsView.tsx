import React from 'react';
import { Hammer, Plus, MapPin, CheckCircle2, Clock } from 'lucide-react';
import { CostCenter, ContactPerson } from '../types';
import { formatCurrency } from '../utils/formatters';

interface ProjectsViewProps {
  costCenters: CostCenter[];
  contacts: ContactPerson[];
  onOpenCostCenterModal: (cc?: CostCenter) => void;
  onDeleteCostCenter: (id: string) => void;
}

export const ProjectsView: React.FC<ProjectsViewProps> = ({
  costCenters,
  contacts,
  onOpenCostCenterModal,
  onDeleteCostCenter
}) => {
  return (
    <div className="space-y-6 animate-in fade-in duration-500">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-2xl font-bold text-slate-900">Gestão de Projetos</h2>
          <p className="text-slate-500 text-sm">Controle de obras e centros de custo ativos.</p>
        </div>
        <button 
          onClick={() => onOpenCostCenterModal()}
          className="flex items-center gap-2 px-4 py-2 bg-indigo-600 text-white rounded-xl text-sm font-bold shadow-lg shadow-indigo-100 hover:bg-indigo-700 transition-all"
        >
          <Plus className="w-4 h-4" />
          Novo Centro de Custo
        </button>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {costCenters.length === 0 ? (
          <div className="col-span-full bg-white p-12 rounded-3xl border border-slate-200 border-dashed text-center text-slate-400 italic">
            Nenhum projeto ou obra cadastrada.
          </div>
        ) : (
          costCenters.map(cc => (
            <div key={cc.id} className="bg-white rounded-3xl border border-slate-200 shadow-sm hover:shadow-md transition-all overflow-hidden group">
              <div className="h-2 w-full" style={{ backgroundColor: cc.color }} />
              <div className="p-6">
                <div className="flex items-start justify-between mb-4">
                  <div>
                    <h3 className="font-bold text-slate-900 group-hover:text-indigo-600 transition-colors">{cc.name}</h3>
                    <p className="text-[11px] text-slate-500 font-medium flex items-center gap-1 mt-1">
                      <MapPin className="w-3 h-3" />
                      {contacts.find(c => c.id === cc.clientId)?.name || 'Cliente não definido'}
                    </p>
                  </div>
                  <span className={`text-[10px] font-bold px-2 py-0.5 rounded-full uppercase ${
                    cc.status === 'active' ? 'bg-emerald-100 text-emerald-700' :
                    cc.status === 'completed' ? 'bg-indigo-100 text-indigo-700' :
                    'bg-slate-100 text-slate-700'
                  }`}>
                    {cc.status === 'active' ? 'Em Andamento' : 
                     cc.status === 'completed' ? 'Concluído' : 'Suspenso'}
                  </span>
                </div>

                <div className="space-y-3 pt-4 border-t border-slate-50">
                  <div className="flex items-center justify-between text-xs">
                    <span className="text-slate-400 font-medium flex items-center gap-1">
                      <Clock className="w-3.5 h-3.5" />
                      Início em
                    </span>
                    <span className="text-slate-700 font-bold">{cc.startDate || 'Não definida'}</span>
                  </div>
                  <div className="flex items-center justify-between text-xs">
                    <span className="text-slate-400 font-medium flex items-center gap-1">
                      <CheckCircle2 className="w-3.5 h-3.5" />
                      Orçamento Previsto
                    </span>
                    <span className="text-slate-900 font-black">{formatCurrency(cc.budget || 0)}</span>
                  </div>
                </div>

                <div className="mt-6 flex gap-2">
                  <button 
                    onClick={() => onOpenCostCenterModal(cc)}
                    className="flex-1 py-2 px-3 bg-slate-100 hover:bg-slate-200 text-slate-700 text-xs font-bold rounded-xl transition-colors"
                  >
                    Editar
                  </button>
                  <button className="flex-1 py-2 px-3 bg-indigo-50 hover:bg-indigo-100 text-indigo-700 text-xs font-bold rounded-xl transition-colors">
                    Ver DRE
                  </button>
                </div>
              </div>
            </div>
          ))
        )}
      </div>
    </div>
  );
};
