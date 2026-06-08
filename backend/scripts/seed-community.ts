import { PrismaClient, CreativeIndustry, Availability } from '@prisma/client'

const prisma = new PrismaClient()

// ─── Synthetic user personas ───────────────────────────────────────────────
// 40 users across 3 industries and 12 cities
// All flagged isSynthetic=true — excluded from analytics and emails
const PERSONAS = [
  // Photography (14)
  { email: 's.photography.lagos1@kolor.synthetic', firstName: 'Amara', lastName: 'Osei', city: 'Lagos, Nigeria', industry: 'PHOTOGRAPHY' as CreativeIndustry, bio: 'Portrait and editorial photographer. 8 years shooting Lagos.' },
  { email: 's.photography.lagos2@kolor.synthetic', firstName: 'Chidi', lastName: 'Eze', city: 'Lagos, Nigeria', industry: 'PHOTOGRAPHY' as CreativeIndustry, bio: 'Wedding and lifestyle photographer. Canon shooter.' },
  { email: 's.photography.nairobi1@kolor.synthetic', firstName: 'Wanjiku', lastName: 'Mwangi', city: 'Nairobi, Kenya', industry: 'PHOTOGRAPHY' as CreativeIndustry, bio: 'Commercial and fashion photographer. Nairobi-based.' },
  { email: 's.photography.nairobi2@kolor.synthetic', firstName: 'Kipchoge', lastName: 'Rono', city: 'Nairobi, Kenya', industry: 'PHOTOGRAPHY' as CreativeIndustry, bio: 'Documentary and travel photographer across East Africa.' },
  { email: 's.photography.accra1@kolor.synthetic', firstName: 'Ama', lastName: 'Asante', city: 'Accra, Ghana', industry: 'PHOTOGRAPHY' as CreativeIndustry, bio: 'Portrait photographer. Graduate of KNUST.' },
  { email: 's.photography.joburg1@kolor.synthetic', firstName: 'Thabo', lastName: 'Nkosi', city: 'Johannesburg, SA', industry: 'PHOTOGRAPHY' as CreativeIndustry, bio: 'Architectural and interiors photographer. Joburg.' },
  { email: 's.photography.joburg2@kolor.synthetic', firstName: 'Lerato', lastName: 'Dlamini', city: 'Johannesburg, SA', industry: 'PHOTOGRAPHY' as CreativeIndustry, bio: 'Maternity and family photographer. 6 years experience.' },
  { email: 's.photography.london1@kolor.synthetic', firstName: 'Yemi', lastName: 'Adeyemi', city: 'London, UK', industry: 'PHOTOGRAPHY' as CreativeIndustry, bio: 'Event and portrait photographer based in Peckham.' },
  { email: 's.photography.berlin1@kolor.synthetic', firstName: 'Fatou', lastName: 'Diallo', city: 'Berlin, Germany', industry: 'PHOTOGRAPHY' as CreativeIndustry, bio: 'Fashion and editorial photographer. Shoots across Europe.' },
  { email: 's.photography.sao1@kolor.synthetic', firstName: 'Fernanda', lastName: 'Lima', city: 'São Paulo, Brazil', industry: 'PHOTOGRAPHY' as CreativeIndustry, bio: 'Commercial photographer. Brands and products.' },
  { email: 's.photography.capetown1@kolor.synthetic', firstName: 'Zola', lastName: 'Ndlovu', city: 'Cape Town, SA', industry: 'PHOTOGRAPHY' as CreativeIndustry, bio: 'Landscape and fine art photographer. Based in Cape Town.' },
  { email: 's.photography.kampala1@kolor.synthetic', firstName: 'Grace', lastName: 'Nakato', city: 'Kampala, Uganda', industry: 'PHOTOGRAPHY' as CreativeIndustry, bio: 'Portrait and cultural photographer across East Africa.' },
  { email: 's.photography.paris1@kolor.synthetic', firstName: 'Miriam', lastName: 'Okonkwo', city: 'Paris, France', industry: 'PHOTOGRAPHY' as CreativeIndustry, bio: 'Street and documentary photographer. Paris-based Nigerian.' },
  { email: 's.photography.dubai1@kolor.synthetic', firstName: 'Nadia', lastName: 'Al-Hassan', city: 'Dubai, UAE', industry: 'PHOTOGRAPHY' as CreativeIndustry, bio: 'Luxury lifestyle and events photographer.' },

  // Design (13)
  { email: 's.design.berlin1@kolor.synthetic', firstName: 'Kwame', lastName: 'Mensah', city: 'Berlin, Germany', industry: 'DESIGN' as CreativeIndustry, bio: 'Brand identity designer. 10 years. Clients across Europe and Africa.' },
  { email: 's.design.berlin2@kolor.synthetic', firstName: 'Aiko', lastName: 'Suzuki', city: 'Berlin, Germany', industry: 'DESIGN' as CreativeIndustry, bio: 'UX and product designer. Freelance for 5 years.' },
  { email: 's.design.sao1@kolor.synthetic', firstName: 'Rafael', lastName: 'Costa', city: 'São Paulo, Brazil', industry: 'DESIGN' as CreativeIndustry, bio: 'Motion and graphic designer. Brazilian clients and international.' },
  { email: 's.design.sao2@kolor.synthetic', firstName: 'Beatriz', lastName: 'Santos', city: 'São Paulo, Brazil', industry: 'DESIGN' as CreativeIndustry, bio: 'Brand and packaging designer. 7 years freelance.' },
  { email: 's.design.lagos1@kolor.synthetic', firstName: 'Tunde', lastName: 'Bakare', city: 'Lagos, Nigeria', industry: 'DESIGN' as CreativeIndustry, bio: 'Brand identity and visual designer. Lagos-based.' },
  { email: 's.design.lagos2@kolor.synthetic', firstName: 'Ngozi', lastName: 'Obi', city: 'Lagos, Nigeria', industry: 'DESIGN' as CreativeIndustry, bio: 'UI designer and illustrator. Tech and fintech clients.' },
  { email: 's.design.joburg1@kolor.synthetic', firstName: 'Sipho', lastName: 'Khoza', city: 'Johannesburg, SA', industry: 'DESIGN' as CreativeIndustry, bio: 'Brand strategist and designer. Joburg.' },
  { email: 's.design.accra1@kolor.synthetic', firstName: 'Kofi', lastName: 'Boateng', city: 'Accra, Ghana', industry: 'DESIGN' as CreativeIndustry, bio: 'Graphic and digital designer. KNUST graduate.' },
  { email: 's.design.london1@kolor.synthetic', firstName: 'Adaeze', lastName: 'Ike', city: 'London, UK', industry: 'DESIGN' as CreativeIndustry, bio: 'Brand identity designer. Nigerian in London.' },
  { email: 's.design.nairobi1@kolor.synthetic', firstName: 'Brian', lastName: 'Otieno', city: 'Nairobi, Kenya', industry: 'DESIGN' as CreativeIndustry, bio: 'UI/UX and brand designer. Nairobi tech scene.' },
  { email: 's.design.cairo1@kolor.synthetic', firstName: 'Layla', lastName: 'Hassan', city: 'Cairo, Egypt', industry: 'DESIGN' as CreativeIndustry, bio: 'Type and brand designer. Arabic and Latin scripts.' },
  { email: 's.design.lisbon1@kolor.synthetic', firstName: 'Ana', lastName: 'Ferreira', city: 'Lisbon, Portugal', industry: 'DESIGN' as CreativeIndustry, bio: 'Motion and brand designer. Lisbon-based.' },
  { email: 's.design.toronto1@kolor.synthetic', firstName: 'Imani', lastName: 'Clarke', city: 'Toronto, Canada', industry: 'DESIGN' as CreativeIndustry, bio: 'Brand and editorial designer. Nigerian-Canadian.' },

  // Fine Art (13)
  { email: 's.fineart.berlin1@kolor.synthetic', firstName: 'Esther', lastName: 'Abara', city: 'Berlin, Germany', industry: 'FINE_ART' as CreativeIndustry, bio: 'Mixed media artist. Commissions and gallery work.' },
  { email: 's.fineart.berlin2@kolor.synthetic', firstName: 'Viktor', lastName: 'Müller', city: 'Berlin, Germany', industry: 'FINE_ART' as CreativeIndustry, bio: 'Oil painter. Commissions and Berlin gallery exhibitions.' },
  { email: 's.fineart.paris1@kolor.synthetic', firstName: 'Ines', lastName: 'Diarra', city: 'Paris, France', industry: 'FINE_ART' as CreativeIndustry, bio: 'Sculptor and mixed media. Malian-French artist in Paris.' },
  { email: 's.fineart.paris2@kolor.synthetic', firstName: 'Thomas', lastName: 'Beaumont', city: 'Paris, France', industry: 'FINE_ART' as CreativeIndustry, bio: 'Watercolour and ink artist. Portrait commissions.' },
  { email: 's.fineart.london1@kolor.synthetic', firstName: 'Chisom', lastName: 'Okafor', city: 'London, UK', industry: 'FINE_ART' as CreativeIndustry, bio: 'Oil and acrylic painter. Portrait commissions from £800.' },
  { email: 's.fineart.london2@kolor.synthetic', firstName: 'Priya', lastName: 'Sharma', city: 'London, UK', industry: 'FINE_ART' as CreativeIndustry, bio: 'Textile artist and painter. British-Indian.' },
  { email: 's.fineart.capetown1@kolor.synthetic', firstName: 'Nomsa', lastName: 'Sithole', city: 'Cape Town, SA', industry: 'FINE_ART' as CreativeIndustry, bio: 'Mixed media and sculpture. Cape Town-based artist.' },
  { email: 's.fineart.nairobi1@kolor.synthetic', firstName: 'Achieng', lastName: 'Oduor', city: 'Nairobi, Kenya', industry: 'FINE_ART' as CreativeIndustry, bio: 'Watercolour and acrylic artist. East African subjects.' },
  { email: 's.fineart.lagos1@kolor.synthetic', firstName: 'Babatunde', lastName: 'Adewale', city: 'Lagos, Nigeria', industry: 'FINE_ART' as CreativeIndustry, bio: 'Contemporary Nigerian painter. Lagos and international.' },
  { email: 's.fineart.accra1@kolor.synthetic', firstName: 'Efua', lastName: 'Mensah', city: 'Accra, Ghana', industry: 'FINE_ART' as CreativeIndustry, bio: 'Textile and mixed media artist. Accra.' },
  { email: 's.fineart.amsterdam1@kolor.synthetic', firstName: 'Yewande', lastName: 'Bello', city: 'Amsterdam, Netherlands', industry: 'FINE_ART' as CreativeIndustry, bio: 'Conceptual artist. Oil on canvas and installation.' },
  { email: 's.fineart.joburg1@kolor.synthetic', firstName: 'Lungelo', lastName: 'Zulu', city: 'Johannesburg, SA', industry: 'FINE_ART' as CreativeIndustry, bio: 'Contemporary painter. Joburg art scene.' },
  { email: 's.fineart.toronto1@kolor.synthetic', firstName: 'Adunola', lastName: 'Adeyemi', city: 'Toronto, Canada', industry: 'FINE_ART' as CreativeIndustry, bio: 'Nigerian-Canadian artist. Oil commissions and galleries.' },
]

