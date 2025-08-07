// Email service implementation - server only
import { EmailServiceInterface, EmailConfig, EmailPayload, OrderWithUser, PaymentWithOrder } from './email.types'
import type { User } from '@prisma/client'

// Only import nodemailer if we're on the server
let nodemailer: any = null
if (typeof window === 'undefined') {
  try {
    // eslint-disable-next-line @typescript-eslint/no-require-imports
    nodemailer = require('nodemailer')
  } catch (error) {
    console.warn('nodemailer not available:', error)
  }
}

class EmailService implements EmailServiceInterface {
  private transporter: any
  private config: EmailConfig

  constructor() {
    this.config = {
      host: process.env.SMTP_HOST || 'smtp.gmail.com',
      port: parseInt(process.env.SMTP_PORT || '587'),
      secure: process.env.SMTP_SECURE === 'true',
      user: process.env.SMTP_USER || '',
      pass: process.env.SMTP_PASS || '',
      from: process.env.EMAIL_FROM || 'noreply@perdami.com',
      fromName: process.env.EMAIL_FROM_NAME || 'Perdami Store'
    }

    if (nodemailer) {
      this.transporter = nodemailer.createTransport({
        host: this.config.host,
        port: this.config.port,
        secure: this.config.secure,
        auth: {
          user: this.config.user,
          pass: this.config.pass
        }
      })
    }
  }

  async sendEmail(payload: EmailPayload): Promise<void> {
    if (!this.transporter) {
      console.warn('Email service not available - running in client mode')
      return
    }

    try {
      const info = await this.transporter.sendMail({
        from: `"${this.config.fromName}" <${this.config.from}>`,
        to: payload.to,
        subject: payload.subject,
        html: payload.html,
        text: payload.text || payload.subject
      })

      console.log('Email sent successfully:', info.messageId)
    } catch (error) {
      console.error('Error sending email:', error)
      throw error
    }
  }

  async sendOrderConfirmation(data: { order: OrderWithUser }): Promise<void> {
    if (!this.transporter) return

    const { order } = data
    
    const html = `
      <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
        <h2 style="color: #2563eb;">Pesanan Dikonfirmasi</h2>
        <p>Halo ${order.user.name},</p>
        <p>Pesanan Anda dengan nomor <strong>#${order.orderNumber}</strong> telah dikonfirmasi dan akan segera diproses.</p>
        
        <div style="background-color: #f3f4f6; padding: 20px; border-radius: 8px; margin: 20px 0;">
          <h3 style="margin-top: 0;">Detail Pesanan</h3>
          <p><strong>Nomor Pesanan:</strong> ${order.orderNumber}</p>
          <p><strong>Total:</strong> Rp ${order.totalAmount.toLocaleString('id-ID')}</p>
          <p><strong>Status:</strong> ${order.orderStatus}</p>
          <p><strong>Tanggal:</strong> ${new Date(order.createdAt).toLocaleDateString('id-ID')}</p>
        </div>
        
        <p>Terima kasih telah berbelanja di Perdami Store!</p>
        <p>Tim Perdami Store</p>
      </div>
    `

    await this.sendEmail({
      to: order.user.email,
      subject: `Pesanan Dikonfirmasi - #${order.orderNumber}`,
      html
    })
  }

  async sendOrderStatusUpdate(order: OrderWithUser, oldStatus: string, newStatus: string): Promise<void> {
    if (!this.transporter) return

    const statusMessages: Record<string, string> = {
      'PROCESSING': 'sedang diproses',
      'READY': 'siap untuk diambil',
      'COMPLETED': 'telah selesai',
      'CANCELLED': 'telah dibatalkan'
    }

    const html = `
      <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
        <h2 style="color: #2563eb;">Update Status Pesanan</h2>
        <p>Halo ${order.user.name},</p>
        <p>Status pesanan Anda telah diperbarui:</p>
        
        <div style="background-color: #f3f4f6; padding: 20px; border-radius: 8px; margin: 20px 0;">
          <p><strong>Nomor Pesanan:</strong> ${order.orderNumber}</p>
          <p><strong>Status Baru:</strong> ${statusMessages[newStatus] || newStatus}</p>
        </div>
        
        <p>Terima kasih,<br>Tim Perdami Store</p>
      </div>
    `

    await this.sendEmail({
      to: order.user.email,
      subject: `Update Pesanan - #${order.orderNumber}`,
      html
    })
  }

