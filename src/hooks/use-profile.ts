'use client'

import { useState, useEffect } from 'react'

interface Profile {
  id: string
  name: string | null
  email: string
  phone: string | null
  image: string | null
  role: string
  emailVerified: Date | null
  createdAt: Date
  updatedAt: Date
}

export function useProfile() {
  const [profile, setProfile] = useState<Profile | null>(null)
  const [isLoading, setIsLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  const fetchProfile = async () => {
    try {
      setIsLoading(true)
      setError(null)
      
      const response = await fetch('/api/profile')
      
      if (!response.ok) {
        const errorData = await response.json().catch(() => ({}))
        
        // Handle session mismatch specifically
        if (errorData.error === 'SESSION_USER_MISMATCH') {
          throw new Error(`Session tidak valid. ${errorData.suggestion || 'Silakan logout dan login kembali.'}`)
        }
        
        throw new Error(errorData.message || `HTTP error! status: ${response.status}`)
      }
      
      const data = await response.json()
      
      if (data.success && data.user) {
        setProfile(data.user)
      } else {
        throw new Error('Format respons tidak valid')
      }
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Gagal mengambil data profil'
      setError(errorMessage)
      console.error('Error fetching profile:', err)
    } finally {
      setIsLoading(false)
    }
  }

  useEffect(() => {
    fetchProfile()
  }, [])

  return {
    profile,
    isLoading,
    error,
    refetch: fetchProfile
  }
}
