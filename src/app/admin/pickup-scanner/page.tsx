import { auth } from '@/lib/auth';
import { redirect } from 'next/navigation';
import { AdminPickupScanner } from '@/components/qr/admin-pickup-scanner';

interface PickupScannerPageProps {
  searchParams: {
    token?: string;
  };
}

export default async function PickupScannerPage({ searchParams }: PickupScannerPageProps) {
  const session = await auth();

  if (!session?.user || session.user.role !== 'ADMIN') {
    redirect('/login');
  }

  return (
    <div className="container mx-auto py-8">
      <div className="mb-8">
        <h1 className="text-3xl font-bold">Pickup Verifikasi</h1>
        <p className="text-muted-foreground mt-2">
          Scan QR code customer atau input manual untuk verifikasi pengambilan pesanan
        </p>
      </div>

      <AdminPickupScanner />
    </div>
  );
}
