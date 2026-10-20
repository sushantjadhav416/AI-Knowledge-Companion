import { useState, useCallback, useRef } from 'react'
import searchService from '../api/searchService'

export function useSemanticSearch() {
  const [results, setResults]   = useState([])
  const [isLoading, setLoading] = useState(false)
  const [error, setError]       = useState(null)
  const [query, setQuery]       = useState('')
  const debounceRef             = useRef(null)

  const search = useCallback(async ({ query: q, topK = 5, minScore = 0.70, documentId }) => {
    if (!q?.trim()) { setResults([]); return }
    setLoading(true)
    setError(null)
    setQuery(q)
    try {
      const res = await searchService.search({ query: q, topK, minScore, documentId })
      setResults(res.data.data ?? [])
    } catch (e) {
      setError(e.response?.data?.message || 'Search failed')
      setResults([])
    } finally {
      setLoading(false)
    }
  }, [])

  const clear = useCallback(() => {
    setResults([])
    setQuery('')
    setError(null)
  }, [])

  return { results, isLoading, error, query, search, clear }
}
