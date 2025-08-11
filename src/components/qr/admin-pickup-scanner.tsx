'use client';

import { useState, useRef, useEffect } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Badge } from '@/components/ui/badge';
import { Separator } from '@/components/ui/separator';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { Loader2, QrCode, Camera, CameraOff, CheckCircle, User, Package, InfoIcon, AlertCircle } from 'lucide-react';
import { toast } from 'sonner';

// Import html5-qrcode dynamically to avoid SSR issues
let Html5QrcodeScanner: any = null;
let Html5QrcodeScanType: any = null;

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
  const [scannerLoaded, setScannerLoaded] = useState(false);
  const [scannerError, setScannerError] = useState<string | null>(null);
  const scannerRef = useRef<any>(null);

  // Load scanner library on client side
  useEffect(() => {
    const loadScanner = async () => {
      try {
        const html5QrcodeModule = await import('html5-qrcode');
        Html5QrcodeScanner = html5QrcodeModule.Html5QrcodeScanner;
        Html5QrcodeScanType = html5QrcodeModule.Html5QrcodeScanType;
        setScannerLoaded(true);
      } catch (error) {
        console.error('Failed to load QR scanner:', error);
        setScannerError('Gagal memuat scanner QR code');
      }
    };

    loadScanner();
  }, []);

  const checkCameraPermission = async (): Promise<boolean> => {
    try {
      if (!navigator.mediaDevices || !navigator.mediaDevices.getUserMedia) {
        throw new Error('Browser tidak mendukung akses kamera');
      }

      // Check camera permission
      const stream = await navigator.mediaDevices.getUserMedia({ 
        video: { facingMode: 'environment' } 
      });
      
      // Stop the stream immediately since we're just checking permission
      stream.getTracks().forEach(track => track.stop());
      return true;
    } catch (error: any) {
      console.error('Camera permission check failed:', error);
      
      if (error.name === 'NotAllowedError') {
        setScannerError('Akses kamera ditolak. Silakan berikan izin kamera dan coba lagi.');
      } else if (error.name === 'NotFoundError') {
        setScannerError('Kamera tidak ditemukan pada device ini.');
      } else if (error.name === 'NotSupportedError') {
        setScannerError('Browser tidak mendukung akses kamera.');
      } else if (error.name === 'NotReadableError') {
        setScannerError('Kamera sedang digunakan oleh aplikasi lain.');
      } else {
        setScannerError('Gagal mengakses kamera: ' + error.message);
      }
      
      return false;
    }
  };

  const qrCodeScannerConfig = {
    fps: 10,
    qrbox: { width: 250, height: 250 },
    rememberLastUsedCamera: true,
    showTorchButtonIfSupported: true,
    showZoomSliderIfSupported: true,
    disableFlip: false,
    aspectRatio: 1.0,
  };

  const extractTokenFromText = (text: string): string | null => {
    console.log('Extracting token from:', text);
    
    // Check if it's a URL with pickup/verify path
    if (text.includes('/pickup/verify/')) {
      const urlParts = text.split('/pickup/verify/');
      const token = urlParts[1]?.split('?')[0]?.split('#')[0]; // Remove query params and fragments
      console.log('Extracted token from URL:', token);
      return token || null;
    }
    
    // Check if it's already a token (32 character alphanumeric)
    if (/^[A-Za-z0-9_-]{32}$/.test(text)) {
      console.log('Direct token detected:', text);
      return text;
    }
    
    // Check if it might be an order ID
    if (text.length > 10 && text.length < 50) {
      console.log('Possible order ID:', text);
      return text;
    }
    
    console.log('No valid token found in:', text);
    return null;
  };

  const startScanner = async () => {
    if (!scannerLoaded || !Html5QrcodeScanner) {
      toast.error('Scanner belum siap, coba lagi');
      return;
    }

    // Check if we're on HTTPS (required for camera access)
    if (typeof window !== 'undefined' && window.location.protocol !== 'https:' && window.location.hostname !== 'localhost') {
      setScannerError('Scanner membutuhkan koneksi HTTPS untuk mengakses kamera');
      toast.error('Halaman harus menggunakan HTTPS untuk mengakses kamera');
      return;
    }

    // Check camera permission first
    const hasPermission = await checkCameraPermission();
    if (!hasPermission) {
      toast.error('Tidak dapat mengakses kamera');
      return;
    }

    try {
      setIsScanning(true);
      setScannerError(null);
      
      // Wait a bit for DOM to be ready
      await new Promise(resolve => setTimeout(resolve, 100));
      
      scannerRef.current = new Html5QrcodeScanner(
        'qr-scanner',
        qrCodeScannerConfig,
        false
      );

      scannerRef.current.render(
        (decodedText: string) => {
          console.log('QR Code scanned:', decodedText);
          const token = extractTokenFromText(decodedText);
          if (token) {
            handleScanSuccess(token);
          } else {
            toast.error('QR code tidak valid atau format tidak dikenali');
          }
        },
        (errorMessage: string) => {
          // Only log errors, don't show toast for every scan attempt
          if (!errorMessage.includes('No QR code found') && !errorMessage.includes('QR code parse error')) {
            console.log('QR scan error:', errorMessage);
          }
        }
      );
      
      toast.success('Scanner kamera berhasil dimulai');
    } catch (error: any) {
      console.error('Error starting scanner:', error);
      
      let errorMsg = 'Gagal memulai scanner';
      if (error.message?.includes('Permission denied')) {
        errorMsg = 'Akses kamera ditolak. Berikan izin kamera dan refresh halaman.';
      } else if (error.message?.includes('not found')) {
        errorMsg = 'Kamera tidak ditemukan pada device ini.';
      } else if (error.message?.includes('in use')) {
        errorMsg = 'Kamera sedang digunakan aplikasi lain.';
      }
      
      setScannerError(errorMsg);
      setIsScanning(false);
      toast.error(errorMsg);
    }
  };

  const stopScanner = () => {
    try {
      if (scannerRef.current) {
        scannerRef.current.clear();
        scannerRef.current = null;
      }
    } catch (error) {
      console.error('Error stopping scanner:', error);
    } finally {
      setIsScanning(false);
      setScannerError(null);
    }
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
    <div className="space-y-6">
      {/* Scanner Section */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <QrCode className="h-5 w-5" />
            Scanner QR Code
          </CardTitle>
          <CardDescription>
            Scan QR code customer untuk verifikasi pickup pesanan
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          {scannerError && (
            <Alert variant="destructive">
              <AlertCircle className="h-4 w-4" />
              <AlertDescription>{scannerError}</AlertDescription>
            </Alert>
          )}

          {!scannerLoaded && !scannerError && (
            <Alert>
              <InfoIcon className="h-4 w-4" />
              <AlertDescription>Memuat scanner QR code...</AlertDescription>
            </Alert>
          )}

          {scannerLoaded && !isScanning && !scannerError && (
            <div className="space-y-4">
              <div className="text-center py-4">
                <Button onClick={startScanner} className="flex items-center gap-2">
                  <Camera className="h-4 w-4" />
                  Mulai Scan QR Code
                </Button>
              </div>
              
              <Alert>
                <InfoIcon className="h-4 w-4" />
                <AlertDescription>
                  <div className="space-y-2">
                    <p><strong>Tips penggunaan scanner:</strong></p>
                    <ul className="list-disc list-inside space-y-1 text-sm">
                      <li>Pastikan browser mengizinkan akses kamera</li>
                      <li>Halaman harus menggunakan HTTPS untuk mengakses kamera</li>
                      <li>Posisikan QR code dalam kotak scan</li>
                      <li>Pastikan pencahayaan cukup</li>
                    </ul>
                  </div>
                </AlertDescription>
              </Alert>
            </div>
          )}

          {isScanning && (
            <div className="space-y-4">
              <div 
                id="qr-scanner" 
                className="w-full max-w-md mx-auto border rounded-lg overflow-hidden"
              />
              <div className="text-center">
                <Button 
                  onClick={stopScanner} 
                  variant="outline"
                  className="flex items-center gap-2"
                >
                  <CameraOff className="h-4 w-4" />
                  Berhenti Scan
                </Button>
              </div>
            </div>
          )}
        </CardContent>
      </Card>

      {/* Manual Input Section */}
      <Card>
        <CardHeader>
          <CardTitle>Input Manual</CardTitle>
          <CardDescription>
            Masukkan Order ID atau token verifikasi jika QR code tidak dapat dibaca
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="flex gap-2">
            <div className="flex-1">
              <Input
                placeholder="Masukkan Order ID atau token verifikasi"
                value={manualToken}
                onChange={(e) => setManualToken(e.target.value)}
                onKeyDown={(e) => e.key === 'Enter' && handleManualVerify()}
              />
            </div>
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
