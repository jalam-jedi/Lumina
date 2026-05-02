/**
 * CategoryPage.jsx — Paginated browse with filters
 *
 * Route: /category/:type  (movie, tvshow, anime)
 * 25 items per page. Filters: year, rating range, genres.
 */
import { useState, useEffect, useMemo, useCallback } from 'react'
import { useParams, useNavigate, useSearchParams } from 'react-router-dom'
import { browseService }  from '../lib/browseService'
import { useLibrary }     from '../hooks/useLibrary'
import { useAuth }        from '../context/AuthContext'
import { usePageTitle }   from '../context/PageTitleContext'
import MediaModal         from '../components/MediaModal'

const TYPE_META = {
  movie:  { emoji: '🎬', title: 'Movies'   },
  tvshow: { emoji: '📺', title: 'TV Shows' },
  anime:  { emoji: '⛩️', title: 'Anime'   },
}

// ── Result card ────────────────────────────────────────────────
function BrowseCard({ item, onOpen, inLibrary }) {
  const [imgErr, setImgErr] = useState(false)
  return (
    <div className="poster-card" style={{ position: 'relative' }} onClick={() => onOpen(item)}>
      {item.coverImage && !imgErr ? (
        <img src={item.coverImage} alt={item.title} className="poster-thumb" loading="lazy"
          style={{ objectFit: 'cover', fontSize: 0 }} onError={() => setImgErr(true)} />
      ) : (
        <div className="poster-thumb" style={{ background: 'var(--surface-high)', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '2.5rem' }}>
          {TYPE_META[item.type]?.emoji || '🎬'}
        </div>
      )}
      {inLibrary && (
        <div className="poster-add-btn" style={{ opacity: 1 }}>
          <span className="nav-icon" style={{ fontSize: '1rem', color: '#34d399' }}>check</span>
        </div>
      )}
      <div className="poster-info">
        <p className="poster-title">{item.title}</p>
        <p className="poster-genre">{item.score ? `★ ${item.score.toFixed(1)}` : ''} {item.year || ''}</p>
      </div>
    </div>
  )
}

// ── Filter sidebar/panel ───────────────────────────────────────
function FilterPanel({ genres, selectedGenres, toggleGenre, year, setYear, ratingMin, setRatingMin, ratingMax, setRatingMax, onApply, filtersOpen, setFiltersOpen }) {
  const currentYear = new Date().getFullYear()
  const years = Array.from({ length: 30 }, (_, i) => currentYear - i)

  return (
    <div className={`browse-filters ${filtersOpen ? 'open' : ''}`}>
      <div className="browse-filters-header">
        <h3>Filters</h3>
        <button className="browse-filters-close" onClick={() => setFiltersOpen(false)}>
          <span className="nav-icon">close</span>
        </button>
      </div>

      {/* Year */}
      <div className="filter-group">
        <label className="filter-label">Year</label>
        <select className="filter-select" value={year || ''} onChange={(e) => setYear(e.target.value || null)}>
          <option value="">All Years</option>
          {years.map((y) => <option key={y} value={y}>{y}</option>)}
        </select>
      </div>

      {/* Rating range */}
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

      {/* Genres */}
      <div className="filter-group">
        <label className="filter-label">Genres</label>
        <div className="filter-genres">
          {genres.map((g) => (
            <label key={g} className="filter-checkbox">
              <input type="checkbox" checked={selectedGenres.includes(g)} onChange={() => toggleGenre(g)} />
              <span>{g}</span>
            </label>
          ))}
        </div>
      </div>

      <button className="btn btn-primary filter-apply" onClick={onApply}>Apply Filters</button>
    </div>
  )
}

