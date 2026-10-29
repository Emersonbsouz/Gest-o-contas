import React from 'react';
import {cleanup,fireEvent,render,screen,waitFor,within} from '@testing-library/react';
import {afterEach,expect,test,vi} from 'vitest';
import {RegistriesView} from './RegistriesView';
import {RegistryTable} from './RegistryTable';
afterEach(()=>{cleanup();vi.restoreAllMocks();});
function props():React.ComponentProps<typeof RegistriesView>{return {
 contacts:[{id:'person',name:'Pessoa Alfa',type:'supplier'}],cards:[{id:'card',name:'Cartão Alfa',brand:'visa',limit:1000,closingDay:20,dueDay:28,color:'#123'}],accounts:[{id:'account',name:'Conta Alfa',type:'cash',initialBalance:0,color:'#123'}],categories:[{id:'category',name:'Categoria Alfa',type:'expense',color:'#123',icon:'Tag'}],recurringBills:[{id:'bill',description:'Conta mensal',type:'expense',amount:50,dueDay:10,categoryId:'category',active:true},{id:'subscription',description:'Assinatura Alfa',kind:'subscription',type:'expense',amount:20,dueDay:10,categoryId:'category',active:true}],goals:[{id:'goal',title:'Meta Alfa',targetAmount:100,currentAmount:10,color:'#123'}],equipment:[{id:'equipment',name:'Equipamento Alfa',dailyRate:30,status:'available'}],costCenters:[{id:'center',name:'Centro Alfa',clientId:'',status:'active',color:'#123',createdAt:1}],treasuries:[{id:'treasury',name:'Tesouraria Alfa'}],currentYearMonth:'2026-10',
 onOpenCardModal:vi.fn(),onDeleteCard:vi.fn(),onOpenContactModal:vi.fn(),onDeleteContact:vi.fn(),onOpenRecurringModal:vi.fn(),onDeleteRecurring:vi.fn(),onTriggerRecurringBill:vi.fn(),onOpenGoalModal:vi.fn(),onDeleteGoal:vi.fn(),onUpdateGoalAmount:vi.fn(),onOpenAccountModal:vi.fn(),onDeleteAccount:vi.fn(),onOpenCategoryModal:vi.fn(),onOpenEquipmentModal:vi.fn(),onDeleteEquipment:vi.fn(),onOpenCostCenterModal:vi.fn(),onSaveTreasury:vi.fn().mockResolvedValue(undefined),
};}
test.each([
 ['Cartões (1)','Editar Cartão Alfa','onOpenCardModal','card'],
 ['Contas e Caixas (1)','Editar Conta Alfa','onOpenAccountModal','account'],
 ['Contas Recorrentes (1)','Editar Conta mensal','onOpenRecurringModal','bill'],
 ['Assinaturas (1)','Editar Assinatura Alfa','onOpenRecurringModal','subscription'],
 ['Metas (1)','Editar Meta Alfa','onOpenGoalModal','goal'],
 ['Patrimônio (1)','Editar Equipamento Alfa','onOpenEquipmentModal','equipment'],
 ['Centros de Custo (1)','Editar Centro Alfa','onOpenCostCenterModal','center'],
 ['Clientes e Fornecedores (1)','Editar Pessoa Alfa','onOpenContactModal','person'],
] as const)('%s has an explicit edit action on the correct record',(tab,action,handler,id)=>{
 const p=props();render(<RegistriesView {...p}/>);fireEvent.click(screen.getByRole('button',{name:tab}));expect(screen.getByRole('columnheader',{name:'Ações'})).toBeTruthy();fireEvent.click(screen.getByRole('button',{name:action}));expect(p[handler]).toHaveBeenCalledWith(expect.objectContaining({id}));
});
test('treasury action opens the form, preserving the original treasury identity',async()=>{
 const p=props();render(<RegistriesView {...p}/>);fireEvent.click(screen.getByRole('button',{name:'Tesourarias (1)'}));fireEvent.click(screen.getByRole('button',{name:'Editar Tesouraria Alfa'}));expect((screen.getByLabelText('Nome da tesouraria') as HTMLInputElement).value).toBe('Tesouraria Alfa');fireEvent.change(screen.getByLabelText('Nome da tesouraria'),{target:{value:'Tesouraria Atualizada'}});fireEvent.click(screen.getByRole('button',{name:'Salvar Tesouraria'}));await waitFor(()=>expect(p.onSaveTreasury).toHaveBeenCalledWith(expect.objectContaining({name:'Tesouraria Atualizada'}),'treasury'));
});
test('categories expose management and preserve the existing category workflow',()=>{
 const p=props();render(<RegistriesView {...p}/>);fireEvent.click(screen.getByRole('button',{name:'Categorias (1)'}));fireEvent.click(screen.getByRole('button',{name:'Gerenciar Categoria Alfa'}));expect(p.onOpenCategoryModal).toHaveBeenCalledTimes(1);
});
test('destructive table actions require confirmation and show failed saves',async()=>{
 const remove=vi.fn().mockRejectedValue(new Error('offline'));const confirm=vi.spyOn(window,'confirm').mockReturnValue(false);
 render(<RegistryTable title="Registros" items={[{id:'1',name:'Registro'}]} columns={[{label:'Nome',render:item=>item.name}]} actions={[{label:'Excluir',destructive:true,run:remove}]}/>);
 fireEvent.click(screen.getByRole('button',{name:'Excluir Registro'}));expect(remove).not.toHaveBeenCalled();confirm.mockReturnValue(true);fireEvent.click(screen.getByRole('button',{name:'Excluir Registro'}));await screen.findByRole('alert');expect(remove).toHaveBeenCalledTimes(1);expect(screen.getByText('Registro')).toBeTruthy();
});


