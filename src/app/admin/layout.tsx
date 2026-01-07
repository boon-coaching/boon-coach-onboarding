import { Metadata } from 'next';

export const metadata: Metadata = {
  title: 'Admin - Boon Coach Onboarding',
  description: 'Admin dashboard for managing coach onboarding',
};

export default function AdminLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return <>{children}</>;
}
