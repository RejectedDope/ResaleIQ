import type { Metadata } from 'next';
import './globals.css';
import { Nav } from '@/components/Nav';

export const metadata: Metadata = {
  title: 'ResaleIQ • Rejected Economy',
  description: 'Compliance, profit, and listing intelligence for resellers.',
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en">
      <body>
        <main className="mx-auto min-h-screen w-full max-w-6xl px-4 py-6 md:px-8">
          <header className="mb-4">
            <h1 className="text-2xl font-bold">Rejected Economy • ResaleIQ</h1>
            <p className="text-sm text-slate-600">Reseller compliance, profit, and listing intelligence.</p>
          </header>
          <Nav />
          {children}
        </main>
      </body>
    </html>
  );
}
