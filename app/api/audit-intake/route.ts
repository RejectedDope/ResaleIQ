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

    const webhookUrl = process.env.POWER_AUTOMATE_AUDIT_WEBHOOK_URL

    if (webhookUrl) {
      const flowResponse = await fetch(webhookUrl, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify(intake)
      })

      if (!flowResponse.ok) {
        console.error('Power Automate webhook failed', await flowResponse.text())
        return NextResponse.json(
          { ok: false, message: 'Audit received but SharePoint sync failed.' },
          { status: 502 }
        )
      }
    } else {
      console.warn('POWER_AUTOMATE_AUDIT_WEBHOOK_URL is not configured')
    }

    return NextResponse.json({
      ok: true,
      message: webhookUrl ? 'Audit intake received and sent to SharePoint workflow' : 'Audit intake received without SharePoint sync',
      intake
    })
  } catch (error) {
    console.error('Audit intake submission failed', error)
    return NextResponse.json({ ok: false, message: 'Audit intake submission failed' }, { status: 500 })
  }
}
