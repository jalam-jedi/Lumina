/**
 * DiscoveryPage.jsx — Live data + Netflix-style MediaModal
 *
 * Clicking any poster or the hero card opens MediaModal.
 * The modal shows full details, a status picker, and an Add/Remove CTA.
 * The `+` overlay button on poster cards ALSO opens the modal (not a quick-add).
 */
import { useState, useMemo, useEffect } from 'react'
import { useNavigate }  from 'react-router-dom'
import { useDiscovery } from '../hooks/useDiscovery'
import { useLibrary }   from '../hooks/useLibrary'
import { useAuth }      from '../context/AuthContext'
import { usePageTitle } from '../context/PageTitleContext'
import MediaModal       from '../components/MediaModal'

// ── Type meta map ──────────────────────────────────────────────
const TYPE_META = {
  movie:  { emoji: '🎬', label: 'Movies' },
  tvshow: { emoji: '📺', label: 'TV Shows' },
  anime:  { emoji: '⛩️', label: 'Anime' },
}

// ── Skeleton shimmer card ──────────────────────────────────────
function SkeletonCard() {
  return (
    <div className="poster-card">
      <div className="poster-thumb skeleton-shimmer" />
      <div style={{ padding: '0.5rem 0.25rem' }}>
        <div className="skeleton-shimmer" style={{ height: '0.75rem', borderRadius: '0.25rem', marginBottom: '0.4rem' }} />
        <div className="skeleton-shimmer" style={{ height: '0.6rem', borderRadius: '0.25rem', width: '60%' }} />
      </div>
    </div>
  )
}

// ── Real poster card — click opens modal ──────────────────────
function MediaCard({ item, onOpen, inLibrary }) {
  const [imgError, setImgError] = useState(false)

  return (
    <div className="poster-card" style={{ position: 'relative' }} onClick={() => onOpen(item)}>
      {item.coverImage && !imgError ? (
        <img
          src={item.coverImage}
          alt={item.title}
          className="poster-thumb"
          loading="lazy"
          style={{ objectFit: 'cover', fontSize: 0 }}
          onError={() => setImgError(true)}
        />
      ) : (
        <div className="poster-thumb" style={{ background: 'var(--surface-high)', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '2.5rem' }}>
          {TYPE_META[item.type]?.emoji || '🎬'}
        </div>
      )}

      {/* Library indicator / open-modal button */}
      <button
        className="poster-add-btn"
        onClick={(e) => { e.stopPropagation(); onOpen(item) }}
        title={inLibrary ? 'View details' : 'Add to library'}
        style={{ opacity: inLibrary ? 1 : undefined }}
      >
        <span className="nav-icon" style={{ fontSize: '1rem', color: inLibrary ? '#34d399' : undefined }}>
          {inLibrary ? 'check' : 'add'}
        </span>
      </button>

      <div className="poster-info">
        <p className="poster-title">{item.title}</p>
        <p className="poster-genre">
          {item.score ? `★ ${item.score.toFixed(1)}` : item.year || ''}
        </p>
      </div>
    </div>
  )
}

// ── Hero card ─────────────────────────────────────────────────
function HeroCard({ item, onOpen }) {
  const [heroError, setHeroError] = useState(false)
  const backdrop = item.metadata?.backdropPath || item.coverImage || ''
  const genre    = item.genres?.[0] || TYPE_META[item.type]?.label || ''

  return (
    <div className="hero-card" style={{ cursor: 'pointer' }} onClick={() => onOpen(item)}>
      <div className="hero-backdrop">
        {backdrop && !heroError
          ? <img src={backdrop} alt={item.title} style={{ width: '100%', height: '100%', objectFit: 'cover' }} onError={() => setHeroError(true)} />
          : <div style={{ width: '100%', height: '100%', background: 'linear-gradient(135deg,#0d1b4b,#1a1a6e,#0f3460)', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '5rem' }}>🎬</div>
        }
      </div>
      <div className="hero-overlay">
        <div className="hero-meta-row">
          <span className="label-sm muted">{TYPE_META[item.type]?.emoji} {genre}</span>
          {item.year  && <><span className="label-sm muted">·</span><span className="label-sm muted">{item.year}</span></>}
          {item.score && <><span className="label-sm muted">·</span><span className="label-sm" style={{ color: '#fbbf24' }}>★ {item.score.toFixed(1)}</span></>}
        </div>
        <h1 className="hero-title">{item.title}</h1>
        {item.synopsis && <p className="hero-desc">{item.synopsis.replace(/<[^>]*>/g, '').slice(0, 180)}…</p>}
        <div className="hero-actions">
          <button className="btn btn-primary" onClick={(e) => { e.stopPropagation(); onOpen(item) }}>
            <span className="nav-icon" style={{ fontSize: '1rem' }}>info</span>
            More Info
          </button>
        </div>
      </div>
    </div>
  )
}

