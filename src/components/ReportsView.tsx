import React, { useState, useMemo } from 'react';
import {
  TrendingUp,
  TrendingDown,
  ArrowUpRight,
  ArrowDownLeft,
  Calendar,
  Filter,
  Download,
  BarChart3,
  PieChart as PieChartIcon,
  Search,
  ChevronLeft,
  ChevronRight,
  FilterX,
  Target,
  Clock,
  CheckCircle2,
  AlertCircle
} from 'lucide-react';
import {
  Expense,
  Income,
  Category,
  TreasuryAccount,
  PaymentStatus
} from '../types';
import {
  formatCurrency,
  formatDateBR,
  formatMonthYearLabel,
  getRelativeMonth
} from '../utils/formatters';
import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  PieChart,
  Pie,
  Cell,
  Legend
} from 'recharts';

interface ReportsViewProps {
  expenses: Expense[];
  incomes: Income[];
  categories: Category[];
  accounts: TreasuryAccount[];
  selectedMonth: string;
  onMonthChange: (month: string) => void;
}

export const ReportsView: React.FC<ReportsViewProps> = ({
  expenses = [],
  incomes = [],
  categories = [],
  accounts = [],
  selectedMonth,
  onMonthChange,
}) => {
  const [reportType, setReportType] = useState<'monthly' | 'categories' | 'status'>('monthly');
  const [searchTerm, setSearchTerm] = useState('');

  const activeMonth = selectedMonth || new Date().toISOString().slice(0, 7);

  // Filtered data for the active month
  const monthExpenses = useMemo(() => 
    expenses.filter(e => e.date.startsWith(activeMonth)),
    [expenses, activeMonth]
  );

  const monthIncomes = useMemo(() => 
    incomes.filter(i => i.date.startsWith(activeMonth)),
    [incomes, activeMonth]
  );

  // Totals
  const totalExpenses = monthExpenses.reduce((acc, curr) => acc + curr.amount, 0);
  const totalIncomes = monthIncomes.reduce((acc, curr) => acc + curr.amount, 0);
  const netResult = totalIncomes - totalExpenses;

  // Category Distribution
  const categoryData = useMemo(() => {
    const expenseCats = categories.filter(c => c.type === 'expense');
    const data = expenseCats.map(cat => {
      const amount = monthExpenses
        .filter(e => e.categoryId === cat.id)
        .reduce((sum, e) => sum + e.amount, 0);
      return {
        name: cat.name,
        value: amount,
        color: cat.color
      };
    }).filter(d => d.value > 0)
      .sort((a, b) => b.value - a.value);
    
    return data;
  }, [monthExpenses, categories]);

  // Status Distribution
  const statusData = useMemo(() => {
    const statusCounts = {
      paid: monthExpenses.filter(e => e.status === 'paid').reduce((sum, e) => sum + e.amount, 0),
      liquidated: monthExpenses.filter(e => e.status === 'liquidated').reduce((sum, e) => sum + e.amount, 0),
      pending: monthExpenses.filter(e => e.status === 'pending').reduce((sum, e) => sum + e.amount, 0),
    };

    return [
      { name: 'Liquidado', value: statusCounts.liquidated + statusCounts.paid, color: '#10b981' },
      { name: 'Aberto', value: statusCounts.pending, color: '#f59e0b' },
    ].filter(d => d.value > 0);
  }, [monthExpenses]);

  const handleExportCSV = () => {
    const headers = ['Data', 'Tipo', 'Descrição', 'Categoria', 'Valor (R$)', 'Situação'];
    const data = [
      ...monthIncomes.map(i => [i.date, 'Receita', i.description, categories.find(c => c.id === i.categoryId)?.name || '', i.amount.toFixed(2), i.status || 'Pago']),
      ...monthExpenses.map(e => [e.date, 'Despesa', e.description, categories.find(c => c.id === e.categoryId)?.name || '', (-e.amount).toFixed(2), e.status || 'Pago'])
    ];

    const csvContent = 'data:text/csv;charset=utf-8,' + [headers.join(','), ...data.map(e => e.join(','))].join('\n');
    const encodedUri = encodeURI(csvContent);
    const link = document.createElement('a');
    link.setAttribute('href', encodedUri);
    link.setAttribute('download', `relatorio_financeiro_${activeMonth}.csv`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  return (
    <div className="space-y-6">
      {/* Header & Month Selector */}
      <div className="flex flex-col md:flex-row items-start md:items-center justify-between gap-4 bg-white p-5 rounded-2xl border border-slate-200 shadow-xs">
        <div>
          <h2 className="text-lg font-bold text-slate-900 flex items-center gap-2">
            <BarChart3 className="w-5 h-5 text-indigo-600" />
            Relatórios de Despesas e Receitas
          </h2>
          <p className="text-xs text-slate-500">Acompanhamento detalhado do seu desempenho financeiro</p>
        </div>

        <div className="flex items-center gap-2">
          <div className="flex items-center bg-slate-100 rounded-xl p-1 border border-slate-200">
            <button
              onClick={() => onMonthChange(getRelativeMonth(activeMonth, -1))}
              className="p-1.5 rounded-lg hover:bg-white text-slate-600 hover:text-slate-900 transition-all"
            >
              <ChevronLeft className="w-4 h-4" />
            </button>
            <div className="px-3 flex items-center gap-2 text-xs font-bold text-slate-800 min-w-[120px] justify-center">
              <Calendar className="w-3.5 h-3.5 text-indigo-600" />
              {formatMonthYearLabel(activeMonth)}
            </div>
            <button
              onClick={() => onMonthChange(getRelativeMonth(activeMonth, 1))}
              className="p-1.5 rounded-lg hover:bg-white text-slate-600 hover:text-slate-900 transition-all"
            >
              <ChevronRight className="w-4 h-4" />
            </button>
          </div>

          <button
            onClick={handleExportCSV}
            className="inline-flex items-center gap-1.5 px-4 py-2 bg-white hover:bg-slate-50 text-slate-700 border border-slate-200 rounded-xl text-xs font-bold transition-all shadow-2xs"
          >
            <Download className="w-4 h-4 text-slate-400" />
            Exportar Relatório
          </button>
        </div>
      </div>

      {/* Summary Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        <div className="bg-white p-5 rounded-2xl border border-slate-200 shadow-xs">
          <div className="flex items-center justify-between mb-2">
            <span className="text-xs font-semibold text-slate-500 uppercase tracking-wider">Total de Receitas</span>
            <div className="w-8 h-8 rounded-lg bg-emerald-50 text-emerald-600 flex items-center justify-center">
              <TrendingUp className="w-4 h-4" />
            </div>
          </div>
          <div className="text-2xl font-black text-emerald-600">
            {formatCurrency(totalIncomes)}
          </div>
          <div className="mt-1 text-[10px] text-slate-400 font-medium">
            {monthIncomes.length} lançamentos de entrada
          </div>
        </div>

        <div className="bg-white p-5 rounded-2xl border border-slate-200 shadow-xs">
          <div className="flex items-center justify-between mb-2">
            <span className="text-xs font-semibold text-slate-500 uppercase tracking-wider">Total de Despesas</span>
            <div className="w-8 h-8 rounded-lg bg-rose-50 text-rose-600 flex items-center justify-center">
              <TrendingDown className="w-4 h-4" />
            </div>
          </div>
          <div className="text-2xl font-black text-rose-600">
            {formatCurrency(totalExpenses)}
          </div>
          <div className="mt-1 text-[10px] text-slate-400 font-medium">
            {monthExpenses.length} lançamentos de saída
          </div>
        </div>

        <div className="bg-white p-5 rounded-2xl border border-slate-200 shadow-xs">
          <div className="flex items-center justify-between mb-2">
            <span className="text-xs font-semibold text-slate-500 uppercase tracking-wider">Saldo do Período</span>
            <div className={`w-8 h-8 rounded-lg flex items-center justify-center ${netResult >= 0 ? 'bg-indigo-50 text-indigo-600' : 'bg-rose-50 text-rose-600'}`}>
              <PieChartIcon className="w-4 h-4" />
            </div>
          </div>
          <div className={`text-2xl font-black ${netResult >= 0 ? 'text-indigo-600' : 'text-rose-600'}`}>
            {formatCurrency(netResult)}
          </div>
          <div className="mt-1 flex items-center gap-1.5">
            <span className={`text-[10px] font-bold px-2 py-0.5 rounded-full ${netResult >= 0 ? 'bg-emerald-100 text-emerald-700' : 'bg-rose-100 text-rose-700'}`}>
              {netResult >= 0 ? 'Superávit' : 'Déficit'}
            </span>
          </div>
        </div>
      </div>

      {/* Main Charts & Table */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
        {/* Left Column: Visualizations */}
        <div className="lg:col-span-8 space-y-6">
          <div className="bg-white p-6 rounded-2xl border border-slate-200 shadow-xs">
            <div className="flex items-center justify-between mb-6">
              <h3 className="text-sm font-bold text-slate-900 flex items-center gap-2">
                <BarChart3 className="w-4 h-4 text-indigo-600" />
                Análise Visual
              </h3>
              <div className="flex bg-slate-100 p-1 rounded-xl">
                <button
                  onClick={() => setReportType('monthly')}
                  className={`px-3 py-1 text-[10px] font-bold rounded-lg transition-all ${reportType === 'monthly' ? 'bg-white text-indigo-600 shadow-xs' : 'text-slate-500'}`}
                >
                  Comparativo
                </button>
                <button
                  onClick={() => setReportType('categories')}
                  className={`px-3 py-1 text-[10px] font-bold rounded-lg transition-all ${reportType === 'categories' ? 'bg-white text-indigo-600 shadow-xs' : 'text-slate-500'}`}
                >
                  Categorias
                </button>
                <button
                  onClick={() => setReportType('status')}
                  className={`px-3 py-1 text-[10px] font-bold rounded-lg transition-all ${reportType === 'status' ? 'bg-white text-indigo-600 shadow-xs' : 'text-slate-500'}`}
                >
                  Situação
                </button>
              </div>
            </div>

            <div className="h-[300px] w-full">
              <ResponsiveContainer width="100%" height="100%">
                {reportType === 'monthly' ? (
                  <BarChart data={[{ name: formatMonthYearLabel(activeMonth), entradas: totalIncomes, saídas: totalExpenses }]}>
                    <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#f1f5f9" />
                    <XAxis dataKey="name" axisLine={false} tickLine={false} tick={{ fontSize: 10, fontWeight: 600, fill: '#64748b' }} />
                    <YAxis axisLine={false} tickLine={false} tick={{ fontSize: 10, fill: '#94a3b8' }} tickFormatter={(v) => `R$ ${v}`} />
                    <Tooltip 
                      contentStyle={{ borderRadius: '12px', border: 'none', boxShadow: '0 4px 6px -1px rgb(0 0 0 / 0.1)' }}
                      formatter={(value: number) => [formatCurrency(value), '']}
                    />
                    <Legend iconType="circle" wrapperStyle={{ fontSize: 10, fontWeight: 600, paddingTop: 20 }} />
                    <Bar dataKey="entradas" fill="#10b981" radius={[4, 4, 0, 0]} barSize={40} />
                    <Bar dataKey="saídas" fill="#f43f5e" radius={[4, 4, 0, 0]} barSize={40} />
                  </BarChart>
                ) : reportType === 'categories' ? (
                  categoryData.length > 0 ? (
                    <PieChart>
                      <Pie
                        data={categoryData}
                        cx="50%"
                        cy="50%"
                        innerRadius={60}
                        outerRadius={100}
                        paddingAngle={5}
                        dataKey="value"
                      >
                        {categoryData.map((entry, index) => (
                          <Cell key={`cell-${index}`} fill={entry.color} />
                        ))}
                      </Pie>
                      <Tooltip formatter={(value: number) => formatCurrency(value)} />
                      <Legend iconType="circle" wrapperStyle={{ fontSize: 10, fontWeight: 600 }} />
                    </PieChart>
                  ) : (
                    <div className="h-full flex flex-col items-center justify-center text-slate-400">
                      <FilterX className="w-10 h-10 mb-2 opacity-20" />
                      <p className="text-xs">Sem dados para exibir este gráfico</p>
                    </div>
                  )
                ) : (
                  <PieChart>
                    <Pie
                      data={statusData}
                      cx="50%"
                      cy="50%"
                      innerRadius={60}
                      outerRadius={100}
                      paddingAngle={5}
                      dataKey="value"
                    >
                      {statusData.map((entry, index) => (
                        <Cell key={`cell-${index}`} fill={entry.color} />
                      ))}
                    </Pie>
                    <Tooltip formatter={(value: number) => formatCurrency(value)} />
                    <Legend iconType="circle" wrapperStyle={{ fontSize: 10, fontWeight: 600 }} />
                  </PieChart>
                )}
              </ResponsiveContainer>
            </div>
          </div>

          {/* List of Transactions */}
          <div className="bg-white rounded-2xl border border-slate-200 shadow-xs overflow-hidden">
            <div className="p-5 border-b border-slate-100 flex items-center justify-between">
              <h3 className="text-sm font-bold text-slate-900">Extrato Detalhado do Relatório</h3>
              <div className="relative w-full max-w-[200px]">
                <Search className="w-3.5 h-3.5 absolute left-3 top-2.5 text-slate-400" />
                <input
                  type="text"
                  placeholder="Filtrar lançamentos..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  className="w-full pl-9 pr-3 py-2 border border-slate-200 rounded-xl text-[11px] focus:outline-none focus:ring-2 focus:ring-indigo-500/20"
                />
              </div>
            </div>
            
            <div className="overflow-x-auto">
              <table className="w-full text-left text-xs border-collapse">
                <thead>
                  <tr className="bg-slate-50/50 text-slate-500 font-bold border-b border-slate-100">
                    <th className="py-3 px-4">Data</th>
                    <th className="py-3 px-4">Descrição</th>
                    <th className="py-3 px-4">Categoria</th>
                    <th className="py-3 px-4 text-right">Valor</th>
                    <th className="py-3 px-4 text-center">Situação</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-50">
                  {[...monthIncomes, ...monthExpenses]
                    .filter(item => 
                      item.description.toLowerCase().includes(searchTerm.toLowerCase()) ||
                      categories.find(c => c.id === item.categoryId)?.name.toLowerCase().includes(searchTerm.toLowerCase())
                    )
                    .sort((a, b) => b.date.localeCompare(a.date))
                    .map((item) => {
                      const isIncome = incomes.some(i => i.id === item.id);
                      const cat = categories.find(c => c.id === item.categoryId);
                      const status = item.status || 'paid';

                      return (
                        <tr key={item.id} className="hover:bg-slate-50/50 transition-colors">
                          <td className="py-3 px-4 font-medium text-slate-500">{formatDateBR(item.date)}</td>
                          <td className="py-3 px-4">
                            <span className="font-bold text-slate-800">{item.description}</span>
                          </td>
                          <td className="py-3 px-4">
                            <span className="inline-flex items-center gap-1.5 px-2 py-0.5 rounded-md bg-slate-100 text-slate-600 font-semibold text-[10px]">
                              {cat?.name || 'Geral'}
                            </span>
                          </td>
                          <td className={`py-3 px-4 text-right font-black ${isIncome ? 'text-emerald-600' : 'text-rose-600'}`}>
                            {isIncome ? '+' : '-'}{formatCurrency(item.amount)}
                          </td>
                          <td className="py-3 px-4 text-center">
                            {(status === 'paid' || status === 'liquidated') && (
                              <span className="inline-flex items-center gap-1 text-[9px] font-bold text-emerald-700 bg-emerald-50 px-2 py-0.5 rounded-full border border-emerald-100">
                                <CheckCircle2 className="w-2.5 h-2.5" /> Liquidado
                              </span>
                            )}
                            {status === 'pending' && (
                              <span className="inline-flex items-center gap-1 text-[9px] font-bold text-amber-700 bg-amber-50 px-2 py-0.5 rounded-full border border-amber-100">
                                <Clock className="w-2.5 h-2.5" /> Aberto
                              </span>
                            )}
                          </td>
                        </tr>
                      );
                    })}
                </tbody>
              </table>
            </div>
          </div>
        </div>

        {/* Right Column: Insights & Stats */}
        <div className="lg:col-span-4 space-y-6">
          {/* Top Categories Card */}
          <div className="bg-white p-5 rounded-2xl border border-slate-200 shadow-xs">
            <h3 className="text-sm font-bold text-slate-900 mb-4 flex items-center gap-2">
              <Target className="w-4 h-4 text-rose-500" />
              Maiores Gastos
            </h3>
            <div className="space-y-4">
              {categoryData.slice(0, 5).map((cat, idx) => (
                <div key={idx}>
                  <div className="flex items-center justify-between text-xs mb-1.5">
                    <span className="font-bold text-slate-700">{cat.name}</span>
                    <span className="font-black text-slate-900">{formatCurrency(cat.value)}</span>
                  </div>
                  <div className="w-full h-2 bg-slate-100 rounded-full overflow-hidden">
                    <div 
                      className="h-full rounded-full transition-all duration-1000"
                      style={{ 
                        width: `${(cat.value / totalExpenses) * 100}%`,
                        backgroundColor: cat.color
                      }}
                    />
                  </div>
                </div>
              ))}
              {categoryData.length === 0 && (
                <p className="text-xs text-slate-400 text-center py-4 italic">Nenhuma despesa este mês</p>
              )}
            </div>
          </div>

          {/* Pending Items Card */}
          <div className="bg-white p-5 rounded-2xl border border-slate-200 shadow-xs">
            <h3 className="text-sm font-bold text-slate-900 mb-4 flex items-center gap-2">
              <Clock className="w-4 h-4 text-amber-500" />
              Pendências do Período
            </h3>
            <div className="space-y-3">
              {[...monthIncomes, ...monthExpenses]
                .filter(i => i.status === 'pending')
                .slice(0, 5)
                .map((item) => {
                  const isIncome = incomes.some(i => i.id === item.id);
                  return (
                    <div key={item.id} className="flex items-center justify-between p-2 rounded-xl bg-slate-50 border border-slate-100">
                      <div className="min-w-0">
                        <span className="text-[11px] font-bold text-slate-800 block truncate">{item.description}</span>
                        <span className="text-[10px] text-slate-400">{formatDateBR(item.date)}</span>
                      </div>
                      <span className={`text-[11px] font-black shrink-0 ${isIncome ? 'text-emerald-600' : 'text-rose-600'}`}>
                        {formatCurrency(item.amount)}
                      </span>
                    </div>
                  );
                })}
              {[...monthIncomes, ...monthExpenses].filter(i => i.status === 'pending').length === 0 && (
                <div className="flex flex-col items-center justify-center py-4 text-center">
                  <CheckCircle2 className="w-8 h-8 text-emerald-100 mb-2" />
                  <p className="text-[11px] text-slate-400">Tudo em dia! Nenhuma pendência.</p>
                </div>
              )}
            </div>
          </div>

          {/* Financial Health Tip */}
          <div className="bg-indigo-600 p-5 rounded-2xl text-white shadow-lg shadow-indigo-200">
            <div className="flex items-center gap-2 mb-2">
              <Sparkles className="w-4 h-4 text-indigo-200" />
              <span className="text-xs font-bold uppercase tracking-wider text-indigo-100">Dica Financeira</span>
            </div>
            <p className="text-xs leading-relaxed font-medium">
              {netResult >= 0 
                ? "Parabéns! Você está com superávit este mês. Considere aportar o excedente em suas metas financeiras na aba de cadastros."
                : "Atenção: Suas despesas superaram suas receitas este mês. Revise suas categorias de maiores gastos para identificar onde economizar."}
            </p>
          </div>
        </div>
      </div>
    </div>
  );
};

const Sparkles = ({ className }: { className?: string }) => (
  <svg className={className} xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="m12 3-1.912 5.813a2 2 0 0 1-1.275 1.275L3 12l5.813 1.912a2 2 0 0 1 1.275 1.275L12 21l1.912-5.813a2 2 0 0 1 1.275-1.275L21 12l-5.813-1.912a2 2 0 0 1-1.275-1.275L12 3Z"/><path d="M5 3v4"/><path d="M19 17v4"/><path d="M3 5h4"/><path d="M17 19h4"/></svg>
);
