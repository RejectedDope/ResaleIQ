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
  return <aside className="w-full lg:w-56"><div className="rounded-xl border border-[#1f2533] bg-[#0f141d] p-2">{links.map((l)=><Link key={l.href} href={l.href} className={`mb-1 block rounded-md px-3 py-2 text-sm ${pathname.startsWith(l.href)?'bg-[#1a2230] text-white':'text-[#a9b1bf] hover:bg-[#171e2a]'}`}>{l.label}</Link>)}</div></aside>;
}
