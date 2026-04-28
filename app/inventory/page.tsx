'use client'

import { useMemo, useState } from 'react'
import ScoreCard from '@/components/ScoreCard'

type InventoryItem = {
  title: string
  brand: string
  platform: string
  cost: number
  price: number
  age: number
  status: string
}

const starterItems: InventoryItem[] = [
  { title: 'Coach Leather Tote', brand: 'Coach', platform: 'eBay', cost: 18, price: 85, age: 94, status: 'Needs Relist' },
  { title: 'Michael Kors Wallet', brand: 'Michael Kors', platform: 'Facebook', cost: 12, price: 35, age: 121, status: 'Liquidate' }
]

export default function InventoryPage() {
  const [items, setItems] = useState<InventoryItem[]>(starterItems)
  const [form, setForm] = useState<InventoryItem>({
    title: '',
    brand: '',
    platform: 'eBay',
    cost: 0,
    price: 0,
    age: 0,
    status: 'New'
  })

  const totals = useMemo(() => {
    const potentialRevenue = items.reduce((sum, item) => sum + item.price, 0)
    const totalCost = items.reduce((sum, item) => sum + item.cost, 0)
    const staleItems = items.filter((item) => item.age > 60).length
    return { potentialRevenue, totalCost, staleItems }
  }, [items])

  function updateField(field: keyof InventoryItem, value: string) {
    setForm({
      ...form,
      [field]: ['cost', 'price', 'age'].includes(field) ? Number(value) : value
    })
  }

  function addItem(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault()
    if (!form.title.trim()) return
    setItems([{ ...form }, ...items])
    setForm({ title: '', brand: '', platform: 'eBay', cost: 0, price: 0, age: 0, status: 'New' })
  }

  return (
    <div className="p-6 md:p-10">
      <div className="mx-auto max-w-7xl space-y-8">
        <div>
          <p className="text-sm font-semibold uppercase tracking-wide text-[#D45C2D]">Inventory Workspace</p>
          <h1 className="mt-2 text-3xl font-bold">Add inventory and see what needs action.</h1>
          <p className="mt-2 max-w-3xl text-sm text-[#5C5449]">
            This MVP stores items locally in the browser session. Database storage comes after the workflow is validated.
          </p>
        </div>

        <section className="grid gap-4 md:grid-cols-3">
          <ScoreCard label="Items Entered" value={items.length} />
          <ScoreCard label="Potential Revenue" value={`$${totals.potentialRevenue.toFixed(0)}`} />
          <ScoreCard label="Stale Items" value={totals.staleItems} />
        </section>

        <form onSubmit={addItem} className="rounded-2xl border border-[#E2DDD5] bg-white p-6 shadow-sm">
          <h2 className="text-xl font-semibold">Add Inventory Item</h2>
          <div className="mt-5 grid gap-4 md:grid-cols-3">
            <Input label="Item Title" value={form.title} onChange={(v) => updateField('title', v)} />
            <Input label="Brand" value={form.brand} onChange={(v) => updateField('brand', v)} />
            <Select label="Platform" value={form.platform} options={['eBay', 'Poshmark', 'Mercari', 'Facebook', 'Depop']} onChange={(v) => updateField('platform', v)} />
            <Input label="Cost" type="number" value={String(form.cost)} onChange={(v) => updateField('cost', v)} />
            <Input label="Target Price" type="number" value={String(form.price)} onChange={(v) => updateField('price', v)} />
            <Input label="Listing Age Days" type="number" value={String(form.age)} onChange={(v) => updateField('age', v)} />
          </div>
          <button className="mt-5 rounded-xl bg-[#D45C2D] px-5 py-3 text-sm font-semibold text-white">
            Add Item
          </button>
        </form>

        <section className="overflow-x-auto rounded-2xl border border-[#E2DDD5] bg-white shadow-sm">
          <table className="min-w-full text-sm">
            <thead className="bg-[#F5F0E8] text-left">
              <tr>
                <th className="p-4">Item</th>
                <th>Brand</th>
                <th>Platform</th>
                <th>Cost</th>
                <th>Price</th>
                <th>Age</th>
                <th>Status</th>
                <th>Action</th>
              </tr>
            </thead>
            <tbody>
              {items.map((item, index) => {
                const profit = item.price - item.cost
                const action = item.age > 90 ? 'Reprice or Liquidate' : item.age > 60 ? 'Relist or Crosslist' : 'Monitor'
                return (
                  <tr key={`${item.title}-${index}`} className="border-t border-[#E2DDD5]">
                    <td className="p-4 font-semibold">{item.title}</td>
                    <td>{item.brand || 'Unknown'}</td>
                    <td>{item.platform}</td>
                    <td>${item.cost}</td>
                    <td>${item.price}</td>
                    <td>{item.age} days</td>
                    <td>{profit < 15 ? 'Weak Margin' : item.status}</td>
                    <td className="font-semibold text-[#D45C2D]">{action}</td>
                  </tr>
                )
              })}
            </tbody>
          </table>
        </section>
      </div>
    </div>
  )
}

function Input({ label, value, onChange, type = 'text' }: { label: string; value: string; onChange: (value: string) => void; type?: string }) {
  return (
    <label className="block text-sm font-semibold">
      {label}
      <input type={type} value={value} onChange={(e) => onChange(e.target.value)} className="mt-2 w-full rounded-xl border border-[#E2DDD5] bg-[#F7F5F0] p-3 text-sm font-normal" />
    </label>
  )
}

function Select({ label, value, options, onChange }: { label: string; value: string; options: string[]; onChange: (value: string) => void }) {
  return (
    <label className="block text-sm font-semibold">
      {label}
      <select value={value} onChange={(e) => onChange(e.target.value)} className="mt-2 w-full rounded-xl border border-[#E2DDD5] bg-[#F7F5F0] p-3 text-sm font-normal">
        {options.map((option) => <option key={option}>{option}</option>)}
      </select>
    </label>
  )
}
