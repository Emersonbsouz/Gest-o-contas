import React from 'react';
import { 
  LayoutDashboard, 
  Briefcase, 
  Hammer, 
  DollarSign, 
  Settings, 
  BarChart3,
  ChevronRight,
  LogOut,
  Building2,
  User,
  ShieldCheck,
  Menu,
  X
} from 'lucide-react';
import { Company } from '../types';

interface SidebarProps {
  activeView: string;
  onViewChange: (view: any) => void;
  activeCompany: Company | null;
  onLogout: () => void;
  cloudSyncStatus: 'synced' | 'syncing' | 'error';
}

export const Sidebar: React.FC<SidebarProps> = ({ 
  activeView, 
  onViewChange, 
  activeCompany, 
  onLogout,
  cloudSyncStatus 
}) => {
  const [isMobileMenuOpen, setIsMobileMenuOpen] = React.useState(false);

  const menuItems = [
    { id: 'dashboard', label: 'Dashboard', icon: LayoutDashboard },
    { id: 'comercial', label: 'Comercial', icon: Briefcase },
    { id: 'projetos', label: 'Projetos', icon: Hammer },
    { id: 'financeiro', label: 'Financeiro', icon: DollarSign },
    { id: 'cadastros', label: 'Cadastros', icon: Settings },
    { id: 'relatorios', label: 'Relatórios', icon: BarChart3 },
  ];

  const navItemClass = (id: string) => `
    flex items-center gap-3 px-4 py-3 rounded-xl transition-all duration-200 group
    ${activeView === id 
      ? 'bg-indigo-600 text-white shadow-lg shadow-indigo-200' 
      : 'text-slate-500 hover:bg-indigo-50 hover:text-indigo-600'}
  `;

  return (
    <>
      {/* Mobile Menu Toggle */}
      <div className="lg:hidden fixed top-4 left-4 z-50">
        <button
          onClick={() => setIsMobileMenuOpen(!isMobileMenuOpen)}
          className="p-2 bg-white rounded-lg shadow-md border border-slate-200"
        >
          {isMobileMenuOpen ? <X className="w-6 h-6" /> : <Menu className="w-6 h-6" />}
        </button>
      </div>

      {/* Backdrop for mobile */}
      {isMobileMenuOpen && (
        <div 
          className="fixed inset-0 bg-slate-900/40 backdrop-blur-sm z-40 lg:hidden"
          onClick={() => setIsMobileMenuOpen(false)}
        />
      )}

      <aside className={`
        fixed lg:static inset-y-0 left-0 z-40
        w-72 bg-white border-r border-slate-200 flex flex-col
        transition-transform duration-300 transform
        ${isMobileMenuOpen ? 'translate-x-0' : '-translate-x-full lg:translate-x-0'}
      `}>
        {/* Logo Section */}
        <div className="p-6 border-b border-slate-100">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 bg-indigo-600 rounded-xl flex items-center justify-center shadow-indigo-100 shadow-lg">
              <Building2 className="text-white w-6 h-6" />
            </div>
            <div>
              <h1 className="font-bold text-slate-900 leading-tight">Engenharia</h1>
              <p className="text-[10px] text-slate-400 font-bold uppercase tracking-wider">Gestão Técnica</p>
            </div>
          </div>
        </div>

        {/* Company Status (Small) */}
        {activeCompany && (
          <div className="px-6 py-4 bg-slate-50/50">
            <div className="flex items-center gap-3">
              <div 
                className="w-8 h-8 rounded-lg flex items-center justify-center text-white"
                style={{ backgroundColor: activeCompany.color || '#4f46e5' }}
              >
                {activeCompany.type === 'business' ? <Building2 className="w-4 h-4" /> : <User className="w-4 h-4" />}
              </div>
              <div className="overflow-hidden">
                <p className="text-xs font-bold text-slate-800 truncate">{activeCompany.name}</p>
                <div className="flex items-center gap-1">
                  <div className={`w-1.5 h-1.5 rounded-full ${cloudSyncStatus === 'synced' ? 'bg-emerald-500' : 'bg-rose-500'}`} />
                  <span className="text-[10px] text-slate-400 font-medium">
                    {cloudSyncStatus === 'synced' ? 'Nuvem Ativa' : 'Offline'}
                  </span>
                </div>
              </div>
            </div>
          </div>
        )}

        {/* Navigation */}
        <nav className="flex-1 px-4 py-6 space-y-2 overflow-y-auto">
          {menuItems.map((item) => (
            <button
              key={item.id}
              onClick={() => {
                onViewChange(item.id);
                setIsMobileMenuOpen(false);
              }}
              className={navItemClass(item.id)}
            >
              <item.icon className={`w-5 h-5 ${activeView === item.id ? 'text-white' : 'text-slate-400 group-hover:text-indigo-600'}`} />
              <span className="font-bold text-sm tracking-tight">{item.label}</span>
              {activeView === item.id && <ChevronRight className="ml-auto w-4 h-4 opacity-70" />}
            </button>
          ))}
        </nav>

        {/* Footer / User Profile */}
        <div className="p-4 border-t border-slate-100">
          <button
            onClick={onLogout}
            className="w-full flex items-center gap-3 px-4 py-3 text-slate-500 hover:text-rose-600 hover:bg-rose-50 rounded-xl transition-colors font-bold text-sm"
          >
            <LogOut className="w-5 h-5" />
            <span>Sair do Sistema</span>
          </button>
        </div>
      </aside>
    </>
  );
};
