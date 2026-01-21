'use client'

import { useState } from 'react'
import { motion } from 'framer-motion'
import { Eye, EyeOff, Shield } from 'lucide-react'
import { getSupabase } from '@/lib/supabase'
import { Button } from '@/components/ui/button'
import { useRouter } from 'next/navigation'
import Link from 'next/link'

export default function LoginPage() {
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [showPassword, setShowPassword] = useState(false)
  const [isLoading, setIsLoading] = useState(false)
  const [error, setError] = useState('')
  const router = useRouter()

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault()
    setIsLoading(true)
    setError('')

    try {
      console.log('Attempting login with:', { email, password: '***' })

      const { data, error } = await (getSupabase() as any).auth.signInWithPassword({
        email,
        password,
      })

      console.log('Login response:', { data: data ? 'success' : null, error })

      if (error) {
        console.error('Login error:', error)
        throw error
      }

      if (data?.user) {
        console.log('Login successful, redirecting...')
        // Wait a moment for the session to be established
        await new Promise(resolve => setTimeout(resolve, 100))

        // Force a page reload to ensure middleware picks up the new session
        window.location.href = '/'
      } else {
        throw new Error('No user data received')
      }
    } catch (err: any) {
      console.error('Login failed:', err)
      setError(err.message || 'Login failed')
    } finally {
      setIsLoading(false)
    }
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
              <Shield className="w-16 h-16 mx-auto mb-4 text-emerald-400" />
            </motion.div>
            <h1 className="text-3xl font-bold text-emerald-400 mb-2 font-mono">
              ACCESS GRANTED?
            </h1>
            <p className="text-gray-400 font-mono">
              Enter your credentials to breach the system
            </p>
          </div>

          <form onSubmit={handleLogin} className="space-y-6">
            <motion.div
              initial={{ x: -50, opacity: 0 }}
              animate={{ x: 0, opacity: 1 }}
              transition={{ delay: 0.3 }}
            >
              <label className="block text-sm font-medium text-gray-300 mb-2 font-mono">
                EMAIL
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

            <motion.div
              initial={{ x: -50, opacity: 0 }}
              animate={{ x: 0, opacity: 1 }}
              transition={{ delay: 0.4 }}
            >
              <label className="block text-sm font-medium text-gray-300 mb-2 font-mono">
                PASSWORD
              </label>
              <div className="relative">
                <input
                  type={showPassword ? 'text' : 'password'}
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  className="w-full px-4 py-3 pr-12 bg-[#1a1a1a] border border-emerald-500/20 rounded-md text-white placeholder-gray-500 focus:border-emerald-400 focus:outline-none transition-colors font-mono"
                  placeholder="••••••••"
                  required
                />
                <button
                  type="button"
                  onClick={() => setShowPassword(!showPassword)}
                  className="absolute right-3 top-1/2 transform -translate-y-1/2 text-gray-400 hover:text-emerald-400 transition-colors"
                >
                  {showPassword ? <EyeOff size={20} /> : <Eye size={20} />}
                </button>
              </div>
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
              transition={{ delay: 0.5 }}
            >
              <Button
                type="submit"
                disabled={isLoading}
                className="w-full bg-emerald-600 hover:bg-emerald-700 text-white font-mono py-3 px-4 rounded-md transition-colors disabled:opacity-50"
              >
                {isLoading ? 'BREACHING...' : 'GRANT ACCESS'}
              </Button>
            </motion.div>
          </form>

          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ delay: 0.6 }}
            className="mt-8 text-center space-y-2"
          >
            <p className="text-gray-500 text-sm font-mono">
              Don't have an account?{' '}
              <Link href="/signup" className="text-emerald-400 hover:text-emerald-300 transition-colors">
                Join the breach
              </Link>
            </p>
            <p className="text-gray-500 text-sm font-mono">
              <Link href="/forgot-password" className="text-emerald-400 hover:text-emerald-300 transition-colors">
                Forgot your password?
              </Link>
            </p>
            <p className="text-gray-500 text-sm font-mono mt-4">
              Unauthorized access is prohibited
            </p>
          </motion.div>
        </div>
      </motion.div>
    </div>
  )
}