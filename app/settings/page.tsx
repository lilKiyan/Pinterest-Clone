"use client"

import { useEffect, useState } from 'react'
import { useRouter } from 'next/navigation'
import { useAuthStore } from '@/lib/authStore'
import {
    FiUser,
    FiAtSign,
    FiMail,
    FiLock,
    FiCamera,
    FiSave,
    FiCheckCircle,
    FiAlertCircle,
    FiShield,
    FiEye,
    FiEyeOff,
    FiEdit3,
} from 'react-icons/fi'

export default function SettingsPage() {
    const { user, setUser } = useAuthStore()
    const router = useRouter()

    const [name, setName] = useState(user?.name || '')
    const [username, setUsername] = useState(user?.username || '')
    const [email, setEmail] = useState(user?.email || '')
    const [bio, setBio] = useState(user?.bio || '')
    const [avatar, setAvatar] = useState(user?.avatar || '')

    const [oldPassword, setOldPassword] = useState('')
    const [newPassword, setNewPassword] = useState('')

    // ── state های صرفاً UI (بدون تأثیر روی لاجیک) ──
    const [showOldPassword, setShowOldPassword] = useState(false)
    const [showNewPassword, setShowNewPassword] = useState(false)
    const [isAvatarUploading, setIsAvatarUploading] = useState(false)

    const [loading, setLoading] = useState(false)
    const [error, setError] = useState('')
    const [success, setSuccess] = useState('')

    // مقادیر اولیه برای تشخیص تغییر (صرفاً نمایشی)
    const initialData = {
        name: user?.name || '',
        username: user?.username || '',
        email: user?.email || '',
        bio: user?.bio || '',
        avatar: user?.avatar || '',
    }
    const hasChanges =
        name !== initialData.name ||
        username !== initialData.username ||
        email !== initialData.email ||
        bio !== initialData.bio ||
        avatar !== initialData.avatar ||
        oldPassword !== '' ||
        newPassword !== ''

    useEffect(() => {
        if (!user) {
            fetch('/api/auth/me')
                .then(res => res.ok ? res.json() : null)
                .then(data => {
                    if (data?.user) {
                        setUser(data.user)
                        setName(data.user.name)
                        setUsername(data.user.username)
                        setEmail(data.user.email)
                        setBio(data.user.bio || '')
                        setAvatar(data.user.avatar || '')
                    }
                })
                .catch(console.error)
        }
    }, [user, setUser])

    const handleAvatarUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
        const file = e.target.files?.[0]
        if (!file) return
        const formData = new FormData()
        formData.append('file', file)
        setIsAvatarUploading(true)
        try {
            const res = await fetch('/api/upload', {
                method: 'POST',
                body: formData,
            })
            if (!res.ok) throw new Error('خطا در آپلود تصویر')
            const data = await res.json()
            setAvatar(data.imageUrl)
        } catch (err) {
            setError('خطا در آپلود تصویر')
        } finally {
            setIsAvatarUploading(false)
        }
    }

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault()
        setError('')
        setSuccess('')
        setLoading(true)

        try {
            const res = await fetch('/api/user', {
                method: 'PATCH',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    name,
                    username,
                    email,
                    bio,
                    avatar,
                    oldPassword: oldPassword || undefined,
                    newPassword: newPassword || undefined,
                }),
            })

            const data = await res.json()
            if (!res.ok) {
                throw new Error(data.error || 'خطا در ویرایش پروفایل')
            }

            if (data.user) {
                setUser(data.user)
            }

            setSuccess('پروفایل با موفقیت به‌روزرسانی شد !')
            setOldPassword('')
            setNewPassword('')
        } catch (err) {
            setError(err instanceof Error ? err.message : 'خطا')
        } finally {
            setLoading(false)
        }
    }

    if (!user) {
        return (
            <main dir="rtl" className="min-h-[70vh] flex justify-center items-center bg-gradient-to-br from-gray-50 via-white to-red-50/40">
                <div className="flex flex-col items-center gap-3">
                    <div className="w-10 h-10 border-[3px] border-gray-200 border-t-red-500 rounded-full animate-spin" />
                    <p className="text-sm text-gray-400 font-medium">در حال بارگذاری تنظیمات...</p>
                </div>
            </main>
        )
    }

    const inputBase =
        'w-full border-2 border-gray-200 rounded-xl pr-10 pl-4 py-3 text-gray-900 placeholder-gray-400 bg-white/80 focus:outline-none focus:border-red-400 focus:ring-4 focus:ring-red-100/50 transition-all duration-200'

    return (
        <main dir="rtl" className="relative min-h-screen overflow-hidden bg-gradient-to-br from-gray-50 via-white to-red-50/40 px-4 py-8 md:py-12">
            {/* عناصر تزئینی پس‌زمینه */}
            <div className="absolute -top-24 -left-24 w-96 h-96 bg-red-100/50 rounded-full blur-3xl pointer-events-none" />
            <div className="absolute -bottom-32 -right-32 w-[28rem] h-[28rem] bg-orange-100/40 rounded-full blur-3xl pointer-events-none" />
            <div className="absolute top-1/3 right-1/4 w-64 h-64 bg-rose-100/30 rounded-full blur-3xl pointer-events-none" />

            <div className="relative px-3 mx-auto">
                {/* ── هدر صفحه: پیش‌نمایش هویت کاربر ── */}
                <div className="flex items-center gap-4 md:gap-5 mb-8">
                    <div className="relative shrink-0">
                        <div className="w-16 h-16 md:w-20 md:h-20 rounded-3xl overflow-hidden bg-gradient-to-br from-red-500 to-rose-600 shadow-xl shadow-red-200/60 ring-2 ring-white flex items-center justify-center text-2xl font-black text-white">
                            {avatar ? (
                                <img src={avatar} alt="avatar" className="w-full h-full object-cover" />
                            ) : (
                                user.username?.charAt(0).toUpperCase()
                            )}
                        </div>
                        <div className="absolute -bottom-1 -left-1 w-5 h-5 bg-green-500 rounded-full border-[3px] border-white" />
                    </div>
                    <div className="min-w-0">
                        <h1 className="text-2xl md:text-3xl font-extrabold bg-gradient-to-l from-red-600 to-rose-600 bg-clip-text text-transparent">
                            تنظیمات پروفایل
                        </h1>
                        <p className="text-gray-500 text-sm mt-1 flex items-center gap-1.5">
                            <span className="truncate">
                                @{user.username} — اطلاعات شخصی و رمز عبور خود را مدیریت کنید
                            </span>
                        </p>
                    </div>
                </div>

                {/* ── اعلان‌ها ── */}
                {success && (
                    <div className="mb-6 flex items-center gap-3 bg-white/90 backdrop-blur-md border border-green-200/80 text-green-700 px-5 py-4 rounded-2xl shadow-lg shadow-green-100/50 animate-[fadeInUp_0.3s_ease-out]">
                        <div className="w-8 h-8 rounded-full bg-green-100 flex items-center justify-center shrink-0">
                            <FiCheckCircle className="w-4.5 h-4.5 w-5 h-5" />
                        </div>
                        <span className="font-semibold">{success}</span>
                    </div>
                )}
                {error && (
                    <div className="mb-6 flex items-center gap-3 bg-white/90 backdrop-blur-md border border-red-200/80 text-red-600 px-5 py-4 rounded-2xl shadow-lg shadow-red-100/50 animate-[fadeInUp_0.3s_ease-out]">
                        <div className="w-8 h-8 rounded-full bg-red-100 flex items-center justify-center shrink-0">
                            <FiAlertCircle className="w-5 h-5" />
                        </div>
                        <span className="font-semibold">{error}</span>
                    </div>
                )}

                <form onSubmit={handleSubmit} className="space-y-6">
                    {/* ═══ کارت اطلاعات شخصی ═══ */}
                    <div className="relative bg-white/90 backdrop-blur-xl rounded-3xl shadow-xl shadow-gray-200/50 ring-1 ring-black/5 overflow-hidden transition-all duration-300 hover:shadow-2xl hover:shadow-red-100/40">
                        <div className="h-1.5 bg-gradient-to-r from-red-500 via-rose-500 to-orange-400" />

                        <div className="p-6 md:p-8">
                            <div className="flex items-center gap-3 mb-8">
                                <div className="w-11 h-11 rounded-2xl bg-gradient-to-br from-red-50 to-orange-50 ring-1 ring-red-100 flex items-center justify-center">
                                    <FiUser className="w-5 h-5 text-red-600" />
                                </div>
                                <div>
                                    <h2 className="text-lg font-bold text-gray-900">اطلاعات شخصی</h2>
                                    <p className="text-xs text-gray-400 mt-0.5">این اطلاعات برای دیگر کاربران نمایش داده می‌شود</p>
                                </div>
                            </div>

                            {/* آواتار */}
                            <div className="flex flex-col sm:flex-row items-center gap-6 mb-8 bg-gradient-to-l from-gray-50/80 to-transparent rounded-2xl p-5 ring-1 ring-gray-100">
                                <div className="relative group shrink-0">
                                    <div className="w-24 h-24 rounded-full overflow-hidden bg-gradient-to-br from-red-100 to-orange-100 ring-4 ring-white shadow-lg flex items-center justify-center text-3xl font-black text-red-600">
                                        {isAvatarUploading ? (
                                            <div className="w-8 h-8 border-[3px] border-red-100 border-t-red-500 rounded-full animate-spin" />
                                        ) : avatar ? (
                                            <img src={avatar} alt="avatar" className="w-full h-full object-cover" />
                                        ) : (
                                            user.username?.charAt(0).toUpperCase()
                                        )}
                                    </div>
                                    <label className="absolute -bottom-1 -left-1 w-9 h-9 bg-gradient-to-br from-red-500 to-rose-600 rounded-full flex items-center justify-center text-white cursor-pointer shadow-lg shadow-red-200 ring-2 ring-white hover:scale-110 active:scale-95 transition-all duration-200 group-hover:scale-110">
                                        <FiCamera className="w-4 h-4" />
                                        <input
                                            type="file"
                                            accept="image/*"
                                            onChange={handleAvatarUpload}
                                            className="hidden"
                                        />
                                    </label>
                                </div>
                                <div className="text-center sm:text-right">
                                    <p className="font-bold text-gray-900">تصویر پروفایل</p>
                                    <p className="text-sm text-gray-500 mt-1 leading-relaxed">
                                        برای تغییر آواتار روی دکمه دوربین کلیک کنید
                                    </p>
                                </div>
                            </div>

                            <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
                                {/* نام کامل */}
                                <div>
                                    <label className="flex items-center gap-1.5 text-sm font-semibold text-gray-700 mb-2">
                                        نام کامل
                                    </label>
                                    <div className="relative group">
                                        <FiUser className="absolute right-3.5 top-1/2 -translate-y-1/2 text-gray-400 w-4 h-4 transition-colors group-focus-within:text-red-500" />
                                        <input
                                            type="text"
                                            value={name}
                                            onChange={(e) => setName(e.target.value)}
                                            className={inputBase}
                                        />
                                    </div>
                                </div>

                                {/* نام کاربری */}
                                <div>
                                    <label className="flex items-center gap-1.5 text-sm font-semibold text-gray-700 mb-2">
                                        نام کاربری
                                    </label>
                                    <div className="relative group">
                                        <FiAtSign className="absolute right-3.5 top-1/2 -translate-y-1/2 text-gray-400 w-4 h-4 transition-colors group-focus-within:text-red-500" />
                                        <input
                                            type="text"
                                            value={username}
                                            onChange={(e) => setUsername(e.target.value)}
                                            className={`${inputBase} pl-10`}
                                            dir="ltr"
                                        />
                                        {/* نمایش متغیر @ سمت چپ */}
                                        <span className="absolute left-3.5 top-1/2 -translate-y-1/2 text-gray-300 font-bold select-none">@</span>
                                    </div>
                                </div>

                                {/* ایمیل */}
                                <div>
                                    <label className="flex items-center gap-1.5 text-sm font-semibold text-gray-700 mb-2">
                                        ایمیل
                                    </label>
                                    <div className="relative group">
                                        <FiMail className="absolute right-3.5 top-1/2 -translate-y-1/2 text-gray-400 w-4 h-4 transition-colors group-focus-within:text-red-500" />
                                        <input
                                            type="email"
                                            value={email}
                                            onChange={(e) => setEmail(e.target.value)}
                                            className={inputBase}
                                            dir="ltr"
                                        />
                                    </div>
                                </div>

                                {/* بیوگرافی */}
                                <div>
                                    <label className="flex items-center gap-1.5 text-sm font-semibold text-gray-700 mb-2">
                                        بیوگرافی
                                    </label>
                                    <div className="relative group">
                                        <FiEdit3 className="absolute right-3.5 top-1/2 -translate-y-1/2 text-gray-400 w-4 h-4 transition-colors group-focus-within:text-red-500 pointer-events-none" />
                                        <input
                                            type="text"
                                            value={bio}
                                            onChange={(e) => setBio(e.target.value)}
                                            className={inputBase}
                                            placeholder="چند کلمه درباره شما"
                                        />
                                    </div>
                                </div>
                            </div>
                        </div>
                    </div>

                    {/* ═══ کارت تغییر رمز عبور ═══ */}
                    <div className="relative bg-white/90 backdrop-blur-xl rounded-3xl shadow-xl shadow-gray-200/50 ring-1 ring-black/5 overflow-hidden transition-all duration-300 hover:shadow-2xl hover:shadow-indigo-100/40">
                        <div className="h-1.5 bg-gradient-to-r from-blue-500 via-indigo-500 to-purple-500" />

                        <div className="p-6 md:p-8">
                            <div className="flex items-center justify-between gap-3 mb-2">
                                <div className="flex items-center gap-3">
                                    <div className="w-11 h-11 rounded-2xl bg-gradient-to-br from-blue-50 to-indigo-50 ring-1 ring-blue-100 flex items-center justify-center">
                                        <FiShield className="w-5 h-5 text-blue-600" />
                                    </div>
                                    <div>
                                        <h2 className="text-lg font-bold text-gray-900">تغییر رمز عبور</h2>
                                        <p className="text-xs text-gray-400 mt-0.5">اختیاری — برای تغییر رمز، هر دو فیلد را پر کنید</p>
                                    </div>
                                </div>
                                {/* بج وضعیت */}
                                <span
                                    className={`shrink-0 text-xs font-semibold px-3 py-1.5 rounded-full transition-colors ${oldPassword && newPassword
                                            ? 'bg-blue-50 text-blue-600 ring-1 ring-blue-100'
                                            : 'bg-gray-50 text-gray-400 ring-1 ring-gray-100'
                                        }`}
                                >
                                    {oldPassword && newPassword ? 'آماده تغییر' : 'بدون تغییر'}
                                </span>
                            </div>

                            <div className="grid grid-cols-1 md:grid-cols-2 gap-5 mt-6">
                                {/* رمز فعلی */}
                                <div>
                                    <label className="block text-sm font-semibold text-gray-700 mb-2">رمز فعلی</label>
                                    <div className="relative group">
                                        <FiLock className="absolute right-3.5 top-1/2 -translate-y-1/2 text-gray-400 w-4 h-4 transition-colors group-focus-within:text-blue-500" />
                                        <input
                                            type={showOldPassword ? 'text' : 'password'}
                                            value={oldPassword}
                                            onChange={(e) => setOldPassword(e.target.value)}
                                            className={`${inputBase} !focus:border-blue-400 !focus:ring-blue-100/50 pl-11`}
                                            onFocus={(e) => {
                                                e.currentTarget.style.borderColor = '#60a5fa'
                                                e.currentTarget.style.boxShadow = '0 0 0 4px rgba(191, 219, 254, 0.5)'
                                            }}
                                            onBlur={(e) => {
                                                e.currentTarget.style.borderColor = ''
                                                e.currentTarget.style.boxShadow = ''
                                            }}
                                            dir="ltr"
                                        />
                                        <button
                                            type="button"
                                            tabIndex={-1}
                                            onClick={() => setShowOldPassword(prev => !prev)}
                                            className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600 transition-colors cursor-pointer"
                                        >
                                            {showOldPassword ? <FiEyeOff className="w-4.5 h-4.5 w-5 h-5" /> : <FiEye className="w-5 h-5" />}
                                        </button>
                                    </div>
                                </div>

                                {/* رمز جدید */}
                                <div>
                                    <label className="block text-sm font-semibold text-gray-700 mb-2">رمز جدید</label>
                                    <div className="relative group">
                                        <FiLock className="absolute right-3.5 top-1/2 -translate-y-1/2 text-gray-400 w-4 h-4 transition-colors group-focus-within:text-blue-500" />
                                        <input
                                            type={showNewPassword ? 'text' : 'password'}
                                            value={newPassword}
                                            onChange={(e) => setNewPassword(e.target.value)}
                                            className={`${inputBase} pl-11`}
                                            onFocus={(e) => {
                                                e.currentTarget.style.borderColor = '#60a5fa'
                                                e.currentTarget.style.boxShadow = '0 0 0 4px rgba(191, 219, 254, 0.5)'
                                            }}
                                            onBlur={(e) => {
                                                e.currentTarget.style.borderColor = ''
                                                e.currentTarget.style.boxShadow = ''
                                            }}
                                            dir="ltr"
                                        />
                                        <button
                                            type="button"
                                            tabIndex={-1}
                                            onClick={() => setShowNewPassword(prev => !prev)}
                                            className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600 transition-colors cursor-pointer"
                                        >
                                            {showNewPassword ? <FiEyeOff className="w-5 h-5" /> : <FiEye className="w-5 h-5" />}
                                        </button>
                                    </div>
                                </div>
                            </div>
                        </div>
                    </div>

                    {/* ═─ نوار ذخیره ═══ */}
                    <div className="sticky bottom-4 z-30">
                        <div className="bg-white/80 backdrop-blur-xl rounded-2xl ring-1 ring-black/5 shadow-2xl shadow-gray-300/40 p-3 flex items-center gap-3">
                            <button
                                type="submit"
                                disabled={loading || (!hasChanges && !oldPassword && !newPassword)}
                                className="flex-1 bg-gradient-to-r from-red-600 to-rose-600 text-white font-bold py-3.5 rounded-xl shadow-lg shadow-red-200/70 hover:shadow-xl hover:shadow-red-300/60 hover:brightness-105 active:scale-[0.99] transition-all duration-200 disabled:opacity-50 disabled:cursor-not-allowed disabled:shadow-none disabled:hover:brightness-100 flex items-center justify-center gap-2"
                            >
                                {loading ? (
                                    <span className="w-5 h-5 border-2 border-white/40 border-t-white rounded-full animate-spin" />
                                ) : (
                                    <FiSave className="w-5 h-5" />
                                )}
                                {loading ? 'در حال ذخیره...' : 'ذخیره تغییرات'}
                            </button>

                            {/* نشانگر تغییرات ذخیره‌نشده */}
                            {hasChanges && !loading && (
                                <span className="shrink-0 hidden sm:flex items-center gap-1.5 text-xs font-semibold text-amber-600 bg-amber-50 ring-1 ring-amber-100 px-3 py-2 rounded-xl animate-[fadeInUp_0.3s_ease-out]">
                                    <span className="w-2 h-2 rounded-full bg-amber-500 animate-pulse" />
                                    تغییرات ذخیره‌نشده
                                </span>
                            )}
                        </div>
                    </div>
                </form>
            </div>

            {/* استایل انیمیشن fadeInUp */}
            <style>{`
                @keyframes fadeInUp {
                    from { opacity: 0; transform: translateY(10px); }
                    to { opacity: 1; transform: translateY(0); }
                }
                @media (prefers-reduced-motion: reduce) {
                    * { animation: none !important; }
                }
            `}</style>
        </main>
    )
}