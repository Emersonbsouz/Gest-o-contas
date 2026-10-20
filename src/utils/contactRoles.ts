import type { ContactPerson, ContactType } from '../types';
export function contactRoles(contact: Pick<ContactPerson, 'type' | 'roles'>): ContactType[] {
  return contact.roles?.length ? contact.roles : [contact.type];
}
export function hasContactRole(contact: Pick<ContactPerson, 'type' | 'roles'>, role: ContactType) {
  return contactRoles(contact).includes(role);
}
export const CONTACT_ROLE_LABELS: Record<ContactType, string> = {
  client: 'Cliente', supplier: 'Fornecedor', service_provider: 'Terceirizado', employee: 'Funcionário', other: 'Outro',
};
