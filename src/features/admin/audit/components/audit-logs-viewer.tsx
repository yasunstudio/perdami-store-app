'use client';

import { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { format } from 'date-fns';
import { Search, Filter, Download, RefreshCw, User, Package, ShoppingCart, Store, Settings, Shield } from 'lucide-react';
import { toast } from 'sonner';

interface AuditLog {
  id: string;
  action: string;
  resource: string;
  resourceId?: string;
  details?: any;
  ipAddress?: string;
  userAgent?: string;
  createdAt: string;
  user: {
    id: string;
    name: string;
    email: string;
    role: string;
  };
}

interface AuditLogsViewerProps {
  className?: string;
}

const resourceIcons = {
  user: User,
  product: Package,
  order: ShoppingCart,
  store: Store,
  system: Settings,
  auth: Shield,
  category: Package,
  file: Package,
};

const actionColors = {
  // Authentication
  LOGIN: 'bg-green-100 text-green-800',
  LOGOUT: 'bg-gray-100 text-gray-800',
  
  // Create operations
  CREATE_USER: 'bg-blue-100 text-blue-800',
  CREATE_PRODUCT: 'bg-blue-100 text-blue-800',
  CREATE_CATEGORY: 'bg-blue-100 text-blue-800',
  CREATE_STORE: 'bg-blue-100 text-blue-800',
  
  // Update operations
  UPDATE_USER: 'bg-yellow-100 text-yellow-800',
  UPDATE_PRODUCT: 'bg-yellow-100 text-yellow-800',
  UPDATE_CATEGORY: 'bg-yellow-100 text-yellow-800',
  UPDATE_STORE: 'bg-yellow-100 text-yellow-800',
  UPDATE_ORDER_STATUS: 'bg-yellow-100 text-yellow-800',
  UPDATE_PAYMENT_STATUS: 'bg-yellow-100 text-yellow-800',
  
  // Delete operations
  DELETE_USER: 'bg-red-100 text-red-800',
  DELETE_PRODUCT: 'bg-red-100 text-red-800',
  DELETE_CATEGORY: 'bg-red-100 text-red-800',
  DELETE_STORE: 'bg-red-100 text-red-800',
  
  // Bulk operations
  BULK_UPDATE_PRODUCTS: 'bg-orange-100 text-orange-800',
  BULK_DELETE_PRODUCTS: 'bg-red-100 text-red-800',
  
  // File operations
  UPLOAD_FILE: 'bg-purple-100 text-purple-800',
  DELETE_FILE: 'bg-red-100 text-red-800',
  
  // System operations
  VIEW_ADMIN_DASHBOARD: 'bg-gray-100 text-gray-800',
  VIEW_ANALYTICS: 'bg-indigo-100 text-indigo-800',
  EXPORT_DATA: 'bg-green-100 text-green-800',
  UPDATE_SETTINGS: 'bg-yellow-100 text-yellow-800',
};

export default function AuditLogsViewer({ className }: AuditLogsViewerProps) {
  const [logs, setLogs] = useState<AuditLog[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [resourceFilter, setResourceFilter] = useState('all');
  const [actionFilter, setActionFilter] = useState('all');
  const [userFilter, setUserFilter] = useState('all');
  const [dateRange, setDateRange] = useState('all');
  const [page, setPage] = useState(1);
  const [total, setTotal] = useState(0);
  const [hasMore, setHasMore] = useState(false);

  const pageSize = 50;

  useEffect(() => {
    fetchLogs();
  }, [searchTerm, resourceFilter, actionFilter, userFilter, dateRange, page]);

  const fetchLogs = async () => {
    try {
      setLoading(true);
      
      const params = new URLSearchParams({
        page: page.toString(),
        limit: pageSize.toString(),
      });

      if (searchTerm) params.append('search', searchTerm);
      if (resourceFilter !== 'all') params.append('resource', resourceFilter);
      if (actionFilter !== 'all') params.append('action', actionFilter);
      if (userFilter !== 'all') params.append('userId', userFilter);
      if (dateRange !== 'all') params.append('dateRange', dateRange);

      const response = await fetch(`/api/admin/audit-logs?${params}`);
      
      if (!response.ok) {
        throw new Error('Failed to fetch audit logs');
      }

      const data = await response.json();
      setLogs(data.logs);
      setTotal(data.total);
      setHasMore(data.hasMore);
    } catch (error) {
      console.error('Error fetching audit logs:', error);
      toast.error('Failed to fetch audit logs');
    } finally {
      setLoading(false);
    }
  };

  const exportLogs = async () => {
    try {
      const params = new URLSearchParams();
      if (searchTerm) params.append('search', searchTerm);
      if (resourceFilter !== 'all') params.append('resource', resourceFilter);
      if (actionFilter !== 'all') params.append('action', actionFilter);
      if (userFilter !== 'all') params.append('userId', userFilter);
      if (dateRange !== 'all') params.append('dateRange', dateRange);

      const response = await fetch(`/api/admin/audit-logs/export?${params}`);
      
      if (!response.ok) {
        throw new Error('Failed to export audit logs');
      }

      const blob = await response.blob();
      const url = window.URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.style.display = 'none';
      a.href = url;
      a.download = `audit-logs-${format(new Date(), 'yyyy-MM-dd')}.csv`;
      document.body.appendChild(a);
      a.click();
      window.URL.revokeObjectURL(url);
      toast.success('Audit logs exported successfully');
    } catch (error) {
      console.error('Error exporting audit logs:', error);
      toast.error('Failed to export audit logs');
    }
  };

  const getResourceIcon = (resource: string) => {
    const Icon = resourceIcons[resource as keyof typeof resourceIcons] || Package;
    return <Icon className="h-4 w-4" />;
  };

  const getActionBadge = (action: string) => {
    const colorClass = actionColors[action as keyof typeof actionColors] || 'bg-gray-100 text-gray-800';
    return (
      <Badge variant="secondary" className={colorClass}>
        {action.replace(/_/g, ' ').toLowerCase()}
      </Badge>
    );
  };

  const formatDetails = (details: any) => {
    if (!details) return null;
    
    const keys = Object.keys(details);
    if (keys.length === 0) return null;
    
    // Show only key information
    if (details.changes) {
      const changeKeys = Object.keys(details.changes);
      return `Modified: ${changeKeys.join(', ')}`;
    }
    
    if (details.count) {
      return `${details.count} items affected`;
    }
    
    if (details.oldStatus && details.newStatus) {
      return `${details.oldStatus} → ${details.newStatus}`;
    }
    
    return Object.entries(details)
      .slice(0, 2)
      .map(([key, value]) => `${key}: ${value}`)
      .join(', ');
  };

  const resetFilters = () => {
    setSearchTerm('');
    setResourceFilter('all');
    setActionFilter('all');
    setUserFilter('all');
    setDateRange('all');
    setPage(1);
  };

  return (
    <div className={className}>
      <Card>
        <CardHeader className="flex flex-row items-center justify-between">
          <CardTitle className="flex items-center gap-2">
            <Shield className="h-5 w-5" />
            Audit Logs
          </CardTitle>
          <div className="flex items-center gap-2">
            <Button variant="outline" size="sm" onClick={fetchLogs}>
              <RefreshCw className="h-4 w-4 mr-1" />
              Refresh
            </Button>
            <Button variant="outline" size="sm" onClick={exportLogs}>
              <Download className="h-4 w-4 mr-1" />
              Export
            </Button>
          </div>
        </CardHeader>
        <CardContent>
          {/* Filters */}
          <div className="grid grid-cols-1 md:grid-cols-5 gap-4 mb-6">
            <div className="relative">
              <Search className="absolute left-3 top-3 h-4 w-4 text-muted-foreground" />
              <Input
                placeholder="Search logs..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="pl-9"
              />
            </div>
            
            <Select value={resourceFilter} onValueChange={setResourceFilter}>
              <SelectTrigger>
                <SelectValue placeholder="Resource" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All Resources</SelectItem>
                <SelectItem value="user">Users</SelectItem>
                <SelectItem value="product">Products</SelectItem>
                <SelectItem value="category">Categories</SelectItem>
                <SelectItem value="store">Stores</SelectItem>
                <SelectItem value="order">Orders</SelectItem>
                <SelectItem value="file">Files</SelectItem>
                <SelectItem value="system">System</SelectItem>
                <SelectItem value="auth">Authentication</SelectItem>
              </SelectContent>
            </Select>

            <Select value={actionFilter} onValueChange={setActionFilter}>
              <SelectTrigger>
                <SelectValue placeholder="Action" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All Actions</SelectItem>
                <SelectItem value="CREATE_PRODUCT">Create</SelectItem>
                <SelectItem value="UPDATE_PRODUCT">Update</SelectItem>
                <SelectItem value="DELETE_PRODUCT">Delete</SelectItem>
                <SelectItem value="LOGIN">Login</SelectItem>
                <SelectItem value="EXPORT_DATA">Export</SelectItem>
              </SelectContent>
            </Select>

            <Select value={dateRange} onValueChange={setDateRange}>
              <SelectTrigger>
                <SelectValue placeholder="Date Range" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All Time</SelectItem>
                <SelectItem value="today">Today</SelectItem>
                <SelectItem value="yesterday">Yesterday</SelectItem>
                <SelectItem value="week">This Week</SelectItem>
                <SelectItem value="month">This Month</SelectItem>
              </SelectContent>
            </Select>

            <Button variant="outline" onClick={resetFilters} className="flex items-center gap-2">
              <Filter className="h-4 w-4" />
              Reset
            </Button>
          </div>

          {/* Results Summary */}
          <div className="flex items-center justify-between mb-4">
            <p className="text-sm text-muted-foreground">
              Showing {logs.length} of {total} audit logs
            </p>
            {total > pageSize && (
              <div className="flex items-center gap-2">
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => setPage(p => Math.max(1, p - 1))}
                  disabled={page === 1}
                >
                  Sebelumnya
                </Button>
                <span className="text-sm">Page {page}</span>
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => setPage(p => p + 1)}
                  disabled={!hasMore}
                >
                  Selanjutnya
                </Button>
              </div>
            )}
          </div>

          {/* Logs Table */}
          <div className="border rounded-lg">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Timestamp</TableHead>
                  <TableHead>User</TableHead>
                  <TableHead>Action</TableHead>
                  <TableHead>Resource</TableHead>
                  <TableHead>Details</TableHead>
                  <TableHead>IP Address</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {loading ? (
                  <TableRow>
                    <TableCell colSpan={6} className="text-center py-8">
                      Loading audit logs...
                    </TableCell>
                  </TableRow>
                ) : logs.length === 0 ? (
                  <TableRow>
                    <TableCell colSpan={6} className="text-center py-8">
                      No audit logs found
                    </TableCell>
                  </TableRow>
                ) : (
                  logs.map((log) => (
                    <TableRow key={log.id}>
                      <TableCell className="font-mono text-sm">
                        {format(new Date(log.createdAt), 'MMM dd, HH:mm:ss')}
                      </TableCell>
                      <TableCell>
                        <div className="flex flex-col">
                          <span className="font-medium text-sm">{log.user.name}</span>
                          <span className="text-xs text-muted-foreground">{log.user.email}</span>
                        </div>
                      </TableCell>
                      <TableCell>
                        {getActionBadge(log.action)}
                      </TableCell>
                      <TableCell>
                        <div className="flex items-center gap-2">
                          {getResourceIcon(log.resource)}
                          <span className="capitalize">{log.resource}</span>
                          {log.resourceId && (
                            <span className="text-xs text-muted-foreground">#{log.resourceId.slice(-8)}</span>
                          )}
                        </div>
                      </TableCell>
                      <TableCell className="max-w-xs">
                        <span className="text-sm text-muted-foreground truncate">
                          {formatDetails(log.details)}
                        </span>
                      </TableCell>
                      <TableCell className="font-mono text-xs">
                        {log.ipAddress || 'unknown'}
                      </TableCell>
                    </TableRow>
                  ))
                )}
              </TableBody>
            </Table>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
