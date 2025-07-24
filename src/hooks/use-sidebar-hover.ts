'use client';

import { useState, useCallback, useRef } from 'react';
import { SIDEBAR_CONFIG } from '@/constants/sidebar';
import { debounce } from '@/utils/sidebar';

/**
 * Custom hook untuk mengelola state hover sidebar dan expanded items
 * Memisahkan logic dari komponen utama untuk reusability
 */
export const useSidebarHover = () => {
  const [isHovered, setIsHovered] = useState(false);
  const [hoverExpandedItems, setHoverExpandedItems] = useState<string[]>([]);
  const hoverTimeoutRef = useRef<NodeJS.Timeout | null>(null);

  const handleMouseEnter = useCallback(() => {
    if (hoverTimeoutRef.current) {
      clearTimeout(hoverTimeoutRef.current);
      hoverTimeoutRef.current = null;
    }
    // Delay yang optimal untuk responsivitas dan stabilitas - lebih cepat untuk UX yang lebih baik
    setTimeout(() => {
      setIsHovered(true);
      // Auto-expand semua item yang memiliki children saat hover dimulai untuk akses cepat
      setHoverExpandedItems(['Manajemen Bisnis', 'Analitik & Laporan', 'Pengaturan Sistem']);
    }, 50);
  }, []);

  const handleMouseLeave = useCallback((e: MouseEvent) => {
    const target = e.relatedTarget as Element;
    
    // Check if mouse is moving to overlay area
    if (target && target.closest('[data-hover-overlay]')) {
      return;
    }
    
    // Use configured hover delay
    hoverTimeoutRef.current = setTimeout(() => {
      setIsHovered(false);
      setHoverExpandedItems([]);
    }, 200);
  }, []);

  const handleOverlayMouseEnter = useCallback(() => {
    if (hoverTimeoutRef.current) {
      clearTimeout(hoverTimeoutRef.current);
      hoverTimeoutRef.current = null;
    }
    setIsHovered(true);
  }, []);

  const handleOverlayMouseLeave = useCallback(() => {
    hoverTimeoutRef.current = setTimeout(() => {
      setIsHovered(false);
      setHoverExpandedItems([]);
    }, 200);
  }, []);

  const toggleHoverExpanded = useCallback((itemName: string) => {
    setHoverExpandedItems(prev => 
      prev.includes(itemName)
        ? prev.filter(name => name !== itemName)
        : [...prev, itemName]
    );
  }, []);

  const resetHoverState = useCallback(() => {
    setIsHovered(false);
    setHoverExpandedItems([]);
    if (hoverTimeoutRef.current) {
      clearTimeout(hoverTimeoutRef.current);
      hoverTimeoutRef.current = null;
    }
  }, []);

  // Debounced version untuk performance optimization
  const debouncedToggleHoverExpanded = useCallback(
    debounce(toggleHoverExpanded, 50),
    [toggleHoverExpanded]
  );

  return {
    isHovered,
    hoverExpandedItems,
    handleMouseEnter,
    handleMouseLeave,
    handleOverlayMouseEnter,
    handleOverlayMouseLeave,
    toggleHoverExpanded,
    debouncedToggleHoverExpanded,
    resetHoverState
  };
};