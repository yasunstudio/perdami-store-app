import { Metadata } from 'next';
import AdminLayout from '@/components/layout/admin-layout';

export const metadata: Metadata = {
  title: 'Admin Dashboard - Perdami Store',
  description: 'Panel administrasi untuk mengelola toko dan pesanan',
  robots: 'noindex, nofollow', // Admin area tidak boleh diindex search engine
};

interface AdminLayoutProps {
  children: React.ReactNode;
}

export default function AdminRootLayout({ children }: AdminLayoutProps) {
  return <AdminLayout>{children}</AdminLayout>;
}
