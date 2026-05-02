/**
 * useSearch.js — Debounced search hook
 *
 * Usage:
 *   const { query, setQuery, type, setType, results, loading } = useSearch()
 */
import { useState, useEffect, useRef } from 'react'
import { searchService } from '../lib/searchService'

export function useSearch() {
  const [query,   setQuery]   = useState('')
  const [type,    setType]    = useState('all')
  const [results, setResults] = useState([])
  const [loading, setLoading] = useState(false)
  const [error,   setError]   = useState(null)
  const timerRef = useRef(null)

  useEffect(() => {
    if (timerRef.current) clearTimeout(timerRef.current)

    const trimmed = query.trim()
    if (trimmed.length < 2) {
      setResults([])
      setLoading(false)
      return
    }

    setLoading(true)
    setError(null)

    timerRef.current = setTimeout(async () => {
      try {
        const data = await searchService.search(trimmed, type)
        setResults(data.results || [])
      } catch (err) {
        setError(err.response?.data?.error || 'Search failed')
        setResults([])
      } finally {
        setLoading(false)
      }
    }, 300)

    return () => { if (timerRef.current) clearTimeout(timerRef.current) }
  }, [query, type])

  return { query, setQuery, type, setType, results, loading, error }
}
