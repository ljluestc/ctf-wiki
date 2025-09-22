import React, { useState, useEffect } from 'react'
import { useSearchParams } from 'react-router-dom'
import { Search } from 'lucide-react'

const SearchPage: React.FC = () => {
  const [searchParams] = useSearchParams()
  const [query, setQuery] = useState(searchParams.get('q') || '')
  const [results, setResults] = useState([])
  const [isLoading, setIsLoading] = useState(false)

  useEffect(() => {
    const searchQuery = searchParams.get('q')
    if (searchQuery) {
      setQuery(searchQuery)
      // Perform search
      performSearch(searchQuery)
    }
  }, [searchParams])

  const performSearch = async (searchQuery: string) => {
    setIsLoading(true)
    try {
      // TODO: Implement actual search API call
      // const response = await axios.get(`/api/search?q=${encodeURIComponent(searchQuery)}`)
      // setResults(response.data)
      setResults([])
    } catch (error) {
      console.error('Search error:', error)
    } finally {
      setIsLoading(false)
    }
  }

  return (
    <div className="max-w-4xl mx-auto">
      <div className="mb-8">
        <h1 className="text-2xl font-bold text-gray-900 mb-4">Search Results</h1>

        {query && (
          <div className="flex items-center space-x-2 text-gray-600">
            <Search className="h-4 w-4" />
            <span>Results for: "{query}"</span>
          </div>
        )}
      </div>

      {isLoading ? (
        <div className="text-center py-12">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary-600 mx-auto"></div>
          <p className="mt-2 text-gray-600">Searching...</p>
        </div>
      ) : results.length === 0 ? (
        <div className="text-center py-12">
          <Search className="h-12 w-12 text-gray-400 mx-auto mb-4" />
          <h3 className="text-lg font-medium text-gray-900 mb-2">No results found</h3>
          <p className="text-gray-500">Try different keywords or check your spelling.</p>
        </div>
      ) : (
        <div className="space-y-4">
          {/* Search results would go here */}
        </div>
      )}
    </div>
  )
}

export default SearchPage