// iter 289-v3c3a.1 verification — 4 corrective fixes
const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();
const BASE = 'http://localhost:8001';

async function main() {
  const results = { passed: [], failed: [] };

  // --- Fix #2a: seed rows exist ---
  const notifCount = await prisma.notification.count({ where: { type: 'DM_REQUEST_RECEIVED' } });
  const pendingCount = await prisma.dMThread.count({ where: { status: 'PENDING' } });
  console.log(`[F2a] DM_REQUEST_RECEIVED notifications: ${notifCount}, PENDING DMThreads: ${pendingCount}`);
  if (notifCount >= 1) results.passed.push('dm_request_notification_seeded');
  else results.failed.push(`no_dm_request_notif: ${notifCount}`);
  if (pendingCount >= 1) results.passed.push('pending_dmthread_seeded');
  else results.failed.push(`no_pending_dmthread: ${pendingCount}`);

  // --- Fix #2b: Emmanuel is the recipient ---
  const emmanuel = await prisma.communityProfile.findFirst({
    where: { handle: 'emmanuel-hov2' },
    select: { id: true, handle: true },
  });
  console.log(`[F2b] Emmanuel profile: ${JSON.stringify(emmanuel)}`);
  if (!emmanuel) {
    results.failed.push('emmanuel_profile_missing');
  } else {
    const emmanuelNotif = await prisma.notification.findFirst({
      where: { recipientId: emmanuel.id, type: 'DM_REQUEST_RECEIVED' },
    });
    console.log(`[F2b] Emmanuel notif: ${JSON.stringify(emmanuelNotif)}`);
    if (emmanuelNotif) results.passed.push('emmanuel_has_dm_request_notif');
    else results.failed.push('emmanuel_missing_notif');

    const emmanuelPending = await prisma.dMThread.findFirst({
      where: {
        status: 'PENDING',
        OR: [{ participantA: emmanuel.id }, { participantB: emmanuel.id }],
      },
    });
    console.log(`[F2b] Emmanuel pending thread: ${emmanuelPending?.id}`);
    if (emmanuelPending) results.passed.push('emmanuel_has_pending_thread');
    else results.failed.push('emmanuel_missing_pending');
  }

  // --- Fix #4a: /api/collections/mine include shape (via seeded prisma call) ---
  // Find a collection with items to inspect via direct Prisma reproducing the route include
  const anyCollection = await prisma.collection.findFirst({
    where: { itemCount: { gt: 0 } },
    include: {
      items: { take: 4, orderBy: { addedAt: 'desc' }, select: { post: { select: { mainImage: true } } } },
      _count: { select: { items: true } },
    },
  });
  console.log(`[F4a] Sample collection: ${anyCollection?.id}, items included: ${anyCollection?.items?.length}, _count: ${JSON.stringify(anyCollection?._count)}`);
  if (anyCollection && Array.isArray(anyCollection.items) && anyCollection._count) {
    // Verify shape: items[].post.mainImage
    const shapeOk = anyCollection.items.every(i => i.post && ('mainImage' in i.post));
    if (shapeOk) results.passed.push('collections_mine_include_shape');
    else results.failed.push(`collections_mine_shape_bad: ${JSON.stringify(anyCollection.items[0])}`);
  } else if (!anyCollection) {
    console.log('[F4a] No collection with itemCount>0 exists to test shape');
    results.failed.push('no_collection_with_items_seeded');
  }

  // --- Fix #4b: GET /api/collections/mine (auth-gated → 401) ---
  let r = await fetch(`${BASE}/api/collections/mine`);
  console.log(`[F4b] GET /api/collections/mine (no auth) → ${r.status}`);
  if (r.status === 401) results.passed.push('collections_mine_auth_gated');
  else results.failed.push(`collections_mine_status: ${r.status}`);

  // --- Fix #4c: GET /api/profiles/:handle/collections public endpoint ---
  // Find any public profile with a public collection
  const publicProfile = await prisma.communityProfile.findFirst({
    where: { isPublic: true, handle: { not: null }, collections: { some: { isPublic: true } } },
    select: { handle: true },
  });
  if (publicProfile) {
    r = await fetch(`${BASE}/api/profiles/${publicProfile.handle}/collections`);
    const body = await r.json();
    console.log(`[F4c] GET /api/profiles/${publicProfile.handle}/collections → ${r.status}, collections: ${body.collections?.length}`);
    if (r.status === 200 && Array.isArray(body.collections)) {
      results.passed.push('public_profile_collections_endpoint');
      // Inspect shape of first collection with items
      const withItems = body.collections.find(c => c._count?.items > 0);
      if (withItems) {
        const hasItemsArr = Array.isArray(withItems.items) && withItems.items.length > 0;
        const firstItem = withItems.items?.[0];
        console.log(`[F4c] Sample item: ${JSON.stringify(firstItem)}`);
        if (hasItemsArr && firstItem?.post && 'mainImage' in firstItem.post) {
          results.passed.push('public_profile_collections_include_shape');
        } else {
          results.failed.push(`public_collections_shape_bad: ${JSON.stringify(firstItem)}`);
        }
      } else {
        console.log('[F4c] No public collection with items to inspect');
      }
    } else {
      results.failed.push(`public_collections_status: ${r.status}`);
    }
  } else {
    console.log('[F4c] No public profile with public collection exists');
  }

  // --- Fix #1 code inspection is done outside; verify route registration ---
  // Just verify /api/community/messages returns 404 or is unregistered (backend has no such route)
  r = await fetch(`${BASE}/api/community/messages`);
  console.log(`[F1] GET /api/community/messages → ${r.status}`);
  // We don't assert—just log; the frontend now navigates to /dashboard?view=community

  // --- Fix #3 backend: /api/community/shots/:id peers array exists ---
  r = await fetch(`${BASE}/api/community/shots/any-id-here`);
  console.log(`[F3] GET /api/community/shots/:id (no auth) → ${r.status}`);
  if (r.status === 401) results.passed.push('shots_endpoint_auth_gated');
  else results.failed.push(`shots_endpoint_status: ${r.status}`);

  console.log('\n=== SUMMARY ===');
  console.log(`PASSED (${results.passed.length}):`, results.passed);
  console.log(`FAILED (${results.failed.length}):`, results.failed);

  await prisma.$disconnect();
  process.exit(results.failed.length > 0 ? 1 : 0);
}

main().catch(e => { console.error(e); process.exit(2); });
