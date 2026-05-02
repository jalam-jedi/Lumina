/**
 * LibraryPage.jsx — With episode progress stepper
 *
 * Episode stepper is shown for episodic media types: anime, tvshow, manga.
 * Changes are debounced 600ms then saved via PATCH /api/library/:id.
 *
 * Status mapping (backend → display):
 *   'in-progress' → Watching  (pulse dot)
 *   'completed'   → Completed
 *   'planning'    → Plan to Watch
 *   'paused'      → Paused
 *   'dropped'     → Dropped
 */
import { useState, useMemo, useCallback, useRef, useEffect } from 'react'
import { useLibrary } from '../hooks/useLibrary'
import { usePageTitle } from '../context/PageTitleContext'
import MediaModal from '../components/MediaModal'

// ── Constants ──────────────────────────────────────────────────
const TABS       = ['All', 'movie', 'tvshow', 'anime', 'book']
const TAB_LABELS = { All: 'All', movie: 'Movies', tvshow: 'TV Shows', anime: 'Anime', book: 'Books' }

// Types that have episode/chapter counts
const EPISODIC_TYPES = new Set(['anime', 'tvshow', 'manga'])

const STATUS_MAP = {
  'in-progress': { cls: 'status-watching',  label: 'Watching',      dot: true  },
  'completed':   { cls: 'status-completed', label: 'Completed',     dot: false },
  'planning':    { cls: 'status-planned',   label: 'Plan to Watch', dot: false },
  'paused':      { cls: 'status-planned',   label: 'Paused',        dot: false },
  'dropped':     { cls: 'status-dropped',   label: 'Dropped',       dot: false },
}

const TYPE_EMOJI = {
  movie: '🎬', tvshow: '📺', anime: '⛩️', manga: '📖', book: '📚',
}

// ── Helpers ────────────────────────────────────────────────────
const getTitle  = (e) => e.mediaSnapshot?.title      || e.media?.title      || 'Unknown'
const getCover  = (e) => e.mediaSnapshot?.coverImage || e.media?.coverImage || ''
const getType   = (e) => e.mediaSnapshot?.type       || e.media?.type       || 'movie'
const getUnit   = (e) => {
  if (e.progress?.unit) return e.progress.unit
  const t = getType(e)
  return t === 'manga' ? 'chapters' : 'episodes'
}
const progressPct = (p) =>
  p?.total ? Math.min(100, Math.round((p.current / p.total) * 100)) : 0

// ── Debounce hook ──────────────────────────────────────────────
function useDebounce(fn, delay) {
  const timer = useRef(null)
  return useCallback((...args) => {
    clearTimeout(timer.current)
    timer.current = setTimeout(() => fn(...args), delay)
  }, [fn, delay])
}

// ── Skeleton ────────────────────────────────────────────────────
function SkeletonGridCard() {
  return (
    <div className="grid-card">
      <div className="grid-poster skeleton-shimmer" />
      <div style={{ padding: '0.5rem 0.25rem' }}>
        <div className="skeleton-shimmer" style={{ height: '0.7rem', borderRadius: '0.25rem', marginBottom: '0.5rem', width: '50%' }} />
        <div className="skeleton-shimmer" style={{ height: '0.75rem', borderRadius: '0.25rem', marginBottom: '0.3rem' }} />
        <div className="skeleton-shimmer" style={{ height: '0.65rem', borderRadius: '0.25rem', width: '40%' }} />
      </div>
    </div>
  )
}

// ── Status badge ────────────────────────────────────────────────
function StatusBadge({ status }) {
  const cfg = STATUS_MAP[status] || STATUS_MAP['planning']
  return (
    <span className={`status-badge ${cfg.cls}`}>
      {cfg.dot && <span className="pulse-dot" />}
      {cfg.label}
    </span>
  )
}

// ── Continue Watching card ───────────────────────────────────────
function CWCard({ entry, onClick }) {
  const cover   = getCover(entry)
  const title   = getTitle(entry)
  const type    = getType(entry)
  const pct     = progressPct(entry.progress)

  return (
    <div className="cw-card" onClick={() => onClick(entry)}>
      <div className="cw-backdrop">
        {cover
          ? <img src={cover} alt={title} style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
          : <div style={{ width: '100%', height: '100%', background: 'var(--surface-high)', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '3rem' }}>
              {TYPE_EMOJI[type] || '📺'}
            </div>
        }
      </div>
      <div className="cw-info">
        <p className="cw-title">{title}</p>
        <div className="progress-bar" style={{ marginBottom: '0.2rem' }}>
          <div className="progress-fill" style={{ width: `${pct}%` }} />
        </div>
      </div>
    </div>
  )
}

