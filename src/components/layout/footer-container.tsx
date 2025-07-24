'use client'

import { useEffect, useState } from 'react'
import Link from 'next/link'
import { Package, Mail, Phone, MapPin, Facebook, Instagram, MessageCircle, Twitter, Youtube } from 'lucide-react'
import { useContactInfo } from '@/hooks/use-contact-info'

interface Store {
  id: string
  name: string
  description: string
  image: string
}

interface AppSettings {
  appName: string
  appDescription: string
  appLogo?: string
  whatsappNumber: string
  businessAddress: string
  pickupLocation: string
  pickupCity: string
  eventName: string
  eventYear: string
  copyrightText: string
  copyrightSubtext: string
  isMaintenanceMode: boolean
}

export function FooterContainer() {
  const [stores, setStores] = useState<Store[]>([])
  const [settings, setSettings] = useState<AppSettings | null>(null)
  const [isLoading, setIsLoading] = useState(true)
  const { contactSummary, isLoading: isContactLoading } = useContactInfo()

  useEffect(() => {
    const fetchData = async () => {
      try {
        // Fetch stores and settings in parallel
        const [storesResponse, settingsResponse] = await Promise.all([
          fetch('/api/stores'),
          fetch('/api/settings')
        ])
        
        if (storesResponse.ok) {
          const storesData = await storesResponse.json()
          if (storesData.success) {
            setStores(storesData.data)
          }
        }
        
        if (settingsResponse.ok) {
          const settingsData = await settingsResponse.json()
          setSettings(settingsData)
        }
      } catch (error) {
        console.error('Error fetching data:', error)
      } finally {
        setIsLoading(false)
      }
    }

    fetchData()
  }, [])

  return (
    <footer className="bg-muted/30 border-t">
      <div className="container mx-auto px-4 sm:px-6 lg:px-8 max-w-7xl">
        {/* Main Footer Content */}
        <div className="py-8">
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-8 lg:gap-12">
            {/* Brand */}
            <div className="space-y-6 lg:col-span-1">
              <div className="flex items-center space-x-3">
                <Package className="h-8 w-8 text-primary" />
                <span className="font-bold text-xl">
                  {settings?.appName || 'Perdami Store'}
                </span>
              </div>
              <p className="text-sm text-muted-foreground leading-relaxed max-w-sm">
                {settings?.appDescription || 'Platform pre-order oleh-oleh khas Bandung untuk peserta PIT PERDAMI 2025. Nikmati kemudahan berbelanja online dan ambil langsung di venue event.'}
              </p>
              <div className="flex space-x-3">
                {/* Social Media Icons */}
                {contactSummary?.facebookUrl && (
                  <a 
                    href={contactSummary.facebookUrl} 
                    target="_blank" 
                    rel="noopener noreferrer"
                    className="w-9 h-9 bg-muted rounded-full flex items-center justify-center hover:bg-blue-100 hover:text-blue-600 transition-colors duration-200 group"
                    aria-label="Facebook"
                  >
                    <Facebook className="h-4 w-4" />
                  </a>
                )}
                {contactSummary?.instagramUrl && (
                  <a 
                    href={contactSummary.instagramUrl} 
                    target="_blank" 
                    rel="noopener noreferrer"
                    className="w-9 h-9 bg-muted rounded-full flex items-center justify-center hover:bg-pink-100 hover:text-pink-600 transition-colors duration-200 group"
                    aria-label="Instagram"
                  >
                    <Instagram className="h-4 w-4" />
                  </a>
                )}
                {contactSummary?.twitterUrl && (
                  <a 
                    href={contactSummary.twitterUrl} 
                    target="_blank" 
                    rel="noopener noreferrer"
                    className="w-9 h-9 bg-muted rounded-full flex items-center justify-center hover:bg-sky-100 hover:text-sky-600 transition-colors duration-200 group"
                    aria-label="Twitter"
                  >
                    <Twitter className="h-4 w-4" />
                  </a>
                )}
                {contactSummary?.youtubeUrl && (
                  <a 
                    href={contactSummary.youtubeUrl} 
                    target="_blank" 
                    rel="noopener noreferrer"
                    className="w-9 h-9 bg-muted rounded-full flex items-center justify-center hover:bg-red-100 hover:text-red-600 transition-colors duration-200 group"
                    aria-label="YouTube"
                  >
                    <Youtube className="h-4 w-4" />
                  </a>
                )}
                {contactSummary?.whatsappNumber && (
                  <a 
                    href={`https://wa.me/${contactSummary.whatsappNumber}`} 
                    target="_blank" 
                    rel="noopener noreferrer"
                    className="w-9 h-9 bg-muted rounded-full flex items-center justify-center hover:bg-green-100 hover:text-green-600 transition-colors duration-200 group"
                    aria-label="WhatsApp"
                  >
                    <MessageCircle className="h-4 w-4" />
                  </a>
                )}
              </div>
            </div>

            {/* Quick Links */}
            <div className="space-y-6">
              <h4 className="text-sm font-semibold text-foreground tracking-wide">Tautan Cepat</h4>
              <nav className="flex flex-col space-y-3">
                <Link href="/" className="text-sm text-muted-foreground hover:text-primary transition-colors duration-200">
                  Beranda
                </Link>
                <Link href="/stores" className="text-sm text-muted-foreground hover:text-primary transition-colors duration-200">
                  Toko Partner
                </Link>
                <Link href="/orders" className="text-sm text-muted-foreground hover:text-primary transition-colors duration-200">
                  Lacak Pesanan
                </Link>
              </nav>
            </div>

            {/* Toko Partner - Dynamic */}
            <div className="space-y-6">
              <h4 className="text-sm font-semibold text-foreground tracking-wide">Toko Partner</h4>
              <div className="flex flex-col space-y-3">
                {isLoading ? (
                  // Loading skeleton
                  <>
                    {[1, 2, 3, 4, 5].map((item) => (
                      <div key={item} className="h-5 bg-muted rounded animate-pulse" />
                    ))}
                  </>
                ) : stores.length > 0 ? (
                  // Dynamic stores from database
                  stores.map((store) => {
                    // Convert store name to URL slug
                    const storeSlug = store.name
                      .toLowerCase()
                      .replace(/\s+/g, '-')
                      .replace(/[^a-z0-9-]/g, '')
                    
                    return (
                      <Link 
                        key={store.id}
                        href={`/stores?store=${storeSlug}`} 
                        className="text-sm text-muted-foreground hover:text-primary transition-colors duration-200"
                      >
                        {store.name}
                      </Link>
                    )
                  })
                ) : (
                  // Fallback if no stores
                  <p className="text-sm text-muted-foreground">Tidak ada toko partner saat ini</p>
                )}
              </div>
            </div>

            {/* Contact Info */}
            <div className="space-y-6">
              <h4 className="text-sm font-semibold text-foreground tracking-wide">Kontak</h4>
              <div className="space-y-4">
                <div className="flex items-start space-x-3">
                  <Mail className="h-5 w-5 text-muted-foreground mt-0.5 flex-shrink-0" />
                  <div className="space-y-1">
                    <p className="text-sm text-muted-foreground">Email</p>
                    <a 
                      href={`mailto:${contactSummary?.email || 'info@perdamistore.com'}`} 
                      className="text-sm font-medium hover:text-primary transition-colors"
                    >
                      {contactSummary?.email || 'info@perdamistore.com'}
                    </a>
                  </div>
                </div>
                <div className="flex items-start space-x-3">
                  <Phone className="h-5 w-5 text-muted-foreground mt-0.5 flex-shrink-0" />
                  <div className="space-y-1">
                    <p className="text-sm text-muted-foreground">Telepon</p>
                    <a 
                      href={`tel:${contactSummary?.phone || '+6281234567890'}`} 
                      className="text-sm font-medium hover:text-primary transition-colors"
                    >
                      {contactSummary?.phone || '+62 812 3456 7890'}
                    </a>
                  </div>
                </div>
                <div className="flex items-start space-x-3">
                  <MessageCircle className="h-5 w-5 text-muted-foreground mt-0.5 flex-shrink-0" />
                  <div className="space-y-1">
                    <p className="text-sm text-muted-foreground">WhatsApp</p>
                    <a 
                      href={`https://wa.me/${contactSummary?.whatsappNumber || '6281234567890'}`} 
                      target="_blank"
                      rel="noopener noreferrer"
                      className="text-sm font-medium hover:text-primary transition-colors"
                    >
                      {contactSummary?.whatsappNumber || '+62 812 3456 7890'}
                    </a>
                  </div>
                </div>
                <div className="flex items-start space-x-3">
                  <MapPin className="h-5 w-5 text-muted-foreground mt-0.5 flex-shrink-0" />
                  <div className="space-y-1">
                    <p className="text-sm text-muted-foreground">Alamat Bisnis</p>
                    <p className="text-sm font-medium">
                      {contactSummary?.businessAddress || settings?.pickupLocation || 'Venue PIT PERDAMI 2025'}<br />
                      <span className="text-muted-foreground">
                        {settings?.pickupCity || 'Bandung, Jawa Barat'}
                      </span>
                    </p>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Bottom Footer */}
        <div className="border-t py-6 lg:py-8">
          <div className="flex flex-col lg:flex-row justify-between items-center space-y-4 lg:space-y-0 gap-4">
            <div className="flex flex-col sm:flex-row items-center space-y-2 sm:space-y-0 sm:space-x-6 text-center sm:text-left">
              <p className="text-sm text-muted-foreground">
                {settings?.copyrightText || '© 2025 Perdami Store. Dibuat khusus untuk PIT PERDAMI 2025.'}
              </p>
              <div className="hidden sm:block w-px h-4 bg-border"></div>
              <p className="text-sm text-muted-foreground">
                {settings?.copyrightSubtext || 'Semua hak cipta dilindungi.'}
              </p>
            </div>
            <div className="flex flex-wrap justify-center lg:justify-end gap-4 lg:gap-6 text-sm">
              <Link href="/privacy" className="text-muted-foreground hover:text-primary transition-colors duration-200">
                Kebijakan Privasi
              </Link>
              <Link href="/terms" className="text-muted-foreground hover:text-primary transition-colors duration-200">
                Syarat & Ketentuan
              </Link>
            </div>
          </div>
        </div>
      </div>
    </footer>
  )
}
