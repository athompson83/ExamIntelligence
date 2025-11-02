import { LucideIcon } from "lucide-react";
import { cn } from "@/lib/utils";

export interface StatCardProps {
  title: string;
  value: string | number;
  subtitle?: string;
  gradient: "blue" | "green" | "orange" | "purple" | "red" | "primary";
  icon: LucideIcon;
  onClick?: () => void;
  className?: string;
  testId?: string;
}

export function StatCard({
  title,
  value,
  subtitle,
  gradient,
  icon: Icon,
  onClick,
  className,
  testId,
}: StatCardProps) {
  const gradientClass = `gradient-${gradient}`;
  const isClickable = !!onClick;

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (isClickable && (e.key === "Enter" || e.key === " ")) {
      e.preventDefault();
      onClick();
    }
  };

  return (
    <div
      data-testid={testId}
      role={isClickable ? "button" : undefined}
      tabIndex={isClickable ? 0 : undefined}
      onClick={onClick}
      onKeyDown={handleKeyDown}
      className={cn(
        "relative overflow-hidden rounded-2xl shadow-lg min-h-[140px] p-4 text-white transition-all duration-300",
        gradientClass,
        isClickable && "cursor-pointer hover:scale-105 hover:shadow-2xl focus:outline-none focus:ring-4 focus:ring-white/50",
        className
      )}
      aria-label={isClickable ? `${title}: ${value}. Click to view details` : `${title}: ${value}`}
    >
      {/* Background Icon */}
      <div className="absolute top-4 right-4 opacity-20">
        <Icon className="w-16 h-16" aria-hidden="true" />
      </div>

      {/* Content */}
      <div className="relative z-10">
        <p className="text-sm font-semibold text-white/80 uppercase tracking-wide mb-2">
          {title}
        </p>
        <p className="text-4xl font-bold text-white mb-3">
          {value}
        </p>
        {subtitle && (
          <div className="flex items-center gap-1 bg-white/20 backdrop-blur-sm rounded-full px-3 py-1 w-fit">
            <span className="text-xs font-semibold text-white">
              {subtitle}
            </span>
          </div>
        )}
      </div>
    </div>
  );
}
