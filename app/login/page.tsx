"use client"

import { useState } from 'react'
import Link from 'next/link'
import { useRouter } from 'next/navigation'
import { FiLogIn, FiMail, FiLock } from 'react-icons/fi'
import { useAuthStore } from '@/lib/authStore'

export default function LoginPage() {
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [error, setError] = useState('')
  const [loading, setLoading] = useState(false)
  const router = useRouter()
  const setUser = useAuthStore((state) => state.setUser)

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setError('')
    setLoading(true)

    try {
      const res = await fetch('/api/auth/login', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email, password }),
      })

      const data = await res.json()
      if (!res.ok) {
        throw new Error(data.error || 'خطا در ورود')
      }

      // ✅ کاربر را در store ذخیره کنید
      if (data.user) {
        setUser(data.user)
      }

      router.push('/')
      router.refresh()
    } catch (err) {
      setError(err instanceof Error ? err.message : 'خطا')
    } finally {
      setLoading(false)
    }
  }

  return (
    <main className="relative h-dvh flex items-center justify-center overflow-hidden bg-gradient-to-br from-red-50 via-white to-orange-50">
      {/* عناصر تزئینی پس‌زمینه */}
      <div className="absolute -top-20 -left-20 w-72 h-72 bg-red-200/40 rounded-full blur-3xl pointer-events-none" />
      <div className="absolute -bottom-24 -right-24 w-96 h-96 bg-rose-200/30 rounded-full blur-3xl pointer-events-none" />

      <div className="relative w-full max-w-md">
        {/* هدر */}
        <div className="text-center mb-2">
          <div className="w-16 h-16 mx-auto mb-2 bg-gradient-to-br from-red-500 to-rose-600 rounded-2xl flex items-center justify-center text-white text-3xl font-black shadow-xl shadow-red-200 ring-4 ring-white">
            P
          </div>
          <h1 className="text-3xl font-black text-transparent bg-clip-text bg-gradient-to-r from-red-600 to-rose-600">
            ورود به حساب
          </h1>
          <p className="text-gray-500 text-sm mt-2">خوش برگشتی!</p>
        </div>

        {/* فرم شیشه‌ای */}
        <form
          onSubmit={handleSubmit}
          className="bg-white/80 backdrop-blur-xl rounded-3xl p-8 shadow-2xl shadow-red-100/60 border border-white/60 space-y-5"
        >
          {error && (
            <div className="bg-red-50 border border-red-200 text-red-600 px-4 py-3 rounded-xl text-sm flex items-center gap-2">
              <span className="w-2 h-2 rounded-full bg-red-500 animate-pulse" />
              {error}
            </div>
          )}

          <div>
            <label className="block text-sm font-bold text-gray-700 mb-1.5">ایمیل</label>
            <div className="relative">
              <span className="absolute right-2 top-1/2 -translate-y-1/2 w-8 h-8 bg-red-50 rounded-lg flex items-center justify-center text-red-400">
                <FiMail className="w-4 h-4" />
              </span>
              <input
                type="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                placeholder="you@example.com"
                className="w-full border-2 border-gray-200 rounded-xl pr-12 pl-4 py-3 text-gray-900 placeholder-gray-400 focus:outline-none focus:border-red-400 focus:ring-4 focus:ring-red-100/70 transition-all bg-white/50"
                dir="ltr"
                required
              />
            </div>
          </div>

          <div>
            <label className="block text-sm font-bold text-gray-700 mb-1.5">رمز عبور</label>
            <div className="relative">
              <span className="absolute right-2 top-1/2 -translate-y-1/2 w-8 h-8 bg-red-50 rounded-lg flex items-center justify-center text-red-400">
                <FiLock className="w-4 h-4" />
              </span>
              <input
                type="password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                placeholder="••••••••"
                className="w-full border-2 border-gray-200 rounded-xl pr-12 pl-4 py-3 text-gray-900 placeholder-gray-400 focus:outline-none focus:border-red-400 focus:ring-4 focus:ring-red-100/70 transition-all bg-white/50"
                dir="ltr"
                required
              />
            </div>
          </div>

          <button
            type="submit"
            disabled={loading}
            className="w-full bg-gradient-to-r from-red-600 to-rose-600 text-white font-bold py-3.5 rounded-xl transition-all duration-300 shadow-lg shadow-red-200 hover:shadow-xl hover:shadow-red-300/50 hover:-translate-y-0.5 active:translate-y-0 active:scale-[0.98] flex items-center justify-center gap-2 disabled:opacity-50 disabled:cursor-not-allowed"
          >
            <FiLogIn className="text-lg" />
            {loading ? 'در حال ورود...' : 'ورود'}
          </button>
        </form>

        <p className="text-center text-sm text-gray-600 mt-6">
          حساب نداری؟{' '}
          <Link
            href="/register"
            className="text-red-600 font-bold hover:underline underline-offset-4 transition-all"
          >
            ثبت‌نام کن
          </Link>
        </p>
      </div>
    </main>
  )
}