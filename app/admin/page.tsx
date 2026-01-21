'use client'

import { useEffect, useState } from 'react'
import { motion } from 'framer-motion'
import { getSupabase } from '@/lib/supabase'
import { Button } from '@/components/ui/button'
import { useRouter } from 'next/navigation'
import { Shield, Users, Ban, Trash2, UserCheck, LogOut, Save, RefreshCcw } from 'lucide-react'

type Profile = {
  id: string
  name: string
  avatar_url: string | null
  status: 'HUNTING' | 'RESEARCHING' | 'IDLE' | 'OFFLINE'
  role: 'user' | 'admin'
  banned: boolean
  bonus_hunting_hours: number
  bonus_researching_hours: number
  bonus_bug_count: number
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
  const [editingBonuses, setEditingBonuses] = useState<{ [key: string]: Partial<Profile> }>({})
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

  const fetchData = async () => {
    const { data: profilesData } = await (getSupabase() as any).from('profiles').select('*')
    const { data: activitiesData } = await (getSupabase() as any).from('activities').select('*').order('created_at', { ascending: false })

    if (profilesData) setProfiles(profilesData)
    if (activitiesData) setActivities(activitiesData)
  }

  useEffect(() => {
    if (!currentUser) return
    fetchData()

    const profilesChannel = (getSupabase() as any)
      .channel('profiles_admin')
      .on('postgres_changes', { event: '*', schema: 'public', table: 'profiles' }, () => fetchData())
      .subscribe()

    const activitiesChannel = (getSupabase() as any)
      .channel('activities_admin')
      .on('postgres_changes', { event: '*', schema: 'public', table: 'activities' }, () => fetchData())
      .subscribe()

    return () => {
      (getSupabase() as any).removeChannel(profilesChannel)
      (getSupabase() as any).removeChannel(activitiesChannel)
    }
  }, [currentUser])

  const handleRoleChange = async (userId: string, newRole: 'user' | 'admin') => {
    await (getSupabase() as any).from('profiles').update({ role: newRole }).eq('id', userId)
  }

  const handleBanToggle = async (userId: string, banned: boolean) => {
    await (getSupabase() as any).from('profiles').update({ banned: !banned }).eq('id', userId)
  }

  // الدالة الجديدة لحفظ البيانات دفعة واحدة
  const handleUpdateUserStats = async (userId: string) => {
    const updates = editingBonuses[userId];
    if (!updates) return;

    const { error } = await (getSupabase() as any)
      .from('profiles')
      .update(updates)
      .eq('id', userId);

    if (!error) {
      alert('Stats updated successfully');
      setEditingBonuses(prev => {
        const newState = { ...prev };
        delete newState[userId];
        return newState;
      });
    }
  };

  // دالة لتصفير الداتا الفعلية (تستخدم فقط عند الحاجة لتعديل التوتال يدوياً بالكامل)
  const handleResetActualData = async (userId: string) => {
    if (!confirm("Warning: This will delete ALL actual sessions and bugs for this user. Continue?")) return;
    
    await (getSupabase() as any).from('sessions').delete().eq('user_id', userId);
    await (getSupabase() as any).from('activities').delete().eq('user_id', userId).eq('action_type', 'BUG');
    
    alert('Actual data reset to 0');
    fetchData();
  };

  const handleDeleteActivity = async (activityId: string) => {
    await (getSupabase() as any).from('activities').delete().eq('id', activityId)
  }

  const handleLogout = async () => {
    await (getSupabase() as any).auth.signOut()
    router.push('/login')
  }

  if (!currentUser) return <div className="min-h-screen bg-black flex items-center justify-center font-mono text-red-500">INITIALIZING...</div>

  return (
    <div className="min-h-screen bg-[#050505] text-white overflow-x-hidden">
      <div className="fixed inset-0 bg-gradient-to-br from-red-900/10 via-transparent to-purple-900/10" />
      
      <div className="relative z-10 p-4 lg:p-6 min-h-screen flex flex-col max-w-[1440px] mx-auto w-full">
        {/* Header */}
        <motion.header
          initial={{ y: -50, opacity: 0 }}
          animate={{ y: 0, opacity: 1 }}
          className="flex justify-between items-center mb-6 lg:mb-8"
        >
          <div>
            <h1 className="text-3xl lg:text-4xl font-bold text-red-400 font-mono tracking-wider flex items-center gap-2">
              <Shield size={32} />
              ADMIN PANEL
            </h1>
          </div>
          <Button onClick={handleLogout} variant="outline" className="border-red-500/20 hover:bg-red-500/10 text-red-400 font-mono flex items-center gap-2">
            <LogOut size={20} /> LOGOUT
          </Button>
        </motion.header>

        {/* User Management */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className="bg-[#0a0a0a] border border-red-500/20 rounded-lg p-6 backdrop-blur-md bg-opacity-10 mb-6"
        >
          <h2 className="text-xl font-bold text-red-400 mb-6 font-mono flex items-center gap-2">
            <Users size={24} /> USER MANAGEMENT
          </h2>
          
          <div className="space-y-6 max-h-[600px] overflow-y-auto pr-2 custom-scrollbar">
            {profiles.map((profile) => (
              <div key={profile.id} className="border border-red-500/10 rounded-lg bg-black/40 overflow-hidden transition-all hover:border-red-500/30">
                {/* User Info Bar */}
                <div className="flex items-center justify-between p-4 bg-red-500/5 border-b border-red-500/10">
                  <div className="flex items-center gap-4">
                    <div className="w-10 h-10 rounded bg-red-500/10 border border-red-500/20 flex items-center justify-center text-red-500 font-bold">
                      {profile.name[0]}
                    </div>
                    <div>
                      <div className="font-mono text-red-400 font-bold">{profile.name}</div>
                      <div className="font-mono text-[10px] text-gray-500 uppercase tracking-tighter">
                        {profile.status} • {profile.role} {profile.banned && <span className="text-red-600 ml-2">● BANNED</span>}
                      </div>
                    </div>
                  </div>
                  <div className="flex gap-2">
                    <Button
                      onClick={() => handleRoleChange(profile.id, profile.role === 'admin' ? 'user' : 'admin')}
                      variant="outline" size="sm" className="border-purple-500/20 text-purple-400 text-xs font-mono"
                    >
                      {profile.role === 'admin' ? 'DEMOTE' : 'PROMOTE'}
                    </Button>
                    <Button
                      onClick={() => handleBanToggle(profile.id, profile.banned)}
                      variant="outline" size="sm" className={`border-red-500/20 text-red-400 text-xs font-mono`}
                    >
                      {profile.banned ? <UserCheck size={14} className="mr-1"/> : <Ban size={14} className="mr-1"/>}
                      {profile.banned ? 'UNBAN' : 'BAN'}
                    </Button>
                  </div>
                </div>

                {/* Stat Adjustment Section */}
                <div className="p-4 grid grid-cols-1 lg:grid-cols-12 gap-6 items-end">
                  <div className="lg:col-span-8 grid grid-cols-3 gap-4">
                    <div className="space-y-1">
                      <label className="text-[10px] font-mono text-gray-500 uppercase">Hunting Bonus (Hrs)</label>
                      <input
                        type="number"
                        step="0.1"
                        value={editingBonuses[profile.id]?.bonus_hunting_hours ?? profile.bonus_hunting_hours}
                        onChange={(e) => setEditingBonuses(p => ({...p, [profile.id]: {...p[profile.id], bonus_hunting_hours: parseFloat(e.target.value) || 0}}))}
                        className="w-full bg-black/60 border border-red-500/20 rounded px-3 py-2 text-sm font-mono text-red-400 focus:border-red-500 outline-none"
                      />
                    </div>
                    <div className="space-y-1">
                      <label className="text-[10px] font-mono text-gray-500 uppercase">Research Bonus (Hrs)</label>
                      <input
                        type="number"
                        step="0.1"
                        value={editingBonuses[profile.id]?.bonus_researching_hours ?? profile.bonus_researching_hours}
                        onChange={(e) => setEditingBonuses(p => ({...p, [profile.id]: {...p[profile.id], bonus_researching_hours: parseFloat(e.target.value) || 0}}))}
                        className="w-full bg-black/60 border border-red-500/20 rounded px-3 py-2 text-sm font-mono text-red-400 focus:border-red-500 outline-none"
                      />
                    </div>
                    <div className="space-y-1">
                      <label className="text-[10px] font-mono text-gray-500 uppercase">Bugs Bonus</label>
                      <input
                        type="number"
                        value={editingBonuses[profile.id]?.bonus_bug_count ?? profile.bonus_bug_count}
                        onChange={(e) => setEditingBonuses(p => ({...p, [profile.id]: {...p[profile.id], bonus_bug_count: parseInt(e.target.value) || 0}}))}
                        className="w-full bg-black/60 border border-red-500/20 rounded px-3 py-2 text-sm font-mono text-red-400 focus:border-red-500 outline-none"
                      />
                    </div>
                  </div>

                  <div className="lg:col-span-4 flex gap-2">
                    <Button 
                      onClick={() => handleUpdateUserStats(profile.id)}
                      className="flex-1 bg-red-600 hover:bg-red-700 text-white font-mono text-xs font-bold"
                    >
                      <Save size={16} className="mr-2" /> UPDATE TOTALS
                    </Button>
                    <Button 
                      onClick={() => handleResetActualData(profile.id)}
                      variant="outline"
                      className="border-gray-800 hover:bg-red-900/20 text-gray-500 hover:text-red-400"
                      title="Reset actual data to start manual only"
                    >
                      <RefreshCcw size={16} />
                    </Button>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </motion.div>

        {/* Activity Management */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className="bg-[#0a0a0a] border border-red-500/20 rounded-lg p-6 backdrop-blur-md bg-opacity-10"
        >
          <h2 className="text-xl font-bold text-red-400 mb-4 font-mono flex items-center gap-2">
            <Trash2 size={24} /> ACTIVITY LOG
          </h2>
          <div className="space-y-2 max-h-[300px] overflow-y-auto pr-2 custom-scrollbar">
            {activities.map((activity) => {
              const user = profiles.find(p => p.id === activity.user_id)
              return (
                <div key={activity.id} className="flex items-center justify-between p-3 border border-red-500/5 rounded bg-black/20 hover:bg-black/40 transition-all">
                  <div className="font-mono">
                    <span className="text-red-500 text-xs mr-2">[{activity.action_type}]</span>
                    <span className="text-gray-300 text-sm">{activity.details}</span>
                    <div className="text-[10px] text-gray-600">
                      By: {user?.name || 'Unknown'} • {new Date(activity.created_at).toLocaleString()}
                    </div>
                  </div>
                  <Button
                    onClick={() => handleDeleteActivity(activity.id)}
                    variant="ghost" size="sm" className="text-gray-600 hover:text-red-500"
                  >
                    <Trash2 size={14} />
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