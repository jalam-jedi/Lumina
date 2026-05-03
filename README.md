<p align="center">
  <img src="https://img.shields.io/badge/Lumina-Media%20Platform-97A9FF?style=for-the-badge&logo=data:image/svg+xml;base64,PHN2ZyB4bWxucz0iaHR0cDovL3d3dy53My5vcmcvMjAwMC9zdmciIHdpZHRoPSIyNCIgaGVpZ2h0PSIyNCIgdmlld0JveD0iMCAwIDI0IDI0IiBmaWxsPSIjZmZmIj48cGF0aCBkPSJNMTIgMkM2LjQ4IDIgMiA2LjQ4IDIgMTJzNC40OCAxMCAxMCAxMCAxMC00LjQ4IDEwLTEwUzE3LjUyIDIgMTIgMnptLTIgMTVsLTUtNSAxLjQxLTEuNDFMMTAgMTQuMTdsNy41OS03LjU5TDE5IDhsLTkgOXoiLz48L3N2Zz4=&logoColor=white" alt="Lumina Badge" />
  <img src="https://img.shields.io/badge/React-18.x-61DAFB?style=for-the-badge&logo=react&logoColor=white" alt="React" />
  <img src="https://img.shields.io/badge/Node.js-Express-339933?style=for-the-badge&logo=node.js&logoColor=white" alt="Node.js" />
  <img src="https://img.shields.io/badge/MongoDB-Atlas-47A248?style=for-the-badge&logo=mongodb&logoColor=white" alt="MongoDB" />
</p>

# ✨ Lumina — Media Discovery &  Library Platform  a

**Lumina** is a premium, full-stack media tracking and discovery platform. Think  Netflix meets MyAnimeList — a single hub to discover, track, and manage movies, TV shows, anime, manga, and books.

Built with **React 18 + Vite** on the frontend and **Node.js + Express + MongoDB** on the backend, Lumina pulls from **TMDB**, **AniList**, and **Google Books** APIs to offer a rich, unified media experience. 

---

## 🎬 Features

### Discovery & Search 
- **🔥 Hot on Lumina** — Trending carousel showcasing what's popular on the platform
- **Multi-API Discovery** — Movies, TV shows, and anime pulled from TMDB + AniList
- **Netflix-style Search Overlay** — Full-screen search with debounced input, type filters (Movies, TV Shows, Anime, Manga, Books), and recent search history
- **Full Search Results Page** — Press Enter to get paginated results with category and filter support
- **TMDB/AniList Deduplication** — Intelligent dedup favors AniList for anime (richer metadata) while keeping unique TMDB results

### Category Browsing
- **Paginated Browsing** — Browse 35,000+ movies, TV shows, or anime with 25 items per page
- **Advanced Filters** — Filter by year, rating range (min/max), and genre checkboxes
- **Slide-out Filter Panel** — Clean, themed filter sidebar with backdrop blur
- **URL Persistence** — Filters and page state synced to URL search params

### Library Management
- **Personal Library** — Add any media to your library with status tracking (Watching, Completed, Plan to Watch, On Hold, Dropped)
- **Episode Progress** — Track episode/chapter progress with stepper UI and season-level granularity
- **Status Filtering** — Filter your library by watch status with a themed dropdown
- **Type Filtering** — View by media type (Movies, TV Shows, Anime, Books)
- **Stats Dashboard** — Total items, watching, completed, and episodes watched at a glance

### Trending
- **Multi-source Trending** — TMDB trending movies/TV + AniList top anime
- **Tab Navigation** — All, Movies, TV Shows, Anime tabs with ranked list views
- **See All Navigation** — Jump from any section to the full paginated category page

### Profile & Settings
- **Profile Page** — User avatar, stats overview, and settings
- **Theme Toggle** — Hot on Lumina toggle for personalized discovery
- **Sign Out** — Clean logout flow

### UI/UX
- **Netflix-style Scroll Snap** — Horizontal carousels snap into position
- **Persistent Top Bar** — Search icon + profile avatar available on every page
- **Glass Morphism Design** — Frosted glass surfaces with depth hierarchy
- **Smooth Animations** — Entrance animations, hover states, and micro-interactions
- **Fully Responsive** — Mobile-first design that scales beautifully to desktop
- **Dark Theme** — Premium dark UI with gradient accents

---

## 🏗️ Architecture

```
lumina/
├── client/                     # React 18 + Vite frontend
│   ├── src/
│   │   ├── components/         # Reusable UI components
│   │   │   ├── TopBar.jsx      # Persistent app-shell header
│   │   │   ├── SideNav.jsx     # Desktop sidebar navigation
│   │   │   ├── BottomNav.jsx   # Mobile bottom navigation
│   │   │   ├── SearchOverlay.jsx # Full-screen Netflix search
│   │   │   ├── MediaModal.jsx  # Media detail + library actions
│   │   │   └── ProtectedRoute.jsx
│   │   ├── pages/
│   │   │   ├── DiscoveryPage.jsx    # Home — hero + rows
│   │   │   ├── LibraryPage.jsx      # Personal library
│   │   │   ├── TrendingPage.jsx     # Trending rankings
│   │   │   ├── CategoryPage.jsx     # Paginated browse + filters
│   │   │   ├── SearchResultsPage.jsx # Full search results
│   │   │   ├── ProfilePage.jsx      # User profile
│   │   │   └── LoginPage.jsx        # Auth page
│   │   ├── context/            # React contexts
│   │   ├── hooks/              # Custom hooks
│   │   ├── lib/                # API service wrappers
│   │   ├── index.css           # Design system + all styles
│   │   └── App.jsx             # Routes + app shell
│   └── package.json
│
├── server/                     # Node.js + Express backend
│   ├── controllers/
│   │   ├── browseController.js    # Paginated browsing + filters
│   │   ├── searchController.js    # Multi-API search + dedup
│   │   ├── discoveryController.js # Trending/discovery
│   │   ├── libraryController.js   # Library CRUD
│   │   └── mediaController.js     # Custom media
│   ├── services/
│   │   ├── tmdbService.js      # TMDB API integration
│   │   ├── anilistService.js   # AniList GraphQL integration
│   │   ├── googleBooksService.js # Google Books API
│   │   ├── jikanService.js     # Jikan/MAL fallback
│   │   └── normalizer.js       # Cross-API data normalization
│   ├── models/
│   │   ├── User.js             # User model (email + Google OAuth)
│   │   └── LibraryEntry.js     # Library entry with progress tracking
│   ├── routes/                 # Express route definitions
│   ├── middleware/              # Auth middleware
│   ├── config/                 # Passport.js config
│   ├── .env.example            # Environment template (safe)
│   └── index.js                # Server entry point
│
├── .gitignore
└── README.md
```

