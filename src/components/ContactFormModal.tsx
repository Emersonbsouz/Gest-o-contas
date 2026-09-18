import React, { useState, useEffect } from 'react';
import { X, Users, Phone, Mail, FileText, QrCode, Tag } from 'lucide-react';
import { ContactPerson, ContactType } from '../types';

interface ContactFormModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSave: (contactData: Omit<ContactPerson, 'id' | 'createdAt'>, contactId?: string) => void;
  editingContact?: ContactPerson | null;
  defaultType?: ContactType;
}

const CONTACT_TYPE_OPTIONS: { value: ContactType; label: string; desc: string }[] = [
  { value: 'supplier', label: 'Fornecedor / Favorecido', desc: 'Lojas, mercados, prestadores que você paga' },
  { value: 'customer', label: 'Cliente / Fonte Pagadora', desc: 'Pessoas ou empresas que pagam você' },
  { value: 'service_provider', label: 'Prestador de Serviços', desc: 'Médicos, mecânicos, diaristas, consultores' },
  { value: 'other', label: 'Outros Contatos', desc: 'Amigos, familiares ou contatos gerais' },
];

export const ContactFormModal: React.FC<ContactFormModalProps> = ({
  isOpen,
  onClose,
  onSave,
  editingContact,
  defaultType = 'supplier',
}) => {
  const [name, setName] = useState('');
  const [type, setType] = useState<ContactType>(defaultType);
  const [phone, setPhone] = useState('');
  const [email, setEmail] = useState('');
  const [document, setDocument] = useState('');
  const [pixKey, setPixKey] = useState('');
  const [notes, setNotes] = useState('');
  const [error, setError] = useState('');
  const [isLoading, setIsLoading] = useState(false);

  useEffect(() => {
    if (editingContact) {
      setName(editingContact.name);
      setType(editingContact.type);
      setPhone(editingContact.phone || '');
      setEmail(editingContact.email || '');
      setDocument(editingContact.document || '');
      setPixKey(editingContact.pixKey || '');
      setNotes(editingContact.notes || '');
    } else {
      setName('');
      setType(defaultType);
      setPhone('');
      setEmail('');
      setDocument('');
      setPixKey('');
      setNotes('');
    }
    setError('');
  }, [editingContact, defaultType, isOpen]);

  if (!isOpen) return null;

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!name.trim()) {
      setError('Por favor, informe o nome do contato / fornecedor / favorecido.');
      return;
    }

    setIsLoading(true);
    try {
      await onSave(
        {
          name: name.trim(),
          type,
          phone: phone.trim() || undefined,
          email: email.trim() || undefined,
          document: document.trim() || undefined,
          pixKey: pixKey.trim() || undefined,
          notes: notes.trim() || undefined,
        },
        editingContact?.id
      );
      onClose();
    } catch (err) {
      setError('Erro ao salvar. Tente novamente.');
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-xs overflow-y-auto">
      <div className="bg-white rounded-2xl shadow-xl w-full max-w-md overflow-hidden border border-slate-200 animate-in fade-in zoom-in-95 duration-150">
        {/* Modal Header */}
        <div className="px-6 py-4 border-b border-slate-100 flex items-center justify-between bg-slate-50/50">
          <div className="flex items-center gap-2.5">
            <div className="w-9 h-9 rounded-xl bg-violet-600 text-white flex items-center justify-center shadow-2xs">
              <Users className="w-5 h-5" />
            </div>
            <div>
              <h2 className="text-base font-bold text-slate-900">
                {editingContact ? 'Editar Contato / Favorecido' : 'Novo Contato / Fornecedor'}
              </h2>
              <p className="text-xs text-slate-500">
                Cadastre favorecidos para vincular em despesas e receitas
              </p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-1.5 rounded-lg text-slate-400 hover:text-slate-600 hover:bg-slate-100 transition-colors"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        {/* Modal Body */}
        <form onSubmit={handleSubmit} className="p-6 space-y-4">
          {error && (
            <div className="p-3 rounded-lg bg-rose-50 border border-rose-200 text-rose-700 text-xs font-medium">
              {error}
            </div>
          )}

          {/* Name */}
          <div>
            <label className="block text-xs font-semibold text-slate-700 mb-1">
              Nome / Razão Social / Nome do Favorecido *
            </label>
            <input
              type="text"
              value={name}
              onChange={(e) => setName(e.target.value)}
              placeholder="Ex: Supermercado Pão de Açúcar, Dr. Lucas, Tech Solutions"
              className="w-full px-3.5 py-2.5 rounded-xl border border-slate-300 text-slate-900 text-sm focus:outline-none focus:ring-2 focus:ring-violet-500/20 focus:border-violet-500 bg-white"
              required
            />
          </div>

          {/* Contact Type */}
          <div>
            <label className="block text-xs font-semibold text-slate-700 mb-1 flex items-center gap-1">
              <Tag className="w-3.5 h-3.5 text-slate-400" />
              Tipo de Contato / Favorecido
            </label>
            <div className="grid grid-cols-2 gap-2">
              {CONTACT_TYPE_OPTIONS.map((opt) => (
                <button
                  type="button"
                  key={opt.value}
                  onClick={() => setType(opt.value)}
                  className={`p-2.5 rounded-xl border text-left transition-all ${
                    type === opt.value
                      ? 'border-violet-600 bg-violet-50/70 text-violet-950 font-medium ring-1 ring-violet-500'
                      : 'border-slate-200 bg-slate-50/50 hover:bg-slate-100 text-slate-700'
                  }`}
                >
                  <p className="text-xs font-semibold">{opt.label}</p>
                  <p className="text-[10px] text-slate-500 leading-tight mt-0.5 line-clamp-1">{opt.desc}</p>
                </button>
              ))}
            </div>
          </div>

          {/* Document CPF/CNPJ & Phone */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            <div>
              <label className="block text-xs font-semibold text-slate-700 mb-1 flex items-center gap-1">
                <FileText className="w-3.5 h-3.5 text-slate-400" />
                CPF ou CNPJ
              </label>
              <input
                type="text"
                value={document}
                onChange={(e) => setDocument(e.target.value)}
                placeholder="00.000.000/0000-00"
                className="w-full px-3 py-2 rounded-lg border border-slate-300 text-slate-900 text-sm focus:outline-none focus:ring-2 focus:ring-violet-500/20 focus:border-violet-500"
              />
            </div>
            <div>
              <label className="block text-xs font-semibold text-slate-700 mb-1 flex items-center gap-1">
                <Phone className="w-3.5 h-3.5 text-slate-400" />
                Telefone / WhatsApp
              </label>
              <input
                type="text"
                value={phone}
                onChange={(e) => setPhone(e.target.value)}
                placeholder="(11) 99999-9999"
                className="w-full px-3 py-2 rounded-lg border border-slate-300 text-slate-900 text-sm focus:outline-none focus:ring-2 focus:ring-violet-500/20 focus:border-violet-500"
              />
            </div>
          </div>

          {/* Email & Pix Key */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            <div>
              <label className="block text-xs font-semibold text-slate-700 mb-1 flex items-center gap-1">
                <Mail className="w-3.5 h-3.5 text-slate-400" />
                E-mail para Cobrança
              </label>
              <input
                type="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                placeholder="contato@empresa.com"
                className="w-full px-3 py-2 rounded-lg border border-slate-300 text-slate-900 text-sm focus:outline-none focus:ring-2 focus:ring-violet-500/20 focus:border-violet-500"
              />
            </div>
            <div>
              <label className="block text-xs font-semibold text-slate-700 mb-1 flex items-center gap-1">
                <QrCode className="w-3.5 h-3.5 text-emerald-600" />
                Chave PIX (Favorecido)
              </label>
              <input
                type="text"
                value={pixKey}
                onChange={(e) => setPixKey(e.target.value)}
                placeholder="E-mail, CPF, Celular ou Aleatória"
                className="w-full px-3 py-2 rounded-lg border border-slate-300 text-slate-900 text-sm focus:outline-none focus:ring-2 focus:ring-violet-500/20 focus:border-violet-500 bg-emerald-50/20 font-mono"
              />
            </div>
          </div>

          {/* Notes */}
          <div>
            <label className="block text-xs font-semibold text-slate-700 mb-1">
              Observações Adicionais
            </label>
            <textarea
              value={notes}
              onChange={(e) => setNotes(e.target.value)}
              placeholder="Ex: Dados bancários, histórico de serviços prestados..."
              rows={2}
              className="w-full px-3 py-2 rounded-lg border border-slate-300 text-slate-900 text-sm focus:outline-none focus:ring-2 focus:ring-violet-500/20 focus:border-violet-500"
            />
          </div>

          {/* Footer Buttons */}
          <div className="flex items-center justify-end gap-3 pt-4 border-t border-slate-100">
            <button
              type="button"
              onClick={onClose}
              className="px-4 py-2 text-xs font-semibold text-slate-700 hover:bg-slate-100 rounded-lg transition-colors"
            >
              Cancelar
            </button>
            <button
              type="submit"
              disabled={isLoading}
              className="px-5 py-2 text-xs font-bold text-white bg-violet-600 hover:bg-violet-700 disabled:bg-slate-300 disabled:cursor-not-allowed rounded-lg shadow-xs transition-colors flex items-center gap-1.5"
            >
              {isLoading ? (
                <span className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />
              ) : null}
              {editingContact ? 'Salvar Alterações' : 'Cadastrar Contato'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};
