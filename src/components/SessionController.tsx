'use client'

import { useState, useEffect } from 'react'
import { motion } from 'framer-motion'
import { Play, Pause, Square } from 'lucide-react'
import { getSupabase } from '@/lib/supabase'
import { Button } from '@/components/ui/button' // Need to create

interface SessionControllerProps {
  userId: string
  onStatusChange: (status: string) => void
}

export function SessionController({ userId, onStatusChange }: SessionControllerProps) {
  const [isActive, setIsActive] = useState(false)
  const [time, setTime] = useState(0)

  useEffect(() => {
    let interval: NodeJS.Timeout
    if (isActive) {
      interval = setInterval(() => {
        setTime((prev) => prev + 1)
      }, 1000)
    }
    return () => clearInterval(interval)
  }, [isActive])

  const startSession = async () => {
    setIsActive(true)
    onStatusChange('HUNTING')
    await (getSupabase() as any)
      .from('profiles')
      .update({ status: 'HUNTING' })
      .eq('id', userId)
  }

  const pauseSession = () => {
    setIsActive(false)
    onStatusChange('IDLE')
    // Update DB
  }

  const stopSession = async () => {
    setIsActive(false)
    setTime(0)
    onStatusChange('OFFLINE')
    await (getSupabase() as any)
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

  return (
    <div className="flex flex-col items-center space-y-4">
      <motion.div
        className="text-6xl font-mono text-[#10b981]"
        animate={{ scale: isActive ? [1, 1.05, 1] : 1 }}
        transition={{ duration: 1, repeat: isActive ? Infinity : 0 }}
      >
        {formatTime(time)}
      </motion.div>
      <div className="flex space-x-2">
        <Button onClick={startSession} disabled={isActive}>
          <Play className="w-4 h-4" />
        </Button>
        <Button onClick={pauseSession} disabled={!isActive}>
          <Pause className="w-4 h-4" />
        </Button>
        <Button onClick={stopSession}>
          <Square className="w-4 h-4" />
        </Button>
      </div>
    </div>
  )
}