test('registry sorting uses Portuguese names, raw currency values and keeps edit actions on their records',()=>{
 const edit=vi.fn();
 const items=[{id:'z',name:'Zebra',value:9},{id:'a',name:'Árvore',value:1000},{id:'b',name:'Beta',value:100}];
 render(<RegistryTable title="Ordenáveis" items={items} columns={[{label:'Nome',render:i=><strong>{i.name}</strong>},{label:'Valor',render:i=>i.value.toLocaleString('pt-BR',{style:'currency',currency:'BRL'}),sortValue:i=>i.value}]} actions={[{label:'Editar',run:edit}]}/>);
 const names=()=>screen.getAllByRole('row').slice(1).map(row=>within(row).getAllByRole('cell')[0].textContent);
 expect(names()).toEqual(['Árvore','Beta','Zebra']);
 fireEvent.change(screen.getByLabelText('Direção da ordenação de Ordenáveis'),{target:{value:'desc'}});
 expect(names()).toEqual(['Zebra','Beta','Árvore']);
 fireEvent.change(screen.getByLabelText('Ordenar Ordenáveis por'),{target:{value:'Valor'}});
 expect(names()).toEqual(['Árvore','Beta','Zebra']);
 fireEvent.change(screen.getByLabelText('Direção da ordenação de Ordenáveis'),{target:{value:'asc'}});
 expect(names()).toEqual(['Zebra','Beta','Árvore']);
 fireEvent.click(screen.getByRole('button',{name:'Editar Beta'}));
 expect(edit).toHaveBeenCalledWith(items[2]);
 expect(items.map(i=>i.id)).toEqual(['z','a','b']);
});

test('contact ordering works together with search and keeps missing emails last',()=>{
 const p=props();p.contacts=[{id:'z',name:'Zebra',type:'supplier',email:'a@example.com'},{id:'a',name:'Árvore',type:'client',email:'z@example.com'},{id:'b',name:'Beta',type:'supplier'}];
 render(<RegistriesView {...p}/>);
 const names=()=>screen.getAllByRole('row').slice(1).map(row=>within(row).getAllByRole('cell')[0].textContent);
 expect(names()[0]).toContain('Árvore');
 fireEvent.change(screen.getByLabelText('Ordenar clientes e fornecedores'),{target:{value:'name_desc'}});
 expect(names()[0]).toContain('Zebra');
 fireEvent.change(screen.getByLabelText('Ordenar clientes e fornecedores'),{target:{value:'email_asc'}});
 expect(names()[0]).toContain('Zebra');expect(names()[2]).toContain('Beta');
 fireEvent.change(screen.getByLabelText('Pesquisar cadastros'),{target:{value:'Árvore'}});
 expect(names()).toHaveLength(1);expect(names()[0]).toContain('Árvore');
});
