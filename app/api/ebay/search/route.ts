import { NextRequest, NextResponse } from 'next/server';
import { normalizeCompResults, searchEbayListings } from '@/lib/ebay/client';

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const query = searchParams.get('q');

    if (!query) {
      return NextResponse.json(
        { error: 'Missing query parameter' },
        { status: 400 }
      );
    }

    const results = await searchEbayListings({
      query,
      limit: 12,
      sort: 'price'
    });

    const normalized = normalizeCompResults(results);

    return NextResponse.json({
      success: true,
      query,
      count: normalized.length,
      results: normalized
    });
  } catch (error) {
    console.error(error);

    return NextResponse.json(
      {
        success: false,
        error: 'Failed to fetch eBay comps'
      },
      { status: 500 }
    );
  }
}
