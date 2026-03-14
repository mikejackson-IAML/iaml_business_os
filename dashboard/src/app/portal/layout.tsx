import type { Metadata } from 'next';

export const metadata: Metadata = {
  title: 'IAML Executive Portal',
  description: 'Executive overview of IAML business operations',
};

export default function PortalLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <div className="min-h-screen bg-background">
      {children}
    </div>
  );
}
