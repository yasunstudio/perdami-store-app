import { auth } from '@/lib/auth';
import { redirect } from 'next/navigation';
import { AdminOrderEditForm } from '@/components/admin/orders/admin-order-edit-form';

interface AdminOrderEditPageProps {
  params: Promise<{
    id: string;
  }>;
}

export default async function AdminOrderEditPage({ params }: AdminOrderEditPageProps) {
  const session = await auth();

  if (!session?.user || session.user.role !== 'ADMIN') {
    redirect('/admin/login');
  }

  const { id } = await params;

  return (
    <div className="container mx-auto py-8">
      <div className="mb-8">
        <h1 className="text-3xl font-bold">Edit Pesanan</h1>
        <p className="text-muted-foreground mt-2">
          Edit informasi dan status pesanan
        </p>
      </div>

      <AdminOrderEditForm orderId={id} />
    </div>
  );
}
