/**
 * WhatsApp Integration Utilities
 * FREE solution for sending order n*Order:* #${order.orderNumber}
*Tanggal Order:* ${orderDate}
*Customer:* ${order.user.name || 'Tidak ada nama'}
*Phone:* ${order.user.phone || 'Tidak ada nomor'}Phone:* ${order.user.phone || 'Tidak ada nomor'}er:* #${order.orderNumber}Or*Phone:* ${order.user.phone || 'Tidak ada nomor'}er:* #${order.orderNumber}tifications to stores
 */

import { format } from 'date-fns'
import { id } from 'date-fns/locale'

interface OrderItem {
  id: string
  quantity: number
  bundle: {
    id: string
    name: string
    storeId: string
  }
  price: number // Harga yang dibayar customer (sellingPrice)
  costPrice: number // Harga beli dari toko
  sellingPrice: number // Harga jual ke customer
}

interface Order {
  id: string
  orderNumber: string
  user: {
    name: string | null
    phone: string | null
  }
  orderItems: OrderItem[]
  totalAmount: number
  pickupDate: Date | string | null
  createdAt: Date | string
}

interface Store {
  id: string
  name: string
  whatsappNumber: string | null
  contactPerson: string | null
}

/**
 * Generate WhatsApp message for store order notification
 */
export function generateStoreOrderMessage(order: Order, store: Store): string {
  // Filter items untuk toko ini saja
  const storeItems = order.orderItems.filter(item => item.bundle.storeId === store.id)
  
  if (storeItems.length === 0) {
    return '' // Tidak ada item untuk toko ini
  }

  // Format items dengan info harga beli
  const itemsList = storeItems
    .map(item => {
      return `- ${item.quantity}x ${item.bundle.name} (@Rp ${item.costPrice.toLocaleString('id-ID')})`
    })
    .join('\n')

  // Calculate subtotal untuk toko ini menggunakan costPrice (harga beli)
  const storeSubtotal = storeItems.reduce((sum, item) => {
    return sum + (item.costPrice * item.quantity)
  }, 0)

  // Format pickup date
  const pickupDate = order.pickupDate 
    ? format(new Date(order.pickupDate), 'dd MMMM yyyy', { locale: id })
    : 'Belum ditentukan'

  // Format order date
  const orderDate = format(new Date(order.createdAt), 'dd MMM yyyy HH:mm', { locale: id })

  const message = `*PESANAN BARU - PERDAMI 2025*

*Order:* #${order.orderNumber}
*Tanggal Order:* ${orderDate}
*Customer:* ${order.user.name || 'Tidak ada nama'}
*Phone:* ${order.user.phone || 'Tidak ada nomor'}

*PESANAN UNTUK ${store.name.toUpperCase()}:*
${itemsList}

*Total Pembayaran ke Toko:* Rp ${storeSubtotal.toLocaleString('id-ID')}
*Pickup:* ${pickupDate}
*Lokasi:* Venue PIT PERDAMI 2025

*URGENT: Event 3 hari*
Mohon konfirmasi dan siapkan pesanan sesuai jadwal pickup.

Balas pesan ini untuk konfirmasi atau jika ada pertanyaan.

Terima kasih!

---
*Sistem Perdami Store*`

  return message
}

/**
 * Generate WhatsApp message for customer pickup notification
 */
export function generateCustomerPickupMessage(order: any): string {
  // Handle different order item structures
  const items = order.orderItems || order.items || []
  
  console.log('Debug order items:', items) // Debug log
  
  // Format items list
  const itemsList = items
    .map((item: any) => {
      const itemName = item.bundle?.name || item.name || 'Item'
      const quantity = item.quantity || 1
      return `- ${quantity}x ${itemName}`
    })
    .join('\n')

  // Format pickup date without time (only date)
  const pickupDate = order.pickupDate 
    ? format(new Date(order.pickupDate), 'dd MMMM yyyy', { locale: id })
    : 'Akan dikonfirmasi'

  const customerName = order.user?.name || order.customer?.name || 'Customer'

  const message = `*Pesanan Bapak/Ibu Sudah Siap!*

Halo Bapak/Ibu *${customerName}*,

Pesanan #*${order.orderNumber}* Bapak/Ibu sudah siap untuk diambil!

*Detail Pesanan:*
${itemsList || 'Data pesanan tidak tersedia'}

*Total: Rp ${order.totalAmount.toLocaleString('id-ID')}*

*Lokasi Pickup:*
Booth PIT Perdami 2025

*Tanggal Pickup:*
${pickupDate}

Terima kasih 🙏
_Tim Dharma Wanita Perdami_`

  return message
}

/**
 * Generate WhatsApp URL with pre-filled message
 */
export function generateWhatsAppURL(phoneNumber: string, message: string): string {
  if (!phoneNumber || !message) {
    throw new Error('Phone number and message are required')
  }

  // Clean phone number (remove non-digits)
  const cleanPhone = phoneNumber.replace(/[^0-9]/g, '')
  
  // Convert to international format
  let whatsappPhone = cleanPhone
  if (cleanPhone.startsWith('0')) {
    whatsappPhone = '62' + cleanPhone.slice(1) // Indonesia country code
  } else if (!cleanPhone.startsWith('62')) {
    whatsappPhone = '62' + cleanPhone
  }

  // Encode message for URL
  const encodedMessage = encodeURIComponent(message)
  
  // Generate WhatsApp URL
  return `https://wa.me/${whatsappPhone}?text=${encodedMessage}`
}

/**
 * Open WhatsApp with pre-filled message in new tab
 */
export function openWhatsApp(phoneNumber: string, message: string): void {
  try {
    const url = generateWhatsAppURL(phoneNumber, message)
    window.open(url, '_blank')
  } catch (error) {
    console.error('Error opening WhatsApp:', error)
    throw error
  }
}

/**
 * Validate Indonesian phone number format
 */
export function validateIndonesianPhone(phone: string): boolean {
  const cleanPhone = phone.replace(/[^0-9]/g, '')
  
  // Valid formats:
  // 08xxxxxxxxx (10-13 digits)
  // 628xxxxxxxxx (11-14 digits)
  return (
    (cleanPhone.startsWith('08') && cleanPhone.length >= 10 && cleanPhone.length <= 13) ||
    (cleanPhone.startsWith('628') && cleanPhone.length >= 11 && cleanPhone.length <= 14)
  )
}

/**
 * Format phone number for display
 */
export function formatPhoneNumber(phone: string): string {
  const cleanPhone = phone.replace(/[^0-9]/g, '')
  
  if (cleanPhone.startsWith('628')) {
    return '+' + cleanPhone
  } else if (cleanPhone.startsWith('08')) {
    return '+62' + cleanPhone.slice(1)
  }
  
  return phone
}
