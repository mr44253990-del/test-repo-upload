import { Component, type ReactNode } from 'react';
import { Button } from '@/components/ui/button';
import { AlertTriangle, RefreshCw } from 'lucide-react';

interface Props {
  children: ReactNode;
}

interface State {
  hasError: boolean;
  error: Error | null;
}

export class ErrorBoundary extends Component<Props, State> {
  constructor(props: Props) {
    super(props);
    this.state = { hasError: false, error: null };
  }

  static getDerivedStateFromError(error: Error): State {
    return { hasError: true, error };
  }

  componentDidCatch(error: Error, errorInfo: React.ErrorInfo) {
    console.error('Error caught by boundary:', error, errorInfo);
  }

  handleReset = () => {
    this.setState({ hasError: false, error: null });
    window.location.reload();
  };

  render() {
    if (this.state.hasError) {
      return (
        <div className="min-h-screen flex items-center justify-center bg-gray-50 dark:bg-gray-900 p-4">
          <div className="max-w-md w-full text-center">
            <div className="w-20 h-20 bg-red-100 dark:bg-red-900/30 rounded-full flex items-center justify-center mx-auto mb-6">
              <AlertTriangle className="w-10 h-10 text-red-600" />
            </div>
            <h1 className="text-2xl font-bold text-gray-900 dark:text-white mb-2">
              কিছু সমস্যা হয়েছে!
            </h1>
            <p className="text-gray-600 dark:text-gray-400 mb-6">
              আমরা একটি ত্রুটি খুঁজে পেয়েছি। অনুগ্রহ করে পেজটি রিফ্রেশ করুন।
            </p>
            {this.state.error && (
              <div className="bg-red-50 dark:bg-red-900/20 rounded-lg p-4 mb-6 text-left">
                <p className="text-sm text-red-600 font-mono break-all">
                  {this.state.error.message}
                </p>
              </div>
            )}
            <Button 
              onClick={this.handleReset}
              className="w-full"
              size="lg"
            >
              <RefreshCw className="w-5 h-5 mr-2" />
              পেজ রিফ্রেশ করুন
            </Button>
          </div>
        </div>
      );
    }

    return this.props.children;
  }
}
