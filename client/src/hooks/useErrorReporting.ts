import React, { useState, useCallback, useEffect } from "react";
import { useToast } from "@/hooks/use-toast";
import { apiRequest } from "@/lib/queryClient";

interface ErrorDetails {
  message: string;
  stack?: string;
  source: string;
  severity: "low" | "medium" | "high" | "critical";
  metadata?: Record<string, any>;
}

interface UseErrorReportingReturn {
  reportError: (error: Error | ErrorDetails, context?: Record<string, any>) => void;
  showBugReportDialog: boolean;
  setShowBugReportDialog: (show: boolean) => void;
  lastError: ErrorDetails | null;
  clearLastError: () => void;
}

export function useErrorReporting(): UseErrorReportingReturn {
  const { toast } = useToast();
  const [showBugReportDialog, setShowBugReportDialog] = useState(false);
  const [lastError, setLastError] = useState<ErrorDetails | null>(null);

  // Global error handler for unhandled JavaScript errors
  useEffect(() => {
    const handleUnhandledError = (event: ErrorEvent) => {
      const errorDetails: ErrorDetails = {
        message: event.message,
        stack: event.error?.stack,
        source: event.filename || window.location.pathname,
        severity: "high",
        metadata: {
          lineno: event.lineno,
          colno: event.colno,
          url: window.location.href,
          userAgent: navigator.userAgent,
          timestamp: new Date().toISOString()
        }
      };

      logErrorToBackend(errorDetails);
      setLastError(errorDetails);
      
      // Auto-show dialog for critical errors
      if (errorDetails.severity === "critical" || errorDetails.severity === "high") {
        showErrorToast(errorDetails);
      }
    };

    const handleUnhandledRejection = (event: PromiseRejectionEvent) => {
      const errorDetails: ErrorDetails = {
        message: event.reason?.message || "Unhandled promise rejection",
        stack: event.reason?.stack,
        source: window.location.pathname,
        severity: "medium",
        metadata: {
          reason: event.reason,
          url: window.location.href,
          userAgent: navigator.userAgent,
          timestamp: new Date().toISOString()
        }
      };

      logErrorToBackend(errorDetails);
      setLastError(errorDetails);
    };

    window.addEventListener('error', handleUnhandledError);
    window.addEventListener('unhandledrejection', handleUnhandledRejection);

    return () => {
      window.removeEventListener('error', handleUnhandledError);
      window.removeEventListener('unhandledrejection', handleUnhandledRejection);
    };
  }, []);

  const logErrorToBackend = async (errorDetails: ErrorDetails) => {
    try {
      await apiRequest('/api/error-logs', {
        method: 'POST',
        body: JSON.stringify({
          errorType: 'ui',
          severity: errorDetails.severity,
          source: errorDetails.source,
          message: errorDetails.message,
          stackTrace: errorDetails.stack,
          userAgent: navigator.userAgent,
          ipAddress: 'auto-detected',
          metadata: {
            ...errorDetails.metadata,
            autoReported: true,
            errorCapture: 'automatic'
          }
        })
      });
    } catch (error) {
      console.error('Failed to log error to backend:', error);
    }
  };

  const showErrorToast = (errorDetails: ErrorDetails) => {
    toast({
      title: "Something went wrong",
      description: "An error occurred. Click 'Report Bug' to help us fix this issue.",
      variant: "destructive",
      action: React.createElement("button", {
        onClick: () => setShowBugReportDialog(true),
        className: "bg-white text-red-600 px-3 py-1 rounded text-sm hover:bg-gray-100"
      }, "Report Bug")
    });
  };

  const reportError = useCallback((error: Error | ErrorDetails, context?: Record<string, any>) => {
    let errorDetails: ErrorDetails;

    if (error instanceof Error) {
      errorDetails = {
        message: error.message,
        stack: error.stack,
        source: window.location.pathname,
        severity: "medium",
        metadata: {
          ...context,
          errorType: error.name,
          url: window.location.href,
          userAgent: navigator.userAgent,
          timestamp: new Date().toISOString()
        }
      };
    } else {
      errorDetails = {
        ...error,
        metadata: {
          ...error.metadata,
          ...context,
          url: window.location.href,
          userAgent: navigator.userAgent,
          timestamp: new Date().toISOString()
        }
      };
    }

    logErrorToBackend(errorDetails);
    setLastError(errorDetails);
    showErrorToast(errorDetails);
  }, [toast]);

  const clearLastError = useCallback(() => {
    setLastError(null);
  }, []);

  return {
    reportError,
    showBugReportDialog,
    setShowBugReportDialog,
    lastError,
    clearLastError
  };
}

// Error boundary hook for React components
export function useErrorBoundary() {
  const { reportError } = useErrorReporting();

  const captureError = useCallback((error: Error, errorInfo?: any) => {
    reportError(error, {
      componentStack: errorInfo?.componentStack,
      errorBoundary: true
    });
  }, [reportError]);

  return { captureError };
}