// app/search/page.tsx
'use client'

import { useState, useEffect } from 'react'
import { useSearchParams } from 'next/navigation'
import BusinessCard from '@/components/business/BusinessCards'
import { SearchIcon, Filter } from 'lucide-react'
import { Input } from '@/components/ui/input'
import { Button } from '@/components/ui/button'

type Business = {
  id: string
  name: string
  image?: string
  slug: string
  groupedRequirements?: Record<string, any[]>
}

export default function SearchPage() {
  const searchParams = useSearchParams()
  const [businesses, setBusinesses] = useState<Business[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [searchTerm, setSearchTerm] = useState(searchParams.get('keyword') || '')
  const [totalResults, setTotalResults] = useState(0)

  const keyword = searchParams.get('keyword') || ''
  const location = searchParams.get('location') || ''

  useEffect(() => {
    const fetchBusinesses = async () => {
      if (!keyword.trim()) {
        setBusinesses([])
        setLoading(false)
        return
      }

      setLoading(true)
      setError(null)

      try {
        const params = new URLSearchParams()
        params.set('keyword', keyword)
        if (location) {
          params.set('location', location)
        }

        const response = await fetch(`/api/businesses/search?${params.toString()}`)
        
        if (!response.ok) {
          throw new Error('Failed to fetch search results')
        }

        const data = await response.json()
        setBusinesses(data.businesses || [])
        setTotalResults(data.total || 0)
      } catch (err) {
        setError(err instanceof Error ? err.message : 'An error occurred')
        setBusinesses([])
      } finally {
        setLoading(false)
      }
    }

    fetchBusinesses()
  }, [keyword, location])

  const handleNewSearch = () => {
    if (searchTerm.trim()) {
      const params = new URLSearchParams()
      params.set('keyword', searchTerm)
      if (location) {
        params.set('location', location)
      }
      window.location.href = `/search?${params.toString()}`
    }
  }

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Search Header */}
      <div className="bg-white shadow-sm border-b">
        <div className="max-w-6xl mx-auto px-4 py-6">
          <div className="flex flex-col sm:flex-row gap-4 items-center justify-between">
            <div className="flex-1 max-w-2xl">
              <div className="flex items-center bg-gray-100 rounded-full px-4 py-2">
                <SearchIcon className="text-gray-500 mr-3" size={20} />
                <Input
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  placeholder="Search for businesses..."
                  className="border-none bg-transparent focus:ring-0 focus-visible:ring-0"
                  onKeyPress={(e) => {
                    if (e.key === 'Enter') {
                      handleNewSearch()
                    }
                  }}
                />
                <Button
                  onClick={handleNewSearch}
                  className="ml-2 bg-green-600 hover:bg-green-700 rounded-full px-6"
                >
                  Search
                </Button>
              </div>
            </div>
            
            {/* Filter Button - Coming Soon */}
            <Button 
              variant="outline" 
              className="flex items-center gap-2"
              onClick={() => alert('Advanced filters coming soon!')}
            >
              <Filter size={16} />
              Filters
            </Button>
          </div>
        </div>
      </div>

      {/* Results Section */}
      <div className="max-w-6xl mx-auto px-4 py-8">
        {/* Results Header */}
        <div className="mb-6">
          <h1 className="text-2xl font-bold text-gray-900 mb-2">
            {keyword ? `Search Results for "${keyword}"` : 'All Businesses'}
          </h1>
          {!loading && (
            <p className="text-gray-600">
              {totalResults === 0 
                ? 'No businesses found' 
                : `${totalResults} business${totalResults === 1 ? '' : 'es'} found`}
              {location && ` in ${location}`}
            </p>
          )}
        </div>

        {/* Loading State */}
        {loading && (
          <div className="flex justify-center items-center py-12">
            <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-green-600"></div>
          </div>
        )}

        {/* Error State */}
        {error && (
          <div className="text-center py-12">
            <div className="bg-red-50 border border-red-200 rounded-lg p-6 max-w-md mx-auto">
              <h3 className="text-red-800 font-semibold mb-2">Error</h3>
              <p className="text-red-600">{error}</p>
              <Button 
                onClick={() => window.location.reload()} 
                className="mt-4 bg-red-600 hover:bg-red-700"
              >
                Try Again
              </Button>
            </div>
          </div>
        )}

        {/* No Results State */}
        {!loading && !error && businesses.length === 0 && keyword && (
          <div className="text-center py-12">
            <div className="bg-gray-100 rounded-lg p-8 max-w-md mx-auto">
              <SearchIcon className="mx-auto h-12 w-12 text-gray-400 mb-4" />
              <h3 className="text-gray-900 font-semibold mb-2">No businesses found</h3>
              <p className="text-gray-600 mb-4">
                We couldn't find any businesses matching "{keyword}".
              </p>
              <div className="text-sm text-gray-500">
                <p>Try:</p>
                <ul className="list-disc list-inside mt-2 space-y-1">
                  <li>Using different keywords</li>
                  <li>Checking your spelling</li>
                  <li>Using more general terms</li>
                </ul>
              </div>
            </div>
          </div>
        )}

        {/* Results Grid */}
        {!loading && !error && businesses.length > 0 && (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
            {businesses.map((business) => (
              <BusinessCard
                key={business.id}
                id={business.id}
                name={business.name}
                image={business.image}
                slug={business.slug}
                groupedRequirements={business.groupedRequirements}
              />
            ))}
          </div>
        )}

        {/* Load More Button - For pagination if needed */}
        {!loading && !error && businesses.length > 0 && businesses.length < totalResults && (
          <div className="text-center mt-12">
            <Button 
              variant="outline" 
              className="px-8 py-3"
              onClick={() => alert('Pagination coming soon!')}
            >
              Load More Results
            </Button>
          </div>
        )}
      </div>
    </div>
  )
}