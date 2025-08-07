// User Notification Settings Configuration
import { 
  Bell, 
  ShoppingCart, 
  CreditCard, 
  Package, 
  Shield, 
  User,
  Mail,
  Smartphone
} from 'lucide-react'
import { NotificationCategory, NotificationSetting } from '../types'

export const getNotificationIcon = (type: string) => {
  switch (type) {
    case 'orders':
      return ShoppingCart
    case 'products':
      return Package
    case 'security':
      return Shield
    case 'email':
      return Mail
    case 'push':
      return Smartphone
    default:
      return Bell
  }
}

export const NOTIFICATION_CATEGORIES: Omit<NotificationCategory, 'icon'>[] = [
  {
    id: 'orders',
    title: 'Pesanan & Pembayaran',
    description: 'Notifikasi terkait status pesanan dan pembayaran',
    settings: [
      {
        key: 'orderUpdates',
        label: 'Update Status Pesanan',
        description: 'Notifikasi perubahan status pesanan (diproses, dikirim, selesai)',
        category: 'orders',
        defaultValue: true,
        isRequired: true
      },
      {
        key: 'paymentConfirmations',
        label: 'Konfirmasi Pembayaran',
        description: 'Notifikasi saat pembayaran berhasil diproses',
        category: 'orders',
        defaultValue: true,
        isRequired: true
      }
    ]
  },
  {
    id: 'products',
    title: 'Produk & Promosi',
    description: 'Notifikasi produk baru dan penawaran khusus',
    settings: [
      {
        key: 'productAnnouncements',
        label: 'Pengumuman Produk',
        description: 'Notifikasi produk baru dan update stok',
        category: 'products',
        defaultValue: true
      },
      {
        key: 'promotionalEmails',
        label: 'Email Promosi',
        description: 'Penawaran khusus, diskon, dan promosi terbaru',
        category: 'products',
        defaultValue: false
      }
    ]
  },
  {
    id: 'security',
    title: 'Keamanan & Akun',
    description: 'Notifikasi keamanan dan aktivitas akun',
    settings: [
      {
        key: 'securityAlerts',
        label: 'Peringatan Keamanan',
        description: 'Notifikasi aktivitas mencurigakan dan perubahan keamanan',
        category: 'security',
        defaultValue: true,
        isRequired: true
      },
      {
        key: 'accountUpdates',
        label: 'Update Akun',
        description: 'Notifikasi perubahan profil dan pengaturan akun',
        category: 'security',
        defaultValue: true
      }
    ]
  }
]

export const DEFAULT_NOTIFICATION_SETTINGS = {
  orderUpdates: true,
  paymentConfirmations: true,
  productAnnouncements: true,
  promotionalEmails: false,
  securityAlerts: true,
  accountUpdates: true
}

export const NOTIFICATION_CHANNELS = [
  {
    id: 'email',
    name: 'Email',
    description: 'Terima notifikasi melalui email'
  },
  {
    id: 'push',
    name: 'Push Notification',
    description: 'Notifikasi langsung ke perangkat'
  }
] as const

export const NOTIFICATION_TIMING = {
  IMMEDIATELY: 'immediately',
  DAILY_DIGEST: 'daily',
  WEEKLY_DIGEST: 'weekly',
  NEVER: 'never'
} as const

export const NOTIFICATION_TEMPLATES = {
  ORDER_CONFIRMED: {
    subject: 'Pesanan Anda telah dikonfirmasi',
    template: 'order-confirmed',
    variables: ['orderNumber', 'customerName', 'totalAmount']
  },
  ORDER_PROCESSING: {
    subject: 'Pesanan Anda sedang diproses',
    template: 'order-processing',
    variables: ['orderNumber', 'customerName', 'estimatedReady']
  },
  ORDER_READY: {
    subject: 'Pesanan Anda siap untuk diambil',
    template: 'order-ready',
    variables: ['orderNumber', 'customerName', 'pickupLocation']
  },
  PAYMENT_CONFIRMED: {
    subject: 'Pembayaran berhasil dikonfirmasi',
    template: 'payment-confirmed',
    variables: ['orderNumber', 'customerName', 'paymentAmount']
  },
  SECURITY_ALERT: {
    subject: 'Peringatan Keamanan Akun',
    template: 'security-alert',
    variables: ['customerName', 'activityType', 'timestamp', 'ipAddress']
  },
  ADMIN_MESSAGE: {
    subject: 'Pesan dari Admin',
    template: 'admin-message',
    variables: ['customerName', 'subject', 'message']
  }
} as const
