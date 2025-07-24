import { prisma } from '@/lib/prisma'

export interface ActivityLogEntry {
  id: string
  userId: string
  action: string
  resource: string
  resourceId?: string
  details?: string
  ipAddress?: string
  userAgent?: string
  createdAt: Date
  user: {
    id: string
    name: string | null
    email: string
  }
}

export interface CreateActivityLogInput {
  userId: string
  action: string
  resource: string
  resourceId?: string
  details?: Record<string, unknown>
  ipAddress?: string
  userAgent?: string
}

export class UserActivityLogService {
  /**
   * Create new activity log entry
   */
  static async createLog(input: CreateActivityLogInput) {
    try {
      const logEntry = await prisma.userActivityLog.create({
        data: {
          userId: input.userId,
          action: input.action,
          resource: input.resource,
          resourceId: input.resourceId,
          details: input.details ? JSON.stringify(input.details) : null,
          ipAddress: input.ipAddress,
          userAgent: input.userAgent,
        },
        include: {
          user: {
            select: {
              name: true,
              email: true,
              role: true,
            }
          }
        }
      })

      return { success: true, log: logEntry }
    } catch (error) {
      console.error('Error creating activity log:', error)
      return { success: false, error: 'Failed to create activity log' }
    }
  }

  /**
   * Get activity logs with pagination and filters
   */
  static async getActivityLogs(
    page = 1,
    limit = 20,
    filters: {
      userId?: string
      action?: string
      resource?: string
      dateFrom?: Date
      dateTo?: Date
    } = {}
  ) {
    try {
      const skip = (page - 1) * limit
      const { userId, action, resource, dateFrom, dateTo } = filters

      // Build where clause
      const where: {
        userId?: string
        action?: string
        resource?: string
        createdAt?: {
          gte?: Date
          lte?: Date
        }
      } = {}
      
      if (userId) {
        where.userId = userId
      }
      
      if (action) {
        where.action = action
      }
      
      if (resource) {
        where.resource = resource
      }
      
      if (dateFrom || dateTo) {
        where.createdAt = {}
        if (dateFrom) {
          where.createdAt.gte = dateFrom
        }
        if (dateTo) {
          where.createdAt.lte = dateTo
        }
      }

      const [logs, total] = await Promise.all([
        prisma.userActivityLog.findMany({
          where,
          orderBy: { createdAt: 'desc' },
          skip,
          take: limit,
          include: {
            user: {
              select: {
                name: true,
                email: true,
                role: true,
              }
            }
          }
        }),
        prisma.userActivityLog.count({ where })
      ])

      return {
        logs,
        pagination: {
          page,
          limit,
          total,
          totalPages: Math.ceil(total / limit)
        }
      }
    } catch (error) {
      console.error('Error fetching activity logs:', error)
      return {
        logs: [],
        pagination: {
          page: 1,
          limit: 20,
          total: 0,
          totalPages: 0
        }
      }
    }
  }

  /**
   * Get recent activity for a specific user
   */
  static async getUserRecentActivity(userId: string, limit = 10) {
    try {
      const logs = await prisma.userActivityLog.findMany({
        where: { userId },
        orderBy: { createdAt: 'desc' },
        take: limit,
        include: {
          user: {
            select: {
              name: true,
              email: true,
              role: true,
            }
          }
        }
      })

      return logs
    } catch (error) {
      console.error('Error fetching user recent activity:', error)
      return []
    }
  }

  /**
   * Get activity stats for dashboard
   */
  static async getActivityStats() {
    try {
      const today = new Date()
      today.setHours(0, 0, 0, 0)
      
      const thisWeek = new Date()
      thisWeek.setDate(thisWeek.getDate() - 7)
      
      const thisMonth = new Date()
      thisMonth.setDate(1)
      thisMonth.setHours(0, 0, 0, 0)

      const [totalLogs, todayLogs, weekLogs, monthLogs, mostActiveUsers] = await Promise.all([
        prisma.userActivityLog.count(),
        prisma.userActivityLog.count({
          where: {
            createdAt: { gte: today }
          }
        }),
        prisma.userActivityLog.count({
          where: {
            createdAt: { gte: thisWeek }
          }
        }),
        prisma.userActivityLog.count({
          where: {
            createdAt: { gte: thisMonth }
          }
        }),
        prisma.userActivityLog.groupBy({
          by: ['userId'],
          _count: {
            id: true
          },
          orderBy: {
            _count: {
              id: 'desc'
            }
          },
          take: 5
        })
      ])

      return {
        totalLogs,
        todayLogs,
        weekLogs,
        monthLogs,
        mostActiveUsers
      }
    } catch (error) {
      console.error('Error fetching activity stats:', error)
      return {
        totalLogs: 0,
        todayLogs: 0,
        weekLogs: 0,
        monthLogs: 0,
        mostActiveUsers: []
      }
    }
  }

  /**
   * Helper function to log user management actions
   */
  static async logUserAction(
    actorUserId: string,
    action: string,
    targetUserId?: string,
    details?: Record<string, unknown>,
    request?: {
      ip?: string
      userAgent?: string
    }
  ) {
    return this.createLog({
      userId: actorUserId,
      action,
      resource: 'user',
      resourceId: targetUserId,
      details,
      ipAddress: request?.ip,
      userAgent: request?.userAgent,
    })
  }
}
