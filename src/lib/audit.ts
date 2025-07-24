import { prisma } from '@/lib/prisma';

interface AuditLogData {
  userId: string;
  action: string;
  resource: string;
  resourceId?: string;
  details?: Record<string, any>;
  ipAddress?: string;
  userAgent?: string;
}

interface AuditLogOptions {
  includeHeaders?: boolean;
}

export async function createAuditLog(
  data: AuditLogData,
  options: AuditLogOptions = { includeHeaders: true }
): Promise<void> {
  try {
    const ipAddress = data.ipAddress || 'unknown';
    const userAgent = data.userAgent || 'unknown';

    // Note: Headers are now expected to be passed explicitly in data
    // This avoids dependency on next/headers which is not available in all contexts

    await prisma.userActivityLog.create({
      data: {
        userId: data.userId,
        action: data.action,
        resource: data.resource,
        resourceId: data.resourceId,
        details: data.details ? JSON.stringify(data.details) : null,
        ipAddress,
        userAgent,
      },
    });
  } catch (error) {
    console.error('Failed to create audit log:', error);
    // Don't throw error to avoid breaking the main operation
  }
}

function getClientIP(headers: any): string {
  // Try different header names for IP address
  const ipHeaders = [
    'x-forwarded-for',
    'x-real-ip',
    'x-client-ip',
    'cf-connecting-ip',
    'true-client-ip'
  ];

  for (const header of ipHeaders) {
    const value = headers.get(header);
    if (value) {
      // x-forwarded-for can contain multiple IPs, take the first one
      return value.split(',')[0].trim();
    }
  }

  return 'unknown';
}

