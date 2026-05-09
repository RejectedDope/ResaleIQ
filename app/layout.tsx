import type { Metadata } from 'next';
import './globals.css';
import Nav from '@/components/Nav';

export const metadata: Metadata = { title: 'ResaleIQ', description: 'Inventory recovery workspace.' };

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en">
      <body className="bg-[#070b14] text-[#e7edf8]">
        <main className="min-h-screen">
          <div className="flex min-h-screen">
            <Nav />
            <div className="flex-1">
              <header className="border-b border-[#1c2538] px-6 py-4">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-[11px] text-[#8fa0ba]">ResaleIQ Workspace</p>
                    <h1 className="text-lg font-semibold">Good evening, Alex 👋</h1>
                  </div>
                  <div className="flex items-center gap-3 text-sm text-[#a7b3c8]"><span className="rounded-md border border-[#28324a] px-3 py-1.5">May 2 – May 8, 2025</span><span>Alex Smith</span></div>
                </div>
              </header>
              <div className="p-6">{children}</div>
            </div>
          </div>
        </main>
      </body>
    </html>
  );
}
