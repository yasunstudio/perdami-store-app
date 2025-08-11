import { auth } from '@/lib/auth';
import { redirect } from 'next/navigation';
import { AdminPageLayout } from '@/components/admin/admin-page-layout';
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
    <AdminPageLayout
      title="Pickup Scanner"
      description="Scan QR code customer atau input manual untuk verifikasi pengambilan pesanan"
      showBackButton={false}
    >
      <AdminPickupScanner />
    </AdminPageLayout>
  );
}