// ─── Post content by industry ──────────────────────────────────────────────
const PHOTOGRAPHY_POSTS = [
  "Lost a ₦200k booking because I didn't have a contract. Never again. 😤",
  "Finally figured out my pricing. The secret: stop charging for hours, charge for the result.",
  "Client asked for 'just a few edits' after delivery. That's a new quote. Stood my ground.",
  "Delivered my first editorial shoot for a magazine today. Two years of saying yes to everything finally paid off.",
  "Anyone else find that clients who push hardest on price are also the most demanding to work with?",
  "My retainer structure: 50% to book, 50% on delivery. No exceptions. Changed my business.",
  "Sent my first KOLOR quote last week. Client accepted in 4 hours. I've been using spreadsheets for 3 years. 😅",
  "Shot a wedding in Accra last weekend. 14 hours, 2,400 images. Currently in the editing cave.",
  "Turned down a ₦150k job because the brief was unclear and the timeline was impossible. Best decision I made this month.",
  "The difference between a good photographer and a good photography business owner is the paperwork.",
  "Client disappeared after I sent the contract. Dodged a bullet. The contract is the filter.",
  "My advice to any creative starting out: get everything in writing before you pick up the camera.",
  "Just hit my first ₦1m month. Couldn't have done it without fixing my admin. Embarrassing how long I ignored it.",
  "Raised my rates 40% this year. Lost 2 clients. Gained 5 better ones.",
  "Shot a campaign for a Lagos fashion brand today. This is why I do this. ✨",
  "Three rounds of revisions in the contract. Client wants a fourth. That's a change order. Being a professional means enforcing this.",
  "The inquiry form on my website has halved the number of discovery calls I need. Qualified leads only.",
  "Delivered a family portrait session today. The mother cried when she saw the gallery. That's the job.",
  "Anyone charging per image for editing? Thinking of restructuring my packages.",
  "2 years freelance. Things I wish I knew: have a contract, get a deposit, follow up in 48 hours.",
]

