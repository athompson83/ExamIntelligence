import { cn } from "@/lib/utils";

interface LoadingSpinnerProps {
  size?: "sm" | "md" | "lg";
  className?: string;
}

export function LoadingSpinner({ size = "md", className }: LoadingSpinnerProps) {
  const sizeClasses = {
    sm: "w-4 h-4 border-2",
    md: "w-8 h-8 border-4", 
    lg: "w-12 h-12 border-4"
  };

  return (
    <div
      className={cn(
        "animate-spin rounded-full border-primary border-t-transparent",
        sizeClasses[size],
        className
      )}
      aria-label="Loading"
    />
  );
}

interface LoadingStateProps {
  message?: string;
  size?: "sm" | "md" | "lg";
  className?: string;
}

export function LoadingState({ 
  message = "Loading...", 
  size = "md", 
  className 
}: LoadingStateProps) {
  return (
    <div className={cn("flex flex-col items-center justify-center gap-3 p-8", className)}>
      <LoadingSpinner size={size} />
      <p className="text-sm text-muted-foreground">{message}</p>
    </div>
  );
}

export function PageLoadingState() {
  return (
    <div className="min-h-screen flex items-center justify-center">
      <LoadingState message="Loading application..." size="lg" />
    </div>
  );
}

export default LoadingSpinner;