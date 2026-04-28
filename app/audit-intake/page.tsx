'use client'

import { useMemo, useState } from 'react'

const packages = ['Quick Recovery Audit - $39', 'Standard Recovery Audit - $79', 'Growth Recovery Audit - $149', 'Custom Audit']
const platforms = ['eBay', 'Poshmark', 'Mercari', 'Facebook Marketplace', 'Depop', 'Other']

export default function AuditIntakePage() {
  const [submitted, setSubmitted] = useState(false)
  const [loading, setLoading] = useState(false)
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

  async function handleSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault()
    setLoading(true)

    const payload = new FormData()
    Object.entries(form).forEach(([key, value]) => payload.append(key, value))
    files.forEach((file) => payload.append('files', file))

    const response = await fetch('/api/audit-intake', {
      method: 'POST',
      body: payload
    })

    setLoading(false)

    if (response.ok) {
      setSubmitted(true)
    }
  }

  if (submitted) {
    return (
      <main className="min-h-screen bg-[#F7F5F0] p-6 md:p-10">
        <div className="mx-auto max-w-3xl rounded-2xl border border-[#E2DDD5] bg-white p-6 shadow-sm">
          <p className="text-sm font-semibold uppercase tracking-wide text-[#D45C2D]">Audit Intake Received</p>
          <h1 className="mt-2 text-3xl font-bold">Your audit request has been submitted.</h1>
          <p className="mt-3 text-sm text-[#5C5449]">
            Your intake is now processed through the app API. Next phase will connect this to SharePoint, email routing, or a database dashboard.
          </p>
          <div className="mt-6 rounded-xl bg-[#F5F0E8] p-4 text-sm">
            <p><strong>Name:</strong> {form.name}</p>
            <p><strong>Email:</strong> {form.email}</p>
            <p><strong>Package:</strong> {form.packageSelected}</p>
            <p><strong>Files Selected:</strong> {files.length}</p>
          </div>
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
        </div>

        <form onSubmit={handleSubmit} className="space-y-6 rounded-2xl border border-[#E2DDD5] bg-white p-6">
          <Input label="Name" value={form.name} onChange={(value) => updateField('name', value)} required />
          <Input label="Email" value={form.email} onChange={(value) => updateField('email', value)} required />
          <Select label="Package Selected" value={form.packageSelected} options={packages} onChange={(value) => updateField('packageSelected', value)} />
          <Input label="PayPal Transaction ID" value={form.paypalTransactionId} onChange={(value) => updateField('paypalTransactionId', value)} />
          <Select label="Main Platform" value={form.mainPlatform} options={platforms} onChange={(value) => updateField('mainPlatform', value)} />
          <Input label="Inventory Count" value={form.inventoryCount} onChange={(value) => updateField('inventoryCount', value)} />
          <Textarea label="Store Links" value={form.storeLinks} onChange={(value) => updateField('storeLinks', value)} />
          <Textarea label="Biggest Problem Area" value={form.problemArea} onChange={(value) => updateField('problemArea', value)} />
          <Textarea label="Additional Notes" value={form.notes} onChange={(value) => updateField('notes', value)} />

          <input
            type="file"
            multiple
            accept=".csv,.xlsx,.xls,image/*,.pdf"
            onChange={(e) => setFiles(Array.from(e.target.files || []))}
            className="w-full rounded-xl border border-[#E2DDD5] bg-[#F7F5F0] p-3 text-sm"
          />

          {fileSummary.length > 0 && (
            <ul className="list-disc space-y-1 pl-5 text-sm text-[#5C5449]">
              {fileSummary.map((file) => <li key={file}>{file}</li>)}
            </ul>
          )}

          <button className="rounded-xl bg-[#D45C2D] px-5 py-3 text-sm font-semibold text-white">
            {loading ? 'Submitting...' : 'Submit Audit Intake'}
          </button>
        </form>
      </div>
    </main>
  )
}

function Input({ label, value, onChange, required = false }: { label: string; value: string; onChange: (value: string) => void; required?: boolean }) {
  return <input required={required} value={value} onChange={(e) => onChange(e.target.value)} placeholder={label} className="w-full rounded-xl border border-[#E2DDD5] bg-[#F7F5F0] p-3 text-sm" />
}

function Select({ label, value, options, onChange }: { label: string; value: string; options: string[]; onChange: (value: string) => void }) {
  return <select value={value} onChange={(e) => onChange(e.target.value)} className="w-full rounded-xl border border-[#E2DDD5] bg-[#F7F5F0] p-3 text-sm">{options.map((option) => <option key={option}>{option}</option>)}</select>
}

function Textarea({ label, value, onChange }: { label: string; value: string; onChange: (value: string) => void }) {
  return <textarea value={value} onChange={(e) => onChange(e.target.value)} placeholder={label} className="min-h-28 w-full rounded-xl border border-[#E2DDD5] bg-[#F7F5F0] p-3 text-sm" />
}
