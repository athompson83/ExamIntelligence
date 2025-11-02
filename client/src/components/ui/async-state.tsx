import { ReactNode } from "react";
import { AlertTriangle, RefreshCw, Inbox } from "lucide-react";
import { Button } from "@/components/ui/button";
import LoadingSpinner from "@/components/ui/loading-spinner";

export interface AsyncStateProps {
  isLoading: boolean;
  isError: boolean;
  error?: Error | null;
  isEmpty?: boolean;
  emptyMessage?: string;
  emptyAction?: {
    label: string;
    onClick: () => void;
  };
  onRetry?: () => void;
  loadingComponent?: ReactNode;
  children: ReactNode;
}

export function AsyncState({
  isLoading,
  isError,
  error,
  isEmpty = false,
  emptyMessage = "No data available",
  emptyAction,
  onRetry,
  loadingComponent,
  children,
}: AsyncStateProps) {
  if (isLoading) {
    if (loadingComponent) {
      return <>{loadingComponent}</>;
    }

    return (
      <div className="flex items-center justify-center py-12" data-testid="async-state-loading">
        <div className="text-center space-y-4">
          <LoadingSpinner size="lg" className="mx-auto text-primary" />
          <p className="text-sm text-muted-foreground font-medium">Loading...</p>
        </div>
      </div>
    );
  }

  if (isError) {
    return (
      <div className="flex items-center justify-center py-12" data-testid="async-state-error">
        <div className="text-center space-y-4 max-w-md">
          <div className="w-20 h-20 mx-auto rounded-full bg-gradient-to-r from-red-500 to-red-600 flex items-center justify-center shadow-lg">
            <AlertTriangle className="h-10 w-10 text-white" />
          </div>
          <div className="space-y-2">
            <h3 className="text-xl font-bold text-foreground">Something went wrong</h3>
            <p className="text-sm text-muted-foreground">
              {error?.message || "An unexpected error occurred. Please try again."}
            </p>
          </div>
          {onRetry && (
            <Button
              onClick={onRetry}
              className="bg-gradient-to-r from-blue-600 to-blue-500 text-white hover:shadow-xl hover:scale-105 transition-all duration-300 rounded-xl"
              data-testid="button-retry"
            >
              <RefreshCw className="mr-2 h-4 w-4" />
              Try Again
            </Button>
          )}
        </div>
      </div>
    );
  }

  if (isEmpty) {
    return (
      <div className="flex items-center justify-center py-12" data-testid="async-state-empty">
        <div className="text-center space-y-4 max-w-md">
          <div className="w-20 h-20 mx-auto rounded-full bg-gradient-to-r from-blue-600 to-blue-500 flex items-center justify-center shadow-lg">
            <Inbox className="h-10 w-10 text-white" />
          </div>
          <div className="space-y-2">
            <h3 className="text-xl font-bold text-foreground">No Data Yet</h3>
            <p className="text-base text-muted-foreground">{emptyMessage}</p>
          </div>
          {emptyAction && (
            <Button
              onClick={emptyAction.onClick}
              className="bg-gradient-to-r from-blue-600 to-blue-500 text-white hover:shadow-xl hover:scale-105 transition-all duration-300 rounded-xl"
              data-testid="button-empty-action"
            >
              {emptyAction.label}
            </Button>
          )}
        </div>
      </div>
    );
  }

  return <>{children}</>;
}

export function AsyncStateShimmer({ count = 3 }: { count?: number }) {
  return (
    <div className="space-y-4" data-testid="async-state-shimmer">
      {Array.from({ length: count }).map((_, i) => (
        <div key={i} className="relative overflow-hidden rounded-2xl h-24 bg-gray-200 dark:bg-gray-700">
          <div className="h-full w-full bg-gradient-to-r from-gray-200 via-gray-300 to-gray-200 dark:from-gray-700 dark:via-gray-600 dark:to-gray-700 animate-pulse" />
          <div className="absolute inset-0 -translate-x-full animate-[shimmer_2s_infinite] bg-gradient-to-r from-transparent via-white/60 dark:via-white/10 to-transparent" />
        </div>
      ))}
    </div>
  );
}

export function AsyncStateCardShimmer() {
  return (
    <div className="rounded-2xl shadow-lg border-0 overflow-hidden" data-testid="async-state-card-shimmer">
      <div className="relative overflow-hidden h-20 bg-gradient-to-r from-blue-600 to-blue-500">
        <div className="absolute inset-0 -translate-x-full animate-[shimmer_2s_infinite] bg-gradient-to-r from-transparent via-white/30 to-transparent" />
      </div>
      <div className="p-6 space-y-4">
        {Array.from({ length: 3 }).map((_, i) => (
          <div key={i} className="relative overflow-hidden rounded-lg h-16 bg-gray-200 dark:bg-gray-700">
            <div className="h-full w-full bg-gradient-to-r from-gray-200 via-gray-300 to-gray-200 dark:from-gray-700 dark:via-gray-600 dark:to-gray-700 animate-pulse" />
            <div className="absolute inset-0 -translate-x-full animate-[shimmer_2s_infinite] bg-gradient-to-r from-transparent via-white/60 dark:via-white/10 to-transparent" />
          </div>
        ))}
      </div>
    </div>
  );
}
