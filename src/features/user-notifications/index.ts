// Main export file for user notifications feature
export { NotificationSettings, NotificationQuickActions, NotificationStatusIndicator } from './components/notification-settings'
export { NotificationSettingsPanel } from './components/notification-settings-panel'
// AdminNotificationManagement is now integrated directly into the admin page
export { useNotificationSettings, useBulkNotificationSettings } from './hooks/use-notification-settings'
export type { 
  UserNotificationSettings,
  NotificationPreferences,
  NotificationCategory,
  NotificationSetting,
  NotificationSettingsResponse,
  NotificationSettingsRequest,
  NotificationTemplate,
  NotificationHistory,
  BulkNotificationUpdate
} from './types'
export { 
  NOTIFICATION_CATEGORIES,
  DEFAULT_NOTIFICATION_SETTINGS,
  NOTIFICATION_CHANNELS,
  NOTIFICATION_TIMING,
  NOTIFICATION_TEMPLATES,
  getNotificationIcon
} from './config'
