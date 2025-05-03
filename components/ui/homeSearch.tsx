'use client'

import { useState, useCallback } from 'react'
import { Input } from '@/components/ui/input'
import { Button } from '@/components/ui/button'
import { useRouter } from 'next/navigation'
import debounce from 'lodash.debounce'

export default function HomeSearch() {
  const [query, setQuery] = useState('')
  const router = useRouter()

  const handleSearch = useCallback(() => {
    if (query.trim()) {
      router.push(`/search?query=${encodeURIComponent(query.trim())}`)
    }
  }, [query, router])

  const debouncedChange = useCallback(
    debounce((value: string) => {
      setQuery(value)
    }, 300),
    []
  )

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    debouncedChange(e.target.value)
  }

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault()
    handleSearch()
  }

  return (
    <form onSubmit={handleSubmit} className="flex flex-col items-center space-y-3 w-full max-w-md mx-auto">
      <Input
        type="text"
        placeholder="Search business..."
        onChange={handleInputChange}
        className="w-full"
      />
      <Button type="submit" className="bg-green-600 hover:bg-green-700 text-white w-full">
        Search
      </Button>
    </form>
  )
}
