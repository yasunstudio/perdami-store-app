'use client';

import { useEffect, useState } from 'react';
import { isStoreClosed } from '@/lib/timezone';
import ClosurePage from '@/components/shared/closure-page';
import { HeroSection, FeaturesSection, FeaturedStoresSection, FeaturedBundlesSection, CTASection } from './components'

export default function HomePage() {
  const [isClosed, setIsClosed] = useState(false);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    // Check if store is closed
    const checkClosure = () => {
      const closed = isStoreClosed();
      setIsClosed(closed);
      setIsLoading(false);
    };

    checkClosure();
    
    // Check every minute for real-time updates
    const interval = setInterval(checkClosure, 60000);
    
    return () => clearInterval(interval);
  }, []);

  // Show loading state briefly
  if (isLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="animate-spin rounded-full h-32 w-32 border-b-2 border-orange-500"></div>
      </div>
    );
  }

  // Show closure page if store is closed
  if (isClosed) {
    return <ClosurePage />;
  }

  // Show normal homepage if store is open
  return (
    <div className="min-h-screen">
      <HeroSection />
      <FeaturesSection />
      <FeaturedStoresSection />
      <FeaturedBundlesSection />
      <CTASection />
    </div>
  )
}
