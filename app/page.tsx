'use client'

import { useEffect, useState } from 'react'
import { motion } from 'framer-motion'
import { StatusAvatar } from '@/components/StatusAvatar'
import { SessionController } from '@/components/SessionController'
import { RealtimeFeed } from '@/components/RealtimeFeed'
import { getSupabase } from '@/lib/supabase'
import { Database } from '@/types/database'

type Profile = Database['public']['Tables']['profiles']['Row']

export default function Home() {
  const [profiles, setProfiles] = useState<Profile[]>([])
  const [currentUserId] = useState('1') // Demo user

  useEffect(() => {
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
            prev.map((p) => (p.id === payload.new.id ? payload.new as Profile : p))
          )
        }
      )
      .subscribe()

    return () => {
      (getSupabase() as any).removeChannel(channel)
    }
  }, [])

  const handleStatusChange = (_status: string) => {
    // Update local state or something
  }

  return (
    <div className="min-h-screen bg-[#050505] text-white grid grid-cols-12 gap-4 p-4">
      {/* Sidebar */}
      <motion.div
        className="col-span-3 bg-[#0a0a0a] border border-[#1a1a1a] rounded-lg p-4"
        initial={{ x: -50, opacity: 0 }}
        animate={{ x: 0, opacity: 1 }}
      >
        <h2 className="text-xl font-bold mb-4 text-[#10b981]">Squad Status</h2>
        <div className="space-y-4">
          {profiles.map((profile, index) => (
            <motion.div
              key={profile.id}
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: index * 0.1 }}
            >
              <StatusAvatar
                name={profile.name}
                avatarUrl={profile.avatar_url || undefined}
                status={profile.status}
              />
              <p className="text-sm mt-2">{profile.name}</p>
            </motion.div>
          ))}
        </div>
      </motion.div>

      {/* Main Content */}
      <div className="col-span-9 space-y-4">
        {/* Hero Section */}
        <motion.div
          className="bg-[#0a0a0a] border border-[#1a1a1a] rounded-lg p-8 text-center"
          initial={{ scale: 0.9, opacity: 0 }}
          animate={{ scale: 1, opacity: 1 }}
        >
          <h1 className="text-4xl font-bold text-[#10b981] mb-4">The Breach Dashboard</h1>
          <SessionController userId={currentUserId} onStatusChange={handleStatusChange} />
        </motion.div>

        {/* Progress and Feed */}
        <div className="grid grid-cols-2 gap-4">
          <motion.div
            className="bg-[#0a0a0a] border border-[#1a1a1a] rounded-lg p-4"
            initial={{ x: 50, opacity: 0 }}
            animate={{ x: 0, opacity: 1 }}
            transition={{ delay: 0.2 }}
          >
            <h3 className="text-lg font-semibold mb-2 text-[#f59e0b]">Daily Progress</h3>
            {/* Circular progress bar placeholder */}
            <div className="w-32 h-32 mx-auto border-4 border-[#1a1a1a] rounded-full flex items-center justify-center">
              <span className="text-2xl">75%</span>
            </div>
          </motion.div>

          <motion.div
            className="bg-[#0a0a0a] border border-[#1a1a1a] rounded-lg p-4"
            initial={{ x: 50, opacity: 0 }}
            animate={{ x: 0, opacity: 1 }}
            transition={{ delay: 0.3 }}
          >
            <h3 className="text-lg font-semibold mb-2 text-[#3b82f6]">Activity Log</h3>
            <RealtimeFeed userId={currentUserId} />
          </motion.div>
        </div>

        {/* Shared Intelligence */}
        <motion.div
          className="bg-[#0a0a0a] border border-[#1a1a1a] rounded-lg p-4"
          initial={{ y: 50, opacity: 0 }}
          animate={{ y: 0, opacity: 1 }}
          transition={{ delay: 0.4 }}
        >
          <h3 className="text-lg font-semibold mb-4 text-[#10b981]">Shared Intelligence</h3>
          <div className="grid grid-cols-3 gap-4">
            {[
              { title: 'XSS Payload', link: 'https://example.com/payload1' },
              { title: 'SQL Injection Guide', link: 'https://example.com/guide' },
              { title: 'Recon Tools', link: 'https://example.com/tools' },
            ].map((item, index) => (
              <motion.div
                key={index}
                className="bg-[#0f0f0f] border border-[#1a1a1a] rounded-lg p-4 cursor-pointer hover:scale-105 transition-transform"
                whileHover={{ rotateY: 5 }}
              >
                <h4 className="font-medium mb-2">{item.title}</h4>
                <button
                  className="text-sm text-[#3b82f6] hover:underline"
                  onClick={() => navigator.clipboard.writeText(item.link)}
                >
                  Copy Link
                </button>
              </motion.div>
            ))}
          </div>
        </motion.div>
      </div>
    </div>
  )
}
