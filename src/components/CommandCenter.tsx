'use client'

import { useState, useEffect } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { Play, Pause, Square, Zap, Brain } from 'lucide-react'
import { getSupabase } from '@/lib/supabase'
import { Button } from '@/components/ui/button'

interface CommandCenterProps {
  userId: string
  currentStatus: string
  onStatusChange: (status: string) => void
}

export function CommandCenter({ userId, currentStatus, onStatusChange }: CommandCenterProps) {
  const [isActive, setIsActive] = useState(false)
  const [time, setTime] = useState(0)
  const [sessionType, setSessionType] = useState<'HUNTING' | 'RESEARCHING' | null>(null)
  const [sessionId, setSessionId] = useState<string | null>(null)

  useEffect(() => {
    let interval: NodeJS.Timeout
    if (isActive) {
      interval = setInterval(() => {
        setTime((prev) => prev + 1)
      }, 1000)
    }
    return () => clearInterval(interval)
  }, [isActive])

  const startSession = async (type: 'HUNTING' | 'RESEARCHING') => {
    setIsActive(true)
    setSessionType(type)
    onStatusChange(type)

    // Create session record
    const supabase = getSupabase()
    const { data, error } = await supabase
      .from('sessions')
      .insert({
        user_id: userId,
        type: type,
        start_time: new Date().toISOString()
      })
      .select('id')
      .single()

    if (data) {
      setSessionId(data.id)
    }

    // Log activity to Supabase
    const activityDetails = type === 'HUNTING' ? 'Start Hunting' : 'Intel Gain'
    await supabase
      .from('activities')
      .insert({
        user_id: userId,
        action_type: 'TIP',
        details: activityDetails
      })

    await supabase
      .from('profiles')
      .update({ status: type })
      .eq('id', userId)
  }

  const pauseSession = () => {
    setIsActive(false)
    onStatusChange('IDLE')
  }

  const stopSession = async () => {
    if (!sessionId) return

    setIsActive(false)
    const durationMinutes = Math.floor(time / 60)

    const supabase = getSupabase()
    await supabase
      .from('sessions')
      .update({
        end_time: new Date().toISOString(),
        duration_minutes: durationMinutes
      })
      .eq('id', sessionId)

    setTime(0)
    setSessionType(null)
    setSessionId(null)
    onStatusChange('OFFLINE')

    await supabase
      .from('profiles')
      .update({ status: 'OFFLINE' })
      .eq('id', userId)
  }

  const formatTime = (seconds: number) => {
    const hrs = Math.floor(seconds / 3600)
    const mins = Math.floor((seconds % 3600) / 60)
    const secs = seconds % 60
    return `${hrs.toString().padStart(2, '0')}:${mins.toString().padStart(2, '0')}:${secs.toString().padStart(2, '0')}`
  }

  const getStatusColor = () => {
    switch (currentStatus) {
      case 'HUNTING': return 'text-emerald-400'
      case 'RESEARCHING': return 'text-blue-400'
      case 'IDLE': return 'text-yellow-400'
      case 'OFFLINE': return 'text-gray-400'
      default: return 'text-gray-400'
    }
  }

  return (
    <motion.div
      initial={{ opacity: 0, y: 50 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.6 }}
      className="bg-[#0a0a0a] border border-emerald-500/20 rounded-lg p-4 lg:p-6 backdrop-blur-md bg-opacity-10"
    >
      <h2 className="text-lg lg:text-xl font-bold text-emerald-400 mb-4 lg:mb-6 font-mono text-center">
        COMMAND CENTER
      </h2>

      {/* Status Display */}
      <div className="text-center mb-4 lg:mb-6">
        <div className={`text-xl lg:text-2xl font-mono ${getStatusColor()}`}>
          STATUS: {currentStatus}
        </div>
        <AnimatePresence>
          {isActive && (
            <motion.div
              initial={{ scale: 0 }}
              animate={{ scale: 1 }}
              exit={{ scale: 0 }}
              className="mt-2"
            >
              <div className="text-3xl lg:text-4xl font-mono text-emerald-400">
                {formatTime(time)}
              </div>
              <div className="text-sm text-gray-400 font-mono">
                {sessionType === 'HUNTING' ? 'LETHAL MODE' : 'INTEL MODE'}
              </div>
            </motion.div>
          )}
        </AnimatePresence>
      </div>

      {/* Control Buttons */}
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 lg:gap-4 mb-4 lg:mb-6">
        <motion.div
          whileHover={{ scale: 1.05 }}
          whileTap={{ scale: 0.95 }}
        >
          <Button
            onClick={() => startSession('HUNTING')}
            disabled={isActive}
            className="w-full bg-red-600 hover:bg-red-700 text-white font-mono py-4 px-4 rounded-md transition-colors disabled:opacity-50 flex items-center justify-center gap-2 min-h-[44px] text-sm lg:text-base"
          >
            <Zap size={20} />
            GO LETHAL
          </Button>
        </motion.div>

        <motion.div
          whileHover={{ scale: 1.05 }}
          whileTap={{ scale: 0.95 }}
        >
          <Button
            onClick={() => startSession('RESEARCHING')}
            disabled={isActive}
            className="w-full bg-blue-600 hover:bg-blue-700 text-white font-mono py-4 px-4 rounded-md transition-colors disabled:opacity-50 flex items-center justify-center gap-2 min-h-[44px] text-sm lg:text-base"
          >
            <Brain size={20} />
            START INTEL
          </Button>
        </motion.div>
      </div>

      {/* Session Controls */}
      <AnimatePresence>
        {isActive && (
          <motion.div
            initial={{ opacity: 0, height: 0 }}
            animate={{ opacity: 1, height: 'auto' }}
            exit={{ opacity: 0, height: 0 }}
            className="flex flex-col sm:flex-row gap-2"
          >
            <Button
              onClick={pauseSession}
              variant="outline"
              className="flex-1 border-emerald-500/20 hover:bg-emerald-500/10 font-mono py-3 min-h-[44px] text-sm lg:text-base"
            >
              <Pause size={16} className="mr-2" />
              PAUSE
            </Button>
            <Button
              onClick={stopSession}
              variant="outline"
              className="flex-1 border-red-500/20 hover:bg-red-500/10 font-mono py-3 min-h-[44px] text-sm lg:text-base"
            >
              <Square size={16} className="mr-2" />
              END
            </Button>
          </motion.div>
        )}
      </AnimatePresence>
    </motion.div>
  )
}