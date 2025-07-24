import { Metadata } from 'next'
import { BundlesPageView } from '@/features/bundles/components/bundles-page-view'

export const metadata: Metadata = {
  title: 'Paket Produk - Perdami Store',
  description: 'Temukan berbagai paket produk eksklusif dengan harga terbaik di Perdami Store'
}

export default function BundlesPage() {
  return <BundlesPageView />
}
