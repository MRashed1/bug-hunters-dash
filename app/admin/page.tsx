'use client'

import { useEffect, useState } from 'react'
import { motion } from 'framer-motion'
import { getSupabase } from '@/lib/supabase'
import { Button } from '@/components/ui/button'
import { useRouter } from 'next/navigation'
import { Shield, Users, Ban, Trash2, UserCheck, LogOut } from 'lucide-react'

type Profile = {
  id: string
  name: string
  avatar_url: string | null
  status: 'HUNTING' | 'RESEARCHING' | 'IDLE' | 'OFFLINE'
  role: 'user' | 'admin'
  banned: boolean
}

type Activity = {
  id: string
  user_id: string
  action_type: 'BUG' | 'LAB' | 'TIP'
  details: string
  link: string | null
  created_at: string
}

export default function AdminPage() {
  const [profiles, setProfiles] = useState<Profile[]>([])
  const [activities, setActivities] = useState<Activity[]>([])
  const [currentUser, setCurrentUser] = useState<Profile | null>(null)
  const router = useRouter()

  useEffect(() => {
    const checkAdmin = async () => {
      const { data: { user } } = await (getSupabase() as any).auth.getUser()
      if (!user) {
        router.push('/login')
        return
      }

      const { data: profile } = await (getSupabase() as any)
        .from('profiles')
        .select('*')
        .eq('id', user.id)
        .single()

      if (!profile || profile.role !== 'admin') {
        router.push('/')
        return
      }

      setCurrentUser(profile)
    }

    checkAdmin()
  }, [router])

  useEffect(() => {
    if (!currentUser) return

    const fetchData = async () => {
      const { data: profilesData } = await (getSupabase() as any).from('profiles').select('*')
      const { data: activitiesData } = await (getSupabase() as any).from('activities').select('*')

      if (profilesData) setProfiles(profilesData)
      if (activitiesData) setActivities(activitiesData)
    }

    fetchData()

    // Subscribe to changes
    const profilesChannel = (getSupabase() as any)
      .channel('profiles_admin')
      .on('postgres_changes', { event: '*', schema: 'public', table: 'profiles' }, () => {
        fetchData()
      })
      .subscribe()

    const activitiesChannel = (getSupabase() as any)
      .channel('activities_admin')
      .on('postgres_changes', { event: '*', schema: 'public', table: 'activities' }, () => {
        fetchData()
      })
      .subscribe()

    return () => {
      (getSupabase() as any).removeChannel(profilesChannel)
      (getSupabase() as any).removeChannel(activitiesChannel)
    }
  }, [currentUser])

  const handleRoleChange = async (userId: string, newRole: 'user' | 'admin') => {
    await (getSupabase() as any)
      .from('profiles')
      .update({ role: newRole })
      .eq('id', userId)
  }

  const handleBanToggle = async (userId: string, banned: boolean) => {
    await (getSupabase() as any)
      .from('profiles')
      .update({ banned: !banned })
      .eq('id', userId)
  }

  const handleDeleteActivity = async (activityId: string) => {
    await (getSupabase() as any)
      .from('activities')
      .delete()
      .eq('id', activityId)
  }

  const handleLogout = async () => {
    await (getSupabase() as any).auth.signOut()
    router.push('/login')
  }

  if (!currentUser) return <div>Loading...</div>

  return (
    <div className="min-h-screen bg-[#050505] text-white overflow-hidden">
      {/* Background Effects */}
      <div className="fixed inset-0 bg-gradient-to-br from-red-900/10 via-transparent to-purple-900/10" />
      <div className="fixed inset-0 bg-[radial-gradient(circle_at_50%_50%,rgba(239,68,68,0.05),transparent_50%)]" />

      <div className="relative z-10 p-4 lg:p-6 min-h-screen flex flex-col max-w-[1440px] mx-auto w-full">
        {/* Header */}
        <motion.header
          initial={{ y: -50, opacity: 0 }}
          animate={{ y: 0, opacity: 1 }}
          transition={{ duration: 0.8 }}
          className="flex justify-between items-center mb-6 lg:mb-8"
        >
          <div>
            <h1 className="text-3xl lg:text-4xl font-bold text-red-400 font-mono tracking-wider flex items-center gap-2">
              <Shield size={32} />
              ADMIN PANEL
            </h1>
            <p className="text-gray-400 font-mono text-sm mt-1">
              System Administration • User Management
            </p>
          </div>
          <Button
            onClick={handleLogout}
            variant="outline"
            className="border-red-500/20 hover:bg-red-500/10 text-red-400 font-mono px-4 py-3 rounded-md transition-colors flex items-center gap-2"
          >
            <LogOut size={20} />
            LOGOUT
          </Button>
        </motion.header>

        {/* User Management */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.8, delay: 0.2 }}
          className="bg-[#0a0a0a] border border-red-500/20 rounded-lg p-6 backdrop-blur-md bg-opacity-10 mb-6"
        >
          <h2 className="text-xl font-bold text-red-400 mb-4 font-mono flex items-center gap-2">
            <Users size={24} />
            USER MANAGEMENT
          </h2>
          <div className="space-y-4 max-h-[400px] overflow-y-auto">
            {profiles.map((profile) => (
              <div key={profile.id} className="flex items-center justify-between p-4 border border-red-500/10 rounded-md hover:border-red-500/30 transition-all">
                <div className="flex items-center gap-4">
                  <div>
                    <div className="font-mono text-red-400">{profile.name}</div>
                    <div className="font-mono text-xs text-gray-500">{profile.status} • {profile.role}</div>
                    {profile.banned && <div className="text-red-500 font-mono text-xs">BANNED</div>}
                  </div>
                </div>
                <div className="flex gap-2">
                  <Button
                    onClick={() => handleRoleChange(profile.id, profile.role === 'admin' ? 'user' : 'admin')}
                    variant="outline"
                    size="sm"
                    className="border-purple-500/20 hover:bg-purple-500/10 text-purple-400"
                  >
                    {profile.role === 'admin' ? 'Demote' : 'Promote'}
                  </Button>
                  <Button
                    onClick={() => handleBanToggle(profile.id, profile.banned)}
                    variant="outline"
                    size="sm"
                    className={`border-${profile.banned ? 'green' : 'red'}-500/20 hover:bg-${profile.banned ? 'green' : 'red'}-500/10 text-${profile.banned ? 'green' : 'red'}-400`}
                  >
                    {profile.banned ? <UserCheck size={16} /> : <Ban size={16} />}
                    {profile.banned ? 'Unban' : 'Ban'}
                  </Button>
                </div>
              </div>
            ))}
          </div>
        </motion.div>

        {/* Activity Management */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.8, delay: 0.4 }}
          className="bg-[#0a0a0a] border border-red-500/20 rounded-lg p-6 backdrop-blur-md bg-opacity-10"
        >
          <h2 className="text-xl font-bold text-red-400 mb-4 font-mono flex items-center gap-2">
            <Trash2 size={24} />
            ACTIVITY MANAGEMENT
          </h2>
          <div className="space-y-4 max-h-[400px] overflow-y-auto">
            {activities.map((activity) => {
              const user = profiles.find(p => p.id === activity.user_id)
              return (
                <div key={activity.id} className="flex items-center justify-between p-4 border border-red-500/10 rounded-md hover:border-red-500/30 transition-all">
                  <div>
                    <div className="font-mono text-red-400">{activity.action_type}: {activity.details}</div>
                    <div className="font-mono text-xs text-gray-500">
                      By: {user?.name || 'Unknown'} • {new Date(activity.created_at).toLocaleString()}
                    </div>
                    {activity.link && <a href={activity.link} className="text-blue-400 text-xs" target="_blank">Link</a>}
                  </div>
                  <Button
                    onClick={() => handleDeleteActivity(activity.id)}
                    variant="outline"
                    size="sm"
                    className="border-red-500/20 hover:bg-red-500/10 text-red-400"
                  >
                    <Trash2 size={16} />
                    Delete
                  </Button>
                </div>
              )
            })}
          </div>
        </motion.div>
      </div>
    </div>
  )
}