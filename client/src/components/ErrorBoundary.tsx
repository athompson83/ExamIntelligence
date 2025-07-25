import React, { Component, ErrorInfo, ReactNode } from 'react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { AlertTriangle, RefreshCw, Bug, Home } from 'lucide-react';
import { apiRequest } from '@/lib/queryClient';

interface ErrorBoundaryProps {
  children: ReactNode;
  fallback?: ReactNode;
  showReportButton?: boolean;
}

interface ErrorBoundaryState {
  hasError: boolean;
  error: Error | null;
  errorInfo: ErrorInfo | null;
  isReporting: boolean;
  reportSent: boolean;
}

class ErrorBoundary extends Component<ErrorBoundaryProps, ErrorBoundaryState> {
  constructor(props: ErrorBoundaryProps) {
    super(props);
    this.state = {
      hasError: false,
      error: null,
      errorInfo: null,
      isReporting: false,
      reportSent: false
    };
  }

  static getDerivedStateFromError(error: Error): Partial<ErrorBoundaryState> {
    return {
      hasError: true,
      error
    };
  }

  componentDidCatch(error: Error, errorInfo: ErrorInfo) {
    this.setState({
      error,
      errorInfo
    });

    // Automatically log the error
    this.logError(error, errorInfo);
  }

  logError = async (error: Error, errorInfo: ErrorInfo) => {
    try {
      await apiRequest('/api/error-logs', {
        method: 'POST',
        body: JSON.stringify({
          errorType: 'ui',
          severity: 'high',
          source: window.location.pathname,
          message: error.message,
          stackTrace: error.stack,
          userAgent: navigator.userAgent,
          ipAddress: 'auto-detected',
          metadata: {
            componentStack: errorInfo.componentStack,
            errorBoundary: true,
            url: window.location.href,
            timestamp: new Date().toISOString(),
            errorName: error.name,
            autoReported: true
          }
        })
      });
    } catch (logError) {
      console.error('Failed to log error:', logError);
    }
  };

  handleReportBug = async () => {
    if (this.state.isReporting || this.state.reportSent) return;

    this.setState({ isReporting: true });

    try {
      await apiRequest('/api/error-logs', {
        method: 'POST',
        body: JSON.stringify({
          errorType: 'ui',
          severity: 'high',
          source: window.location.pathname,
          message: `User reported error: ${this.state.error?.message}`,
          stackTrace: this.state.error?.stack,
          userAgent: navigator.userAgent,
          ipAddress: 'auto-detected',
          metadata: {
            componentStack: this.state.errorInfo?.componentStack,
            errorBoundary: true,
            userReported: true,
            url: window.location.href,
            timestamp: new Date().toISOString(),
            errorName: this.state.error?.name
          }
        })
      });

      this.setState({ reportSent: true });
    } catch (error) {
      console.error('Failed to send bug report:', error);
    } finally {
      this.setState({ isReporting: false });
    }
  };

  handleRetry = () => {
    this.setState({
      hasError: false,
      error: null,
      errorInfo: null,
      isReporting: false,
      reportSent: false
    });
  };

  handleGoHome = () => {
    window.location.href = '/';
  };

  render() {
    if (this.state.hasError) {
      if (this.props.fallback) {
        return this.props.fallback;
      }

      return (
        <div className="min-h-screen bg-gray-50 flex items-center justify-center p-4">
          <Card className="max-w-2xl w-full">
            <CardHeader>
              <CardTitle className="flex items-center space-x-2 text-red-600">
                <AlertTriangle className="h-6 w-6" />
                <span>Something went wrong</span>
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-6">
              <Alert className="border-red-200 bg-red-50">
                <AlertTriangle className="h-4 w-4 text-red-600" />
                <AlertDescription className="text-red-800">
                  An unexpected error occurred in the application. The error has been automatically logged for investigation.
                </AlertDescription>
              </Alert>

              <div className="space-y-4">
                <div>
                  <h3 className="font-medium text-gray-900 mb-2">Error Details:</h3>
                  <div className="bg-gray-100 p-3 rounded-lg text-sm font-mono text-gray-700">
                    {this.state.error?.message || 'Unknown error occurred'}
                  </div>
                </div>

                {process.env.NODE_ENV === 'development' && this.state.error?.stack && (
                  <details className="text-sm">
                    <summary className="cursor-pointer font-medium text-gray-700">
                      View Stack Trace (Development)
                    </summary>
                    <pre className="mt-2 bg-gray-100 p-3 rounded-lg text-xs overflow-auto">
                      {this.state.error.stack}
                    </pre>
                  </details>
                )}
              </div>

              <div className="flex flex-col sm:flex-row gap-3">
                <Button onClick={this.handleRetry} className="flex items-center space-x-2">
                  <RefreshCw className="h-4 w-4" />
                  <span>Try Again</span>
                </Button>

                <Button 
                  onClick={this.handleGoHome} 
                  variant="outline"
                  className="flex items-center space-x-2"
                >
                  <Home className="h-4 w-4" />
                  <span>Go Home</span>
                </Button>

                {this.props.showReportButton !== false && (
                  <Button
                    onClick={this.handleReportBug}
                    variant="outline"
                    disabled={this.state.isReporting || this.state.reportSent}
                    className="flex items-center space-x-2"
                  >
                    <Bug className="h-4 w-4" />
                    <span>
                      {this.state.reportSent 
                        ? 'Report Sent' 
                        : this.state.isReporting 
                          ? 'Sending...' 
                          : 'Report Bug'
                      }
                    </span>
                  </Button>
                )}
              </div>

              {this.state.reportSent && (
                <Alert className="border-green-200 bg-green-50">
                  <AlertDescription className="text-green-800">
                    Thank you for reporting this issue. Our team has been notified and will investigate.
                  </AlertDescription>
                </Alert>
              )}
            </CardContent>
          </Card>
        </div>
      );
    }

    return this.props.children;
  }
}

export default ErrorBoundary;