// ── Grid card ───────────────────────────────────────────────────
function GridCard({ entry, onClick }) {
  const cover = getCover(entry)
  const title = getTitle(entry)
  const type  = getType(entry)

  return (
    <div
      className="grid-card"
      onClick={() => onClick(entry)}
    >
      <div className="grid-poster" style={{ position: 'relative' }}>
        {cover
          ? <img src={cover} alt={title} style={{ width: '100%', height: '100%', objectFit: 'cover', borderRadius: 'inherit' }} />
          : <div style={{ width: '100%', height: '100%', background: 'var(--surface-high)', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '2.5rem' }}>
              {TYPE_EMOJI[type] || '🎬'}
            </div>
        }
      </div>
      <div className="grid-info">
        <StatusBadge status={entry.status} />
        <p className="grid-title" style={{ marginTop: '0.4rem' }}>{title}</p>
        <p className="grid-year">
          {entry.mediaSnapshot?.type?.toUpperCase() || ''}
          {EPISODIC_TYPES.has(type) && entry.progress?.total
            ? ` · ep ${entry.progress.current ?? 0}/${entry.progress.total}`
            : ''}
        </p>
      </div>
    </div>
  )
}

// ── Empty state ─────────────────────────────────────────────────
function EmptyState({ filtered }) {
  return (
    <div style={{ textAlign: 'center', padding: '3rem 1rem', color: 'var(--text-muted)' }}>
      <div style={{ fontSize: '3rem', marginBottom: '0.75rem' }}>📭</div>
      <p style={{ fontWeight: 600, marginBottom: '0.25rem' }}>
        {filtered ? 'No entries in this category' : 'Your library is empty'}
      </p>
      <p style={{ fontSize: '0.875rem' }}>
        {filtered ? 'Switch tabs to see other media' : 'Go to Discover and add something!'}
      </p>
    </div>
  )
}
// ── Custom Dropdown ────────────────────────────────────────────────
function CustomDropdown({ value, onChange, options }) {
  const [open, setOpen] = useState(false)
  const currentLabel = options.find((o) => o.value === value)?.label || 'Select'

  return (
    <div className="custom-dropdown" onClick={() => setOpen(!open)} onMouseLeave={() => setOpen(false)}>
      <div className="custom-dropdown-btn">
        <span className="nav-icon" style={{ fontSize: '1rem', color: 'var(--text-muted)' }}>filter_list</span>
        <span>{currentLabel}</span>
        <span className="nav-icon" style={{ fontSize: '1rem', color: 'var(--text-muted)' }}>expand_more</span>
      </div>
      {open && (
        <div className="custom-dropdown-menu">
          {options.map((opt) => (
            <div 
              key={opt.value} 
              className={`custom-dropdown-item ${value === opt.value ? 'active' : ''}`}
              onClick={(e) => { e.stopPropagation(); onChange(opt.value); setOpen(false); }}
            >
              {opt.label}
            </div>
          ))}
        </div>
      )}
    </div>
  )
}

