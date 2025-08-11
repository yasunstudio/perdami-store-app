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
  const [verifiedToken, setVerifiedToken] = useState<string | null>(null); // Store verified token
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
        console.log('QR Scanner library loaded successfully');
      } catch (error) {
        console.error('Failed to load QR scanner:', error);
        setScannerError('Gagal memuat scanner QR code');
      }
    };

    loadScanner();
  }, []);

  const checkCameraSupport = (): boolean => {
    if (typeof navigator === 'undefined') {
      console.log('Navigator not available (SSR)');
      return false;
    }

    if (!navigator.mediaDevices) {
      console.log('MediaDevices not supported');
      setScannerError('Browser tidak mendukung akses media. Gunakan browser yang lebih baru.');
      return false;
    }

    if (!navigator.mediaDevices.getUserMedia) {
      console.log('getUserMedia not supported');
      setScannerError('Browser tidak mendukung akses kamera.');
      return false;
    }

    return true;
  };

  const qrCodeScannerConfig = {
    fps: 10,
    qrbox: { width: 250, height: 250 },
    rememberLastUsedCamera: true,
    showTorchButtonIfSupported: true,
    showZoomSliderIfSupported: true,
    disableFlip: false,
    aspectRatio: 1.0,
    experimentalFeatures: {
      useBarCodeDetectorIfSupported: true
    }
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
    console.log('Starting scanner...');
    
    if (!scannerLoaded || !Html5QrcodeScanner) {
      console.log('Scanner not loaded yet');
      toast.error('Scanner belum siap, coba lagi');
      return;
    }

    // Check camera support
    if (!checkCameraSupport()) {
      console.log('Camera not supported');
      return;
    }

    // Check if we're on HTTPS (required for camera access)
    if (typeof window !== 'undefined' && window.location.protocol !== 'https:' && window.location.hostname !== 'localhost') {
      console.log('HTTPS required for camera access');
      setScannerError('Scanner membutuhkan koneksi HTTPS untuk mengakses kamera');
      toast.error('Halaman harus menggunakan HTTPS untuk mengakses kamera');
      return;
    }

    try {
      setIsScanning(true);
      setScannerError(null);
      console.log('Creating scanner instance...');
      
      // Wait a bit for DOM to be ready
      await new Promise(resolve => setTimeout(resolve, 100));
      
      // Check if scanner element exists
      const scannerElement = document.getElementById('qr-scanner');
      if (!scannerElement) {
        throw new Error('Scanner element not found');
      }

      scannerRef.current = new Html5QrcodeScanner(
        'qr-scanner',
        qrCodeScannerConfig,
        false
      );

      console.log('Rendering scanner...');
      
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
      
      console.log('Scanner started successfully');
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
      } else if (error.message?.includes('Scanner element not found')) {
        errorMsg = 'Element scanner tidak ditemukan. Refresh halaman dan coba lagi.';
      } else {
        errorMsg = `Gagal memulai scanner: ${error.message}`;
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

  const testCameraAccess = async () => {
    try {
      console.log('Testing camera access...');
      
      if (!navigator.mediaDevices || !navigator.mediaDevices.getUserMedia) {
        throw new Error('Browser tidak mendukung akses kamera');
      }

      const stream = await navigator.mediaDevices.getUserMedia({ 
        video: { facingMode: 'environment' } 
      });
      
      console.log('Camera access successful');
      toast.success('Kamera dapat diakses! Coba mulai scanner sekarang.');
      
      // Stop the stream immediately
      stream.getTracks().forEach(track => track.stop());
      
      // Clear any previous errors
      setScannerError(null);
    } catch (error: any) {
      console.error('Camera test failed:', error);
      
      let errorMsg = 'Test kamera gagal: ';
      if (error.name === 'NotAllowedError') {
        errorMsg += 'Akses kamera ditolak. Berikan izin kamera dan coba lagi.';
      } else if (error.name === 'NotFoundError') {
        errorMsg += 'Kamera tidak ditemukan pada device ini.';
      } else if (error.name === 'NotSupportedError') {
        errorMsg += 'Browser tidak mendukung akses kamera.';
      } else if (error.name === 'NotReadableError') {
        errorMsg += 'Kamera sedang digunakan oleh aplikasi lain.';
      } else {
        errorMsg += error.message;
      }
      
      setScannerError(errorMsg);
      toast.error(errorMsg);
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
      console.log('Verifying token:', token);
      const response = await fetch(`/api/pickup/verify/${token}`);
      
      console.log('Verify response status:', response.status);
      console.log('Verify response headers:', response.headers.get('content-type'));
      
      if (!response.ok) {
        let errorData;
        const contentType = response.headers.get('content-type');
        
        if (contentType && contentType.includes('application/json')) {
          try {
            errorData = await response.json();
          } catch (jsonError) {
            console.error('Failed to parse error JSON:', jsonError);
            throw new Error(`HTTP ${response.status}: ${response.statusText}`);
          }
        } else {
          const textData = await response.text();
          console.error('Non-JSON error response:', textData);
          throw new Error(`HTTP ${response.status}: ${response.statusText}`);
        }
        
        throw new Error(errorData.error || 'Gagal memverifikasi token');
      }

      const contentType = response.headers.get('content-type');
      if (!contentType || !contentType.includes('application/json')) {
        const textData = await response.text();
        console.error('Expected JSON but got:', textData);
        throw new Error('Server mengembalikan response yang tidak valid');
      }

      const data = await response.json();
      console.log('Verify success:', data);
      setOrderDetails(data);
      setVerifiedToken(token); // Store the successfully verified token
      toast.success('Order berhasil diverifikasi');
    } catch (error) {
      console.error('Verify token error:', error);
      const errorMessage = error instanceof Error ? error.message : 'Gagal memverifikasi';
      toast.error(errorMessage);
    } finally {
      setIsLoading(false);
    }
  };

  const confirmPickup = async () => {
    if (!orderDetails || !verifiedToken) {
      toast.error('Token verifikasi tidak ditemukan. Silakan verifikasi ulang.');
      return;
    }

    setIsConfirming(true);

    try {
      console.log('Confirming pickup for token:', verifiedToken);
      
      const response = await fetch(`/api/pickup/verify/${verifiedToken}`, {
        method: 'POST',
      });

      console.log('Confirm response status:', response.status);
      console.log('Confirm response headers:', response.headers.get('content-type'));

      if (!response.ok) {
        let errorData;
        const contentType = response.headers.get('content-type');
        
        if (contentType && contentType.includes('application/json')) {
          try {
            errorData = await response.json();
          } catch (jsonError) {
            console.error('Failed to parse error JSON:', jsonError);
            throw new Error(`HTTP ${response.status}: ${response.statusText}`);
          }
        } else {
          const textData = await response.text();
          console.error('Non-JSON error response:', textData);
          throw new Error(`HTTP ${response.status}: ${response.statusText}`);
        }
        
        throw new Error(errorData.error || 'Gagal konfirmasi pickup');
      }

      const contentType = response.headers.get('content-type');
      let data;
      
      if (contentType && contentType.includes('application/json')) {
        try {
          data = await response.json();
          console.log('Confirm success:', data);
        } catch (jsonError) {
          console.error('Failed to parse success JSON:', jsonError);
          // If JSON parsing fails but response was OK, treat as success
          console.log('Treating as successful despite JSON parse error');
          data = { success: true };
        }
      } else {
        // If response is not JSON but OK, treat as success
        const textData = await response.text();
        console.log('Non-JSON success response:', textData);
        data = { success: true };
      }

      toast.success('Pickup berhasil dikonfirmasi!');
      
      // Reset state
      setOrderDetails(null);
      setManualToken('');
      setVerifiedToken(null);
    } catch (error) {
      console.error('Confirm pickup error:', error);
      const errorMessage = error instanceof Error ? error.message : 'Gagal konfirmasi pickup';
      toast.error(errorMessage);
    } finally {
      setIsConfirming(false);
    }
  };

  const resetVerification = () => {
    setOrderDetails(null);
    setManualToken('');
    setVerifiedToken(null);
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
              <div className="text-center py-4 space-y-3">
                <Button onClick={startScanner} className="flex items-center gap-2">
                  <Camera className="h-4 w-4" />
                  Mulai Scan QR Code
                </Button>
                <div className="text-sm text-muted-foreground">atau</div>
                <Button 
                  onClick={testCameraAccess} 
                  variant="outline" 
                  size="sm"
                  className="flex items-center gap-2"
                >
                  <Camera className="h-3 w-3" />
                  Test Akses Kamera
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
                      <li>Coba "Test Akses Kamera" terlebih dahulu jika ada masalah</li>
                    </ul>
                  </div>
                </AlertDescription>
              </Alert>
            </div>
          )}

          {scannerError && scannerLoaded && (
            <div className="space-y-4">
              <div className="text-center py-4">
                <Button 
                  onClick={testCameraAccess} 
                  variant="outline"
                  className="flex items-center gap-2"
                >
                  <Camera className="h-4 w-4" />
                  Test Akses Kamera
                </Button>
              </div>
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
