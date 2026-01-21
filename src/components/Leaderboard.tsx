'use client'

import { useState, useEffect } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { Trophy, Medal, Award, Zap, Brain, Bug } from 'lucide-react'
import { getSupabase } from '@/lib/supabase'

interface LeaderboardEntry {
  user_id: string
  name: string
  avatar_url: string | null
  hunting_hours: number
  researching_hours: number
  bug_count: number
}

type TabType = 'HUNTING' | 'RESEARCH' | 'BUGS'

export function Leaderboard() {
  const [data, setData] = useState<LeaderboardEntry[]>([])
  const [loading, setLoading] = useState(true)
  const [activeTab, setActiveTab] = useState<TabType>('HUNTING')

  useEffect(() => {
    fetchLeaderboard()
    setupRealtime()
  }, [])

  const fetchLeaderboard = async () => {
    const supabase = getSupabase()
    const { data: leaderboard, error } = await supabase
      .from('leaderboard_stats')
      .select('*')
      .order('hunting_hours', { ascending: false })

    if (leaderboard) {
      setData(leaderboard)
    }
    setLoading(false)
  }

  const setupRealtime = () => {
    const supabase = getSupabase()
    const channel = supabase
      .channel('leaderboard-updates')
      .on('postgres_changes', { event: '*', schema: 'public', table: 'sessions' }, () => {
        fetchLeaderboard()
      })
      .on('postgres_changes', { event: '*', schema: 'public', table: 'activities' }, () => {
        fetchLeaderboard()
      })
      .subscribe()
  }

  const getSortedData = () => {
    return [...data].sort((a, b) => {
      switch (activeTab) {
        case 'HUNTING':
          return b.hunting_hours - a.hunting_hours
        case 'RESEARCH':
          return b.researching_hours - a.researching_hours
        case 'BUGS':
          return b.bug_count - a.bug_count
        default:
          return 0
      }
    })
  }

  const getTabColor = (tab: TabType) => {
    switch (tab) {
      case 'HUNTING':
        return 'emerald'
      case 'RESEARCH':
        return 'blue'
      case 'BUGS':
        return 'red'
    }
  }

  const getValue = (entry: LeaderboardEntry) => {
    switch (activeTab) {
      case 'HUNTING':
        return entry.hunting_hours.toFixed(1)
      case 'RESEARCH':
        return entry.researching_hours.toFixed(1)
      case 'BUGS':
        return entry.bug_count.toString()
    }
  }

  const getUnit = () => {
    switch (activeTab) {
      case 'HUNTING':
      case 'RESEARCH':
        return 'hrs'
      case 'BUGS':
        return 'bugs'
    }
  }

  const getRankIcon = (index: number) => {
    switch (index) {
      case 0:
        return <Trophy className="w-6 h-6 text-yellow-400" />
      case 1:
        return <Medal className="w-6 h-6 text-gray-400" />
      case 2:
        return <Award className="w-6 h-6 text-amber-600" />
      default:
        return <span className="w-6 h-6 flex items-center justify-center text-gray-400 font-mono">#{index + 1}</span>
    }
  }

  const getTabIcon = (tab: TabType) => {
    switch (tab) {
      case 'HUNTING':
        return <Zap size={20} />
      case 'RESEARCH':
        return <Brain size={20} />
      case 'BUGS':
        return <Bug size={20} />
    }
  }

  const sortedData = getSortedData()
  const color = getTabColor(activeTab)

  return (
    <motion.div
      initial={{ opacity: 0, y: 50 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.6 }}
      className="bg-[#050505] border border-gray-800/50 rounded-lg p-6 backdrop-blur-md bg-opacity-95"
    >
      <h2 className="text-xl font-bold text-emerald-400 mb-6 font-mono text-center">
        SQUAD LEADERBOARD
      </h2>

      {/* Tab Switcher */}
      <div className="flex gap-2 mb-6">
        {(['HUNTING', 'RESEARCH', 'BUGS'] as TabType[]).map((tab) => (
          <motion.button
            key={tab}
            onClick={() => setActiveTab(tab)}
            className={`flex-1 py-2 px-4 rounded-md font-mono text-sm transition-all duration-300 flex items-center justify-center gap-2 ${
              activeTab === tab
                ? `bg-${color}-500/20 border border-${color}-500/50 text-${color}-400 shadow-lg shadow-${color}-500/20`
                : 'bg-gray-800/50 border border-gray-700/50 text-gray-400 hover:bg-gray-700/50'
            }`}
            whileHover={{ scale: 1.02 }}
            whileTap={{ scale: 0.98 }}
          >
            {getTabIcon(tab)}
            {tab}
          </motion.button>
        ))}
      </div>

      {/* Leaderboard List */}
      <div className="space-y-3">
        <AnimatePresence mode="popLayout">
          {loading ? (
            // Loading skeletons
            Array.from({ length: 5 }).map((_, i) => (
              <motion.div
                key={`skeleton-${i}`}
                initial={{ opacity: 0, x: -20 }}
                animate={{ opacity: 1, x: 0 }}
                exit={{ opacity: 0, x: 20 }}
                transition={{ delay: i * 0.1 }}
                className="flex items-center gap-4 p-4 bg-gray-900/50 border border-gray-800/50 rounded-lg animate-pulse"
              >
                <div className="w-10 h-10 bg-gray-700 rounded-full"></div>
                <div className="flex-1">
                  <div className="h-4 bg-gray-700 rounded mb-2"></div>
                  <div className="h-3 bg-gray-700 rounded w-1/2"></div>
                </div>
                <div className="w-16 h-6 bg-gray-700 rounded"></div>
              </motion.div>
            ))
          ) : (
            sortedData.map((entry, index) => (
              <motion.div
                key={entry.user_id}
                layout
                initial={{ opacity: 0, x: -20 }}
                animate={{ opacity: 1, x: 0 }}
                exit={{ opacity: 0, x: 20 }}
                transition={{ duration: 0.3 }}
                className={`flex items-center gap-4 p-4 bg-gray-900/50 border rounded-lg backdrop-blur-sm ${
                  index < 3 ? `border-${color}-500/30 shadow-lg shadow-${color}-500/10` : 'border-gray-800/50'
                }`}
              >
                <div className="flex items-center justify-center w-10 h-10">
                  {getRankIcon(index)}
                </div>
                <div className="w-10 h-10 bg-gray-700 rounded-full overflow-hidden">
                  {entry.avatar_url ? (
                    <img src={entry.avatar_url} alt={entry.name} className="w-full h-full object-cover" />
                  ) : (
                    <div className="w-full h-full bg-gradient-to-br from-emerald-500 to-blue-500 flex items-center justify-center text-white font-bold">
                      {entry.name.charAt(0).toUpperCase()}
                    </div>
                  )}
                </div>
                <div className="flex-1">
                  <div className="font-mono text-white text-sm">{entry.name}</div>
                  <div className="text-xs text-gray-400">
                    {activeTab === 'HUNTING' && `Research: ${entry.researching_hours.toFixed(1)}hrs | Bugs: ${entry.bug_count}`}
                    {activeTab === 'RESEARCH' && `Hunting: ${entry.hunting_hours.toFixed(1)}hrs | Bugs: ${entry.bug_count}`}
                    {activeTab === 'BUGS' && `Hunting: ${entry.hunting_hours.toFixed(1)}hrs | Research: ${entry.researching_hours.toFixed(1)}hrs`}
                  </div>
                </div>
                <div className={`font-mono text-lg text-${color}-400`}>
                  {getValue(entry)} <span className="text-xs text-gray-400">{getUnit()}</span>
                </div>
              </motion.div>
            ))
          )}
        </AnimatePresence>
      </div>
    </motion.div>
  )
}