'use client'

import Link from 'next/link'
import { ChevronRight, Home, Package } from 'lucide-react'

interface BundleBreadcrumbProps {
  bundleName: string
}

export function BundleBreadcrumb({ bundleName }: BundleBreadcrumbProps) {
  return (
    <nav className="mb-4 sm:mb-6 overflow-hidden" aria-label="Breadcrumb">
      <ol className="flex items-center space-x-1 min-w-0">
        <li className="flex-shrink-0">
          <Link 
            href="/" 
            className="text-gray-500 hover:text-blue-600 dark:text-gray-400 dark:hover:text-blue-400 transition-colors font-medium flex items-center gap-1 text-xs sm:text-sm"
          >
            <Home className="w-3 h-3 flex-shrink-0" />
            <span className="hidden sm:inline">Beranda</span>
          </Link>
        </li>
        <li className="flex-shrink-0 text-gray-400 dark:text-gray-600">
          <ChevronRight className="w-3 h-3" />
        </li>
        <li className="flex-shrink-0">
          <Link 
            href="/bundles" 
            className="text-gray-500 hover:text-blue-600 dark:text-gray-400 dark:hover:text-blue-400 transition-colors font-medium flex items-center gap-1 text-xs sm:text-sm"
          >
            <Package className="w-3 h-3 flex-shrink-0" />
            <span className="hidden sm:inline">Paket Produk</span>
            <span className="sm:hidden">Paket</span>
          </Link>
        </li>
        <li className="flex-shrink-0 text-gray-400 dark:text-gray-600">
          <ChevronRight className="w-3 h-3" />
        </li>
        <li className="min-w-0 flex-1">
          <span className="text-gray-900 dark:text-white font-medium block truncate text-xs sm:text-sm" title={bundleName}>
            {bundleName}
          </span>
        </li>
      </ol>
    </nav>
  )
}
