import React from 'react';
import {
  Utensils,
  Home,
  Car,
  HeartPulse,
  Film,
  ShoppingBag,
  GraduationCap,
  CreditCard,
  MoreHorizontal,
  Zap,
  Dumbbell,
  Plane,
  Coffee,
  Tv,
  Briefcase,
  Shield,
  Tag,
  Wifi,
  Fuel,
  PawPrint,
  Gift,
} from 'lucide-react';

interface CategoryIconProps {
  name: string;
  className?: string;
}

export const AVAILABLE_ICONS = [
  { name: 'Utensils', label: 'Alimentação' },
  { name: 'Home', label: 'Moradia' },
  { name: 'Car', label: 'Transporte' },
  { name: 'HeartPulse', label: 'Saúde' },
  { name: 'Film', label: 'Lazer & Cinema' },
  { name: 'ShoppingBag', label: 'Compras' },
  { name: 'GraduationCap', label: 'Educação' },
  { name: 'CreditCard', label: 'Cartão / Serviços' },
  { name: 'Zap', label: 'Energia / Contas' },
  { name: 'Wifi', label: 'Internet / Telecom' },
  { name: 'Fuel', label: 'Combustível' },
  { name: 'Coffee', label: 'Café & Lanches' },
  { name: 'Dumbbell', label: 'Academia / Esporte' },
  { name: 'Plane', label: 'Viagens' },
  { name: 'PawPrint', label: 'Pets' },
  { name: 'Gift', label: 'Presentes' },
  { name: 'Briefcase', label: 'Trabalho' },
  { name: 'Tag', label: 'Outros' },
];

export const CategoryIcon: React.FC<CategoryIconProps> = ({ name, className = 'w-4 h-4' }) => {
  switch (name) {
    case 'Utensils':
      return <Utensils className={className} />;
    case 'Home':
      return <Home className={className} />;
    case 'Car':
      return <Car className={className} />;
    case 'HeartPulse':
      return <HeartPulse className={className} />;
    case 'Film':
      return <Film className={className} />;
    case 'ShoppingBag':
      return <ShoppingBag className={className} />;
    case 'GraduationCap':
      return <GraduationCap className={className} />;
    case 'CreditCard':
      return <CreditCard className={className} />;
    case 'Zap':
      return <Zap className={className} />;
    case 'Wifi':
      return <Wifi className={className} />;
    case 'Fuel':
      return <Fuel className={className} />;
    case 'Coffee':
      return <Coffee className={className} />;
    case 'Dumbbell':
      return <Dumbbell className={className} />;
    case 'Plane':
      return <Plane className={className} />;
    case 'PawPrint':
      return <PawPrint className={className} />;
    case 'Gift':
      return <Gift className={className} />;
    case 'Briefcase':
      return <Briefcase className={className} />;
    case 'Shield':
      return <Shield className={className} />;
    case 'Tag':
      return <Tag className={className} />;
    default:
      return <MoreHorizontal className={className} />;
  }
};
