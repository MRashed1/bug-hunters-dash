# The Breach Dashboard

A cyber-themed real-time hub for a 4-man bug bounty squad, built with Next.js, TypeScript, Tailwind CSS, Radix UI, Framer Motion, and Supabase.

## Features

- **Real-time Status Engine**: Live status updates for squad members (HUNTING, RESEARCHING, IDLE, OFFLINE) with breathing glow animations.
- **Session Controller**: Start/stop hunting sessions with integrated timer and progress tracking.
- **Activity Log**: Terminal-style feed for bug discoveries, lab activities, and writeups.
- **Shared Intelligence**: Grid of cards with tilt effects and copy-to-clipboard functionality.
- **Responsive Design**: Ultra-dark cyber-noir theme with glassmorphism and subtle animations.

## Tech Stack

- **Framework**: Next.js 14 (App Router)
- **Language**: TypeScript (Strict mode)
- **Styling**: Tailwind CSS + Radix UI (Primitives) + Lucide Icons
- **Animations**: Framer Motion
- **Backend**: Supabase (PostgreSQL + Realtime Subscriptions)

## Setup Instructions

### 1. Install Dependencies

```bash
npm install
```

### 2. Set up Supabase

1. Create a new project at [supabase.com](https://supabase.com)
2. Go to Settings > API to get your project URL and anon key
3. Update `.env.local` with your Supabase credentials:

```env
NEXT_PUBLIC_SUPABASE_URL=your_supabase_project_url
NEXT_PUBLIC_SUPABASE_ANON_KEY=your_supabase_anon_key
```

### 3. Create Database Tables

Run the following SQL in your Supabase SQL Editor:

```sql
-- Create profiles table
CREATE TABLE profiles (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name TEXT NOT NULL,
  avatar_url TEXT,
  status TEXT CHECK (status IN ('HUNTING', 'RESEARCHING', 'IDLE', 'OFFLINE')) DEFAULT 'OFFLINE',
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Create activities table
CREATE TABLE activities (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID REFERENCES profiles(id) ON DELETE CASCADE,
  action_type TEXT CHECK (action_type IN ('BUG', 'LAB', 'WRITEUP')) NOT NULL,
  details TEXT NOT NULL,
  timestamp TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Enable Row Level Security (optional, for production)
ALTER TABLE profiles ENABLE ROW LEVEL SECURITY;
ALTER TABLE activities ENABLE ROW LEVEL SECURITY;

-- Create policies (adjust as needed)
CREATE POLICY "Allow all operations on profiles" ON profiles FOR ALL USING (true);
CREATE POLICY "Allow all operations on activities" ON activities FOR ALL USING (true);

-- Insert sample data (4 squad members)
INSERT INTO profiles (name, status) VALUES
  ('Alice', 'HUNTING'),
  ('Bob', 'RESEARCHING'),
  ('Charlie', 'IDLE'),
  ('Diana', 'OFFLINE');
```

### 4. Enable Realtime

In Supabase Dashboard:
- Go to Database > Replication
- Enable realtime for `profiles` and `activities` tables

### 5. Run the Development Server

```bash
npm run dev
```

Open [http://localhost:3000](http://localhost:3000) to view the dashboard.

## Project Structure

```
src/
├── components/
│   ├── ui/           # Reusable UI components (Avatar, Button)
│   ├── StatusAvatar.tsx      # Avatar with status ring
│   ├── SessionController.tsx # Timer and session management
│   └── RealtimeFeed.tsx      # Activity log with realtime updates
├── lib/
│   ├── supabase.ts   # Supabase client configuration
│   └── utils.ts      # Utility functions (cn)
└── types/
    └── database.ts   # TypeScript types for database schema

app/
├── globals.css       # Global styles
├── layout.tsx        # Root layout
└── page.tsx          # Main dashboard page
```

## Customization

- **Colors**: Update color palette in component files (e.g., status colors in `StatusAvatar.tsx`)
- **Animations**: Modify Framer Motion configurations for different effects
- **Database**: Add more fields or tables as needed for your squad's workflow

## Deployment

Deploy to Vercel, Netlify, or any platform supporting Next.js. Make sure to set environment variables in your deployment platform.

## Contributing

Feel free to enhance the dashboard with additional features like:
- User authentication
- File uploads for reports
- Advanced progress tracking
- Notification system
- Dark/light theme toggle

Enjoy hunting! 🐛🔍
