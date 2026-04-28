import Link from 'next/link'

const links = [
  { href: '/', label: 'Dashboard' },
  { href: '/analyze', label: 'Photo Analysis' },
  { href: '/inventory', label: 'Inventory' },
  { href: '/profit', label: 'Profit' },
  { href: '/compliance', label: 'Compliance' },
  { href: '/dead-listings', label: 'Dead Listings' },
  { href: '/audit', label: 'Audit Agent' }
]

export default function AppShell({ children }: { children: React.ReactNode }) {
  return (
    <div className="min-h-screen bg-[#F7F5F0] text-[#1A1714]">
      <header className="border-b border-[#E2DDD5] bg-white">
        <div className="mx-auto flex max-w-7xl items-center justify-between px-6 py-4">
          <div>
            <p className="text-lg font-bold">ResaleIQ</p>
            <p className="text-xs text-[#5C5449]">Rejected Economy</p>
          </div>
          <nav className="flex flex-wrap gap-4 text-sm font-medium">
            {links.map((link) => (
              <Link key={link.href} href={link.href} className="hover:text-[#D45C2D]">
                {link.label}
              </Link>
            ))}
          </nav>
        </div>
      </header>
      <main>{children}</main>
    </div>
  )
}
