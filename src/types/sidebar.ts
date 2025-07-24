import { LucideIcon } from 'lucide-react';

/**
 * Interface untuk item navigasi sidebar
 */
export interface SidebarItem {
  name: string;
  href: string;
  icon: LucideIcon;
  badge?: string;
  permission?: string;
  children?: SidebarItem[];
}



/**
 * Props untuk navigation item component
 */
export interface NavigationItemProps {
  item: SidebarItem;
  isActive: boolean;
  isCollapsed: boolean;
  isExpanded?: boolean;
  expandedItems?: string[];
  onToggleExpanded?: (itemName: string) => void;
  onNavigate?: (href: string) => void;
  className?: string;
}

/**
 * Type untuk sidebar context
 */
export interface SidebarContextType {
  isCollapsed: boolean;
  setIsCollapsed: (collapsed: boolean) => void;
  isMobileMenuOpen: boolean;
  setIsMobileMenuOpen: (open: boolean) => void;
  activeSubmenu: string | null;
  setActiveSubmenu: (submenu: string | null) => void;
  submenuPosition: { top: number };
  setSubmenuPosition: (position: { top: number }) => void;
}