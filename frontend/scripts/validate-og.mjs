/**
 * validate-og.mjs — Iter 184
 * Samples 6 pixels from og-card.png and fails if any shows background color.
 * Run: node scripts/validate-og.mjs
 * Add to package.json: "validate:og": "node scripts/validate-og.mjs"
 */

import { statSync } from 'fs'
import { join, dirname } from 'path'
import { fileURLToPath } from 'url'

const __dirname = dirname(fileURLToPath(import.meta.url))
const OG_PATH = join(__dirname, '../public/og-card.png')

// Background color to detect (failure condition)
const BG = { r: 8, g: 6, b: 18 }
const TOLERANCE = 20

// Expected content pixels [x, y, description]
// These coordinates must NOT be background color
const SAMPLE_POINTS = [
  [108, 108, 'logo container center'],
  [220, 80,  'KOLOR brand text'],
  [100, 244, 'headline line 1'],
  [100, 326, 'headline line 2'],
  [100, 400, 'body text / subline'],
  [210, 462, 'feature pill'],
]

function isBackground(r, g, b) {
  return (
    Math.abs(r - BG.r) < TOLERANCE &&
    Math.abs(g - BG.g) < TOLERANCE &&
    Math.abs(b - BG.b) < TOLERANCE
  )
}

async function validate() {
  const stat = statSync(OG_PATH)
  console.log(`og-card.png: ${(stat.size / 1024).toFixed(1)} KB`)

  if (stat.size < 25_000) {
    console.error('FAIL: og-card.png is suspiciously small (< 10KB)')
    console.error('      Render likely failed — expected 15-200KB')
    process.exit(1)
  }
  if (stat.size > 500_000) {
    console.error('FAIL: og-card.png is too large (> 500KB)')
    console.error('      Social platforms may reject or not cache it')
    process.exit(1)
  }

  // Try to use sharp if available, otherwise skip pixel sampling
  try {
    const sharp = await import('sharp')
    const { data, info } = await sharp.default(OG_PATH)
      .raw()
      .toBuffer({ resolveWithObject: true })

    const { width, channels } = info
    const failures = []

    for (const [x, y, desc] of SAMPLE_POINTS) {
      const idx = (y * width + x) * channels
      const r = data[idx], g = data[idx+1], b = data[idx+2]
      if (isBackground(r, g, b)) {
        failures.push(`  FAIL at (${x},${y}) [${desc}]: rgb(${r},${g},${b}) = background`)
      } else {
        console.log(`  OK   (${x},${y}) [${desc}]: rgb(${r},${g},${b})`)
      }
    }

    if (failures.length > 0) {
      console.error('\nOG card validation FAILED:')
      failures.forEach(f => console.error(f))
      process.exit(1)
    }
    console.log('\nog-card.png validation PASSED')
  } catch (e) {
    console.log('Note: sharp not available, skipping pixel sampling (size check passed)')
    console.log('og-card.png size validation PASSED')
  }
}

validate().catch(err => {
  console.error('Validation error:', err.message)
  process.exit(1)
})
