'use client';

import Link from 'next/link';
import { usePathname } from 'next/navigation';

const links = [
  { href: '/', label: 'Dashboard' },
  { href: '/analyze', label: 'New Item Analysis' },
  { href: '/compliance', label: 'Compliance Checker' },
  { href: '/profit', label: 'Profit Calculator' },
  { href: '/dead-listings', label: 'Dead Listings' },
];

export function Nav() {
  const pathname = usePathname();

  return (
    <nav className="mb-6 rounded-xl border border-tan bg-white p-2 shadow-sm">
      <div className="flex flex-wrap gap-2">
        {links.map((link) => {
          const active = pathname === link.href;
          return (
            <Link
              key={link.href}
              href={link.href}
              className={`rounded-lg px-3 py-2 text-sm ${active ? 'bg-sage text-white' : 'bg-ivory text-slate-700 hover:bg-tan/40'}`}
            >
              {link.label}
            </Link>
          );
        })}
      </div>
    </nav>
  );
}
