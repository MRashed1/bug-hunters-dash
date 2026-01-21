'use client'

import { useEffect, useState } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { getSupabase } from '@/lib/supabase'
import { Database } from '@/types/database'

type Activity = Database['public']['Tables']['activities']['Row'] & {
  profiles: { name: string } | null
}

interface RealtimeFeedProps {
  userId: string
}

const actionStyles = {
  BUG: 'text-red-400 bg-red-900/20',
  LAB: 'text-blue-400 bg-blue-900/20',
  WRITEUP: 'text-teal-400 bg-teal-900/20',
}

export function RealtimeFeed({ userId }: RealtimeFeedProps) {
  const [activities, setActivities] = useState<Activity[]>([])

  useEffect(() => {
    // Fetch initial activities
    const fetchActivities = async () => {
      const { data } = await (getSupabase() as any)
        .from('activities')
        .select('*, profiles(name)')
        .order('timestamp', { ascending: false })
        .limit(50)
      if (data) setActivities(data)
    }
    fetchActivities()

    // Subscribe to realtime updates
    const channel = (getSupabase() as any)
      .channel('activities')
      .on(
        'postgres_changes',
        { event: 'INSERT', schema: 'public', table: 'activities' },
        async (payload: any) => {
          const { data: profile } = await (getSupabase() as any)
            .from('profiles')
            .select('name')
            .eq('id', payload.new.user_id)
            .single()
          const newActivity = { ...payload.new, profiles: profile || { name: 'Unknown' } } as Activity
          setActivities((prev) => [newActivity, ...prev.slice(0, 49)])
        }
      )
      .subscribe()

    return () => {
      (getSupabase() as any).removeChannel(channel)
    }
  }, [])

  const addActivity = async (actionType: 'BUG' | 'LAB' | 'WRITEUP', details: string) => {
    await (getSupabase() as any).from('activities').insert({
      user_id: userId,
      action_type: actionType,
      details,
    })
  }

  return (
    <div className="bg-[#0a0a0a] border border-[#1a1a1a] rounded-lg p-4 h-96 overflow-y-auto font-mono text-sm">
      <AnimatePresence>
        {activities.map((activity, index) => (
          <motion.div
            key={activity.id}
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -20 }}
            transition={{ delay: index * 0.1 }}
            className={`mb-2 p-2 rounded ${actionStyles[activity.action_type]}`}
          >
            [{new Date(activity.timestamp).toLocaleTimeString()}] &gt; {activity.profiles?.name || 'Unknown'} &lt;{activity.action_type}&gt; : {activity.details}
          </motion.div>
        ))}
      </AnimatePresence>
      {/* For demo, add some buttons to add activities */}
      <div className="mt-4 flex space-x-2">
        <button onClick={() => addActivity('BUG', 'Found XSS vulnerability')} className="px-2 py-1 bg-red-600 text-white rounded">Add Bug</button>
        <button onClick={() => addActivity('LAB', 'Testing payload in lab')} className="px-2 py-1 bg-blue-600 text-white rounded">Add Lab</button>
        <button onClick={() => addActivity('WRITEUP', 'Completed writeup for CVE-2023-XXXX')} className="px-2 py-1 bg-teal-600 text-white rounded">Add Writeup</button>
      </div>
    </div>
  )
}