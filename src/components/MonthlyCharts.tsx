import React, { useState } from 'react';
import {
  ResponsiveContainer,
  PieChart,
  Pie,
  Cell,
  Tooltip,
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  AreaChart,
  Area,
} from 'recharts';
import { PieChart as PieIcon, BarChart3, TrendingUp, Layers } from 'lucide-react';
import { Expense, Category } from '../types';
import {
  formatCurrency,
  getCategoryChartData,
  getDailyChartData,
  getHistoricalMonthlyData,
  formatMonthYearLabel,
} from '../utils/formatters';
import { CategoryIcon } from './CategoryIcon';

interface MonthlyChartsProps {
  expenses: Expense[];
  categories: Category[];
  currentYearMonth: string;
}

type ChartViewType = 'category' | 'daily' | 'history';

export const MonthlyCharts: React.FC<MonthlyChartsProps> = ({
  expenses = [],
  categories = [],
  currentYearMonth,
}) => {
  const [activeView, setActiveView] = useState<ChartViewType>('category');

  const categoryData = getCategoryChartData(expenses, categories, currentYearMonth);
  const dailyData = getDailyChartData(expenses, currentYearMonth);
  const historyData = getHistoricalMonthlyData(expenses, currentYearMonth, 6);

  const totalMonth = categoryData.reduce((sum, item) => sum + item.amount, 0);

  // Custom tooltip for Category Pie Chart
  const CustomCategoryTooltip = ({ active, payload }: any) => {
    if (active && Array.isArray(payload) && payload.length > 0 && payload[0]?.payload) {
      const data = payload[0].payload;
      return (
        <div className="bg-slate-900 text-white px-3 py-2 rounded-lg shadow-lg text-xs font-sans">
          <div className="flex items-center gap-2 font-semibold text-sm mb-1">
            <span
              className="w-2.5 h-2.5 rounded-full inline-block"
              style={{ backgroundColor: data.color || '#6366f1' }}
            />
            <span>{data.name || 'Outros'}</span>
          </div>
          <p className="text-slate-200">
            Total: <span className="font-bold text-white">{formatCurrency(data.amount || 0)}</span>
          </p>
          <p className="text-slate-400">
            {data.percentage ?? 0}% do total ({data.count ?? 0} {data.count === 1 ? 'gasto' : 'gastos'})
          </p>
        </div>
      );
    }
    return null;
  };

  // Custom tooltip for Daily Chart
  const CustomDailyTooltip = ({ active, payload, label }: any) => {
    if (active && Array.isArray(payload) && payload.length > 0 && payload[0]) {
      const dailyVal = payload[0].value ?? 0;
      const accumVal = payload[1]?.value;
      return (
        <div className="bg-slate-900 text-white px-3 py-2 rounded-lg shadow-lg text-xs font-sans">
          <p className="font-semibold text-sm text-slate-100 mb-1">{label}</p>
          <p className="text-emerald-400 font-medium">
            Gasto no dia: <span className="font-bold">{formatCurrency(dailyVal)}</span>
          </p>
          {accumVal !== undefined && (
            <p className="text-sky-300">
              Acumulado no mês: <span className="font-bold">{formatCurrency(accumVal)}</span>
            </p>
          )}
        </div>
      );
    }
    return null;
  };

  // Custom tooltip for History Chart
  const CustomHistoryTooltip = ({ active, payload, label }: any) => {
    if (active && Array.isArray(payload) && payload.length > 0 && payload[0]) {
      const item = payload[0].payload || {};
      const val = payload[0].value ?? 0;
      return (
        <div className="bg-slate-900 text-white px-3 py-2 rounded-lg shadow-lg text-xs font-sans">
          <p className="font-semibold text-sm text-slate-100 mb-1">{item.label || label}</p>
          <p className="text-indigo-300 font-bold text-base">
            {formatCurrency(val)}
          </p>
          <p className="text-slate-400">{item.count ?? 0} despesas registradas</p>
        </div>
      );
    }
    return null;
  };

  return (
    <div id="section-monthly-charts" className="bg-white rounded-xl border border-slate-200 p-5 shadow-xs">
      {/* Header with Switcher Tabs */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pb-4 border-b border-slate-100">
        <div>
          <h2 className="text-lg font-bold text-slate-900 flex items-center gap-2">
            <PieIcon className="w-5 h-5 text-indigo-600" />
            Análise Gráfica Mensal
          </h2>
          <p className="text-xs text-slate-500 mt-0.5">
            Gráficos gerados automaticamente para {formatMonthYearLabel(currentYearMonth)}
          </p>
        </div>

        {/* View Switcher buttons */}
        <div className="inline-flex p-1 bg-slate-100 rounded-lg text-xs font-medium self-start sm:self-auto">
          <button
            id="tab-chart-category"
            onClick={() => setActiveView('category')}
            className={`flex items-center gap-1.5 px-3 py-1.5 rounded-md transition-all ${
              activeView === 'category'
                ? 'bg-white text-slate-900 shadow-xs font-semibold'
                : 'text-slate-600 hover:text-slate-900'
            }`}
          >
            <PieIcon className="w-3.5 h-3.5" />
            <span>Por Categoria</span>
          </button>
          <button
            id="tab-chart-daily"
            onClick={() => setActiveView('daily')}
            className={`flex items-center gap-1.5 px-3 py-1.5 rounded-md transition-all ${
              activeView === 'daily'
                ? 'bg-white text-slate-900 shadow-xs font-semibold'
                : 'text-slate-600 hover:text-slate-900'
            }`}
          >
            <BarChart3 className="w-3.5 h-3.5" />
            <span>Evolução Diária</span>
          </button>
          <button
            id="tab-chart-history"
            onClick={() => setActiveView('history')}
            className={`flex items-center gap-1.5 px-3 py-1.5 rounded-md transition-all ${
              activeView === 'history'
                ? 'bg-white text-slate-900 shadow-xs font-semibold'
                : 'text-slate-600 hover:text-slate-900'
            }`}
          >
            <TrendingUp className="w-3.5 h-3.5" />
            <span>Últimos 6 Meses</span>
          </button>
        </div>
      </div>

      {/* Chart Content Area */}
      <div className="pt-4">
        {activeView === 'category' && (
          <div>
            {categoryData.length === 0 ? (
              <div className="h-64 flex flex-col items-center justify-center text-slate-400">
                <Layers className="w-10 h-10 mb-2 stroke-1 text-slate-300" />
                <p className="text-sm font-medium">Nenhum gasto registrado neste mês.</p>
                <p className="text-xs text-slate-400 mt-1">Adicione uma despesa para visualizar o gráfico.</p>
              </div>
            ) : (
              <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-center">
                {/* Donut Chart */}
                <div className="lg:col-span-6 h-64 sm:h-72 relative flex items-center justify-center">
                  <ResponsiveContainer width="100%" height="100%">
                    <PieChart>
                      <Pie
                        data={categoryData}
                        cx="50%"
                        cy="50%"
                        innerRadius={65}
                        outerRadius={95}
                        paddingAngle={3}
                        dataKey="amount"
                      >
                        {categoryData.map((entry) => (
                          <Cell key={`cell-${entry.id}`} fill={entry.color} stroke="#ffffff" strokeWidth={2} />
                        ))}
                      </Pie>
                      <Tooltip content={<CustomCategoryTooltip />} />
                    </PieChart>
                  </ResponsiveContainer>
                  <div className="absolute inset-0 flex flex-col items-center justify-center pointer-events-none">
                    <span className="text-xs text-slate-400 font-medium">Total Gasto</span>
                    <span className="text-lg font-bold text-slate-800">{formatCurrency(totalMonth)}</span>
                  </div>
                </div>

                {/* Categories Breakdown List */}
                <div className="lg:col-span-6 space-y-2.5 max-h-72 overflow-y-auto pr-2">
                  {categoryData.map((item) => (
                    <div
                      key={item.id}
                      className="flex items-center justify-between p-2 rounded-lg hover:bg-slate-50 border border-transparent hover:border-slate-100 transition-colors"
                    >
                      <div className="flex items-center gap-2.5 min-w-0">
                        <div
                          className="w-7 h-7 rounded-md flex items-center justify-center text-white shrink-0"
                          style={{ backgroundColor: item.color }}
                        >
                          <CategoryIcon name={item.icon} className="w-3.5 h-3.5" />
                        </div>
                        <div className="min-w-0">
                          <div className="text-sm font-semibold text-slate-800 truncate">
                            {item.name}
                          </div>
                          <div className="w-24 sm:w-36 bg-slate-100 h-1.5 rounded-full overflow-hidden mt-1">
                            <div
                              className="h-full rounded-full"
                              style={{
                                width: `${item.percentage}%`,
                                backgroundColor: item.color,
                              }}
                            />
                          </div>
                        </div>
                      </div>

                      <div className="text-right shrink-0 pl-2">
                        <div className="text-sm font-bold text-slate-900">
                          {formatCurrency(item.amount)}
                        </div>
                        <div className="text-xs font-medium text-slate-500">
                          {item.percentage}%
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            )}
          </div>
        )}

        {activeView === 'daily' && (
          <div>
            <div className="h-72 w-full">
              <ResponsiveContainer width="100%" height="100%">
                <AreaChart data={dailyData} margin={{ top: 10, right: 10, left: -15, bottom: 0 }}>
                  <defs>
                    <linearGradient id="colorDaily" x1="0" y1="0" x2="0" y2="1">
                      <stop offset="5%" stopColor="#3b82f6" stopOpacity={0.25} />
                      <stop offset="95%" stopColor="#3b82f6" stopOpacity={0.0} />
                    </linearGradient>
                  </defs>
                  <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#e2e8f0" />
                  <XAxis
                    dataKey="shortDay"
                    tick={{ fontSize: 11, fill: '#64748b' }}
                    tickLine={false}
                    axisLine={{ stroke: '#cbd5e1' }}
                  />
                  <YAxis
                    tick={{ fontSize: 11, fill: '#64748b' }}
                    tickLine={false}
                    axisLine={false}
                    tickFormatter={(val) => `R$${val}`}
                  />
                  <Tooltip content={<CustomDailyTooltip />} />
                  <Area
                    type="monotone"
                    dataKey="amount"
                    stroke="#2563eb"
                    strokeWidth={2}
                    fillOpacity={1}
                    fill="url(#colorDaily)"
                    name="Gasto Diário"
                  />
                </AreaChart>
              </ResponsiveContainer>
            </div>
            <p className="text-xs text-slate-400 text-center mt-2">
              Dias do mês no eixo horizontal e valores diários de despesas no eixo vertical
            </p>
          </div>
        )}

        {activeView === 'history' && (
          <div>
            <div className="h-72 w-full">
              <ResponsiveContainer width="100%" height="100%">
                <BarChart data={historyData} margin={{ top: 10, right: 10, left: -15, bottom: 0 }}>
                  <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#e2e8f0" />
                  <XAxis
                    dataKey="label"
                    tick={{ fontSize: 12, fill: '#475569' }}
                    tickLine={false}
                    axisLine={{ stroke: '#cbd5e1' }}
                  />
                  <YAxis
                    tick={{ fontSize: 11, fill: '#64748b' }}
                    tickLine={false}
                    axisLine={false}
                    tickFormatter={(val) => `R$${val}`}
                  />
                  <Tooltip content={<CustomHistoryTooltip />} />
                  <Bar
                    dataKey="total"
                    fill="#6366f1"
                    radius={[6, 6, 0, 0]}
                    name="Total no Mês"
                  />
                </BarChart>
              </ResponsiveContainer>
            </div>
            <p className="text-xs text-slate-400 text-center mt-2">
              Comparativo de gastos totais nos últimos 6 meses para acompanhamento da evolução financeira
            </p>
          </div>
        )}
      </div>
    </div>
  );
};
