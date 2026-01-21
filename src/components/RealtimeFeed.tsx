'use client'

import { useEffect, useState, useRef } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { Send, Lightbulb } from 'lucide-react'
import { getSupabase } from '@/lib/supabase'
import { Button } from '@/components/ui/button'

type Activity = {
  id: string
  user_id: string
  action_type: 'BUG' | 'LAB' | 'TIP'
  details: string
  link: string | null
  created_at: string
  profiles: { name: string } | null
}

interface RealtimeFeedProps {
  userId: string
}

const actionStyles = {
  BUG: 'text-red-400 bg-red-900/20 border-red-500/20',
  LAB: 'text-blue-400 bg-blue-900/20 border-blue-500/20',
  TIP: 'text-teal-400 bg-teal-900/20 border-teal-500/20'
}

export function RealtimeFeed({ userId }: RealtimeFeedProps) {
  const [activities, setActivities] = useState<Activity[]>([])
  const [tipText, setTipText] = useState('')
  const [activeTag, setActiveTag] = useState<'BUG' | 'LAB' | 'TIP' | null>(null)
  const textareaRef = useRef<HTMLTextAreaElement>(null)

  useEffect(() => {
    const fetchActivities = async () => {
      const { data } = await (getSupabase() as any)
        .from('activities')
        .select('*, profiles(name)')
        .order('created_at', { ascending: false })
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
        async (payload: { new: any }) => {
          const { data: profile } = await (getSupabase() as any)
            .from('profiles')
            .select('name')
            .eq('id', payload.new.user_id)
            .single()
          const newActivity = { ...payload.new, profiles: profile || { name: 'Unknown' } }
          setActivities((prev) => [newActivity, ...prev.slice(0, 49)])
        }
      )
      .subscribe()

    return () => {
      (getSupabase() as any).removeChannel(channel)
    }
  }, [])

  const addActivity = async (actionType: 'BUG' | 'LAB' | 'TIP', details: string) => {
    await (getSupabase() as any).from('activities').insert({
      user_id: userId,
      action_type: actionType,
      details,
    })
  }

  const submitTip = async () => {
    if (!tipText.trim()) return
    await addActivity('TIP', tipText)
    setTipText('')
    setActiveTag(null)
  }

  // Handle prefix button click
  const handlePrefixClick = (tag: 'BUG' | 'LAB' | 'TIP') => {
    const tagText = `[${tag}] `
    let newText = tipText
    // If already starts with this tag, just focus and move cursor
    if (tipText.startsWith(tagText)) {
      newText = tipText
    } else {
      // Remove any existing tag at the start
      newText = tipText.replace(/^\[(BUG|LAB|TIP)\] /, '')
      newText = tagText + newText
    }
    setTipText(newText)
    setActiveTag(tag)
    // Focus and move cursor to end of tag
    setTimeout(() => {
      if (textareaRef.current) {
        textareaRef.current.focus()
        textareaRef.current.setSelectionRange(tagText.length, tagText.length)
      }
    }, 0)
  }

  return (
    <motion.div
      initial={{ opacity: 0, x: 50 }}
      animate={{ opacity: 1, x: 0 }}
      transition={{ duration: 0.6 }}
      className="bg-[#0a0a0a] border border-emerald-500/20 rounded-lg p-6 backdrop-blur-md bg-opacity-10 flex flex-col max-h-[500px]"
    >
      <h3 className="text-lg font-semibold mb-4 text-emerald-400 font-mono flex items-center gap-2">
        <Lightbulb size={20} />
        INTEL FEED
      </h3>

      {/* Intel Input */}
      <div className="mb-4 flex-shrink-0">
        <div className="flex gap-2">
          <textarea
            ref={textareaRef}
            value={tipText}
            onChange={(e) => setTipText(e.target.value)}
            placeholder="Drop a tip... (Markdown supported)"
            rows={3}
            className="flex-1 px-4 py-3 bg-[#1a1a1a] border border-emerald-500/20 rounded-md text-white placeholder-gray-500 focus:border-emerald-400 focus:outline-none transition-colors font-mono resize-none max-h-32 overflow-y-auto"
          />
          <Button
            onClick={submitTip}
            className="bg-emerald-600 hover:bg-emerald-700 text-white px-4 rounded-md transition-colors flex-shrink-0"
          >
            <Send size={16} />
          </Button>
        </div>
        <p className="text-xs text-gray-500 mt-2 font-mono">
          Share payloads, techniques, or insights with the team
        </p>
      </div>

      {/* Activity Feed */}
      <div className="flex-1 overflow-y-auto space-y-3 pr-2">
        <AnimatePresence>
          {activities.map((activity, index) => (
            <motion.div
              key={activity.id}
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -20 }}
              transition={{ delay: index * 0.05 }}
              className={`p-3 rounded-md border ${actionStyles[activity.action_type]} backdrop-blur-sm bg-opacity-50 flex-shrink-0`}
            >
              <div className="flex justify-between items-start mb-2">
                <span className="text-xs font-mono text-gray-400">
                  {new Date(activity.created_at).toLocaleTimeString()}
                </span>
                <span className="text-xs font-mono text-emerald-400">
                  {activity.profiles?.name || 'Unknown'}
                </span>
              </div>
              <div className="text-sm font-mono">
                <span className="text-emerald-400">[{activity.action_type}]</span> {activity.details}
              </div>
            </motion.div>
          ))}
        </AnimatePresence>
      </div>

      {/* Quick Actions */}
      <div className="mt-4 pt-4 border-t border-emerald-500/20 flex-shrink-0">
        <div className="flex gap-2">
          <Button
            onClick={() => handlePrefixClick('BUG')}
            size="sm"
            variant="outline"
            className={`flex-1 border-red-500/20 hover:bg-red-500/10 font-mono text-xs transition-shadow ${activeTag === 'BUG' ? 'ring-2 ring-red-400/60 shadow-red-400/30' : ''}`}
            type="button"
          >
            + BUG
          </Button>
          <Button
            onClick={() => handlePrefixClick('LAB')}
            size="sm"
            variant="outline"
            className={`flex-1 border-blue-500/20 hover:bg-blue-500/10 font-mono text-xs transition-shadow ${activeTag === 'LAB' ? 'ring-2 ring-blue-400/60 shadow-blue-400/30' : ''}`}
            type="button"
          >
            + LAB
          </Button>
          <Button
            onClick={() => handlePrefixClick('TIP')}
            size="sm"
            variant="outline"
            className={`flex-1 border-teal-500/20 hover:bg-teal-500/10 font-mono text-xs transition-shadow ${activeTag === 'TIP' ? 'ring-2 ring-teal-400/60 shadow-teal-400/30' : ''}`}
            type="button"
          >
            + TIP
          </Button>
        </div>
      </div>
    </motion.div>
  )
}