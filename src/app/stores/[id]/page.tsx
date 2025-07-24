import { Metadata } from 'next'
import StoreDetailPage from '@/features/stores/store-detail'

interface StorePageProps {
  params: Promise<{
    id: string
  }>
}

export async function generateMetadata({ params }: StorePageProps): Promise<Metadata> {
  const { id } = await params
  
  try {
    const response = await fetch(`${process.env.NEXTAUTH_URL}/api/stores/${id}`, {
      cache: 'no-store'
    })
    
    if (response.ok) {
      const store = await response.json()
      
      return {
        title: `${store.name} - Perdami Store`,
        description: store.description || `Toko ${store.name} - Oleh-oleh khas Bandung untuk PIT PERDAMI 2025`,
      }
    }
  } catch (error) {
    console.error('Error generating metadata:', error)
  }
  
  return {
    title: 'Detail Toko - Perdami Store',
    description: 'Detail toko oleh-oleh khas Bandung untuk PIT PERDAMI 2025',
  }
}

export default async function StorePage({ params }: StorePageProps) {
  const { id } = await params
  return <StoreDetailPage storeId={id} />
}