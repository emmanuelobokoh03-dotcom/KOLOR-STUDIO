import { Router, Response } from 'express'
import { PrismaClient } from '@prisma/client'
import { authMiddleware, AuthRequest } from '../middleware/auth'

const router = Router()
const prisma = new PrismaClient()

// ─── Notification helper ───────────────────────────────────────────────────
async function createNotification(
  recipientId: string,
  type: 'POST_LIKED' | 'POST_COMMENTED' | 'DM_RECEIVED' | 'NEW_FOLLOWER',
  meta: { postId?: string; commentId?: string; fromUserId?: string; threadId?: string }
) {
  try {
    // Don't notify yourself
    if (meta.fromUserId && meta.fromUserId === recipientId) return
    await prisma.notification.create({
      data: { recipientId, type, ...meta },
    })
  } catch { /* non-blocking — notification failure never breaks primary action */ }
}

// ─── Feed ─────────────────────────────────────────────────────────────────

// GET /api/community/feed?industry=&cursor=
router.get('/feed', authMiddleware, async (req: AuthRequest, res: Response): Promise<void> => {
  try {
    const { industry, cursor } = req.query
    const take = 20
    const where: any = { isDeleted: false }
    if (industry && industry !== 'ALL') where.industry = industry

    const myProfile = await prisma.communityProfile.findUnique({ where: { userId: req.userId! } })
    const myProfileId = myProfile?.id

    const posts = await prisma.post.findMany({
      where,
      orderBy: { createdAt: 'desc' },
      take,
      skip: cursor ? 1 : 0,
      cursor: cursor ? { id: cursor as string } : undefined,
      include: {
        author: { select: { id: true, userId: true, bio: true, city: true, availability: true, isSynthetic: true,
          user: { select: { firstName: true, lastName: true, primaryIndustry: true } } } },
        _count: { select: { likes: true, comments: true } },
        likes: myProfileId ? { where: { userId: myProfileId }, select: { userId: true } } : false,
      },
    })

    const nextCursor = posts.length === take ? posts[posts.length - 1].id : null
    res.json({ posts, nextCursor, myProfileId })
  } catch (e) { res.status(500).json({ error: 'Failed to fetch feed' }) }
})

// GET /api/community/trending — top 3 most-liked posts past 7 days
router.get('/trending', authMiddleware, async (req: AuthRequest, res: Response): Promise<void> => {
  try {
    const sevenDaysAgo = new Date(Date.now() - 7 * 24 * 60 * 60 * 1000)
    const myProfile = await prisma.communityProfile.findUnique({ where: { userId: req.userId! } })
    const myProfileId = myProfile?.id

    const posts = await prisma.post.findMany({
      where: { isDeleted: false, createdAt: { gte: sevenDaysAgo } },
      include: {
        author: { select: { id: true, userId: true, bio: true, city: true, isSynthetic: true,
          user: { select: { firstName: true, lastName: true, primaryIndustry: true } } } },
        _count: { select: { likes: true, comments: true } },
        likes: myProfileId ? { where: { userId: myProfileId }, select: { userId: true } } : false,
      },
      orderBy: { likes: { _count: 'desc' } },
      take: 3,
    })
    res.json({ posts })
  } catch (e) { res.status(500).json({ error: 'Failed to fetch trending' }) }
})

// POST /api/community/posts
router.post('/posts', authMiddleware, async (req: AuthRequest, res: Response): Promise<void> => {
  try {
    const { content, industry, images } = req.body
    if (!content?.trim() || content.length > 500) { res.status(400).json({ error: 'Content required (max 500 chars)' }); return }

    let profile = await prisma.communityProfile.findUnique({ where: { userId: req.userId! } })
    if (!profile) {
      profile = await prisma.communityProfile.create({ data: { userId: req.userId! } })
    }

    const post = await prisma.post.create({
      data: { authorId: profile.id, content: content.trim(), industry: industry || 'PHOTOGRAPHY', images: images || [] },
      include: {
        author: { select: { id: true, userId: true, bio: true, city: true,
          user: { select: { firstName: true, lastName: true, primaryIndustry: true } } } },
        _count: { select: { likes: true, comments: true } },
        likes: { select: { userId: true } },
      },
    })
    res.json({ post })
  } catch (e) { res.status(500).json({ error: 'Failed to create post' }) }
})

