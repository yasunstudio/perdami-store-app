// User Notification Settings Types
export interface UserNotificationSettings {
  id: string
  userId: string
  orderUpdates: boolean
  paymentConfirmations: boolean
  productAnnouncements: boolean
  promotionalEmails: boolean
  securityAlerts: boolean
  accountUpdates: boolean
  createdAt: Date
  updatedAt: Date
}

export interface NotificationCategory {
  id: string
  title: string
  description: string
  icon: React.ReactNode
  settings: NotificationSetting[]
}

export interface NotificationSetting {
  key: keyof Omit<UserNotificationSettings, 'id' | 'userId' | 'createdAt' | 'updatedAt'>
  label: string
  description: string
  category: string
  defaultValue: boolean
  isRequired?: boolean
}

export interface NotificationPreferences {
  orderUpdates: boolean
  paymentConfirmations: boolean
  productAnnouncements: boolean
  promotionalEmails: boolean
  securityAlerts: boolean
  accountUpdates: boolean
}

export interface NotificationSettingsResponse {
  success: boolean
  message: string
  settings: NotificationPreferences
}

export interface NotificationSettingsRequest {
  orderUpdates: boolean
  paymentConfirmations: boolean
  productAnnouncements: boolean
  promotionalEmails: boolean
  securityAlerts: boolean
  accountUpdates: boolean
}

// Notification templates for different types
export interface NotificationTemplate {
  type: string
  subject: string
  template: string
  variables: string[]
}

// Notification history for tracking
export interface NotificationHistory {
  id: string
  userId: string
  type: string
  title: string
  message: string
  channel: 'email' | 'push' | 'sms'
  status: 'sent' | 'failed' | 'pending'
  sentAt?: Date
  readAt?: Date
  createdAt: Date
}

// Bulk notification settings update
export interface BulkNotificationUpdate {
  category: string
  enabled: boolean
  settings: Partial<NotificationPreferences>
}
