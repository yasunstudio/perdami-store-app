'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Badge } from '@/components/ui/badge';
import { Separator } from '@/components/ui/separator';
import { Loader2, Save, ArrowLeft, Package, User, CreditCard, Calendar, AlertCircle } from 'lucide-react';
import { toast } from 'sonner';
import Link from 'next/link';

interface OrderData {
  id: string;
  orderNumber: string;
  orderStatus: string;
  paymentStatus: string;
  pickupStatus: string;
  notes?: string;
  subtotalAmount: number;
  serviceFee: number;
  totalAmount: number;
  pickupDate?: string;
  createdAt: string;
  user: {
    id: string;
    name: string;
    email: string;
    phone?: string;
  };
  orderItems: Array<{
    id: string;
    quantity: number;
    unitPrice: number;
    totalPrice: number;
    bundle: {
      id: string;
      name: string;
      image?: string;
      store: {
        id: string;
        name: string;
      };
    };
  }>;
  bank?: {
    id: string;
    name: string;
    accountNumber: string;
    accountName: string;
  };
}

interface AdminOrderEditFormProps {
  orderId: string;
  onOrderUpdate?: () => void;
}

const ORDER_STATUSES = [
  { value: 'PENDING', label: 'Pending', color: 'bg-yellow-100 text-yellow-800' },
  { value: 'CONFIRMED', label: 'Confirmed', color: 'bg-blue-100 text-blue-800' },
  { value: 'PROCESSING', label: 'Processing', color: 'bg-purple-100 text-purple-800' },
  { value: 'READY', label: 'Ready', color: 'bg-green-100 text-green-800' },
  { value: 'COMPLETED', label: 'Completed', color: 'bg-emerald-100 text-emerald-800' },
  { value: 'CANCELLED', label: 'Cancelled', color: 'bg-red-100 text-red-800' },
];

const PAYMENT_STATUSES = [
  { value: 'PENDING', label: 'Pending', color: 'bg-yellow-100 text-yellow-800' },
  { value: 'PAID', label: 'Paid', color: 'bg-green-100 text-green-800' },
  { value: 'FAILED', label: 'Failed', color: 'bg-red-100 text-red-800' },
  { value: 'REFUNDED', label: 'Refunded', color: 'bg-gray-100 text-gray-800' },
];

const PICKUP_STATUSES = [
  { value: 'NOT_PICKED_UP', label: 'Not Picked Up', color: 'bg-yellow-100 text-yellow-800' },
  { value: 'PICKED_UP', label: 'Picked Up', color: 'bg-green-100 text-green-800' },
];

// Helper function to get status badge colors
const getStatusBadgeColor = (status: string, type: 'order' | 'payment' | 'pickup') => {
  switch (type) {
    case 'order':
      return ORDER_STATUSES.find(s => s.value === status)?.color || 'bg-gray-100 text-gray-800';
    case 'payment':
      return PAYMENT_STATUSES.find(s => s.value === status)?.color || 'bg-gray-100 text-gray-800';
    case 'pickup':
      return PICKUP_STATUSES.find(s => s.value === status)?.color || 'bg-gray-100 text-gray-800';
    default:
      return 'bg-gray-100 text-gray-800';
  }
};

