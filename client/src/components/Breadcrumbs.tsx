import { Home, ChevronRight } from "lucide-react";
import { Link, useLocation } from "wouter";
import { cn } from "@/lib/utils";

export interface BreadcrumbItem {
  label: string;
  href?: string;
}

interface BreadcrumbsProps {
  items?: BreadcrumbItem[];
  className?: string;
}

// Route mapping for automatic breadcrumb generation
const routeLabels: Record<string, string> = {
  '/': 'Dashboard',
  '/item-banks': 'Item Banks',
  '/quiz-manager': 'Quiz Manager',
  '/assignments': 'Assignments',
  '/live-exams': 'Live Exams',
  '/analytics': 'Analytics',
  '/ml-analytics': 'ML Analytics',
  '/cat-exams': 'CAT Exam Manager',
  '/cat-exam-builder': 'CAT Exam Builder',
  '/study-resources': 'Study Resources',
  '/user-management': 'User Management',
  '/settings': 'Settings',
  '/section-management': 'Section Management',
  '/proctoring-security': 'Proctoring & Security',
  '/announcements': 'Announcements',
  '/question-feedback': 'Question Feedback',
  '/question-flagging': 'Question Flagging',
  '/bug-reporting': 'Bug Reports',
  '/notification-settings': 'Notifications',
  '/student-dashboard': 'Student Dashboard',
  '/admin/account-settings': 'Account Settings',
  '/admin/role-settings': 'Role & Tier Management',
  '/admin/system-settings': 'System Settings',
  '/admin/database-management': 'Database Management',
  '/admin/user-activity': 'User Activity',
};

export default function Breadcrumbs({ items, className }: BreadcrumbsProps) {
  const [location] = useLocation();

  // Generate breadcrumbs from current location if not provided
  const breadcrumbItems = items || generateBreadcrumbs(location);

  return (
    <nav
      aria-label="Breadcrumb"
      className={cn(
        "sticky top-32 lg:top-16 left-0 lg:left-64 right-0 z-40 flex items-center px-4 md:px-6 py-2 bg-white/95 dark:bg-gray-900/95 backdrop-blur-md border-b border-gray-200/50 dark:border-gray-800/50",
        className
      )}
      data-testid="breadcrumbs"
    >
      <ol className="flex items-center gap-1.5 flex-wrap">
        {/* Home link */}
        <li>
          <Link
            href="/"
            className="flex items-center px-3 py-1.5 rounded-full text-xs text-gray-600 dark:text-gray-400 hover:bg-gray-100 dark:hover:bg-gray-800 hover:text-gray-900 dark:hover:text-white transition-all duration-300"
            aria-label="Dashboard"
            data-testid="breadcrumb-home"
          >
            <Home className="h-3.5 w-3.5" aria-hidden="true" />
            <span className="sr-only">Dashboard</span>
          </Link>
        </li>

        {breadcrumbItems.map((item, index) => {
          const isLast = index === breadcrumbItems.length - 1;

          return (
            <li key={index} className="flex items-center gap-1.5">
              <ChevronRight
                className="h-3.5 w-3.5 text-gray-400 dark:text-gray-600"
                aria-hidden="true"
              />
              {isLast || !item.href ? (
                <span
                  className="px-3 py-1.5 text-xs font-medium text-gray-900 dark:text-white bg-gray-100 dark:bg-gray-800 rounded-full"
                  aria-current="page"
                  data-testid={`breadcrumb-current`}
                >
                  {item.label}
                </span>
              ) : (
                <Link
                  href={item.href}
                  className="px-3 py-1.5 text-xs text-gray-600 dark:text-gray-400 hover:bg-gray-100 dark:hover:bg-gray-800 hover:text-gray-900 dark:hover:text-white rounded-full transition-all duration-300"
                  data-testid={`breadcrumb-link-${index}`}
                >
                  {item.label}
                </Link>
              )}
            </li>
          );
        })}
      </ol>
    </nav>
  );
}

// Helper function to generate breadcrumbs from route
function generateBreadcrumbs(path: string): BreadcrumbItem[] {
  // Remove trailing slash
  const cleanPath = path.replace(/\/$/, '');
  
  // Dashboard home route should show "Dashboard"
  if (cleanPath === '' || cleanPath === '/') {
    return [{ label: 'Dashboard' }];
  }

  // Check for direct route match first
  if (routeLabels[cleanPath]) {
    return [{ label: routeLabels[cleanPath] }];
  }

  // Handle nested routes
  const segments = cleanPath.split('/').filter(Boolean);
  const breadcrumbs: BreadcrumbItem[] = [];
  let currentPath = '';

  segments.forEach((segment, index) => {
    currentPath += `/${segment}`;
    const label = routeLabels[currentPath] || formatSegment(segment);
    const isLast = index === segments.length - 1;

    breadcrumbs.push({
      label,
      href: isLast ? undefined : currentPath,
    });
  });

  return breadcrumbs;
}

// Format segment for display if no label mapping exists
function formatSegment(segment: string): string {
  return segment
    .split('-')
    .map(word => word.charAt(0).toUpperCase() + word.slice(1))
    .join(' ');
}
