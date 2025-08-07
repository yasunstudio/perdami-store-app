'use client'

import Link from 'next/link'
import { ChevronRight, Home, Package } from 'lucide-react'

interface BundleBreadcrumbProps {
  bundleName: string
}

export function BundleBreadcrumb({ bundleName }: BundleBreadcrumbProps) {
  return (
    <nav className="flex items-center space-x-1 text-sm mb-6" aria-label="Breadcrumb">
      <ol className="flex items-center space-x-1">
        <li>
          <Link 
            href="/" 
            className="text-gray-500 hover:text-blue-600 dark:text-gray-400 dark:hover:text-blue-400 transition-colors font-medium flex items-center gap-1"
          >
            <Home className="w-3 h-3" />
            Beranda
          </Link>
        </li>
        <li className="text-gray-400 dark:text-gray-600">
          <ChevronRight className="w-3 h-3" />
        </li>
        <li>
          <Link 
            href="/bundles" 
            className="text-gray-500 hover:text-blue-600 dark:text-gray-400 dark:hover:text-blue-400 transition-colors font-medium flex items-center gap-1"
          >
            <Package className="w-3 h-3" />
            Paket Produk
          </Link>
        </li>
        <li className="text-gray-400 dark:text-gray-600">
          <ChevronRight className="w-3 h-3" />
        </li>
        <li>
          <span className="text-gray-900 dark:text-white font-medium truncate max-w-[200px] sm:max-w-[300px] text-sm">
            {bundleName}
          </span>
        </li>
      </ol>
    </nav>
  )
}
