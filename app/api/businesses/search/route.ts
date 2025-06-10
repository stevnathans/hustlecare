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

    if (!keyword) {
      return NextResponse.json({ 
        businesses: [], 
        total: 0,
        message: 'Keyword is required' 
      })
    }

    // Log the search for analytics
    await logSearch(keyword, location, request)

    // Search businesses with Prisma
    const searchConditions = {
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
        {
          requirements: {
            some: {
              name: {
                contains: keyword,
                mode: 'insensitive' as const,
              },
            },
          },
        },
        {
          requirements: {
            some: {
              category: {
                contains: keyword,
                mode: 'insensitive' as const,
              },
            },
          },
        },
      ],
    }

    // Execute search query
    const [businesses, totalCount] = await Promise.all([
      prisma.business.findMany({
        where: searchConditions,
        include: {
          requirements: {
            select: {
              id: true,
              name: true,
              category: true,
            },
          },
        },
        orderBy: [
          {
            name: 'asc',
          },
          {
            createdAt: 'desc',
          },
        ],
        take: limit,
        skip: skip,
      }),
      prisma.business.count({
        where: searchConditions,
      }),
    ])

    // Transform the data to match expected format
    const transformedBusinesses = businesses.map(business => ({
      id: business.id.toString(),
      name: business.name,
      image: business.image,
      slug: business.slug,
      groupedRequirements: groupRequirementsByCategory(business.requirements),
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
  } finally {
    // Don't disconnect here when using singleton
  }
}

// Helper function to log searches for analytics
async function logSearch(keyword: string, location: string | null, request: NextRequest) {
  try {
    // Get IP address and user agent for analytics
    const ipAddress = request.headers.get('x-forwarded-for') || 
                     request.headers.get('x-real-ip') || 
                     'unknown'
    const userAgent = request.headers.get('user-agent') || 'unknown'

    // You might want to get userId from session/auth here
    // const userId = await getUserIdFromSession(request)

    await prisma.searchLog.create({
      data: {
        keyword,
        location,
        ipAddress,
        userAgent,
        // userId, // Add this when you have user authentication
      },
    })
  } catch (error) {
    console.error('Failed to log search:', error)
    // Don't throw error here to avoid breaking the search functionality
  }
}

// Helper function to group requirements by category
function groupRequirementsByCategory(requirements: { id: number; name: string; category: string | null }[]) {
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