// app/api/admin/businesses/route.ts
import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'
import { requirePermission, createAuditLog } from '@/lib/admin-utils'
import { notify } from '@/lib/notify'

const ALLOWED_UPDATE_FIELDS = new Set([
  'name', 'slug', 'description', 'image', 'published',
  'profitPotential', 'skillLevel', 'bestLocations',
  'costMin', 'costMax', 'timeToLaunchMin', 'timeToLaunchMax',
])

// Safety cap for the admin list — this route intentionally returns the
// full table (unpaginated) so the admin UI can search/filter/sort
// client-side over the whole catalog, which is fine at moderate scale.
// This cap just prevents an unbounded query if the business table grows
// far beyond what the admin table view can usefully display anyway. If
// you're hitting this cap, it's time to add real server-side pagination
// to both this route and app/admin/businesses/page.tsx.
const ADMIN_LIST_CAP = 500

function isValidSlug(slug: string): boolean {
  return /^[a-z0-9]+(?:-[a-z0-9]+)*$/.test(slug)
}

function toPositiveInt(value: unknown): number | null {
  if (value === undefined || value === null || value === '') return null
  const n = Number(value)
  if (!Number.isFinite(n) || n < 0) return null
  return Math.floor(n)
}

async function resolveCategoryId(categoryName?: string): Promise<number | undefined> {
  if (!categoryName || !categoryName.trim()) return undefined
  const trimmedName = categoryName.trim().slice(0, 100)
  const slug = trimmedName.toLowerCase().replace(/\s+/g, '-')
  const category = await prisma.businessCategory.upsert({
    where:  { name: trimmedName },
    update: {},
    create: { name: trimmedName, slug },
  })
  return category.id
}

function handleAuthError(error: unknown): NextResponse | null {
  if (error instanceof Error) {
    if (error.message === 'Unauthorized') return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    if (error.message === 'Forbidden')    return NextResponse.json({ error: 'Forbidden' },    { status: 403 })
  }
  return null
}

