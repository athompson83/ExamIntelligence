import React from 'react';
import ContextualTooltip from './ContextualTooltip';
import { useAuth } from '@/hooks/useAuth';

interface SmartTooltipProps {
  id: string;
  title: string;
  content: string;
  type?: 'info' | 'warning' | 'success' | 'tip';
  position?: 'top' | 'bottom' | 'left' | 'right';
  trigger?: 'hover' | 'click' | 'focus' | 'manual';
  delay?: number;
  children: React.ReactNode;
  className?: string;
  showFor?: string[]; // User roles
  showOnPage?: string[]; // Page paths
  showOnce?: boolean; // Show only once per user
}

export default function SmartTooltip({
  showFor = [],
  showOnPage = [],
  showOnce = false,
  ...props
}: SmartTooltipProps) {
  const { user } = useAuth();

  // Role-based visibility
  if (showFor.length > 0 && (!user || !showFor.includes(user.role))) {
    return <>{props.children}</>;
  }

  // Page-based visibility
  if (showOnPage.length > 0) {
    const currentPath = window.location.pathname;
    const shouldShow = showOnPage.some(page => currentPath.includes(page));
    if (!shouldShow) {
      return <>{props.children}</>;
    }
  }

  // One-time visibility
  if (showOnce) {
    const shownKey = `tooltip-shown-${props.id}-${user?.id}`;
    const hasShown = localStorage.getItem(shownKey);
    if (hasShown) {
      return <>{props.children}</>;
    }
    
    // Mark as shown when tooltip is first created
    localStorage.setItem(shownKey, 'true');
  }

  return <ContextualTooltip {...props} />;
}

// Pre-configured tooltip components for common use cases
export const InfoTooltip = ({ children, ...props }: Omit<SmartTooltipProps, 'type'>) => (
  <SmartTooltip type="info" {...props}>
    {children}
  </SmartTooltip>
);

export const TipTooltip = ({ children, ...props }: Omit<SmartTooltipProps, 'type'>) => (
  <SmartTooltip type="tip" {...props}>
    {children}
  </SmartTooltip>
);

export const WarningTooltip = ({ children, ...props }: Omit<SmartTooltipProps, 'type'>) => (
  <SmartTooltip type="warning" {...props}>
    {children}
  </SmartTooltip>
);

export const SuccessTooltip = ({ children, ...props }: Omit<SmartTooltipProps, 'type'>) => (
  <SmartTooltip type="success" {...props}>
    {children}
  </SmartTooltip>
);

// Feature introduction tooltip for new features
export const FeatureTooltip = ({ children, ...props }: Omit<SmartTooltipProps, 'type' | 'showOnce'>) => (
  <SmartTooltip type="tip" showOnce={true} {...props}>
    {children}
  </SmartTooltip>
);

// Admin-only tooltip
export const AdminTooltip = ({ children, ...props }: Omit<SmartTooltipProps, 'showFor'>) => (
  <SmartTooltip showFor={['admin', 'super_admin']} {...props}>
    {children}
  </SmartTooltip>
);

// Teacher-only tooltip
export const TeacherTooltip = ({ children, ...props }: Omit<SmartTooltipProps, 'showFor'>) => (
  <SmartTooltip showFor={['teacher', 'admin', 'super_admin']} {...props}>
    {children}
  </SmartTooltip>
);

// Student-only tooltip
export const StudentTooltip = ({ children, ...props }: Omit<SmartTooltipProps, 'showFor'>) => (
  <SmartTooltip showFor={['student']} {...props}>
    {children}
  </SmartTooltip>
);