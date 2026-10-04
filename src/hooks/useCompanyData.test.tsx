import { act, cleanup, renderHook } from '@testing-library/react';
import { afterEach, beforeEach, expect, test, vi } from 'vitest';
import { useCompanyData } from './useCompanyData';

const service = vi.hoisted(() => ({ createCompanyDoc: vi.fn(), loadCompanySubcollection: vi.fn(), saveCompanyDoc: vi.fn(), deleteCompanyDoc: vi.fn(),
  subscribeToCompanySubcollection: vi.fn((_company:any,_name:any,_ok:any,_error?:any) => () => {}), clearCompanyData: vi.fn() }));
vi.mock('../services/companyService', () => service);
beforeEach(() => { vi.clearAllMocks(); localStorage.clear(); });
afterEach(cleanup);

test.each(['saveContact','saveCostCenter','saveIncome','saveExpense','saveAccount','saveCard','saveGoal','saveEquipment','addCategory'] as const)(
  '%s rejects instead of pretending to save without an active company', async operation => {
    const { result } = renderHook(() => useCompanyData(null));
    const save = result.current[operation] as (data: unknown) => Promise<unknown>;
    await expect(save({ name: 'Teste' })).rejects.toThrow('Selecione uma empresa');
    expect(service.saveCompanyDoc).not.toHaveBeenCalled();
  });

test('failed supplier registration leaves no local saved entry', async () => {
  service.saveCompanyDoc.mockRejectedValueOnce({code:'42501',message:'permission denied'});
  const { result } = renderHook(() => useCompanyData('company-a'));
  await act(async () => {
    await expect(result.current.saveContact({name:'Fornecedor',type:'supplier'})).rejects.toMatchObject({code:'42501'});
  });
  expect(result.current.contacts).toEqual([]);
  expect(localStorage.getItem('cg_company-a_contacts')).toBeNull();
});

test('supplier registration becomes visible only after the server confirms the write', async () => {
  let confirm: () => void;
  service.saveCompanyDoc.mockImplementationOnce(() => new Promise<void>(resolve => {confirm = resolve;}));
  const { result } = renderHook(() => useCompanyData('company-a'));
  let request: Promise<unknown>;
  act(() => { request = result.current.saveContact({name:'Fornecedor',type:'supplier'}); });
  expect(result.current.contacts).toEqual([]);
  await act(async () => { confirm(); await request; });
  expect(result.current.contacts[0].name).toBe('Fornecedor');
  expect(JSON.parse(localStorage.getItem('cg_company-a_contacts')!)[0].type).toBe('supplier');
});

test('cost center and linked revenue retain their associations', async () => {
  service.saveCompanyDoc.mockResolvedValue(undefined);
  const { result } = renderHook(() => useCompanyData('company-a'));
  await act(async () => {
    const center = await result.current.saveCostCenter({name:'Vendas',clientId:'',status:'active',color:'#123456'});
    await result.current.saveIncome({description:'Venda',amount:250,date:'2026-10-04',categoryId:'sales',accountId:'cash',
      contactId:'client-a',costCenterId:center.id,status:'pending'});
  });
  expect(result.current.incomes[0].contactId).toBe('client-a');
  expect(result.current.incomes[0].costCenterId).toBe(result.current.costCenters[0].id);
});

test('an expense write failure rejects and does not appear as saved', async () => {
  service.saveCompanyDoc.mockRejectedValueOnce(new TypeError('Failed to fetch'));
  const { result } = renderHook(() => useCompanyData('company-a'));
  await act(async () => {
    await expect(result.current.saveExpense({description:'Compra',amount:50,date:'2026-10-04',categoryId:'materials',
      paymentMethod:'transfer',contactId:'supplier-a',costCenterId:'center-a',status:'pending'})).rejects.toThrow('Failed to fetch');
  });
  expect(result.current.expenses).toEqual([]);
  expect(result.current.cloudSyncStatus).toBe('error');
});