// ── Page ───────────────────────────────────────────────────────
export default function LibraryPage() {
  usePageTitle('My Library')
  const [activeTab, setActiveTab] = useState('All')
  const [activeStatus, setActiveStatus] = useState('All')
  const [selectedEntry, setSelectedEntry] = useState(null)
  const { entries, loading, error, updateEntry, removeEntry } = useLibrary()

  // Keep selectedEntry in sync with updates to the master entries array
  const activeEntry = useMemo(() => 
    selectedEntry ? entries.find(e => e._id === selectedEntry._id) || selectedEntry : null,
  [selectedEntry, entries])

  // Derived stats
  const stats = useMemo(() => ({
    total:     entries.length,
    completed: entries.filter((e) => e.status === 'completed').length,
    watching:  entries.filter((e) => e.status === 'in-progress').length,
    planned:   entries.filter((e) => e.status === 'planning').length,
  }), [entries])

  // Total episodes watched across all episodic entries
  const totalEpWatched = useMemo(() =>
    entries.reduce((sum, e) => sum + (EPISODIC_TYPES.has(getType(e)) ? (e.progress?.current ?? 0) : 0), 0),
    [entries]
  )

  // Filtered collection
  const filtered = useMemo(() => {
    let result = entries
    if (activeTab !== 'All') result = result.filter(e => getType(e) === activeTab)
    if (activeStatus !== 'All') result = result.filter(e => e.status === activeStatus)
    return result
  }, [entries, activeTab, activeStatus])

  // Continue watching
  const inProgress = useMemo(() =>
    entries.filter((e) => e.status === 'in-progress'),
    [entries]
  )

  return (
    <>
      <main className="page">
        {error && (
          <div className="auth-error" style={{ marginBottom: '1rem' }}>{error}</div>
        )}

        {/* Filters Row */}
        <div className="library-filters">
          <div className="tab-row" style={{ margin: 0, paddingBottom: 0 }}>
            {TABS.map((tab) => (
              <button
                key={tab}
                className={`chip ${activeTab === tab ? 'chip-active' : 'chip-inactive'}`}
                onClick={() => setActiveTab(tab)}
              >
                {TAB_LABELS[tab]}
              </button>
            ))}
          </div>

          <CustomDropdown 
            value={activeStatus} 
            onChange={setActiveStatus} 
            options={[
              { value: 'All', label: 'All Statuses' },
              { value: 'in-progress', label: 'Watching' },
              { value: 'planning', label: 'Plan to Watch' },
              { value: 'completed', label: 'Completed' },
              { value: 'paused', label: 'Paused' },
              { value: 'dropped', label: 'Dropped' }
            ]}
          />
        </div>
        {/* Stats row */}
        <div style={{ display: 'flex', gap: '0.5rem', marginBottom: '1.5rem', flexWrap: 'wrap' }}>
          {[
            { number: loading ? '–' : stats.total,         label: 'Items'     },
            { number: loading ? '–' : stats.watching,       label: 'Watching'  },
            { number: loading ? '–' : stats.completed,      label: 'Completed' },
            { number: loading ? '–' : totalEpWatched,       label: 'Ep Watched'},
          ].map((s) => (
            <div key={s.label} className="stat-card">
              <div className="stat-number">{s.number}</div>
              <div className="stat-label">{s.label}</div>
            </div>
          ))}
        </div>

        {/* Continue Watching */}
        {(loading || inProgress.length > 0) && (
          <div className="section">
            <div className="section-header">
              <h2>▶ Continue Watching</h2>
            </div>
            <div className="h-scroll">
              {loading
                ? Array.from({ length: 3 }).map((_, i) => (
                    <div key={i} className="cw-card">
                      <div className="cw-backdrop skeleton-shimmer" />
                    </div>
                  ))
                : <div className="cw-row">
                    {inProgress.map((e) => (
                      <CWCard key={e._id} entry={e} onClick={setSelectedEntry} />
                    ))}
                  </div>
              }
            </div>
          </div>
        )}

        {/* Collection grid */}
        <div className="section">
          <div className="section-header">
            <h2>Your Collection</h2>
            {!loading && <span className="label-sm muted">{filtered.length} titles</span>}
          </div>
          {loading ? (
            <div className="library-grid">
              {Array.from({ length: 6 }).map((_, i) => <SkeletonGridCard key={i} />)}
            </div>
          ) : filtered.length === 0 ? (
            <EmptyState filtered={activeTab !== 'All'} />
          ) : (
            <div className="library-grid">
              {filtered.map((entry) => (
                <GridCard key={entry._id} entry={entry} onClick={setSelectedEntry} />
              ))}
            </div>
          )}
        </div>
      </main>

      <button className="fab" title="Add media">
        <span className="nav-icon">add</span>
      </button>

      {/* Media Modal for updating items */}
      {activeEntry && (
        <MediaModal
          item={activeEntry}
          onClose={() => setSelectedEntry(null)}
          inLibrary={true}
          currentStatus={activeEntry.status}
          onRemove={removeEntry}
          onUpdate={updateEntry}
        />
      )}
    </>
  )
}
