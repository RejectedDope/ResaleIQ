import type { Metadata } from 'next';
import './globals.css';
import { Nav } from '@/components/Nav';

export const metadata: Metadata = {
  title: 'ResaleIQ • Rejected Economy',
  description: 'Recovery intelligence and margin protection for resellers.',
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en">
      <body>
        <main className="mx-auto min-h-screen w-full max-w-7xl px-4 py-5 md:px-8">
          <header className="mb-5 flex flex-col gap-4 rounded-3xl border border-tan bg-white/80 p-4 shadow-sm backdrop-blur md:flex-row md:items-center md:justify-between">
            <div>
              <p className="text-xs font-bold uppercase tracking-[0.22em] text-clay">Rejected Economy</p>
              <h1 className="mt-1 text-2xl font-extrabold tracking-tight text-ink">ResaleIQ</h1>
              <p className="text-sm text-slate-600">Recovery intelligence and margin protection for resellers.</p>
            </div>
            <a href="/dead-listings" className="rounded-2xl bg-ink px-5 py-3 text-sm font-bold text-white shadow-sm">Open Recovery Room</a>
          </header>
          <Nav />
          {children}
        </main>
      </body>
    </html>
  );
}