// ── See All card at end of scroll ──────────────────────────────
function SeeAllCard({ type }) {
  const navigate = useNavigate()
  return (
    <div className="see-all-card" onClick={() => navigate(`/category/${type}`)}>
      <span className="nav-icon see-all-icon">arrow_forward</span>
      <span className="see-all-text">See All</span>
    </div>
  )
}

// ── Horizontal media section ───────────────────────────────────
function MediaSection({ emoji, label, items, loading, onOpen, libraryIds, type }) {
  if (!loading && items.length === 0) return null
  const navigate = useNavigate()
  return (
    <div className="section">
      <div className="section-header">
        <h2>{emoji} {label}</h2>
        {!loading && items.length > 0 && (
          <a onClick={() => navigate(`/category/${type}`)} style={{ cursor: 'pointer' }}>
            See all <span className="nav-icon" style={{ fontSize: '0.85rem' }}>arrow_forward</span>
          </a>
        )}
      </div>
      <div className="h-scroll">
        {loading
          ? Array.from({ length: 5 }).map((_, i) => <SkeletonCard key={i} />)
          : <>
              {items.map((item) => (
                <MediaCard
                  key={`${item.source}-${item.externalId}`}
                  item={item}
                  onOpen={onOpen}
                  inLibrary={libraryIds.has(`${item.source}:${item.externalId}`)}
                />
              ))}
              <SeeAllCard type={type} />
            </>
        }
      </div>
    </div>
  )
}

// ── Platform trending row ──────────────────────────────────────
function PlatformRow({ items, loading, onOpen }) {
  if (!loading && items.length === 0) return null
  return (
    <div className="section">
      <div className="section-header">
        <h2>🔥 Hot on Lumina</h2>
        <span className="label-sm muted">Trending this week</span>
      </div>
      <div className="h-scroll">
        {loading
          ? Array.from({ length: 5 }).map((_, i) => <SkeletonCard key={i} />)
          : items.map((item, idx) => (
              <div key={idx} className="poster-card" style={{ cursor: 'pointer' }} onClick={() => onOpen(item)}>
                {item.coverImage
                  ? <img src={item.coverImage} alt={item.title} className="poster-thumb" loading="lazy" style={{ objectFit: 'cover', fontSize: 0 }} />
                  : <div className="poster-thumb" style={{ background: 'var(--surface-high)', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '2rem' }}>
                      {TYPE_META[item.type]?.emoji || '📺'}
                    </div>
                }
                <div className="poster-info">
                  <p className="poster-title">{item.title}</p>
                  <p className="poster-genre">{item.addCount} tracking</p>
                </div>
              </div>
            ))
        }
      </div>
    </div>
  )
}

