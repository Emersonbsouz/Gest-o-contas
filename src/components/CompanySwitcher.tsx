import React, { useState, useRef, useEffect } from 'react';
import {
  Building2,
  User,
  ChevronDown,
  Plus,
  Users,
  Check,
  Shield,
  Briefcase,
} from 'lucide-react';
import { Company } from '../types';

interface CompanySwitcherProps {
  companies: Company[];
  activeCompany: Company | null;
  onSelectCompany: (company: Company) => void;
  onOpenCreateCompany: () => void;
  onOpenManageMembers: () => void;
  currentUserEmail?: string | null;
}

export const CompanySwitcher: React.FC<CompanySwitcherProps> = ({
  companies = [],
  activeCompany,
  onSelectCompany,
  onOpenCreateCompany,
  onOpenManageMembers,
  currentUserEmail,
}) => {
  const [isOpen, setIsOpen] = useState(false);
  const dropdownRef = useRef<HTMLDivElement>(null);

  // Close dropdown on outside click
  useEffect(() => {
    const handleClickOutside = (e: MouseEvent) => {
      if (dropdownRef.current && !dropdownRef.current.contains(e.target as Node)) {
        setIsOpen(false);
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  if (!activeCompany) return null;

  const isOwner = (activeCompany.ownerEmail || '').toLowerCase() === (currentUserEmail || '').toLowerCase();

  return (
    <div className="relative" ref={dropdownRef}>
      {/* Trigger button */}
      <button
        type="button"
        onClick={() => setIsOpen(!isOpen)}
        className="flex items-center gap-2.5 px-3 py-1.5 bg-slate-50 hover:bg-slate-100 border border-slate-200/90 rounded-xl transition shadow-2xs group"
        title="Alternar entre suas empresas e finanças pessoais"
      >
        <div
          className="w-6 h-6 rounded-lg flex items-center justify-center text-white text-xs font-bold shrink-0 shadow-2xs"
          style={{ backgroundColor: activeCompany.color || '#4f46e5' }}
        >
          {activeCompany.type === 'business' ? (
            <Building2 className="w-3.5 h-3.5" />
          ) : (
            <User className="w-3.5 h-3.5" />
          )}
        </div>

        <div className="text-left max-w-[140px] sm:max-w-[180px] truncate">
          <div className="text-xs font-bold text-slate-900 truncate flex items-center gap-1.5">
            {activeCompany.name}
          </div>
          <div className="text-[10px] text-slate-500 font-medium leading-none flex items-center gap-1">
            {activeCompany.type === 'business' ? 'Empresa (PJ)' : 'Pessoal (PF)'}
            {!isOwner && (
              <span className="text-indigo-600 font-bold">• Compartilhada</span>
            )}
          </div>
        </div>

        <ChevronDown className="w-4 h-4 text-slate-400 group-hover:text-slate-600 transition shrink-0 ml-0.5" />
      </button>

      {/* Dropdown Menu */}
      {isOpen && (
        <div className="absolute left-0 mt-2 w-72 bg-white rounded-2xl shadow-xl border border-slate-200 py-2 z-50 animate-in fade-in zoom-in-95 duration-150">
          <div className="px-3.5 py-2 border-b border-slate-100">
            <p className="text-[10px] uppercase font-bold text-slate-400 tracking-wider">
              Empresas & Perfis com Acesso
            </p>
            <p className="text-[11px] text-slate-500">
              Dados 100% isolados entre cada empresa
            </p>
          </div>

          {/* List of companies */}
          <div className="py-1 max-h-60 overflow-y-auto">
            {(companies || []).map((comp) => {
              const isSelected = comp.id === activeCompany.id;
              const isThisOwner = (comp.ownerEmail || '').toLowerCase() === (currentUserEmail || '').toLowerCase();

              return (
                <button
                  key={comp.id}
                  type="button"
                  onClick={() => {
                    onSelectCompany(comp);
                    setIsOpen(false);
                  }}
                  className={`w-full flex items-center justify-between px-3.5 py-2 text-xs text-left transition ${
                    isSelected
                      ? 'bg-indigo-50/70 text-indigo-900 font-bold'
                      : 'hover:bg-slate-50 text-slate-700'
                  }`}
                >
                  <div className="flex items-center gap-2.5 truncate pr-2">
                    <div
                      className="w-6 h-6 rounded-lg flex items-center justify-center text-white text-xs shrink-0"
                      style={{ backgroundColor: comp.color || '#4f46e5' }}
                    >
                      {comp.type === 'business' ? (
                        <Building2 className="w-3 h-3" />
                      ) : (
                        <User className="w-3 h-3" />
                      )}
                    </div>
                    <div className="truncate">
                      <div className="truncate font-semibold">{comp.name}</div>
                      <div className="text-[10px] text-slate-400 font-normal">
                        {comp.type === 'business' ? 'Empresa (PJ)' : 'Pessoal (PF)'}
                        {!isThisOwner && ' • Convidado'}
                      </div>
                    </div>
                  </div>

                  {isSelected && <Check className="w-4 h-4 text-indigo-600 shrink-0" />}
                </button>
              );
            })}
          </div>

          {/* Actions */}
          <div className="pt-1.5 border-t border-slate-100 px-2 space-y-1">
            <button
              type="button"
              onClick={() => {
                setIsOpen(false);
                onOpenManageMembers();
              }}
              className="w-full flex items-center gap-2 px-2.5 py-1.5 text-xs text-slate-700 hover:text-indigo-600 hover:bg-slate-50 rounded-lg font-medium transition"
            >
              <Users className="w-3.5 h-3.5 text-slate-400" />
              <span>Gerenciar Sócios e Acessos ({activeCompany.memberEmails?.length || 1})</span>
            </button>

            <button
              type="button"
              onClick={() => {
                setIsOpen(false);
                onOpenCreateCompany();
              }}
              className="w-full flex items-center gap-2 px-2.5 py-1.5 text-xs text-indigo-600 hover:bg-indigo-50 rounded-lg font-semibold transition"
            >
              <Plus className="w-3.5 h-3.5" />
              <span>+ Nova Empresa ou Perfil</span>
            </button>
          </div>
        </div>
      )}
    </div>
  );
};
