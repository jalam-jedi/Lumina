/**
 * MediaModal.jsx
 *
 * Netflix-style detail sheet that slides up when the user clicks any media card.
 * Shows:
 *  - Banner/backdrop image (or poster fallback) with cinematic gradient overlay
 *  - Title, year, score, genres, format/type badge
 *  - Synopsis (truncated with expand)
 *  - Status picker: Plan to Watch / Watching / Completed / Paused / Dropped
 *  - "Add to Library" CTA — disabled if already in library
 *  - Remove from library option if already added
 *
 * Usage:
 *   <MediaModal item={selectedItem} onClose={…} onAdd={…} onRemove={…} inLibrary={bool} currentStatus={str} />
 */
import { useState, useEffect, useRef } from 'react'
import { SeasonTracker, EpisodeStepper } from './EpisodeTrackers'

// ── Status options ──────────────────────────────────────────────
const STATUSES = [
  { value: 'planning',    label: 'Plan to Watch', icon: 'bookmark',       color: '#7c8bff' },
  { value: 'in-progress', label: 'Watching',      icon: 'play_arrow',     color: '#34d399' },
  { value: 'completed',   label: 'Completed',     icon: 'check_circle',   color: '#a78bfa' },
  { value: 'paused',      label: 'Paused',        icon: 'pause_circle',   color: '#fbbf24' },
  { value: 'dropped',     label: 'Dropped',       icon: 'cancel',         color: '#f87171' },
]

const TYPE_LABELS = {
  movie:  '🎬 Movie',
  tvshow: '📺 TV Show',
  anime:  '⛩️ Anime',
  manga:  '📖 Manga',
  book:   '📚 Book',
}

// ── Helpers ─────────────────────────────────────────────────────
function stripHtml(html) {
  return (html || '').replace(/<[^>]*>/g, '').replace(/&[^;]+;/g, ' ').trim()
}

