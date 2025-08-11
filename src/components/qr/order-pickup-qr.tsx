'use client';

import { useState, useEffect } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Loader2, QrCode, Download, Share, AlertCircle } from 'lucide-react';
import { toast } from 'sonner';
import Image from 'next/image';

interface QRCodeData {
  orderId: string;
  orderNumber: string;
  token: string;
  verificationUrl: string;
  qrCodeDataUrl: string;
}

interface OrderPickupQRProps {
  orderId: string;
  orderStatus: string;
  pickupStatus: string;
}

export function OrderPickupQR({ orderId, orderStatus, pickupStatus }: OrderPickupQRProps) {
  const [qrData, setQrData] = useState<QRCodeData | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const canGenerateQR = orderStatus === 'READY' && pickupStatus === 'NOT_PICKED_UP';

  const generateQRCode = async () => {
    if (!canGenerateQR) return;

    setIsLoading(true);
    setError(null);

    try {
      const response = await fetch(`/api/orders/${orderId}/qr`, {
        method: 'POST',
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error || 'Failed to generate QR code');
      }

      const data = await response.json();
      setQrData(data);
      toast.success('QR Code berhasil dibuat');
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : 'Gagal membuat QR code';
      setError(errorMessage);
      toast.error(errorMessage);
    } finally {
      setIsLoading(false);
    }
  };

  const downloadQRCode = () => {
    if (!qrData) return;

    const link = document.createElement('a');
    link.href = qrData.qrCodeDataUrl;
    link.download = `pickup-qr-${qrData.orderNumber}.png`;
    link.click();
    toast.success('QR Code berhasil diunduh');
  };

  const shareQRCode = async () => {
    if (!qrData) return;

    if (navigator.share) {
      try {
        // Convert data URL to blob for sharing
        const response = await fetch(qrData.qrCodeDataUrl);
        const blob = await response.blob();
        const file = new File([blob], `pickup-qr-${qrData.orderNumber}.png`, { type: 'image/png' });

        await navigator.share({
          title: `QR Code Pickup - ${qrData.orderNumber}`,
          text: 'QR Code untuk pickup pesanan',
          files: [file],
        });
      } catch (error) {
        // Fallback to URL sharing
        await navigator.share({
          title: `QR Code Pickup - ${qrData.orderNumber}`,
          text: 'QR Code untuk pickup pesanan',
          url: qrData.verificationUrl,
        });
      }
    } else {
      // Fallback for browsers without Web Share API
      await navigator.clipboard.writeText(qrData.verificationUrl);
      toast.success('Link verifikasi berhasil disalin');
    }
  };

  // Auto-generate QR code when order is ready
  useEffect(() => {
    if (canGenerateQR && !qrData && !isLoading) {
      generateQRCode();
    }
  }, [canGenerateQR, qrData, isLoading]);

  if (pickupStatus === 'PICKED_UP') {
    return (
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <QrCode className="h-5 w-5" />
            QR Code Pickup
          </CardTitle>
          <CardDescription>
            Pesanan sudah diambil
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="text-center py-8">
            <Badge variant="secondary" className="mb-2">
              Sudah Diambil
            </Badge>
            <p className="text-sm text-muted-foreground">
              Pesanan ini sudah berhasil diambil di venue
            </p>
          </div>
        </CardContent>
      </Card>
    );
  }

  if (!canGenerateQR) {
    return (
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <QrCode className="h-5 w-5" />
            QR Code Pickup
          </CardTitle>
          <CardDescription>
            QR code untuk verifikasi pengambilan pesanan
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="text-center py-8">
            <AlertCircle className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
            <p className="text-sm text-muted-foreground">
              QR Code akan tersedia ketika pesanan sudah siap untuk diambil
            </p>
            <Badge variant="outline" className="mt-2">
              Status: {orderStatus}
            </Badge>
          </div>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <QrCode className="h-5 w-5" />
          QR Code Pickup
        </CardTitle>
        <CardDescription>
          Tunjukkan QR code ini kepada petugas untuk mengambil pesanan
        </CardDescription>
      </CardHeader>
      <CardContent>
        {error && (
          <div className="mb-4 p-3 bg-destructive/10 border border-destructive/20 rounded-md">
            <p className="text-sm text-destructive">{error}</p>
            <Button
              onClick={generateQRCode}
              variant="outline"
              size="sm"
              className="mt-2"
            >
              Coba Lagi
            </Button>
          </div>
        )}

        {isLoading && (
          <div className="text-center py-8">
            <Loader2 className="h-8 w-8 animate-spin mx-auto mb-4" />
            <p className="text-sm text-muted-foreground">
              Membuat QR code...
            </p>
          </div>
        )}

        {qrData && (
          <div className="space-y-4">
            <div className="flex justify-center">
              <div className="p-4 bg-white rounded-lg border shadow-sm">
                <Image
                  src={qrData.qrCodeDataUrl}
                  alt={`QR Code for order ${qrData.orderNumber}`}
                  width={256}
                  height={256}
                  className="rounded"
                />
              </div>
            </div>

            <div className="text-center space-y-2">
              <p className="text-sm font-medium">Order: {qrData.orderNumber}</p>
              <p className="text-xs text-muted-foreground">
                Tunjukkan QR code ini kepada petugas di venue untuk verifikasi pickup
              </p>
            </div>

            <div className="flex gap-2 justify-center">
              <Button
                onClick={downloadQRCode}
                variant="outline"
                size="sm"
                className="flex items-center gap-2"
              >
                <Download className="h-4 w-4" />
                Unduh
              </Button>
              <Button
                onClick={shareQRCode}
                variant="outline"
                size="sm"
                className="flex items-center gap-2"
              >
                <Share className="h-4 w-4" />
                Bagikan
              </Button>
            </div>

            <div className="mt-4 p-3 bg-muted rounded-md">
              <p className="text-xs text-muted-foreground mb-2">
                Link verifikasi manual:
              </p>
              <code className="text-xs break-all bg-background p-2 rounded border block">
                {qrData.verificationUrl}
              </code>
            </div>
          </div>
        )}
      </CardContent>
    </Card>
  );
}
