import { Metadata } from 'next';
import AuditLogsViewer from '@/features/admin/audit/components/audit-logs-viewer';
import { PermissionGuard } from '@/components/guards/permission-guard';

import { PERMISSIONS } from '@/lib/permissions';

export const metadata: Metadata = {
  title: 'Audit Logs - Admin Dashboard',
  description: 'View and manage system audit logs',
};

export default function AuditLogsPage() {
  return (
    <PermissionGuard permissions={[PERMISSIONS.AUDIT_LOGS_READ]}>
      <div className="container mx-auto p-6">
        <div className="mb-6">
          <h1 className="text-3xl font-bold">Audit Logs</h1>
          <p className="text-muted-foreground">
            Monitor and track all system activities and user actions
          </p>
        </div>
        
        <AuditLogsViewer />
      </div>
    </PermissionGuard>
  );
}
