/**
 * SearchOverlay.jsx — Full-screen Netflix/HBO-style search overlay
 *
 * - Slides down from top with backdrop blur
 * - Auto-focuses the search input
 * - Type filter chips (All, Movies, TV Shows, Anime, Manga, Books)
 * - Debounced results grid using poster-card design
 * - Recent searches (localStorage) shown when input is empty
 * - Click a result → opens MediaModal
 */
import { useState, useEffect, useRef, useMemo } from 'react'
import { useNavigate } from 'react-router-dom'
import { useSearch }  from '../hooks/useSearch'
import { useLibrary } from '../hooks/useLibrary'
import { useAuth }    from '../context/AuthContext'
import MediaModal     from './MediaModal'

const TYPE_FILTERS = [
  { value: 'all',    label: 'All'       },
  { value: 'movie',  label: 'Movies'    },
  { value: 'tvshow', label: 'TV Shows'  },
  { value: 'anime',  label: 'Anime'     },
  { value: 'manga',  label: 'Manga'     },
  { value: 'book',   label: 'Books'     },
]

const TYPE_EMOJI = {
  movie: '🎬', tvshow: '📺', anime: '⛩️', manga: '📖', book: '📚',
}

const RECENT_KEY = 'lumina_recent_searches'
const MAX_RECENT = 8

function getRecentSearches() {
  try { return JSON.parse(localStorage.getItem(RECENT_KEY)) || [] }
  catch { return [] }
}
function saveRecentSearch(q) {
  const recent = getRecentSearches().filter((r) => r !== q)
  recent.unshift(q)
  localStorage.setItem(RECENT_KEY, JSON.stringify(recent.slice(0, MAX_RECENT)))
}
function clearRecentSearches() {
  localStorage.removeItem(RECENT_KEY)
}

// ── Extracted search result card so useState works properly ──────
function SearchResultCard({ item, inLib, onClick }) {
  const [imgErr, setImgErr] = useState(false)
  return (
    <div className="poster-card" style={{ position: 'relative' }} onClick={onClick}>
      {item.coverImage && !imgErr ? (
        <img
          src={item.coverImage}
          alt={item.title}
          className="poster-thumb"
          loading="lazy"
          style={{ objectFit: 'cover', fontSize: 0 }}
          onError={() => setImgErr(true)}
        />
      ) : (
        <div className="poster-thumb" style={{ background: 'var(--surface-high)', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '2rem' }}>
          {TYPE_EMOJI[item.type] || '🎬'}
        </div>
      )}
      {inLib && (
        <div className="poster-add-btn" style={{ opacity: 1 }}>
          <span className="nav-icon" style={{ fontSize: '1rem', color: '#34d399' }}>check</span>
        </div>
      )}
      <div className="poster-info">
        <p className="poster-title">{item.title}</p>
        <p className="poster-genre">
          {TYPE_EMOJI[item.type]} {item.score ? `★ ${item.score.toFixed(1)}` : item.year || ''}
        </p>
      </div>
    </div>
  )
}

