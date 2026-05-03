/**
 * SearchResultsPage.jsx — Full search results with filters & pagination
 *
 * Route: /search?q=naruto&type=all&page=1&year=&rating_min=&genres=
 * Navigated to when user presses Enter in SearchOverlay.
 */
import { useState, useEffect, useMemo, useCallback } from 'react'
import { useNavigate, useSearchParams } from 'react-router-dom'
import { searchService }  from '../lib/searchService'
import { browseService }  from '../lib/browseService'
import { useLibrary }     from '../hooks/useLibrary'
import { useAuth }        from '../context/AuthContext'
import { usePageTitle }   from '../context/PageTitleContext'
import MediaModal         from '../components/MediaModal'

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

function SearchCard({ item, onClick, inLibrary }) {
  const [imgErr, setImgErr] = useState(false)
  return (
    <div className="poster-card" style={{ position: 'relative' }} onClick={onClick}>
      {item.coverImage && !imgErr ? (
        <img src={item.coverImage} alt={item.title} className="poster-thumb" loading="lazy"
          style={{ objectFit: 'cover', fontSize: 0 }} onError={() => setImgErr(true)} />
      ) : (
        <div className="poster-thumb" style={{ background: 'var(--surface-high)', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '2rem' }}>
          {TYPE_EMOJI[item.type] || '🎬'}
        </div>
      )}
      {inLibrary && (
        <div className="poster-add-btn" style={{ opacity: 1 }}>
          <span className="nav-icon" style={{ fontSize: '1rem', color: '#34d399' }}>check</span>
        </div>
      )}
      <div className="poster-info">
        <p className="poster-title">{item.title}</p>
        <p className="poster-genre">{TYPE_EMOJI[item.type]} {item.score ? `★ ${item.score.toFixed(1)}` : item.year || ''}</p>
      </div>
    </div>
  )
}

