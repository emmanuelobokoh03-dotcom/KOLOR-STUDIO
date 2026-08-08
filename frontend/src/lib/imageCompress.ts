// iter 287-v3a — Client-side image compression util
// Extracted from CommunityFeed.tsx L27-52 for reuse in ComposeModal.
// Resizes to 1600px max side, JPEG q=0.85. Drops typical 5MB iPhone photo
// to ~300-400KB before upload.

export async function compressImage(
  file: File,
  maxSide = 1600,
  quality = 0.85
): Promise<File> {
  return new Promise((resolve) => {
    const img = new Image()
    img.onload = () => {
      let { width, height } = img
      if (width > maxSide || height > maxSide) {
        const ratio = Math.min(maxSide / width, maxSide / height)
        width = Math.round(width * ratio)
        height = Math.round(height * ratio)
      }
      const canvas = document.createElement('canvas')
      canvas.width = width
      canvas.height = height
      canvas.getContext('2d')!.drawImage(img, 0, 0, width, height)
      canvas.toBlob(
        (blob) =>
          resolve(
            blob
              ? new File([blob], file.name.replace(/\.[^.]+$/, '.jpg'), { type: 'image/jpeg' })
              : file
          ),
        'image/jpeg',
        quality
      )
    }
    img.onerror = () => resolve(file)
    img.src = URL.createObjectURL(file)
  })
}

// iter 287-v3a — Milestone keyword detection (extracted from CommunityFeed L23)
export const MILESTONE_KEYWORDS = [
  'commission',
  'delivered',
  'signed',
  'paid',
  'completed',
  'booked',
  'first client',
  'first quote',
  'sold',
]

export function detectMilestone(text: string): boolean {
  const lower = text.toLowerCase()
  return MILESTONE_KEYWORDS.some((kw) => lower.includes(kw))
}

// Map user's primaryIndustry (9 values) to community Post industry (3 values).
// Preserved verbatim from CommunityFeed.tsx L143-147.
export function mapToPostIndustry(
  userIndustry: string | null | undefined
): 'PHOTOGRAPHY' | 'DESIGN' | 'FINE_ART' {
  if (userIndustry === 'FINE_ART' || userIndustry === 'SCULPTURE') return 'FINE_ART'
  if (
    userIndustry === 'WEB_DESIGN' ||
    userIndustry === 'BRANDING' ||
    userIndustry === 'ILLUSTRATION' ||
    userIndustry === 'GRAPHIC_DESIGN' ||
    userIndustry === 'DESIGN'
  )
    return 'DESIGN'
  return 'PHOTOGRAPHY'
}
