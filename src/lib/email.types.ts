// Email service types only - no server imports
import type { Order, User, Payment } from '@prisma/client'

export interface EmailConfig {
  host: string
  port: number
  secure: boolean
  user: string
  pass: string
  from: string
  fromName: string
}

export interface EmailPayload {
  to: string
  subject: string
  html: string
  text?: string
}

// Order with user relationship
export type OrderWithUser = Order & {
  user: User
  orderItems?: any[]
}

// Payment with order and user relationship
export type PaymentWithOrder = Payment & {
  order: Order & { user: User }
}

export interface EmailServiceInterface {
  sendEmail(payload: EmailPayload): Promise<void>
  sendOrderConfirmation(data: { order: OrderWithUser }): Promise<void>
  sendOrderStatusUpdate(order: OrderWithUser, oldStatus: string, newStatus: string): Promise<void>
  sendPaymentConfirmation(payment: PaymentWithOrder): Promise<void>
  sendSecurityAlert(user: User, alertType: string, details: string): Promise<void>
  sendWelcomeEmail(user: User): Promise<void>
  sendVerificationEmail(user: User, token: string): Promise<void>
  sendPasswordResetEmail(user: User, token: string): Promise<void>
}
