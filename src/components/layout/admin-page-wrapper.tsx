'use client';

import { cn } from '@/lib/utils';
import { ReactNode } from 'react';

interface AdminPageWrapperProps {
  children: ReactNode;
  className?: string;
  title?: string;
  description?: string;
  maxWidth?: 'full' | '7xl' | '6xl' | '5xl' | '4xl';
  padding?: 'none' | 'sm' | 'md' | 'lg';
  showHeader?: boolean;
  headerActions?: ReactNode;
}

export function AdminPageWrapper({
  children,
  className,
  title,
  description,
  maxWidth = 'full',
  padding = 'lg',
  showHeader = true,
  headerActions,
}: AdminPageWrapperProps) {
  const maxWidthClasses = {
    'full': 'max-w-full',
    '7xl': 'max-w-7xl',
    '6xl': 'max-w-6xl',
    '5xl': 'max-w-5xl',
    '4xl': 'max-w-4xl',
  };

  const paddingClasses = {
    'none': 'p-0',
    'sm': 'p-3 sm:p-4',
    'md': 'p-4 sm:p-6',
    'lg': 'p-4 sm:p-6 lg:p-8',
  };

  return (
    <div className={cn(
      'min-h-full flex flex-col',
      paddingClasses[padding],
      className
    )}>
      {/* Page Header */}
      {showHeader && (title || description || headerActions) && (
        <div className="mb-6 sm:mb-8">
          <div className={cn('mx-auto', maxWidthClasses[maxWidth])}>
            <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
              {/* Title and Description */}
              <div className="min-w-0 flex-1">
                {title && (
                  <h1 className="text-2xl sm:text-3xl font-bold tracking-tight text-gray-900 dark:text-white">
                    {title}
                  </h1>
                )}
                {description && (
                  <p className="mt-2 text-sm text-gray-600 dark:text-gray-400">
                    {description}
                  </p>
                )}
              </div>
              
              {/* Header Actions */}
              {headerActions && (
                <div className="flex-shrink-0">
                  {headerActions}
                </div>
              )}
            </div>
          </div>
        </div>
      )}

      {/* Page Content */}
      <div className={cn('flex-1', maxWidthClasses[maxWidth], 'mx-auto w-full')}>
        {children}
      </div>
    </div>
  );
}

// Content Section Component for consistent spacing
interface AdminContentSectionProps {
  children: ReactNode;
  className?: string;
  title?: string;
  description?: string;
  spacing?: 'none' | 'sm' | 'md' | 'lg';
}

export function AdminContentSection({
  children,
  className,
  title,
  description,
  spacing = 'md',
}: AdminContentSectionProps) {
  const spacingClasses = {
    'none': 'space-y-0',
    'sm': 'space-y-4',
    'md': 'space-y-6',
    'lg': 'space-y-8',
  };

  return (
    <div className={cn(spacingClasses[spacing], className)}>
      {/* Section Header */}
      {(title || description) && (
        <div className="space-y-2">
          {title && (
            <h2 className="text-lg sm:text-xl font-semibold text-gray-900 dark:text-white">
              {title}
            </h2>
          )}
          {description && (
            <p className="text-sm text-gray-600 dark:text-gray-400">
              {description}
            </p>
          )}
        </div>
      )}
      
      {/* Section Content */}
      {children}
    </div>
  );
}

// Card Component for consistent admin content
interface AdminCardProps {
  children: ReactNode;
  className?: string;
  title?: string;
  description?: string;
  headerActions?: ReactNode;
  padding?: 'none' | 'sm' | 'md' | 'lg';
}

export function AdminCard({
  children,
  className,
  title,
  description,
  headerActions,
  padding = 'md',
}: AdminCardProps) {
  const paddingClasses = {
    'none': 'p-0',
    'sm': 'p-3 sm:p-4',
    'md': 'p-4 sm:p-6',
    'lg': 'p-6 sm:p-8',
  };

  return (
    <div className={cn(
      'bg-white dark:bg-gray-800 rounded-lg shadow-sm border border-gray-200 dark:border-gray-700',
      className
    )}>
      {/* Card Header */}
      {(title || description || headerActions) && (
        <div className={cn(
          'border-b border-gray-200 dark:border-gray-700',
          padding === 'none' ? 'p-4 sm:p-6' : paddingClasses[padding]
        )}>
          <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
            <div className="min-w-0 flex-1">
              {title && (
                <h3 className="text-lg font-semibold text-gray-900 dark:text-white">
                  {title}
                </h3>
              )}
              {description && (
                <p className="mt-1 text-sm text-gray-600 dark:text-gray-400">
                  {description}
                </p>
              )}
            </div>
            {headerActions && (
              <div className="flex-shrink-0">
                {headerActions}
              </div>
            )}
          </div>
        </div>
      )}
      
      {/* Card Content */}
      <div className={padding === 'none' ? '' : paddingClasses[padding]}>
        {children}
      </div>
    </div>
  );
}

// Grid Component for responsive layouts
interface AdminGridProps {
  children: ReactNode;
  cols?: {
    default?: number;
    sm?: number;
    md?: number;
    lg?: number;
    xl?: number;
  };
  gap?: 'sm' | 'md' | 'lg';
  className?: string;
}

export function AdminGrid({
  children,
  cols = { default: 1, sm: 2, lg: 3, xl: 4 },
  gap = 'md',
  className,
}: AdminGridProps) {
  const gapClasses = {
    'sm': 'gap-3 sm:gap-4',
    'md': 'gap-4 sm:gap-6',
    'lg': 'gap-6 sm:gap-8',
  };

  const gridCols = [
    cols.default && `grid-cols-${cols.default}`,
    cols.sm && `sm:grid-cols-${cols.sm}`,
    cols.md && `md:grid-cols-${cols.md}`,
    cols.lg && `lg:grid-cols-${cols.lg}`,
    cols.xl && `xl:grid-cols-${cols.xl}`,
  ].filter(Boolean).join(' ');

  return (
    <div className={cn(
      'grid',
      gridCols,
      gapClasses[gap],
      className
    )}>
      {children}
    </div>
  );
}
