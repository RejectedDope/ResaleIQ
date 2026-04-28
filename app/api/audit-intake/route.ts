import { NextResponse } from 'next/server'

export async function POST(request: Request) {
  try {
    const formData = await request.formData()
    const files = formData.getAll('files').filter((file) => file instanceof File) as File[]

    const intake = {
      name: String(formData.get('name') || ''),
      email: String(formData.get('email') || ''),
      packageSelected: String(formData.get('packageSelected') || ''),
      paypalTransactionId: String(formData.get('paypalTransactionId') || ''),
      mainPlatform: String(formData.get('mainPlatform') || ''),
      storeLinks: String(formData.get('storeLinks') || ''),
      inventoryCount: String(formData.get('inventoryCount') || ''),
      problemArea: String(formData.get('problemArea') || ''),
      notes: String(formData.get('notes') || ''),
      fileCount: files.length,
      files: files.map((file) => ({
        name: file.name,
        size: file.size,
        type: file.type
      })),
      receivedAt: new Date().toISOString()
    }

    console.log('ResaleIQ audit intake received', intake)

    return NextResponse.json({
      ok: true,
      message: 'Audit intake received',
      intake
    })
  } catch (error) {
    console.error('Audit intake submission failed', error)
    return NextResponse.json({ ok: false, message: 'Audit intake submission failed' }, { status: 500 })
  }
}
