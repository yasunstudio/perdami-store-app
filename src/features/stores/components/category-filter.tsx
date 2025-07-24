'use client'

import { useState, useEffect } from 'react'
import { Button } from '@/components/ui/button'
import { Skeleton } from '@/components/ui/skeleton'

export type Category = string

interface CategoryFilterProps {
  selectedCategory: Category
  onCategoryChange: (category: Category) => void
}

interface CategoryData {
  id: string
  name: string
  description?: string
  storeId: string
  isActive: boolean
}

export function CategoryFilter({ selectedCategory, onCategoryChange }: CategoryFilterProps) {
  const [categories, setCategories] = useState<string[]>(['Semua'])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    fetchCategories()
  }, [])

  const fetchCategories = async () => {
    try {
      setLoading(true)
      const response = await fetch('/api/admin/categories?limit=100&status=active')
      const result = await response.json()
      
      if (response.ok && result.categories) {
        // Extract unique category names and add 'Semua' at the beginning
        const categoryNames = result.categories.map((cat: CategoryData) => cat.name)
        const uniqueCategories = ['Semua', ...new Set(categoryNames)]
        setCategories(uniqueCategories as string[])
      }
    } catch (error) {
      console.error('Error fetching categories:', error)
      // Fallback to default categories
      setCategories(['Semua', 'Makanan & Minuman', 'Kerajinan', 'Fashion', 'Souvenir'])
    } finally {
      setLoading(false)
    }
  }

  if (loading) {
    return (
      <div className="flex flex-wrap justify-center gap-2 mb-8">
        {[1, 2, 3, 4, 5].map((i) => (
          <Skeleton key={i} className="h-9 w-24 rounded-md" />
        ))}
      </div>
    )
  }

  return (
    <div className="flex flex-wrap justify-center gap-2 mb-8">
      {categories.map((category) => (
        <Button
          key={category}
          variant={category === selectedCategory ? 'default' : 'outline'}
          className="mb-2"
          onClick={() => onCategoryChange(category)}
        >
          {category}
        </Button>
      ))}
    </div>
  )
}
