import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Bug } from "lucide-react";
import BugReportDialog from "@/components/BugReportDialog";
import { useErrorReporting } from "@/hooks/useErrorReporting";

export default function FloatingBugReportButton() {
  const { showBugReportDialog, setShowBugReportDialog, lastError, clearLastError } = useErrorReporting();

  return (
    <>
      <Button
        onClick={() => setShowBugReportDialog(true)}
        className="fixed bottom-20 right-4 z-50 h-12 w-12 rounded-full bg-red-600 hover:bg-red-700 shadow-lg border-2 border-white"
        title="Report a Bug"
      >
        <Bug className="h-5 w-5 text-white" />
      </Button>
      
      <BugReportDialog
        isOpen={showBugReportDialog}
        onClose={() => {
          setShowBugReportDialog(false);
          clearLastError();
        }}
        initialError={lastError || undefined}
      />
    </>
  );
}