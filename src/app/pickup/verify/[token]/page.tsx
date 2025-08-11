import { notFound, redirect } from 'next/navigation';
import { auth } from '@/lib/auth';

interface PickupVerifyPageProps {
  params: {
    token: string;
  };
}

export default async function PickupVerifyPage({ params }: PickupVerifyPageProps) {
  const session = await auth();
  const { token } = params;

  // If not authenticated, redirect to login with return URL
  if (!session?.user) {
    const returnUrl = encodeURIComponent(`/pickup/verify/${token}`);
    redirect(`/login?callbackUrl=${returnUrl}`);
  }

  // If not admin, show unauthorized
  if (session.user.role !== 'ADMIN') {
    redirect('/unauthorized');
  }

  // Redirect to admin scanner with pre-filled token
  redirect(`/admin/pickup-scanner?token=${token}`);
}
