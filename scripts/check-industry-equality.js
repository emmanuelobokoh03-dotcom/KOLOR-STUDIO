#!/usr/bin/env node
/**
 * Industry-equality lint — grep-based check for the recurring
 * Fine Art exclusion bug (iter 230, 232, 242, 245, and prior).
 *
 * Rules:
 *  1. TRIAD COMPLETENESS — if any two of the three industry stems
 *     ({photograph, design, fine art}) appear within 120 chars of each
 *     other, the third stem must also appear in the same window.
 *     Catches all three failure directions:
 *       - "photographers, designers, and artists" (missing "fine")
 *       - "photographers and designers" (missing fine art entirely)
 *       - "designers and fine artists" (missing photographers)
 *
 *  2. BARE "artists" — matches "artists?" not preceded by "fine ",
 *     excluding compound nouns that legitimately mean something else
 *     (community, studio, residency, residence, statement,
 *     in-residence, in residence).
 *
 * All matching case-insensitive. Skip conditions: import/export/type
 * lines, comments referencing the rule itself, PROJECT_TYPE_LABELS
 * (known static map awaiting Emmanuel's decision).
 *
 * MODE: soft. Exits 0 regardless of findings. To promote to strict,
 * change `SOFT_MODE = false` and add to package.json prebuild.
 */

const fs = require('fs')
const path = require('path')

const SOFT_MODE = false // exit non-zero on findings (strict, since iter 251)
// Repo root is the parent of the scripts/ dir this file lives in.
// Anchoring to __dirname makes the lint work regardless of cwd
// (e.g. `npm run lint:industry` from frontend/).
const REPO_ROOT = path.resolve(__dirname, '..')
const ROOTS = ['frontend/src', 'backend/src'].map(r => path.join(REPO_ROOT, r))
const EXTENSIONS = ['.ts', '.tsx', '.md']
const IGNORE_DIRS = new Set(['node_modules', 'dist', 'build', '.next', '.git'])

// Files to skip — self-referential (this file describes the rule)
const IGNORE_FILES = new Set([
  'check-industry-equality.js',
])

// Shared helpers
const WINDOW = 120           // char window for pair detection
const THIRD_STEM_WINDOW = 200 // extra chars around pair when searching for third stem
                             // (accommodates enum-map arrays with items on adjacent lines)

