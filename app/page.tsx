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
import { Plus, Users, LogOut, Shield } from 'lucide-react'
import { useRouter } from 'next/navigation'

type Profile = {
  id: string
  name: string
  avatar_url: string | null
  status: 'HUNTING' | 'RESEARCHING' | 'IDLE' | 'OFFLINE'
  role: 'user' | 'admin'
  banned: boolean
}

export default function Home() {
  const [profiles, setProfiles] = useState<Profile[]>([])
  const [currentUserId, setCurrentUserId] = useState<string>('')
  const [currentStatus, setCurrentStatus] = useState('OFFLINE')
  const [currentRole, setCurrentRole] = useState<'user' | 'admin'>('user')
  const [showSubmissionForm, setShowSubmissionForm] = useState(false)
  const router = useRouter()

  useEffect(() => {
    const getCurrentUser = async () => {
      const { data: { user } } = await (getSupabase() as any).auth.getUser()
      if (user) {
        setCurrentUserId(user.id)
        const { data: profile } = await (getSupabase() as any)
          .from('profiles')
          .select('role')
          .eq('id', user.id)
          .single()
        if (profile) setCurrentRole(profile.role)
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

      <div className="relative z-10 p-4 lg:p-6 min-h-screen flex flex-col max-w-[1440px] mx-auto w-full">
        {/* Header */}
        <motion.header
          initial={{ y: -50, opacity: 0 }}
          animate={{ y: 0, opacity: 1 }}
          transition={{ duration: 0.8 }}
          className="flex flex-col sm:flex-row justify-between items-start sm:items-center mb-6 lg:mb-8 gap-4"
        >
          <div>
            <h1 className="text-3xl lg:text-4xl font-bold text-emerald-400 font-mono tracking-wider">
              THE BREACH DASHBOARD
            </h1>
            <p className="text-gray-400 font-mono text-sm mt-1">
              Cyber Operations Center • Real-time Intelligence Hub
            </p>
          </div>
          <div className="flex flex-col sm:flex-row items-stretch sm:items-center gap-2 sm:gap-4 w-full sm:w-auto">
            {currentRole === 'admin' && (
              <Button
                onClick={() => router.push('/admin')}
                className="bg-red-600 hover:bg-red-700 text-white font-mono px-4 lg:px-6 py-3 rounded-md transition-colors flex items-center justify-center gap-2 min-h-[44px]"
              >
                <Shield size={20} />
                ADMIN
              </Button>
            )}
            <Button
              onClick={() => setShowSubmissionForm(true)}
              className="bg-emerald-600 hover:bg-emerald-700 text-white font-mono px-4 lg:px-6 py-3 rounded-md transition-colors flex items-center justify-center gap-2 min-h-[44px]"
            >
              <Plus size={20} />
              SUBMIT FINDING
            </Button>
            <Button
              onClick={handleLogout}
              variant="outline"
              className="border-red-500/20 hover:bg-red-500/10 text-red-400 font-mono px-4 py-3 rounded-md transition-colors flex items-center justify-center gap-2 min-h-[44px]"
            >
              <LogOut size={20} />
              LOGOUT
            </Button>
          </div>
        </motion.header>

        {/* Main Grid - Bento Layout */}
        <div className="flex-1 grid grid-cols-1 lg:grid-cols-12 gap-4 lg:gap-6 auto-rows-max lg:auto-rows-max">
          {/* Squad Status - Left Panel */}
          <motion.div
            initial={{ x: -100, opacity: 0 }}
            animate={{ x: 0, opacity: 1 }}
            transition={{ duration: 0.8, delay: 0.2 }}
            className="lg:col-span-3 order-3 lg:order-1"
          >
            <div className="bg-[#0a0a0a] border border-emerald-500/20 rounded-lg p-4 lg:p-6 backdrop-blur-md bg-opacity-10 h-full">
              <h2 className="text-lg lg:text-xl font-bold text-emerald-400 mb-4 lg:mb-6 font-mono flex items-center gap-2">
                <Users size={20} className="lg:w-6 lg:h-6" />
                SQUAD STATUS
              </h2>
              <div className="space-y-3 lg:space-y-4 max-h-[500px] overflow-y-auto pr-2">
                {profiles.map((profile, index) => (
                  <motion.div
                    key={profile.id}
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ delay: index * 0.1 + 0.3 }}
                    className="flex items-center gap-3 lg:gap-4 p-3 rounded-md border border-emerald-500/10 hover:border-emerald-500/30 transition-all duration-300 hover:shadow-lg hover:shadow-emerald-500/10"
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

          {/* Center Column - Command Center + Intel Feed */}
          <motion.div
            initial={{ y: 50, opacity: 0 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.8, delay: 0.4 }}
            className="lg:col-span-5 order-1 lg:order-2 space-y-4 lg:space-y-6 flex flex-col"
          >
            {/* Command Center */}
            <CommandCenter
              userId={currentUserId}
              currentStatus={currentStatus}
              onStatusChange={handleStatusChange}
            />

            {/* Intel Feed */}
            <RealtimeFeed userId={currentUserId} />
          </motion.div>

          {/* Leaderboard - Right Panel */}
          <motion.div
            initial={{ x: 100, opacity: 0 }}
            animate={{ x: 0, opacity: 1 }}
            transition={{ duration: 0.8, delay: 0.6 }}
            className="lg:col-span-4 order-2 lg:order-3"
          >
            <Leaderboard />
          </motion.div>
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
  className="mt-12 pb-8 text-center"
>
  <div className="group cursor-crosshair font-mono text-sm inline-block">
    <div className="flex items-center gap-2 text-red-500">
      <span className="font-bold drop-shadow-[0_0_8px_rgba(239,68,68,0.4)]">
        root@intel:~#
      </span>  
      <span className="text-red-400/80 group-hover:text-red-400 transition-colors">
        created_by --author
      </span>
      <span className="px-2 py-0.5 bg-red-500/10 border border-red-500/20 text-red-500 font-bold shadow-[0_0_10px_rgba(239,68,68,0.1)] group-hover:bg-red-500/20 group-hover:shadow-[0_0_20px_rgba(239,68,68,0.4)] transition-all duration-300">
        oldrashed
      </span>
      <span className="animate-pulse bg-red-500 h-5 w-2 inline-block shadow-[0_0_8px_rgba(239,68,68,0.6)]"></span>
    </div>
  </div>
</motion.footer>
      </div>
    </div>
  )
}
