/**
 * Timezone and event closure utilities
 */

export const CLOSURE_DATE = new Date('2025-09-06T21:00:00+07:00'); // 6 Sept 2025, 21:00 WIB

/**
 * Check if the store is closed based on WIB timezone
 */
export function isStoreClosed(): boolean {
  const now = new Date();
  return now >= CLOSURE_DATE;
  
  // FOR TESTING: Uncomment line below to test closure page
  // return true;
}

/**
 * Get current time in WIB (UTC+7)
 */
export function getCurrentWIBTime(): Date {
  const now = new Date();
  // Convert to WIB (UTC+7)
  const wibTime = new Date(now.getTime() + (7 * 60 * 60 * 1000));
  return wibTime;
}

/**
 * Get remaining time until closure
 */
export function getTimeUntilClosure(): {
  days: number;
  hours: number;
  minutes: number;
  seconds: number;
  isExpired: boolean;
} {
  const now = new Date();
  const diff = CLOSURE_DATE.getTime() - now.getTime();
  
  if (diff <= 0) {
    return {
      days: 0,
      hours: 0,
      minutes: 0,
      seconds: 0,
      isExpired: true
    };
  }

  const days = Math.floor(diff / (1000 * 60 * 60 * 24));
  const hours = Math.floor((diff % (1000 * 60 * 60 * 24)) / (1000 * 60 * 60));
  const minutes = Math.floor((diff % (1000 * 60 * 60)) / (1000 * 60));
  const seconds = Math.floor((diff % (1000 * 60)) / 1000);

  return {
    days,
    hours,
    minutes,
    seconds,
    isExpired: false
  };
}

/**
 * Format time until closure for display
 */
export function formatTimeUntilClosure(): string {
  const time = getTimeUntilClosure();
  
  if (time.isExpired) {
    return 'Pemesanan telah ditutup';
  }
  
  const parts = [];
  if (time.days > 0) parts.push(`${time.days} hari`);
  if (time.hours > 0) parts.push(`${time.hours} jam`);
  if (time.minutes > 0) parts.push(`${time.minutes} menit`);
  
  return parts.length > 0 ? parts.join(' ') : 'Kurang dari 1 menit';
}
