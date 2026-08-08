// iter 286.5b — Synthetic shot reseed
// Generates ~150 image-based shots across 40 synthetic profiles
// Aspect ratio targeting: 20% 1:1, 20% 3:2, 15% 4:3, 20% 3:4, 15% 4:5, 10% 16:9
// Source: Unsplash API by industry keyword

import dotenv from 'dotenv';
dotenv.config();

import { PrismaClient } from '@prisma/client';
import { createClient } from '@supabase/supabase-js';

const prisma = new PrismaClient();

const supabase = createClient(
  process.env.SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_KEY!
);

const UNSPLASH_KEY = process.env.UNSPLASH_ACCESS_KEY;
if (!UNSPLASH_KEY) {
  console.error('[RESEED] UNSPLASH_ACCESS_KEY not set');
  process.exit(1);
}

interface AspectTarget {
  ratio: string;
  targetPercent: number;
}

const ASPECT_TARGETS: AspectTarget[] = [
  { ratio: '1:1',  targetPercent: 20 },
  { ratio: '3:2',  targetPercent: 20 },
  { ratio: '4:3',  targetPercent: 15 },
  { ratio: '3:4',  targetPercent: 20 },
  { ratio: '4:5',  targetPercent: 15 },
  { ratio: '16:9', targetPercent: 10 },
];

const INDUSTRY_KEYWORDS: Record<string, string[]> = {
  PHOTOGRAPHY: [
    'portrait photography', 'landscape photography', 'street photography',
    'wedding photography', 'lifestyle photography', 'documentary photography',
    'architectural photography', 'fashion photography'
  ],
  DESIGN: [
    'graphic design', 'brand identity', 'product design', 'web design',
    'illustration', 'ui design', 'motion design', 'editorial design',
    'packaging design'
  ],
  FINE_ART: [
    'oil painting', 'watercolor', 'acrylic painting', 'sculpture',
    'abstract art', 'mixed media art', 'contemporary art', 'canvas painting'
  ]
};

const SHOT_TITLES: Record<string, string[]> = {
  PHOTOGRAPHY: [
    'Morning light study', 'Studio portrait, natural', 'Ambient interior',
    'Documentary — city commute', 'Portrait series, Vol 3', 'Wedding — Aug',
    'Editorial submission', 'Street, late autumn', 'Product still'
  ],
  DESIGN: [
    'Brand system — Cadence', 'Editorial layout study', 'Icon exploration',
    'Type specimen', 'Landing page concept', 'Illustration series',
    'App onboarding flow', 'Poster series', 'Product packaging'
  ],
  FINE_ART: [
    'Study — figure', 'Commission — private client', 'Series III, plate 4',
    'Untitled, mixed media', 'Portrait — oil on linen', 'Landscape study',
    'Abstract composition', 'Watercolor series', 'Sculpture — bronze'
  ]
};

async function fetchUnsplashImage(
  keyword: string,
  targetRatio: string
): Promise<{ url: string; width: number; height: number } | null> {
  try {
    const url = `https://api.unsplash.com/search/photos?query=${encodeURIComponent(keyword)}&per_page=30`;
    const res = await fetch(url, {
      headers: { Authorization: `Client-ID ${UNSPLASH_KEY}` }
    });
    if (!res.ok) return null;
    const data = await res.json();
    const results = data.results || [];

    const [tw, th] = targetRatio.split(':').map(Number);
    const target = tw / th;

    for (const img of results) {
      const r = img.width / img.height;
      const diff = Math.abs(r - target) / target;
      if (diff < 0.15) {
        return { url: img.urls.regular, width: img.width, height: img.height };
      }
    }
    if (results.length > 0) {
      const img = results[0];
      return { url: img.urls.regular, width: img.width, height: img.height };
    }
    return null;
  } catch (err: any) {
    console.error(`  Unsplash "${keyword}":`, err.message);
    return null;
  }
}

