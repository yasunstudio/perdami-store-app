import { SidebarItem } from '@/types/sidebar';

/**
 * Utility functions untuk sidebar operations
 */

/**
 * Mengecek apakah path saat ini aktif untuk item navigasi
 */
export const isActiveNavItem = (href: string, pathname: string): boolean => {
  if (!pathname) return false;
  if (href === '/admin' && pathname === '/admin') return true;
  if (href !== '/admin' && pathname.startsWith(href)) return true;
  return false;
};



/**
 * Mendapatkan semua parent items yang memiliki children aktif
 */
export const getActiveParents = (navigation: SidebarItem[], pathname: string): string[] => {
  const activeParents: string[] = [];
  
  const checkItem = (item: SidebarItem): boolean => {
    if (item.children) {
      const hasActiveChild = item.children.some(child => 
        isActiveNavItem(child.href, pathname) || checkItem(child)
      );
      if (hasActiveChild) {
        activeParents.push(item.name);
        return true;
      }
    }
    return isActiveNavItem(item.href, pathname);
  };
  
  navigation.forEach(checkItem);
  return activeParents;
};

/**
 * Filter navigasi berdasarkan permission
 */
export const filterNavigationByPermission = (
  navigation: SidebarItem[], 
  hasPermission: (permission?: string) => boolean
): SidebarItem[] => {
  return navigation
    .filter(item => !item.permission || hasPermission(item.permission))
    .map(item => ({
      ...item,
      children: item.children 
        ? filterNavigationByPermission(item.children, hasPermission)
        : undefined
    }))
    .filter(item => !item.children || item.children.length > 0);
};





/**
 * Mengecek apakah ada item dengan badge dalam navigasi
 */
export const hasAnyBadges = (navigation: SidebarItem[]): boolean => {
  return navigation.some(item => 
    item.badge || (item.children && hasAnyBadges(item.children))
  );
};





/**
 * Debounce function untuk optimasi performance
 */
export const debounce = <T extends (...args: any[]) => any>(
  func: T,
  wait: number
): ((...args: Parameters<T>) => void) => {
  let timeout: NodeJS.Timeout;
  return (...args: Parameters<T>) => {
    clearTimeout(timeout);
    timeout = setTimeout(() => func(...args), wait);
  };
};