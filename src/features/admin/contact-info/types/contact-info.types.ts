import { ContactType } from '@prisma/client'

export interface ContactInfo {
  id: string
  type: ContactType
  title: string
  value: string
  icon: string
  color: string
  createdAt: Date
  updatedAt: Date
}

export interface ContactInfoFormData {
  type: ContactType
  title: string
  value: string
  icon: string
  color: string
}

export interface ContactInfoListResponse {
  contactInfo: ContactInfo[]
  pagination: {
    currentPage: number
    totalPages: number
    totalCount: number
    hasNextPage: boolean
    hasPreviousPage: boolean
  }
}

export interface ContactInfoResponse {
  contactInfo: ContactInfo
}

export interface ContactInfoFilters {
  type?: ContactType | 'all'
  search?: string
}

export interface ContactInfoSort {
  field: keyof ContactInfo
  direction: 'asc' | 'desc'
}

export const CONTACT_TYPE_OPTIONS = [
  { value: 'EMAIL', label: 'Email' },
  { value: 'PHONE', label: 'Telepon' },
  { value: 'WHATSAPP', label: 'WhatsApp' },
  { value: 'ADDRESS', label: 'Alamat' },
  { value: 'SOCIAL_MEDIA', label: 'Media Sosial' }
] as const

export const CONTACT_COLORS = [
  { value: 'blue', label: 'Biru', class: 'bg-blue-100 text-blue-800' },
  { value: 'green', label: 'Hijau', class: 'bg-green-100 text-green-800' },
  { value: 'red', label: 'Merah', class: 'bg-red-100 text-red-800' },
  { value: 'yellow', label: 'Kuning', class: 'bg-yellow-100 text-yellow-800' },
  { value: 'purple', label: 'Ungu', class: 'bg-purple-100 text-purple-800' },
  { value: 'pink', label: 'Pink', class: 'bg-pink-100 text-pink-800' },
  { value: 'gray', label: 'Abu-abu', class: 'bg-gray-100 text-gray-800' }
] as const

export const CONTACT_ICONS = [
  { value: 'Mail', label: 'Mail' },
  { value: 'Phone', label: 'Phone' },
  { value: 'MessageCircle', label: 'WhatsApp' },
  { value: 'MapPin', label: 'Lokasi' },
  { value: 'Facebook', label: 'Facebook' },
  { value: 'Instagram', label: 'Instagram' },
  { value: 'Twitter', label: 'Twitter' },
  { value: 'Youtube', label: 'YouTube' },
  { value: 'Globe', label: 'Website' },
  { value: 'Linkedin', label: 'LinkedIn' }
] as const
