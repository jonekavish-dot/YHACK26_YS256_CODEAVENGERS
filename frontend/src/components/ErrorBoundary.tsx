import React, { Component, ErrorInfo, ReactNode } from 'react';
import { AlertOctagon, RotateCcw } from 'lucide-react';

interface Props {
  children: ReactNode;
  fallbackTitle?: string;
}

interface State {
  hasError: boolean;
  error: Error | null;
}

export class ErrorBoundary extends Component<Props, State> {
  public state: State = {
    hasError: false,
    error: null,
  };

  public static getDerivedStateFromError(error: Error): State {
    return { hasError: true, error };
  }

  public componentDidCatch(error: Error, errorInfo: ErrorInfo) {
    console.error('MIRA UI Uncaught Exception caught by ErrorBoundary:', error, errorInfo);
  }

  private handleReset = () => {
    this.setState({ hasError: false, error: null });
  };

  public render() {
    if (this.state.hasError) {
      return (
        <div className="bg-slate-900/90 rounded-2xl border border-rose-500/40 p-6 shadow-2xl space-y-4 my-4">
          <div className="flex items-center space-x-3 text-rose-400">
            <div className="p-2 rounded-xl bg-rose-500/10 border border-rose-500/30">
              <AlertOctagon className="h-6 w-6" />
            </div>
            <div>
              <h3 className="text-sm font-bold text-white tracking-wide">
                {this.props.fallbackTitle || 'Component Render Recovery'}
              </h3>
              <p className="text-xs text-rose-300">
                A non-critical UI exception occurred. The safety governor and mission telemetry remain active.
              </p>
            </div>
          </div>

          <div className="bg-slate-950/80 rounded-xl p-3 border border-slate-800 text-[11px] font-mono text-rose-300 overflow-x-auto">
            {this.state.error?.message || 'Unknown runtime error'}
          </div>

          <div className="flex items-center space-x-3">
            <button
              onClick={this.handleReset}
              className="flex items-center space-x-1.5 px-3 py-1.5 rounded-xl bg-sky-500 hover:bg-sky-400 text-white text-xs font-mono font-bold transition cursor-pointer"
            >
              <RotateCcw className="h-3.5 w-3.5" />
              <span>Retry Component</span>
            </button>
            <button
              onClick={() => window.location.reload()}
              className="px-3 py-1.5 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-300 text-xs font-mono transition cursor-pointer"
            >
              Reload Page
            </button>
          </div>
        </div>
      );
    }

    return this.props.children;
  }
}