// ── Main Modal ──────────────────────────────────────────────────
export default function MediaModal({ item, entry, entryId, onClose, onAdd, onRemove, inLibrary, currentStatus, onUpdate }) {
  const [selectedStatus, setSelectedStatus] = useState(currentStatus || 'planning')
  const [expanded,       setExpanded]       = useState(false)
  const [busy,           setBusy]           = useState(false)
  const [errorMsg,       setErrorMsg]       = useState('')
  const [addedLocally,   setAddedLocally]   = useState(false)  // tracks add within this modal session
  const [localAddedEntry, setLocalAddedEntry] = useState(null)
  const [localEntryId,   setLocalEntryId]   = useState(entryId || entry?._id)
  const overlayRef = useRef(null)

  const handleStatusChange = async (newStatus) => {
    setSelectedStatus(newStatus)
    const idToUpdate = localEntryId || entryId || entry?._id || item._id
    if ((inLibrary || addedLocally) && onUpdate && idToUpdate) {
      try {
        setBusy(true)
        setErrorMsg('')
        await onUpdate(idToUpdate, { status: newStatus })
      } catch (err) {
        setErrorMsg(err?.response?.data?.error || err?.message || 'Failed to update status')
      } finally {
        setBusy(false)
      }
    }
  }

  // Update selected status if prop changes (e.g. library updated externally)
  useEffect(() => {
    setSelectedStatus(currentStatus || 'planning')
  }, [currentStatus, item?.externalId])

  useEffect(() => {
    if (entryId) setLocalEntryId(entryId)
    if (entry?._id) setLocalEntryId(entry._id)
  }, [entryId, entry])

  // Keyboard: Escape closes
  useEffect(() => {
    const handler = (e) => { if (e.key === 'Escape') onClose() }
    window.addEventListener('keydown', handler)
    return () => window.removeEventListener('keydown', handler)
  }, [onClose])

  // Lock scroll while open
  useEffect(() => {
    document.body.style.overflow = 'hidden'
    return () => { document.body.style.overflow = '' }
  }, [])

  if (!item) return null

  const synopsis     = stripHtml(item.synopsis)
  const preview      = synopsis.slice(0, 240)
  const hasMore      = synopsis.length > 240
  const backdrop     = item.metadata?.bannerImage || item.metadata?.backdropPath || ''
  const cover        = item.coverImage || ''
  const score        = item.score ? item.score.toFixed(1) : null
  const genres       = (item.genres || []).slice(0, 4)
  const typeLabel    = TYPE_LABELS[item.type] || item.type

  const handleAdd = async () => {
    if (busy) return
    setBusy(true)
    setErrorMsg('')
    try {
      const addedEntry = await onAdd(item, selectedStatus)
      if (addedEntry && addedEntry._id) {
        setLocalEntryId(addedEntry._id)
        setLocalAddedEntry(addedEntry)
      }
      setAddedLocally(true)  // show in-library state immediately
    } catch (err) {
      const msg = err?.response?.data?.error || err?.message || 'Failed to add to library'
      if (msg.toLowerCase().includes('already in your library')) {
        // Treat as success — it's already there
        setAddedLocally(true)
      } else {
        setErrorMsg(msg)
      }
    } finally {
      setBusy(false)
    }
  }

  const handleRemove = async () => {
    if (busy) return
    setBusy(true)
    setErrorMsg('')
    try {
      await onRemove(item)
      setAddedLocally(false)
    } catch (err) {
      setErrorMsg(err?.response?.data?.error || 'Failed to remove')
    } finally {
      setBusy(false)
    }
  }

  const handleOverlayClick = (e) => {
    if (e.target === overlayRef.current) onClose()
  }

  return (
    <div
      ref={overlayRef}
      className="modal-overlay"
      onClick={handleOverlayClick}
      role="dialog"
      aria-modal="true"
      aria-label={item.title}
    >
      <div className="modal-sheet">
        {/* ── Backdrop ── */}
        <div className="modal-backdrop">
          {backdrop || cover ? (
            <img
              src={backdrop || cover}
              alt={item.title}
              className="modal-backdrop-img"
              onError={(e) => { e.target.style.display = 'none' }}
            />
          ) : (
            <div className="modal-backdrop-fallback">
              {item.type === 'anime' ? '⛩️' : item.type === 'movie' ? '🎬' : '📺'}
            </div>
          )}
          <div className="modal-backdrop-grad" />

          {/* Close button */}
          <button className="modal-close-btn" onClick={onClose} aria-label="Close">
            <span className="nav-icon">close</span>
          </button>

          {/* Cover poster floated bottom-left */}
          {cover && (
            <div className="modal-cover-thumb">
              <img src={cover} alt={item.title} onError={(e) => { e.target.style.display='none' }} />
            </div>
          )}
        </div>

        {/* ── Content ── */}
        <div className="modal-content">
          {/* Meta row */}
          <div className="modal-meta-row">
            <span className="modal-type-badge">{typeLabel}</span>
            {item.year && <span className="modal-meta-chip">{item.year}</span>}
            {score     && <span className="modal-meta-chip" style={{ color: '#fbbf24' }}>★ {score}</span>}
            {item.metadata?.episodes && (
              <span className="modal-meta-chip">{item.metadata.episodes} ep</span>
            )}
            {item.metadata?.format && (
              <span className="modal-meta-chip">{item.metadata.format}</span>
            )}
          </div>

          {/* Title */}
          <h2 className="modal-title">{item.title}</h2>

          {/* Genre tags */}
          {genres.length > 0 && (
            <div className="modal-genres">
              {genres.map((g) => (
                <span key={g} className="modal-genre-tag">{g}</span>
              ))}
            </div>
          )}

          {/* Studios / Authors */}
          {item.metadata?.studios?.length > 0 && (
            <p className="modal-studios">
              <span style={{ color: 'var(--text-muted)' }}>by </span>
              {item.metadata.studios.slice(0, 2).join(', ')}
            </p>
          )}

          {/* Synopsis */}
          {synopsis && (
            <div className="modal-synopsis">
              <p>
                {expanded || !hasMore ? synopsis : preview + '…'}
                {hasMore && (
                  <button
                    className="modal-expand-btn"
                    onClick={() => setExpanded(!expanded)}
                  >
                    {expanded ? ' less' : ' more'}
                  </button>
                )}
              </p>
            </div>
          )}

          {/* ── Status picker ── */}
          <div className="modal-section-label">{(inLibrary || addedLocally) ? 'Status:' : 'Add to library as:'}</div>
          <div className="modal-status-grid">
            {STATUSES.map((s) => (
              <button
                key={s.value}
                className={`modal-status-btn ${selectedStatus === s.value ? 'modal-status-active' : ''}`}
                style={selectedStatus === s.value ? { '--status-color': s.color } : {}}
                onClick={() => handleStatusChange(s.value)}
              >
                <span className="nav-icon" style={{ fontSize: '1.1rem', color: selectedStatus === s.value ? s.color : 'var(--text-muted)' }}>
                  {s.icon}
                </span>
                <span>{s.label}</span>
              </button>
            ))}
          </div>

          {/* ── Episode Tracker (Only if in library) ── */}
          {(inLibrary || addedLocally) && (
            item.type === 'tvshow' || item.mediaSnapshot?.type === 'tvshow' || item.media?.type === 'tvshow'
              ? <div style={{ marginTop: '1.5rem' }}><SeasonTracker entry={localAddedEntry || entry || item} onUpdate={onUpdate} /></div>
              : ['anime', 'manga'].includes(item.type || item.mediaSnapshot?.type || item.media?.type) && (
                  <div style={{ marginTop: '1.5rem' }}><EpisodeStepper entry={localAddedEntry || entry || item} onUpdate={onUpdate} /></div>
                )
          )}

          {/* ── Error message ── */}
          {errorMsg && (
            <div className="modal-error-msg">
              <span className="nav-icon" style={{ fontSize: '0.9rem' }}>error_outline</span>
              {errorMsg}
            </div>
          )}

          {/* ── CTA ── */}
          <div className="modal-cta-row">
            {(inLibrary || addedLocally) ? (
              <>
                <div className="modal-in-library-badge">
                  <span className="nav-icon" style={{ fontSize: '1rem' }}>check_circle</span>
                  In Library · {STATUSES.find(s => s.value === (addedLocally ? selectedStatus : currentStatus))?.label || currentStatus || selectedStatus}
                </div>
                <button
                  className="btn modal-remove-btn"
                  onClick={handleRemove}
                  disabled={busy}
                >
                  <span className="nav-icon" style={{ fontSize: '1rem' }}>delete</span>
                  Remove
                </button>
              </>
            ) : (
              <button
                className="btn btn-primary modal-add-btn"
                onClick={handleAdd}
                disabled={busy}
              >
                <span className="nav-icon" style={{ fontSize: '1.1rem' }}>
                  {busy ? 'hourglass_empty' : 'add'}
                </span>
                {busy ? 'Adding…' : `Add as "${STATUSES.find(s => s.value === selectedStatus)?.label}"`}
              </button>
            )}
          </div>
        </div>
      </div>
    </div>
  )
}
