// app/api/businesses/search/route.ts
import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url)
    const keyword = searchParams.get('keyword')
    const location = searchParams.get('location')
    const page = parseInt(searchParams.get('page') || '1')
    const limit = parseInt(searchParams.get('limit') || '12')
    const skip = (page - 1) * limit

    // Typeahead/live-search widgets (e.g. the header search bar) pass
    // suggest=1 so every keystroke pause doesn't write a SearchLog row —
    // only an explicit, completed search (Enter / suggestion click, which
    // navigates to the full /search results page) should be logged.
    // Without this split, live search suggestions polluted SearchLog with
    // every partial fragment typed ("sa", "sal", "salo", "salon"), which
    // also skewed /api/businesses/popular's "most searched" ranking toward
    // fragments instead of real completed searches.
    const suggestOnly = searchParams.get('suggest') === '1'

    if (!keyword) {
      return NextResponse.json({ 
        businesses: [], 
        total: 0,
        message: 'Keyword is required' 
      })
    }

    // Log the search for analytics — skipped for suggest-only calls
    if (!suggestOnly) {
      await logSearch(keyword, location, request)
    }

    // Requirements are now in RequirementTemplate, linked via BusinessRequirement.
    // To search by requirement name/category we go:
    //   Business.requirements (BusinessRequirement) → template (RequirementTemplate)
    const searchConditions = {
      published: true,
      OR: [
        {
          name: {
            contains: keyword,
            mode: 'insensitive' as const,
          },
        },
        {
          description: {
            contains: keyword,
            mode: 'insensitive' as const,
          },
        },
        // Search through linked requirement templates by name
        {
          requirements: {
            some: {
              isActive: true,
              template: {
                isDeprecated: false,
                name: {
                  contains: keyword,
                  mode: 'insensitive' as const,
                },
              },
            },
          },
        },
        // Search through linked requirement templates by category
        {
          requirements: {
            some: {
              isActive: true,
              template: {
                isDeprecated: false,
                category: {
                  contains: keyword,
                  mode: 'insensitive' as const,
                },
              },
            },
          },
        },
      ],
    }

    // Suggest-only calls (typeahead) only need id/name/slug for a dropdown —
    // skip the groupedRequirements include entirely rather than fetching and
    // discarding it. The full search results page still gets the complete
    // shape below.
    if (suggestOnly) {
      const businesses = await prisma.business.findMany({
        where: searchConditions,
        select: {
          id: true,
          name: true,
          slug: true,
        },
        orderBy: [
          { name: 'asc' },
          { createdAt: 'desc' },
        ],
        take: Math.min(limit, 8),
      })

      return NextResponse.json({
        businesses: businesses.map(b => ({
          id: b.id.toString(),
          name: b.name,
          slug: b.slug,
        })),
        total: businesses.length,
        success: true,
      })
    }

    // Execute search query
    const [businesses, totalCount] = await Promise.all([
      prisma.business.findMany({
        where: searchConditions,
        include: {
          // Include the link + template so we can group by category in the response
          requirements: {
            where: {
              isActive: true,
              template: { isDeprecated: false },
            },
            include: {
              template: {
                select: {
                  id: true,
                  name: true,
                  category: true,
                },
              },
            },
            orderBy: [{ displayOrder: 'asc' }, { createdAt: 'asc' }],
          },
        },
        orderBy: [
          { name: 'asc' },
          { createdAt: 'desc' },
        ],
        take: limit,
        skip,
      }),
      prisma.business.count({
        where: searchConditions,
      }),
    ])

    // Transform the data to match expected format.
    // groupedRequirements shape is unchanged — callers get the same structure as before.
    const transformedBusinesses = businesses.map(business => ({
      id: business.id.toString(),
      name: business.name,
      image: business.image,
      slug: business.slug,
      groupedRequirements: groupRequirementsByCategory(
        business.requirements.map(link => ({
          id: link.id,
          name: link.template.name,
          category: link.template.category,
        }))
      ),
    }))

    return NextResponse.json({
      businesses: transformedBusinesses,
      total: totalCount,
      page,
      limit,
      totalPages: Math.ceil(totalCount / limit),
      success: true,
    })
  } catch (error) {
    console.error('Search error:', error)
    return NextResponse.json(
      { error: 'Failed to search businesses' },
      { status: 500 }
    )
  }
}

// Helper: log searches for analytics
async function logSearch(keyword: string, location: string | null, request: NextRequest) {
  try {
    const ipAddress = request.headers.get('x-forwarded-for') || 
                      request.headers.get('x-real-ip') || 
                      'unknown'
    const userAgent = request.headers.get('user-agent') || 'unknown'

    await prisma.searchLog.create({
      data: {
        keyword,
        location,
        ipAddress,
        userAgent,
      },
    })
  } catch (error) {
    console.error('Failed to log search:', error)
    // Don't throw — a logging failure should never break search
  }
}

// Helper: group a flat list of requirements by category
function groupRequirementsByCategory(
  requirements: { id: number; name: string; category: string }[]
) {
  return requirements.reduce((acc, req) => {
    const category = req.category || 'General'
    if (!acc[category]) {
      acc[category] = []
    }
    acc[category].push({
      id: req.id.toString(),
      name: req.name,
    })
    return acc
  }, {} as Record<string, { id: string; name: string }[]>)
}