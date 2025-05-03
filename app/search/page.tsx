"use client"

import { useSearchParams } from "next/navigation"
import { useEffect, useState } from "react"
import { Input } from "@/components/ui/input"
import { Button } from "@/components/ui/button"
import { Loader2 } from "lucide-react"

export default function SearchPage() {
  const searchParams = useSearchParams()
  const keyword = searchParams.get("keyword") || ""
  const location = searchParams.get("location") || ""

  const [results, setResults] = useState<any[]>([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    const fetchResults = async () => {
      setLoading(true)

      // Simulate fetching data (replace with your real API call later)
      await new Promise((resolve) => setTimeout(resolve, 1000))

      // Example fake results (normally you'd call an API using the keyword and location)
      const fakeResults = [
        { name: "Salon Deluxe", location: "Nairobi" },
        { name: "Poultry Farm Pro", location: "Mombasa" },
        { name: "Elite Gym", location: "Nakuru" },
      ]

      const filtered = fakeResults.filter((item) => {
        const matchKeyword = item.name.toLowerCase().includes(keyword.toLowerCase())
        const matchLocation = location ? item.location.toLowerCase() === location.toLowerCase() : true
        return matchKeyword && matchLocation
      })

      setResults(filtered)
      setLoading(false)
    }

    fetchResults()
  }, [keyword, location])

  return (
    <div className="max-w-6xl mx-auto px-4 py-10">
      <h1 className="text-2xl font-bold mb-6">
        Search Results for <span className="italic text-green-600">{keyword}</span>
        {location && (
          <>
            {" "}
            in <span className="italic text-green-600">{location}</span>
          </>
        )}
      </h1>

      {loading ? (
        <div className="flex justify-center items-center h-40">
          <Loader2 className="animate-spin h-8 w-8 text-green-600" />
        </div>
      ) : results.length === 0 ? (
        <div className="text-center text-gray-500">
          No businesses found. Try a different search.
        </div>
      ) : (
        <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-6">
          {results.map((item, index) => (
            <div
              key={index}
              className="border rounded-lg p-4 shadow hover:shadow-lg transition"
            >
              <h2 className="text-lg font-semibold">{item.name}</h2>
              <p className="text-sm text-gray-500">{item.location}</p>
              <Button className="mt-4 bg-green-600 hover:bg-green-500 text-white rounded-full px-4 py-2">
                View Details
              </Button>
            </div>
          ))}
        </div>
      )}
    </div>
  )
}
