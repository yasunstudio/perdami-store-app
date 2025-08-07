'use client'

import { useState, useEffect } from 'react'

export interface ContactInfo {
  id: string
  type: string
  title: string
  value: string
  icon: string
  color: string
  createdAt: string
  updatedAt: string
}

export interface ContactInfoSummary {
  email?: string
  phone?: string
  whatsappNumber?: string
  businessAddress?: string
  facebookUrl?: string
  instagramUrl?: string
  twitterUrl?: string
  youtubeUrl?: string
}

export function useContactInfo() {
  const [contactInfo, setContactInfo] = useState<ContactInfo[]>([])
  const [isLoading, setIsLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  const fetchContactInfo = async () => {
    try {
      setIsLoading(true)
      setError(null)
      
      const response = await fetch('/api/contact-info', {
        method: 'GET',
        headers: {
          'Content-Type': 'application/json',
        },
      })
      
      if (!response.ok) {
        const errorText = await response.text()
        throw new Error(`HTTP ${response.status}: ${errorText || 'Failed to fetch contact info'}`)
      }
      
      const data = await response.json()
      
      // Ensure data is an array
      if (!Array.isArray(data)) {
        throw new Error('Invalid response format: expected array')
      }
      
      setContactInfo(data)
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'An unexpected error occurred'
      setError(errorMessage)
      console.error('Error fetching contact info:', err)
      
      // Set empty array as fallback
      setContactInfo([])
    } finally {
      setIsLoading(false)
    }
  }

  const updateContactInfo = async (updates: Partial<ContactInfo>) => {
    try {
      const response = await fetch('/api/contact-info', {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(updates),
      })

      if (!response.ok) {
        throw new Error('Failed to update contact info')
      }

      const updatedContactInfo = await response.json()
      setContactInfo(prev => prev.map(item => 
        item.id === updatedContactInfo.id ? updatedContactInfo : item
      ))
      return updatedContactInfo
    } catch (err) {
      setError(err instanceof Error ? err.message : 'An error occurred')
      throw err
    }
  }

  // Helper function to get contact info summary in the expected format
  const getContactSummary = (): ContactInfoSummary => {
    const summary: ContactInfoSummary = {}
    
    contactInfo.forEach(item => {
      switch (item.type) {
        case 'EMAIL':
          if (item.title.toLowerCase().includes('info') || !summary.email) {
            summary.email = item.value
          }
          break
        case 'PHONE':
          if (item.title.toLowerCase().includes('telepon') || !summary.phone) {
            summary.phone = item.value
          }
          break
        case 'WHATSAPP':
          summary.whatsappNumber = item.value
          break
        case 'SOCIAL_MEDIA':
          if (item.title.toLowerCase().includes('facebook')) {
            summary.facebookUrl = item.value
          } else if (item.title.toLowerCase().includes('instagram')) {
            summary.instagramUrl = item.value
          } else if (item.title.toLowerCase().includes('twitter')) {
            summary.twitterUrl = item.value
          } else if (item.title.toLowerCase().includes('youtube')) {
            summary.youtubeUrl = item.value
          }
          break
        case 'ADDRESS':
          summary.businessAddress = item.value
          break
      }
    })
    
    return summary
  }

  useEffect(() => {
    fetchContactInfo()
  }, [])

  return {
    contactInfo,
    contactSummary: getContactSummary(),
    isLoading,
    error,
    fetchContactInfo,
    updateContactInfo,
  }
}