// Specific audit log functions for common operations
export const auditLog = {
  // Authentication
  login: (userId: string, details?: Record<string, any>) =>
    createAuditLog({
      userId,
      action: 'LOGIN',
      resource: 'auth',
      details,
    }),

  logout: (userId: string) =>
    createAuditLog({
      userId,
      action: 'LOGOUT',
      resource: 'auth',
    }),

  changePassword: (userId: string, details?: Record<string, any>) =>
    createAuditLog({
      userId,
      action: 'CHANGE_PASSWORD',
      resource: 'auth',
      details,
    }),

  // User Management
  createUser: (adminUserId: string, newUserId: string, details?: Record<string, any>) =>
    createAuditLog({
      userId: adminUserId,
      action: 'CREATE_USER',
      resource: 'user',
      resourceId: newUserId,
      details,
    }),

  updateUser: (adminUserId: string, targetUserId: string, changes: Record<string, any>) =>
    createAuditLog({
      userId: adminUserId,
      action: 'UPDATE_USER',
      resource: 'user',
      resourceId: targetUserId,
      details: { changes },
    }),

  updateProfile: (userId: string, changes: Record<string, any>) =>
    createAuditLog({
      userId,
      action: 'UPDATE_PROFILE',
      resource: 'user',
      resourceId: userId,
      details: { changes },
    }),

  deleteUser: (adminUserId: string, targetUserId: string) =>
    createAuditLog({
      userId: adminUserId,
      action: 'DELETE_USER',
      resource: 'user',
      resourceId: targetUserId,
    }),

  // Store Management
  createStore: (userId: string, storeId: string, details?: Record<string, any>) =>
    createAuditLog({
      userId,
      action: 'CREATE_STORE',
      resource: 'store',
      resourceId: storeId,
      details,
    }),

  updateStore: (userId: string, storeId: string, changes: Record<string, any>) =>
    createAuditLog({
      userId,
      action: 'UPDATE_STORE',
      resource: 'store',
      resourceId: storeId,
      details: { changes },
    }),

  deleteStore: (userId: string, storeId: string) =>
    createAuditLog({
      userId,
      action: 'DELETE_STORE',
      resource: 'store',
      resourceId: storeId,
    }),

  // Bank Management
  createBank: (userId: string, bankId: string, details?: Record<string, any>) =>
    createAuditLog({
      userId,
      action: 'CREATE_BANK',
      resource: 'bank',
      resourceId: bankId,
      details,
    }),

  updateBank: (userId: string, bankId: string, oldData: Record<string, any>, changes: Record<string, any>) =>
    createAuditLog({
      userId,
      action: 'UPDATE_BANK',
      resource: 'bank',
      resourceId: bankId,
      details: { oldData, changes },
    }),

  deleteBank: (userId: string, bankId: string, bankData: Record<string, any>) =>
    createAuditLog({
      userId,
      action: 'DELETE_BANK',
      resource: 'bank',
      resourceId: bankId,
      details: { bankData },
    }),

  // Order Management
  createOrder: (userId: string, orderId: string, details?: Record<string, any>) =>
    createAuditLog({
      userId,
      action: 'CREATE_ORDER',
      resource: 'order',
      resourceId: orderId,
      details,
    }),

  updateOrder: (userId: string, orderId: string, changes: Record<string, any>) =>
    createAuditLog({
      userId,
      action: 'UPDATE_ORDER',
      resource: 'order',
      resourceId: orderId,
      details: { changes },
    }),

  deleteOrder: (userId: string, orderId: string) =>
    createAuditLog({
      userId,
      action: 'DELETE_ORDER',
      resource: 'order',
      resourceId: orderId,
    }),

  updateOrderStatus: (userId: string, orderId: string, oldStatus: string, newStatus: string) =>
    createAuditLog({
      userId,
      action: 'UPDATE_ORDER_STATUS',
      resource: 'order',
      resourceId: orderId,
      details: { oldStatus, newStatus },
    }),

  updatePaymentStatus: (userId: string, orderId: string, oldStatus: string, newStatus: string) =>
    createAuditLog({
      userId,
      action: 'UPDATE_PAYMENT_STATUS',
      resource: 'ORDER',
      resourceId: orderId,
      details: { oldStatus, newStatus },
    }),

  markPaymentAsFailed: (userId: string, orderId: string, details: Record<string, any>) =>
    createAuditLog({
      userId,
      action: 'MARK_PAYMENT_FAILED',
      resource: 'ORDER',
      resourceId: orderId,
      details,
    }),

  processRefund: (userId: string, orderId: string, details: Record<string, any>) =>
    createAuditLog({
      userId,
      action: 'PROCESS_REFUND',
      resource: 'ORDER',
      resourceId: orderId,
      details,
    }),

  // File Management
  uploadFile: (userId: string, fileName: string, fileUrl: string, fileSize?: number) =>
    createAuditLog({
      userId,
      action: 'UPLOAD_FILE',
      resource: 'file',
      details: { fileName, fileUrl, fileSize },
    }),

  deleteFile: (userId: string, fileName: string, fileUrl: string) =>
    createAuditLog({
      userId,
      action: 'DELETE_FILE',
      resource: 'file',
      details: { fileName, fileUrl },
    }),

  // System
  viewAdminDashboard: (userId: string) =>
    createAuditLog({
      userId,
      action: 'VIEW_ADMIN_DASHBOARD',
      resource: 'system',
    }),

  viewAnalytics: (userId: string, reportType?: string) =>
    createAuditLog({
      userId,
      action: 'VIEW_ANALYTICS',
      resource: 'system',
      details: { reportType },
    }),

  exportData: (userId: string, dataType: string, recordCount?: number) =>
    createAuditLog({
      userId,
      action: 'EXPORT_DATA',
      resource: 'system',
      details: { dataType, recordCount },
    }),

  updateSettings: (userId: string, changes: Record<string, any>) =>
    createAuditLog({
      userId,
      action: 'UPDATE_SETTINGS',
      resource: 'system',
      details: { changes },
    }),

  // File Upload Operations
  uploadPaymentProof: (userId: string, fileId: string, details?: Record<string, any>) =>
    createAuditLog({
      userId,
      action: 'UPLOAD_PAYMENT_PROOF',
      resource: 'file',
      resourceId: fileId,
      details,
    }),

  uploadProfileImage: (userId: string, fileId: string, details?: Record<string, any>) =>
    createAuditLog({
      userId,
      action: 'UPLOAD_PROFILE_IMAGE',
      resource: 'file',
      resourceId: fileId,
      details,
    }),

  removeProfileImage: (userId: string, details?: Record<string, any>) =>
    createAuditLog({
      userId,
      action: 'REMOVE_PROFILE_IMAGE',
      resource: 'file',
      details,
    }),

  // Email & Verification Operations
  verifyEmail: (userId: string, verificationToken: string, details?: Record<string, any>) =>
    createAuditLog({
      userId,
      action: 'VERIFY_EMAIL',
      resource: 'auth',
      resourceId: verificationToken,
      details,
    }),

  sendVerificationEmail: (userId: string, email: string, details?: Record<string, any>) =>
    createAuditLog({
      userId,
      action: 'SEND_VERIFICATION_EMAIL',
      resource: 'auth',
      details: { email, ...details },
    }),

  // Session Management Operations
  revokeOtherSessions: (userId: string, currentSessionId: string, details?: Record<string, any>) =>
    createAuditLog({
      userId,
      action: 'REVOKE_OTHER_SESSIONS',
      resource: 'session',
      resourceId: currentSessionId,
      details,
    }),

  revokeSession: (userId: string, sessionId: string, details?: Record<string, any>) =>
    createAuditLog({
      userId,
      action: 'REVOKE_SESSION',
      resource: 'session',
      resourceId: sessionId,
      details,
    }),

  // Notification logging
  notificationSent: (userId: string, type: string, title: string, details?: Record<string, any>) =>
    createAuditLog({
      userId,
      action: 'NOTIFICATION_SENT',
      resource: 'NOTIFICATION',
      details: {
        type,
        title,
        ...details
      }
    }),

  emailSent: (userId: string, emailType: string, recipient: string, details?: Record<string, any>) =>
    createAuditLog({
      userId,
      action: 'EMAIL_SENT',
      resource: 'EMAIL',
      details: {
        emailType,
        recipient,
        ...details
      }
    }),

  notificationRead: (userId: string, notificationId: string, details?: Record<string, any>) =>
    createAuditLog({
      userId,
      action: 'NOTIFICATION_READ',
      resource: 'NOTIFICATION',
      resourceId: notificationId,
      details
    }),

  deleteNotification: (userId: string, notificationId: string, details?: Record<string, any>) =>
    createAuditLog({
      userId,
      action: 'NOTIFICATION_DELETED',
      resource: 'NOTIFICATION',
      resourceId: notificationId,
      details
    }),

  // Order delay logging
  orderDelayed: (userId: string, orderId: string, reason: string, details?: Record<string, any>) =>
    createAuditLog({
      userId,
      action: 'ORDER_DELAYED',
      resource: 'order',
      resourceId: orderId,
      details: {
        reason,
        ...details
      }
    }),
};

