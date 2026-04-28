import React, { Component, ErrorInfo, ReactNode } from 'react';

interface Props {
  children: ReactNode;
  fallback?: ReactNode;
}

interface State {
  hasError: boolean;
  error: Error | null;
}

export default class ErrorBoundary extends Component<Props, State> {
  constructor(props: Props) {
    super(props);
    this.state = {
      hasError: false,
      error: null
    };
  }

  public static getDerivedStateFromError(error: Error): State {
    return { hasError: true, error };
  }

  public componentDidCatch(error: Error, errorInfo: ErrorInfo) {
    console.error('Uncaught error:', error, errorInfo);
  }

  public render() {
    const { hasError, error } = this.state;
    const { children, fallback } = this.props;

    if (hasError) {
      return fallback || (
        <div className="min-h-screen flex items-center justify-center p-6 bg-slate-50">
          <div className="max-w-md w-full bg-white rounded-[2.5rem] p-8 border border-slate-100 shadow-xl text-center space-y-6">
            <div className="w-20 h-20 bg-red-50 rounded-full flex items-center justify-center mx-auto">
              <span className="text-4xl">⚠️</span>
            </div>
            <div className="space-y-2">
              <h2 className="text-2xl font-black text-secondary">Oops! Something went wrong</h2>
              <p className="text-slate-500 font-medium">The app encountered an unexpected error. Don't worry, your data is safe.</p>
            </div>
            <button 
              onClick={() => window.location.reload()}
              className="w-full py-4 bg-primary text-white rounded-2xl font-bold shadow-lg shadow-primary/20 active:scale-95 transition-transform"
            >
              Restart App
            </button>
            {process.env.NODE_ENV === 'development' && (
              <div className="mt-4 p-4 bg-red-50 rounded-xl text-left overflow-auto max-h-40">
                <p className="text-xs font-mono text-red-600 whitespace-pre-wrap">{error?.toString()}</p>
              </div>
            )}
          </div>
        </div>
      );
    }

    return children;
  }
}
