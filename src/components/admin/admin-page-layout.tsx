'use client';

import { ReactNode } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Separator } from '@/components/ui/separator';
import { cn } from '@/lib/utils';
import { ArrowLeft, RefreshCw } from 'lucide-react';
import { useRouter } from 'next/navigation';

interface AdminPageLayoutProps {
  children: ReactNode;
  title: string;
  description?: string;
  showBackButton?: boolean;
  backUrl?: string;
  actions?: ReactNode;
  headerContent?: ReactNode;
  className?: string;
  contentClassName?: string;
  variant?: 'default' | 'card' | 'full';
  loading?: boolean;
  onRefresh?: () => void;
}

export function AdminPageLayout({
  children,
  title,
  description,
  showBackButton = false,
  backUrl,
  actions,
  headerContent,
  className,
  contentClassName,
  variant = 'default',
  loading = false,
  onRefresh
}: AdminPageLayoutProps) {
  const router = useRouter();

  const handleBack = () => {
    if (backUrl) {
      router.push(backUrl);
    } else {
      router.back();
    }
  };

  const PageHeader = () => (
    <div className="space-y-4 w-full max-w-full overflow-x-hidden">
      {/* Header with title and actions */}
      <div className="flex flex-col sm:flex-row sm:items-start sm:justify-between gap-3 sm:gap-4 w-full max-w-full">
        <div className="flex items-start gap-3 min-w-0 flex-1 max-w-full">
          {showBackButton && (
            <Button
              variant="ghost"
              size="sm"
              onClick={handleBack}
              className="h-8 w-8 p-0 hover:bg-gray-100 dark:hover:bg-gray-800 flex-shrink-0 mt-0.5"
            >
              <ArrowLeft className="h-4 w-4" />
            </Button>
          )}
          <div className="min-w-0 flex-1 max-w-full">
            <h1 className="text-xl sm:text-2xl font-bold tracking-tight text-gray-900 dark:text-white truncate max-w-full">
              {title}
            </h1>
            {description && (
              <p className="text-sm text-muted-foreground mt-0.5 sm:mt-1 line-clamp-2 max-w-full">
                {description}
              </p>
            )}
          </div>
        </div>
        
        {/* Actions */}
        {(actions || onRefresh) && (
          <div className="flex items-center gap-1.5 sm:gap-2 flex-shrink-0">
            {onRefresh && (
              <Button
                variant="outline"
                size="sm"
                onClick={onRefresh}
                disabled={loading}
                className="h-8 px-2 sm:px-3"
              >
                <RefreshCw className={cn("h-3.5 w-3.5 sm:h-4 sm:w-4", loading && "animate-spin")} />
                <span className="hidden sm:inline ml-1.5">Refresh</span>
              </Button>
            )}
            {actions}
          </div>
        )}
      </div>

      {/* Additional header content */}
      {headerContent && (
        <>
          <Separator />
          <div>{headerContent}</div>
        </>
      )}
    </div>
  );

  // Full variant - no padding, no card
  if (variant === 'full') {
    return (
      <div className={cn("min-h-full", className)}>
        <div className="p-4 sm:p-6">
          <PageHeader />
        </div>
        <div className={cn("flex-1", contentClassName)}>
          {children}
        </div>
      </div>
    );
  }

  // Card variant - content wrapped in card
  if (variant === 'card') {
    return (
      <div className={cn("p-4 sm:p-6 space-y-6", className)}>
        <PageHeader />
        <Card className="border-0 shadow-sm">
          <CardContent className={cn("p-6", contentClassName)}>
            {children}
          </CardContent>
        </Card>
      </div>
    );
  }

  // Default variant - standard padding with improved spacing
  return (
    <div className={cn("p-3 sm:p-4 lg:p-6 space-y-4 sm:space-y-6 w-full max-w-full overflow-x-hidden min-h-fit", className)}>
      <PageHeader />
      <div className={cn("space-y-4 sm:space-y-6 w-full max-w-full overflow-x-hidden pb-6", contentClassName)}>
        {children}
      </div>
    </div>
  );
}

