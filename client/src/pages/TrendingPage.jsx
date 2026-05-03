/**
 * TrendingPage.jsx — Live data, tabbed by media type
 *
 * Data source: useDiscovery() → tmdbTrending (movies+tv) + topAnime (anilist)
 * Tabs: All · Movies · TV Shows · Anime
 *
 * Each tab shows a ranked list:
 *   rank#  cover thumbnail  title + meta  score / year  +add button
 *
 * Clicking any row opens MediaModal for full detail + add-to-library.
 */
import { useState, useMemo } from 'react'
import { useNavigate }   from 'react-router-dom'
import { useDiscovery }  from '../hooks/useDiscovery'
import { useLibrary }    from '../hooks/useLibrary'
import { useAuth }       from '../context/AuthContext'
import { usePageTitle }  from '../context/PageTitleContext'
import MediaModal        from '../components/MediaModal'

// ── Tab config ─────────────────────────────────────────────────
const TABS = [
  { key: 'all',    label: 'All',      emoji: '🌐' },
  { key: 'movie',  label: 'Movies',   emoji: '🎬' },
  { key: 'tvshow', label: 'TV Shows', emoji: '📺' },
  { key: 'anime',  label: 'Anime',    emoji: '⛩️' },
]

const TYPE_COLOR = {
  movie:  'rgba(151,169,255,0.15)',
  tvshow: 'rgba(167,139,250,0.15)',
  anime:  'rgba(251,191,36,0.12)',
}
const TYPE_LABEL = {
  movie: '🎬', tvshow: '📺', anime: '⛩️',
}

// ── Skeleton row ───────────────────────────────────────────────
function SkeletonRow() {
  return (
    <div className="trend-row" style={{ gap: '0.75rem', alignItems: 'center' }}>
      <span className="trend-rank skeleton-shimmer" style={{ width: '1.2rem', height: '1.2rem', borderRadius: '0.25rem', display: 'inline-block' }} />
      <div className="skeleton-shimmer" style={{ width: '3.2rem', height: '4.5rem', borderRadius: '0.5rem', flexShrink: 0 }} />
      <div style={{ flex: 1 }}>
        <div className="skeleton-shimmer" style={{ height: '0.8rem', borderRadius: '0.25rem', marginBottom: '0.4rem', width: '70%' }} />
        <div className="skeleton-shimmer" style={{ height: '0.65rem', borderRadius: '0.25rem', width: '40%' }} />
      </div>
      <div className="skeleton-shimmer" style={{ width: '2.5rem', height: '1rem', borderRadius: '0.25rem' }} />
    </div>
  )
}

// ── Single ranked row ──────────────────────────────────────────
function TrendRow({ item, rank, onOpen, inLibrary }) {
  const [imgErr, setImgErr] = useState(false)
  const score = item.score ? item.score.toFixed(1) : null
  const meta  = [
    TYPE_LABEL[item.type],
    item.year,
    score ? `★ ${score}` : null,
  ].filter(Boolean).join('  ·  ')

  return (
    <div
      className="trend-row trend-row-live"
      onClick={() => onOpen(item)}
      role="button"
      tabIndex={0}
      onKeyDown={(e) => e.key === 'Enter' && onOpen(item)}
    >
      {/* Rank */}
      <span className={`trend-rank ${rank <= 3 ? 'trend-rank-top' : ''}`}>{rank}</span>

      {/* Cover thumbnail */}
      <div className="trend-thumb-wrap">
        {item.coverImage && !imgErr ? (
          <img
            src={item.coverImage}
            alt={item.title}
            className="trend-thumb-img"
            loading="lazy"
            onError={() => setImgErr(true)}
          />
        ) : (
          <div className="trend-thumb-img trend-thumb-fallback">
            {TYPE_LABEL[item.type] || '🎬'}
          </div>
        )}
      </div>

      {/* Title + meta */}
      <div className="trend-meta" style={{ flex: 1, minWidth: 0 }}>
        <p className="trend-title">{item.title}</p>
        <p className="trend-sub" style={{ color: 'var(--text-muted)', fontSize: '0.75rem' }}>{meta}</p>
      </div>

      {/* Score badge or "in library" indicator */}
      {inLibrary ? (
        <span className="trend-in-lib" title="In your library">
          <span className="nav-icon" style={{ fontSize: '0.9rem', color: '#34d399' }}>check_circle</span>
        </span>
      ) : score ? (
        <span className="trend-score">{score}</span>
      ) : null}

      {/* Add chevron */}
      <span className="nav-icon trend-chevron">chevron_right</span>
    </div>
  )
}

// ── Section heading for "All" tab ──────────────────────────────
function SectionDivider({ emoji, label, type }) {
  const navigate = useNavigate()
  return (
    <div className="trend-section-divider">
      <span>{emoji} {label}</span>
      <a onClick={() => navigate(`/category/${type}`)} style={{ cursor: 'pointer', fontSize: '0.8rem', color: 'var(--primary)', fontWeight: 600, display: 'flex', alignItems: 'center', gap: '0.25rem' }}>
        See all <span className="nav-icon" style={{ fontSize: '0.85rem' }}>arrow_forward</span>
      </a>
    </div>
  )
}

