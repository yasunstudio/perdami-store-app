import { z } from 'zod'

export interface User {
  id: string
  name: string | null
  email: string
  role: 'ADMIN' | 'CUSTOMER'
  emailVerified: Date | null
  image: string | null
  createdAt: Date
  updatedAt: Date
}

export interface UserStats {
  totalUsers: number
  totalAdmins: number
  totalCustomers: number
  newUsersThisMonth: number
}

export interface UserListResponse {
  users: User[]
  pagination: {
    page: number
    limit: number
    total: number
    totalPages: number
  }
}

export interface UserFilters {
  role?: 'ADMIN' | 'CUSTOMER' | 'ALL'
  search?: string
  verified?: boolean
}

// Zod schemas for validation
export const CreateUserSchema = z.object({
  name: z.string().min(2, 'Nama minimal 2 karakter').max(100, 'Nama maksimal 100 karakter'),
  email: z.string().email('Format email tidak valid'),
  role: z.enum(['ADMIN', 'CUSTOMER'], {
    errorMap: () => ({ message: 'Role harus ADMIN atau CUSTOMER' })
  })
})

export const UpdateUserSchema = z.object({
  id: z.string().min(1, 'ID user diperlukan'),
  name: z.string().min(2, 'Nama minimal 2 karakter').max(100, 'Nama maksimal 100 karakter').optional(),
  email: z.string().email('Format email tidak valid').optional(),
  role: z.enum(['ADMIN', 'CUSTOMER']).optional()
})

export const UpdateRoleSchema = z.object({
  userId: z.string().min(1, 'ID user diperlukan'),
  role: z.enum(['ADMIN', 'CUSTOMER'], {
    errorMap: () => ({ message: 'Role harus ADMIN atau CUSTOMER' })
  })
})

export type CreateUserInput = z.infer<typeof CreateUserSchema>
export type UpdateUserInput = z.infer<typeof UpdateUserSchema>
export type UpdateRoleInput = z.infer<typeof UpdateRoleSchema>

// Helper functions for user management
export const getUserRoleColor = (role: string) => {
  switch (role) {
    case 'ADMIN':
      return 'bg-purple-100 text-purple-800 border-purple-200'
    case 'CUSTOMER':
      return 'bg-blue-100 text-blue-800 border-blue-200'
    default:
      return 'bg-muted text-muted-foreground border-border'
  }
}

export const getUserRoleText = (role: string) => {
  switch (role) {
    case 'ADMIN':
      return 'Admin'
    case 'CUSTOMER':
      return 'Customer'
    default:
      return 'Unknown'
  }
}

export const getVerificationStatus = (emailVerified: Date | null) => {
  return emailVerified ? 'Terverifikasi' : 'Belum Verifikasi'
}

export const getVerificationColor = (emailVerified: Date | null) => {
  return emailVerified 
    ? 'bg-green-100 text-green-800 border-green-200'
    : 'bg-yellow-100 text-yellow-800 border-yellow-200'
}

export const formatUserDate = (date: Date | string): string => {
  try {
    const dateObj = typeof date === 'string' ? new Date(date) : date
    return dateObj.toLocaleDateString('id-ID', {
      day: '2-digit',
      month: 'short',
      year: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    })
  } catch {
    return 'Invalid Date'
  }
}
