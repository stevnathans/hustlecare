// app/api/admin/businesses/[id]/how-to-start/route.ts
import { NextRequest, NextResponse } from 'next/server'
import { revalidatePath } from 'next/cache'
import { prisma } from '@/lib/prisma'
import { requirePermission, createAuditLog } from '@/lib/admin-utils'
import { notify } from '@/lib/notify'

function handleAuthError(error: unknown): NextResponse | null {
  if (error instanceof Error) {
    if (error.message === 'Unauthorized') return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    if (error.message === 'Forbidden')    return NextResponse.json({ error: 'Forbidden' },    { status: 403 })
  }
  return null
}

function parseId(value: string): number | null {
  const n = parseInt(value, 10)
  return Number.isFinite(n) && n > 0 ? n : null
}

function sanitizeUrl(value: unknown): string | null {
  if (!value) return null
  try {
    const url = new URL(String(value))
    if (!['https:', 'http:'].includes(url.protocol)) return null
    return url.toString().slice(0, 2000)
  } catch {
    return null
  }
}

const ALLOWED_SECTION_TYPES = new Set(['TIPS', 'WARNING', 'NOTE', 'INFO'])

export async function GET(
  _req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    await requirePermission('businesses.view')
    const { id } = await params
    const businessId = parseId(id)
    if (!businessId) {
      return NextResponse.json({ error: 'Invalid business ID' }, { status: 400 })
    }

    const guide = await prisma.howToGuide.findUnique({
      where:   { businessId },
      include: {
        steps:      { orderBy: { displayOrder: 'asc' } },
        sections:   { orderBy: { displayOrder: 'asc' } },
        faqs:       { orderBy: { displayOrder: 'asc' } },
        references: { orderBy: { refNumber:     'asc' } },
      },
    })

    return NextResponse.json({ guide: guide ?? null })
  } catch (error) {
    const authResponse = handleAuthError(error)
    if (authResponse) return authResponse
    console.error('GET how-to-start:', (error as Error).message)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}

