'use client'

import { useState } from 'react'
import { motion } from 'framer-motion'
import { Mail, ArrowLeft } from 'lucide-react'
import { getSupabase } from '@/lib/supabase'
import { Button } from '@/components/ui/button'
import { useRouter } from 'next/navigation'
import Link from 'next/link'

export default function ForgotPasswordPage() {
  const [email, setEmail] = useState('')
  const [isLoading, setIsLoading] = useState(false)
  const [error, setError] = useState('')
  const [success, setSuccess] = useState(false)
  const router = useRouter()

  const handleResetPassword = async (e: React.FormEvent) => {
    e.preventDefault()
    setIsLoading(true)
    setError('')

    try {
      const { error } = await (getSupabase() as any).auth.resetPasswordForEmail(email, {
        redirectTo: `${window.location.origin}/reset-password`,
      })

      if (error) throw error

      setSuccess(true)
    } catch (err: any) {
      setError(err.message || 'Failed to send reset email')
    } finally {
      setIsLoading(false)
    }
  }

  if (success) {
    return (
      <div className="min-h-screen bg-[#050505] flex items-center justify-center p-4">
        <motion.div
          initial={{ opacity: 0, y: 50 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.8 }}
          className="w-full max-w-md text-center"
        >
          <div className="bg-[#0a0a0a] border border-emerald-500/20 rounded-lg p-8 backdrop-blur-md bg-opacity-10">
            <motion.div
              initial={{ scale: 0 }}
              animate={{ scale: 1 }}
              transition={{ delay: 0.2, type: 'spring', stiffness: 200 }}
            >
              <Mail className="w-16 h-16 mx-auto mb-4 text-emerald-400" />
            </motion.div>
            <h1 className="text-3xl font-bold text-emerald-400 mb-4 font-mono">
              CHECK YOUR EMAIL
            </h1>
            <p className="text-gray-400 font-mono mb-6">
              We've sent a password reset link to <strong className="text-emerald-400">{email}</strong>
            </p>
            <p className="text-gray-500 text-sm font-mono mb-6">
              Click the link in the email to reset your password. The link will expire in 1 hour.
            </p>
            <Link href="/login">
              <Button className="bg-emerald-600 hover:bg-emerald-700 text-white font-mono">
                <ArrowLeft size={16} className="mr-2" />
                BACK TO LOGIN
              </Button>
            </Link>
          </div>
        </motion.div>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-[#050505] flex items-center justify-center p-4">
      <motion.div
        initial={{ opacity: 0, y: 50 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.8 }}
        className="w-full max-w-md"
      >
        <div className="bg-[#0a0a0a] border border-emerald-500/20 rounded-lg p-8 backdrop-blur-md bg-opacity-10">
          <div className="text-center mb-8">
            <motion.div
              initial={{ scale: 0 }}
              animate={{ scale: 1 }}
              transition={{ delay: 0.2, type: 'spring', stiffness: 200 }}
            >
              <Mail className="w-16 h-16 mx-auto mb-4 text-emerald-400" />
            </motion.div>
            <h1 className="text-3xl font-bold text-emerald-400 mb-2 font-mono">
              RESET PASSWORD
            </h1>
            <p className="text-gray-400 font-mono">
              Enter your email to receive a reset link
            </p>
          </div>

          <form onSubmit={handleResetPassword} className="space-y-6">
            <motion.div
              initial={{ x: -50, opacity: 0 }}
              animate={{ x: 0, opacity: 1 }}
              transition={{ delay: 0.3 }}
            >
              <label className="block text-sm font-medium text-gray-300 mb-2 font-mono">
                EMAIL ADDRESS
              </label>
              <input
                type="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                className="w-full px-4 py-3 bg-[#1a1a1a] border border-emerald-500/20 rounded-md text-white placeholder-gray-500 focus:border-emerald-400 focus:outline-none transition-colors font-mono"
                placeholder="hunter@breach.com"
                required
              />
            </motion.div>

            {error && (
              <motion.div
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                className="text-red-400 text-sm font-mono text-center"
              >
                {error}
              </motion.div>
            )}

            <motion.div
              initial={{ y: 50, opacity: 0 }}
              animate={{ y: 0, opacity: 1 }}
              transition={{ delay: 0.4 }}
            >
              <Button
                type="submit"
                disabled={isLoading}
                className="w-full bg-emerald-600 hover:bg-emerald-700 text-white font-mono py-3 px-4 rounded-md transition-colors disabled:opacity-50"
              >
                {isLoading ? 'SENDING...' : 'SEND RESET LINK'}
              </Button>
            </motion.div>
          </form>

          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ delay: 0.5 }}
            className="mt-8 text-center"
          >
            <Link href="/login" className="text-emerald-400 hover:text-emerald-300 transition-colors font-mono">
              <ArrowLeft size={16} className="inline mr-2" />
              Back to Login
            </Link>
          </motion.div>
        </div>
      </motion.div>
    </div>
  )
}