// Query functions for retrieving audit logs
export async function getAuditLogs(options: {
  userId?: string;
  action?: string;
  resource?: string;
  resourceId?: string;
  startDate?: Date;
  endDate?: Date;
  limit?: number;
  offset?: number;
}) {
  const {
    userId,
    action,
    resource,
    resourceId,
    startDate,
    endDate,
    limit = 50,
    offset = 0,
  } = options;

  const where: any = {};

  if (userId) where.userId = userId;
  if (action) where.action = action;
  if (resource) where.resource = resource;
  if (resourceId) where.resourceId = resourceId;
  if (startDate || endDate) {
    where.createdAt = {};
    if (startDate) where.createdAt.gte = startDate;
    if (endDate) where.createdAt.lte = endDate;
  }

  const [logs, total] = await Promise.all([
    prisma.userActivityLog.findMany({
      where,
      include: {
        user: {
          select: {
            id: true,
            name: true,
            email: true,
            role: true,
          },
        },
      },
      orderBy: { createdAt: 'desc' },
      take: limit,
      skip: offset,
    }),
    prisma.userActivityLog.count({ where }),
  ]);

  return {
    logs: logs.map(log => ({
      ...log,
      details: log.details ? (() => {
        try {
          return JSON.parse(log.details);
        } catch (error) {
          // If JSON parsing fails, return the raw string as a text detail
          return { text: log.details };
        }
      })() : null,
    })),
    total,
    hasMore: offset + limit < total,
  };
}

export async function getAuditLogStats(options: {
  startDate?: Date;
  endDate?: Date;
}) {
  const { startDate, endDate } = options;

  const where: any = {};
  if (startDate || endDate) {
    where.createdAt = {};
    if (startDate) where.createdAt.gte = startDate;
    if (endDate) where.createdAt.lte = endDate;
  }

  const stats = await prisma.userActivityLog.groupBy({
    by: ['action', 'resource'],
    where,
    _count: {
      id: true,
    },
    orderBy: {
      _count: {
        id: 'desc',
      },
    },
  });

  return stats;
}