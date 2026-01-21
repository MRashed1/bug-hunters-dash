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
      className="bg-[#050505] border border-gray-800/50 rounded-lg p-3 lg:p-4 backdrop-blur-md bg-opacity-95 h-full flex flex-col"
    >
      <h2 className="text-base lg:text-lg font-bold text-emerald-400 mb-3 lg:mb-4 font-mono text-center">
        SQUAD LEADERBOARD
      </h2>

      {/* Tab Switcher */}
      <div className="flex gap-1 mb-3 lg:mb-4 overflow-x-auto">
        {(['HUNTING', 'RESEARCH', 'BUGS'] as TabType[]).map((tab) => (
          <motion.button
            key={tab}
            onClick={() => setActiveTab(tab)}
            className={`flex-1 min-w-0 py-2 px-2 lg:px-3 rounded-md font-mono text-xs transition-all duration-300 flex items-center justify-center gap-1 min-h-[36px] ${
              activeTab === tab
                ? `bg-${color}-500/20 border border-${color}-500/50 text-${color}-400 shadow-lg shadow-${color}-500/20`
                : 'bg-gray-800/50 border border-gray-700/50 text-gray-400 hover:bg-gray-700/50'
            }`}
            whileHover={{ scale: 1.02 }}
            whileTap={{ scale: 0.98 }}
          >
            {getTabIcon(tab)}
            <span className="hidden sm:inline truncate">{tab}</span>
            <span className="sm:hidden">{tab.charAt(0)}</span>
          </motion.button>
        ))}
      </div>

      {/* Leaderboard List */}
      <div className="flex-1 space-y-2 overflow-y-auto">
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
                className="flex items-center gap-2 lg:gap-3 p-2 lg:p-3 bg-gray-900/50 border border-gray-800/50 rounded-lg animate-pulse"
              >
                <div className="w-6 h-6 lg:w-8 lg:h-8 bg-gray-700 rounded-full"></div>
                <div className="flex-1">
                  <div className="h-3 lg:h-4 bg-gray-700 rounded mb-1"></div>
                  <div className="h-2 lg:h-3 bg-gray-700 rounded w-1/2"></div>
                </div>
                <div className="w-10 lg:w-12 h-3 lg:h-4 bg-gray-700 rounded"></div>
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
                className={`flex items-center gap-2 lg:gap-3 p-2 lg:p-3 bg-gray-900/50 border rounded-lg backdrop-blur-sm cursor-pointer transition-all duration-300 hover:shadow-lg hover:shadow-${color}-500/20 ${
                  index < 3 ? `border-${color}-500/30 shadow-lg shadow-${color}-500/10` : 'border-gray-800/50'
                }`}
              >
                <div className="flex items-center justify-center w-6 h-6 lg:w-8 lg:h-8">
                  {getRankIcon(index)}
                </div>
                <div className="w-6 h-6 lg:w-8 lg:h-8 bg-gray-700 rounded-full overflow-hidden flex-shrink-0">
                  {entry.avatar_url ? (
                    <img src={entry.avatar_url} alt={entry.name} className="w-full h-full object-cover" />
                  ) : (
                    <div className="w-full h-full bg-gradient-to-br from-emerald-500 to-blue-500 flex items-center justify-center text-white font-bold text-xs lg:text-sm">
                      {entry.name.charAt(0).toUpperCase()}
                    </div>
                  )}
                </div>
                <div className="flex-1 min-w-0">
                  <div className="font-mono text-white text-xs lg:text-sm truncate">{entry.name}</div>
                  <div className="text-xs text-gray-400 hidden sm:block">
                    {activeTab === 'HUNTING' && `Research: ${entry.researching_hours.toFixed(1)}hrs | Bugs: ${entry.bug_count}`}
                    {activeTab === 'RESEARCH' && `Hunting: ${entry.hunting_hours.toFixed(1)}hrs | Bugs: ${entry.bug_count}`}
                    {activeTab === 'BUGS' && `Hunting: ${entry.hunting_hours.toFixed(1)}hrs | Research: ${entry.researching_hours.toFixed(1)}hrs`}
                  </div>
                </div>
                <div className={`font-mono text-sm lg:text-base text-${color}-400 flex-shrink-0 text-right`}>
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