export async function PUT(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    await requirePermission('businesses.update')
    const { id } = await params
    const businessId = parseId(id)
    if (!businessId) {
      return NextResponse.json({ error: 'Invalid business ID' }, { status: 400 })
    }

    const body = await req.json()
    const {
      title,
      imageUrl,
      intro,
      isPublished,
      metaTitle,
      metaDescription,
      keywords,
      steps      = [],
      sections   = [],
      faqs       = [],
      references = [],
    } = body

    if (!Array.isArray(steps) || !Array.isArray(sections) || !Array.isArray(faqs) || !Array.isArray(references)) {
      return NextResponse.json({ error: 'steps, sections, faqs, and references must be arrays' }, { status: 400 })
    }

    if (steps.length > 50 || sections.length > 50 || faqs.length > 100 || references.length > 100) {
      return NextResponse.json({ error: 'Too many items in one or more arrays' }, { status: 400 })
    }

    const business = await prisma.business.findUnique({
      where:  { id: businessId },
      select: { id: true, name: true, slug: true },
    })
    if (!business) {
      return NextResponse.json({ error: 'Business not found' }, { status: 404 })
    }

    // Check publish state BEFORE upserting so we can detect the flip
    const existingGuide = await prisma.howToGuide.findUnique({
      where:  { businessId },
      select: { isPublished: true },
    })
    const wasPublished    = existingGuide?.isPublished ?? false
    const isNowPublished  = Boolean(isPublished)
    const justPublished   = !wasPublished && isNowPublished

    const guide = await prisma.howToGuide.upsert({
      where: { businessId },
      create: {
        businessId,
        title:           title           ? String(title).slice(0, 300)           : null,
        imageUrl:        sanitizeUrl(imageUrl),
        intro:           intro           ? String(intro).slice(0, 10000)         : null,
        isPublished:     isNowPublished,
        publishedAt:     isNowPublished  ? new Date() : null,
        metaTitle:       metaTitle       ? String(metaTitle).slice(0, 200)       : null,
        metaDescription: metaDescription ? String(metaDescription).slice(0, 500) : null,
        keywords: Array.isArray(keywords)
          ? keywords.filter((k: unknown) => typeof k === 'string').slice(0, 50)
          : [],
      },
      update: {
        intro:           intro           ? String(intro).slice(0, 10000)         : null,
        isPublished:     isNowPublished,
        publishedAt:     isNowPublished  ? new Date() : null,
        metaTitle:       metaTitle       ? String(metaTitle).slice(0, 200)       : null,
        metaDescription: metaDescription ? String(metaDescription).slice(0, 500) : null,
        keywords: Array.isArray(keywords)
          ? keywords.filter((k: unknown) => typeof k === 'string').slice(0, 50)
          : [],
      },
    })

    await prisma.$transaction([
      prisma.howToStep.deleteMany({ where: { guideId: guide.id } }),
      ...(steps.length > 0
        ? [prisma.howToStep.createMany({
            data: steps.map((s: { title: string; description: string; imageUrl?: string }, i: number) => ({
              guideId:      guide.id,
              title:        String(s.title       || '').slice(0, 300),
              description:  String(s.description || '').slice(0, 10000),
              imageUrl:     sanitizeUrl(s.imageUrl),
              displayOrder: i,
              isActive:     true,
            })),
          })]
        : []),

      prisma.howToSection.deleteMany({ where: { guideId: guide.id } }),
      ...(sections.length > 0
        ? [prisma.howToSection.createMany({
            data: sections.map((s: { type: string; title: string; content: string; imageUrl?: string }, i: number) => ({
              guideId:      guide.id,
              type:         (ALLOWED_SECTION_TYPES.has(s.type) ? s.type : 'INFO') as 'TIPS' | 'WARNING' | 'NOTE' | 'INFO',
              title:        String(s.title   || '').slice(0, 300),
              content:      String(s.content || '').slice(0, 10000),
              imageUrl:     sanitizeUrl(s.imageUrl),
              displayOrder: i,
              isActive:     true,
            })),
          })]
        : []),

      prisma.howToFaq.deleteMany({ where: { guideId: guide.id } }),
      ...(faqs.length > 0
        ? [prisma.howToFaq.createMany({
            data: faqs.map((f: { question: string; answer: string }, i: number) => ({
              guideId:      guide.id,
              question:     String(f.question || '').slice(0, 500),
              answer:       String(f.answer   || '').slice(0, 10000),
              displayOrder: i,
              isActive:     true,
            })),
          })]
        : []),

      prisma.howToReference.deleteMany({ where: { guideId: guide.id } }),
      ...(references.length > 0
        ? [prisma.howToReference.createMany({
            data: references.map((r: { refNumber: number; title: string; url: string }) => ({
              guideId:   guide.id,
              refNumber: Math.max(1, Math.floor(Number(r.refNumber) || 1)),
              title:     String(r.title || '').slice(0, 300),
              url:       sanitizeUrl(r.url) ?? '',
            })),
          })]
        : []),
    ])

    const saved = await prisma.howToGuide.findUnique({
      where:   { id: guide.id },
      include: {
        steps:      { orderBy: { displayOrder: 'asc' } },
        sections:   { orderBy: { displayOrder: 'asc' } },
        faqs:       { orderBy: { displayOrder: 'asc' } },
        references: { orderBy: { refNumber:    'asc' } },
      },
    })

    await createAuditLog({
      action:   'UPDATE',
      entity:   'Business',
      entityId: guide.id.toString(),
      changes: {
        businessId,
        businessName:  business.name,
        isPublished:   isNowPublished,
        stepCount:     steps.length,
        sectionCount:  sections.length,
        faqCount:      faqs.length,
        referenceCount:references.length,
      },
      req,
    })

    revalidatePath(`/businesses/${business.slug}/how-to-start`)
    revalidatePath(`/businesses/${business.slug}`)

    // Notify users who have this business in their cart — only on first publish
    if (justPublished) {
      const interestedUsers = await prisma.user.findMany({
        where:  { isActive: true, carts: { some: { businessId } } },
        select: { id: true },
      })

      await Promise.allSettled(
        interestedUsers.map(u =>
          notify({
            userId:  u.id,
            title:   'Startup guide now available',
            message: `The step-by-step guide for ${business.name} is now live. See exactly how to get started.`,
            type:    'SUCCESS',
            link:    `/businesses/${business.slug}/how-to-start`,
          })
        )
      )
    }

    return NextResponse.json({ guide: saved })
  } catch (error) {
    const authResponse = handleAuthError(error)
    if (authResponse) return authResponse
    console.error('PUT how-to-start:', (error as Error).message)
    return NextResponse.json({ error: 'Failed to save guide' }, { status: 500 })
  }
}