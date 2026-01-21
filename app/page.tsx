'use client'

import { useEffect, useState } from 'react'
import { motion } from 'framer-motion'
import { StatusAvatar } from '@/components/StatusAvatar'
import { CommandCenter } from '@/components/CommandCenter'
import { RealtimeFeed } from '@/components/RealtimeFeed'
import { SubmissionForm } from '@/components/SubmissionForm'
import { Leaderboard } from '@/components/Leaderboard'
import { getSupabase } from '@/lib/supabase'
import { Button } from '@/components/ui/button'
import { Plus, Users, LogOut } from 'lucide-react'
import { useRouter } from 'next/navigation'

type Profile = {
  id: string
  name: string
  avatar_url: string | null
  status: 'HUNTING' | 'RESEARCHING' | 'IDLE' | 'OFFLINE'
}

export default function Home() {
  const [profiles, setProfiles] = useState<Profile[]>([])
  const [currentUserId, setCurrentUserId] = useState<string>('')
  const [currentStatus, setCurrentStatus] = useState('OFFLINE')
  const [showSubmissionForm, setShowSubmissionForm] = useState(false)
  const router = useRouter()

  useEffect(() => {
    const getCurrentUser = async () => {
      const { data: { user } } = await (getSupabase() as any).auth.getUser()
      if (user) {
        setCurrentUserId(user.id)
      } else {
        router.push('/login')
      }
    }
    getCurrentUser()
  }, [router])

  useEffect(() => {
    if (!currentUserId) return

    const fetchProfiles = async () => {
      const { data } = await (getSupabase() as any).from('profiles').select('*')
      if (data) setProfiles(data)
    }
    fetchProfiles()

    // Subscribe to profile changes
    const channel = (getSupabase() as any)
      .channel('profiles')
      .on(
        'postgres_changes',
        { event: 'UPDATE', schema: 'public', table: 'profiles' },
        (payload: any) => {
          setProfiles((prev) =>
            prev.map((p) => (p.id === payload.new.id ? payload.new : p))
          )
          if (payload.new.id === currentUserId) {
            setCurrentStatus(payload.new.status)
          }
        }
      )
      .subscribe()

    return () => {
      (getSupabase() as any).removeChannel(channel)
    }
  }, [currentUserId])

  const handleLogout = async () => {
    await (getSupabase() as any).auth.signOut()
    router.push('/login')
  }

  const handleStatusChange = (_status: string) => {
    setCurrentStatus(_status)
  }

  return (
    <div className="min-h-screen bg-[#050505] text-white overflow-hidden">
      {/* Background Effects */}
      <div className="fixed inset-0 bg-gradient-to-br from-emerald-900/10 via-transparent to-blue-900/10" />
      <div className="fixed inset-0 bg-[radial-gradient(circle_at_50%_50%,rgba(16,185,129,0.05),transparent_50%)]" />

      <div className="relative z-10 p-6 min-h-screen flex flex-col">
        {/* Header */}
        <motion.header
          initial={{ y: -50, opacity: 0 }}
          animate={{ y: 0, opacity: 1 }}
          transition={{ duration: 0.8 }}
          className="flex justify-between items-center mb-8"
        >
          <div>
            <h1 className="text-4xl font-bold text-emerald-400 font-mono tracking-wider">
              THE BREACH DASHBOARD
            </h1>
            <p className="text-gray-400 font-mono text-sm mt-1">
              Cyber Operations Center • Real-time Intelligence Hub
            </p>
          </div>
          <div className="flex items-center gap-4">
            <Button
              onClick={() => setShowSubmissionForm(true)}
              className="bg-emerald-600 hover:bg-emerald-700 text-white font-mono px-6 py-3 rounded-md transition-colors flex items-center gap-2"
            >
              <Plus size={20} />
              SUBMIT FINDING
            </Button>
            <Button
              onClick={handleLogout}
              variant="outline"
              className="border-red-500/20 hover:bg-red-500/10 text-red-400 font-mono px-4 py-3 rounded-md transition-colors flex items-center gap-2"
            >
              <LogOut size={20} />
              LOGOUT
            </Button>
          </div>
        </motion.header>

        {/* Main Grid - Zero-G Layout */}
        <div className="flex-1 grid grid-cols-12 gap-6">
          {/* Squad Status - Floating Panel */}
          <motion.div
            initial={{ x: -100, opacity: 0 }}
            animate={{ x: 0, opacity: 1 }}
            transition={{ duration: 0.8, delay: 0.2 }}
            className="col-span-3"
          >
            <div className="bg-[#0a0a0a] border border-emerald-500/20 rounded-lg p-6 backdrop-blur-md bg-opacity-10 sticky top-6">
              <h2 className="text-xl font-bold text-emerald-400 mb-6 font-mono flex items-center gap-2">
                <Users size={24} />
                SQUAD STATUS
              </h2>
              <div className="space-y-4">
                {profiles.map((profile, index) => (
                  <motion.div
                    key={profile.id}
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ delay: index * 0.1 + 0.3 }}
                    className="flex items-center gap-4 p-3 rounded-md border border-emerald-500/10 hover:border-emerald-500/30 transition-colors"
                  >
                    <StatusAvatar
                      name={profile.name}
                      avatarUrl={profile.avatar_url || undefined}
                      status={profile.status}
                    />
                    <div>
                      <div className="font-mono text-sm text-emerald-400">{profile.name}</div>
                      <div className="font-mono text-xs text-gray-500">{profile.status}</div>
                    </div>
                  </motion.div>
                ))}
              </div>
            </div>
          </motion.div>

          {/* Main Operations Area */}
          <div className="col-span-9 grid grid-cols-2 gap-6">
            {/* Left Column */}
            <div className="space-y-6">
              {/* Command Center */}
              <CommandCenter
                userId={currentUserId}
                currentStatus={currentStatus}
                onStatusChange={handleStatusChange}
              />

              {/* Intel Feed */}
              <RealtimeFeed userId={currentUserId} />
            </div>

            {/* Right Column */}
            <div>
              {/* Leaderboard */}
              <Leaderboard />
            </div>
          </div>
        </div>

        {/* Submission Form Modal */}
        <SubmissionForm
          userId={currentUserId}
          isOpen={showSubmissionForm}
          onClose={() => setShowSubmissionForm(false)}
        />

        {/* Footer */}
        <motion.footer
          initial={{ y: 50, opacity: 0 }}
          animate={{ y: 0, opacity: 1 }}
          transition={{ duration: 0.8, delay: 1 }}
          className="mt-8 text-center"
        >
          <p className="text-gray-500 font-mono text-sm">
            Secure • Encrypted • Real-time • Breach Ready
          </p>
        </motion.footer>
      </div>
    </div>
  )
}
