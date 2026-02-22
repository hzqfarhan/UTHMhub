# UTHMhub — UTHM Student Companion

A production-ready Progressive Web App (PWA) for UTHM university students. Your daily academic productivity companion.

## Features

- **GPA Calculator** — Add semesters, subjects, calculate GPA & CGPA
- **GPA Predictor** — Target CGPA, min grades per subject, final exam calculator
- **Smart Takwim** — Academic calendar with UTHM Semester II 2025/2026 events
- **Dashboard** — CGPA overview, countdown, study streak, progress chart
- **Quick Links** — One-click access to UTHM portals

## Tech Stack

- **Next.js 14+** (App Router, TypeScript)
- **TailwindCSS** + custom glassmorphism design system
- **Framer Motion** for animations
- **Recharts** for CGPA progress graph
- **Supabase** (scaffolded — works offline with localStorage)
- **PWA** — installable with offline support

## Getting Started

### Prerequisites
- Node.js 18+
- npm

### Installation

```bash
# Clone the repo
git clone <your-repo-url>
cd hubuthm

# Install dependencies
npm install

# Copy environment file
cp .env.example .env.local

# Start dev server
npm run dev
```

Open [http://localhost:3000](http://localhost:3000) in your browser.

### Supabase (Optional)

To enable cloud sync and auth:

1. Create a project at [supabase.com](https://supabase.com)
2. Run `src/lib/supabase/schema.sql` in the SQL editor
3. Copy your project URL and anon key to `.env.local`:
   ```
   NEXT_PUBLIC_SUPABASE_URL=your-url
   NEXT_PUBLIC_SUPABASE_ANON_KEY=your-key
   ```

## Project Structure

```
src/
├── app/                    # Next.js App Router pages
│   ├── page.tsx           # Dashboard
│   ├── calculator/        # GPA Calculator
│   ├── predictor/         # GPA Predictor
│   ├── calendar/          # Academic Calendar
│   └── quick-links/       # Quick Access Hub
├── components/
│   ├── layout/            # Sidebar, Navbar
│   └── features/          # CGPA Chart, etc.
├── hooks/                 # Custom React hooks
├── lib/                   # Utilities & data
│   ├── gpa-utils.ts       # GPA calculation
│   ├── predictor-utils.ts # Prediction algorithms
│   ├── calendar-data.ts   # Academic events
│   └── supabase/          # Supabase client & schema
└── types/                 # TypeScript interfaces
```

## Deployment

Optimized for **Vercel**:

```bash
npm run build
```

Or deploy directly via the Vercel dashboard.

## License

Built for UTHM students. MIT License.