// ── Page ───────────────────────────────────────────────────────
export default function CategoryPage() {
  const { type } = useParams()
  const navigate = useNavigate()
  const [searchParams, setSearchParams] = useSearchParams()
  const meta = TYPE_META[type] || { emoji: '🎬', title: 'Media' }
  usePageTitle(meta.title)

  const { entries, addToLibrary, removeEntry, updateEntry } = useLibrary()
  const { isAuth } = useAuth()

  // State
  const [items, setItems] = useState([])
  const [loading, setLoading] = useState(true)
  const [page, setPage] = useState(parseInt(searchParams.get('page')) || 1)
  const [totalPages, setTotalPages] = useState(1)
  const [totalResults, setTotalResults] = useState(0)

  // Filters
  const [year, setYear] = useState(searchParams.get('year') || null)
  const [ratingMin, setRatingMin] = useState(searchParams.get('rating_min') || null)
  const [ratingMax, setRatingMax] = useState(searchParams.get('rating_max') || null)
  const [selectedGenres, setSelectedGenres] = useState(() => {
    const g = searchParams.get('genres')
    return g ? g.split(',') : []
  })
  const [availableGenres, setAvailableGenres] = useState([])
  const [filtersOpen, setFiltersOpen] = useState(false)

  const [selectedItem, setSelectedItem] = useState(null)

  // Load genres
  useEffect(() => {
    browseService.getGenres(type).then((d) => setAvailableGenres(d.genres || [])).catch(() => {})
  }, [type])

  // Fetch data
  const fetchData = useCallback(async (p = page) => {
    setLoading(true)
    try {
      const params = { page: p }
      if (year) params.year = year
      if (ratingMin) params.rating_min = ratingMin
      if (ratingMax) params.rating_max = ratingMax
      if (selectedGenres.length > 0) params.genres = selectedGenres.join(',')

      const data = await browseService.browse(type, params)
      setItems(data.results || [])
      setTotalPages(data.totalPages || 1)
      setTotalResults(data.totalResults || 0)

      // Update URL params
      const sp = new URLSearchParams()
      if (p > 1) sp.set('page', p)
      if (year) sp.set('year', year)
      if (ratingMin) sp.set('rating_min', ratingMin)
      if (ratingMax) sp.set('rating_max', ratingMax)
      if (selectedGenres.length > 0) sp.set('genres', selectedGenres.join(','))
      setSearchParams(sp, { replace: true })
    } catch (err) {
      console.error('Browse error:', err)
    } finally {
      setLoading(false)
    }
  }, [type, page, year, ratingMin, ratingMax, selectedGenres]) // eslint-disable-line

  useEffect(() => { fetchData(page) }, [page, type]) // eslint-disable-line

  const toggleGenre = (g) => {
    setSelectedGenres((prev) => prev.includes(g) ? prev.filter((x) => x !== g) : [...prev, g])
  }

  const handleApply = () => {
    setPage(1)
    setFiltersOpen(false)
    fetchData(1)
  }

  // Library lookup
  const libraryIds = useMemo(() => {
    const s = new Set()
    entries.forEach((e) => {
      if (e.mediaSnapshot) s.add(`${e.mediaSnapshot.source}:${e.mediaSnapshot.externalId}`)
    })
    return s
  }, [entries])

  const getEntry = (item) =>
    entries.find((e) => e.mediaSnapshot?.source === item.source && e.mediaSnapshot?.externalId === item.externalId)

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

  const activeFilterCount = [year, ratingMin, ratingMax, selectedGenres.length > 0 ? true : null].filter(Boolean).length

  return (
    <>
      <main className="page">
        {/* Header row */}
        <div className="browse-header">
          <button className="category-back" onClick={() => navigate(-1)}>
            <span className="nav-icon">arrow_back</span> Back
          </button>
          <button className="browse-filter-toggle" onClick={() => setFiltersOpen(!filtersOpen)}>
            <span className="nav-icon">tune</span>
            Filters
            {activeFilterCount > 0 && <span className="filter-badge">{activeFilterCount}</span>}
          </button>
        </div>

        {/* Count + page info */}
        {!loading && (
          <p className="muted" style={{ fontSize: '0.8rem', marginBottom: '1rem' }}>
            {totalResults.toLocaleString()} results · Page {page} of {totalPages}
          </p>
        )}

        {/* Filter panel */}
        <FilterPanel
          genres={availableGenres}
          selectedGenres={selectedGenres}
          toggleGenre={toggleGenre}
          year={year} setYear={setYear}
          ratingMin={ratingMin} setRatingMin={setRatingMin}
          ratingMax={ratingMax} setRatingMax={setRatingMax}
          onApply={handleApply}
          filtersOpen={filtersOpen}
          setFiltersOpen={setFiltersOpen}
        />

        {/* Backdrop for mobile filter panel */}
        {filtersOpen && <div className="browse-filters-backdrop" onClick={() => setFiltersOpen(false)} />}

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
            : items.map((item) => (
                <BrowseCard
                  key={`${item.source}-${item.externalId}`}
                  item={item}
                  onOpen={setSelectedItem}
                  inLibrary={libraryIds.has(`${item.source}:${item.externalId}`)}
                />
              ))
          }
        </div>

        {/* Empty */}
        {!loading && items.length === 0 && (
          <div className="search-empty">
            <div style={{ fontSize: '3rem', marginBottom: '0.75rem' }}>📭</div>
            <p style={{ fontWeight: 600 }}>No results found</p>
            <p className="muted" style={{ fontSize: '0.85rem' }}>Try adjusting your filters</p>
          </div>
        )}

        {/* Pagination */}
        {!loading && totalPages > 1 && (
          <div className="pagination">
            <button className="pagination-btn" disabled={page <= 1} onClick={() => { setPage(page - 1); window.scrollTo(0, 0) }}>
              <span className="nav-icon">chevron_left</span> Prev
            </button>
            <div className="pagination-pages">
              {generatePageNumbers(page, totalPages).map((p, i) =>
                p === '...'
                  ? <span key={`d${i}`} className="pagination-dots">…</span>
                  : <button key={p} className={`pagination-num ${p === page ? 'active' : ''}`} onClick={() => { setPage(p); window.scrollTo(0, 0) }}>{p}</button>
              )}
            </div>
            <button className="pagination-btn" disabled={page >= totalPages} onClick={() => { setPage(page + 1); window.scrollTo(0, 0) }}>
              Next <span className="nav-icon">chevron_right</span>
            </button>
          </div>
        )}
      </main>

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

// Helper: generate page number array with ellipsis
function generatePageNumbers(current, total) {
  if (total <= 7) return Array.from({ length: total }, (_, i) => i + 1)
  const pages = []
  pages.push(1)
  if (current > 3) pages.push('...')
  for (let i = Math.max(2, current - 1); i <= Math.min(total - 1, current + 1); i++) pages.push(i)
  if (current < total - 2) pages.push('...')
  pages.push(total)
  return pages
}
