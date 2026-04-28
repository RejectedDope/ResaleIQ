import { ComplianceResult, ListingInput } from './types';

const STANDARD_SIZES = new Set([
  'XS',
  'S',
  'M',
  'L',
  'XL',
  'XXL',
  '0',
  '2',
  '4',
  '6',
  '8',
  '10',
  '12',
  '14',
  '16',
  'OS',
  'ONE SIZE',
]);

const FASHION_CATEGORIES = ['fashion', 'apparel', 'shoes', 'accessory', 'accessories', 'clothing'];
const IMPORT_REGULATED = ['children', 'kids', 'baby', 'import-regulated'];

export function normalizeSize(size: string): string {
  const normalized = size.trim().toLowerCase();
  if (normalized === 'small') return 'S';
  if (normalized === 'medium') return 'M';
  if (normalized === 'large') return 'L';
  if (normalized === 'extra large') return 'XL';
  if (normalized === 'one size fits all') return 'One Size';
  return size.trim();
}

function isFashionCategory(category: string): boolean {
  const cat = category.toLowerCase();
  return FASHION_CATEGORIES.some((token) => cat.includes(token));
}

export function evaluateCompliance(input: Partial<ListingInput>): ComplianceResult {
  let complianceScore = 100;
  const missingFields: string[] = [];
  const requiredFixes: string[] = [];

  const category = input.category ?? '';
  const size = normalizeSize(input.size ?? '');

  if (!input.condition?.trim()) {
    complianceScore -= 25;
    missingFields.push('Condition');
    requiredFixes.push('Add an honest condition statement (new, used, flaws).');
  }

  if (isFashionCategory(category) && !size) {
    complianceScore -= 20;
    missingFields.push('Size');
    requiredFixes.push('Add size information for fashion listings.');
  }

  if (isFashionCategory(category) && size && !STANDARD_SIZES.has(size.toUpperCase())) {
    complianceScore -= 15;
    requiredFixes.push('Use a standard size format (e.g., S, M, L, 10, One Size).');
  }

  if (!input.brand?.trim()) {
    complianceScore -= 15;
    missingFields.push('Brand');
    requiredFixes.push('Add a brand or mark as unbranded.');
  }

  if (!input.color?.trim()) {
    complianceScore -= 10;
    missingFields.push('Color');
    requiredFixes.push('Add at least one clear color.');
  }

  if (isFashionCategory(category) && !input.material?.trim()) {
    complianceScore -= 10;
    missingFields.push('Material');
    requiredFixes.push('Add material/fabric information for fashion or accessories.');
  }

  if (category.toLowerCase().includes('coin') && !input.gradingDescriptors) {
    complianceScore -= 20;
    requiredFixes.push('Add grading descriptors (year, mint, condition/grade).');
  }

  if (IMPORT_REGULATED.some((token) => category.toLowerCase().includes(token)) && !input.safetyDocs) {
    complianceScore -= 25;
    requiredFixes.push('Attach safety/compliance documentation for regulated child/import goods.');
  }

  complianceScore = Math.max(0, complianceScore);
  const riskLevel: ComplianceResult['riskLevel'] =
    complianceScore < 50 ? 'High' : complianceScore < 75 ? 'Medium' : 'Low';

  return {
    complianceScore,
    riskLevel,
    missingFields,
    requiredFixes,
    explanation:
      complianceScore >= 80
        ? 'Listing is largely compliant with marketplace-safe metadata.'
        : 'Improve missing or weak listing details to reduce takedown and low-visibility risk.',
  };
}
