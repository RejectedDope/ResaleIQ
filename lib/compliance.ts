const standardSizes = ['XS','S','M','L','XL','XXL','0','2','4','6','8','10','12','14','16','OS','One Size'];

export function normalizeSize(size) {
  if (!size) return '';
  const map = {
    'Small': 'S',
    'Medium': 'M',
    'Large': 'L',
    'Extra Large': 'XL',
    'One Size Fits All': 'One Size'
  };
  return map[size] || size;
}

export function calculateCompliance(input) {
  let score = 100;
  const missingFields = [];
  const requiredFixes = [];
  const size = normalizeSize(input.size);
  const category = (input.category || '').toLowerCase();

  if (!input.condition) { score -= 25; missingFields.push('Condition'); }
  if (!input.brand) { score -= 15; missingFields.push('Brand'); }
  if (!input.color) { score -= 10; missingFields.push('Color'); }

  const fashion = ['fashion','clothing','shoes','accessories'].some(v => category.includes(v));

  if (fashion && !size) { score -= 20; missingFields.push('Size'); }
  if (fashion && size && !standardSizes.includes(size)) { score -= 15; requiredFixes.push('Use standard size format'); }
  if (fashion && !input.material) { score -= 10; missingFields.push('Material'); }

  score = Math.max(score, 0);
  const riskLevel: 'Low' | 'Medium' | 'High' = score >= 80 ? 'Low' : score >= 60 ? 'Medium' : 'High';

  return {
    score,
    riskLevel,
    missingFields,
    requiredFixes,
    explanation: 'Compliance score is based on required marketplace listing fields and category-specific standards.'
  };
}
