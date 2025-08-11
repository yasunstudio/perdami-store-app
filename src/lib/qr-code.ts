import QRCode from 'qrcode';
import { nanoid } from 'nanoid';

/**
 * Generate a secure verification token for pickup
 */
export function generatePickupToken(): string {
  return nanoid(32); // Generate 32-character random string
}

/**
 * Generate QR code as data URL for pickup verification
 */
export async function generatePickupQRCode(orderId: string, token: string): Promise<string> {
  const verificationUrl = `${process.env.NEXT_PUBLIC_APP_URL}/pickup/verify/${token}`;
  
  try {
    const qrCodeDataUrl = await QRCode.toDataURL(verificationUrl, {
      errorCorrectionLevel: 'M',
      margin: 1,
      color: {
        dark: '#000000',
        light: '#FFFFFF',
      },
      width: 256,
    });
    
    return qrCodeDataUrl;
  } catch (error) {
    console.error('Error generating QR code:', error);
    throw new Error('Failed to generate QR code');
  }
}

/**
 * Validate pickup verification token format
 */
export function isValidPickupToken(token: string): boolean {
  return typeof token === 'string' && token.length === 32 && /^[A-Za-z0-9_-]+$/.test(token);
}

/**
 * Generate QR code for order pickup verification
 */
export async function generateOrderPickupQR(orderId: string, token: string) {
  const verificationUrl = `${process.env.NEXT_PUBLIC_APP_URL}/pickup/verify/${token}`;
  
  return {
    token,
    url: verificationUrl,
    qrCodeDataUrl: await generatePickupQRCode(orderId, token),
  };
}
