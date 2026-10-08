import React from 'react';
import { act, cleanup, fireEvent, render, screen, waitFor } from '@testing-library/react';
import { afterEach, expect, test, vi } from 'vitest';
import { ProposalModal } from './ProposalModal';
import { CommercialView } from './CommercialView';
import { Proposal } from '../types';
import { ProposalReport } from './ProposalReport';

afterEach(cleanup);

test('report shows actual proposal and client fields while excluding internal notes and payment keys', () => {
  const item = {...proposal,notes:'INTERNAL-SECRET',commercialTerms:'Pagamento em duas parcelas',deliveryTime:'30 dias'};
  render(<ProposalReport proposal={item} client={{...client,document:'CLIENT-DOCUMENT',phone:'CLIENT-PHONE',address:'CLIENT-ADDRESS',notes:'CONTACT-SECRET',pixKey:'PIX-SECRET'}} companyName="Empresa real" onClose={vi.fn()} />);
  expect(screen.getAllByText('Empresa real')).toHaveLength(2);
  expect(screen.getByText('CPF / CNPJ: CLIENT-DOCUMENT')).toBeTruthy();
  expect(screen.getByText('Pagamento em duas parcelas')).toBeTruthy();
  expect(screen.getByText('30 dias')).toBeTruthy();
  expect(screen.queryByText('INTERNAL-SECRET')).toBeNull();
  expect(document.querySelector('#proposal-report')?.textContent).not.toMatch(/CONTACT-SECRET|PIX-SECRET/);
});

test('report handles legacy proposals without items or commercial terms and invokes printing', () => {
  const print = vi.spyOn(window,'print').mockImplementation(() => {});
  render(<ProposalReport proposal={{...proposal,items:undefined,description:undefined,validUntil:undefined}} companyName="Empresa" onClose={vi.fn()} />);
  expect(screen.getByText('Cliente indisponível no cadastro')).toBeTruthy();
  expect(screen.queryByText('Condições comerciais')).toBeNull();
  fireEvent.click(screen.getByRole('button',{name:'Imprimir / Salvar PDF'}));
  expect(print).toHaveBeenCalledOnce();
  print.mockRestore();
});

test('report button opens the selected proposal with the active company', () => {
  render(<CommercialView companyName="Empresa ativa" proposals={[proposal]} rentals={[]} contacts={[client]} equipment={[]}
    onOpenProposalModal={vi.fn()} onDeleteProposal={vi.fn()} onOpenRentalModal={vi.fn()} onDeleteRental={vi.fn()} onConvertProposal={vi.fn()} />);
  fireEvent.click(screen.getByRole('button',{name:'Relatório da proposta Projeto A'}));
  expect(screen.getByRole('dialog',{name:'Relatório da proposta'})).toBeTruthy();
  expect(screen.getAllByText('Empresa ativa')).toHaveLength(2);
  fireEvent.click(screen.getByRole('button',{name:'Fechar relatório'}));
  expect(screen.queryByRole('dialog')).toBeNull();
});
const client = { id: 'client-a', name: 'Cliente A', type: 'client' as const };
const proposal: Proposal = { id: 'p1', title: 'Projeto A', clientId: client.id, amount: 250,
  date: '2026-10-08', status: 'approved', createdAt: 123, description: 'Escopo',
  validUntil: '2026-11-08', items: [{description:'Item',quantity:1,unitPrice:250,total:250}] };

test.each(['draft','sent','approved','rejected','converted'] as const)('opens %s proposals for editing', status => {
  const open = vi.fn();
  const item = {...proposal, status};
  render(<CommercialView proposals={[item]} rentals={[]} contacts={[client]} equipment={[]}
    onOpenProposalModal={open} onDeleteProposal={vi.fn()} onOpenRentalModal={vi.fn()}
    onDeleteRental={vi.fn()} onConvertProposal={vi.fn()} />);
  fireEvent.click(screen.getByRole('button', {name:'Editar proposta Projeto A'}));
  expect(open).toHaveBeenCalledWith(item);
});

test('preserves data and closes only after confirmed update', async () => {
  let confirm!: () => void;
  const save = vi.fn(() => new Promise<void>(resolve => {confirm = resolve;}));
  const close = vi.fn();
  render(<ProposalModal isOpen onClose={close} onSave={save} onSaveClient={vi.fn()} editingProposal={proposal} contacts={[client]} />);
  fireEvent.change(screen.getByDisplayValue('Projeto A'), {target:{value:'Projeto revisado'}});
  fireEvent.click(screen.getByRole('button',{name:'Salvar Alterações'}));
  expect(save).toHaveBeenCalledWith({...proposal,title:'Projeto revisado',notes:'',commercialTerms:undefined,deliveryTime:undefined},proposal.id,proposal);
  expect(close).not.toHaveBeenCalled();
  expect(screen.getByRole('button',{name:'Salvando...'}).matches(':disabled')).toBe(true);
  await act(async () => confirm());
  expect(close).toHaveBeenCalledOnce();
});

