import { beforeEach, expect, test, vi } from 'vitest';
import { createExpenseInstallments, updateCompanyDoc } from './companyService';

const db = vi.hoisted(() => ({from:vi.fn(),insert:vi.fn(),update:vi.fn(),eq:vi.fn(),select:vi.fn()}));
vi.mock('../lib/supabase',() => ({supabase:{from:db.from}}));
beforeEach(() => {
  vi.clearAllMocks();
  db.from.mockReturnValue(db); db.update.mockReturnValue(db); db.eq.mockReturnValue(db);
});

test('updates only original proposal payload in the active company and confirms affected row', async () => {
  db.select.mockResolvedValue({data:[{doc_id:'p1'}],error:null});
  const original = {id:'p1',title:'Original'};
  const updated = {...original,title:'Revisada'};
  await updateCompanyDoc('company-a','proposals','p1',updated,original);
  expect(db.from).toHaveBeenCalledWith('company_documents');
  expect(db.eq.mock.calls).toEqual([['company_id','company-a'],['collection_name','proposals'],['doc_id','p1'],['payload',JSON.stringify(original)]]);
  expect(db.update).toHaveBeenCalledWith({payload:updated,updated_at:expect.any(String)});
});

test('zero affected rows is a conflict, deletion or missing permission, never successful save', async () => {
  db.select.mockResolvedValue({data:[],error:null});
  await expect(updateCompanyDoc('company-a','proposals','p1',{},{})).rejects.toThrow('alterada ou excluída');
});

test('server errors propagate to the form', async () => {
  db.select.mockResolvedValue({data:null,error:{code:'42501',message:'permission denied'}});
  await expect(updateCompanyDoc('company-a','proposals','p1',{},{})).rejects.toMatchObject({code:'42501'});
});

test('expense updates target the same document and company and reject zero affected rows', async () => {
  const original = {id:'e1',description:'Conta antiga',createdAt:123};
  db.select.mockResolvedValueOnce({data:[{doc_id:'e1'}],error:null});
  await updateCompanyDoc('company-a','expenses','e1',{...original,description:'Revisada'},original);
  expect(db.eq.mock.calls).toEqual([['company_id','company-a'],['collection_name','expenses'],['doc_id','e1'],['payload',JSON.stringify(original)]]);
  db.select.mockResolvedValueOnce({data:[],error:null});
  await expect(updateCompanyDoc('company-a','expenses','e1',{},original)).rejects.toThrow('Esta despesa');
});

test('all expense installments are inserted together, without overwriting existing records', async () => {
  db.insert.mockResolvedValueOnce({error:null});
  const items=[{id:'a',amount:50},{id:'b',amount:50}];
  await createExpenseInstallments('company-a',items);
  expect(db.insert).toHaveBeenCalledTimes(1);
  expect(db.insert).toHaveBeenCalledWith(items.map(item=>({company_id:'company-a',collection_name:'expenses',doc_id:item.id,payload:item})));
  db.insert.mockResolvedValueOnce({error:{message:'permission denied'}});
  await expect(createExpenseInstallments('company-a',items)).rejects.toMatchObject({message:'permission denied'});
});
