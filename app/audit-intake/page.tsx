'use client'

import { useMemo, useState } from 'react'

const packages = ['Quick Recovery Audit - $39', 'Standard Recovery Audit - $79', 'Growth Recovery Audit - $149', 'Custom Audit']
const platforms = ['eBay', 'Poshmark', 'Mercari', 'Facebook Marketplace', 'Depop', 'Other']

export default function AuditIntakePage() {
  const [submitted, setSubmitted] = useState(false)
  const [form, setForm] = useState({
    name: '',
    email: '',
    packageSelected: 'Standard Recovery Audit - $79',
    paypalTransactionId: '',
    mainPlatform: 'eBay',
    storeLinks: '',
    inventoryCount: '',
    problemArea: '',
    notes: ''
  })
  const [files, setFiles] = useState<File[]>([])

  const fileSummary = useMemo(() => files.map((file) => `${file.name} (${Math.round(file.size / 1024)} KB)`), [files])

  function updateField(field: keyof typeof form, value: string) {
    setForm({ ...form, [field]: value })
  }

  function handleSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault()
    setSubmitted(true)
  }

  if (submitted) {
    return (
      <main className="min-h-screen bg-[#F7F5F0] p-6 md:p-10">
        <div className="mx-auto max-w-3xl rounded-2xl border border-[#E2DDD5] bg-white p-6 shadow-sm">
          <p className="text-sm font-semibold uppercase tracking-wide text-[#D45C2D]">Audit Intake Received</p>
          <h1 className="mt-2 text-3xl font-bold">Your audit request is ready for review.</h1>
          <p className="mt-3 text-sm text-[#5C5449]">
            This MVP stores the intake confirmation on-screen only. The next build phase will save submissions to a database or send them by email automatically.
          </p>
          <div className="mt-6 rounded-xl bg-[#F5F0E8] p-4 text-sm">
            <p><strong>Name:</strong> {form.name || 'Not provided'}</p>
            <p><strong>Email:</strong> {form.email || 'Not provided'}</p>
            <p><strong>Package:</strong> {form.packageSelected}</p>
            <p><strong>Main Platform:</strong> {form.mainPlatform}</p>
            <p><strong>Inventory Count:</strong> {form.inventoryCount || 'Not provided'}</p>
            <p><strong>Files Selected:</strong> {files.length}</p>
          </div>
          <button
            onClick={() => setSubmitted(false)}
            className="mt-6 rounded-xl bg-[#D45C2D] px-5 py-3 text-sm font-semibold text-white"
          >
            Edit Intake
          </button>
        </div>
      </main>
    )
  }

  return (
    <main className="min-h-screen bg-[#F7F5F0] p-6 md:p-10">
      <div className="mx-auto max-w-5xl space-y-8">
        <div>
          <p className="text-sm font-semibold uppercase tracking-wide text-[#D45C2D]">Paid Audit Intake</p>
          <h1 className="mt-2 text-3xl font-bold">Send the information needed to review your resale inventory.</h1>
          <p className="mt-2 max-w-3xl text-sm text-[#5C5449]">
            Use this after checkout. Add store links, inventory count, files, screenshots, and the transaction ID so the audit can be matched to the payment.
          </p>
        </div>

        <form onSubmit={handleSubmit} className="grid gap-6 lg:grid-cols-[1.2fr_.8fr]">
          <section className="space-y-4 rounded-2xl border border-[#E2DDD5] bg-white p-6">
            <h2 className="text-xl font-semibold">Customer Details</h2>
            <Input label="Name" value={form.name} onChange={(value) => updateField('name', value)} required />
            <Input label="Email" type="email" value={form.email} onChange={(value) => updateField('email', value)} required />
            <Select label="Package Selected" value={form.packageSelected} options={packages} onChange={(value) => updateField('packageSelected', value)} />
            <Input label="PayPal Transaction ID" value={form.paypalTransactionId} onChange={(value) => updateField('paypalTransactionId', value)} placeholder="Paste PayPal transaction ID if available" />
          </section>

          <section className="space-y-4 rounded-2xl border border-[#E2DDD5] bg-white p-6">
            <h2 className="text-xl font-semibold">Audit Scope</h2>
            <Select label="Main Platform" value={form.mainPlatform} options={platforms} onChange={(value) => updateField('mainPlatform', value)} />
            <Input label="Estimated Inventory Count" value={form.inventoryCount} onChange={(value) => updateField('inventoryCount', value)} placeholder="Example: 75 active listings" />
            <Textarea label="Store / Closet / Marketplace Links" value={form.storeLinks} onChange={(value) => updateField('storeLinks', value)} placeholder="Paste eBay store, Poshmark closet, Mercari profile, Facebook Marketplace links" />
          </section>

          <section className="space-y-4 rounded-2xl border border-[#E2DDD5] bg-white p-6 lg:col-span-2">
            <h2 className="text-xl font-semibold">Files and Notes</h2>
            <Textarea label="Biggest Problem Area" value={form.problemArea} onChange={(value) => updateField('problemArea', value)} placeholder="Dead inventory, low offers, pricing confusion, too many stale listings, platform mismatch" />
            <div>
              <label className="text-sm font-semibold">Upload Inventory CSV, Screenshots, or Item Photos</label>
              <input
                type="file"
                multiple
                accept=".csv,.xlsx,.xls,image/*,.pdf"
                onChange={(e) => setFiles(Array.from(e.target.files || []))}
                className="mt-2 w-full rounded-xl border border-[#E2DDD5] bg-[#F7F5F0] p-3 text-sm"
              />
              {fileSummary.length > 0 && (
                <ul className="mt-3 list-disc space-y-1 pl-5 text-sm text-[#5C5449]">
                  {fileSummary.map((file) => <li key={file}>{file}</li>)}
                </ul>
              )}
            </div>
            <Textarea label="Additional Notes" value={form.notes} onChange={(value) => updateField('notes', value)} placeholder="Anything the audit should consider before reviewing the inventory" />
            <button className="rounded-xl bg-[#D45C2D] px-5 py-3 text-sm font-semibold text-white">
              Submit Audit Intake
            </button>
          </section>
        </form>
      </div>
    </main>
  )
}

function Input({ label, value, onChange, type = 'text', placeholder = '', required = false }: { label: string; value: string; onChange: (value: string) => void; type?: string; placeholder?: string; required?: boolean }) {
  return (
    <label className="block text-sm font-semibold">
      {label}
      <input
        type={type}
        value={value}
        required={required}
        placeholder={placeholder}
        onChange={(e) => onChange(e.target.value)}
        className="mt-2 w-full rounded-xl border border-[#E2DDD5] bg-[#F7F5F0] p-3 text-sm font-normal"
      />
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

function Textarea({ label, value, onChange, placeholder = '' }: { label: string; value: string; onChange: (value: string) => void; placeholder?: string }) {
  return (
    <label className="block text-sm font-semibold">
      {label}
      <textarea
        value={value}
        placeholder={placeholder}
        onChange={(e) => onChange(e.target.value)}
        className="mt-2 min-h-28 w-full rounded-xl border border-[#E2DDD5] bg-[#F7F5F0] p-3 text-sm font-normal"
      />
    </label>
  )
}
