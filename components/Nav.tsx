'use client';

import Link from 'next/link';
import { usePathname } from 'next/navigation';

const links = [
  { href: '/', label: 'Money Dashboard' },
  { href: '/inventory', label: 'Test My Inventory' },
  { href: '/dead-listings', label: 'Recover Inventory' },
  { href: '/analyze', label: 'Fix One Item' },
  { href: '/compliance', label: 'Fix Compliance' },
  { href: '/profit', label: 'Protect Profit' },
];

export function Nav() {
  const pathname = usePathname();

  return (
    <nav className="sticky top-3 z-20 mb-8 rounded-2xl border border-tan bg-white/90 p-2 shadow-sm backdrop-blur">
      <div className="grid grid-cols-2 gap-2 md:flex md:flex-wrap">
        {links.map((link) => {
          const active = pathname === link.href;
          return (
            <Link
              key={link.href}
              href={link.href}
              className={`rounded-2xl px-4 py-3 text-center text-sm font-extrabold transition ${
                active
                  ? 'bg-[#070A18] text-white shadow-sm'
                  : 'bg-ivory text-slate-700 hover:bg-tan/40 hover:text-ink'
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
