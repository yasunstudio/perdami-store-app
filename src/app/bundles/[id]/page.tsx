import { notFound } from 'next/navigation'
import { BundleDetailView } from '@/features/bundles/components/bundle-detail-view'
import { BundleService } from '@/lib/services/bundle.service'

interface BundlePageProps {
  params: Promise<{
    id: string
  }>
}

export default async function BundlePage({ params }: BundlePageProps) {
  const { id } = await params
  
  try {
    const bundle = await BundleService.getById(id)
    
    if (!bundle) {
      notFound()
    }

    return <BundleDetailView bundle={bundle} />
  } catch (error) {
    console.error('Error loading bundle:', error)
    notFound()
  }
}
