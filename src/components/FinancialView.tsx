import React, { useState } from 'react';
import { 
  TrendingDown, 
  TrendingUp, 
  Landmark, 
  ArrowDownLeft, 
  ArrowRightLeft,
  Plus
} from 'lucide-react';
import { 
  Expense, 
  Income, 
  TreasuryAccount, 
  AccountTransfer, 
  Category,
  CreditCard,
  ContactPerson,
  CostCenter
} from '../types';
import { TreasuryView } from './TreasuryView';
import { ExpenseList } from './ExpenseList';
import { IncomeList } from './IncomeList';

interface FinancialViewProps {
  expenses: Expense[];
  incomes: Income[];
  accounts: TreasuryAccount[];
  transfers: AccountTransfer[];
  categories: Category[];
  cards: CreditCard[];
  contacts: ContactPerson[];
  costCenters: CostCenter[];
  currentYearMonth: string;
  onMonthChange: (ym: string) => void;
  onOpenExpenseModal: () => void;
  onOpenIncomeModal: () => void;
  onOpenTransferModal: () => void;
  onEditExpense: (e: Expense) => void;
  onDeleteExpense: (id: string) => void;
  onEditIncome: (i: Income) => void;
  onDeleteIncome: (id: string) => void;
  onEditTransfer: (t: AccountTransfer) => void;
  onDeleteTransfer: (id: string) => void;
  onLiquidateExpense: (e: Expense) => void;
  onLiquidateIncome: (i: Income) => void;
  onOpenAccountModal: (acc?: TreasuryAccount) => void;
  onDeleteAccount: (id: string) => void;
}

export const FinancialView: React.FC<FinancialViewProps> = ({
  expenses,
  incomes,
  accounts,
  transfers,
  categories,
  cards,
  contacts,
  costCenters,
  currentYearMonth,
  onMonthChange,
  onOpenExpenseModal,
  onOpenIncomeModal,
  onOpenTransferModal,
  onEditExpense,
  onDeleteExpense,
  onEditIncome,
  onDeleteIncome,
  onEditTransfer,
  onDeleteTransfer,
  onLiquidateExpense,
  onLiquidateIncome,
  onOpenAccountModal,
  onDeleteAccount
}) => {
  const [subTab, setSubTab] = useState<'pagar' | 'receber' | 'tesouraria'>('tesouraria');

  return (
    <div className="space-y-6 animate-in fade-in duration-500">
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <h2 className="text-2xl font-bold text-slate-900">Gestão Financeira</h2>
          <p className="text-slate-500 text-sm">Operação diária, contas e tesouraria.</p>
        </div>
        
        <div className="flex items-center bg-slate-100 p-1 rounded-xl border border-slate-200">
          <button
            onClick={() => setSubTab('tesouraria')}
            className={`flex items-center gap-2 px-4 py-2 rounded-lg text-xs font-bold transition-all ${
              subTab === 'tesouraria' ? 'bg-white text-indigo-700 shadow-sm' : 'text-slate-500 hover:text-slate-700'
            }`}
          >
            <Landmark className="w-3.5 h-3.5" />
            Tesouraria
          </button>
          <button
            onClick={() => setSubTab('pagar')}
            className={`flex items-center gap-2 px-4 py-2 rounded-lg text-xs font-bold transition-all ${
              subTab === 'pagar' ? 'bg-white text-rose-700 shadow-sm' : 'text-slate-500 hover:text-slate-700'
            }`}
          >
            <TrendingDown className="w-3.5 h-3.5" />
            Contas a Pagar
          </button>
          <button
            onClick={() => setSubTab('receber')}
            className={`flex items-center gap-2 px-4 py-2 rounded-lg text-xs font-bold transition-all ${
              subTab === 'receber' ? 'bg-white text-emerald-700 shadow-sm' : 'text-slate-500 hover:text-slate-700'
            }`}
          >
            <TrendingUp className="w-3.5 h-3.5" />
            Contas a Receber
          </button>
        </div>
      </div>

      {subTab === 'tesouraria' && (
        <TreasuryView
          accounts={accounts}
          incomes={incomes}
          expenses={expenses}
          transfers={transfers}
          categories={categories}
          selectedMonth={currentYearMonth}
          currentYearMonth={currentYearMonth}
          onMonthChange={onMonthChange}
          onOpenAddIncomeModal={onOpenIncomeModal}
          onOpenAddTransferModal={onOpenTransferModal}
          onOpenAccountModal={onOpenAccountModal}
          onDeleteAccount={onDeleteAccount}
          onEditIncome={onEditIncome}
          onDeleteIncome={onDeleteIncome}
          onEditTransfer={onEditTransfer}
          onDeleteTransfer={onDeleteTransfer}
          onEditExpense={onEditExpense}
          onDeleteExpense={onDeleteExpense}
          onOpenExpenseModal={onOpenExpenseModal}
          onLiquidateExpense={onLiquidateExpense}
          onLiquidateIncome={onLiquidateIncome}
        />
      )}

      {subTab === 'pagar' && (
        <div className="space-y-6">
          <div className="flex justify-end">
            <button 
              onClick={onOpenExpenseModal}
              className="flex items-center gap-2 px-4 py-2 bg-rose-600 text-white rounded-xl text-sm font-bold shadow-lg shadow-rose-100"
            >
              <Plus className="w-4 h-4" />
              Lançar Despesa
            </button>
          </div>
          <ExpenseList
            expenses={expenses}
            categories={categories}
            accounts={accounts}
            cards={cards}
            contacts={contacts}
            costCenters={costCenters}
            currentYearMonth={currentYearMonth}
            onEditExpense={onEditExpense}
            onDeleteExpense={onDeleteExpense}
            onOpenAddModal={onOpenExpenseModal}
            onLiquidateExpense={onLiquidateExpense}
          />
        </div>
      )}

      {subTab === 'receber' && (
        <div className="space-y-6">
          <div className="flex justify-end">
            <button 
              onClick={onOpenIncomeModal}
              className="flex items-center gap-2 px-4 py-2 bg-emerald-600 text-white rounded-xl text-sm font-bold shadow-lg shadow-emerald-100"
            >
              <Plus className="w-4 h-4" />
              Lançar Receita
            </button>
          </div>
          <IncomeList
            incomes={incomes}
            categories={categories}
            accounts={accounts}
            contacts={contacts}
            costCenters={costCenters}
            currentYearMonth={currentYearMonth}
            onEditIncome={onEditIncome}
            onDeleteIncome={onDeleteIncome}
            onOpenAddModal={onOpenIncomeModal}
            onLiquidateIncome={onLiquidateIncome}
          />
        </div>
      )}
    </div>
  );
};
