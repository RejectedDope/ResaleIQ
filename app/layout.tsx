import type { Metadata } from 'next';
import './globals.css';
import { Nav } from '@/components/Nav';

export const metadata: Metadata = {
  title: 'ResaleIQ - Rejected Economy',
  description: 'Recovery intelligence and margin protection for resellers.',
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en">
      <body>
        <main className="mx-auto min-h-screen w-full max-w-7xl px-4 py-5 md:px-8">
          <header className="mb-5 overflow-hidden rounded-2xl border border-[#1A223F] bg-[#070A18] p-5 text-white shadow-xl md:p-6">
            <div className="flex flex-col gap-5 md:flex-row md:items-center md:justify-between">
              <div>
                <p className="text-xs font-bold uppercase tracking-[0.22em] text-[#C59BFF]">Rejected Economy</p>
                <h1 className="mt-1 text-3xl font-extrabold tracking-tight">ResaleIQ</h1>
                <p className="mt-1 max-w-2xl text-sm leading-6 text-slate-300">
                  Recovery Intelligence System for resellers protecting margin before chasing more listings.
                </p>
              </div>
              <a href="/dead-listings" className="w-fit rounded-2xl bg-white px-5 py-3 text-sm font-extrabold text-[#070A18] shadow-sm hover:bg-[#D5CAFF]">
                Open Recovery Room
              </a>
            </div>
          </header>
          <Nav />
          {children}
        </main>
      </body>
    </html>
  );
}
