import React, { ErrorInfo, ReactNode } from 'react';
import { AlertTriangle, RefreshCw, Trash2 } from 'lucide-react';

interface Props {
  children?: ReactNode;
}

interface State {
  hasError: boolean;
  error: Error | null;
  errorInfo: ErrorInfo | null;
}

export class ErrorBoundary extends React.Component<Props, State> {
  state: State = {
    hasError: false,
    error: null,
    errorInfo: null,
  };

  public static getDerivedStateFromError(error: Error): State {
    return { hasError: true, error, errorInfo: null };
  }

  public override componentDidCatch(error: Error, errorInfo: ErrorInfo) {
    console.error('Uncaught error caught by ErrorBoundary:', error, errorInfo);
    this.setState({ errorInfo });
  }

  private handleReload = () => {
    window.location.reload();
  };

  private handleResetCache = () => {
    try {
      localStorage.clear();
      sessionStorage.clear();
    } catch (e) {
      console.error('Failed to clear storage:', e);
    }
    window.location.reload();
  };

  public override render() {
    if (this.state.hasError) {
      return (
        <div className="min-h-screen bg-zinc-900 text-zinc-100 flex items-center justify-center p-4 font-sans dir-rtl" dir="rtl">
          <div className="bg-zinc-800 border border-zinc-700/80 rounded-2xl p-6 sm:p-8 max-w-lg w-full shadow-2xl space-y-6 text-right">
            <div className="flex items-center gap-3 text-red-400">
              <div className="p-3 bg-red-500/10 rounded-xl border border-red-500/20">
                <AlertTriangle className="w-8 h-8 text-red-400" />
              </div>
              <div>
                <h1 className="text-xl font-bold text-white">حدث خطأ غير متوقع في المنصة</h1>
                <p className="text-xs text-zinc-400 mt-1">تم توثيق الخطأ لحماية بياناتك الدراسية</p>
              </div>
            </div>

            <div className="bg-zinc-900/80 border border-zinc-700/50 rounded-xl p-4 text-xs font-mono text-zinc-300 overflow-x-auto max-h-40 whitespace-pre-wrap">
              {this.state.error?.toString() || 'حدث خطأ في النظام'}
            </div>

            <p className="text-sm text-zinc-300 leading-relaxed">
              يمكنك محاولة إعادة تحميل الصفحة أو إعادة تعيين التخزين المؤقت في حال تكرار المشكلة.
            </p>

            <div className="flex flex-col sm:flex-row gap-3 pt-2">
              <button
                onClick={this.handleReload}
                className="flex-1 flex items-center justify-center gap-2 px-5 py-3 bg-emerald-600 hover:bg-emerald-500 text-white font-semibold rounded-xl shadow-lg transition-all text-sm cursor-pointer"
              >
                <RefreshCw className="w-4 h-4" />
                إعادة تحميل المنصة
              </button>
              <button
                onClick={this.handleResetCache}
                className="flex-1 flex items-center justify-center gap-2 px-5 py-3 bg-zinc-700 hover:bg-zinc-600 text-zinc-200 font-semibold rounded-xl border border-zinc-600 transition-all text-sm cursor-pointer"
              >
                <Trash2 className="w-4 h-4 text-amber-400" />
                تصفير البيانات المؤقتة
              </button>
            </div>
          </div>
        </div>
      );
    }

    return this.props.children;
  }
}

export default ErrorBoundary;