// PATCH /api/community/posts/:id
router.patch('/posts/:id', authMiddleware, async (req: AuthRequest, res: Response): Promise<void> => {
  try {
    const { content } = req.body
    const profile = await prisma.communityProfile.findUnique({ where: { userId: req.userId! } })
    if (!profile) { res.status(403).json({ error: 'No community profile' }); return }

    const post = await prisma.post.findFirst({ where: { id: (req.params.id as string), authorId: profile.id, isDeleted: false } })
    if (!post) { res.status(404).json({ error: 'Post not found' }); return }

    const dayAgo = new Date(Date.now() - 24 * 60 * 60 * 1000)
    if (post.createdAt < dayAgo) { res.status(403).json({ error: 'Posts can only be edited within 24 hours' }); return }

    const updated = await prisma.post.update({ where: { id: post.id }, data: { content: content.trim(), editedAt: new Date() } })
    res.json({ post: updated })
  } catch (e) { res.status(500).json({ error: 'Failed to edit post' }) }
})

// DELETE /api/community/posts/:id (soft delete)
router.delete('/posts/:id', authMiddleware, async (req: AuthRequest, res: Response): Promise<void> => {
  try {
    const profile = await prisma.communityProfile.findUnique({ where: { userId: req.userId! } })
    if (!profile) { res.status(403).json({ error: 'No profile' }); return }
    await prisma.post.updateMany({ where: { id: (req.params.id as string), authorId: profile.id }, data: { isDeleted: true } })
    res.json({ ok: true })
  } catch (e) { res.status(500).json({ error: 'Failed' }) }
})

// POST /api/community/posts/:id/like (toggle)
router.post('/posts/:id/like', authMiddleware, async (req: AuthRequest, res: Response): Promise<void> => {
  try {
    let profile = await prisma.communityProfile.findUnique({ where: { userId: req.userId! } })
    if (!profile) profile = await prisma.communityProfile.create({ data: { userId: req.userId! } })

    const existing = await prisma.postLike.findUnique({
      where: { userId_postId: { userId: profile.id, postId: (req.params.id as string) } }
    })
    if (existing) {
      await prisma.postLike.delete({ where: { userId_postId: { userId: profile.id, postId: (req.params.id as string) } } })
      res.json({ liked: false })
    } else {
      await prisma.postLike.create({ data: { userId: profile.id, postId: (req.params.id as string) } })
      // Notify post author
      const likedPost = await prisma.post.findUnique({ where: { id: (req.params.id as string) }, select: { authorId: true } })
      if (likedPost) await createNotification(likedPost.authorId, 'POST_LIKED', { postId: (req.params.id as string), fromUserId: profile.id })
      res.json({ liked: true })
    }
  } catch (e) { res.status(500).json({ error: 'Failed' }) }
})

// GET /api/community/posts/:id/comments
router.get('/posts/:id/comments', authMiddleware, async (req: AuthRequest, res: Response): Promise<void> => {
  try {
    const comments = await prisma.comment.findMany({
      where: { postId: (req.params.id as string), isDeleted: false, parentCommentId: null },
      orderBy: { createdAt: 'asc' },
      include: {
        author: { select: { id: true, userId: true, city: true,
          user: { select: { firstName: true, lastName: true, primaryIndustry: true } } } },
      },
    })
    res.json({ comments })
  } catch (e) { res.status(500).json({ error: 'Failed' }) }
})

// POST /api/community/posts/:id/comments
router.post('/posts/:id/comments', authMiddleware, async (req: AuthRequest, res: Response): Promise<void> => {
  try {
    const { content, parentCommentId } = req.body
    if (!content?.trim()) { res.status(400).json({ error: 'Content required' }); return }

    let profile = await prisma.communityProfile.findUnique({ where: { userId: req.userId! } })
    if (!profile) profile = await prisma.communityProfile.create({ data: { userId: req.userId! } })

    const comment = await prisma.comment.create({
      data: { postId: (req.params.id as string), authorId: profile.id, content: content.trim(), parentCommentId: parentCommentId || null },
      include: { author: { select: { id: true, userId: true, city: true,
        user: { select: { firstName: true, lastName: true, primaryIndustry: true } } } } },
    })
    // Notify post author
    const commentedPost = await prisma.post.findUnique({ where: { id: (req.params.id as string) }, select: { authorId: true } })
    if (commentedPost) await createNotification(commentedPost.authorId, 'POST_COMMENTED', { postId: (req.params.id as string), commentId: comment.id, fromUserId: profile.id })
    res.json({ comment })
  } catch (e) { res.status(500).json({ error: 'Failed' }) }
})

// ─── Profiles ─────────────────────────────────────────────────────────────

// GET /api/community/profile/me
router.get('/profile/me', authMiddleware, async (req: AuthRequest, res: Response): Promise<void> => {
  try {
    const profile = await prisma.communityProfile.findUnique({
      where: { userId: req.userId! },
      include: { user: { select: { firstName: true, lastName: true, primaryIndustry: true, email: true } },
        _count: { select: { followers: true, following: true, posts: true } } },
    })
    res.json({ profile })
  } catch (e) { res.status(500).json({ error: 'Failed' }) }
})

