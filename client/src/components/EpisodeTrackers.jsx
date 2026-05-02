import { useState, useMemo, useCallback, useRef, useEffect } from 'react'
import { libraryService } from '../lib/libraryService'

// ── Helpers ────────────────────────────────────────────────────
const getType = (e) => e.mediaSnapshot?.type || e.media?.type || 'movie'
const getUnit = (e) => {
  if (e.progress?.unit) return e.progress.unit
  return getType(e) === 'manga' ? 'chapters' : 'episodes'
}

// ── Debounce hook ──────────────────────────────────────────────
function useDebounce(fn, delay) {
  const timer = useRef(null)
  return useCallback((...args) => {
    clearTimeout(timer.current)
    timer.current = setTimeout(() => fn(...args), delay)
  }, [fn, delay])
}

// ── SeasonTracker — for TV shows with real TMDB season data ───
export function SeasonTracker({ entry, onUpdate }) {
  const [seasons, setSeasons] = useState(null)
  const [fetchErr, setFetchErr] = useState(false)
  const [expanded, setExpanded] = useState({})
  const [watchedMap, setWatchedMap] = useState({})
  const [saving, setSaving] = useState(false)

  // 1. Fetch seasons on mount
  useEffect(() => {
    let active = true
    const src = entry.mediaSnapshot?.source || entry.media?.source
    const eid = entry.mediaSnapshot?.externalId || entry.media?.externalId

    if (src !== 'tmdb' || !eid) {
      if (active) setFetchErr(true)
      return
    }

    libraryService.getSeasons(src, eid)
      .then((data) => {
        if (!active) return
        if (!data.seasons || data.seasons.length === 0) {
          setFetchErr(true)
        } else {
          setSeasons(data.seasons)
          // Default expand first season
          if (data.seasons.length > 0) {
            setExpanded({ [data.seasons[0].season]: true })
          }
        }
      })
      .catch(() => { if (active) setFetchErr(true) })

    return () => { active = false }
  }, [entry.mediaSnapshot?.externalId, entry.media?.externalId, entry.mediaSnapshot?.source, entry.media?.source])

  // 2. Sync watchedMap from entry.extra.seasons
  useEffect(() => {
    const map = {}
    const extraSeasons = entry.extra?.seasons || []
    for (const s of extraSeasons) {
      map[s.season] = s.watched || 0
    }
    setWatchedMap(map)
  }, [entry._id, entry.extra?.seasons])

  // 3. Persist progress + auto-transition status
  const persist = useDebounce(async (nextMap, seasonList) => {
    setSaving(true)
    try {
      const extraSeasons = seasonList.map((s) => ({
        season:       s.season,
        name:         s.name,
        episodeCount: s.episodeCount,
        watched:      nextMap[s.season] ?? 0,
      }))
      const totalWatched = extraSeasons.reduce((sum, s) => sum + s.watched, 0)
      const totalEps     = seasonList.reduce((sum, s) => sum + s.episodeCount, 0)

      const updates = {
        progress: { current: totalWatched, total: totalEps, unit: 'episodes' },
        extra:    { seasons: extraSeasons },
      }
      
      // Auto status transitions
      if (totalWatched > 0 && entry.status === 'planning') updates.status = 'in-progress'
      if (totalWatched >= totalEps && entry.status !== 'completed') updates.status = 'completed'
      
      // Auto-revert logic: if decrementing from completed
      if (totalWatched < totalEps && entry.status === 'completed') updates.status = 'in-progress'

      await onUpdate(entry._id, updates)
    } finally {
      setSaving(false)
    }
  }, 700)

  const step = (seasonNum, delta, seasonList) => {
    const s    = seasonList.find((s) => s.season === seasonNum)
    if (!s) return
    const cur  = watchedMap[seasonNum] ?? 0
    const next = Math.max(0, Math.min(s.episodeCount, cur + delta))
    if (next === cur) return
    const nextMap = { ...watchedMap, [seasonNum]: next }
    setWatchedMap(nextMap)
    persist(nextMap, seasonList)
  }

  // Loading state
  if (seasons === null && !fetchErr) {
    return (
      <div className="season-tracker-loading">
        <div className="skeleton-shimmer" style={{ height: '2.5rem', borderRadius: '0.5rem' }} />
      </div>
    )
  }

  // Fallback: no seasons data → show flat stepper
  if (fetchErr || !seasons || seasons.length === 0) {
    return <EpisodeStepper entry={entry} onUpdate={onUpdate} />
  }

  const totalWatched = seasons.reduce((sum, s) => sum + (watchedMap[s.season] ?? 0), 0)
  const totalEps     = seasons.reduce((sum, s) => sum + s.episodeCount, 0)
  const globalPct    = totalEps ? Math.round((totalWatched / totalEps) * 100) : 0

  return (
    <div className="season-tracker" onClick={(e) => e.stopPropagation()}>
      {/* Global progress bar */}
      <div className="season-tracker-header">
        <span className="season-tracker-total">
          {totalWatched} / {totalEps} episodes
        </span>
        {saving && <span className="ep-saving-dot" title="Saving…" />}
      </div>
      <div className="progress-bar" style={{ marginBottom: '0.75rem' }}>
        <div className="progress-fill" style={{ width: `${globalPct}%` }} />
      </div>

      {/* Per-season rows */}
      <div className="season-list">
        {seasons.map((s) => {
          const watched  = watchedMap[s.season] ?? 0
          const pct      = Math.round((watched / s.episodeCount) * 100)
          const done     = watched >= s.episodeCount
          const isOpen   = expanded[s.season] ?? false

          return (
            <div key={s.season} className={`season-row ${done ? 'season-done' : ''}`}>
              {/* Season header — click to expand */}
              <div
                className="season-row-header"
                onClick={() => setExpanded((prev) => ({ ...prev, [s.season]: !prev[s.season] }))}
              >
                <span className="season-chevron">{isOpen ? '▾' : '▸'}</span>
                <span className="season-name">{s.name}</span>
                <div className="season-progress-bar">
                  <div
                    className={`season-progress-fill ${done ? 'season-progress-done' : ''}`}
                    style={{ width: `${pct}%` }}
                  />
                </div>
                <span className="season-count">{watched}/{s.episodeCount}</span>
                {done && <span className="season-done-badge">✓</span>}
              </div>

              {/* Expanded stepper */}
              {isOpen && (
                <div className="season-row-stepper">
                  <button
                    className="ep-btn-sm"
                    onClick={() => step(s.season, -1, seasons)}
                    disabled={watched <= 0}
                    aria-label={`Previous episode in ${s.name}`}
                  >−</button>

                  <div className="season-ep-track">
                    {Array.from({ length: s.episodeCount }).map((_, i) => (
                      <button
                        key={i}
                        className={`ep-pip ${i < watched ? 'ep-pip-watched' : ''}`}
                        onClick={() => {
                          const next = i < watched ? i : i + 1 // click watched pip → rewind to that ep
                          const nextMap = { ...watchedMap, [s.season]: next }
                          setWatchedMap(nextMap)
                          persist(nextMap, seasons)
                        }}
                        title={`Episode ${i + 1}`}
                        aria-label={`Episode ${i + 1}${i < watched ? ' (watched)' : ''}`}
                      />
                    ))}
                  </div>

                  <button
                    className="ep-btn-sm ep-btn-plus"
                    onClick={() => step(s.season, 1, seasons)}
                    disabled={watched >= s.episodeCount}
                    aria-label={`Next episode in ${s.name}`}
                  >+</button>
                </div>
              )}
            </div>
          )
        })}
      </div>
    </div>
  )
}

