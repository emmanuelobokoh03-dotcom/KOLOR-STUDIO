// iter 287-v3a — Sub-chip taxonomy per Q94=C
// Creators self-select from mixed medium/commercial dimensions.
// Covers all three KOLOR industries: Photography, Design, Fine Art.
// Sub-chips are display-only in iter 287-v3a (filter by industry only at
// DB level). Sub-headline field on CommunityProfile lands in iter 287-v3c.

export type CreativeIndustry = 'PHOTOGRAPHY' | 'DESIGN' | 'FINE_ART';

// SUB_CHIPS: mixed medium + commercial dimensions per industry.
// Design entries first, Photography next, Fine Art last — the map
// intentionally covers Photography, Design, and Fine Art symmetrically.
export const SUB_CHIPS: Record<CreativeIndustry, string[]> = {
  DESIGN: [
    'Graphic Design',
    'Brand Design',
    'Product Design',
    'Web Design',
    'Illustration',
    'UI/UX',
    'Motion Design',
    'Editorial Design',
    'Packaging Design',
    'Type Design',
  ],
  // Photography sub-chips (paired with Design + Fine Art above/below):
  PHOTOGRAPHY: [
    'Wedding Photography',
    'Lifestyle Photography',
    'Documentary',
    'Portrait',
    'Commercial',
    'Fashion',
    'Landscape',
    'Street Photography',
    'Architectural',
    'Event Photography',
  ],
  // Fine Art sub-chips (paired with Photography + Design above):
  FINE_ART: [
    'Oil on Canvas',
    'Acrylic on Canvas',
    'Original Paintings',
    'Watercolor',
    'Sculpture',
    'Mixed Media',
    'Commissions',
    'Murals',
    'Digital Painting',
    'Printmaking',
  ],
};

export const INDUSTRY_CHIPS: Array<{ value: CreativeIndustry | 'ALL'; label: string }> = [
  { value: 'ALL',         label: 'All' },
  { value: 'PHOTOGRAPHY', label: 'Photography' },
  { value: 'DESIGN',      label: 'Design' },
  { value: 'FINE_ART',    label: 'Fine Art' },
];