const isTechnicalLine = (line) =>
  /^(import|export|type|interface|const\s+\w+\s*[:=]\s*['"`]?[A-Z_]+)/.test(line) ||
  line.includes('check-industry-equality') ||
  /PROJECT_TYPE_LABELS/.test(line)

// A prose match must contain at least one lowercase letter. This kills
// enum-token noise like PHOTOGRAPHY / FINE_ART / DESIGN_SYSTEM.
const hasLowercase = (s) => /[a-z]/.test(s)

// Magic comment on the same line → skip finding.
// Supports both //-style and {/* */} JSX form.
const hasAllowComment = (line) =>
  /\/\/\s*industry-equality:\s*allow\b/.test(line) ||
  /\{\s*\/\*\s*industry-equality:\s*allow\b/.test(line)

// A line starting with an ALL_CAPS identifier followed by `:` is almost
// always an enum-map value like `PHOTOGRAPHY_SHOOT: 'Photography shoot'`.
// Skip: the industry keyword is in the display value by construction and
// carries no marketing meaning.
const looksLikeEnumMapValue = (line) =>
  /^\s*[A-Z][A-Z0-9_]{2,}\s*:/.test(line)

const lineAt = (text, index) => {
  const start = text.lastIndexOf('\n', index) + 1
  const end = text.indexOf('\n', index)
  return text.slice(start, end === -1 ? text.length : end).trim()
}

const rules = [
  {
    id: 'triad_incomplete',
    description: 'Two of {photograph, design, fine art} appear together without the third',
    scan: (text) => {
      const findings = []
      const stemDefs = [
        { name: 'photograph', re: /photograph/i },
        { name: 'design',     re: /design/i },
        { name: 'fine art',   re: /fine\s*art/i },
      ]

      // Collect every stem occurrence with its position and stem name
      const allStemsRe = /photograph|design|fine\s*art/gi
      const positions = []
      let m
      while ((m = allStemsRe.exec(text)) !== null) {
        const matched = m[0].toLowerCase().replace(/\s+/g, ' ')
        let stem
        if (matched.startsWith('photograph')) stem = 'photograph'
        else if (matched.startsWith('design')) stem = 'design'
        else stem = 'fine art'
        positions.push({ index: m.index, end: m.index + m[0].length, stem })
      }

      // For each pair of distinct-stem positions within WINDOW chars,
      // check whether the third stem is present in the same window
      const reported = new Set()
      for (let i = 0; i < positions.length; i++) {
        const a = positions[i]
        for (let j = i + 1; j < positions.length; j++) {
          const b = positions[j]
          if (b.index - a.end > WINDOW) break  // sorted → nothing further in range
          if (a.stem === b.stem) continue
          const third = stemDefs.find(s => s.name !== a.stem && s.name !== b.stem)
          const winStart = Math.max(0, a.index - THIRD_STEM_WINDOW)
          const winEnd   = Math.min(text.length, b.end + THIRD_STEM_WINDOW)
          const winText  = text.slice(winStart, winEnd)
          if (third.re.test(winText)) continue  // triad complete → OK

          // Report once per line, skip technical / annotated / enum-map lines
          const line = lineAt(text, a.index)
          const lineB = lineAt(text, b.index)
          if (isTechnicalLine(line) || isTechnicalLine(lineB)) continue
          if (hasAllowComment(line) || hasAllowComment(lineB)) continue
          if (looksLikeEnumMapValue(line) || looksLikeEnumMapValue(lineB)) continue
          // Skip if either stem occurrence is an enum token (all-caps)
          const aText = text.slice(a.index, a.end)
          const bText = text.slice(b.index, b.end)
          if (!hasLowercase(aText) || !hasLowercase(bText)) continue
          const key = `${a.index}-${b.index}`
          if (reported.has(key)) continue
          reported.add(key)

          findings.push({
            index: a.index,
            missing: third.name,
            snippet: winText.replace(/\s+/g, ' ').slice(0, 200),
          })
        }
      }
      return findings
    },
  },
  {
    id: 'artists_without_fine',
    description: '"artists" not preceded by "fine" (excluding compound nouns)',
    scan: (text) => {
      const findings = []
      // Match "artist" or "artists" NOT preceded by "fine " (any whitespace)
      // AND NOT followed by a compound-noun tail:
      //   community, studio, residency, residence, statement,
      //   in-residence, in residence
      const compoundTail = /(?:\s+|-)?(?:community|studio|residency|residence|statement|in[-\s]residence)\b/i
      const re = /(?<!\bfine\s+)\bartists?\b/gi
      let m
      while ((m = re.exec(text)) !== null) {
        const after = text.slice(m.index + m[0].length, m.index + m[0].length + 25)
        if (compoundTail.test(after)) continue
        const line = lineAt(text, m.index)
        if (isTechnicalLine(line)) continue
        if (hasAllowComment(line)) continue
        if (looksLikeEnumMapValue(line)) continue
        if (!hasLowercase(m[0])) continue  // enum-like uppercase token
        if (/\bARTIST(_|\b)/.test(line)) continue  // enum-like uppercase token
        findings.push({ index: m.index, snippet: line.slice(0, 200) })
      }
      return findings
    },
  },
]

function walk(dir, files = []) {
  if (!fs.existsSync(dir)) return files
  for (const entry of fs.readdirSync(dir, { withFileTypes: true })) {
    if (IGNORE_DIRS.has(entry.name)) continue
    const full = path.join(dir, entry.name)
    if (entry.isDirectory()) {
      walk(full, files)
    } else if (
      EXTENSIONS.some(e => entry.name.endsWith(e)) &&
      !IGNORE_FILES.has(entry.name)
    ) {
      files.push(full)
    }
  }
  return files
}

let totalFindings = 0
const findingsByRule = {}

for (const root of ROOTS) {
  if (!fs.existsSync(root)) continue

  for (const file of walk(root)) {
    const text = fs.readFileSync(file, 'utf8')
    // File-level opt-out: `// industry-equality: ignore-file` anywhere in the file
    if (/\/\/\s*industry-equality:\s*ignore-file\b/.test(text)) continue
    for (const rule of rules) {
      const findings = rule.scan(text)
      if (findings.length > 0) {
        if (!findingsByRule[rule.id]) findingsByRule[rule.id] = []
        for (const f of findings) {
          findingsByRule[rule.id].push({ file: path.relative(REPO_ROOT, file), ...f })
          totalFindings++
        }
      }
    }
  }
}

const mode = SOFT_MODE ? 'SOFT' : 'STRICT'

if (totalFindings === 0) {
  console.log(`[industry-equality] ✓ No findings (${mode})`)
  process.exit(0)
}

console.log(`\n[industry-equality] ${mode} — ${totalFindings} finding(s)\n`)
for (const rule of rules) {
  if (!findingsByRule[rule.id]) continue
  console.log(`— ${rule.id}: ${rule.description}`)
  for (const f of findingsByRule[rule.id]) {
    const missingTag = f.missing ? ` [missing: ${f.missing}]` : ''
    console.log(`    ${f.file}${missingTag}: ${f.snippet.replace(/\s+/g, ' ')}`)
  }
  console.log()
}

process.exit(SOFT_MODE ? 0 : 1)
