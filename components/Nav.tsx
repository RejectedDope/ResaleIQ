'use client';
import Link from 'next/link';
import { usePathname } from 'next/navigation';

const links = [
  { href: '/inventory', label: 'Inventory' },
  { href: '/recovery-actions', label: 'Recovery Actions' },
  { href: '/reports', label: 'Reports' },
  { href: '/settings', label: 'Settings' },
];

export default function Nav() {
  const pathname = usePathname();
  return <aside className="w-[250px] border-r border-[#1c2538] bg-[#0a1220] p-4"><div className="mb-6 flex items-center gap-2 text-xl font-semibold"><span className="text-[#d8b46a]">◈</span>ResaleIQ</div><nav className="space-y-1">{links.map((l)=><Link key={l.href} href={l.href} className={`block rounded-md px-3 py-2 text-sm ${pathname.startsWith(l.href)?'bg-[#1a2335] text-white':'text-[#aab5c8] hover:bg-[#151d2d]'}`}>{l.label}</Link>)}</nav><div className="mt-8 rounded-lg border border-[#2a3650] p-3 text-sm text-[#b9c4d7]"><p className="font-semibold">Unlock more insights</p><button className="mt-3 w-full bg-[#d8b46a] text-[#0b0f17]">Upgrade to Pro</button></div></aside>;
}
