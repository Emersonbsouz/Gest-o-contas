import { useState } from 'react';
import { useActionReview } from '../context/ActionReviewContext';
import type { Company, CompanyProfile } from '../types';
import { getSaveErrorMessage } from '../utils/saveErrors';

const fields: Array<{ key: keyof CompanyProfile; label: string; type?: string }> = [
  { key: 'document', label: 'CPF ou CNPJ' },
  { key: 'email', label: 'E-mail comercial', type: 'email' },
  { key: 'phone', label: 'Telefone', type: 'tel' },
  { key: 'address', label: 'Endereço' },
  { key: 'pixKey', label: 'Chave Pix' },
  { key: 'pixReceiver', label: 'Titular da chave Pix' },
  { key: 'pixBank', label: 'Instituição financeira' },
];

export function CompanyProfileModal({ company, onClose, onSave }: {
  company: Company;
  onClose: () => void;
  onSave: (name: string, profile: CompanyProfile) => Promise<void>;
}) {
  const { reviewForm } = useActionReview();
  const [name, setName] = useState(company.name);
  const [profile, setProfile] = useState<CompanyProfile>(company.profile ?? {});
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState('');

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/60 p-4">
      <section role="dialog" aria-modal="true" aria-label="Editar dados da empresa" className="max-h-[90dvh] w-full max-w-xl overflow-y-auto rounded-2xl bg-white p-5 shadow-xl">
        <h2 className="text-lg font-bold">Editar dados da empresa</h2>
        <p className="mt-1 text-sm text-slate-600">Os dados Pix deste perfil serão preenchidos nas cobranças da empresa.</p>
        <form className="mt-4 space-y-4" onSubmit={async event => {
          event.preventDefault();
          if (saving) return;
          if (!name.trim()) { setError('Informe o nome da empresa.'); return; }
          const cleaned: CompanyProfile = {};
          for (const { key } of fields) {
            const value = profile[key]?.trim();
            if (value) cleaned[key] = value;
          }
          if (!await reviewForm(event.currentTarget, 'Revisar dados da empresa')) return;
          setSaving(true);
          setError('');
          try {
            await onSave(name.trim(), cleaned);
            onClose();
          } catch (failure) {
            setError(getSaveErrorMessage(failure));
          } finally {
            setSaving(false);
          }
        }}>
          {error && <p role="alert" className="text-sm text-rose-700">{error}</p>}
          <label className="block text-sm font-medium">Nome da empresa ou perfil
            <input autoFocus required maxLength={150} value={name} onChange={event => setName(event.target.value)} className="mt-1 block w-full rounded-lg border p-2" />
          </label>
          <div className="grid gap-3 sm:grid-cols-2">
            {fields.map(({ key, label, type }) => (
              <label key={key} className="block text-sm font-medium">{label}
                <input type={type ?? 'text'} maxLength={250} value={profile[key] ?? ''} onChange={event => setProfile({ ...profile, [key]: event.target.value })} className="mt-1 block w-full rounded-lg border p-2" />
              </label>
            ))}
          </div>
          <div className="flex justify-end gap-2 border-t pt-4">
            <button type="button" disabled={saving} onClick={onClose} className="rounded-lg border px-4 py-2 text-sm">Cancelar</button>
            <button type="submit" disabled={saving} className="rounded-lg bg-indigo-600 px-4 py-2 text-sm font-bold text-white disabled:opacity-50">{saving ? 'Salvando…' : 'Salvar dados'}</button>
          </div>
        </form>
      </section>
    </div>
  );
}