export async function GET() {
  try {
    await requirePermission('businesses.view')

    const businesses = await prisma.business.findMany({
      include: {
        _count: { select: { requirements: true, carts: true, searches: true } },
        user:   { select: { name: true, email: true } },
        category: true,
      },
      orderBy: { createdAt: 'desc' },
      take: ADMIN_LIST_CAP,
    })

    return NextResponse.json(businesses)
  } catch (error) {
    const authResponse = handleAuthError(error)
    if (authResponse) return authResponse
    console.error('Error fetching businesses:', (error as Error).message)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}

export async function POST(req: NextRequest) {
  try {
    const user = await requirePermission('businesses.create')
    const body = await req.json()
    const {
      name, slug, description, image, published = true,
      categoryName,
      costMin, costMax,
      timeToLaunchMin, timeToLaunchMax,
      profitPotential, skillLevel,
      bestLocations,
    } = body

    if (!name || typeof name !== 'string' || name.trim().length === 0) {
      return NextResponse.json({ error: 'Name is required' }, { status: 400 })
    }
    if (!slug || typeof slug !== 'string') {
      return NextResponse.json({ error: 'Slug is required' }, { status: 400 })
    }
    if (!isValidSlug(slug)) {
      return NextResponse.json(
        { error: 'Slug must be lowercase letters, numbers, and hyphens only' },
        { status: 400 }
      )
    }
    if (name.trim().length > 200) {
      return NextResponse.json({ error: 'Name must be 200 characters or fewer' }, { status: 400 })
    }
    if (slug.length > 200) {
      return NextResponse.json({ error: 'Slug must be 200 characters or fewer' }, { status: 400 })
    }

    const existingBusiness = await prisma.business.findUnique({ where: { slug } })
    if (existingBusiness) {
      return NextResponse.json({ error: 'A business with this slug already exists' }, { status: 409 })
    }

    const categoryId = await resolveCategoryId(categoryName)

    const business = await prisma.business.create({
      data: {
        name:        name.trim(),
        slug,
        description: description ? String(description).slice(0, 5000) : null,
        image:       image       ? String(image)                       : null,
        published:   Boolean(published),
        userId:      user.id,
        ...(categoryId ? { categoryId } : {}),
        costMin:         toPositiveInt(costMin),
        costMax:         toPositiveInt(costMax),
        timeToLaunchMin: toPositiveInt(timeToLaunchMin),
        timeToLaunchMax: toPositiveInt(timeToLaunchMax),
        profitPotential: profitPotential ? String(profitPotential).slice(0, 100) : null,
        skillLevel:      skillLevel      ? String(skillLevel).slice(0, 100)      : null,
        bestLocations: Array.isArray(bestLocations)
          ? bestLocations.filter((l: unknown) => typeof l === 'string' && l.trim()).slice(0, 50)
          : typeof bestLocations === 'string'
            ? bestLocations.split(',').map((s: string) => s.trim()).filter(Boolean).slice(0, 50)
            : [],
      },
      include: {
        _count:   { select: { requirements: true } },
        category: true,
      },
    })

    const globalTemplates = await prisma.requirementTemplate.findMany({
      where:  { isGlobal: true, isDeprecated: false },
      select: { id: true },
    })

    if (globalTemplates.length > 0) {
      await prisma.businessRequirement.createMany({
        data: globalTemplates.map(t => ({
          businessId: business.id,
          templateId: t.id,
          source:     'global',
        })),
        skipDuplicates: true,
      })
    }

    await createAuditLog({
      action:   'CREATE',
      entity:   'Business',
      entityId: business.id.toString(),
      changes: {
        created: {
          name:                     business.name,
          slug:                     business.slug,
          published:                business.published,
          category:                 business.category?.name ?? null,
          globalRequirementsLinked: globalTemplates.length,
        },
      },
      req,
    })

    // Notify users who have carts in businesses of the same category
    if (business.published && business.categoryId) {
      const interestedUsers = await prisma.user.findMany({
        where: {
          isActive: true,
          carts: {
            some: {
              business: { categoryId: business.categoryId },
            },
          },
          NOT: { id: user.id },
        },
        select: { id: true },
      })

      await Promise.allSettled(
        interestedUsers.map(u =>
          notify({
            userId:  u.id,
            title:   'New business idea added',
            message: `${business.name} has been added to Hustlecare${business.category ? ` in ${business.category.name}` : ''}.`,
            type:    'INFO',
            link:    `/businesses/${business.slug}`,
          })
        )
      )
    }

    return NextResponse.json(business, { status: 201 })
  } catch (error) {
    const authResponse = handleAuthError(error)
    if (authResponse) return authResponse
    console.error('Error creating business:', (error as Error).message)
    return NextResponse.json({ error: 'Failed to create business' }, { status: 500 })
  }
}

export async function PATCH(req: NextRequest) {
  try {
    await requirePermission('businesses.update')
    const body = await req.json()
    const {
      id, categoryName,
      costMin, costMax,
      timeToLaunchMin, timeToLaunchMax,
      profitPotential, skillLevel,
      bestLocations,
      ...rest
    } = body

    if (!id) {
      return NextResponse.json({ error: 'Business ID is required' }, { status: 400 })
    }

    const updateData: Record<string, unknown> = {}
    for (const key of Object.keys(rest)) {
      if (ALLOWED_UPDATE_FIELDS.has(key)) {
        updateData[key] = rest[key]
      }
    }

    if (updateData.slug && !isValidSlug(String(updateData.slug))) {
      return NextResponse.json(
        { error: 'Slug must be lowercase letters, numbers, and hyphens only' },
        { status: 400 }
      )
    }

    const oldBusiness = await prisma.business.findUnique({
      where:   { id: Number(id) },
      include: { category: true },
    })

    if (!oldBusiness) {
      return NextResponse.json({ error: 'Business not found' }, { status: 404 })
    }

    if (updateData.slug && updateData.slug !== oldBusiness.slug) {
      const slugExists = await prisma.business.findUnique({ where: { slug: String(updateData.slug) } })
      if (slugExists) {
        return NextResponse.json({ error: 'A business with this slug already exists' }, { status: 409 })
      }
    }

    let categoryUpdate: { categoryId?: number | null } = {}
    if (categoryName !== undefined) {
      categoryUpdate = !categoryName?.trim()
        ? { categoryId: null }
        : { categoryId: await resolveCategoryId(categoryName) }
    }

    const metaUpdate: Record<string, unknown> = {}
    if (costMin         !== undefined) metaUpdate.costMin         = toPositiveInt(costMin)
    if (costMax         !== undefined) metaUpdate.costMax         = toPositiveInt(costMax)
    if (timeToLaunchMin !== undefined) metaUpdate.timeToLaunchMin = toPositiveInt(timeToLaunchMin)
    if (timeToLaunchMax !== undefined) metaUpdate.timeToLaunchMax = toPositiveInt(timeToLaunchMax)
    if (profitPotential !== undefined) metaUpdate.profitPotential = profitPotential ? String(profitPotential).slice(0, 100) : null
    if (skillLevel      !== undefined) metaUpdate.skillLevel      = skillLevel      ? String(skillLevel).slice(0, 100)      : null
    if (bestLocations   !== undefined) {
      metaUpdate.bestLocations = Array.isArray(bestLocations)
        ? bestLocations.filter((l: unknown) => typeof l === 'string' && l.trim()).slice(0, 50)
        : typeof bestLocations === 'string'
          ? bestLocations.split(',').map((s: string) => s.trim()).filter(Boolean).slice(0, 50)
          : []
    }

    const business = await prisma.business.update({
      where: { id: Number(id) },
      data:  { ...updateData, ...categoryUpdate, ...metaUpdate },
      include: {
        _count:   { select: { requirements: true } },
        category: true,
      },
    })

    const changes: Record<string, { old: unknown; new: unknown }> = {}
    for (const key in updateData) {
      if (oldBusiness[key as keyof typeof oldBusiness] !== updateData[key]) {
        changes[key] = { old: oldBusiness[key as keyof typeof oldBusiness], new: updateData[key] }
      }
    }
    for (const key in metaUpdate) {
      if (oldBusiness[key as keyof typeof oldBusiness] !== metaUpdate[key]) {
        changes[key] = { old: oldBusiness[key as keyof typeof oldBusiness], new: metaUpdate[key] }
      }
    }
    if (categoryName !== undefined && oldBusiness.category?.name !== categoryName) {
      changes['category'] = { old: oldBusiness.category?.name ?? null, new: categoryName || null }
    }

    await createAuditLog({
      action:   'UPDATE',
      entity:   'Business',
      entityId: id.toString(),
      changes,
      req,
    })

    return NextResponse.json(business)
  } catch (error) {
    const authResponse = handleAuthError(error)
    if (authResponse) return authResponse
    console.error('Error updating business:', (error as Error).message)
    return NextResponse.json({ error: 'Failed to update business' }, { status: 500 })
  }
}

export async function DELETE(req: NextRequest) {
  try {
    await requirePermission('businesses.delete')
    const body = await req.json()
    const { id } = body

    if (!id) {
      return NextResponse.json({ error: 'Business ID is required' }, { status: 400 })
    }

    const business = await prisma.business.findUnique({
      where:   { id: Number(id) },
      include: { _count: { select: { requirements: true, carts: true } } },
    })

    if (!business) {
      return NextResponse.json({ error: 'Business not found' }, { status: 404 })
    }

    if (business._count.requirements > 0) {
      return NextResponse.json(
        { error: `This business has ${business._count.requirements} linked requirement(s). Remove them first.` },
        { status: 400 }
      )
    }

    if (business._count.carts > 0) {
      return NextResponse.json(
        { error: `Cannot delete business with ${business._count.carts} active cart(s).` },
        { status: 400 }
      )
    }

    await prisma.business.delete({ where: { id: Number(id) } })

    await createAuditLog({
      action:   'DELETE',
      entity:   'Business',
      entityId: id.toString(),
      changes:  { deleted: { name: business.name, slug: business.slug } },
      req,
    })

    return NextResponse.json({ message: 'Business deleted successfully' })
  } catch (error) {
    const authResponse = handleAuthError(error)
    if (authResponse) return authResponse
    console.error('Error deleting business:', (error as Error).message)
    return NextResponse.json({ error: 'Failed to delete business' }, { status: 500 })
  }
}