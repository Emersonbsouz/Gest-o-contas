import { Category } from '../types';

export const DEFAULT_CATEGORIES: Category[] = [
  {
    id: 'cat-alimentacao',
    name: 'Alimentação',
    color: '#f97316', // Laranja
    icon: 'Utensils',
    budgetLimit: 1200,
  },
  {
    id: 'cat-moradia',
    name: 'Moradia & Contas',
    color: '#3b82f6', // Azul
    icon: 'Home',
    budgetLimit: 1800,
  },
  {
    id: 'cat-transporte',
    name: 'Transporte',
    color: '#0284c7', // Sky
    icon: 'Car',
    budgetLimit: 600,
  },
  {
    id: 'cat-saude',
    name: 'Saúde & Farmácia',
    color: '#10b981', // Verde esmeralda
    icon: 'HeartPulse',
    budgetLimit: 400,
  },
  {
    id: 'cat-lazer',
    name: 'Lazer & Entretenimento',
    color: '#8b5cf6', // Roxo
    icon: 'Film',
    budgetLimit: 500,
  },
  {
    id: 'cat-compras',
    name: 'Compras & Vestuário',
    color: '#ec4899', // Rosa
    icon: 'ShoppingBag',
    budgetLimit: 400,
  },
  {
    id: 'cat-educacao',
    name: 'Educação',
    color: '#eab308', // Âmbar
    icon: 'GraduationCap',
    budgetLimit: 350,
  },
  {
    id: 'cat-servicos',
    name: 'Serviços & Assinaturas',
    color: '#14b8a6', // Teal
    icon: 'CreditCard',
    budgetLimit: 250,
  },
  {
    id: 'cat-outros',
    name: 'Outros',
    color: '#64748b', // Cinza pizarra
    icon: 'MoreHorizontal',
    budgetLimit: 300,
  },
];