// PATCH /api/community/profile
router.patch('/profile', authMiddleware, async (req: AuthRequest, res: Response): Promise<void> => {
  try {
    const { bio, city, availability, isPublic } = req.body
    let profile = await prisma.communityProfile.findUnique({ where: { userId: req.userId! } })
    if (!profile) {
      profile = await prisma.communityProfile.create({ data: { userId: req.userId! } })
    }
    const updated = await prisma.communityProfile.update({
      where: { userId: req.userId! },
      data: { ...(bio !== undefined && { bio }), ...(city !== undefined && { city }),
               ...(availability !== undefined && { availability }), ...(isPublic !== undefined && { isPublic }) },
      include: { user: { select: { firstName: true, lastName: true, primaryIndustry: true } } },
    })
    res.json({ profile: updated })
  } catch (e) { res.status(500).json({ error: 'Failed' }) }
})

// GET /api/community/discover?industry=&city=&cursor=
router.get('/discover', authMiddleware, async (req: AuthRequest, res: Response): Promise<void> => {
  try {
    const { industry, city, cursor } = req.query
    const take = 24
    const where: any = { isPublic: true }
    if (city) where.city = { contains: city as string, mode: 'insensitive' }
    if (industry && industry !== 'ALL') {
      where.user = { primaryIndustry: industry }
    }

    const profiles = await prisma.communityProfile.findMany({
      where,
      take,
      skip: cursor ? 1 : 0,
      cursor: cursor ? { id: cursor as string } : undefined,
      orderBy: { joinedAt: 'desc' },
      include: {
        user: { select: { firstName: true, lastName: true, primaryIndustry: true } },
        _count: { select: { posts: true, followers: true } },
      },
    })

    const nextCursor = profiles.length === take ? profiles[profiles.length - 1].id : null
    res.json({ profiles, nextCursor })
  } catch (e) { res.status(500).json({ error: 'Failed' }) }
})

// ─── DMs ──────────────────────────────────────────────────────────────────

// GET /api/community/dms
router.get('/dms', authMiddleware, async (req: AuthRequest, res: Response): Promise<void> => {
  try {
    const profile = await prisma.communityProfile.findUnique({ where: { userId: req.userId! } })
    if (!profile) { res.json({ threads: [] }); return }

    const threads = await prisma.dMThread.findMany({
      where: { OR: [{ participantA: profile.id }, { participantB: profile.id }] },
      orderBy: { updatedAt: 'desc' },
      include: {
        messages: { orderBy: { sentAt: 'desc' }, take: 1 },
        partA: {
          select: { id: true, city: true, user: { select: { firstName: true, lastName: true } } }
        },
        partB: {
          select: { id: true, city: true, user: { select: { firstName: true, lastName: true } } }
        },
      },
    })
    res.json({ threads, myProfileId: profile.id })
  } catch (e) { res.status(500).json({ error: 'Failed' }) }
})

// POST /api/community/dms/:userId — start or get thread
router.post('/dms/:userId', authMiddleware, async (req: AuthRequest, res: Response): Promise<void> => {
  try {
    let myProfile = await prisma.communityProfile.findUnique({ where: { userId: req.userId! } })
    if (!myProfile) myProfile = await prisma.communityProfile.create({ data: { userId: req.userId! } })

    const theirProfile = await prisma.communityProfile.findUnique({ where: { id: (req.params.userId as string) } })
    if (!theirProfile) { res.status(404).json({ error: 'Profile not found' }); return }

    const [a, b] = [myProfile.id, theirProfile.id].sort()
    const thread = await prisma.dMThread.upsert({
      where: { participantA_participantB: { participantA: a, participantB: b } },
      update: {},
      create: { participantA: a, participantB: b },
    })
    res.json({ thread, myProfileId: myProfile.id })
  } catch (e) { res.status(500).json({ error: 'Failed' }) }
})

// GET /api/community/dms/:threadId/messages?after=
router.get('/dms/:threadId/messages', authMiddleware, async (req: AuthRequest, res: Response): Promise<void> => {
  try {
    const { after } = req.query
    const messages = await prisma.dMMessage.findMany({
      where: { threadId: (req.params.threadId as string), ...(after ? { sentAt: { gt: new Date(after as string) } } : {}) },
      orderBy: { sentAt: 'asc' },
      take: 50,
      include: { sender: { select: { id: true, userId: true,
        user: { select: { firstName: true, lastName: true } } } } },
    })
    res.json({ messages })
  } catch (e) { res.status(500).json({ error: 'Failed' }) }
})

