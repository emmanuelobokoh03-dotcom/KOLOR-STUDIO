// iter 289-v3c3a verification: handle backfill + public profile endpoints
const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

const BASE = 'http://localhost:3001';

async function main() {
  const results = { passed: [], failed: [] };

  // ---- 1. All CommunityProfile rows have handle set ----
  const total = await prisma.communityProfile.count();
  const nullCount = await prisma.communityProfile.count({ where: { handle: null } });
  const withHandle = total - nullCount;
  console.log(`[TEST 1] Total profiles: ${total}, null handle: ${nullCount}, with handle: ${withHandle}`);
  if (nullCount === 0 && total > 0) results.passed.push('all_handles_set');
  else results.failed.push(`null_handles_present: ${nullCount}/${total}`);

  // ---- 2. Handles match expected format /^[a-z0-9]+-[a-z0-9]{4,8}$/ ----
  const sample = await prisma.communityProfile.findMany({
    select: { handle: true }, take: 50,
  });
  const re = /^[a-z0-9]+-[a-z0-9]{4,8}$/;
  const bad = sample.filter(p => p.handle && !re.test(p.handle));
  console.log(`[TEST 2] Sample handles (${sample.length}):`, sample.slice(0, 5).map(s => s.handle));
  console.log(`  Bad-format: ${bad.length}`, bad.slice(0, 5));
  if (bad.length === 0) results.passed.push('handle_format_correct');
  else results.failed.push(`bad_format: ${bad.length} (e.g. ${JSON.stringify(bad.slice(0,3))})`);

  // ---- 3. Pick a real handle for endpoint testing ----
  const pub = await prisma.communityProfile.findFirst({
    where: { isPublic: true, handle: { not: null } },
    select: { handle: true, id: true },
  });
  console.log(`[TEST 3] Public profile sample: ${JSON.stringify(pub)}`);
  if (!pub) {
    results.failed.push('no_public_profile_found');
    console.log(JSON.stringify(results, null, 2));
    await prisma.$disconnect();
    return;
  }

  // ---- 4. GET /api/profiles/:handle ----
  let r = await fetch(`${BASE}/api/profiles/${pub.handle}`);
  console.log(`[TEST 4] GET /api/profiles/${pub.handle} → ${r.status}`);
  const body = await r.json();
  console.log(`  body keys: ${Object.keys(body).join(',')}`);
  if (r.status === 200 && body.profile && body.profile.handle === pub.handle) {
    results.passed.push('get_profile_by_handle');
  } else {
    results.failed.push(`get_profile_by_handle: status=${r.status}, body=${JSON.stringify(body).slice(0,200)}`);
  }

  // Also check hint about 'amara-rkfg'
  const amara = await prisma.communityProfile.findFirst({ where: { handle: { startsWith: 'amara-' } }, select: { handle: true } });
  console.log(`[TEST 4b] Amara profile: ${amara?.handle}`);
  if (amara) {
    const r2 = await fetch(`${BASE}/api/profiles/${amara.handle}`);
    console.log(`  GET /api/profiles/${amara.handle} → ${r2.status}`);
    if (r2.status === 200) results.passed.push(`get_amara_${amara.handle}`);
    else results.failed.push(`get_amara: status=${r2.status}`);
  }

  // ---- 5. GET /api/profiles/:handle/posts ----
  r = await fetch(`${BASE}/api/profiles/${pub.handle}/posts`);
  const bodyPosts = await r.json();
  console.log(`[TEST 5] GET /api/profiles/${pub.handle}/posts → ${r.status}, posts count: ${bodyPosts.posts?.length}`);
  if (r.status === 200 && Array.isArray(bodyPosts.posts)) results.passed.push('get_profile_posts');
  else results.failed.push(`get_profile_posts: status=${r.status}`);

  // ---- 6. GET /api/profiles/:handle for non-existent → 404 ----
  r = await fetch(`${BASE}/api/profiles/nonexistent-9999zzzz`);
  console.log(`[TEST 6] GET nonexistent handle → ${r.status}`);
  if (r.status === 404) results.passed.push('404_on_nonexistent');
  else results.failed.push(`404_check: got ${r.status}`);

  // ---- 7. Auth-required endpoints return 401 without cookie ----
  r = await fetch(`${BASE}/api/community/shots/some-id`);
  console.log(`[TEST 7a] GET /api/community/shots/:id (no auth) → ${r.status}`);
  if (r.status === 401) results.passed.push('shots_endpoint_auth_gated');
  else results.failed.push(`shots_auth: got ${r.status}`);

  r = await fetch(`${BASE}/api/community/dms/${pub.id}`, { method: 'POST' });
  console.log(`[TEST 7b] POST /api/community/dms/:userId (no auth) → ${r.status}`);
  if (r.status === 401) results.passed.push('dms_endpoint_auth_gated');
  else results.failed.push(`dms_auth: got ${r.status}`);

  console.log('\n=== SUMMARY ===');
  console.log(`PASSED (${results.passed.length}):`, results.passed);
  console.log(`FAILED (${results.failed.length}):`, results.failed);

  await prisma.$disconnect();
  process.exit(results.failed.length > 0 ? 1 : 0);
}

main().catch(e => { console.error(e); process.exit(2); });