// ── Page ───────────────────────────────────────────────────────
export default function TrendingPage() {
  usePageTitle('Trending')
  const { isAuth } = useAuth()
  const { tmdbTrending, topAnime, loading } = useDiscovery()
  const { entries, addToLibrary, removeEntry } = useLibrary()
  const [activeTab,    setActiveTab]    = useState('all')
  const [selectedItem, setSelectedItem] = useState(null)

  // Library lookup set
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

  // Build ranked lists per type
  const movies  = useMemo(() => tmdbTrending.filter((i) => i.type === 'movie'),  [tmdbTrending])
  const tvshows = useMemo(() => tmdbTrending.filter((i) => i.type === 'tvshow'), [tmdbTrending])
  const anime   = topAnime

  // ── Handlers ──────────────────────────────────────────────────
  const handleOpen  = (item) => setSelectedItem(item)
  const handleClose = ()     => setSelectedItem(null)

  const handleAdd = async (item, status) => {
    if (!isAuth) return
    const isEpisodic = ['anime', 'tvshow', 'manga'].includes(item.type)
    const totalEps   = item.metadata?.episodes ?? null
    await addToLibrary({
      externalId: item.externalId,
      source:     item.source,
      type:       item.type,
      title:      item.title,
      coverImage: item.coverImage,
    }, status, isEpisodic && totalEps
      ? { current: 0, total: totalEps, unit: item.type === 'manga' ? 'chapters' : 'episodes' }
      : null)
  }

  const handleRemove = async (item) => {
    const entry = getEntry(item)
    if (entry) await removeEntry(entry._id)
  }

  const modalItem      = selectedItem
  const modalInLibrary = modalItem ? libraryIds.has(`${modalItem.source}:${modalItem.externalId}`) : false
  const modalEntry     = modalItem ? getEntry(modalItem) : null

  // ── Render helpers ─────────────────────────────────────────────
  const renderRows = (items, startRank = 1) =>
    loading
      ? Array.from({ length: 5 }).map((_, i) => <SkeletonRow key={i} />)
      : items.map((item, i) => (
          <TrendRow
            key={`${item.source}-${item.externalId}`}
            item={item}
            rank={startRank + i}
            onOpen={handleOpen}
            inLibrary={libraryIds.has(`${item.source}:${item.externalId}`)}
          />
        ))

  // "All" tab — interleaved sections: Movies → TV → Anime
  const renderAll = () => (
    <>
      <SectionDivider emoji="🎬" label="Movies" type="movie" />
      {renderRows(movies.slice(0, 5))}
      <SectionDivider emoji="📺" label="TV Shows" type="tvshow" />
      {renderRows(tvshows.slice(0, 5))}
      <SectionDivider emoji="⛩️" label="Anime" type="anime" />
      {renderRows(anime.slice(0, 5))}
    </>
  )

  const tabItems = { movie: movies, tvshow: tvshows, anime }

  return (
    <>
      <main className="page">
        {/* Tab row */}
        <div className="tab-row" style={{ marginBottom: '1.25rem' }}>
          {TABS.map((t) => (
            <button
              key={t.key}
              className={`chip ${activeTab === t.key ? 'chip-active' : 'chip-inactive'}`}
              onClick={() => setActiveTab(t.key)}
            >
              {t.emoji} {t.label}
            </button>
          ))}
        </div>

        {/* Live counts bar */}
        {!loading && (
          <div className="trend-counts-row">
            <span>🎬 {movies.length} movies</span>
            <span>📺 {tvshows.length} shows</span>
            <span>⛩️ {anime.length} anime</span>
          </div>
        )}

        {/* Ranked list */}
        <div className="trend-list">
          {activeTab === 'all'
            ? renderAll()
            : renderRows(tabItems[activeTab] || [])
          }
          {/* Empty state */}
          {!loading && (tabItems[activeTab] || []).length === 0 && activeTab !== 'all' && (
            <div style={{ textAlign: 'center', padding: '2rem', color: 'var(--text-muted)' }}>
              <div style={{ fontSize: '2rem', marginBottom: '0.5rem' }}>📡</div>
              <p>No data available right now</p>
            </div>
          )}
        </div>
      </main>

      {/* Media modal */}
      {selectedItem && (
        <MediaModal
          item={selectedItem}
          entry={modalEntry}
          entryId={modalEntry?._id}
          onClose={handleClose}
          onAdd={handleAdd}
          onRemove={handleRemove}
          onUpdate={updateEntry}
          inLibrary={modalInLibrary}
          currentStatus={modalEntry?.status || 'planning'}
        />
      )}
    </>
  )
}