  async sendPaymentConfirmation(payment: PaymentWithOrder): Promise<void> {
    if (!this.transporter) return

    const html = `
      <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
        <h2 style="color: #10b981;">Pembayaran Dikonfirmasi</h2>
        <p>Halo ${payment.order.user.name},</p>
        <p>Pembayaran Anda telah dikonfirmasi.</p>
        
        <div style="background-color: #ecfdf5; padding: 20px; border-radius: 8px; margin: 20px 0;">
          <p><strong>Nomor Pesanan:</strong> ${payment.order.orderNumber}</p>
          <p><strong>Jumlah:</strong> Rp ${payment.amount.toLocaleString('id-ID')}</p>
          <p><strong>Metode:</strong> ${payment.method}</p>
        </div>
        
        <p>Terima kasih,<br>Tim Perdami Store</p>
      </div>
    `

    await this.sendEmail({
      to: payment.order.user.email,
      subject: `Pembayaran Dikonfirmasi - #${payment.order.orderNumber}`,
      html
    })
  }

  async sendSecurityAlert(user: User, alertType: string, details: string): Promise<void> {
    if (!this.transporter) return

    const html = `
      <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
        <h2 style="color: #ef4444;">Peringatan Keamanan</h2>
        <p>Halo ${user.name},</p>
        <p>Kami mendeteksi aktivitas keamanan yang mencurigakan pada akun Anda.</p>
        
        <div style="background-color: #fef2f2; padding: 20px; border-radius: 8px; margin: 20px 0;">
          <p><strong>Jenis Peringatan:</strong> ${alertType}</p>
          <p><strong>Detail:</strong> ${details}</p>
          <p><strong>Waktu:</strong> ${new Date().toLocaleString('id-ID')}</p>
        </div>
        
        <p>Jika ini bukan aktivitas Anda, segera ubah password Anda.</p>
        <p>Tim Keamanan Perdami Store</p>
      </div>
    `

    await this.sendEmail({
      to: user.email,
      subject: 'Peringatan Keamanan Akun',
      html
    })
  }

  async sendWelcomeEmail(user: any): Promise<void> {
    if (!this.transporter) return

    const html = `
      <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
        <h2 style="color: #2563eb;">Selamat Datang di Perdami Store!</h2>
        <p>Halo ${user.name},</p>
        <p>Selamat datang di Perdami Store! Terima kasih telah mendaftar.</p>
        
        <div style="background-color: #f3f4f6; padding: 20px; border-radius: 8px; margin: 20px 0;">
          <h3 style="margin-top: 0;">Apa yang bisa Anda lakukan?</h3>
          <ul>
            <li>Jelajahi produk-produk berkualitas</li>
            <li>Kelola pesanan Anda</li>
            <li>Dapatkan notifikasi terbaru</li>
            <li>Nikmati pengalaman berbelanja yang mudah</li>
          </ul>
        </div>
        
        <p>Selamat berbelanja!</p>
        <p>Tim Perdami Store</p>
      </div>
    `

    await this.sendEmail({
      to: user.email,
      subject: 'Selamat Datang di Perdami Store!',
      html
    })
  }

  async sendVerificationEmail(user: any, token: string): Promise<void> {
    if (!this.transporter) return

    const verificationUrl = `${process.env.NEXT_PUBLIC_APP_URL}/auth/verify-email?token=${token}`
    
    const html = `
      <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
        <h2 style="color: #2563eb;">Verifikasi Email Anda</h2>
        <p>Halo ${user.name},</p>
        <p>Klik tombol di bawah untuk verifikasi email Anda:</p>
        
        <div style="text-align: center; margin: 30px 0;">
          <a href="${verificationUrl}" style="background-color: #2563eb; color: white; padding: 12px 24px; text-decoration: none; border-radius: 6px; display: inline-block;">
            Verifikasi Email
          </a>
        </div>
        
        <p>Jika tombol tidak bekerja, salin dan tempel URL berikut ke browser Anda:</p>
        <p style="word-break: break-all;">${verificationUrl}</p>
        
        <p>Tim Perdami Store</p>
      </div>
    `

    await this.sendEmail({
      to: user.email,
      subject: 'Verifikasi Email - Perdami Store',
      html
    })
  }

  async sendPasswordResetEmail(user: any, token: string): Promise<void> {
    if (!this.transporter) return

    const resetUrl = `${process.env.NEXT_PUBLIC_APP_URL}/auth/reset-password?token=${token}`
    
    const html = `
      <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
        <h2 style="color: #2563eb;">Reset Password</h2>
        <p>Halo ${user.name},</p>
        <p>Kami menerima permintaan untuk reset password akun Anda.</p>
        
        <div style="text-align: center; margin: 30px 0;">
          <a href="${resetUrl}" style="background-color: #2563eb; color: white; padding: 12px 24px; text-decoration: none; border-radius: 6px; display: inline-block;">
            Reset Password
          </a>
        </div>
        
        <p>Jika tombol tidak bekerja, salin dan tempel URL berikut ke browser Anda:</p>
        <p style="word-break: break-all;">${resetUrl}</p>
        
        <p>Jika Anda tidak meminta reset password, abaikan email ini.</p>
        <p>Tim Perdami Store</p>
      </div>
    `

    await this.sendEmail({
      to: user.email,
      subject: 'Reset Password - Perdami Store',
      html
    })
  }
}

export const emailService = new EmailService()