// Stats Cards Component for consistent metrics display
interface StatsCardProps {
  title: string;
  value: string | number;
  description?: string;
  icon?: ReactNode;
  trend?: {
    value: number;
    isPositive: boolean;
  };
  className?: string;
}

export function StatsCard({
  title,
  value,
  description,
  icon,
  trend,
  className
}: StatsCardProps) {
  return (
    <Card className={cn("hover:shadow-md transition-shadow", className)}>
      <CardContent className="p-4">
        <div className="flex items-start justify-between mb-3">
          <div className="space-y-1 min-w-0 flex-1">
            <p className="text-xs font-medium text-muted-foreground truncate">
              {title}
            </p>
            <p className="text-xl font-bold text-gray-900 dark:text-white">
              {value}
            </p>
            {description && (
              <p className="text-xs text-muted-foreground">
                {description}
              </p>
            )}
          </div>
          {icon && (
            <div className="p-1.5 bg-gray-100 dark:bg-gray-800 rounded-md flex-shrink-0 ml-2">
              <div className="h-4 w-4 text-gray-600 dark:text-gray-400">
                {icon}
              </div>
            </div>
          )}
        </div>
        {trend && (
          <div className="mt-2 flex items-center text-sm">
            <span className={cn(
              "font-medium px-1.5 py-0.5 rounded text-xs",
              trend.isPositive ? "text-green-700 bg-green-100 dark:text-green-400 dark:bg-green-900/30" : "text-red-700 bg-red-100 dark:text-red-400 dark:bg-red-900/30"
            )}>
              {trend.isPositive ? '+' : ''}{trend.value}%
            </span>
            <span className="text-muted-foreground ml-1.5 text-xs">
              dari bulan lalu
            </span>
          </div>
        )}
      </CardContent>
    </Card>
  );
}

// Filter Bar Component for consistent filtering UI
interface FilterBarProps {
  children: ReactNode;
  className?: string;
}

export function FilterBar({ children, className }: FilterBarProps) {
  return (
    <Card className={cn("border-0 shadow-sm", className)}>
      <CardContent className="p-4">
        <div className="flex flex-col sm:flex-row gap-4 items-start sm:items-center">
          {children}
        </div>
      </CardContent>
    </Card>
  );
}

// Action Bar Component for consistent action buttons
interface ActionBarProps {
  children: ReactNode;
  className?: string;
  align?: 'left' | 'right' | 'between';
}

export function ActionBar({ children, className, align = 'right' }: ActionBarProps) {
  const alignClasses = {
    left: 'justify-start',
    right: 'justify-end',
    between: 'justify-between'
  };

  return (
    <div className={cn(
      "flex items-center gap-2",
      alignClasses[align],
      className
    )}>
      {children}
    </div>
  );
}

// Empty State Component
interface EmptyStateProps {
  icon?: ReactNode;
  title: string;
  description?: string;
  action?: ReactNode;
  className?: string;
}

export function EmptyState({
  icon,
  title,
  description,
  action,
  className
}: EmptyStateProps) {
  return (
    <div className={cn(
      "flex flex-col items-center justify-center py-12 px-4 text-center",
      className
    )}>
      {icon && (
        <div className="h-12 w-12 text-muted-foreground mb-4">
          {icon}
        </div>
      )}
      <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-2">
        {title}
      </h3>
      {description && (
        <p className="text-sm text-muted-foreground mb-6 max-w-sm">
          {description}
        </p>
      )}
      {action}
    </div>
  );
}

// Loading State Component
interface LoadingStateProps {
  message?: string;
  className?: string;
}

export function LoadingState({ message = "Memuat data...", className }: LoadingStateProps) {
  return (
    <div className={cn(
      "flex flex-col items-center justify-center py-12 px-4",
      className
    )}>
      <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600 mb-4"></div>
      <p className="text-sm text-muted-foreground">{message}</p>
    </div>
  );
}