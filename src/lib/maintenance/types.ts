export interface MaintenanceSettings {
  id: string
  isMaintenanceMode: boolean
  maintenanceMessage?: string
  isActive: boolean
  createdAt: string
  updatedAt: string
}

export interface MaintenanceStatus {
  isMaintenanceMode: boolean
  message: string
  timestamp: string
}
