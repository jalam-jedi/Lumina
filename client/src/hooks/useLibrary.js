/**
 * useLibrary.js — hook for library data + CRUD
 *
 * Usage:
 *   const { entries, loading, error, addToLibrary, updateEntry, removeEntry } = useLibrary()
 */
import { useState, useEffect, useCallback } from 'react'
import { libraryService } from '../lib/libraryService'
import { useAuth } from '../context/AuthContext'

export function useLibrary(params = {}) {
  const { isAuth } = useAuth()
  const [entries, setEntries] = useState([])
  const [loading, setLoading] = useState(false)
  const [error,   setError]   = useState(null)

  const fetchLibrary = useCallback(async () => {
    if (!isAuth) return
    setLoading(true)
    setError(null)
    try {
      const { entries: data } = await libraryService.getLibrary(params)
      setEntries(data)
    } catch (err) {
      setError(err.response?.data?.error || 'Failed to load library.')
    } finally {
      setLoading(false)
    }
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [isAuth])

  useEffect(() => { fetchLibrary() }, [fetchLibrary])

  const addToLibrary = useCallback(async (snapshot, status, progress) => {
    const { entry } = await libraryService.addEntry(snapshot, status, progress)
    setEntries((prev) => [entry, ...prev])
    return entry
  }, [])

  const updateEntry = useCallback(async (id, data) => {
    const { entry } = await libraryService.updateEntry(id, data)
    setEntries((prev) => prev.map((e) => (e._id === id ? entry : e)))
    return entry
  }, [])

  const removeEntry = useCallback(async (id) => {
    await libraryService.deleteEntry(id)
    setEntries((prev) => prev.filter((e) => e._id !== id))
  }, [])

  return { entries, loading, error, refetch: fetchLibrary, addToLibrary, updateEntry, removeEntry }
}
