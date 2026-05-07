'use client';

import Link from 'next/link';
import { usePathname } from 'next/navigation';

const links = [
  { href: '/', label: 'Dashboard' },
  { href: '/inventory', label: 'Your Inventory' },
  { href: '/dead-listings', label: 'Recovery Room' },
  { href: '/analyze', label: 'Decision Engine' },
  { href: '/profit', label: 'Profit' },
  { href: '/compliance', label: 'Compliance' },
];

export default function Nav() {
  const pathname = usePathname();

  return (
    <nav className="mb-8 rounded-3xl border border-[#1C2440]/10 bg-white/80 p-2 shadow-sm backdrop-blur">
      <div className="flex flex-wrap gap-2">
        {links.map((link) => {
          const active = pathname === link.href;

          return (
            <Link
              key={link.href}
              href={link.href}
              className={`rounded-2xl px-4 py-2 text-sm font-semibold transition ${
                active
                  ? 'bg-[#070A18] text-white shadow-sm'
                  : 'bg-transparent text-slate-700 hover:bg-[#E8DDCB]'
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
