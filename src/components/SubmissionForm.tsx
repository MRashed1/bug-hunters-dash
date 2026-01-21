'use client'

import { useState } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { X, Send, AlertTriangle, Bug, TestTube } from 'lucide-react'
import { getSupabase } from '@/lib/supabase'
import { Button } from '@/components/ui/button'

interface SubmissionFormProps {
  userId: string
  isOpen: boolean
  onClose: () => void
}

const vulnerabilityTypes = [
  'XSS', 'SQLi', 'SSRF', 'CSRF', 'IDOR', 'RCE', 'LFI/RFI', 'XXE', 'Other'
]

const intensities = ['Critical', 'High', 'Medium', 'Low', 'Info']

export function SubmissionForm({ userId, isOpen, onClose }: SubmissionFormProps) {
  const [formData, setFormData] = useState({
    title: '',
    type: '',
    intensity: '',
    link: '',
    description: ''
  })
  const [isSubmitting, setIsSubmitting] = useState(false)

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setIsSubmitting(true)

    try {
      // Check if user is banned
      const { data: profile } = await (getSupabase() as any)
        .from('profiles')
        .select('banned')
        .eq('id', userId)
        .single()

      if (profile?.banned) {
        alert('You are banned and cannot submit findings.')
        setIsSubmitting(false)
        return
      }

      // Insert into activities table
      await (getSupabase() as any).from('activities').insert({
        user_id: userId,
        action_type: 'BUG',
        details: `${formData.title} - ${formData.type} (${formData.intensity})`,
        link: formData.link
      })

      // Reset form and close
      setFormData({
        title: '',
        type: '',
        intensity: '',
        link: '',
        description: ''
      })
      onClose()
    } catch (error) {
      console.error('Submission failed:', error)
    } finally {
      setIsSubmitting(false)
    }
  }

  const handleChange = (field: string, value: string) => {
    setFormData(prev => ({ ...prev, [field]: value }))
  }

  return (
    <AnimatePresence>
      {isOpen && (
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          className="fixed inset-0 bg-black/50 backdrop-blur-sm z-50 flex items-center justify-center p-4"
          onClick={onClose}
        >
          <motion.div
            initial={{ scale: 0.9, opacity: 0 }}
            animate={{ scale: 1, opacity: 1 }}
            exit={{ scale: 0.9, opacity: 0 }}
            onClick={(e) => e.stopPropagation()}
            className="bg-[#0a0a0a] border border-emerald-500/20 rounded-lg p-6 w-full max-w-md backdrop-blur-md bg-opacity-10"
          >
            <div className="flex items-center justify-between mb-6">
              <h2 className="text-xl font-bold text-emerald-400 font-mono flex items-center gap-2">
                <Bug size={24} />
                SUBMIT FINDING
              </h2>
              <button
                onClick={onClose}
                className="text-gray-400 hover:text-emerald-400 transition-colors"
              >
                <X size={24} />
              </button>
            </div>

            <form onSubmit={handleSubmit} className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-300 mb-2 font-mono">
                  TITLE
                </label>
                <input
                  type="text"
                  value={formData.title}
                  onChange={(e) => handleChange('title', e.target.value)}
                  className="w-full px-4 py-3 bg-[#1a1a1a] border border-emerald-500/20 rounded-md text-white placeholder-gray-500 focus:border-emerald-400 focus:outline-none transition-colors font-mono"
                  placeholder="e.g., XSS in login form"
                  required
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-300 mb-2 font-mono">
                  TYPE
                </label>
                <select
                  value={formData.type}
                  onChange={(e) => handleChange('type', e.target.value)}
                  className="w-full px-4 py-3 bg-[#1a1a1a] border border-emerald-500/20 rounded-md text-white focus:border-emerald-400 focus:outline-none transition-colors font-mono"
                  required
                >
                  <option value="">Select vulnerability type</option>
                  {vulnerabilityTypes.map(type => (
                    <option key={type} value={type}>{type}</option>
                  ))}
                </select>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-300 mb-2 font-mono">
                  INTENSITY
                </label>
                <select
                  value={formData.intensity}
                  onChange={(e) => handleChange('intensity', e.target.value)}
                  className="w-full px-4 py-3 bg-[#1a1a1a] border border-emerald-500/20 rounded-md text-white focus:border-emerald-400 focus:outline-none transition-colors font-mono"
                  required
                >
                  <option value="">Select severity</option>
                  {intensities.map(intensity => (
                    <option key={intensity} value={intensity}>{intensity}</option>
                  ))}
                </select>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-300 mb-2 font-mono">
                  LINK
                </label>
                <input
                  type="url"
                  value={formData.link}
                  onChange={(e) => handleChange('link', e.target.value)}
                  className="w-full px-4 py-3 bg-[#1a1a1a] border border-emerald-500/20 rounded-md text-white placeholder-gray-500 focus:border-emerald-400 focus:outline-none transition-colors font-mono"
                  placeholder="https://example.com/vulnerable-endpoint"
                  required
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-300 mb-2 font-mono">
                  DESCRIPTION (OPTIONAL)
                </label>
                <textarea
                  value={formData.description}
                  onChange={(e) => handleChange('description', e.target.value)}
                  rows={3}
                  className="w-full px-4 py-3 bg-[#1a1a1a] border border-emerald-500/20 rounded-md text-white placeholder-gray-500 focus:border-emerald-400 focus:outline-none transition-colors font-mono resize-none"
                  placeholder="Additional details..."
                />
              </div>

              <div className="flex gap-3 pt-4">
                <Button
                  type="button"
                  onClick={onClose}
                  variant="outline"
                  className="flex-1 border-emerald-500/20 hover:bg-emerald-500/10 font-mono"
                >
                  CANCEL
                </Button>
                <Button
                  type="submit"
                  disabled={isSubmitting}
                  className="flex-1 bg-emerald-600 hover:bg-emerald-700 text-white font-mono py-3 px-4 rounded-md transition-colors disabled:opacity-50 flex items-center justify-center gap-2"
                >
                  <Send size={16} />
                  {isSubmitting ? 'SUBMITTING...' : 'SUBMIT'}
                </Button>
              </div>
            </form>
          </motion.div>
        </motion.div>
      )}
    </AnimatePresence>
  )
}