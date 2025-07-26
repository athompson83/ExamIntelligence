import { useState, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { Bug, X } from "lucide-react";
import BugReportDialog from "@/components/BugReportDialog";
import { useErrorReporting } from "@/hooks/useErrorReporting";

interface ConditionalBugReporterProps {
  onError?: (error: Error) => void;
  featureName?: string;
}

export default function ConditionalBugReporter({ onError, featureName }: ConditionalBugReporterProps) {
  const { showBugReportDialog, setShowBugReportDialog, lastError, clearLastError } = useErrorReporting();
  const [showButton, setShowButton] = useState(false);
  const [errorCount, setErrorCount] = useState(0);

  // Show button when there are recent errors
  useEffect(() => {
    if (lastError) {
      setShowButton(true);
      setErrorCount(prev => prev + 1);
      
      // Auto-hide after 30 seconds if no new errors
      const timer = setTimeout(() => {
        setShowButton(false);
        setErrorCount(0);
      }, 30000);
      
      return () => clearTimeout(timer);
    }
  }, [lastError]);

  // Function to manually trigger bug report (can be called by components when features fail)
  const triggerBugReport = (error?: Error, context?: string) => {
    if (error && onError) {
      onError(error);
    }
    setShowButton(true);
    setShowBugReportDialog(true);
  };

  // Expose trigger function globally for easy access
  useEffect(() => {
    (window as any).reportBug = triggerBugReport;
    return () => {
      delete (window as any).reportBug;
    };
  }, []);

  if (!showButton) {
    return (
      <BugReportDialog
        isOpen={showBugReportDialog}
        onClose={() => {
          setShowBugReportDialog(false);
          clearLastError();
        }}
        initialError={lastError || undefined}
      />
    );
  }

  return (
    <>
      {/* Temporary bug report button that appears only when there are errors */}
      <div className="fixed bottom-4 right-4 z-50 flex flex-col items-end space-y-2">
        {/* Error notification badge */}
        <div className="bg-red-100 border border-red-300 rounded-lg p-3 shadow-lg max-w-sm">
          <div className="flex items-start justify-between">
            <div className="flex items-start space-x-2">
              <Bug className="h-5 w-5 text-red-600 mt-0.5" />
              <div>
                <p className="text-sm font-medium text-red-800">
                  {errorCount > 1 ? `${errorCount} errors detected` : 'Error detected'}
                </p>
                <p className="text-xs text-red-600 mt-1">
                  {featureName ? `Issue with ${featureName}` : 'Something went wrong'}
                </p>
              </div>
            </div>
            <Button
              variant="ghost"
              size="sm"
              onClick={() => {
                setShowButton(false);
                setErrorCount(0);
                clearLastError();
              }}
              className="h-6 w-6 p-0 text-red-600 hover:text-red-800"
            >
              <X className="h-4 w-4" />
            </Button>
          </div>
          
          <div className="flex space-x-2 mt-3">
            <Button
              size="sm"
              onClick={() => setShowBugReportDialog(true)}
              className="bg-red-600 hover:bg-red-700 text-white text-xs px-3 py-1"
            >
              Report Bug
            </Button>
            <Button
              size="sm"
              variant="outline"
              onClick={() => {
                setShowButton(false);
                setErrorCount(0);
                clearLastError();
              }}
              className="text-xs px-3 py-1"
            >
              Dismiss
            </Button>
          </div>
        </div>
      </div>
      
      <BugReportDialog
        isOpen={showBugReportDialog}
        onClose={() => {
          setShowBugReportDialog(false);
          setShowButton(false);
          setErrorCount(0);
          clearLastError();
        }}
        initialError={lastError || undefined}
      />
    </>
  );
}