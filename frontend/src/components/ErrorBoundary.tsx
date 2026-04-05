import React from 'react';
import { AlertTriangle } from 'lucide-react';
import AppStatusPage from '@/components/status/AppStatusPage';

interface Props {
  children: React.ReactNode;
  fallback?: React.ReactNode;
}

interface State {
  hasError: boolean;
  error?: Error;
}

export class ErrorBoundary extends React.Component<Props, State> {
  constructor(props: Props) {
    super(props);
    this.state = { hasError: false };
  }

  static getDerivedStateFromError(error: Error): State {
    return { hasError: true, error };
  }

  componentDidCatch(error: Error, errorInfo: React.ErrorInfo) {
    console.error('[ErrorBoundary]', error.message, errorInfo.componentStack);
  }

  handleReset = () => {
    this.setState({ hasError: false, error: undefined });
  };

  render() {
    if (this.state.hasError) {
      if (this.props.fallback) return this.props.fallback;

      return (
        <AppStatusPage
          code="500"
          badge="Unexpected Error"
          title="This section hit a runtime problem."
          description="Something failed while rendering the page. Your data is likely still safe, and a refresh or retry usually gets things back on track."
          accentClass="bg-[radial-gradient(circle,rgba(244,63,94,0.24),rgba(255,255,255,0))]"
          icon={<AlertTriangle className="h-7 w-7" />}
          details={
            this.state.error ? (
              <>
                <span className="font-medium text-slate-900">Technical detail:</span>{' '}
                <span className="font-mono text-[13px] break-all">{this.state.error.message}</span>
              </>
            ) : undefined
          }
          primaryAction={{ label: 'Try Again', onClick: this.handleReset }}
          secondaryAction={{ label: 'Reload Page', onClick: () => window.location.reload() }}
        />
      );
    }

    return this.props.children;
  }
}

export default ErrorBoundary;
