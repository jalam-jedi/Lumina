/* Poster colours used when no real image is available */
const PALETTE = [
  'linear-gradient(135deg,#1a1f3c,#2d3a8c)',
  'linear-gradient(135deg,#1c2b1a,#2d6a4f)',
  'linear-gradient(135deg,#2b1a1a,#8c2d2d)',
  'linear-gradient(135deg,#1a2b2b,#2d6a6a)',
  'linear-gradient(135deg,#2b1a2b,#6a2d8c)',
  'linear-gradient(135deg,#2b2b1a,#8c7a2d)',
]

export function PosterThumb({ index = 0, emoji, style = {} }) {
  return (
    <div
      className="poster-thumb"
      style={{ background: PALETTE[index % PALETTE.length], ...style }}
    >
      {emoji}
    </div>
  )
}

export function GridPoster({ index = 0, emoji, style = {} }) {
  return (
    <div
      className="grid-poster"
      style={{ background: PALETTE[index % PALETTE.length], ...style }}
    >
      {emoji}
    </div>
  )
}

export function BackdropThumb({ index = 0, emoji, style = {} }) {
  return (
    <div
      className="cw-backdrop"
      style={{ background: PALETTE[index % PALETTE.length], ...style }}
    >
      {emoji}
    </div>
  )
}

export function TrendThumb({ index = 0, emoji }) {
  return (
    <div
      className="trend-thumb"
      style={{ background: PALETTE[index % PALETTE.length] }}
    >
      {emoji}
    </div>
  )
}
