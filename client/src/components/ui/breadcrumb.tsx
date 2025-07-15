import { Home, ChevronRight } from "lucide-react";
import { Link } from "wouter";
import { cn } from "@/lib/utils";

export interface BreadcrumbItemProps {
  label: string;
  href?: string;
}

interface BreadcrumbProps {
  items?: BreadcrumbItemProps[];
  className?: string;
}

export function Breadcrumb({ items, className = "", children }: BreadcrumbProps & { children?: React.ReactNode }) {
  // If items are provided, use the old structure
  if (items && Array.isArray(items)) {
    return (
      <nav className={`flex items-center space-x-2 text-sm text-muted-foreground mb-4 ${className}`}>
        <Link href="/" className="flex items-center hover:text-primary transition-colors">
          <Home className="h-4 w-4 mr-1" />
          Dashboard
        </Link>
        
        {items.map((item, index) => (
          <div key={index} className="flex items-center space-x-2">
            <ChevronRight className="h-4 w-4" />
            {item.href ? (
              <Link href={item.href} className="hover:text-primary transition-colors">
                {item.label}
              </Link>
            ) : (
              <span className="text-foreground font-medium">{item.label}</span>
            )}
          </div>
        ))}
      </nav>
    );
  }
  
  // If children are provided, use the new structure
  return (
    <nav className={cn("flex items-center space-x-2 text-sm text-muted-foreground", className)}>
      {children}
    </nav>
  );
}

// Additional breadcrumb components for compatibility
export function BreadcrumbList({ className, children, ...props }) {
  return (
    <ol className={cn("flex flex-wrap items-center gap-1.5 break-words text-sm text-muted-foreground sm:gap-2.5", className)} {...props}>
      {children}
    </ol>
  );
}

export function BreadcrumbItem({ className, children, ...props }) {
  return (
    <li className={cn("inline-flex items-center gap-1.5", className)} {...props}>
      {children}
    </li>
  );
}

export function BreadcrumbSeparator({ className, children, ...props }) {
  return (
    <li className={cn("[&>svg]:size-3.5", className)} {...props}>
      {children ?? <ChevronRight />}
    </li>
  );
}

export function BreadcrumbPage({ className, children, ...props }) {
  return (
    <span className={cn("font-normal text-foreground", className)} {...props}>
      {children}
    </span>
  );
}