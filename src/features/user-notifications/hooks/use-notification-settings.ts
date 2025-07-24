'use client'

// User Notification Settings Hooks
import { useState, useEffect, useCallback } from 'react'
import { toast } from 'sonner'
import { NotificationPreferences, NotificationSettingsResponse } from '../types'
import { DEFAULT_NOTIFICATION_SETTINGS } from '../config'

export interface UseNotificationSettingsReturn {
  settings: NotificationPreferences
  isLoading: boolean
  isSaving: boolean
  hasChanges: boolean
  updateSetting: (key: keyof NotificationPreferences, value: boolean) => void
  updateSettings: (newSettings: Partial<NotificationPreferences>) => void
  saveSettings: () => Promise<void>
  resetSettings: () => void
  reloadSettings: () => Promise<void>
}

export function useNotificationSettings(): UseNotificationSettingsReturn {
  const [settings, setSettings] = useState<NotificationPreferences>(DEFAULT_NOTIFICATION_SETTINGS)
  const [originalSettings, setOriginalSettings] = useState<NotificationPreferences>(DEFAULT_NOTIFICATION_SETTINGS)
  const [isLoading, setIsLoading] = useState(true)
  const [isSaving, setIsSaving] = useState(false)
  const [hasChanges, setHasChanges] = useState(false)

  // Load settings from API
  const loadSettings = useCallback(async () => {
    try {
      setIsLoading(true)
      const response = await fetch('/api/profile/notification-settings')
      
      if (response.ok) {
        const data = await response.json()
        const loadedSettings = { ...DEFAULT_NOTIFICATION_SETTINGS, ...data.settings }
        setSettings(loadedSettings)
        setOriginalSettings(loadedSettings)
        setHasChanges(false)
      } else if (response.status === 401) {
        // User not authenticated, use defaults without showing error
        setSettings(DEFAULT_NOTIFICATION_SETTINGS)
        setOriginalSettings(DEFAULT_NOTIFICATION_SETTINGS)
        setHasChanges(false)
      } else {
        // Server error - log but don't throw to avoid breaking the UI
        console.warn(`Failed to load notification settings: ${response.status} ${response.statusText}`)
        // Fallback to defaults silently
        setSettings(DEFAULT_NOTIFICATION_SETTINGS)
        setOriginalSettings(DEFAULT_NOTIFICATION_SETTINGS)
        setHasChanges(false)
      }
    } catch (error) {
      console.error('Error loading notification settings:', error)
      // Fallback to defaults silently to avoid breaking the UI
      setSettings(DEFAULT_NOTIFICATION_SETTINGS)
      setOriginalSettings(DEFAULT_NOTIFICATION_SETTINGS)
      setHasChanges(false)
    } finally {
      setIsLoading(false)
    }
  }, [])

  // Update single setting
  const updateSetting = useCallback((key: keyof NotificationPreferences, value: boolean) => {
    setSettings(prev => {
      const newSettings = { ...prev, [key]: value }
      setHasChanges(JSON.stringify(newSettings) !== JSON.stringify(originalSettings))
      return newSettings
    })
  }, [originalSettings])

  // Update multiple settings
  const updateSettings = useCallback((newSettings: Partial<NotificationPreferences>) => {
    setSettings(prev => {
      const updatedSettings = { ...prev, ...newSettings }
      setHasChanges(JSON.stringify(updatedSettings) !== JSON.stringify(originalSettings))
      return updatedSettings
    })
  }, [originalSettings])

  // Save settings to API
  const saveSettings = useCallback(async () => {
    if (!hasChanges) return

    try {
      setIsSaving(true)
      const response = await fetch('/api/profile/notification-settings', {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(settings),
      })

      if (response.ok) {
        const data: NotificationSettingsResponse = await response.json()
        setOriginalSettings(settings)
        setHasChanges(false)
        toast.success('Pengaturan notifikasi berhasil disimpan')
      } else {
        const error = await response.json()
        throw new Error(error.message || 'Failed to save settings')
      }
    } catch (error) {
      console.error('Error saving notification settings:', error)
      toast.error('Gagal menyimpan pengaturan notifikasi')
    } finally {
      setIsSaving(false)
    }
  }, [settings, hasChanges])

  // Reset settings to original
  const resetSettings = useCallback(() => {
    setSettings(originalSettings)
    setHasChanges(false)
  }, [originalSettings])

  // Reload settings from API
  const reloadSettings = useCallback(async () => {
    await loadSettings()
  }, [loadSettings])

  // Load settings on mount
  useEffect(() => {
    loadSettings()
  }, [loadSettings])

  return {
    settings,
    isLoading,
    isSaving,
    hasChanges,
    updateSetting,
    updateSettings,
    saveSettings,
    resetSettings,
    reloadSettings,
  }
}

// Hook for bulk operations
export function useBulkNotificationSettings() {
  const { settings, updateSettings, saveSettings, isSaving } = useNotificationSettings()

  const enableCategory = useCallback((category: string) => {
    const categorySettings: Partial<NotificationPreferences> = {}
    
    switch (category) {
      case 'orders':
        categorySettings.orderUpdates = true
        categorySettings.paymentConfirmations = true
        break
      case 'products':
        categorySettings.productAnnouncements = true
        categorySettings.promotionalEmails = true
        break
      case 'security':
        categorySettings.securityAlerts = true
        categorySettings.accountUpdates = true
        break
    }
    
    updateSettings(categorySettings)
  }, [updateSettings])

  const disableCategory = useCallback((category: string) => {
    const categorySettings: Partial<NotificationPreferences> = {}
    
    switch (category) {
      case 'orders':
        // Keep required settings enabled
        categorySettings.orderUpdates = true
        categorySettings.paymentConfirmations = true
        break
      case 'products':
        categorySettings.productAnnouncements = false
        categorySettings.promotionalEmails = false
        break
      case 'security':
        // Keep required settings enabled
        categorySettings.securityAlerts = true
        categorySettings.accountUpdates = false
        break
    }
    
    updateSettings(categorySettings)
  }, [updateSettings])

  const enableAll = useCallback(() => {
    updateSettings({
      orderUpdates: true,
      paymentConfirmations: true,
      productAnnouncements: true,
      promotionalEmails: true,
      securityAlerts: true,
      accountUpdates: true,
    })
  }, [updateSettings])

  const disableOptional = useCallback(() => {
    updateSettings({
      orderUpdates: true, // Required
      paymentConfirmations: true, // Required
      productAnnouncements: false,
      promotionalEmails: false,
      securityAlerts: true, // Required
      accountUpdates: false,
    })
  }, [updateSettings])

  return {
    settings,
    isSaving,
    enableCategory,
    disableCategory,
    enableAll,
    disableOptional,
    saveSettings,
  }
}
