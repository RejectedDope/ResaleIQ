'use client';

import Link from 'next/link';
import { usePathname } from 'next/navigation';
const links = [
  { href: '/', label: 'Home' },
  { href: '/inventory', label: 'Inventory Scan' },
  { href: '/sample-report', label: 'Sample Report' },
  { href: '/pricing', label: 'Pricing' },
];

export default function Nav() {
  const pathname = usePathname();

  return (
    <nav className="mb-8 rounded-2xl border border-slate-800 bg-slate-900/90 p-2">
      <ul className="flex flex-wrap gap-2">
        {links.map((link) => (
          <li key={link.href}>
            <Link
              href={link.href}
              className={`block rounded-xl px-4 py-2 text-sm font-medium transition ${pathname === link.href ? 'bg-violet-500 text-white' : 'text-slate-300 hover:bg-slate-800 hover:text-white'}`}
            >
              {link.label}
            </Link>
          </li>
        ))}
      </ul>
    </nav>
  );
}
