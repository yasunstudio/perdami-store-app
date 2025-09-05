'use client';

import React, { useRef, useEffect, useState } from 'react';
import Link from 'next/link';
import { usePathname, useRouter } from 'next/navigation';
import { cn } from '@/lib/utils';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { ChevronRight } from 'lucide-react';
import { NavigationItemProps } from '@/types/sidebar';
import { useSidebar } from '../admin-sidebar';

export const NavigationItem: React.FC<NavigationItemProps & {
  shouldShowExpanded?: boolean;
  onMobileMenuClose?: () => void;
}> = ({
  item,
  isActive,
  isExpanded = false,
  onToggleExpanded,
  onNavigate,
  shouldShowExpanded = true,
  onMobileMenuClose,
  className
}) => {
  const pathname = usePathname();
  const router = useRouter();
  const { isCollapsed, isMobileMenuOpen } = useSidebar();
  
  // Local state for submenu
  const [showSubmenu, setShowSubmenu] = useState(false);
  const [submenuPosition, setSubmenuPosition] = useState({ top: 0, left: 0 });
  const hoverTimeoutRef = useRef<NodeJS.Timeout | null>(null);
  
  const hasChildren = item.children && item.children.length > 0;
  const Icon = item.icon;

  // Detect screen size
  const [screenSize, setScreenSize] = useState<'mobile' | 'tablet' | 'desktop'>('desktop');
  
  useEffect(() => {
    const handleResize = () => {
      const width = window.innerWidth;
      if (width < 768) {
        setScreenSize('mobile');
      } else if (width < 1024) {
        setScreenSize('tablet');
      } else {
        setScreenSize('desktop');
      }
    };

    handleResize();
    window.addEventListener('resize', handleResize);
    return () => {
      window.removeEventListener('resize', handleResize);
      if (hoverTimeoutRef.current) {
        clearTimeout(hoverTimeoutRef.current);
      }
    };
  }, []);

  const isActiveItem = (href: string) => {
    if (!pathname) return false;
    
    // Exact match for admin root
    if (href === '/admin' && pathname === '/admin') return true;
    
    // For non-admin paths, use exact matching or strict prefix matching
    if (href !== '/admin') {
      // Exact match
      if (pathname === href) return true;
      
      // Strict prefix match - only if the pathname starts with href + '/'
      // This prevents false positives like /admin/reports matching /admin/reports/store-payment-details
      if (pathname.startsWith(href + '/')) return true;
    }
    
    return false;
  };

  const handleClick = () => {
    if (hasChildren && onToggleExpanded && !isCollapsed) {
      onToggleExpanded(item.name);
    } else if (!hasChildren) {
      router.push(item.href);
      onMobileMenuClose?.();
    }
  };

  const handleMouseEnter = (e: React.MouseEvent<HTMLElement>) => {
    // Only show submenu popup on desktop when collapsed
    if (screenSize === 'desktop' && isCollapsed && hasChildren) {
      if (hoverTimeoutRef.current) {
        clearTimeout(hoverTimeoutRef.current);
      }
      
      const rect = e.currentTarget.getBoundingClientRect();
      const submenuWidth = 320;
      const submenuHeight = 240;
      
      // Smart positioning based on viewport
      const viewportWidth = window.innerWidth;
      const viewportHeight = window.innerHeight;
      
      const left = rect.right + 16 > viewportWidth - submenuWidth 
        ? rect.left - submenuWidth - 16
        : rect.right + 16;
        
      const top = rect.top + submenuHeight > viewportHeight
        ? Math.max(10, viewportHeight - submenuHeight - 10)
        : Math.max(10, rect.top);
      
      setSubmenuPosition({ top, left });
      setShowSubmenu(true);
    }
  };

  const handleMouseLeave = () => {
    if (screenSize === 'desktop' && isCollapsed && hasChildren) {
      hoverTimeoutRef.current = setTimeout(() => {
        setShowSubmenu(false);
      }, 200);
    }
  };

  const handleSubmenuMouseEnter = () => {
    if (hoverTimeoutRef.current) {
      clearTimeout(hoverTimeoutRef.current);
    }
  };

  const handleSubmenuMouseLeave = () => {
    hoverTimeoutRef.current = setTimeout(() => {
      setShowSubmenu(false);
    }, 200);
  };

  const handleSubmenuClick = (childHref: string) => {
    setShowSubmenu(false);
    router.push(childHref);
    onMobileMenuClose?.();
  };

  const baseClasses = cn(
    "flex items-center transition-all duration-200 group focus:outline-none focus:ring-2 focus:ring-blue-500/20",
    // Responsive spacing and sizing
    screenSize === 'mobile' 
      ? "space-x-3 px-4 py-3 w-full h-12 text-base"
      : screenSize === 'tablet'
        ? "space-x-3 px-3 py-2.5 w-full h-11 text-sm"
        : isCollapsed 
          ? "justify-center p-2 text-sm" 
          : "space-x-3 px-3 py-2.5 w-full h-11 text-sm",
    "rounded-lg",
    className
  );

  const activeClasses = isActive
    ? "bg-gradient-to-r from-blue-50 to-indigo-50 dark:from-blue-900/40 dark:to-indigo-900/40 text-blue-700 dark:text-blue-300 shadow-sm"
    : "text-gray-600 dark:text-gray-400 hover:bg-gradient-to-r hover:from-gray-50 hover:to-blue-50/50 dark:hover:from-gray-800 dark:hover:to-blue-900/20 hover:text-gray-900 dark:hover:text-white";

  if (hasChildren) {
    return (
      <>
        <div className="space-y-1">
          {/* Desktop Collapsed View - Hover for submenu */}
          {screenSize === 'desktop' && isCollapsed ? (
            <div
              className={cn(baseClasses, activeClasses, "w-full justify-center relative overflow-hidden cursor-pointer")}
              onMouseEnter={handleMouseEnter}
              onMouseLeave={handleMouseLeave}
              title={item.name}
            >
              <Icon className="h-5 w-5 flex-shrink-0" />
              <div className="absolute -top-1 -right-1 w-3 h-3 bg-blue-500 rounded-full animate-pulse"></div>
            </div>
          ) : (
            /* Mobile, Tablet, and Desktop Expanded - Click to toggle */
            <Button
              variant="ghost"
              className={cn(baseClasses, activeClasses, "w-full justify-start")}
              onClick={handleClick}
            >
              <Icon className={cn(
                "flex-shrink-0",
                screenSize === 'mobile' ? "h-5 w-5" : "h-4 w-4"
              )} />
              {shouldShowExpanded && (
                <>
                  <span className={cn(
                    "flex-1 truncate font-medium text-left",
                    screenSize === 'mobile' && "text-base"
                  )}>{item.name}</span>
                  {item.badge && (
                    <Badge variant="secondary" className={cn(
                      "text-xs px-1.5 py-0.5",
                      screenSize === 'mobile' && "text-sm px-2 py-1"
                    )}>
                      {item.badge}
                    </Badge>
                  )}
                  <ChevronRight 
                    className={cn(
                      "text-gray-400 transition-transform duration-200",
                      screenSize === 'mobile' ? "h-5 w-5" : "h-4 w-4",
                      isExpanded ? "rotate-90" : "rotate-0"
                    )} 
                  />
                </>
              )}
            </Button>
          )}

          {/* Expanded submenu for non-collapsed sidebar */}
          {(!isCollapsed || screenSize !== 'desktop') && shouldShowExpanded && isExpanded && item.children && (
            <div className={cn(
              "ml-4 pl-4 border-l border-gray-200 dark:border-gray-700 space-y-1",
              screenSize === 'mobile' && "ml-6 pl-6"
            )}>
              {item.children.map((child) => {
                const isChildActive = isActiveItem(child.href);
                const ChildIcon = child.icon;
                
                return (
                  <Link
                    key={child.name}
                    href={child.href}
                    onClick={() => {
                      onNavigate?.(child.href);
                      onMobileMenuClose?.();
                    }}
                    className={cn(
                      "flex items-center space-x-3 px-3 py-2 rounded-lg transition-all duration-200",
                      screenSize === 'mobile' ? "px-4 py-3 text-base" : "text-sm",
                      isChildActive
                        ? "bg-blue-50 dark:bg-blue-900/40 text-blue-700 dark:text-blue-300 font-medium"
                        : "text-gray-600 dark:text-gray-400 hover:bg-gray-50 dark:hover:bg-gray-800 hover:text-gray-900 dark:hover:text-white"
                    )}
                  >
                    <ChildIcon className={cn(
                      "flex-shrink-0",
                      screenSize === 'mobile' ? "w-5 h-5" : "w-4 h-4"
                    )} />
                    <span className={cn(
                      "flex-1 truncate",
                      screenSize === 'mobile' ? "text-base" : "text-sm"
                    )}>{child.name}</span>
                    {child.badge && (
                      <Badge variant="secondary" className={cn(
                        "text-xs",
                        screenSize === 'mobile' && "text-sm px-2 py-1"
                      )}>
                        {child.badge}
                      </Badge>
                    )}
                  </Link>
                );
              })}
            </div>
          )}
        </div>

        {/* Submenu Popup - Only for Desktop Collapsed Sidebar */}
        {showSubmenu && screenSize === 'desktop' && isCollapsed && (
          <div 
            className="fixed w-80 bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-xl shadow-2xl z-50 py-3 backdrop-blur-sm ring-1 ring-black/5 dark:ring-white/10 animate-in fade-in-0 slide-in-from-left-2 duration-200"
            style={{
              left: `${submenuPosition.left}px`,
              top: `${submenuPosition.top}px`,
            }}
            onMouseEnter={handleSubmenuMouseEnter}
            onMouseLeave={handleSubmenuMouseLeave}
          >
            <div className="px-4 py-3 text-sm font-semibold text-gray-600 dark:text-gray-300 border-b border-gray-200 dark:border-gray-700 bg-gradient-to-r from-gray-50 to-blue-50 dark:from-gray-800 dark:to-blue-900/20 rounded-t-xl -mx-0 -mt-3 mb-2">
              📋 {item.name}
            </div>
            
            <div className="space-y-1 px-2">
              {item.children?.map((child) => {
                const isChildActive = isActiveItem(child.href);
                const ChildIcon = child.icon;
                
                return (
                  <div
                    key={child.name}
                    className={cn(
                      "w-full flex items-center space-x-3 px-4 py-3 text-sm transition-all duration-200 cursor-pointer select-none group rounded-lg mx-1",
                      isChildActive
                        ? "bg-blue-100 dark:bg-blue-900/50 text-blue-700 dark:text-blue-300 font-medium shadow-sm border-l-2 border-blue-500"
                        : "text-gray-700 dark:text-gray-300 hover:bg-blue-50 dark:hover:bg-blue-900/30 hover:text-blue-600 dark:hover:text-blue-400 hover:shadow-md hover:scale-105 hover:border-l-2 hover:border-blue-300"
                    )}
                    onClick={() => handleSubmenuClick(child.href)}
                  >
                    <ChildIcon className="w-4 h-4 flex-shrink-0 transition-all duration-200 group-hover:text-blue-500 group-hover:scale-110" />
                    <span className="flex-1 transition-all duration-200 group-hover:font-medium">{child.name}</span>
                    {child.badge && (
                      <Badge variant="secondary" className="text-xs transition-all duration-200 group-hover:bg-blue-100 group-hover:text-blue-700">
                        {child.badge}
                      </Badge>
                    )}
                  </div>
                );
              })}
            </div>
          </div>
        )}
      </>
    );
  }

  return (
    <Link
      href={item.href}
      className={cn(baseClasses, activeClasses)}
      onClick={() => {
        onNavigate?.(item.href);
        onMobileMenuClose?.();
      }}
    >
      <Icon className={cn(
        "flex-shrink-0 transition-all duration-200",
        screenSize === 'mobile' 
          ? "h-5 w-5" 
          : screenSize === 'desktop' && isCollapsed 
            ? "h-5 w-5" 
            : "h-4 w-4"
      )} />
      {(!isCollapsed || screenSize !== 'desktop') && shouldShowExpanded && (
        <>
          <span className={cn(
            "flex-1 truncate font-medium",
            screenSize === 'mobile' && "text-base"
          )}>{item.name}</span>
          {item.badge && (
            <Badge variant="secondary" className={cn(
              "text-xs px-1.5 py-0.5",
              screenSize === 'mobile' && "text-sm px-2 py-1"
            )}>
              {item.badge}
            </Badge>
          )}
        </>
      )}
    </Link>
  );
};
