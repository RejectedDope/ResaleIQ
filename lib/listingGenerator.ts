export function generateListing(input) {
  const baseTitle = `${input.brand || ''} ${input.itemTitle || ''} ${input.color || ''}`.trim();
  const ebayTitle = baseTitle.slice(0, 80);

  return {
    ebayTitle,
    poshmarkTitle: baseTitle,
    facebookTitle: `${baseTitle} - ${input.condition || 'Pre-Owned'}`,
    description: `Condition: ${input.condition || 'Used'}\nBrand: ${input.brand || 'N/A'}\nCategory: ${input.category}\nHonest listing with accurate wear disclosure and resale-focused pricing.`,
    keywords: [input.brand, input.category, input.color].filter(Boolean)
  };
}