// POST /api/community/dms/:threadId/messages
router.post('/dms/:threadId/messages', authMiddleware, async (req: AuthRequest, res: Response): Promise<void> => {
  try {
    const { content } = req.body
    if (!content?.trim()) { res.status(400).json({ error: 'Content required' }); return }

    const profile = await prisma.communityProfile.findUnique({ where: { userId: req.userId! } })
    if (!profile) { res.status(403).json({ error: 'No profile' }); return }

    const message = await prisma.dMMessage.create({
      data: { threadId: (req.params.threadId as string), senderId: profile.id, content: content.trim() },
      include: { sender: { select: { id: true, userId: true,
        user: { select: { firstName: true, lastName: true } } } } },
    })

    await prisma.dMThread.update({ where: { id: (req.params.threadId as string) }, data: { updatedAt: new Date() } })

    // Notify the other participant
    const thread = await prisma.dMThread.findUnique({ where: { id: (req.params.threadId as string) } })
    if (thread) {
      const recipientId = thread.participantA === profile.id ? thread.participantB : thread.participantA
      await createNotification(recipientId, 'DM_RECEIVED', { threadId: (req.params.threadId as string), fromUserId: profile.id })
    }

    res.json({ message })
  } catch (e) { res.status(500).json({ error: 'Failed' }) }
})

// PATCH /api/community/dms/:threadId/read
router.patch('/dms/:threadId/read', authMiddleware, async (req: AuthRequest, res: Response): Promise<void> => {
  try {
    const profile = await prisma.communityProfile.findUnique({ where: { userId: req.userId! } })
    if (!profile) { res.status(403).json({ error: 'No profile' }); return }
    await prisma.dMMessage.updateMany({
      where: { threadId: (req.params.threadId as string), senderId: { not: profile.id }, readAt: null },
      data: { readAt: new Date() },
    })
    res.json({ ok: true })
  } catch (e) { res.status(500).json({ error: 'Failed' }) }
})

// ─── Follows ──────────────────────────────────────────────────────────────

// POST /api/community/follows/:profileId (toggle)
router.post('/follows/:profileId', authMiddleware, async (req: AuthRequest, res: Response): Promise<void> => {
  try {
    let profile = await prisma.communityProfile.findUnique({ where: { userId: req.userId! } })
    if (!profile) profile = await prisma.communityProfile.create({ data: { userId: req.userId! } })

    const existing = await prisma.follow.findUnique({
      where: { followerId_followingId: { followerId: profile.id, followingId: (req.params.profileId as string) } }
    })
    if (existing) {
      await prisma.follow.delete({ where: { followerId_followingId: { followerId: profile.id, followingId: (req.params.profileId as string) } } })
      res.json({ following: false })
    } else {
      await prisma.follow.create({ data: { followerId: profile.id, followingId: (req.params.profileId as string) } })
      await createNotification((req.params.profileId as string), 'NEW_FOLLOWER', { fromUserId: profile.id })
      res.json({ following: true })
    }
  } catch (e) { res.status(500).json({ error: 'Failed' }) }
})

// ─── Notifications ─────────────────────────────────────────────────────────

// GET /api/community/notifications
router.get('/notifications', authMiddleware, async (req: AuthRequest, res: Response): Promise<void> => {
  try {
    const profile = await prisma.communityProfile.findUnique({ where: { userId: req.userId! } })
    if (!profile) { res.json({ notifications: [], unread: 0 }); return }

    const notifications = await prisma.notification.findMany({
      where: { recipientId: profile.id },
      orderBy: { createdAt: 'desc' },
      take: 20,
    })
    const unread = notifications.filter(n => !n.isRead).length
    res.json({ notifications, unread })
  } catch (e) { res.status(500).json({ error: 'Failed' }) }
})

// PATCH /api/community/notifications/read
router.patch('/notifications/read', authMiddleware, async (req: AuthRequest, res: Response): Promise<void> => {
  try {
    const profile = await prisma.communityProfile.findUnique({ where: { userId: req.userId! } })
    if (!profile) { res.status(403).json({ error: 'No profile' }); return }
    await prisma.notification.updateMany({ where: { recipientId: profile.id, isRead: false }, data: { isRead: true } })
    res.json({ ok: true })
  } catch (e) { res.status(500).json({ error: 'Failed' }) }
})

// POST /api/community/reports
router.post('/reports', authMiddleware, async (req: AuthRequest, res: Response): Promise<void> => {
  try {
    const { postId, commentId, reason } = req.body
    console.log('[COMMUNITY_REPORT]', { postId, commentId, reason, reportedBy: req.userId })
    res.json({ ok: true })
  } catch (e) { res.status(500).json({ error: 'Failed' }) }
})

export default router