---

## 🚀 Getting Started

### Prerequisites

- **Node.js** 18+ and **npm**
- **MongoDB Atlas** account (or local MongoDB instance)
- **TMDB API key** — [Get one here](https://www.themoviedb.org/settings/api)
- **Google OAuth credentials** (optional) — [Google Cloud Console](https://console.cloud.google.com/)

### 1. Clone the Repository

```bash
git clone https://github.com/jalam-jedi/Webtech.git
cd Webtech
```

### 2. Set Up the Server

```bash
cd server
npm install
```

Copy the environment template and fill in your credentials:

```bash
cp .env.example .env
```

Edit `.env` with your values:

```env
PORT=5000
MONGO_URI=mongodb+srv://<username>:<password>@<cluster>.mongodb.net/<dbname>
JWT_SECRET=your_random_64_char_hex_string
TMDB_API_KEY=your_tmdb_api_key
GOOGLE_CLIENT_ID=your_google_client_id        # optional
GOOGLE_CLIENT_SECRET=your_google_client_secret  # optional
FRONTEND_URL=http://localhost:5173
```

Start the server:

```bash
node index.js
```

### 3. Set Up the Client

```bash
cd client
npm install
npm run dev
```

The app will be available at **http://localhost:5173**.

---

## 🔌 API Endpoints

### Authentication
| Method | Endpoint | Description |
|--------|----------|-------------|
| `POST` | `/api/auth/register` | Register with email/password |
| `POST` | `/api/auth/login` | Login with email/password |
| `GET` | `/api/auth/me` | Get current user (protected) |
| `GET` | `/api/auth/google` | Initiate Google OAuth |

### Search & Discovery
| Method | Endpoint | Description |
|--------|----------|-------------|
| `GET` | `/api/search?q=&type=` | Multi-API search with dedup |
| `GET` | `/api/discover/trending` | Trending content from all sources |
| `GET` | `/api/browse/:type` | Paginated category browse |
| `GET` | `/api/browse/genres/:type` | Available genres for a type |

**Browse query params:** `page`, `year`, `rating_min`, `rating_max`, `genres` (comma-separated)

### Library (Protected)
| Method | Endpoint | Description |
|--------|----------|-------------|
| `GET` | `/api/library` | Get user's library |
| `POST` | `/api/library` | Add item to library |
| `PATCH` | `/api/library/:id` | Update entry (status, progress) |
| `DELETE` | `/api/library/:id` | Remove from library |

### Media
| Method | Endpoint | Description |
|--------|----------|-------------|
| `GET` | `/api/media/seasons?source=tmdb&id=` | Get TV show season data |
| `POST` | `/api/media/custom` | Create custom media (protected) |

---

## 🎨 Design System

Lumina uses a custom design system built with CSS custom properties:

| Token | Value | Usage |
|-------|-------|-------|
| `--bg` | `#0c0e10` | Page background |
| `--surface-low` | `#13161a` | Cards, panels |
| `--surface-mid` | `#1a1d23` | Inputs, dropdowns |
| `--primary` | `#97a9ff` | Accent color |
| `--primary-grad` | Linear gradient | Buttons, avatars |
| `--font-display` | `'Outfit'` | Headings |
| `--font-body` | `'Inter'` | Body text |

### Surface Hierarchy
```
bg → surface-low → surface-mid → surface-high → surface-top
```
Each level adds visual depth through progressive lightening.

---

## 📱 Responsive Design

| Breakpoint | Layout |
|------------|--------|
| < 768px | Mobile — Bottom nav, single column, touch optimized |
| 768–1024px | Tablet — Adaptive grid (3-4 columns) |
| > 1024px | Desktop — Side nav + main content, 5-6 column grids |

---

## 🔒 Security

- **JWT Authentication** — Token-based auth with secure password hashing (bcrypt)
- **Google OAuth** — Passport.js integration for Google sign-in
- **Environment Variables** — All secrets stored in `.env` (never committed)
- **CORS** — Configured for frontend origin only
- **Input Validation** — Server-side validation on all endpoints
- **API Key Protection** — All external API keys server-side only

---

## 📦 Tech Stack

| Layer | Technology |
|-------|-----------|
| **Frontend** | React 18, Vite, React Router v6 |
| **Styling** | Vanilla CSS (custom design system) |
| **Backend** | Node.js, Express.js |
| **Database** | MongoDB Atlas, Mongoose |
| **Auth** | JWT, bcrypt, Passport.js (Google OAuth) |
| **APIs** | TMDB, AniList (GraphQL), Google Books, Jikan |
| **Caching** | node-cache (in-memory, per-service) |

---

## 📄 License

This project is for educational and personal use .

---

<p align="center">
  Built with ☕ and a lot of late nights.
</p>
