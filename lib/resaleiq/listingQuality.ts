export type ListingQualityInput = {
  title: string;
  description?: string;
  imageCount?: number;
  itemSpecificsCount?: number;
};

export type ListingQualityResult = {
  score: number;
  issues: string[];
  strengths: string[];
};

export function scoreListingQuality(input: ListingQualityInput): ListingQualityResult {
  let score = 100;
  const issues: string[] = [];
  const strengths: string[] = [];

  if (input.title.length < 40) {
    score -= 20;
    issues.push('Title is too short');
  } else {
    strengths.push('Strong title length');
  }

  if ((input.imageCount ?? 0) < 4) {
    score -= 20;
    issues.push('Not enough images');
  }

  if ((input.itemSpecificsCount ?? 0) < 5) {
    score -= 15;
    issues.push('Missing item specifics');
  }

  if ((input.description?.length ?? 0) < 100) {
    score -= 15;
    issues.push('Description lacks detail');
  }

  return {
    score: Math.max(score, 0),
    issues,
    strengths
  };
}
