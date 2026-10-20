import React, {useState} from 'react';
import {cleanup, fireEvent, render, screen, within} from '@testing-library/react';
import {afterEach, expect, test, vi} from 'vitest';
import {ProjectsView} from './ProjectsView';
import {ReportsView} from './ReportsView';
import type {CostCenter, Expense, Income} from '../types';
vi.mock('recharts',()=>({ResponsiveContainer:({children}:any)=><div>{children}</div>,BarChart:()=>null,Bar:()=>null,XAxis:()=>null,YAxis:()=>null,CartesianGrid:()=>null,Tooltip:()=>null,Legend:()=>null}));
afterEach(cleanup);
const centers:CostCenter[]=[{id:'a',name:'Obra Alfa',clientId:'',status:'active',color:'#123',createdAt:1},{id:'b',name:'Obra Beta',clientId:'',status:'active',color:'#123',createdAt:2}];
const expenses:Expense[]=[{id:'split',description:'Compra rateada',date:'2026-01-01',amount:100,categoryId:'cat',paymentMethod:'pix',status:'paid',createdAt:1,splits:[{id:'s1',amount:40,costCenterId:'a',categoryId:'cat'},{id:'s2',amount:60,costCenterId:'b',categoryId:'cat'}]}, {id:'other',description:'Despesa de outra obra',date:'2026-01-01',amount:200,categoryId:'cat',paymentMethod:'pix',status:'paid',costCenterId:'b',createdAt:1}];
const incomes:Income[]=[{id:'income',accountId:'cash',description:'Receita Alfa',date:'2026-01-01',amount:100,status:'paid',categoryId:'cat',costCenterId:'a',createdAt:1}];
function Harness(){
 const [id,setId]=useState<string|null>(null);
 return id ? <ReportsView expenses={expenses} incomes={incomes} categories={[]} accounts={[]} costCenters={centers} selectedMonth="2026-10" onMonthChange={vi.fn()} initialCostCenterId={id} initialPeriod="all" /> : <ProjectsView costCenters={centers} contacts={[]} onOpenCostCenterModal={vi.fn()} onDeleteCostCenter={vi.fn()} onViewDRE={setId} />;
}
test('Ver DRE opens the selected project report for all history and uses only its allocated expenses',()=>{
 render(<Harness />);
 fireEvent.click(screen.getAllByRole('button',{name:'Ver DRE'})[0]);
 expect(screen.getByRole('heading',{name:'DRE gerencial — Obra Alfa'})).toBeTruthy();
 expect((screen.getByLabelText('Período') as HTMLSelectElement).value).toBe('all');
 expect((screen.getByLabelText('Centro de custo do relatório') as HTMLSelectElement).value).toBe('a');
 expect(screen.getByText('Receita Alfa')).toBeTruthy();
 expect(screen.queryByText('Despesa de outra obra')).toBeNull();
 const row=screen.getByText('Compra rateada').closest('tr')!;
 expect(within(row).getByText(/^R\$\s*40,00$/)).toBeTruthy();
 expect(screen.getByText('Resultado realizado:').textContent).toMatch(/60,00/);
});
test('users without reporting permission cannot use Ver DRE',()=>{
 const open=vi.fn();
 render(<ProjectsView costCenters={centers} contacts={[]} onOpenCostCenterModal={vi.fn()} onDeleteCostCenter={vi.fn()} onViewDRE={open} canViewReports={false} />);
 const button=screen.getAllByRole('button',{name:'Ver DRE'})[0];
 expect((button as HTMLButtonElement).disabled).toBe(true);
 fireEvent.click(button);expect(open).not.toHaveBeenCalled();
});


