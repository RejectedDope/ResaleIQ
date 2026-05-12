import { NextRequest, NextResponse } from 'next/server';
import { analyzeUploadedImage } from '@/lib/resaleiq/imageIntelligence';

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();

    const result = analyzeUploadedImage({
      fileName: body.fileName,
      contentType: body.contentType,
      notes: body.notes
    });

    return NextResponse.json({
      success: true,
      intelligence: result
    });
  } catch (error) {
    return NextResponse.json({
      success: false,
      error: 'Image analysis failed'
    }, { status: 500 });
  }
}