export default function SearchResultsPage() {
  usePageTitle('Search Results')
  const navigate = useNavigate()
  const [searchParams, setSearchParams] = useSearchParams()

  const { entries, addToLibrary, removeEntry, updateEntry } = useLibrary()
  const { isAuth } = useAuth()

  const q    = searchParams.get('q') || ''
  const type = searchParams.get('type') || 'all'

  const [query, setQuery] = useState(q)
  const [activeType, setActiveType] = useState(type)
  const [results, setResults] = useState([])
  const [loading, setLoading] = useState(false)
  const [selectedItem, setSelectedItem] = useState(null)
  const [filtersOpen, setFiltersOpen] = useState(false)

  // Filters
  const [year, setYear] = useState(searchParams.get('year') || null)
  const [ratingMin, setRatingMin] = useState(searchParams.get('rating_min') || null)
  const [ratingMax, setRatingMax] = useState(searchParams.get('rating_max') || null)
  const [selectedGenres, setSelectedGenres] = useState(() => {
    const g = searchParams.get('genres')
    return g ? g.split(',') : []
  })
  const [availableGenres, setAvailableGenres] = useState([])

  // Load genres when type changes (only for specific types)
  useEffect(() => {
    if (['movie', 'tvshow', 'anime'].includes(activeType)) {
      browseService.getGenres(activeType).then((d) => setAvailableGenres(d.genres || [])).catch(() => setAvailableGenres([]))
    } else {
      setAvailableGenres([])
    }
  }, [activeType])

  // Search
  const fetchResults = useCallback(async () => {
    if (!query.trim() || query.trim().length < 2) return
    setLoading(true)
    try {
      const data = await searchService.search(query.trim(), activeType)
      let items = data.results || []

      // Client-side filtering (search API doesn't support all filters)
      if (year) items = items.filter((i) => i.year && String(i.year) === String(year))
      if (ratingMin) items = items.filter((i) => i.score && i.score >= parseFloat(ratingMin))
      if (ratingMax) items = items.filter((i) => i.score && i.score <= parseFloat(ratingMax))
      if (selectedGenres.length > 0) {
        items = items.filter((i) =>
          i.genres && selectedGenres.some((g) => i.genres.some((ig) => ig.toLowerCase().includes(g.toLowerCase())))
        )
      }
      setResults(items)

      // Update URL
      const sp = new URLSearchParams()
      sp.set('q', query.trim())
      if (activeType !== 'all') sp.set('type', activeType)
      if (year) sp.set('year', year)
      if (ratingMin) sp.set('rating_min', ratingMin)
      if (ratingMax) sp.set('rating_max', ratingMax)
      if (selectedGenres.length > 0) sp.set('genres', selectedGenres.join(','))
      setSearchParams(sp, { replace: true })
    } catch (err) {
      console.error('Search error:', err)
    } finally {
      setLoading(false)
    }
  }, [query, activeType, year, ratingMin, ratingMax, selectedGenres]) // eslint-disable-line

  useEffect(() => { fetchResults() }, []) // eslint-disable-line — initial load

  const handleSearch = (e) => {
    e?.preventDefault()
    fetchResults()
  }

  const toggleGenre = (g) => {
    setSelectedGenres((prev) => prev.includes(g) ? prev.filter((x) => x !== g) : [...prev, g])
  }

  // Library
  const libraryIds = useMemo(() => {
    const s = new Set()
    entries.forEach((e) => { if (e.mediaSnapshot) s.add(`${e.mediaSnapshot.source}:${e.mediaSnapshot.externalId}`) })
    return s
  }, [entries])

  const getEntry = (item) => entries.find((e) => e.mediaSnapshot?.source === item.source && e.mediaSnapshot?.externalId === item.externalId)

  const handleAdd = async (item, status) => {
    if (!isAuth) return
    const isEpisodic = ['anime', 'tvshow', 'manga'].includes(item.type)
    const totalEps = item.metadata?.episodes ?? null
    return await addToLibrary({
      externalId: item.externalId, source: item.source, type: item.type,
      title: item.title, coverImage: item.coverImage,
    }, status, isEpisodic && totalEps ? { current: 0, total: totalEps, unit: item.type === 'manga' ? 'chapters' : 'episodes' } : null)
  }

  const handleRemove = async (item) => { const e = getEntry(item); if (e) await removeEntry(e._id) }
  const handleUpdate = async (id, data) => { await updateEntry(id, data) }

  const modalEntry     = selectedItem ? getEntry(selectedItem) : null
  const modalInLibrary = selectedItem ? libraryIds.has(`${selectedItem.source}:${selectedItem.externalId}`) : false

  const currentYear = new Date().getFullYear()
  const years = Array.from({ length: 30 }, (_, i) => currentYear - i)
  const activeFilterCount = [year, ratingMin, ratingMax, selectedGenres.length > 0 ? true : null].filter(Boolean).length

  return (
    <>
      <main className="page">
        <button className="category-back" onClick={() => navigate(-1)}>
          <span className="nav-icon">arrow_back</span> Back
        </button>

        {/* Search input */}
        <form className="search-results-bar" onSubmit={handleSearch}>
          <div className="search-input-wrap">
            <span className="nav-icon search-input-icon">search</span>
            <input
              className="search-input"
              type="text"
              value={query}
              onChange={(e) => setQuery(e.target.value)}
              placeholder="Search movies, shows, anime..."
              autoComplete="off"
            />
            {query && (
              <button type="button" className="search-clear-btn" onClick={() => setQuery('')}>
                <span className="nav-icon" style={{ fontSize: '1.1rem' }}>close</span>
              </button>
            )}
          </div>
          <button type="submit" className="btn btn-primary" style={{ padding: '0.5rem 1rem' }}>
            <span className="nav-icon" style={{ fontSize: '1rem' }}>search</span>
          </button>
          <button type="button" className="browse-filter-toggle" onClick={() => setFiltersOpen(!filtersOpen)}>
            <span className="nav-icon">tune</span>
            {activeFilterCount > 0 && <span className="filter-badge">{activeFilterCount}</span>}
          </button>
        </form>

        {/* Type chips */}
        <div className="search-filters" style={{ marginTop: '0.75rem' }}>
          {TYPE_FILTERS.map((f) => (
            <button
              key={f.value}
              className={`chip ${activeType === f.value ? 'chip-active' : 'chip-inactive'}`}
              onClick={() => { setActiveType(f.value); setTimeout(fetchResults, 50) }}
            >
              {f.label}
            </button>
          ))}
        </div>

        {/* Filter panel */}
        {filtersOpen && (
          <>
            <div className="browse-filters open">
              <div className="browse-filters-header">
                <h3>Filters</h3>
                <button className="browse-filters-close" onClick={() => setFiltersOpen(false)}>
                  <span className="nav-icon">close</span>
                </button>
              </div>
              <div className="filter-group">
                <label className="filter-label">Year</label>
                <select className="filter-select" value={year || ''} onChange={(e) => setYear(e.target.value || null)}>
                  <option value="">All Years</option>
                  {years.map((y) => <option key={y} value={y}>{y}</option>)}
                </select>
              </div>
              <div className="filter-group">
                <label className="filter-label">Rating</label>
                <div className="filter-range">
                  <select className="filter-select" value={ratingMin || ''} onChange={(e) => setRatingMin(e.target.value || null)}>
                    <option value="">Min</option>
                    {[1,2,3,4,5,6,7,8,9].map((r) => <option key={r} value={r}>{r}+</option>)}
                  </select>
                  <span className="muted">to</span>
                  <select className="filter-select" value={ratingMax || ''} onChange={(e) => setRatingMax(e.target.value || null)}>
                    <option value="">Max</option>
                    {[2,3,4,5,6,7,8,9,10].map((r) => <option key={r} value={r}>{r}</option>)}
                  </select>
                </div>
              </div>
              {availableGenres.length > 0 && (
                <div className="filter-group">
                  <label className="filter-label">Genres</label>
                  <div className="filter-genres">
                    {availableGenres.map((g) => (
                      <label key={g} className="filter-checkbox">
                        <input type="checkbox" checked={selectedGenres.includes(g)} onChange={() => toggleGenre(g)} />
                        <span>{g}</span>
                      </label>
                    ))}
                  </div>
                </div>
              )}
              <button className="btn btn-primary filter-apply" onClick={() => { setFiltersOpen(false); fetchResults() }}>Apply</button>
            </div>
            <div className="browse-filters-backdrop" onClick={() => setFiltersOpen(false)} />
          </>
        )}

        {/* Results count */}
        {!loading && results.length > 0 && (
          <p className="muted" style={{ fontSize: '0.8rem', margin: '0.5rem 0 1rem' }}>{results.length} results</p>
        )}

        {/* Grid */}
        <div className="category-grid">
          {loading
            ? Array.from({ length: 12 }).map((_, i) => (
                <div key={i} className="poster-card">
                  <div className="poster-thumb skeleton-shimmer" />
                  <div style={{ padding: '0.5rem 0.25rem' }}>
                    <div className="skeleton-shimmer" style={{ height: '0.75rem', borderRadius: '0.25rem', marginBottom: '0.4rem' }} />
                    <div className="skeleton-shimmer" style={{ height: '0.6rem', borderRadius: '0.25rem', width: '60%' }} />
                  </div>
                </div>
              ))
            : results.map((item) => (
                <SearchCard
                  key={`${item.source}-${item.externalId}`}
                  item={item}
                  onClick={() => setSelectedItem(item)}
                  inLibrary={libraryIds.has(`${item.source}:${item.externalId}`)}
                />
              ))
          }
        </div>

        {!loading && results.length === 0 && query.trim().length >= 2 && (
          <div className="search-empty">
            <div style={{ fontSize: '3rem', marginBottom: '0.75rem' }}>🔍</div>
            <p style={{ fontWeight: 600 }}>No results found</p>
            <p className="muted" style={{ fontSize: '0.85rem' }}>Try different keywords or filters</p>
          </div>
        )}
      </main>

      {selectedItem && (
        <MediaModal
          item={selectedItem}
          entry={modalEntry}
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