const DESIGN_POSTS = [
  "Three rounds of revisions in the scope. Client wants a fourth. This is why we have change order clauses.",
  "Turned down a project because the brief had 'make it pop' three times. Not enough money to decode that.",
  "Raised my day rate by 30% and immediately got more serious enquiries. Price is a signal.",
  "Just closed a 6-month brand identity retainer. Biggest single contract of my career. 🎉",
  "The discovery call is not free consulting. It's a sales conversation. Reframe it.",
  "Client: 'Can you just make it like what Apple does?' Me: 'Apple has 150 designers. I have me.'",
  "Scope creep is not a client problem. It's a contract problem.",
  "First time I sent a proper contract with a revision limit, the client read it more carefully than any brief I've sent.",
  "Five years freelance. The skill that made the biggest difference: saying no clearly and kindly.",
  "Brand identity project delivered. 3 months of work. The logo is the least important part.",
  "Anyone else track time even on fixed-fee projects? Not to bill it, but to know if you priced it right.",
  "The client who was 'flexible on budget' was not flexible on budget.",
  "Finished a packaging redesign for a Lagos FMCG brand. Seeing it on shelves next month. 🙏",
  "My contract clause: 'Each round of revisions must be submitted as a single consolidated document.' Saved me so many times.",
  "Milestone payments changed how I work. Deliverable 1 approved and paid before I start Deliverable 2. Always.",
  "UX work: the client's brief describes features. My job is to find the problem under the features.",
  "Anyone else finding that African brands are becoming bolder? It's a great time to be a designer on this continent.",
  "Rejected a project after the first call. Too many stakeholders, no clear decision maker. Recipe for endless revisions.",
  "Just started using KOLOR for client management. The quote builder alone saved me 4 hours this week.",
  "Design is not decoration. That's the conversation I have with every new client on call one.",
]