export function AdminOrderEditForm({ orderId, onOrderUpdate }: AdminOrderEditFormProps) {
  const router = useRouter();
  const [order, setOrder] = useState<OrderData | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [isSaving, setIsSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // Form state
  const [orderStatus, setOrderStatus] = useState('');
  const [paymentStatus, setPaymentStatus] = useState('');
  const [pickupStatus, setPickupStatus] = useState('');
  const [notes, setNotes] = useState('');
  const [pickupDate, setPickupDate] = useState('');

  // Fetch order data
  useEffect(() => {
    fetchOrder();
  }, [orderId]);

  const fetchOrder = async () => {
    try {
      setIsLoading(true);
      setError(null);

      const response = await fetch(`/api/admin/orders/${orderId}`);
      
      if (!response.ok) {
        throw new Error('Failed to fetch order data');
      }

      const data = await response.json();
      setOrder(data);
      
      // Set form initial values
      setOrderStatus(data.orderStatus);
      setPaymentStatus(data.paymentStatus);
      setPickupStatus(data.pickupStatus);
      setNotes(data.notes || '');
      setPickupDate(data.pickupDate ? data.pickupDate.split('T')[0] : '');

    } catch (error) {
      console.error('Error fetching order:', error);
      setError(error instanceof Error ? error.message : 'Failed to fetch order');
    } finally {
      setIsLoading(false);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!order) return;

    setIsSaving(true);

    try {
      const updateData: any = {
        orderStatus,
        paymentStatus,
        pickupStatus,
        notes: notes.trim() || null,
      };

      // Add pickup date if provided
      if (pickupDate) {
        updateData.pickupDate = new Date(pickupDate).toISOString();
      }

      const response = await fetch(`/api/admin/orders/${orderId}`, {
        method: 'PATCH',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(updateData),
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error || 'Failed to update order');
      }

      toast.success('Pesanan berhasil diupdate');
      
      // Call the callback to refresh data or navigate back
      if (onOrderUpdate) {
        onOrderUpdate();
      } else {
        router.push(`/admin/orders/${orderId}`);
      }
      
    } catch (error) {
      console.error('Error updating order:', error);
      toast.error(error instanceof Error ? error.message : 'Gagal mengupdate pesanan');
    } finally {
      setIsSaving(false);
    }
  };

  const getStatusBadgeColor = (status: string, type: 'order' | 'payment' | 'pickup') => {
    let statuses = ORDER_STATUSES;
    if (type === 'payment') statuses = PAYMENT_STATUSES;
    if (type === 'pickup') statuses = PICKUP_STATUSES;
    
    const statusData = statuses.find(s => s.value === status);
    return statusData?.color || 'bg-gray-100 text-gray-800';
  };

  if (isLoading) {
    return (
      <div className="flex items-center justify-center py-8">
        <Loader2 className="h-8 w-8 animate-spin" />
        <span className="ml-2">Memuat data pesanan...</span>
      </div>
    );
  }

  if (error || !order) {
    return (
      <Card>
        <CardContent className="py-8">
          <div className="text-center">
            <AlertCircle className="h-12 w-12 text-red-500 mx-auto mb-4" />
            <h3 className="text-lg font-medium text-red-900 mb-2">
              Gagal Memuat Data
            </h3>
            <p className="text-red-600 mb-4">{error || 'Pesanan tidak ditemukan'}</p>
            <Button asChild variant="outline">
              <Link href="/admin/orders">Kembali ke Daftar Pesanan</Link>
            </Button>
          </div>
        </CardContent>
      </Card>
    );
  }

  return (
    <div className="space-y-6">
      {/* Main Content - Same layout as detail page */}
      <div className="grid grid-cols-1 gap-6">
        {/* Order Information Card - Edit Version */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Package className="h-5 w-5" />
              Edit Informasi Pesanan
            </CardTitle>
            <CardDescription>
              Update status dan informasi pesanan #{order.orderNumber}
            </CardDescription>
          </CardHeader>
          <CardContent>
            <form onSubmit={handleSubmit} className="space-y-6">
              <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                {/* Left Column - Order Status */}
                <div className="space-y-6">
                  <div className="p-4 bg-muted/30 rounded-lg border">
                    <h4 className="text-sm font-medium text-muted-foreground mb-4">Status Pesanan</h4>
                    <div className="space-y-4">
                      <div className="space-y-3">
                        <Label htmlFor="orderStatus" className="text-sm font-medium">Status Order</Label>
                        <Select value={orderStatus} onValueChange={setOrderStatus}>
                          <SelectTrigger className="h-11">
                            <SelectValue />
                          </SelectTrigger>
                          <SelectContent>
                            {ORDER_STATUSES.map((status) => (
                              <SelectItem key={status.value} value={status.value}>
                                <div className="flex items-center gap-2">
                                  <Badge className={`${status.color} text-xs border-0`}>
                                    {status.label}
                                  </Badge>
                                </div>
                              </SelectItem>
                            ))}
                          </SelectContent>
                        </Select>
                      </div>

                      <div className="space-y-3">
                        <Label htmlFor="paymentStatus" className="text-sm font-medium">Status Pembayaran</Label>
                        <Select value={paymentStatus} onValueChange={setPaymentStatus}>
                          <SelectTrigger className="h-11">
                            <SelectValue />
                          </SelectTrigger>
                          <SelectContent>
                            {PAYMENT_STATUSES.map((status) => (
                              <SelectItem key={status.value} value={status.value}>
                                <div className="flex items-center gap-2">
                                  <Badge className={`${status.color} text-xs border-0`}>
                                    {status.label}
                                  </Badge>
                                </div>
                              </SelectItem>
                            ))}
                          </SelectContent>
                        </Select>
                      </div>

                      <div className="space-y-3">
                        <Label htmlFor="pickupStatus" className="text-sm font-medium">Status Pickup</Label>
                        <Select value={pickupStatus} onValueChange={setPickupStatus}>
                          <SelectTrigger className="h-11">
                            <SelectValue />
                          </SelectTrigger>
                          <SelectContent>
                            {PICKUP_STATUSES.map((status) => (
                              <SelectItem key={status.value} value={status.value}>
                                <div className="flex items-center gap-2">
                                  <Badge className={`${status.color} text-xs border-0`}>
                                    {status.label}
                                  </Badge>
                                </div>
                              </SelectItem>
                            ))}
                          </SelectContent>
                        </Select>
                      </div>
                    </div>
                  </div>
                </div>

                {/* Right Column - Additional Info */}
                <div className="space-y-6">
                  <div className="p-4 bg-muted/30 rounded-lg border">
                    <h4 className="text-sm font-medium text-muted-foreground mb-4">Informasi Tambahan</h4>
                    <div className="space-y-4">
                      <div className="space-y-2">
                        <Label htmlFor="pickupDate">Tanggal Pickup</Label>
                        <Input
                          type="date"
                          value={pickupDate}
                          onChange={(e) => setPickupDate(e.target.value)}
                        />
                      </div>

                      <div className="space-y-2">
                        <Label htmlFor="notes">Catatan Admin</Label>
                        <Textarea
                          value={notes}
                          onChange={(e) => setNotes(e.target.value)}
                          placeholder="Tambahkan catatan untuk pesanan ini..."
                          rows={4}
                        />
                      </div>
                    </div>
                  </div>
                </div>
              </div>

              <Separator />

              {/* Submit Buttons */}
              <div className="flex gap-3">
                <Button type="submit" disabled={isSaving}>
                  {isSaving ? (
                    <>
                      <Loader2 className="h-4 w-4 animate-spin mr-2" />
                      Menyimpan...
                    </>
                  ) : (
                    <>
                      <Save className="h-4 w-4 mr-2" />
                      Simpan Perubahan
                    </>
                  )}
                </Button>
                <Button variant="outline" asChild>
                  <Link href={`/admin/orders/${orderId}`}>Batal</Link>
                </Button>
              </div>
            </form>
          </CardContent>
        </Card>

        {/* Order Items - Same as detail page but read-only */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Package className="h-5 w-5" />
              Item Pesanan
            </CardTitle>
            <CardDescription>
              Daftar item dalam pesanan ini
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              {order.orderItems.map((item) => (
                <div key={item.id} className="flex items-center gap-4 p-4 border rounded-lg">
                  {item.bundle.image && (
                    <div className="w-16 h-16 rounded-lg overflow-hidden bg-muted">
                      <img 
                        src={item.bundle.image} 
                        alt={item.bundle.name}
                        className="w-full h-full object-cover"
                      />
                    </div>
                  )}
                  <div className="flex-1">
                    <h4 className="font-medium">{item.bundle.name}</h4>
                    <p className="text-sm text-muted-foreground">{item.bundle.store.name}</p>
                    <div className="flex items-center gap-4 mt-2">
                      <span className="text-sm">Qty: {item.quantity}</span>
                      <span className="text-sm">@ Rp {item.unitPrice.toLocaleString('id-ID')}</span>
                    </div>
                  </div>
                  <div className="text-right">
                    <p className="font-medium">Rp {item.totalPrice.toLocaleString('id-ID')}</p>
                  </div>
                </div>
              ))}
              
              <Separator />
              
              <div className="space-y-2">
                <div className="flex justify-between">
                  <span className="text-sm">Subtotal:</span>
                  <span className="text-sm">Rp {order.subtotalAmount.toLocaleString('id-ID')}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-sm">Biaya Layanan:</span>
                  <span className="text-sm">Rp {order.serviceFee.toLocaleString('id-ID')}</span>
                </div>
                <Separator />
                <div className="flex justify-between font-medium">
                  <span>Total:</span>
                  <span>Rp {order.totalAmount.toLocaleString('id-ID')}</span>
                </div>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Customer Information - Read only */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <User className="h-5 w-5" />
              Informasi Customer
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div>
                <Label className="text-sm font-medium text-muted-foreground">Nama</Label>
                <p className="font-medium">{order.user.name}</p>
              </div>
              <div>
                <Label className="text-sm font-medium text-muted-foreground">Email</Label>
                <p className="font-medium">{order.user.email}</p>
              </div>
              {order.user.phone && (
                <div>
                  <Label className="text-sm font-medium text-muted-foreground">Telepon</Label>
                  <p className="font-medium">{order.user.phone}</p>
                </div>
              )}
              <div>
                <Label className="text-sm font-medium text-muted-foreground">Dibuat</Label>
                <p className="font-medium">
                  {new Date(order.createdAt).toLocaleDateString('id-ID', {
                    year: 'numeric',
                    month: 'long',
                    day: 'numeric',
                    hour: '2-digit',
                    minute: '2-digit',
                  })}
                </p>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
