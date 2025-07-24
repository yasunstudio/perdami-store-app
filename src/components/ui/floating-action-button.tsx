'use client'

import { Button } from '@/components/ui/button'
import { cn } from '@/lib/utils'
import { ReactNode } from 'react'

interface FloatingActionButtonProps {
  onClick: () => void
  icon: ReactNode
  children?: ReactNode
  className?: string
  position?: 'bottom-right' | 'bottom-left' | 'bottom-center'
  disabled?: boolean
  title?: string
}

export function FloatingActionButton({
  onClick,
  icon,
  children,
  className,
  position = 'bottom-right',
  disabled = false,
  title
}: FloatingActionButtonProps) {
  const positionClasses = {
    'bottom-right': 'bottom-6 right-6 sm:bottom-8 sm:right-8',
    'bottom-left': 'bottom-6 left-6 sm:bottom-8 sm:left-8', 
    'bottom-center': 'bottom-6 left-1/2 transform -translate-x-1/2 sm:bottom-8'
  }

  return (
    <Button
      onClick={onClick}
      disabled={disabled}
      title={title}
      className={cn(
        // Base styles - ensure visibility
        'fixed z-[60] h-16 w-16 rounded-full shadow-lg hover:shadow-xl transition-all duration-200',
        'bg-primary hover:bg-primary/90 text-primary-foreground',
        'focus:ring-2 focus:ring-primary focus:ring-offset-2',
        // Ensure it's not hidden by overflow
        'pointer-events-auto',
        // Size responsiveness
        'sm:h-14 sm:w-14',
        // Position
        positionClasses[position],
        // State
        disabled && 'opacity-50 cursor-not-allowed',
        className
      )}
      size="icon"
    >
      <div className="flex items-center gap-2">
        {icon}
        {children && (
          <span className="hidden sm:inline-block text-sm font-medium">
            {children}
          </span>
        )}
      </div>
    </Button>
  )
}
