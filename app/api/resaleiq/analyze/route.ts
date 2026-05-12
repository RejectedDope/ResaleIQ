import { NextRequest, NextResponse } from 'next/server';
import { normalizeCompResults, searchEbayListings } from '@/lib/ebay/client';
import { analyzeComps } from '@/lib/resaleiq/compAnalysis';
import { evaluateDeadInventory } from '@/lib/resaleiq/deadInventory';
import { calculatePlatformFees } from '@/lib/resaleiq/feeEngine';
import { scoreListingQuality } from '@/lib/resaleiq/listingQuality';
import { recommendMarketplace } from '@/lib/resaleiq/platformRecommendation';

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);

    const query = searchParams.get('q') || 'vintage coach bag';
    const daysListed = Number(searchParams.get('daysListed') || 45);
    const salePrice = Number(searchParams.get('salePrice') || 80);

    const ebayData = await searchEbayListings({
      query,
      limit: 12
    });

    const comps = normalizeCompResults(ebayData);

    const compAnalysis = analyzeComps(comps);

    const deadInventory = evaluateDeadInventory({
      daysListed,
      watchers: 1,
      views: 12,
      priceDrops: 2
    });

    const fees = calculatePlatformFees({
      marketplace: 'ebay',
      salePrice,
      itemCost: 20,
      shippingCost: 8
    });

    const quality = scoreListingQuality({
      title: query,
      description: 'Sample listing description for analysis.',
      imageCount: 3,
      itemSpecificsCount: 2
    });

    const platforms = recommendMarketplace({
      category: 'fashion',
      price: salePrice,
      vintage: true
    });

    return NextResponse.json({
      success: true,
      query,
      compAnalysis,
      deadInventory,
      fees,
      quality,
      recommendedPlatforms: platforms,
      comps
    });
  } catch (error) {
    console.error(error);

    return NextResponse.json({
      success: false,
      error: 'ResaleIQ analysis failed'
    }, { status: 500 });
  }
}
