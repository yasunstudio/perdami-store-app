import { HeroSection, FeaturesSection, FeaturedStoresSection, FeaturedBundlesSection, CTASection } from './components'

export default function HomePage() {
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
