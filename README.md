# The Breach Dashboard

A cyber-themed real-time hub for a 4-man bug bounty squad, built with Next.js, TypeScript, Tailwind CSS, Radix UI, Framer Motion, and Supabase.

## Features

- **🔐 Authentication System**: Complete user authentication with Supabase Auth including login, signup, and password reset
- **Real-time Status Engine**: Live status updates for squad members (HUNTING, RESEARCHING, IDLE, OFFLINE) with breathing glow animations
- **Session Controller**: Start/stop hunting sessions with integrated timer and progress tracking
- **Activity Log**: Terminal-style feed for bug discoveries, lab activities, and writeups
- **Shared Intelligence**: Grid of cards with tilt effects and copy-to-clipboard functionality
- **Responsive Design**: Ultra-dark cyber-noir theme with glassmorphism and subtle animations
- **Password Reset**: Unified password reset system accessible from login page

## Tech Stack

- **Framework**: Next.js 16.1.4 (App Router)
- **Language**: TypeScript (Strict mode)
- **Styling**: Tailwind CSS + Radix UI (Primitives) + Lucide Icons
- **Animations**: Framer Motion
- **Backend**: Supabase (PostgreSQL + Realtime Subscriptions + Authentication)
- **Deployment**: Vercel-ready with environment variable configuration

## Setup Instructions

### 1. Install Dependencies

```bash
npm install
```

### 2. Set up Supabase

1. Create a new project at [supabase.com](https://supabase.com)
2. Go to Settings > API to get your project URL and anon key
3. Configure Authentication settings:
   - Go to Authentication > Settings
   - Set Site URL to your deployment URL (e.g., `https://your-app.vercel.app`)
   - Add redirect URLs for authentication callbacks
4. Update `.env.local` with your Supabase credentials:

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

-- Enable Row Level Security
ALTER TABLE profiles ENABLE ROW LEVEL SECURITY;
ALTER TABLE activities ENABLE ROW LEVEL SECURITY;

-- Create policies for authenticated users
CREATE POLICY "Users can view all profiles" ON profiles FOR SELECT USING (true);
CREATE POLICY "Users can update their own profile" ON profiles FOR UPDATE USING (auth.uid() = id);
CREATE POLICY "Users can insert their own profile" ON profiles FOR INSERT WITH CHECK (auth.uid() = id);

CREATE POLICY "Users can view all activities" ON activities FOR SELECT USING (true);
CREATE POLICY "Users can insert activities" ON activities FOR INSERT WITH CHECK (auth.uid() = user_id);

-- Insert sample data (4 squad members)
INSERT INTO profiles (id, name, status) VALUES
  (gen_random_uuid(), 'Alice', 'HUNTING'),
  (gen_random_uuid(), 'Bob', 'RESEARCHING'),
  (gen_random_uuid(), 'Charlie', 'IDLE'),
  (gen_random_uuid(), 'Diana', 'OFFLINE');
```

### 4. Enable Realtime

In Supabase Dashboard:
- Go to Database > Replication
- Enable realtime for `profiles` and `activities` tables

### 5. Configure Authentication Redirects

In Supabase Dashboard:
- Go to Authentication > URL Configuration
- Set Site URL to your production URL
- Add the following redirect URLs:
  - `http://localhost:3000/auth/callback` (for development)
  - `https://your-app.vercel.app/auth/callback` (for production)

### 6. Run the Development Server

```bash
npm run dev
```

Open [http://localhost:3000](http://localhost:3000) to view the dashboard.

## Authentication Flow

The application includes a complete authentication system:

- **Login Page** (`/login`): User authentication with email/password
- **Signup Page** (`/signup`): New user registration
- **Password Reset** (`/reset-password`): Unified password reset (request + reset in one page)
- **Protected Routes**: Dashboard requires authentication via middleware

## Project Structure

```
src/
├── components/
│   ├── ui/                    # Reusable UI components (Avatar, Button, Input)
│   ├── StatusAvatar.tsx       # Avatar with status ring and animations
│   ├── SessionController.tsx  # Timer and session management
│   ├── RealtimeFeed.tsx       # Activity log with realtime updates
│   ├── AuthForm.tsx           # Reusable authentication form component
│   └── PasswordResetForm.tsx  # Password reset form component
├── lib/
│   ├── supabase.ts            # Supabase client configuration
│   └── utils.ts               # Utility functions (cn)
├── middleware.ts              # Authentication middleware
└── types/
    └── database.ts            # TypeScript types for database schema

app/
├── globals.css                # Global styles and Tailwind imports
├── layout.tsx                 # Root layout with authentication
├── page.tsx                   # Main dashboard page (protected)
├── login/
│   └── page.tsx               # Login page
├── signup/
│   └── page.tsx               # Signup page
├── reset-password/
│   └── page.tsx               # Unified password reset page
└── auth/
    └── callback/
        └── route.ts           # Supabase auth callback handler
```

## Environment Variables

Create a `.env.local` file in the root directory:

```env
NEXT_PUBLIC_SUPABASE_URL=your_supabase_project_url
NEXT_PUBLIC_SUPABASE_ANON_KEY=your_supabase_anon_key
```

## Customization

- **Colors**: Update color palette in component files (e.g., status colors in `StatusAvatar.tsx`)
- **Animations**: Modify Framer Motion configurations for different effects
- **Database**: Add more fields or tables as needed for your squad's workflow
- **Authentication**: Customize auth flow in middleware and auth callback

## Deployment

### Vercel Deployment

1. Connect your GitHub repository to Vercel
2. Add environment variables in Vercel dashboard:
   - `NEXT_PUBLIC_SUPABASE_URL`
   - `NEXT_PUBLIC_SUPABASE_ANON_KEY`
3. Update Supabase redirect URLs to include your Vercel domain
4. Deploy!

### Other Platforms

Deploy to Netlify, Railway, or any platform supporting Next.js. Make sure to set environment variables in your deployment platform.

## Available Scripts

- `npm run dev` - Start development server
- `npm run build` - Build for production
- `npm run start` - Start production server
- `npm run lint` - Run ESLint

## Contributing

Feel free to enhance the dashboard with additional features like:
- Advanced user profiles with avatars
- File uploads for bug reports
- Notification system for squad activities
- Advanced analytics and reporting
- Integration with bug bounty platforms
- Dark/light theme toggle

## License

This project is open source and available under the [MIT License](LICENSE).

Enjoy hunting! 🐛🔍
