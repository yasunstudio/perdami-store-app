import { prisma } from '@/lib/prisma'
import { UserFilters, CreateUserInput, UpdateUserInput } from '../types/user.types'
import { UserActivityLogService } from './user-activity-log.service'
import { auditLog } from '@/lib/audit'

export class UserService {
  /**
   * Get user statistics for dashboard
   */
  static async getUserStats() {
    try {
      const [totalUsers, totalAdmins, totalCustomers, newUsersThisMonth] = await Promise.all([
        prisma.user.count(),
        prisma.user.count({ where: { role: 'ADMIN' } }),
        prisma.user.count({ where: { role: 'CUSTOMER' } }),
        prisma.user.count({
          where: {
            createdAt: {
              gte: new Date(new Date().getFullYear(), new Date().getMonth(), 1)
            }
          }
        })
      ])

      return {
        totalUsers,
        totalAdmins,
        totalCustomers,
        newUsersThisMonth
      }
    } catch (error) {
      console.error('Error fetching user stats:', error)
      return {
        totalUsers: 0,
        totalAdmins: 0,
        totalCustomers: 0,
        newUsersThisMonth: 0
      }
    }
  }

  /**
   * Get paginated users with filters
   */
  static async getUsers(
    page = 1,
    limit = 10,
    filters: UserFilters = {}
  ) {
    try {
      const skip = (page - 1) * limit
      const { role, search, verified } = filters

      // Build where clause
      const where: Record<string, unknown> = {}
      
      if (role && role !== 'ALL') {
        where.role = role
      }
      
      if (search) {
        where.OR = [
          { name: { contains: search, mode: 'insensitive' } },
          { email: { contains: search, mode: 'insensitive' } }
        ]
      }
      
      if (verified !== undefined) {
        where.emailVerified = verified ? { not: null } : null
      }

      const [users, total] = await Promise.all([
        prisma.user.findMany({
          where,
          orderBy: { createdAt: 'desc' },
          skip,
          take: limit,
          select: {
            id: true,
            name: true,
            email: true,
            role: true,
            emailVerified: true,
            image: true,
            createdAt: true,
            updatedAt: true
          }
        }),
        prisma.user.count({ where })
      ])

      return {
        users,
        pagination: {
          page,
          limit,
          total,
          totalPages: Math.ceil(total / limit)
        }
      }
    } catch (error) {
      console.error('Error fetching users:', error)
      return {
        users: [],
        pagination: {
          page: 1,
          limit: 10,
          total: 0,
          totalPages: 0
        }
      }
    }
  }

  /**
   * Get single user by ID
   */
  static async getUserById(userId: string) {
    try {
      const user = await prisma.user.findUnique({
        where: { id: userId },
        select: {
          id: true,
          name: true,
          email: true,
          role: true,
          emailVerified: true,
          image: true,
          createdAt: true,
          updatedAt: true
        }
      })

      return { success: true, user }
    } catch (error) {
      console.error('Error fetching user:', error)
      return { success: false, error: 'Failed to fetch user' }
    }
  }

  /**
   * Create new user
   */
  static async createUser(userData: CreateUserInput, actorUserId?: string) {
    try {
      // Check if email already exists
      const existingUser = await prisma.user.findUnique({
        where: { email: userData.email }
      })

      if (existingUser) {
        return { success: false, error: 'Email sudah digunakan' }
      }

      // Create user with default password (should be changed in production)
      const newUser = await prisma.user.create({
        data: {
          name: userData.name,
          email: userData.email,
          role: userData.role,
          // Note: Password handling would be implemented with proper authentication
        },
        select: {
          id: true,
          name: true,
          email: true,
          role: true,
          emailVerified: true,
          image: true,
          createdAt: true,
          updatedAt: true
        }
      })

      // Log the activity
      if (actorUserId) {
        await UserActivityLogService.logUserAction(
          actorUserId,
          'CREATE_USER',
          newUser.id,
          {
            userName: newUser.name,
            userEmail: newUser.email,
            userRole: newUser.role
          }
        )
        
        // Also log using audit service for consistency
        await auditLog.createUser(actorUserId, newUser.id, userData)
      }

      return { success: true, user: newUser }
    } catch (error) {
      console.error('Error creating user:', error)
      return { success: false, error: 'Failed to create user' }
    }
  }

  /**
   * Update user
   */
  static async updateUser(userData: UpdateUserInput, actorUserId?: string) {
    try {
      const { id, ...updateData } = userData

      // Check if email is being changed and if it already exists
      if (updateData.email) {
        const existingUser = await prisma.user.findFirst({
          where: { 
            email: updateData.email,
            NOT: { id }
          }
        })

        if (existingUser) {
          return { success: false, error: 'Email sudah digunakan' }
        }
      }

      const updatedUser = await prisma.user.update({
        where: { id },
        data: updateData,
        select: {
          id: true,
          name: true,
          email: true,
          role: true,
          emailVerified: true,
          image: true,
          createdAt: true,
          updatedAt: true
        }
      })

      // Log the activity
      if (actorUserId) {
        await UserActivityLogService.logUserAction(
          actorUserId,
          'UPDATE_USER',
          updatedUser.id,
          {
            updatedFields: Object.keys(updateData),
            userName: updatedUser.name,
            userEmail: updatedUser.email
          }
        )
      }

      return { success: true, user: updatedUser }
    } catch (error) {
      console.error('Error updating user:', error)
      return { success: false, error: 'Failed to update user' }
    }
  }

  /**
   * Update user role
   */
  static async updateUserRole(userId: string, role: 'ADMIN' | 'CUSTOMER', actorUserId?: string) {
    try {
      const updatedUser = await prisma.user.update({
        where: { id: userId },
        data: { role },
        select: {
          id: true,
          name: true,
          email: true,
          role: true,
          emailVerified: true,
          image: true,
          createdAt: true,
          updatedAt: true
        }
      })

      // Log the activity
      if (actorUserId) {
        await UserActivityLogService.logUserAction(
          actorUserId,
          'UPDATE_ROLE',
          updatedUser.id,
          {
            newRole: role,
            userName: updatedUser.name,
            userEmail: updatedUser.email
          }
        )
      }

      return { success: true, user: updatedUser }
    } catch (error) {
      console.error('Error updating user role:', error)
      return { success: false, error: 'Failed to update user role' }
    }
  }

  /**
   * Delete user
   */
  static async deleteUser(userId: string, actorUserId?: string) {
    try {
      // Check if user exists
      const user = await prisma.user.findUnique({
        where: { id: userId }
      })

      if (!user) {
        return { success: false, error: 'User tidak ditemukan' }
      }

      // Log the activity before deletion
      if (actorUserId) {
        await UserActivityLogService.logUserAction(
          actorUserId,
          'DELETE_USER',
          userId,
          {
            userName: user.name,
            userEmail: user.email,
            userRole: user.role
          }
        )
      }

      // In production, you might want to soft delete or check for dependencies
      await prisma.user.delete({
        where: { id: userId }
      })

      return { success: true }
    } catch (error) {
      console.error('Error deleting user:', error)
      return { success: false, error: 'Failed to delete user' }
    }
  }

  /**
   * Get recent users for dashboard
   */
  static async getRecentUsers(limit = 5) {
    try {
      const users = await prisma.user.findMany({
        orderBy: { createdAt: 'desc' },
        take: limit,
        select: {
          id: true,
          name: true,
          email: true,
          role: true,
          emailVerified: true,
          image: true,
          createdAt: true
        }
      })

      return users
    } catch (error) {
      console.error('Error fetching recent users:', error)
      return []
    }
  }
}
