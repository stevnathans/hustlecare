"use client"

import { useState, useRef, useEffect } from "react"
import { Input } from "@/components/ui/input"
import { Button } from "@/components/ui/button"
import { MapPin, Search as SearchIcon, ChevronDown } from "lucide-react"
import Image from "next/image"
import { useRouter } from "next/navigation"

const locations = ["Nairobi", "Mombasa", "Kisumu", "Eldoret", "Nakuru"]

const popularSearches = ["poultry", "gym", "salon", "barbershop", "spa"]

export default function HomeSearch() {
  const router = useRouter()
  const [search, setSearch] = useState("")
  const [location, setLocation] = useState("")
  const [locationQuery, setLocationQuery] = useState("")
  const [showLocationDropdown, setShowLocationDropdown] = useState(false)
  const dropdownRef = useRef<HTMLDivElement>(null)

  const filteredLocations = locations.filter((loc) =>
    loc.toLowerCase().includes(locationQuery.toLowerCase())
  )

  const handleSearch = (keyword: string, loc: string) => {
    let query = `/search?keyword=${encodeURIComponent(keyword)}`
    if (loc) {
      query += `&location=${encodeURIComponent(loc)}`
    }
    router.push(query)
  }

  // Close dropdown if clicked outside
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target as Node)) {
        setShowLocationDropdown(false)
      }
    }
    document.addEventListener("mousedown", handleClickOutside)
    return () => {
      document.removeEventListener("mousedown", handleClickOutside)
    }
  }, [])

  return (
    <section className="bg-green-700 text-white w-full py-10 px-4">
      <div className="max-w-6xl mx-auto flex flex-col md:flex-row items-center gap-10">
        {/* Left Section */}
        <div className="flex-1 w-full">
          <h1 className="text-3xl md:text-4xl font-bold mb-6">
            Start your <span className="italic underline decoration-yellow-400">dream</span> business now
          </h1>

          {/* Search + Location Box */}
          <div className="bg-white rounded-full flex flex-col sm:flex-row items-center p-2 shadow-md w-full max-w-xl text-black relative">
            {/* Search Input */}
            <div className="flex items-center w-full sm:w-1/2 px-3 border-b sm:border-b-0 sm:border-r border-gray-200">
              <SearchIcon className="mr-2 text-gray-500" />
              <Input
                className="border-none focus:ring-0 focus-visible:ring-0"
                placeholder="Search business..."
                value={search}
                onChange={(e) => setSearch(e.target.value)}
              />
            </div>

            {/* Location Dropdown with Search */}
            <div className="flex items-center w-full sm:w-1/2 px-3 mt-2 sm:mt-0 relative" ref={dropdownRef}>
              <MapPin className="mr-2 text-gray-500" />
              <button
                onClick={() => setShowLocationDropdown(!showLocationDropdown)}
                className="flex justify-between items-center w-full bg-transparent outline-none text-left"
              >
                <span>{location || "All Locations"}</span>
                <ChevronDown className="ml-2 h-4 w-4" />
              </button>

              {showLocationDropdown && (
                <div className="absolute top-12 left-0 bg-white text-black rounded-md shadow-lg w-full z-10">
                  <div className="p-2">
                    <Input
                      placeholder="Search location..."
                      className="border border-gray-300 focus:ring-0 focus-visible:ring-0"
                      value={locationQuery}
                      onChange={(e) => setLocationQuery(e.target.value)}
                    />
                  </div>

                  {/* Clear Location Button */}
                  {location && (
                    <button
                      onClick={() => {
                        setLocation("")
                        setShowLocationDropdown(false)
                        setLocationQuery("")
                      }}
                      className="w-full text-left px-4 py-2 text-red-500 hover:bg-gray-100 font-semibold"
                    >
                      Clear Location
                    </button>
                  )}

                  <ul className="max-h-48 overflow-y-auto">
                    {filteredLocations.length > 0 ? (
                      filteredLocations.map((loc) => (
                        <li
                          key={loc}
                          onClick={() => {
                            setLocation(loc)
                            setShowLocationDropdown(false)
                            setLocationQuery("")
                          }}
                          className="p-2 hover:bg-gray-100 cursor-pointer"
                        >
                          {loc}
                        </li>
                      ))
                    ) : (
                      <li className="p-2 text-gray-400">No results</li>
                    )}
                  </ul>
                </div>
              )}
            </div>

            {/* Search Button */}
            <Button
              onClick={() => handleSearch(search, location)}
              className="mt-2 sm:mt-0 sm:ml-4 bg-green-600 hover:bg-green-500 text-white rounded-full px-6 whitespace-nowrap"
            >
              Search
            </Button>
          </div>

          {/* Popular Searches */}
          <p className="mt-6 text-sm flex flex-wrap gap-2">
            Popular Searches:{" "}
            {popularSearches.map((item, index) => (
              <button
                key={index}
                onClick={() => handleSearch(item, location)}
                className="font-semibold underline decoration-yellow-400 capitalize hover:text-yellow-300 transition"
              >
                {item}
              </button>
            ))}
          </p>
        </div>

        {/* Right Section */}
        <div className="flex-1 hidden md:flex justify-center">
          <Image
            src="/images/search.png"
            alt="Illustration"
            width={400}
            height={400}
            className="object-contain"
          />
        </div>
      </div>
    </section>
  )
}
