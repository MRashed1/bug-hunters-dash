'use client'

import { motion } from 'framer-motion'
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar' // Assuming we have this

interface StatusAvatarProps {
  name: string
  avatarUrl?: string
  status: 'HUNTING' | 'RESEARCHING' | 'IDLE' | 'OFFLINE'
}

const statusColors = {
  HUNTING: '#10b981', // Neon Emerald
  RESEARCHING: '#3b82f6', // Electric Cobalt
  IDLE: '#6b7280', // Gray
  OFFLINE: '#374151', // Dark Gray
}

export function StatusAvatar({ name, avatarUrl, status }: StatusAvatarProps) {
  return (
    <div className="relative">
      <Avatar className="w-12 h-12 border border-[#1a1a1a]">
        <AvatarImage src={avatarUrl} alt={name} />
        <AvatarFallback>{name.charAt(0)}</AvatarFallback>
      </Avatar>
      <motion.div
        className="absolute inset-0 rounded-full border-2"
        style={{ borderColor: statusColors[status] }}
        animate={{
          boxShadow: [
            `0 0 0 0 ${statusColors[status]}40`,
            `0 0 0 4px ${statusColors[status]}00`,
          ],
        }}
        transition={{
          duration: 2,
          repeat: Infinity,
          ease: 'easeInOut',
        }}
      />
    </div>
  )
}