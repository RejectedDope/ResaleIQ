import type { Metadata } from 'next';
import './globals.css';
import Nav from '@/components/Nav';

export const metadata: Metadata = { title: 'ResaleIQ', description: 'Inventory recovery workspace for resellers.' };

export default function RootLayout({ children }: { children: React.ReactNode }) {
  const today = new Date().toISOString().slice(0, 10);
  return <html lang="en"><body><main className="min-h-screen bg-[#08090a] text-[#e7ebf0]"><div className="mx-auto max-w-[1280px] p-4">
    <div className="mb-4 flex items-center justify-between rounded-xl border border-[#1f2533] bg-[#0f141d] px-4 py-3">
      <div><p className="text-sm font-semibold">ResaleIQ Workspace</p><p className="text-xs text-[#94a0b2]">Inventory recovery mission control</p></div>
      <div className="flex items-center gap-3 text-xs text-[#94a0b2]"><span>Range: Last 30 days</span><span>•</span><span>{today}</span><span>•</span><span>User</span></div>
    </div>
    <div className="grid gap-4 lg:grid-cols-[224px_1fr]"><Nav /><section>{children}</section></div>
  </div></main></body></html>;
}
