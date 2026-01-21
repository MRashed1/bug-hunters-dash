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
  const [startTime, setStartTime] = useState<Date | null>(null)
  const [sessionId, setSessionId] = useState<string | null>(null)

  // Check for active session on mount
  useEffect(() => {
    const checkActiveSession = async () => {
      const supabase = getSupabase()
      const { data } = await supabase
        .from('sessions')
        .select('*')
        .eq('user_id', userId)
        .is('end_time', null)
        .single()

      if (data) {
        setSessionId(data.id)
        setSessionType(data.type)
        setStartTime(new Date(data.start_time))
        setIsActive(true)
        onStatusChange(data.type)
        // Calculate elapsed time
        const elapsed = Math.floor((new Date().getTime() - new Date(data.start_time).getTime()) / 1000)
        setTime(elapsed)
      }
    }
    checkActiveSession()
  }, [userId, onStatusChange])

  // Heartbeat every 30 seconds
  useEffect(() => {
    if (!isActive) return

    const heartbeat = setInterval(async () => {
      const supabase = getSupabase()
      await supabase
        .from('profiles')
        .update({ updated_at: new Date().toISOString() })
        .eq('id', userId)
    }, 30000)

    return () => clearInterval(heartbeat)
  }, [isActive, userId])

  // Timer
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
    const supabase = getSupabase()
    const start = new Date()

    // Insert new session
    const { data, error } = await supabase
      .from('sessions')
      .insert({
        user_id: userId,
        type,
        start_time: start.toISOString(),
        end_time: null,
        duration_minutes: null
      })
      .select()
      .single()

    if (error) {
      console.error('Error starting session:', error)
      return
    }

    setSessionId(data.id)
    setIsActive(true)
    setSessionType(type)
    setStartTime(start)
    setTime(0)
    onStatusChange(type)

    // Update profile status
    await supabase
      .from('profiles')
      .update({ status: type })
      .eq('id', userId)

    // Log activity
    const activityDetails = type === 'HUNTING' ? 'Start Hunting' : 'Intel Gain'
    await supabase
      .from('activities')
      .insert({
        user_id: userId,
        action_type: 'TIP',
        details: activityDetails
      })
  }

  const pauseSession = () => {
    setIsActive(false)
    onStatusChange('IDLE')
  }

  const stopSession = async () => {
    if (!sessionId || !startTime) return

    const supabase = getSupabase()
    const endTime = new Date()
    const durationMinutes = Math.floor((endTime.getTime() - startTime.getTime()) / (1000 * 60))

    // Update session
    await supabase
      .from('sessions')
      .update({
        end_time: endTime.toISOString(),
        duration_minutes: durationMinutes
      })
      .eq('id', sessionId)

    setIsActive(false)
    setTime(0)
    setSessionType(null)
    setStartTime(null)
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
      className="bg-[#0a0a0a] border border-emerald-500/20 rounded-lg p-3 lg:p-4 backdrop-blur-md bg-opacity-10"
    >
      <h2 className="text-base lg:text-lg font-bold text-emerald-400 mb-3 lg:mb-4 font-mono text-center">
        COMMAND CENTER
      </h2>

      {/* Status Display */}
      <div className="text-center mb-3 lg:mb-4">
        <motion.div
          animate={isActive ? { opacity: [1, 0.6, 1] } : {}}
          transition={isActive ? { duration: 1.5, repeat: Infinity } : {}}
          className={`text-lg lg:text-xl font-mono ${getStatusColor()}`}
        >
          STATUS: {currentStatus}
        </motion.div>
        <AnimatePresence>
          {isActive && (
            <motion.div
              initial={{ scale: 0 }}
              animate={{ scale: 1 }}
              exit={{ scale: 0 }}
              className="mt-1 lg:mt-2"
            >
              <motion.div
                animate={{ opacity: [1, 0.5, 1], textShadow: ['0 0 10px rgba(16, 185, 129, 0.5)', '0 0 25px rgba(16, 185, 129, 1)', '0 0 10px rgba(16, 185, 129, 0.5)'] }}
                transition={{ duration: 1.5, repeat: Infinity }}
                className="text-2xl lg:text-3xl font-mono text-emerald-400 font-bold"
              >
                {formatTime(time)}
              </motion.div>
              <div className="text-xs lg:text-sm text-gray-400 font-mono">
                {sessionType === 'HUNTING' ? 'HUNTING MODE' : 'RESEARCH MODE'}
              </div>
            </motion.div>
          )}
        </AnimatePresence>
      </div>

      {/* Control Buttons */}
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 lg:gap-3 mb-3 lg:mb-4">
        <motion.div
          whileHover={{ scale: 1.05 }}
          whileTap={{ scale: 0.95 }}
        >
          <Button
            onClick={() => isActive && sessionType === 'HUNTING' ? stopSession() : startSession('HUNTING')}
            className={`w-full text-white font-mono py-3 px-3 lg:px-4 rounded-md transition-all flex items-center justify-center gap-1 lg:gap-2 min-h-[40px] lg:min-h-[44px] text-sm lg:text-base font-semibold ${
              isActive && sessionType === 'HUNTING'
                ? 'bg-red-700 hover:bg-red-800 shadow-lg shadow-red-500/50'
                : 'bg-red-600 hover:bg-red-700'
            }`}
          >
            <Zap size={18} className="lg:w-5 lg:h-5" />
            {isActive && sessionType === 'HUNTING' ? 'STOP HUNTING' : 'START HUNTING'}
          </Button>
        </motion.div>

        <motion.div
          whileHover={{ scale: 1.05 }}
          whileTap={{ scale: 0.95 }}
        >
          <Button
            onClick={() => isActive && sessionType === 'RESEARCHING' ? stopSession() : startSession('RESEARCHING')}
            className={`w-full text-white font-mono py-3 px-3 lg:px-4 rounded-md transition-all flex items-center justify-center gap-1 lg:gap-2 min-h-[40px] lg:min-h-[44px] text-sm lg:text-base font-semibold ${
              isActive && sessionType === 'RESEARCHING'
                ? 'bg-blue-700 hover:bg-blue-800 shadow-lg shadow-blue-500/50'
                : 'bg-blue-600 hover:bg-blue-700'
            }`}
          >
            <Brain size={18} className="lg:w-5 lg:h-5" />
            {isActive && sessionType === 'RESEARCHING' ? 'STOP RESEARCH' : 'START RESEARCH'}
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
              className="flex-1 border-yellow-500/20 hover:bg-yellow-500/10 text-yellow-400 font-mono py-2 lg:py-3 min-h-[40px] lg:min-h-[44px] text-sm lg:text-base"
            >
              <Pause size={14} className="mr-1 lg:mr-2" />
              PAUSE
            </Button>
            <Button
              onClick={stopSession}
              variant="outline"
              className="flex-1 border-red-500/20 hover:bg-red-500/10 text-red-400 font-mono py-2 lg:py-3 min-h-[40px] lg:min-h-[44px] text-sm lg:text-base"
            >
              <Square size={14} className="mr-1 lg:mr-2" />
              END SESSION
            </Button>
          </motion.div>
        )}
      </AnimatePresence>
    </motion.div>
  )
}