const FINE_ART_POSTS = [
  "The commission was €4,000. They disappeared after the first email. No contract. No deposit. Lesson learned.",
  "First collector portal set up. Client can see progress photos without me having to WhatsApp them individually. Game changer.",
  "Completed a 90x120cm oil commission today. 6 weeks of work. The deposit protected me when the client changed their mind halfway.",
  "Pricing commissions: I charge by size and medium. Oil is 3x watercolour. Framing is always extra.",
  "Had a collector ask to 'own the copyright' of a commission. That's not how art works. Had to educate gently.",
  "The hardest part of being an independent artist isn't the making. It's the business of the making.",
  "Delivered a portrait commission to a family in London. They've commissioned a second one. This is how it should work.",
  "My wait list is now 4 months long. Never thought I'd say that.",
  "Anyone else use progress photos as a marketing tool? Posting the process gets me more commissions than posting the finished work.",
  "Had a collector dispute the final payment because they 'didn't like the colours.' The contract specified approval of the initial sketch. Held firm.",
  "Gallery commission: 40% to me, 60% to the gallery. Sold two pieces. Direct commission: 100% to me. You do the math.",
  "Raised my commission prices for the third time. Still fully booked. I was leaving money on the table for years.",
  "The client relationship is as important as the work. I choose collectors carefully now.",
  "Shipped a commissioned piece to Nairobi last week. First international delivery. Insurance and tracking are not optional.",
  "Just finished my largest commission to date. 120x150cm. Oil on linen. 4 months. Worth every hour.",
  "Note to self: always photograph the work before it leaves the studio. Always.",
  "Collector wanted to pay in instalments. Wrote it into the contract. Works perfectly. More collectors should ask.",
  "The gap between what artists charge and what their work is worth is a confidence problem, not a market problem.",
  "My commission contract has 8 clauses. Every single one was added because of something that happened without it.",
  "Working on a series for a private collector. 6 pieces over 12 months. This is the kind of work I built my practice for.",
]