// ── Page ───────────────────────────────────────────────────────
export default function DiscoveryPage() {
  const { isAuth }  = useAuth()
  const { tmdbTrending, topAnime, platformTrending, loading } = useDiscovery()
  const { entries, addToLibrary, removeEntry, updateEntry } = useLibrary()

  // Hot on Lumina toggle — persisted in localStorage
  const [showHot, setShowHot] = useState(
    () => localStorage.getItem('lumina_show_hot') !== 'false'
  )
  const toggleHot = () => setShowHot((prev) => {
    const next = !prev
    localStorage.setItem('lumina_show_hot', String(next))
    return next
  })

  // Set page title with hot toggle as extras
  const setExtras = usePageTitle('Lumina')
  useEffect(() => {
    setExtras(
      <button
        className={`icon-btn hot-toggle-btn ${showHot ? 'hot-toggle-on' : ''}`}
        onClick={toggleHot}
        title={showHot ? 'Hide Hot on Lumina' : 'Show Hot on Lumina'}
        aria-pressed={showHot}
      >
        <span style={{ fontSize: '1.1rem' }}>🔥</span>
      </button>
    )
  }, [showHot]) // eslint-disable-line react-hooks/exhaustive-deps

  // Modal state
  const [selectedItem, setSelectedItem] = useState(null)

  // Build a Set of "source:externalId" for O(1) "in library" lookup
  const libraryIds = useMemo(() => {
    const s = new Set()
    entries.forEach((e) => {
      if (e.mediaSnapshot) s.add(`${e.mediaSnapshot.source}:${e.mediaSnapshot.externalId}`)
    })
    return s
  }, [entries])

  // Get the library entry for a given item (for current status)
  const getEntry = (item) =>
    entries.find((e) =>
      e.mediaSnapshot?.source === item.source &&
      e.mediaSnapshot?.externalId === item.externalId
    )

  // Split TMDB by type
  const movies  = useMemo(() => tmdbTrending.filter((i) => i.type === 'movie'),  [tmdbTrending])
  const tvshows = useMemo(() => tmdbTrending.filter((i) => i.type === 'tvshow'), [tmdbTrending])

  // Hero = first TMDB item (has backdrop)
  const hero = tmdbTrending[0] || topAnime[0] || null

  // ── Handlers ────────────────────────────────────────────────
  const handleOpen = (item) => setSelectedItem(item)
  const handleClose = () => setSelectedItem(null)

  const handleAdd = async (item, status) => {
    if (!isAuth) return
    const isEpisodic = ['anime', 'tvshow', 'manga'].includes(item.type)
    const totalEps   = item.metadata?.episodes ?? null
    return await addToLibrary({
      externalId: item.externalId,
      source:     item.source,
      type:       item.type,
      title:      item.title,
      coverImage: item.coverImage,
    }, status, isEpisodic && totalEps ? { current: 0, total: totalEps, unit: item.type === 'manga' ? 'chapters' : 'episodes' } : null)
  }

  const handleUpdate = async (id, data) => {
    await updateEntry(id, data)
  }

  const handleRemove = async (item) => {
    const entry = getEntry(item)
    if (entry) await removeEntry(entry._id)
  }

  const modalItem       = selectedItem
  const modalInLibrary  = modalItem ? libraryIds.has(`${modalItem.source}:${modalItem.externalId}`) : false
  const modalEntry      = modalItem ? getEntry(modalItem) : null

  return (
    <>
      <main className="page">
        {/* Hero */}
        {loading
          ? <div className="hero-card skeleton-shimmer" />
          : hero && <HeroCard item={hero} onOpen={handleOpen} />
        }

        {/* Platform hot row — toggleable */}
        {showHot && <PlatformRow items={platformTrending} loading={loading} onOpen={handleOpen} />}

        {/* Movies */}
        <MediaSection emoji="🎬" label="Movies"    items={movies}    loading={loading} onOpen={handleOpen} libraryIds={libraryIds} type="movie" />

        {/* TV Shows */}
        <MediaSection emoji="📺" label="TV Shows"  items={tvshows}   loading={loading} onOpen={handleOpen} libraryIds={libraryIds} type="tvshow" />

        {/* Anime */}
        <MediaSection emoji="⛩️" label="Anime"    items={topAnime}  loading={loading} onOpen={handleOpen} libraryIds={libraryIds} type="anime" />
      </main>

      {/* Media detail modal */}
      {selectedItem && (
        <MediaModal
          item={selectedItem}
          entry={modalEntry}
          entryId={modalEntry?._id}
          onClose={handleClose}
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