export default function SearchOverlay({ onClose }) {
  const navigate = useNavigate()
  const { query, setQuery, type, setType, results, loading } = useSearch()
  const { entries, addToLibrary, removeEntry, updateEntry } = useLibrary()
  const { isAuth } = useAuth()
  const inputRef = useRef(null)
  const [recentSearches, setRecentSearches] = useState(getRecentSearches)
  const [selectedItem, setSelectedItem] = useState(null)

  // Navigate to full search results page on Enter
  const handleEnterSearch = (e) => {
    if (e.key === 'Enter' && query.trim().length >= 2) {
      const params = new URLSearchParams({ q: query.trim() })
      if (type !== 'all') params.set('type', type)
      onClose()
      navigate(`/search?${params.toString()}`)
    }
  }

  // Auto-focus input on mount
  useEffect(() => {
    const t = setTimeout(() => inputRef.current?.focus(), 100)
    return () => clearTimeout(t)
  }, [])

  // Save successful searches to recent
  useEffect(() => {
    if (results.length > 0 && query.trim().length >= 2) {
      saveRecentSearch(query.trim())
      setRecentSearches(getRecentSearches())
    }
  }, [results]) // eslint-disable-line react-hooks/exhaustive-deps

  // Prevent body scroll while overlay is open
  useEffect(() => {
    document.body.style.overflow = 'hidden'
    return () => { document.body.style.overflow = '' }
  }, [])

  // Close on Escape
  useEffect(() => {
    const handler = (e) => { if (e.key === 'Escape') onClose() }
    window.addEventListener('keydown', handler)
    return () => window.removeEventListener('keydown', handler)
  }, [onClose])

  // Library lookup
  const libraryIds = useMemo(() => {
    const s = new Set()
    entries.forEach((e) => {
      if (e.mediaSnapshot) s.add(`${e.mediaSnapshot.source}:${e.mediaSnapshot.externalId}`)
    })
    return s
  }, [entries])

  const getEntry = (item) =>
    entries.find((e) =>
      e.mediaSnapshot?.source === item.source &&
      e.mediaSnapshot?.externalId === item.externalId
    )

  // Handlers
  const handleAdd = async (item, status) => {
    if (!isAuth) return
    const isEpisodic = ['anime', 'tvshow', 'manga'].includes(item.type)
    const totalEps = item.metadata?.episodes ?? null
    return await addToLibrary({
      externalId: item.externalId,
      source:     item.source,
      type:       item.type,
      title:      item.title,
      coverImage: item.coverImage,
    }, status, isEpisodic && totalEps ? { current: 0, total: totalEps, unit: item.type === 'manga' ? 'chapters' : 'episodes' } : null)
  }

  const handleRemove = async (item) => {
    const entry = getEntry(item)
    if (entry) await removeEntry(entry._id)
  }

  const handleUpdate = async (id, data) => {
    await updateEntry(id, data)
  }

  const handleRecentClick = (q) => {
    setQuery(q)
  }

  const handleClearRecent = () => {
    clearRecentSearches()
    setRecentSearches([])
  }

  const modalEntry     = selectedItem ? getEntry(selectedItem) : null
  const modalInLibrary = selectedItem ? libraryIds.has(`${selectedItem.source}:${selectedItem.externalId}`) : false

  const showRecent = query.trim().length < 2 && recentSearches.length > 0
  const showEmpty  = query.trim().length >= 2 && !loading && results.length === 0

  return (
    <>
      <div className="search-overlay" onClick={onClose}>
        <div className="search-overlay-content" onClick={(e) => e.stopPropagation()}>
          {/* Search header */}
          <div className="search-header">
            <div className="search-input-wrap">
              <span className="nav-icon search-input-icon">search</span>
              <input
                ref={inputRef}
                className="search-input"
                type="text"
                placeholder="Search movies, shows, anime..."
                value={query}
                onChange={(e) => setQuery(e.target.value)}
                onKeyDown={handleEnterSearch}
                autoComplete="off"
                spellCheck={false}
              />
              {query && (
                <button className="search-clear-btn" onClick={() => setQuery('')}>
                  <span className="nav-icon" style={{ fontSize: '1.1rem' }}>close</span>
                </button>
              )}
            </div>

            <button className="search-close-btn" onClick={onClose}>
              <span className="nav-icon">close</span>
            </button>
          </div>

          {/* Type filter chips */}
          <div className="search-filters">
            {TYPE_FILTERS.map((f) => (
              <button
                key={f.value}
                className={`chip ${type === f.value ? 'chip-active' : 'chip-inactive'}`}
                onClick={() => setType(f.value)}
              >
                {f.label}
              </button>
            ))}
          </div>

          {/* Recent searches */}
          {showRecent && (
            <div className="search-recent">
              <div className="search-recent-header">
                <span className="label-sm muted">Recent Searches</span>
                <button className="search-recent-clear" onClick={handleClearRecent}>Clear</button>
              </div>
              <div className="search-recent-list">
                {recentSearches.map((r, i) => (
                  <button key={i} className="search-recent-pill" onClick={() => handleRecentClick(r)}>
                    <span className="nav-icon" style={{ fontSize: '0.85rem' }}>history</span>
                    {r}
                  </button>
                ))}
              </div>
            </div>
          )}

          {/* Loading skeleton */}
          {loading && (
            <div className="search-results-grid">
              {Array.from({ length: 8 }).map((_, i) => (
                <div key={i} className="poster-card">
                  <div className="poster-thumb skeleton-shimmer" />
                  <div style={{ padding: '0.5rem 0.25rem' }}>
                    <div className="skeleton-shimmer" style={{ height: '0.75rem', borderRadius: '0.25rem', marginBottom: '0.4rem' }} />
                    <div className="skeleton-shimmer" style={{ height: '0.6rem', borderRadius: '0.25rem', width: '60%' }} />
                  </div>
                </div>
              ))}
            </div>
          )}

          {/* Results grid */}
          {!loading && results.length > 0 && (
            <div className="search-results-grid">
              {results.map((item) => (
                <SearchResultCard
                  key={`${item.source}-${item.externalId}`}
                  item={item}
                  inLib={libraryIds.has(`${item.source}:${item.externalId}`)}
                  onClick={() => setSelectedItem(item)}
                />
              ))}
            </div>
          )}

          {/* Empty state */}
          {showEmpty && (
            <div className="search-empty">
              <div style={{ fontSize: '3rem', marginBottom: '0.75rem' }}>🔍</div>
              <p style={{ fontWeight: 600 }}>No results found</p>
              <p className="muted" style={{ fontSize: '0.85rem' }}>Try a different search term or filter</p>
            </div>
          )}

          {/* Initial state (no query) */}
          {query.trim().length < 2 && !showRecent && (
            <div className="search-empty">
              <div style={{ fontSize: '3rem', marginBottom: '0.75rem' }}>🎬</div>
              <p style={{ fontWeight: 600 }}>Discover something new</p>
              <p className="muted" style={{ fontSize: '0.85rem' }}>Search for movies, shows, anime, manga, and books</p>
            </div>
          )}
        </div>
      </div>

      {/* Media modal — renders on top of search overlay */}
      {selectedItem && (
        <MediaModal
          item={selectedItem}
          entryId={modalEntry?._id}
          onClose={() => setSelectedItem(null)}
          onAdd={handleAdd}
          onRemove={handleRemove}
          onUpdate={handleUpdate}
          inLibrary={modalInLibrary}
          currentStatus={modalEntry?.status || 'planning'}
        />
      )}
    </>
  )
}
