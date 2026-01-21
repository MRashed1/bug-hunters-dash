'use client'

import { useState, useEffect, Suspense } from 'react'
import { motion } from 'framer-motion'
import { Mail, Lock, Eye, EyeOff, CheckCircle, ArrowLeft } from 'lucide-react'
import { getSupabase } from '@/lib/supabase'
import { Button } from '@/components/ui/button'
import { useRouter, useSearchParams } from 'next/navigation'
import Link from 'next/link'

function ResetPasswordForm() {
  const [step, setStep] = useState<'request' | 'reset'>('request') // خطوة الطلب أو إعادة التعيين
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [confirmPassword, setConfirmPassword] = useState('')
  const [showPassword, setShowPassword] = useState(false)
  const [showConfirmPassword, setShowConfirmPassword] = useState(false)
  const [isLoading, setIsLoading] = useState(false)
  const [error, setError] = useState('')
  const [success, setSuccess] = useState(false)
  const router = useRouter()
  const searchParams = useSearchParams()

  useEffect(() => {
    // التحقق من وجود access_token في URL (يعني أن المستخدم جاء من البريد الإلكتروني)
    const accessToken = searchParams.get('access_token')
    const type = searchParams.get('type')

    if (accessToken && type === 'recovery') {
      setStep('reset')
      // تعيين الجلسة تلقائياً
      const setSession = async () => {
        try {
          const { error } = await (getSupabase() as any).auth.setSession({
            access_token: accessToken,
            refresh_token: searchParams.get('refresh_token') || '',
          })

          if (error) {
            console.error('Session error:', error)
            setError('Invalid or expired reset link. Please request a new one.')
          }
        } catch (err) {
          console.error('Session setup error:', err)
          setError('Invalid or expired reset link. Please request a new one.')
        }
      }

      setSession()
    }
  }, [searchParams])

  const handleRequestReset = async (e: React.FormEvent) => {
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

  const handleResetPassword = async (e: React.FormEvent) => {
    e.preventDefault()
    setIsLoading(true)
    setError('')

    if (password !== confirmPassword) {
      setError('Passwords do not match')
      setIsLoading(false)
      return
    }

    if (password.length < 6) {
      setError('Password must be at least 6 characters')
      setIsLoading(false)
      return
    }

    try {
      const { error } = await (getSupabase() as any).auth.updateUser({
        password: password
      })

      if (error) throw error

      setSuccess(true)

      // إعادة توجيه لصفحة اللوجين بعد 3 ثوان
      setTimeout(() => {
        router.push('/login?message=Password updated successfully')
      }, 3000)
    } catch (err: any) {
      setError(err.message || 'Failed to update password')
    } finally {
      setIsLoading(false)
    }
  }

  // شاشة النجاح للطلب
  if (success && step === 'request') {
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

  // شاشة النجاح لإعادة التعيين
  if (success && step === 'reset') {
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
              <CheckCircle className="w-16 h-16 mx-auto mb-4 text-emerald-400" />
            </motion.div>
            <h1 className="text-3xl font-bold text-emerald-400 mb-4 font-mono">
              PASSWORD UPDATED
            </h1>
            <p className="text-gray-400 font-mono mb-6">
              Your password has been successfully updated!
            </p>
            <p className="text-gray-500 text-sm font-mono">
              Redirecting to login page...
            </p>
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
              {step === 'request' ? (
                <Mail className="w-16 h-16 mx-auto mb-4 text-emerald-400" />
              ) : (
                <Lock className="w-16 h-16 mx-auto mb-4 text-emerald-400" />
              )}
            </motion.div>
            <h1 className="text-3xl font-bold text-emerald-400 mb-2 font-mono">
              {step === 'request' ? 'RESET PASSWORD' : 'SET NEW PASSWORD'}
            </h1>
            <p className="text-gray-400 font-mono">
              {step === 'request'
                ? 'Enter your email to receive a reset link'
                : 'Enter your new password below'
              }
            </p>
          </div>

          {error && (
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              className="mb-6 p-4 bg-red-900/20 border border-red-500/20 rounded-md"
            >
              <p className="text-red-400 text-sm font-mono text-center">
                {error}
              </p>
            </motion.div>
          )}

          {step === 'request' ? (
            // نموذج طلب إعادة التعيين
            <form onSubmit={handleRequestReset} className="space-y-6">
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
          ) : (
            // نموذج إعادة تعيين كلمة المرور
            <form onSubmit={handleResetPassword} className="space-y-6">
              <motion.div
                initial={{ x: -50, opacity: 0 }}
                animate={{ x: 0, opacity: 1 }}
                transition={{ delay: 0.3 }}
              >
                <label className="block text-sm font-medium text-gray-300 mb-2 font-mono">
                  NEW PASSWORD
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

              <motion.div
                initial={{ x: -50, opacity: 0 }}
                animate={{ x: 0, opacity: 1 }}
                transition={{ delay: 0.4 }}
              >
                <label className="block text-sm font-medium text-gray-300 mb-2 font-mono">
                  CONFIRM NEW PASSWORD
                </label>
                <div className="relative">
                  <input
                    type={showConfirmPassword ? 'text' : 'password'}
                    value={confirmPassword}
                    onChange={(e) => setConfirmPassword(e.target.value)}
                    className="w-full px-4 py-3 pr-12 bg-[#1a1a1a] border border-emerald-500/20 rounded-md text-white placeholder-gray-500 focus:border-emerald-400 focus:outline-none transition-colors font-mono"
                    placeholder="••••••••"
                    required
                  />
                  <button
                    type="button"
                    onClick={() => setShowConfirmPassword(!showConfirmPassword)}
                    className="absolute right-3 top-1/2 transform -translate-y-1/2 text-gray-400 hover:text-emerald-400 transition-colors"
                  >
                    {showConfirmPassword ? <EyeOff size={20} /> : <Eye size={20} />}
                  </button>
                </div>
              </motion.div>

              <motion.div
                initial={{ y: 50, opacity: 0 }}
                animate={{ y: 0, opacity: 1 }}
                transition={{ delay: 0.5 }}
              >
                <Button
                  type="submit"
                  disabled={isLoading || !!error}
                  className="w-full bg-emerald-600 hover:bg-emerald-700 text-white font-mono py-3 px-4 rounded-md transition-colors disabled:opacity-50"
                >
                  {isLoading ? 'UPDATING...' : 'UPDATE PASSWORD'}
                </Button>
              </motion.div>
            </form>
          )}

          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ delay: 0.6 }}
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

export default function ResetPasswordPage() {
  return (
    <Suspense fallback={
      <div className="min-h-screen bg-[#050505] flex items-center justify-center">
        <div className="text-emerald-400 font-mono">Loading...</div>
      </div>
    }>
      <ResetPasswordForm />
    </Suspense>
  )
}