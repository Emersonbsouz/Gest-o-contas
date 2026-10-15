
import React from 'react';
import {cleanup,fireEvent,render,screen} from '@testing-library/react';
import {afterEach,expect,test,vi} from 'vitest';
import {RegistriesView} from './RegistriesView';
import {MonitoringView} from './MonitoringView';
import {Sidebar} from './Sidebar';
afterEach(cleanup);
const card={id:'c',name:'Cartão teste',brand:'visa' as const,limit:1000,closingDay:25,dueDay:5,color:'#000'};
const bill={id:'s',description:'Assinatura teste',kind:'subscription' as const,type:'expense' as const,amount:50,dueDay:10,categoryId:'cat',cardId:'c',active:true};
test('registrations show definitions without invoice payment or recurring launch actions',()=>{
 const noop=vi.fn();
 render(<RegistriesView cards={[card]} recurringBills={[bill]} accounts={[]} contacts={[]} categories={[]} equipment={[]} goals={[]} currentYearMonth="2026-10"
 onOpenCardModal={noop} onDeleteCard={noop} onOpenContactModal={noop} onDeleteContact={noop} onOpenRecurringModal={noop} onDeleteRecurring={noop} onTriggerRecurringBill={noop} onOpenGoalModal={noop} onDeleteGoal={noop} onUpdateGoalAmount={noop} onOpenAccountModal={noop} onDeleteAccount={noop} onOpenCategoryModal={noop} onOpenEquipmentModal={noop} onDeleteEquipment={noop}/>);
 fireEvent.click(screen.getByRole('button',{name:'Cartões (1)'}));
 expect(screen.getByText('Cartão teste')).toBeTruthy();
 expect(screen.queryByText('Faturas do cartão')).toBeNull();
 expect(screen.queryByText('Total em aberto no cartão')).toBeNull();
 fireEvent.click(screen.getByRole('button',{name:'Assinaturas (1)'}));
 expect(screen.queryByRole('button',{name:/Lançar no/})).toBeNull();
});
test('monitoring contains invoice and recurring operations',()=>{
 const noop=vi.fn();
 render(<MonitoringView cards={[card]} expenses={[]} incomes={[]} recurring={[bill]} accounts={[]} transfers={[]} payments={[]} contacts={[]} goals={[]} costCenters={[]} month="2026-10" onPay={noop} onTrigger={noop} onUpdateGoal={noop} canEdit/>);
 expect(screen.getByText('Faturas do cartão')).toBeTruthy();
 fireEvent.click(screen.getByRole('button',{name:'Assinaturas e recorrências'}));
 fireEvent.click(screen.getByRole('button',{name:'Lançar no mês 2026-10'}));
 expect(noop).toHaveBeenCalledWith(bill);
});
test('sidebar opens the separate monitoring menu',()=>{
 const nav=vi.fn();
 render(<Sidebar activeView="cadastros" onViewChange={nav} activeCompany={null} onLogout={vi.fn()} cloudSyncStatus="synced"/>);
 fireEvent.click(screen.getByRole('button',{name:'Acompanhamento'}));
 expect(nav).toHaveBeenCalledWith('acompanhamento');
});
