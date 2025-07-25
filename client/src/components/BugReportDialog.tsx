import { useState } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import { useAuth } from "@/hooks/useAuth";
import { useToast } from "@/hooks/use-toast";
import { 
  Dialog, 
  DialogContent, 
  DialogHeader, 
  DialogTitle,
  DialogDescription,
  DialogFooter
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Form, FormControl, FormField, FormItem, FormLabel, FormDescription } from "@/components/ui/form";
import { Badge } from "@/components/ui/badge";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { Bug, AlertTriangle, Info, Zap, Shield } from "lucide-react";
import { apiRequest } from "@/lib/queryClient";
import { z } from "zod";

const bugReportSchema = z.object({
  title: z.string().min(5, "Title must be at least 5 characters"),
  description: z.string().min(20, "Please provide detailed description (min 20 characters)"),
  errorType: z.enum(["ui", "api", "validation", "security", "performance", "general"]),
  severity: z.enum(["low", "medium", "high", "critical"]),
  stepsToReproduce: z.string().min(10, "Please describe steps to reproduce"),
  expectedBehavior: z.string().optional(),
  actualBehavior: z.string().optional(),
  browserInfo: z.string().optional(),
  additionalContext: z.string().optional()
});

type BugReportForm = z.infer<typeof bugReportSchema>;

interface BugReportDialogProps {
  isOpen: boolean;
  onClose: () => void;
  initialError?: {
    message?: string;
    stack?: string;
    source?: string;
    severity?: "low" | "medium" | "high" | "critical";
  };
}

const errorTypeIcons = {
  ui: Bug,
  api: Zap,
  validation: AlertTriangle,
  security: Shield,
  performance: Zap,
  general: Info
};

const severityColors = {
  low: "bg-blue-100 text-blue-800",
  medium: "bg-yellow-100 text-yellow-800", 
  high: "bg-orange-100 text-orange-800",
  critical: "bg-red-100 text-red-800"
};

