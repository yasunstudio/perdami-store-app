'use client';

import { useState, useRef, useEffect } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Badge } from '@/components/ui/badge';
import { Separator } from '@/components/ui/separator';
import { Loader2, QrCode, Camera, CameraOff, CheckCircle, User, Package, Calendar } from 'lucide-react';
import { toast } from 'sonner';
import { Html5QrcodeScanner, Html5QrcodeScanType } from 'html5-qrcode';

interface OrderDetails {
  orderId: string;
  orderNumber: string;
  customer: {
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
    };
  }>;
  totalAmount: number;
  orderStatus: string;
  pickupStatus: string;
  createdAt: string;
}

export function AdminPickupScanner() {
  const [isScanning, setIsScanning] = useState(false);
  const [manualToken, setManualToken] = useState('');
  const [orderDetails, setOrderDetails] = useState<OrderDetails | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [isConfirming, setIsConfirming] = useState(false);
  const scannerRef = useRef<Html5QrcodeScanner | null>(null);
  const scannerElementRef = useRef<HTMLDivElement>(null);

  const qrCodeScannerConfig = {
    fps: 10,
    qrbox: { width: 250, height: 250 },
    supportedScanTypes: [Html5QrcodeScanType.SCAN_TYPE_CAMERA],
    showTorchButtonIfSupported: true,
    showZoomSliderIfSupported: true,
  };

  const startScanner = () => {
    if (!scannerElementRef.current) return;

    setIsScanning(true);
    
    scannerRef.current = new Html5QrcodeScanner(
      'qr-scanner',
      qrCodeScannerConfig,
      false
    );

    scannerRef.current.render(
      (decodedText: string) => {
        // Extract token from URL or use the text directly
        const token = extractTokenFromText(decodedText);
        if (token) {
          handleScanSuccess(token);
        } else {
          toast.error('QR code tidak valid');
        }
      },
      (errorMessage: string) => {
        // Only log errors, don't show toast for every scan attempt
        console.log('QR scan error:', errorMessage);
      }
    );
  };

  const stopScanner = () => {
    if (scannerRef.current) {
      scannerRef.current.clear();
      scannerRef.current = null;
    }
    setIsScanning(false);
  };

  const extractTokenFromText = (text: string): string | null => {
    // Check if it's a URL
    if (text.includes('/pickup/verify/')) {
      const urlParts = text.split('/pickup/verify/');
      return urlParts[1] || null;
    }
    
    // Check if it's already a token (32 character alphanumeric)
    if (/^[A-Za-z0-9_-]{32}$/.test(text)) {
      return text;
    }
    
    return null;
  };

  const handleScanSuccess = async (token: string) => {
    stopScanner();
    await verifyToken(token);
  };

  const handleManualVerify = async () => {
    if (!manualToken.trim()) {
      toast.error('Masukkan Order ID atau token verifikasi');
      return;
    }
    
    await verifyToken(manualToken.trim());
  };

  const verifyToken = async (token: string) => {
    setIsLoading(true);
    setOrderDetails(null);

    try {
      const response = await fetch(`/api/pickup/verify/${token}`);
      
      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error || 'Gagal memverifikasi token');
      }

      const data = await response.json();
      setOrderDetails(data);
      toast.success('Order berhasil diverifikasi');
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : 'Gagal memverifikasi';
      toast.error(errorMessage);
    } finally {
      setIsLoading(false);
    }
  };

  const confirmPickup = async () => {
    if (!orderDetails) return;

    setIsConfirming(true);

    try {
      const token = extractTokenFromText(manualToken) || manualToken;
      const response = await fetch(`/api/pickup/verify/${token}`, {
        method: 'POST',
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error || 'Gagal konfirmasi pickup');
      }

      const data = await response.json();
      toast.success('Pickup berhasil dikonfirmasi!');
      
      // Reset state
      setOrderDetails(null);
      setManualToken('');
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : 'Gagal konfirmasi pickup';
      toast.error(errorMessage);
    } finally {
      setIsConfirming(false);
    }
  };

  const resetVerification = () => {
    setOrderDetails(null);
    setManualToken('');
  };

  useEffect(() => {
    return () => {
      stopScanner();
    };
  }, []);

  return (
    <div className="max-w-4xl mx-auto space-y-6">
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <QrCode className="h-5 w-5" />
            Scanner Pickup Verifikasi
          </CardTitle>
          <CardDescription>
            Scan QR code customer atau input manual untuk verifikasi pickup pesanan
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-6">
          {/* Scanner Section */}
          <div>
            <Label className="text-base font-medium">Scan QR Code</Label>
            <div className="mt-2">
              {!isScanning ? (
                <Button onClick={startScanner} className="flex items-center gap-2">
                  <Camera className="h-4 w-4" />
                  Mulai Scan QR Code
                </Button>
              ) : (
                <div className="space-y-4">
                  <div 
                    id="qr-scanner" 
                    ref={scannerElementRef}
                    className="w-full max-w-md mx-auto"
                  />
                  <Button 
                    onClick={stopScanner} 
                    variant="outline"
                    className="flex items-center gap-2"
                  >
                    <CameraOff className="h-4 w-4" />
                    Berhenti Scan
                  </Button>
                </div>
              )}
            </div>
          </div>

          <Separator />

          {/* Manual Input Section */}
          <div>
            <Label htmlFor="manual-token" className="text-base font-medium">
              Input Manual
            </Label>
            <div className="mt-2 flex gap-2">
              <Input
                id="manual-token"
                placeholder="Masukkan Order ID atau token verifikasi"
                value={manualToken}
                onChange={(e) => setManualToken(e.target.value)}
                onKeyDown={(e) => e.key === 'Enter' && handleManualVerify()}
              />
              <Button 
                onClick={handleManualVerify}
                disabled={isLoading || !manualToken.trim()}
              >
                {isLoading ? (
                  <Loader2 className="h-4 w-4 animate-spin" />
                ) : (
                  'Verifikasi'
                )}
              </Button>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Order Details */}
      {orderDetails && (
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Package className="h-5 w-5" />
              Detail Pesanan
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <Label className="text-sm font-medium">Order Number</Label>
                <p className="text-lg font-mono">{orderDetails.orderNumber}</p>
              </div>
              <div>
                <Label className="text-sm font-medium">Status</Label>
                <div className="flex gap-2 mt-1">
                  <Badge variant="outline">{orderDetails.orderStatus}</Badge>
                  <Badge variant={orderDetails.pickupStatus === 'PICKED_UP' ? 'default' : 'secondary'}>
                    {orderDetails.pickupStatus}
                  </Badge>
                </div>
              </div>
            </div>

            <Separator />

            <div>
              <Label className="text-sm font-medium flex items-center gap-2">
                <User className="h-4 w-4" />
                Data Customer
              </Label>
              <div className="mt-2 space-y-1">
                <p><strong>Nama:</strong> {orderDetails.customer.name}</p>
                <p><strong>Email:</strong> {orderDetails.customer.email}</p>
                {orderDetails.customer.phone && (
                  <p><strong>Phone:</strong> {orderDetails.customer.phone}</p>
                )}
              </div>
            </div>

            <Separator />

            <div>
              <Label className="text-sm font-medium">Items Pesanan</Label>
              <div className="mt-2 space-y-2">
                {orderDetails.orderItems.map((item) => (
                  <div key={item.id} className="flex justify-between items-center p-3 bg-muted rounded-md">
                    <div>
                      <p className="font-medium">{item.bundle.name}</p>
                      <p className="text-sm text-muted-foreground">
                        {item.quantity}x @ Rp {item.unitPrice.toLocaleString('id-ID')}
                      </p>
                    </div>
                    <p className="font-medium">
                      Rp {item.totalPrice.toLocaleString('id-ID')}
                    </p>
                  </div>
                ))}
              </div>
              <div className="mt-3 pt-3 border-t">
                <div className="flex justify-between items-center font-bold text-lg">
                  <span>Total:</span>
                  <span>Rp {orderDetails.totalAmount.toLocaleString('id-ID')}</span>
                </div>
              </div>
            </div>

            <Separator />

            <div className="flex gap-2 justify-end">
              <Button variant="outline" onClick={resetVerification}>
                Reset
              </Button>
              <Button 
                onClick={confirmPickup}
                disabled={isConfirming || orderDetails.pickupStatus === 'PICKED_UP'}
                className="flex items-center gap-2"
              >
                {isConfirming ? (
                  <Loader2 className="h-4 w-4 animate-spin" />
                ) : (
                  <CheckCircle className="h-4 w-4" />
                )}
                {orderDetails.pickupStatus === 'PICKED_UP' ? 'Sudah Diambil' : 'Konfirmasi Pickup'}
              </Button>
            </div>
          </CardContent>
        </Card>
      )}
    </div>
  );
}
