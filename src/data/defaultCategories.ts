import { Category } from '../types';

export const DEFAULT_CATEGORIES: Category[] = [
  {
    id: 'cat-alimentacao',
    name: 'Alimentação',
    color: '#f97316', // Laranja
    icon: 'Utensils',
    type: 'expense',
    budgetLimit: 1200,
  },
  {
    id: 'cat-moradia',
    name: 'Moradia & Contas',
    color: '#3b82f6', // Azul
    icon: 'Home',
    type: 'expense',
    budgetLimit: 1800,
  },
  {
    id: 'cat-transporte',
    name: 'Transporte',
    color: '#0284c7', // Sky
    icon: 'Car',
    type: 'expense',
    budgetLimit: 600,
  },
  {
    id: 'cat-saude',
    name: 'Saúde & Farmácia',
    color: '#10b981', // Verde esmeralda
    icon: 'HeartPulse',
    type: 'expense',
    budgetLimit: 400,
  },
  {
    id: 'cat-lazer',
    name: 'Lazer & Entretenimento',
    color: '#8b5cf6', // Roxo
    icon: 'Film',
    type: 'expense',
    budgetLimit: 500,
  },
  {
    id: 'cat-compras',
    name: 'Compras & Vestuário',
    color: '#ec4899', // Rosa
    icon: 'ShoppingBag',
    type: 'expense',
    budgetLimit: 400,
  },
  {
    id: 'cat-educacao',
    name: 'Educação',
    color: '#eab308', // Âmbar
    icon: 'GraduationCap',
    type: 'expense',
    budgetLimit: 350,
  },
  {
    id: 'cat-servicos',
    name: 'Serviços & Assinaturas',
    color: '#14b8a6', // Teal
    icon: 'CreditCard',
    type: 'expense',
    budgetLimit: 250,
  },
  {
    id: 'cat-outros',
    name: 'Outros',
    color: '#64748b', // Cinza pizarra
    icon: 'MoreHorizontal',
    type: 'expense',
    budgetLimit: 300,
  },
  // Categorias de Receita
  {
    id: 'cat-salario',
    name: 'Salário & Proventos',
    color: '#10b981',
    icon: 'Briefcase',
    type: 'income',
  },
  {
    id: 'cat-vendas',
    name: 'Vendas & Comissões',
    color: '#06b6d4',
    icon: 'DollarSign',
    type: 'income',
  },
  {
    id: 'cat-investimentos',
    name: 'Rendimentos & Investimentos',
    color: '#8b5cf6',
    icon: 'TrendingUp',
    type: 'income',
  },
  {
    id: 'cat-extra',
    name: 'Renda Extra / Freelance',
    color: '#f59e0b',
    icon: 'Sparkles',
    type: 'income',
  },
];