test('treasury and cash associations are confirmed on the server and survive a reload', async () => {
  service.saveCompanyDoc.mockResolvedValue(undefined);
  const { result, unmount } = renderHook(() => useCompanyData('company-treasury'));
  let treasuryId = '';
  await act(async () => {
    const treasury = await result.current.saveTreasury({name:'Tesouraria Principal'});
    treasuryId = treasury.id;
    await result.current.saveAccount({name:'Caixa loja',type:'cash',initialBalance:0,color:'#123456',treasuryId});
  });
  expect(service.saveCompanyDoc).toHaveBeenCalledWith('company-treasury','treasuries',treasuryId,expect.objectContaining({name:'Tesouraria Principal'}));
  expect(result.current.accounts[0].treasuryId).toBe(treasuryId);
  unmount();
  const reloaded = renderHook(() => useCompanyData('company-treasury'));
  expect(reloaded.result.current.treasuries[0].id).toBe(treasuryId);
  expect(reloaded.result.current.accounts[0].treasuryId).toBe(treasuryId);
});

test('failed treasury save creates no local phantom registry', async () => {
  service.saveCompanyDoc.mockRejectedValueOnce(new Error('offline'));
  const { result } = renderHook(() => useCompanyData('company-treasury'));
  await act(async () => {await expect(result.current.saveTreasury({name:'Principal'})).rejects.toThrow('offline');});
  expect(result.current.treasuries).toEqual([]);
  expect(localStorage.getItem('cg_company-treasury_treasuries')).toBeNull();
});

test('cash closing reads server movements and inserts a separate document', async () => {
  service.loadCompanySubcollection.mockImplementation(async (_company:string,collection:string) => collection === 'accounts' ? [{id:'cash',name:'Loja',type:'cash',initialBalance:100}] : []);
  service.createCompanyDoc.mockResolvedValue(undefined);
  const {result}=renderHook(()=>useCompanyData('company-a'));
  await act(async()=>{await result.current.saveCashClosing('cash','2026-10-04',100,'owner');});
  expect(service.createCompanyDoc).toHaveBeenCalledWith('company-a','cashClosings','closing-cash-2026-10-04',expect.objectContaining({expectedBalance:100,countedBalance:100,difference:0,closedBy:'owner'}));
  expect(service.saveCompanyDoc).not.toHaveBeenCalled();expect(result.current.cashClosings).toHaveLength(1);
});
test('duplicate cash closing failure saves no local document', async () => {
  service.loadCompanySubcollection.mockImplementation(async (_company:string,collection:string) => collection === 'accounts' ? [{id:'cash',name:'Loja',type:'cash',initialBalance:100}] : []);
  service.createCompanyDoc.mockRejectedValueOnce({code:'23505'});
  const {result}=renderHook(()=>useCompanyData('company-a'));
  await act(async()=>{await expect(result.current.saveCashClosing('cash','2026-10-04',100,'owner')).rejects.toMatchObject({code:'23505'});});
  expect(result.current.cashClosings).toEqual([]);expect(localStorage.getItem('cg_company-a_cashClosings')).toBeNull();
});
test('fresh movements cannot silently change the confirmed closing', async () => {
  service.loadCompanySubcollection.mockImplementation(async (_company:string,collection:string) => collection === 'accounts' ? [{id:'cash',name:'Loja',type:'cash',initialBalance:200}] : []);
  const {result}=renderHook(()=>useCompanyData('company-a'));
  await expect(result.current.saveCashClosing('cash','2026-10-04',100,'owner','', 'old-signature')).rejects.toThrow('movimentos mudaram');
  await expect(result.current.saveCashClosing('cash','2026-02-30',100,'owner')).rejects.toThrow('data válida');
  await expect(result.current.saveCashClosing('cash','2026-10-04',100,'owner')).rejects.toThrow('diferença');
  expect(service.createCompanyDoc).not.toHaveBeenCalled();
});
test('a successful collection read does not hide a failed expenses query', () => {
 const callbacks = new Map<string,{ok:(items:any[])=>void,error:(error:unknown)=>void}>();
 service.subscribeToCompanySubcollection.mockImplementation((_company:any,name:any,ok:any,error:any) => {callbacks.set(name,{ok,error});return ()=>{};});
 const {result}=renderHook(()=>useCompanyData('company-a'));
 act(()=>{callbacks.get('expenses')!.error(new Error('offline'));callbacks.get('accounts')!.ok([]);});
 expect(result.current.cloudSyncStatus).toBe('error');expect(result.current.lastError).toContain('expenses');
 act(()=>callbacks.get('expenses')!.ok([]));expect(result.current.lastError).toBeNull();
});