// ─── Comments by industry ──────────────────────────────────────────────────
const COMMENTS = [
  "This exactly. Learned it the hard way too.",
  "How long did it take you to get here?",
  "Saving this post. Needed to hear it.",
  "The contract point is everything. Non-negotiable.",
  "Same experience. The serious clients never push back on the contract.",
  "What does your deposit structure look like?",
  "This is the conversation we need to be having more.",
  "Congratulations! Well deserved. 🙌",
  "The pricing conversation is always uncomfortable until it isn't.",
  "Took me 3 years to learn this. Hope others learn faster.",
  "100%. Stood my ground on this last month and the client came back with respect.",
  "What platform are you using for contracts?",
  "This is why I started taking admin seriously. Changed everything.",
  "The filter analogy for contracts is perfect. Keeping this.",
  "How did you handle the conversation when they pushed back?",
]

function randomInt(min: number, max: number): number {
  return Math.floor(Math.random() * (max - min + 1)) + min
}

function daysAgo(days: number): Date {
  const d = new Date()
  d.setDate(d.getDate() - days)
  d.setHours(randomInt(8, 22), randomInt(0, 59))
  return d
}

function pickRandom<T>(arr: T[]): T {
  return arr[Math.floor(Math.random() * arr.length)]
}

async function main() {
  console.log('Starting community seed...')

  // Create synthetic User + CommunityProfile pairs
  const profiles: { id: string; industry: CreativeIndustry; email: string }[] = []

  for (const persona of PERSONAS) {
    // Upsert User
    const user = await prisma.user.upsert({
      where: { email: persona.email },
      update: {},
      create: {
        email: persona.email,
        password: '$2b$10$synthetic.hash.not.real.password.placeholder',
        firstName: persona.firstName,
        lastName: persona.lastName,
        primaryIndustry: persona.industry === 'PHOTOGRAPHY' ? 'PHOTOGRAPHY'
          : persona.industry === 'DESIGN' ? 'GRAPHIC_DESIGN' : 'FINE_ART',
        isActive: true,
        emailVerified: true,
      },
    })

    // Upsert CommunityProfile
    const profile = await prisma.communityProfile.upsert({
      where: { userId: user.id },
      update: {},
      create: {
        userId: user.id,
        bio: persona.bio,
        city: persona.city,
        availability: pickRandom(['OPEN', 'OPEN', 'OPEN', 'BOOKED', 'UNAVAILABLE']) as Availability,
        isPublic: true,
        isSynthetic: true,
      },
    })

    profiles.push({ id: profile.id, industry: persona.industry, email: persona.email })
    console.log(`  Created: ${persona.firstName} ${persona.lastName} (${persona.industry}, ${persona.city})`)
  }

  console.log(`\nCreated ${profiles.length} profiles. Seeding posts...`)

  // Create posts — 10-12 per user, dated 1-60 days ago
  const postIds: string[] = []

  for (const profile of profiles) {
    const postCount = randomInt(10, 12)
    const postPool = profile.industry === 'PHOTOGRAPHY' ? PHOTOGRAPHY_POSTS
      : profile.industry === 'DESIGN' ? DESIGN_POSTS : FINE_ART_POSTS

    for (let i = 0; i < postCount; i++) {
      const existing = await prisma.post.findFirst({
        where: { authorId: profile.id, content: postPool[i % postPool.length] }
      })
      if (existing) { postIds.push(existing.id); continue }

      const post = await prisma.post.create({
        data: {
          authorId: profile.id,
          content: postPool[i % postPool.length],
          images: [],
          industry: profile.industry,
          createdAt: daysAgo(randomInt(1, 60)),
        }
      })
      postIds.push(post.id)
    }
  }

  console.log(`Created ${postIds.length} posts. Adding likes and comments...`)

  // Likes — each post gets 3-15 likes from other profiles
  let likeCount = 0
  for (const postId of postIds) {
    const likerCount = randomInt(3, 15)
    const shuffled = [...profiles].sort(() => Math.random() - 0.5).slice(0, likerCount)
    for (const liker of shuffled) {
      await prisma.postLike.upsert({
        where: { userId_postId: { userId: liker.id, postId } },
        update: {},
        create: { userId: liker.id, postId, createdAt: daysAgo(randomInt(0, 30)) },
      })
      likeCount++
    }
  }

  // Comments — each post gets 1-4 comments
  let commentCount = 0
  for (const postId of postIds) {
    if (Math.random() < 0.3) continue // 30% of posts have no comments
    const count = randomInt(1, 4)
    const commenters = [...profiles].sort(() => Math.random() - 0.5).slice(0, count)
    for (const commenter of commenters) {
      await prisma.comment.create({
        data: {
          postId,
          authorId: commenter.id,
          content: pickRandom(COMMENTS),
          createdAt: daysAgo(randomInt(0, 20)),
        }
      })
      commentCount++
    }
  }

  // Follows — each profile follows 5-12 others
  let followCount = 0
  for (const profile of profiles) {
    const toFollow = [...profiles]
      .filter(p => p.id !== profile.id)
      .sort(() => Math.random() - 0.5)
      .slice(0, randomInt(5, 12))

    for (const target of toFollow) {
      await prisma.follow.upsert({
        where: { followerId_followingId: { followerId: profile.id, followingId: target.id } },
        update: {},
        create: { followerId: profile.id, followingId: target.id, createdAt: daysAgo(randomInt(1, 45)) },
      })
      followCount++
    }
  }

  console.log(`\n✓ Seed complete:`)
  console.log(`  ${profiles.length} synthetic profiles`)
  console.log(`  ${postIds.length} posts`)
  console.log(`  ${likeCount} likes`)
  console.log(`  ${commentCount} comments`)
  console.log(`  ${followCount} follows`)
  console.log(`\nAll users flagged isSynthetic=true`)
  console.log('Excluded from: analytics, emails, notifications')

  await prisma.$disconnect()
}

main().catch(e => {
  console.error('Seed failed:', e)
  process.exit(1)
})
