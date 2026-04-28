export function recommendPlatform(input) {
  const category = (input.category || '').toLowerCase();

  if (category.includes('luxury') || category.includes('designer')) return 'eBay';
  if (category.includes('fashion') || category.includes('clothing')) return 'Poshmark';
  if (category.includes('furniture') || category.includes('local')) return 'Facebook Marketplace';

  return 'eBay';
}
