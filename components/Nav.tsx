'use client';
import Link from 'next/link';
import { usePathname } from 'next/navigation';

const links = [
  { href: '/inventory', label: 'Inventory' },
  { href: '/recovery-actions', label: 'Recovery Actions' },
  { href: '/reports', label: 'Reports' },
  { href: '/settings', label: 'Settings' },
  { href: '/pricing', label: 'Pricing' },
  { href: '/sample-report', label: 'Sample Report' },
  { href: '/login', label: 'Login' },
];

export default function Nav() {
  const pathname = usePathname();
  return <nav className="mb-6 rounded-2xl border border-[#1C2440]/20 bg-[#0E1320]/95 p-2"><div className="flex flex-wrap gap-2">{links.map((link)=><Link key={link.href} href={link.href} className={`rounded-xl px-3 py-2 text-sm ${pathname===link.href?'bg-[#1B2232] text-white':'text-[#B9C0CF] hover:bg-[#1B2232]'}`}>{link.label}</Link>)}</div></nav>;
}