export default function BugReportDialog({ isOpen, onClose, initialError }: BugReportDialogProps) {
  const { user } = useAuth();
  const { toast } = useToast();
  const queryClient = useQueryClient();
  const [isSubmitting, setIsSubmitting] = useState(false);

  const form = useForm<BugReportForm>({
    resolver: zodResolver(bugReportSchema),
    defaultValues: {
      title: initialError?.message ? `Error: ${initialError.message.substring(0, 50)}...` : "",
      description: initialError?.message || "",
      errorType: "general",
      severity: initialError?.severity || "medium",
      stepsToReproduce: "",
      expectedBehavior: "",
      actualBehavior: initialError?.message || "",
      browserInfo: `${navigator.userAgent}`,
      additionalContext: initialError?.stack || ""
    }
  });

  const submitBugReport = useMutation({
    mutationFn: async (data: BugReportForm) => {
      const bugReportData = {
        ...data,
        userId: user?.id,
        accountId: user?.accountId,
        source: initialError?.source || window.location.pathname,
        userAgent: navigator.userAgent,
        ipAddress: "auto-detected",
        metadata: {
          url: window.location.href,
          timestamp: new Date().toISOString(),
          userAgent: navigator.userAgent,
          viewport: `${window.innerWidth}x${window.innerHeight}`,
          stackTrace: initialError?.stack,
          browserInfo: data.browserInfo,
          userRole: user?.role,
          sessionId: sessionStorage.getItem('sessionId') || 'unknown'
        }
      };

      return apiRequest('/api/error-logs', {
        method: 'POST',
        body: JSON.stringify(bugReportData)
      });
    },
    onSuccess: () => {
      toast({
        title: "Bug Report Submitted",
        description: "Thank you for reporting this issue. Our team will investigate and respond shortly.",
      });
      queryClient.invalidateQueries({ queryKey: ['/api/error-logs'] });
      form.reset();
      onClose();
    },
    onError: (error: any) => {
      toast({
        title: "Submission Failed",
        description: "Unable to submit bug report. Please try again or contact support.",
        variant: "destructive"
      });
      console.error("Bug report submission error:", error);
    }
  });

  const handleSubmit = async (data: BugReportForm) => {
    setIsSubmitting(true);
    try {
      await submitBugReport.mutateAsync(data);
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleClose = () => {
    if (!isSubmitting) {
      form.reset();
      onClose();
    }
  };

  const selectedErrorType = form.watch("errorType");
  const selectedSeverity = form.watch("severity");
  const ErrorIcon = errorTypeIcons[selectedErrorType];

  return (
    <Dialog open={isOpen} onOpenChange={handleClose}>
      <DialogContent className="max-w-2xl max-h-[80vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="flex items-center space-x-2">
            <Bug className="h-5 w-5 text-red-500" />
            <span>Report a Bug</span>
          </DialogTitle>
          <DialogDescription>
            Help us improve the platform by reporting bugs and issues. Your feedback is valuable for maintaining system quality.
          </DialogDescription>
        </DialogHeader>

        <Form {...form}>
          <form onSubmit={form.handleSubmit(handleSubmit)} className="space-y-6">
            {initialError && (
              <Alert className="border-orange-200 bg-orange-50">
                <AlertTriangle className="h-4 w-4 text-orange-600" />
                <AlertDescription className="text-orange-800">
                  An error was automatically detected. The form has been pre-filled with error details.
                </AlertDescription>
              </Alert>
            )}

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <FormField
                control={form.control}
                name="errorType"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Error Type</FormLabel>
                    <Select onValueChange={field.onChange} defaultValue={field.value}>
                      <FormControl>
                        <SelectTrigger>
                          <SelectValue placeholder="Select error type" />
                        </SelectTrigger>
                      </FormControl>
                      <SelectContent>
                        <SelectItem value="ui">UI/Interface Issue</SelectItem>
                        <SelectItem value="api">API/Backend Error</SelectItem>
                        <SelectItem value="validation">Data Validation</SelectItem>
                        <SelectItem value="security">Security Concern</SelectItem>
                        <SelectItem value="performance">Performance Issue</SelectItem>
                        <SelectItem value="general">General Bug</SelectItem>
                      </SelectContent>
                    </Select>
                  </FormItem>
                )}
              />

              <FormField
                control={form.control}
                name="severity"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Severity Level</FormLabel>
                    <Select onValueChange={field.onChange} defaultValue={field.value}>
                      <FormControl>
                        <SelectTrigger>
                          <SelectValue placeholder="Select severity" />
                        </SelectTrigger>
                      </FormControl>
                      <SelectContent>
                        <SelectItem value="low">Low - Minor inconvenience</SelectItem>
                        <SelectItem value="medium">Medium - Affects functionality</SelectItem>
                        <SelectItem value="high">High - Blocks important features</SelectItem>
                        <SelectItem value="critical">Critical - System unusable</SelectItem>
                      </SelectContent>
                    </Select>
                  </FormItem>
                )}
              />
            </div>

            <div className="flex items-center space-x-3 p-3 bg-gray-50 rounded-lg">
              <ErrorIcon className="h-5 w-5 text-gray-600" />
              <span className="text-sm font-medium">Type: {selectedErrorType}</span>
              <Badge className={severityColors[selectedSeverity]}>
                {selectedSeverity.toUpperCase()}
              </Badge>
            </div>

            <FormField
              control={form.control}
              name="title"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Bug Title</FormLabel>
                  <FormControl>
                    <Input placeholder="Brief summary of the issue" {...field} />
                  </FormControl>
                  <FormDescription>
                    Provide a clear, concise title that describes the problem
                  </FormDescription>
                </FormItem>
              )}
            />

            <FormField
              control={form.control}
              name="description"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Detailed Description</FormLabel>
                  <FormControl>
                    <Textarea 
                      placeholder="Describe the bug in detail..."
                      className="min-h-[100px]"
                      {...field}
                    />
                  </FormControl>
                  <FormDescription>
                    Include as much detail as possible about what went wrong
                  </FormDescription>
                </FormItem>
              )}
            />

            <FormField
              control={form.control}
              name="stepsToReproduce"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Steps to Reproduce</FormLabel>
                  <FormControl>
                    <Textarea 
                      placeholder="1. First, I did...&#10;2. Then I clicked...&#10;3. The error occurred when..."
                      className="min-h-[100px]"
                      {...field}
                    />
                  </FormControl>
                  <FormDescription>
                    List the exact steps to reproduce this bug
                  </FormDescription>
                </FormItem>
              )}
            />

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <FormField
                control={form.control}
                name="expectedBehavior"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Expected Behavior</FormLabel>
                    <FormControl>
                      <Textarea 
                        placeholder="What should have happened?"
                        className="min-h-[80px]"
                        {...field}
                      />
                    </FormControl>
                  </FormItem>
                )}
              />

              <FormField
                control={form.control}
                name="actualBehavior"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Actual Behavior</FormLabel>
                    <FormControl>
                      <Textarea 
                        placeholder="What actually happened?"
                        className="min-h-[80px]"
                        {...field}
                      />
                    </FormControl>
                  </FormItem>
                )}
              />
            </div>

            <FormField
              control={form.control}
              name="additionalContext"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Additional Context</FormLabel>
                  <FormControl>
                    <Textarea 
                      placeholder="Any additional information, error messages, or context..."
                      className="min-h-[80px]"
                      {...field}
                    />
                  </FormControl>
                  <FormDescription>
                    Include any error messages, console logs, or additional context
                  </FormDescription>
                </FormItem>
              )}
            />

            <DialogFooter className="flex justify-between">
              <Button 
                type="button" 
                variant="outline" 
                onClick={handleClose}
                disabled={isSubmitting}
              >
                Cancel
              </Button>
              <Button 
                type="submit" 
                disabled={isSubmitting}
                className="bg-red-600 hover:bg-red-700"
              >
                {isSubmitting ? "Submitting..." : "Submit Bug Report"}
              </Button>
            </DialogFooter>
          </form>
        </Form>
      </DialogContent>
    </Dialog>
  );
}