test('failed proposal write keeps form and entered values', async () => {
  const close = vi.fn();
  render(<ProposalModal isOpen onClose={close} onSave={vi.fn().mockRejectedValue(new Error('Falha ao salvar'))}
    onSaveClient={vi.fn()} editingProposal={proposal} contacts={[client]} />);
  fireEvent.click(screen.getByRole('button',{name:'Salvar Alterações'}));
  await screen.findByRole('alert');
  expect(close).not.toHaveBeenCalled();
  expect(screen.getByDisplayValue('Projeto A')).toBeTruthy();
});

test('registers a client from header and selects persisted id without resetting proposal', async () => {
  const saveClient = vi.fn().mockResolvedValue({...client,id:'new-client',name:'Novo cliente'});
  const save = vi.fn().mockResolvedValue(undefined);
  render(<ProposalModal isOpen onClose={vi.fn()} onSave={save} onSaveClient={saveClient} editingProposal={proposal} contacts={[client]} />);
  fireEvent.click(screen.getByRole('button',{name:'Cadastrar cliente'}));
  // The proposal title is the first input; the client name is in the second form.
  const clientForm = document.querySelectorAll('form')[1];
  fireEvent.change(clientForm.querySelector('input[type="text"]')!,{target:{value:'Novo cliente'}});
  fireEvent.submit(clientForm);
  await waitFor(() => expect((screen.getByLabelText('Cliente') as HTMLSelectElement).value).toBe('new-client'));
  expect(saveClient).toHaveBeenCalledWith(expect.objectContaining({name:'Novo cliente',type:'client'}));
  expect(screen.getByDisplayValue('Projeto A')).toBeTruthy();
  fireEvent.click(screen.getByRole('button',{name:'Salvar Alterações'}));
  await waitFor(() => expect(save).toHaveBeenCalledWith(expect.objectContaining({clientId:'new-client'}),'p1',proposal));
});

test('canceling client registration preserves the selected client and proposal', () => {
  render(<ProposalModal isOpen onClose={vi.fn()} onSave={vi.fn()} onSaveClient={vi.fn()} editingProposal={proposal} contacts={[client]} />);
  fireEvent.click(screen.getByRole('button',{name:'Cadastrar cliente'}));
  const clientForm = document.querySelectorAll('form')[1];
  fireEvent.click([...clientForm.querySelectorAll('button')].find(b => b.textContent?.includes('Cancelar'))!);
  expect((screen.getByLabelText('Cliente') as HTMLSelectElement).value).toBe(client.id);
  expect(screen.getByDisplayValue('Projeto A')).toBeTruthy();
});

test('client registration failure does not change selection or save the proposal', async () => {
  const save = vi.fn();
  render(<ProposalModal isOpen onClose={vi.fn()} onSave={save} onSaveClient={vi.fn().mockRejectedValue(new Error('Failed to fetch'))}
    editingProposal={proposal} contacts={[client]} />);
  fireEvent.click(screen.getByRole('button',{name:'Cadastrar cliente'}));
  const clientForm = document.querySelectorAll('form')[1];
  fireEvent.change(clientForm.querySelector('input[type="text"]')!,{target:{value:'Novo cliente'}});
  fireEvent.submit(clientForm);
  await screen.findByText(/Verifique a conexão/);
  expect((screen.getByLabelText('Cliente') as HTMLSelectElement).value).toBe(client.id);
  expect(save).not.toHaveBeenCalled();
});

test('new proposal saves against the selected existing client without registering another', async () => {
  const save = vi.fn().mockResolvedValue(undefined);
  const saveClient = vi.fn();
  render(<ProposalModal isOpen onClose={vi.fn()} onSave={save} onSaveClient={saveClient} editingProposal={null} contacts={[client]} />);
  fireEvent.change(screen.getByPlaceholderText('Ex: Projeto Estrutural - Residência Silva'),{target:{value:'Nova proposta'}});
  fireEvent.change(screen.getByLabelText('Cliente'),{target:{value:client.id}});
  fireEvent.click(screen.getByRole('button',{name:'Emitir Proposta'}));
  await waitFor(() => expect(save).toHaveBeenCalledWith(expect.objectContaining({title:'Nova proposta',clientId:client.id,status:'draft'}),undefined,undefined));
  expect(saveClient).not.toHaveBeenCalled();
});
