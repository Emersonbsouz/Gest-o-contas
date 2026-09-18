import React from 'react';
import {
  ResponsiveContainer,
  BarChart,
  Bar,
  XAxis,
  YAxis,
  Tooltip,
  Legend,
  PieChart,
  Pie,
  Cell,
  CartesianGrid,
} from 'recharts';
import { TrendingUp, PieChart as PieIcon, ArrowDownLeft, ArrowUpRight } from 'lucide-react';
import { TreasuryAccount, Income, Expense } from '../types';
import { formatCurrency } from '../utils/formatters';
import {
  getTreasuryCashflowHistory,
  getAccountDistributionData,
} from '../utils/treasuryHelpers';

interface TreasuryChartsProps {
  accounts: TreasuryAccount[];
  incomes: Income[];
  expenses: Expense[];
  currentYearMonth: string;
  balances: Record<string, number>;
}

export const TreasuryCharts: React.FC<TreasuryChartsProps> = ({
  accounts = [],
  incomes = [],
  expenses = [],
  currentYearMonth,
  balances = {},
}) => {
  const cashflowData = getTreasuryCashflowHistory(incomes, expenses, currentYearMonth, 6);
  const accountDistribution = getAccountDistributionData(accounts, balances);

  const totalPositiveBalances = accountDistribution.reduce((acc, curr) => acc + curr.balance, 0);

  return (
    <div className="grid grid-cols-1 lg:grid-cols-12 gap-5 mb-6">
      {/* 6-Month Cash Flow Bar Chart */}
      <div className="lg:col-span-7 bg-white rounded-xl p-5 border border-slate-200/80 shadow-xs flex flex-col">
        <div className="flex items-center justify-between mb-4">
          <div className="flex items-center gap-2">
            <div className="w-8 h-8 rounded-lg bg-indigo-50 text-indigo-600 flex items-center justify-center">
              <TrendingUp className="w-4 h-4" />
            </div>
            <div>
              <h3 className="text-sm font-bold text-slate-900">
                Fluxo de Caixa dos Últimos 6 Meses
              </h3>
              <p className="text-xs text-slate-500">
                Entradas (Receitas) vs Saídas (Despesas) da Tesouraria
              </p>
            </div>
          </div>
        </div>

        <div className="h-64 w-full">
          <ResponsiveContainer width="100%" height="100%">
            <BarChart
              data={cashflowData}
              margin={{ top: 10, right: 10, left: -15, bottom: 0 }}
            >
              <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#f1f5f9" />
              <XAxis
                dataKey="label"
                tick={{ fill: '#64748b', fontSize: 11 }}
                axisLine={{ stroke: '#e2e8f0' }}
                tickLine={false}
              />
              <YAxis
                tick={{ fill: '#64748b', fontSize: 10 }}
                axisLine={false}
                tickLine={false}
                tickFormatter={(val) => `R$${val >= 1000 ? `${(val / 1000).toFixed(0)}k` : val}`}
              />
              <Tooltip
                formatter={(val: unknown, name: unknown) => {
                  const num = typeof val === 'number' ? val : Number(val) || 0;
                  const label = name === 'inflow' ? 'Entradas' : name === 'outflow' ? 'Saídas' : 'Resultado';
                  return [formatCurrency(num), label];
                }}
                contentStyle={{
                  backgroundColor: '#ffffff',
                  borderRadius: '8px',
                  border: '1px solid #e2e8f0',
                  boxShadow: '0 4px 6px -1px rgb(0 0 0 / 0.1)',
                  fontSize: '12px',
                }}
              />
              <Legend
                formatter={(value) => (
                  <span className="text-xs text-slate-600 font-medium">
                    {value === 'inflow' ? 'Entradas (Receitas)' : 'Saídas (Despesas)'}
                  </span>
                )}
                wrapperStyle={{ paddingTop: '10px' }}
              />
              <Bar dataKey="inflow" name="inflow" fill="#10b981" radius={[4, 4, 0, 0]} maxBarSize={32} />
              <Bar dataKey="outflow" name="outflow" fill="#f43f5e" radius={[4, 4, 0, 0]} maxBarSize={32} />
            </BarChart>
          </ResponsiveContainer>
        </div>
      </div>

      {/* Account Balance Distribution Pie Chart */}
      <div className="lg:col-span-5 bg-white rounded-xl p-5 border border-slate-200/80 shadow-xs flex flex-col">
        <div className="flex items-center justify-between mb-4">
          <div className="flex items-center gap-2">
            <div className="w-8 h-8 rounded-lg bg-emerald-50 text-emerald-600 flex items-center justify-center">
              <PieIcon className="w-4 h-4" />
            </div>
            <div>
              <h3 className="text-sm font-bold text-slate-900">
                Distribuição de Saldos por Conta
              </h3>
              <p className="text-xs text-slate-500">
                Onde os recursos da tesouraria estão alocados
              </p>
            </div>
          </div>
        </div>

        {accountDistribution.length === 0 ? (
          <div className="flex-1 flex flex-col items-center justify-center text-slate-400 py-8">
            <p className="text-xs font-medium">Nenhum saldo positivo registrado nas contas.</p>
          </div>
        ) : (
          <div className="flex flex-col sm:flex-row items-center justify-between gap-4 h-64">
            <div className="h-full w-full sm:w-1/2">
              <ResponsiveContainer width="100%" height="100%">
                <PieChart>
                  <Pie
                    data={accountDistribution}
                    dataKey="balance"
                    nameKey="name"
                    cx="50%"
                    cy="50%"
                    innerRadius={45}
                    outerRadius={75}
                    paddingAngle={3}
                  >
                    {accountDistribution.map((entry, idx) => (
                      <Cell key={`cell-${idx}`} fill={entry.color || '#6366f1'} />
                    ))}
                  </Pie>
                  <Tooltip
                    formatter={(val: unknown) => {
                      const num = typeof val === 'number' ? val : Number(val) || 0;
                      return [formatCurrency(num), 'Saldo'];
                    }}
                    contentStyle={{
                      backgroundColor: '#ffffff',
                      borderRadius: '8px',
                      border: '1px solid #e2e8f0',
                      boxShadow: '0 4px 6px -1px rgb(0 0 0 / 0.1)',
                      fontSize: '12px',
                    }}
                  />
                </PieChart>
              </ResponsiveContainer>
            </div>

            <div className="w-full sm:w-1/2 flex flex-col justify-center space-y-2 max-h-56 overflow-y-auto pr-1">
              {accountDistribution.map((acc) => {
                const pct =
                  totalPositiveBalances > 0
                    ? ((acc.balance / totalPositiveBalances) * 100).toFixed(1)
                    : '0';
                return (
                  <div key={acc.id} className="flex items-center justify-between text-xs py-1 border-b border-slate-50">
                    <div className="flex items-center gap-2 min-w-0">
                      <div
                        className="w-2.5 h-2.5 rounded-full shrink-0"
                        style={{ backgroundColor: acc.color }}
                      />
                      <span className="text-slate-700 font-medium truncate">{acc.name}</span>
                    </div>
                    <div className="text-right shrink-0 pl-2">
                      <span className="font-semibold text-slate-900 block">{formatCurrency(acc.rawBalance)}</span>
                      <span className="text-[10px] text-slate-400">{pct}%</span>
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        )}
      </div>
    </div>
  );
};
