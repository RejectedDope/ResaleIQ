export type ImageIntelligenceInput = {
  fileName?: string;
  contentType?: string;
  notes?: string;
};

export type ImageIntelligenceResult = {
  detectedCategory: string;
  likelyKeywords: string[];
  confidence: number;
  nextAction: string;
};

export function analyzeUploadedImage(input: ImageIntelligenceInput): ImageIntelligenceResult {
  const text = `${input.fileName ?? ''} ${input.notes ?? ''}`.toLowerCase();

  if (text.includes('coach') || text.includes('bag') || text.includes('purse')) {
    return {
      detectedCategory: 'Fashion Accessories',
      likelyKeywords: ['coach', 'bag', 'purse', 'crossbody', 'leather'],
      confidence: 0.72,
      nextAction: 'Run eBay comp analysis and listing quality audit'
    };
  }

  if (text.includes('toy') || text.includes('vintage')) {
    return {
      detectedCategory: 'Vintage Collectibles',
      likelyKeywords: ['vintage', 'collectible', 'toy', 'rare'],
      confidence: 0.66,
      nextAction: 'Check scarcity, sold comps, and collector keywords'
    };
  }

  return {
    detectedCategory: 'Unknown Resale Item',
    likelyKeywords: ['resale item', 'preowned', 'marketplace'],
    confidence: 0.45,
    nextAction: 'Add brand, condition, material, and visible markings before pricing'
  };
}
