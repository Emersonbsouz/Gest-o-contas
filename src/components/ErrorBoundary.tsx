import React, { Component, ErrorInfo, ReactNode } from 'react';
import { AlertTriangle, RefreshCw } from 'lucide-react';

interface Props {
  children: ReactNode;
}

interface State {
  hasError: boolean;
  error: Error | null;
}

export class ErrorBoundary extends React.Component<Props, State> {
  constructor(props: Props) {
    super(props);
    this.state = {
      hasError: false,
      error: null,
    };
  }

  public static getDerivedStateFromError(error: Error): State {
    return { hasError: true, error };
  }

  public componentDidCatch(error: Error, errorInfo: ErrorInfo) {
    console.error('Uncaught error:', error, errorInfo);
  }

  private handleReset = () => {
    localStorage.clear();
    window.location.reload();
  };

  private handleReload = () => {
    window.location.reload();
  };

  public render() {
    if (this.state.hasError) {
      return (
        <div className="min-h-screen bg-slate-50 flex flex-col items-center justify-center p-6 text-center">
          <div className="w-16 h-16 bg-rose-100 text-rose-600 rounded-2xl flex items-center justify-center mb-6 shadow-sm">
            <AlertTriangle className="w-10 h-10" />
          </div>
          
          <h1 className="text-2xl font-bold text-slate-900 mb-2">Ops! Algo deu errado.</h1>
          <p className="text-slate-600 max-w-md mb-8">
            Ocorreu um erro inesperado que impediu a exibição da tela. 
            Isso pode ter sido causado por dados corrompidos ou falha de conexão.
          </p>

          <div className="flex flex-col sm:flex-row gap-3">
            <button
              onClick={this.handleReload}
              className="inline-flex items-center gap-2 px-6 py-3 bg-indigo-600 hover:bg-indigo-700 text-white rounded-xl font-bold transition-all shadow-md active:scale-95"
            >
              <RefreshCw className="w-5 h-5" />
              Tentar Novamente
            </button>
            
            <button
              onClick={this.handleReset}
              className="inline-flex items-center gap-2 px-6 py-3 bg-white hover:bg-slate-50 text-slate-700 border border-slate-200 rounded-xl font-bold transition-all"
            >
              Limpar Cache e Reiniciar
            </button>
          </div>
          
          <div className="mt-12 p-4 bg-slate-100 rounded-lg text-left w-full max-w-2xl overflow-auto">
            <p className="text-[10px] font-mono text-slate-500 uppercase mb-2 tracking-widest">Detalhes técnicos para suporte:</p>
            <pre className="text-xs font-mono text-rose-800 whitespace-pre-wrap">
              {this.state.error?.toString()}
            </pre>
          </div>
        </div>
      );
    }

    return this.props.children;
  }
}
