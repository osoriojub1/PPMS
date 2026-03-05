# PPMS for Pregnant Women (Prenatal Patient Management System)

A comprehensive management system designed for Barangay Health Workers (BHW) and Administrators to track and manage maternal care for pregnant women.

## Features

- **Admin Portal**: Dashboard, patient management, referral tracking, user management, and settings.
- **BHW Portal**: Patient registration, maternal care tracking, referrals, and patient records.
- **Maternal Care Milestones**: Track progress and findings throughout the pregnancy.
- **Referral System**: Seamless transfer of findings and patient data between BHWs and Administrators.

## Tech Stack

- **Frontend**: React 19, TypeScript, Vite
- **Styling**: Tailwind CSS 4
- **Backend & Database**: Supabase (PostgreSQL)
- **Routing**: React Router 7
- **UI Components**: Lucide React (Icons), TanStack Table

## Key Dependencies

### Core
- `react`, `react-dom`: UI library
- `react-router-dom`: Client-side routing
- `@supabase/supabase-js`: Database and authentication client
- `@tanstack/react-table`: Powerful data table management
- `lucide-react`: Icon set

### Styling & Build
- `tailwindcss`: Utility-first CSS framework
- `@tailwindcss/vite`, `@tailwindcss/postcss`: Integration with Vite and PostCSS
- `autoprefixer`: CSS vendor prefixing
- `vite`: Build tool and dev server
- `typescript`: Type safety

## Getting Started

### Prerequisites
- Node.js (Latest LTS recommended)
- npm or yarn

### Installation
1. Clone the repository:
   ```bash
   git clone https://github.com/osoriojub1/PPMS.git
   ```
2. Install dependencies:
   ```bash
   npm install
   ```

### Development
Start the development server:
```bash
npm run dev
```

### Build
Generate a production-ready build:
```bash
npm run build
```

## Environment Setup
Create a `.env` file based on `.env.example` and add your Supabase credentials:
```env
VITE_SUPABASE_URL=your_supabase_url
VITE_SUPABASE_ANON_KEY=your_supabase_anon_key
```

