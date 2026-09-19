import React, { useState } from 'react';
import { 
  X, Check, DollarSign, ArrowDownLeft, ArrowUpRight, 
  Tag, Users, Calendar, FileText, CreditCard, Wallet, 
  Info, Clock, Plus, LayoutGrid
} from 'lucide-react';
import {
  Category,
  Expense,
  Income,
  PaymentMethod,
  TreasuryAccount,
  CreditCard as CreditCardType,
  ContactPerson,
  PaymentStatus,
  CostCenter,
  TransactionSplit,
} from '../types';
import { PAYMENT_METHOD_LABELS } from '../utils/formatters';
import { CategoryIcon } from './CategoryIcon';

interface FinancialFormModalProps {
  type: 'expense' | 'income';
  isOpen: boolean;
  onClose: () => void;
  onSave: (data: any, id?: string) => void;
  editingItem?: any | null;
  categories: Category[];
  accounts?: TreasuryAccount[];
  cards?: CreditCardType[];
  contacts?: ContactPerson[];
  costCenters?: CostCenter[];
  defaultDate?: string;
}

export const FinancialFormModal: React.FC<FinancialFormModalProps> = ({
  type,
  isOpen,
  onClose,
  onSave,
  editingItem,
  categories = [],
  accounts = [],
  cards = [],
  contacts = [],
  costCenters = [],
  defaultDate,
}) => {
  // State
  const [description, setDescription] = useState('');
  const [amount, setAmount] = useState('');
  const [date, setDate] = useState('');
  const [categoryId, setCategoryId] = useState('');
  const [paymentMethod, setPaymentMethod] = useState<PaymentMethod>(type === 'expense' ? 'credit_card' : 'transfer');
  const [accountId, setAccountId] = useState('');
  const [cardId, setCardId] = useState('');
  const [contactId, setContactId] = useState('');
  const [status, setStatus] = useState<PaymentStatus>('pending');
  const [notes, setNotes] = useState('');
  const [isRecurring, setIsRecurring] = useState(false);
  const [costCenterId, setCostCenterId] = useState('');
  
  // Expense specific
  const [documentNumber, setDocumentNumber] = useState('');
  const [transacao_id_banco, setTransacaoIdBanco] = useState('');
  const [linha_digitavel, setLinhaDigitavel] = useState('');
  const [splits, setSplits] = useState<Omit<TransactionSplit, 'id'>[]>([]);
  const [showSplits, setShowSplits] = useState(false);
  
  // Income specific (Installment Generator)
  const [isInstallment, setIsInstallment] = useState(false);
  const [currentInstallment, setCurrentInstallment] = useState('1');
  const [totalInstallments, setTotalInstallments] = useState('1');
  
  // Billet specific
  const [billetBarcode, setBilletBarcode] = useState('');
  const [billetDigitableLine, setBilletDigitableLine] = useState('');
  const [billetDueDate, setBilletDueDate] = useState('');
  const [billetAssignor, setBilletAssignor] = useState('');

  const [activeStep, setActiveStep] = useState(1);
  const [error, setError] = useState('');
  const [isLoading, setIsLoading] = useState(false);

  const filteredCategories = categories.filter(c => c.type === type);

  React.useEffect(() => {
    if (editingItem) {
      setDescription(editingItem.description);
      setAmount(editingItem.amount.toString());
      setDate(editingItem.date);
      setCategoryId(editingItem.categoryId);
      setPaymentMethod(editingItem.paymentMethod || (type === 'expense' ? 'credit_card' : 'transfer'));
      setAccountId(editingItem.accountId || accounts?.[0]?.id || '');
      setCardId(editingItem.cardId || cards?.[0]?.id || '');
      setContactId(editingItem.contactId || '');
      setStatus(editingItem.status || 'pending');
      setNotes(editingItem.notes || '');
      setIsRecurring(editingItem.isRecurring || false);
      setCostCenterId(editingItem.costCenterId || '');
      setTransacaoIdBanco(editingItem.transacao_id_banco || '');
      setLinhaDigitavel(editingItem.linha_digitavel || '');
      
      if (type === 'expense') {
        setDocumentNumber(editingItem.documentNumber || '');
        setSplits(editingItem.splits || []);
        setShowSplits(editingItem.splits && editingItem.splits.length > 0);
      }

      if (editingItem.installments || (type === 'income' && editingItem.totalInstallments)) {
        setIsInstallment(true);
        const curr = editingItem.installments?.current || editingItem.installmentNumber || 1;
        const tot = editingItem.installments?.total || editingItem.totalInstallments || 1;
        setCurrentInstallment(curr.toString());
        setTotalInstallments(tot.toString());
      } else {
        setIsInstallment(false);
        setCurrentInstallment('1');
        setTotalInstallments('1');
      }

      setBilletBarcode(editingItem.billetData?.barcode || '');
      setBilletDigitableLine(editingItem.billetData?.digitableLine || '');
      setBilletDueDate(editingItem.billetData?.dueDate || '');
      setBilletAssignor(editingItem.billetData?.assignor || '');
    } else {
      const today = new Date().toISOString().split('T')[0];
      setDescription('');
      setAmount('');
      setDate(defaultDate || today);
      setCategoryId(filteredCategories?.[0]?.id || '');
      setPaymentMethod(type === 'expense' ? 'credit_card' : 'transfer');
      setAccountId(accounts?.[0]?.id || '');
      setCardId(cards?.[0]?.id || '');
      setContactId('');
      setStatus('pending');
      setNotes('');
      setIsRecurring(false);
      setCostCenterId('');
      setDocumentNumber('');
      setTransacaoIdBanco('');
      setLinhaDigitavel('');
      setSplits([]);
      setShowSplits(false);
      setIsInstallment(false);
      setCurrentInstallment('1');
      setTotalInstallments('1');
      setBilletBarcode('');
      setBilletDigitableLine('');
      setBilletDueDate('');
      setBilletAssignor('');
    }
    setActiveStep(1);
    setError('');
  }, [editingItem, isOpen, type, categories]);

  const handleToggleRecurring = () => {
    const nextValue = !isRecurring;
    setIsRecurring(nextValue);
    if (nextValue && type === 'expense' && !costCenterId) {
      const adminCC = costCenters.find(cc => 
        cc.name.toLowerCase().includes('escritório') || 
        cc.name.toLowerCase().includes('adm') ||
        cc.name.toLowerCase().includes('administrativo')
      );
      if (adminCC) setCostCenterId(adminCC.id);
    }
  };

  const addSplit = () => {
    setSplits([...splits, { costCenterId: '', amount: 0, categoryId: categoryId }]);
  };

  const removeSplit = (index: number) => {
    setSplits(splits.filter((_, i) => i !== index));
  };

  const updateSplit = (index: number, field: keyof Omit<TransactionSplit, 'id'>, value: any) => {
    const newSplits = [...splits];
    newSplits[index] = { ...newSplits[index], [field]: value };
    setSplits(newSplits);
  };

  const totalSplitAmount = splits.reduce((acc, s) => acc + s.amount, 0);

  if (!isOpen) return null;

  const validateStep = (step: number) => {
    if (step === 1) {
      if (!description.trim()) return 'Informe a descrição.';
      const numAmount = parseFloat(amount.replace(',', '.'));
      if (isNaN(numAmount) || numAmount <= 0) return 'Informe um valor válido.';
      if (!date) return 'Informe a data.';
      if (!categoryId) return 'Selecione uma categoria.';
    }
    return null;
  };

  const handleNext = () => {
    const err = validateStep(activeStep);
    if (err) {
      setError(err);
      return;
    }
    setError('');
    setActiveStep(prev => prev + 1);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    const err = validateStep(activeStep);
    if (err) {
      setError(err);
      return;
    }

    const numAmount = parseFloat(amount.replace(',', '.'));
    const totalSplitAmount = splits.reduce((acc, s) => acc + s.amount, 0);

    if (type === 'expense' && showSplits && Math.abs(totalSplitAmount - numAmount) > 0.01) {
      setError(`O valor total do rateio (R$ ${totalSplitAmount.toFixed(2)}) deve ser igual ao valor total da nota (R$ ${numAmount.toFixed(2)}). Falta ratear R$ ${(numAmount - totalSplitAmount).toFixed(2)}.`);
      return;
    }

    const billetData = paymentMethod === 'boleto' ? {
      barcode: billetBarcode.trim() || undefined,
      digitableLine: billetDigitableLine.trim() || undefined,
      dueDate: billetDueDate || undefined,
      assignor: billetAssignor.trim() || undefined,
    } : undefined;

    setIsLoading(true);
    try {
      if (type === 'income' && isInstallment && !editingItem) {
        // Installment Generator for new Incomes
        const tot = parseInt(totalInstallments, 10);
        const baseDate = new Date(date + 'T12:00:00');
        
        for (let i = 0; i < tot; i++) {
          const installmentDate = new Date(baseDate);
          installmentDate.setMonth(baseDate.getMonth() + i);
          
          await onSave({
            description: tot > 1 ? `${description.trim()} (${i + 1}/${tot})` : description.trim(),
            amount: Math.round(numAmount * 100) / 100,
            date: installmentDate.toISOString().split('T')[0],
            categoryId,
            paymentMethod,
            accountId: accountId || undefined,
            contactId: contactId || undefined,
            costCenterId: costCenterId || undefined,
            status,
            notes: notes.trim() || undefined,
            isRecurring,
            installmentNumber: i + 1,
            totalInstallments: tot,
            transacao_id_banco: transacao_id_banco.trim() || undefined,
            linha_digitavel: linha_digitavel.trim() || undefined,
          });
        }
      } else {
        // Standard save (Expense or single Income)
        let installmentsData = undefined;
        if (type === 'expense' && isInstallment) {
          const curr = parseInt(currentInstallment, 10);
          const tot = parseInt(totalInstallments, 10);
          if (!isNaN(curr) && !isNaN(tot)) {
            installmentsData = { current: curr, total: tot };
          }
        }

        await onSave({
          description: description.trim(),
          amount: Math.round(numAmount * 100) / 100,
          date,
          categoryId,
          paymentMethod,
          accountId: paymentMethod !== 'credit_card' ? accountId : undefined,
          cardId: paymentMethod === 'credit_card' ? cardId : undefined,
          contactId: contactId || undefined,
          costCenterId: costCenterId || undefined,
          status,
          notes: notes.trim() || undefined,
          billetData,
          installments: installmentsData,
          documentNumber: type === 'expense' ? documentNumber : undefined,
          transacao_id_banco: transacao_id_banco.trim() || undefined,
          linha_digitavel: linha_digitavel.trim() || undefined,
          isRecurring,
          splits: (type === 'expense' && showSplits) ? splits : undefined,
          ...(type === 'income' && isInstallment ? {
            installmentNumber: parseInt(currentInstallment, 10),
            totalInstallments: parseInt(totalInstallments, 10),
          } : {})
        }, editingItem?.id);
      }
      onClose();
    } catch (err) {
      setError('Erro ao salvar. Tente novamente.');
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 overflow-y-auto bg-slate-900/60 backdrop-blur-xs flex items-center justify-center p-4">
      <div className="bg-white rounded-2xl max-w-md w-full shadow-2xl border border-slate-200 overflow-hidden animate-in fade-in zoom-in-95 duration-200">
        {/* Header */}
        <div className={`px-6 py-4 border-b border-slate-100 flex items-center justify-between ${type === 'expense' ? 'bg-rose-50/50' : 'bg-emerald-50/50'}`}>
          <div className="flex items-center gap-3">
            <div className={`w-9 h-9 rounded-xl flex items-center justify-center ${type === 'expense' ? 'bg-rose-100 text-rose-700' : 'bg-emerald-100 text-emerald-700'}`}>
              {type === 'expense' ? <ArrowUpRight className="w-5 h-5" /> : <ArrowDownLeft className="w-5 h-5" />}
            </div>
            <div>
              <h3 className="text-sm font-bold text-slate-900">
                {editingItem ? 'Editar' : 'Novo Lançamento'}: {type === 'expense' ? 'Despesa' : 'Receita'}
              </h3>
              <p className="text-[11px] text-slate-500">Etapa {activeStep} de 2: {activeStep === 1 ? 'Dados Principais' : 'Detalhes e Pagamento'}</p>
            </div>
          </div>
          <button onClick={onClose} className="p-1.5 text-slate-400 hover:text-slate-600 rounded-lg hover:bg-white transition-colors">
            <X className="w-4 h-4" />
          </button>
        </div>

        {/* Form */}
        <form onSubmit={handleSubmit} className="p-6 space-y-5">
          {error && <div className="p-2.5 bg-rose-50 border border-rose-100 text-rose-700 text-xs rounded-lg font-medium">{error}</div>}

          {activeStep === 1 ? (
            <div className="space-y-4 animate-in slide-in-from-right-2 duration-200">
              <div className="space-y-1">
                <label className="text-xs font-bold text-slate-700">O que é este lançamento? *</label>
                <input
                  type="text"
                  autoFocus
                  value={description}
                  onChange={(e) => setDescription(e.target.value)}
                  placeholder={type === 'expense' ? 'Ex: Mercado, Aluguel, Internet' : 'Ex: Salário, Venda, Reembolso'}
                  className="w-full px-3.5 py-2.5 rounded-xl border border-slate-200 text-sm focus:ring-2 focus:ring-indigo-500/20 outline-none"
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div className="space-y-1">
                  <label className="text-xs font-bold text-slate-700">Valor (R$) *</label>
                  <div className="relative">
                    <span className="absolute left-3 top-2.5 text-slate-400 text-xs font-bold">R$</span>
                    <input
                      type="number"
                      step="0.01"
                      value={amount}
                      onChange={(e) => setAmount(e.target.value)}
                      placeholder="0,00"
                      className="w-full pl-8 pr-3 py-2.5 rounded-xl border border-slate-200 text-sm font-bold focus:ring-2 focus:ring-indigo-500/20 outline-none"
                    />
                  </div>
                </div>
                <div className="space-y-1">
                  <label className="text-xs font-bold text-slate-700">Data *</label>
                  <input
                    type="date"
                    value={date}
                    onChange={(e) => setDate(e.target.value)}
                    className="w-full px-3 py-2.5 rounded-xl border border-slate-200 text-sm outline-none focus:ring-2 focus:ring-indigo-500/20"
                  />
                </div>
              </div>

              {type === 'expense' && (
                <div className="space-y-1">
                  <label className="text-xs font-bold text-slate-700 uppercase tracking-wider">Nº Documento / NF</label>
                  <input
                    type="text"
                    value={documentNumber}
                    onChange={(e) => setDocumentNumber(e.target.value)}
                    placeholder="Número da nota ou recibo"
                    className="w-full px-3.5 py-2 rounded-xl border border-slate-200 text-sm outline-none focus:ring-2 focus:ring-indigo-500/20"
                  />
                </div>
              )}

              <div className="p-3.5 bg-slate-50 rounded-2xl border border-slate-200 space-y-3">
                <div className="flex items-center justify-between">
                  <label className="text-xs font-bold text-slate-700 uppercase tracking-wider flex items-center gap-2">
                    <Clock className="w-3.5 h-3.5 text-indigo-600" />
                    Recorrência
                  </label>
                  <button
                    type="button"
                    onClick={handleToggleRecurring}
                    className={`relative inline-flex h-5 w-10 shrink-0 cursor-pointer items-center rounded-full transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-indigo-500/20 ${isRecurring ? 'bg-indigo-600' : 'bg-slate-200'}`}
                  >
                    <span className={`inline-block h-4 w-4 transform rounded-full bg-white transition-transform ${isRecurring ? 'translate-x-5' : 'translate-x-1'}`} />
                  </button>
                </div>
                {isRecurring && (
                  <p className="text-[10px] text-slate-500 leading-relaxed italic">
                    Este lançamento será clonado mensalmente. O Centro de Custo padrão será "Escritório/Administrativo" se não houver rateio.
                  </p>
                )}
              </div>

              <div className="space-y-1.5">
                <label className="text-xs font-bold text-slate-700 flex items-center justify-between">
                  <span>Categoria *</span>
                  <span className="text-[10px] text-slate-400 font-normal">Selecione o grupo</span>
                </label>
                <div className="grid grid-cols-2 gap-2 max-h-40 overflow-y-auto p-1 bg-slate-50/50 rounded-xl border border-slate-100">
                  {filteredCategories.map(cat => (
                    <button
                      key={cat.id}
                      type="button"
                      onClick={() => setCategoryId(cat.id)}
                      className={`flex items-center gap-2 p-2 rounded-lg text-left text-[11px] transition-all border ${
                        categoryId === cat.id ? 'bg-white border-indigo-600 ring-1 ring-indigo-600 shadow-xs font-bold' : 'bg-white border-slate-200 text-slate-600 hover:bg-slate-50'
                      }`}
                    >
                      <div className="w-5 h-5 rounded flex items-center justify-center text-white shrink-0" style={{ backgroundColor: cat.color }}>
                        <CategoryIcon name={cat.icon} className="w-3 h-3" />
                      </div>
                      <span className="truncate">{cat.name}</span>
                    </button>
                  ))}
                </div>
              </div>
            </div>
          ) : (
            <div className="space-y-4 animate-in slide-in-from-left-2 duration-200">
              {/* Cost Center / Rateio Group */}
              <div className="p-4 bg-slate-50/80 rounded-2xl border border-slate-200 space-y-4">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <LayoutGrid className="w-4 h-4 text-indigo-600" />
                    <span className="text-xs font-bold text-slate-800 uppercase tracking-tight">Destinação (Obras)</span>
                  </div>
                  {type === 'expense' && (
                    <button
                      type="button"
                      onClick={() => {
                        setShowSplits(!showSplits);
                        if (!showSplits && splits.length === 0) addSplit();
                      }}
                      className={`text-[10px] font-bold px-2 py-1 rounded-lg transition-colors ${showSplits ? 'bg-indigo-100 text-indigo-700' : 'bg-white border border-slate-200 text-slate-500 hover:bg-white'}`}
                    >
                      {showSplits ? 'Remover Rateio' : '+ Ativar Rateio'}
                    </button>
                  )}
                </div>

                {!showSplits ? (
                  <div className="space-y-1">
                    <label className="text-[11px] font-bold text-slate-500">Centro de Custo / Obra *</label>
                    <select
                      value={costCenterId}
                      onChange={(e) => setCostCenterId(e.target.value)}
                      className="w-full px-3 py-2 rounded-xl border border-slate-300 text-xs bg-white focus:ring-2 focus:ring-indigo-500/20"
                    >
                      <option value="">Selecione uma obra</option>
                      {costCenters.map(cc => (
                        <option key={cc.id} value={cc.id}>{cc.name}</option>
                      ))}
                    </select>
                  </div>
                ) : (
                  <div className="space-y-3">
                    {splits.map((split, index) => (
                      <div key={index} className="grid grid-cols-12 gap-2 p-2 bg-white rounded-xl border border-slate-200 shadow-sm relative group">
                        <div className="col-span-6 space-y-1">
                          <label className="text-[9px] font-bold text-slate-400 uppercase">Obra</label>
                          <select
                            value={split.costCenterId}
                            onChange={(e) => updateSplit(index, 'costCenterId', e.target.value)}
                            className="w-full px-2 py-1.5 rounded-lg border border-slate-200 text-[11px] bg-slate-50"
                          >
                            <option value="">Obra...</option>
                            {costCenters.map(cc => (
                              <option key={cc.id} value={cc.id}>{cc.name}</option>
                            ))}
                          </select>
                        </div>
                        <div className="col-span-5 space-y-1">
                          <label className="text-[9px] font-bold text-slate-400 uppercase">Valor (R$)</label>
                          <input
                            type="number"
                            step="0.01"
                            value={split.amount || ''}
                            onChange={(e) => updateSplit(index, 'amount', parseFloat(e.target.value) || 0)}
                            placeholder="0,00"
                            className="w-full px-2 py-1.5 rounded-lg border border-slate-200 text-[11px] font-bold bg-slate-50"
                          />
                        </div>
                        <div className="col-span-1 flex items-end pb-1.5">
                          <button
                            type="button"
                            onClick={() => removeSplit(index)}
                            className="p-1 text-rose-500 hover:bg-rose-50 rounded-md transition-colors"
                          >
                            <X className="w-3.5 h-3.5" />
                          </button>
                        </div>
                      </div>
                    ))}
                    <button
                      type="button"
                      onClick={addSplit}
                      className="w-full py-2 border-2 border-dashed border-slate-200 rounded-xl text-[10px] font-bold text-slate-500 hover:border-indigo-300 hover:text-indigo-600 transition-all flex items-center justify-center gap-2"
                    >
                      <Plus className="w-3 h-3" />
                      Adicionar Obra ao Rateio
                    </button>
                    
                    <div className="flex items-center justify-between px-2 py-1.5 bg-indigo-50/50 rounded-lg border border-indigo-100">
                      <span className="text-[10px] font-bold text-indigo-700 uppercase">Total Rateado:</span>
                      <span className={`text-xs font-bold ${Math.abs(totalSplitAmount - parseFloat(amount)) < 0.01 ? 'text-emerald-600' : 'text-rose-600'}`}>
                        R$ {totalSplitAmount.toFixed(2)} / R$ {parseFloat(amount || '0').toFixed(2)}
                      </span>
                    </div>
                  </div>
                )}
              </div>

              {/* Payment Method Group */}
              <div className="p-3.5 bg-slate-50/80 rounded-2xl border border-slate-200 space-y-3">
                <div className="flex items-center gap-2 mb-1">
                  <Wallet className="w-3.5 h-3.5 text-indigo-600" />
                  <span className="text-xs font-bold text-slate-800 uppercase tracking-tight">Pagamento</span>
                </div>
                
                <div className="grid grid-cols-1 gap-3">
                  <div className="space-y-1">
                    <label className="text-[11px] font-bold text-slate-500">Meio de Pagamento</label>
                    <select
                      value={paymentMethod}
                      onChange={(e) => setPaymentMethod(e.target.value as PaymentMethod)}
                      className="w-full px-3 py-2 rounded-xl border border-slate-300 text-xs bg-white focus:ring-2 focus:ring-indigo-500/20"
                    >
                      {Object.entries(PAYMENT_METHOD_LABELS).map(([k, v]) => (
                        <option key={k} value={k}>{v}</option>
                      ))}
                    </select>
                  </div>

                  {paymentMethod === 'credit_card' ? (
                    <div className="space-y-1">
                      <label className="text-[11px] font-bold text-slate-500">Selecione o Cartão</label>
                      <select
                        value={cardId}
                        onChange={(e) => setCardId(e.target.value)}
                        className="w-full px-3 py-2 rounded-xl border border-slate-300 text-xs bg-white"
                      >
                        {cards.map(c => (
                          <option key={c.id} value={c.id}>{c.name} ({c.brand.toUpperCase()})</option>
                        ))}
                      </select>
                    </div>
                  ) : (
                    <div className="space-y-1">
                      <label className="text-[11px] font-bold text-slate-500">Conta / Caixa de {type === 'expense' ? 'Saída' : 'Entrada'}</label>
                      <select
                        value={accountId}
                        onChange={(e) => setAccountId(e.target.value)}
                        className="w-full px-3 py-2 rounded-xl border border-slate-300 text-xs bg-white"
                      >
                        {accounts.map(acc => (
                          <option key={acc.id} value={acc.id}>{acc.name}</option>
                        ))}
                      </select>
                    </div>
                  )}
                </div>
              </div>

              {/* Status & Contact Group */}
              <div className="grid grid-cols-2 gap-3">
                <div className="space-y-1">
                  <label className="text-xs font-bold text-slate-700">Situação</label>
                  <select
                    value={status}
                    onChange={(e) => setStatus(e.target.value as PaymentStatus)}
                    className={`w-full px-3 py-2 rounded-xl border border-slate-300 text-xs bg-white font-bold ${
                      status === 'paid' || status === 'PAGO' ? 'text-emerald-600' : 
                      status === 'pending' || status === 'PENDENTE' ? 'text-amber-600' : 
                      status === 'overdue' || status === 'VENCIDO' ? 'text-rose-600' : 'text-slate-500'
                    }`}
                  >
                    <option value="pending">PENDENTE (Aberto)</option>
                    <option value="paid">PAGO (Recebido)</option>
                    <option value="overdue">VENCIDO</option>
                    <option value="cancelled">CANCELADO</option>
                  </select>
                </div>
                <div className="space-y-1">
                  <label className="text-xs font-bold text-slate-700">{type === 'expense' ? 'Fornecedor' : 'Cliente'}</label>
                  <select
                    value={contactId}
                    onChange={(e) => setContactId(e.target.value)}
                    className="w-full px-3 py-2 rounded-xl border border-slate-300 text-xs bg-white"
                  >
                    <option value="">Não informado</option>
                    {contacts.map(c => (
                      <option key={c.id} value={c.id}>{c.name}</option>
                    ))}
                  </select>
                </div>
              </div>

              {/* Billet Data */}
              {paymentMethod === 'boleto' && (
                <div className="p-3.5 bg-indigo-50/50 rounded-2xl border border-indigo-100 space-y-2.5">
                  <div className="flex items-center gap-1.5 text-indigo-700">
                    <FileText className="w-3.5 h-3.5" />
                    <span className="text-[10px] font-bold uppercase tracking-wider">Informações do Boleto</span>
                  </div>
                  <div className="grid grid-cols-1 gap-2">
                    <input
                      type="text"
                      value={billetDigitableLine}
                      onChange={(e) => setBilletDigitableLine(e.target.value)}
                      placeholder="Linha digitável"
                      className="w-full px-2.5 py-1.5 rounded-lg border border-slate-200 text-[11px] outline-none"
                    />
                    <div className="grid grid-cols-2 gap-2">
                      <input
                        type="date"
                        value={billetDueDate}
                        onChange={(e) => setBilletDueDate(e.target.value)}
                        className="px-2.5 py-1.5 rounded-lg border border-slate-200 text-[11px] outline-none"
                      />
                      <input
                        type="text"
                        value={billetAssignor}
                        onChange={(e) => setBilletAssignor(e.target.value)}
                        placeholder="Favorecido/Cedente"
                        className="px-2.5 py-1.5 rounded-lg border border-slate-200 text-[11px] outline-none"
                      />
                    </div>
                  </div>
                </div>
              )}

              {/* Installment Generator (Incomes) or Manual Installments (Expenses) */}
              <div className="p-3 bg-slate-50 border border-slate-200 rounded-xl space-y-3">
                <div className="flex items-center justify-between">
                  <label className="flex items-center gap-2 cursor-pointer">
                    <input
                      type="checkbox"
                      checked={isInstallment}
                      onChange={(e) => setIsInstallment(e.target.checked)}
                      className="rounded text-indigo-600 focus:ring-indigo-500 w-3.5 h-3.5"
                    />
                    <span className="text-[11px] font-bold text-slate-700">
                      {type === 'income' ? 'Gerar Parcelas Automáticas' : 'Compra Parcelada'}
                    </span>
                  </label>
                  {isInstallment && type === 'income' && (
                    <span className="text-[9px] font-bold text-emerald-600 bg-emerald-50 px-2 py-0.5 rounded-full border border-emerald-100">
                      Automação Ativa
                    </span>
                  )}
                </div>
                
                {isInstallment && (
                  <div className="flex gap-2 pt-2 border-t border-slate-200">
                    <div className="flex-1 space-y-1">
                      <label className="text-[9px] font-bold text-slate-400 uppercase">{type === 'expense' ? 'Parc. Atual' : 'Primeira Parc.'}</label>
                      <input
                        type="number"
                        value={currentInstallment}
                        onChange={(e) => setCurrentInstallment(e.target.value)}
                        className="w-full px-2.5 py-1.5 rounded-lg border border-slate-300 text-[11px]"
                      />
                    </div>
                    <div className="flex items-end pb-2">
                      <span className="text-slate-400 text-[10px]">de</span>
                    </div>
                    <div className="flex-1 space-y-1">
                      <label className="text-[9px] font-bold text-slate-400 uppercase">Total Parcelas</label>
                      <input
                        type="number"
                        value={totalInstallments}
                        onChange={(e) => setTotalInstallments(e.target.value)}
                        className="w-full px-2.5 py-1.5 rounded-lg border border-slate-300 text-[11px]"
                      />
                    </div>
                  </div>
                )}
                {isInstallment && type === 'income' && (
                  <p className="text-[9px] text-slate-400 italic">
                    O sistema criará {totalInstallments} lançamentos mensais automáticos no valor de R$ {parseFloat(amount || '0').toFixed(2)} cada.
                  </p>
                )}
              </div>

              {/* Notes */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div className="space-y-1">
                  <label className="text-[10px] font-bold text-slate-500 uppercase tracking-tight">ID Transação Banco</label>
                  <input
                    type="text"
                    value={transacao_id_banco}
                    onChange={(e) => setTransacaoIdBanco(e.target.value)}
                    placeholder="ID do Gateway/Banco"
                    className="w-full px-3 py-2 rounded-lg border border-slate-200 text-xs focus:ring-2 focus:ring-indigo-500/20 outline-none"
                  />
                </div>
                <div className="space-y-1">
                  <label className="text-[10px] font-bold text-slate-500 uppercase tracking-tight">Linha Digitável</label>
                  <input
                    type="text"
                    value={linha_digitavel}
                    onChange={(e) => setLinhaDigitavel(e.target.value)}
                    placeholder="Números para pagamento"
                    className="w-full px-3 py-2 rounded-lg border border-slate-200 text-xs focus:ring-2 focus:ring-indigo-500/20 outline-none"
                  />
                </div>
              </div>

              <div className="space-y-1">
                <label className="text-xs font-bold text-slate-700">Observações</label>
                <textarea
                  value={notes}
                  onChange={(e) => setNotes(e.target.value)}
                  rows={2}
                  placeholder="Detalhes adicionais..."
                  className="w-full px-3 py-2 rounded-xl border border-slate-300 text-xs focus:ring-2 focus:ring-indigo-500/20 outline-none"
                />
              </div>
            </div>
          )}

          {/* Footer Buttons */}
          <div className="flex items-center justify-between pt-4 border-t border-slate-100">
            {activeStep > 1 ? (
              <button
                type="button"
                onClick={() => setActiveStep(1)}
                className="px-4 py-2 text-xs font-bold text-slate-500 hover:text-slate-800 transition"
              >
                Voltar
              </button>
            ) : (
              <div />
            )}
            
            <div className="flex items-center gap-2">
              <button
                type="button"
                onClick={onClose}
                className="px-4 py-2 text-xs font-bold text-slate-500 hover:text-slate-800 transition"
              >
                Cancelar
              </button>
              
              {activeStep === 1 ? (
                <button
                  type="button"
                  onClick={handleNext}
                  className={`px-5 py-2.5 text-xs font-bold text-white rounded-xl shadow-xs transition-all flex items-center gap-2 ${type === 'expense' ? 'bg-indigo-600 hover:bg-indigo-700' : 'bg-emerald-600 hover:bg-emerald-700'}`}
                >
                  Continuar
                  <ArrowUpRight className="w-3.5 h-3.5" />
                </button>
              ) : (
                <button
                  type="submit"
                  disabled={isLoading}
                  className={`px-6 py-2.5 text-xs font-bold text-white rounded-xl shadow-xs transition-all flex items-center gap-2 disabled:opacity-50 ${type === 'expense' ? 'bg-indigo-600 hover:bg-indigo-700 shadow-indigo-200' : 'bg-emerald-600 hover:bg-emerald-700 shadow-emerald-200'}`}
                >
                  {isLoading ? 'Salvando...' : editingItem ? 'Salvar Alterações' : `Cadastrar ${type === 'expense' ? 'Despesa' : 'Receita'}`}
                  <Check className="w-4 h-4" />
                </button>
              )}
            </div>
          </div>
        </form>
      </div>
    </div>
  );
};
