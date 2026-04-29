'use client';

import Link from 'next/link';
import { usePathname } from 'next/navigation';

const links = [
  { href: '/', label: 'Recovery Dashboard' },
  { href: '/dead-listings', label: 'Recovery Room' },
  { href: '/analyze', label: 'Decision Engine' },
  { href: '/compliance', label: 'Compliance Check' },
  { href: '/profit', label: 'Profit Check' },
];

export function Nav() {
  const pathname = usePathname();

  return (
    <nav className="mb-8 rounded-3xl border border-tan bg-white p-3 shadow-sm">
      <div className="flex flex-wrap gap-2">
        {links.map((link) => {
          const active = pathname === link.href;
          return (
            <Link
              key={link.href}
              href={link.href}
              className={`rounded-2xl px-4 py-2 text-sm font-semibold transition ${
                active
                  ? 'bg-ink text-white shadow-sm'
                  : 'bg-ivory text-slate-700 hover:bg-tan/40'
              }`}
            >
              {link.label}
            </Link>
          );
        })}
      </div>
    </nav>
  );
}
