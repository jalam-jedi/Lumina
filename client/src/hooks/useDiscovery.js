/**
 * useDiscovery.js — hook for external + platform trending data
 *
 * Usage:
 *   const { tmdbTrending, topAnime, platformTrending, loading, error } = useDiscovery()
 */
import { useState, useEffect } from 'react'
import { discoveryService } from '../lib/discoveryService'

export function useDiscovery() {
  const [tmdbTrending,     setTmdbTrending]     = useState([])
  const [topAnime,         setTopAnime]         = useState([])
  const [platformTrending, setPlatformTrending] = useState([])
  const [loading, setLoading] = useState(true)
  const [error,   setError]   = useState(null)

  useEffect(() => {
    setLoading(true)
    Promise.all([
      discoveryService.getExternalTrending().catch(() => null),
      discoveryService.getPlatformTrending().catch(() => null),
    ]).then(([external, platform]) => {
      if (external) {
        setTmdbTrending(external.tmdbTrending || [])
        setTopAnime(external.topAnime || [])
      }
      if (platform) setPlatformTrending(platform.trending || [])
    }).catch((err) => {
      setError(err.response?.data?.error || 'Failed to load discovery data.')
    }).finally(() => setLoading(false))
  }, [])

  return { tmdbTrending, topAnime, platformTrending, loading, error }
}