// ── Episode stepper (flat — for anime & manga) ─────────────────
export function EpisodeStepper({ entry, onUpdate, compact = false }) {
  const type    = getType(entry)
  const isBook  = type === 'book' || type === 'movie'
  if (isBook) return null

  const unit    = getUnit(entry)
  const total   = entry.progress?.total  ?? null
  const [current, setCurrent] = useState(entry.progress?.current ?? 0)
  const [saving,  setSaving]  = useState(false)

  // Keep local state in sync when entry is updated externally
  useEffect(() => { setCurrent(entry.progress?.current ?? 0) }, [entry._id, entry.progress?.current])

  const saveProgress = useDebounce(async (next) => {
    setSaving(true)
    try {
      const updates = { progress: { current: next, total, unit } }
      // Auto-status transitions
      if (next > 0 && entry.status === 'planning') updates.status = 'in-progress'
      if (total && next >= total && entry.status !== 'completed') updates.status = 'completed'
      
      // Auto-revert logic
      if (total && next < total && entry.status === 'completed') updates.status = 'in-progress'
      
      await onUpdate(entry._id, updates)
    } finally { setSaving(false) }
  }, 600)

  const step = (delta) => {
    const next = Math.max(0, Math.min(total ?? Infinity, current + delta))
    if (next === current) return
    setCurrent(next)
    saveProgress(next)
  }

  const handleInput = (e) => {
    const v = parseInt(e.target.value, 10)
    if (isNaN(v) || v < 0) return
    const next = total ? Math.min(v, total) : v
    setCurrent(next)
    saveProgress(next)
  }

  if (compact) {
    return (
      <div className="ep-stepper-compact" onClick={(e) => e.stopPropagation()}>
        <button className="ep-btn-sm" onClick={() => step(-1)} aria-label="minus">−</button>
        <span className="ep-label-sm">
          {current}{total ? `/${total}` : ''} {unit}
        </span>
        <button className="ep-btn-sm ep-btn-plus" onClick={() => step(1)} aria-label="plus">+</button>
        {saving && <span className="ep-saving" title="Saving…">●</span>}
      </div>
    )
  }

  return (
    <div className="ep-stepper" onClick={(e) => e.stopPropagation()}>
      <button className="ep-btn" onClick={() => step(-1)} disabled={current === 0} aria-label="Previous episode">
        <span className="nav-icon" style={{ fontSize: '1rem' }}>remove</span>
      </button>
      <div className="ep-count">
        <input
          className="ep-input"
          type="number"
          min={0}
          max={total ?? undefined}
          value={current}
          onChange={handleInput}
          aria-label={`${unit} watched`}
        />
        <span className="ep-total">{total ? `/ ${total}` : ''} {unit}</span>
      </div>
      <button className="ep-btn ep-btn-plus" onClick={() => step(1)} disabled={total !== null && current >= total} aria-label="Next episode">
        <span className="nav-icon" style={{ fontSize: '1rem' }}>add</span>
      </button>
      {saving && <span className="ep-saving-dot" title="Saving…" />}
    </div>
  )
}