async function uploadToSupabase(sourceUrl: string, filename: string): Promise<string | null> {
  try {
    const res = await fetch(sourceUrl);
    if (!res.ok) return null;
    const buffer = Buffer.from(await res.arrayBuffer());
    const { error } = await supabase.storage
      .from('community-posts')
      .upload(`synthetic/${filename}`, buffer, {
        contentType: 'image/jpeg',
        upsert: true
      });
    if (error) {
      console.error('  Upload:', error.message);
      return null;
    }
    const { data: publicUrl } = supabase.storage
      .from('community-posts')
      .getPublicUrl(`synthetic/${filename}`);
    return publicUrl.publicUrl;
  } catch (err: any) {
    console.error('  Upload failed:', err.message);
    return null;
  }
}

function pickRandom<T>(arr: T[]): T {
  return arr[Math.floor(Math.random() * arr.length)];
}

function mapToPostIndustry(raw: any): 'PHOTOGRAPHY' | 'DESIGN' | 'FINE_ART' {
  if (raw === 'PHOTOGRAPHY') return 'PHOTOGRAPHY';
  if (raw === 'FINE_ART') return 'FINE_ART';
  return 'DESIGN'; // GRAPHIC_DESIGN and anything else -> DESIGN
}

async function main() {
  console.log('[RESEED] Starting synthetic shot regeneration...');

  const syntheticProfiles = await prisma.communityProfile.findMany({
    where: { isSynthetic: true },
    include: { user: { select: { id: true, primaryIndustry: true, industry: true } } }
  });

  console.log(`[RESEED] ${syntheticProfiles.length} profiles`);

  const targetShotCount = 150;
  const shotsPerProfile = Math.ceil(targetShotCount / syntheticProfiles.length);

  const aspectRotation: string[] = [];
  ASPECT_TARGETS.forEach(t => {
    const count = Math.ceil(targetShotCount * t.targetPercent / 100);
    for (let i = 0; i < count; i++) aspectRotation.push(t.ratio);
  });

  let shotsCreated = 0;
  let failures = 0;

  for (const profile of syntheticProfiles) {
    const industry = mapToPostIndustry(profile.user.primaryIndustry || profile.user.industry);
    const keywords = INDUSTRY_KEYWORDS[industry] || INDUSTRY_KEYWORDS.DESIGN;
    const titles = SHOT_TITLES[industry] || SHOT_TITLES.DESIGN;

    for (let i = 0; i < shotsPerProfile && shotsCreated < targetShotCount; i++) {
      const aspect = aspectRotation[shotsCreated % aspectRotation.length];
      const keyword = pickRandom(keywords);
      const title = pickRandom(titles);

      const img = await fetchUnsplashImage(keyword, aspect);
      if (!img) { failures++; continue; }

      const filename = `${profile.id}-${Date.now()}-${i}.jpg`;
      const uploadedUrl = await uploadToSupabase(img.url, filename);
      if (!uploadedUrl) { failures++; continue; }

      // 30% get 1-2 additional images
      const additionalImages: string[] = [];
      if (Math.random() < 0.3) {
        const addCount = Math.floor(Math.random() * 2) + 1;
        for (let a = 0; a < addCount; a++) {
          await new Promise(r => setTimeout(r, 1200));
          const addImg = await fetchUnsplashImage(keyword, aspect);
          if (addImg) {
            const addFilename = `${profile.id}-${Date.now()}-${i}-add-${a}.jpg`;
            const addUploaded = await uploadToSupabase(addImg.url, addFilename);
            if (addUploaded) additionalImages.push(addUploaded);
          }
        }
      }

      const daysBack = Math.floor(Math.random() * 30);
      const createdAt = new Date(Date.now() - daysBack * 24 * 60 * 60 * 1000);

      await prisma.post.create({
        data: {
          authorId: profile.id,
          content: title,
          industry,
          mainImage: uploadedUrl,
          additionalImages,
          hiddenFromGrid: false,
          createdAt,
        }
      });
      shotsCreated++;

      if (shotsCreated % 10 === 0) console.log(`[RESEED] Progress: ${shotsCreated}/${targetShotCount}`);

      await new Promise(r => setTimeout(r, 1200));
    }
  }

  console.log(`[RESEED] Complete: ${shotsCreated} shots (${failures} failures)`);
  return { shotsCreated, failures };
}

main()
  .then(({ shotsCreated, failures }) => {
    process.exit(failures > 30 ? 1 : 0);
  })
  .catch(err => {
    console.error('[RESEED] Fatal:', err);
    process.exit(1);
  });
