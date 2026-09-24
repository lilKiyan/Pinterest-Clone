"use client"

import { useEffect, useState } from 'react'
import { useRouter } from 'next/navigation'
import { useMutation, useQueryClient } from '@tanstack/react-query'
import { useAuthStore } from '@/lib/authStore'
import { compressImage } from '@/lib/imageCompress'
import type { CurrentUser } from '../types/user'

import { FiUser, FiAtSign, FiMail, FiLock, FiCamera, FiSave, FiCheckCircle, FiAlertCircle, FiShield, FiTrash2, FiAlertTriangle } from 'react-icons/fi'

// ── تایپ خروجی API های ما ──
type MeResponse = { user: CurrentUser }
type UploadResponse = { imageUrl: string; width: number; height: number }
type UpdateProfileResponse = { user: CurrentUser }
type DeleteAccountResponse = { success: boolean; message: string }

export default function SettingsPage() {
    const router = useRouter()
    const queryClient = useQueryClient()
    const { user, setUser } = useAuthStore()

    // ── State فرم ──
    const [name, setName] = useState('')
    const [username, setUsername] = useState('')
    const [email, setEmail] = useState('')
    const [bio, setBio] = useState('')
    const [avatar, setAvatar] = useState('')
    const [oldPassword, setOldPassword] = useState('')
    const [newPassword, setNewPassword] = useState('')

    const [success, setSuccess] = useState('')
    const [error, setError] = useState('')

    const [isDeleteModalOpen, setIsDeleteModalOpen] = useState(false)
    const [deleteConfirmText, setDeleteConfirmText] = useState('')

    // ✨ فشرده‌سازی آواتار در جریان است
    const [isPreparing, setIsPreparing] = useState(false)

    useEffect(() => {
        if (user) {
            setName(user.name || '')
            setUsername(user.username || '')
            setEmail(user.email || '')
            setBio(user.bio || '')
            setAvatar(user.avatar || '')
            return
        }

        // اگه store خالیه، از سرور بگیر
        fetch('/api/auth/me')
            .then(res => res.ok ? res.json() as Promise<MeResponse> : null)
            .then(data => {
                if (data?.user) {
                    setUser(data.user)
                }
            })
            .catch(console.error)
    }, [user, setUser])

    // ── Mutation: آپلود آواتار ──
    const uploadAvatarMutation = useMutation({
        mutationFn: async (file: File): Promise<UploadResponse> => {
            const formData = new FormData()
            formData.append('file', file)
            const res = await fetch('/api/upload', {
                method: 'POST',
                body: formData,
            })
            if (!res.ok) throw new Error('خطا در آپلود تصویر')
            return res.json()
        },
        onSuccess: (data) => {
            // ✨ data: UploadResponse — autocomplete کامل
            setAvatar(data.imageUrl)
        },
        onError: (err: Error) => {
            setError(err.message)
        },
    })

    // ── Mutation: ذخیره تغییرات پروفایل ──
    const updateProfileMutation = useMutation({
        mutationFn: async (): Promise<UpdateProfileResponse> => {
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

            if (!res.ok) {
                const data = await res.json()
                throw new Error(data.error || 'خطا در ذخیره تغییرات')
            }
            return res.json()
        },
        onSuccess: (data) => {
            if (data.user) {
                setUser(data.user)
            }
            setSuccess('پروفایل با موفقیت به‌روزرسانی شد')
            setOldPassword('')
            setNewPassword('')
            setError('')

            // ✅ invalidate کش کاربر
            queryClient.invalidateQueries({ queryKey: ['me'] })
            queryClient.invalidateQueries({ queryKey: ['user', data.user?.id] })

            setTimeout(() => setSuccess(''), 3000)
        },
        onError: (err: Error) => {
            setError(err.message)
            setSuccess('')
        },
    })

    const deleteAccountMutation = useMutation({
        mutationFn: async (): Promise<DeleteAccountResponse> => {
            const res = await fetch('/api/user', { method: 'DELETE' })
            if (!res.ok) {
                const data = await res.json()
                throw new Error(data.error || 'خطا در حذف حساب')
            }
            return res.json()
        },
        onSuccess: () => {
            setUser(null)
            queryClient.clear()
            router.push('/')
            router.refresh()
        },
        onError: (err: Error) => {
            setError(err.message)
            setIsDeleteModalOpen(false)
        },
    })

    const handleDeleteAccount = () => {
        if (deleteConfirmText !== 'حذف') return
        deleteAccountMutation.mutate()
    }

    const handleSubmit = (e: React.FormEvent<HTMLFormElement>) => {
        e.preventDefault()
        setError('')
        setSuccess('')

        if (!name.trim() || !username.trim() || !email.trim()) {
            setError('نام، نام کاربری و ایمیل الزامی هستند')
            return
        }

        updateProfileMutation.mutate()
    }

    const handleAvatarUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
        const file = e.target.files?.[0]
        if (!file) return

        e.target.value = ''

        setIsPreparing(true)
        setError('')

        try {
            const { file: compressed } = await compressImage(file)

            uploadAvatarMutation.mutate(compressed)
        } catch (err) {
            setError(err instanceof Error ? err.message : 'خطا در پردازش تصویر')
        } finally {
            setIsPreparing(false)
        }
    }

    // ── حالت Loading ──
    if (!user) {
        return (
            <main dir="rtl" className="min-h-screen flex justify-center items-center bg-gradient-to-br from-gray-50 via-white to-red-50/40">
                <div className="flex flex-col items-center gap-4">
                    <div className="w-14 h-14 border-4 border-red-100 border-t-red-500 rounded-full animate-spin" />
                    <p className="text-sm text-gray-400 font-medium">در حال بارگذاری...</p>
                </div>
            </main>
        )
    }

    const isLoading = updateProfileMutation.isPending
    const isUploading = uploadAvatarMutation.isPending || isPreparing

    return (
        <main dir="rtl" className="relative mb-15 md:mb-5 min-h-screen overflow-hidden bg-gradient-to-br from-gray-50 via-white to-red-50/40 px-4 py-8">
            {/* عناصر تزئینی */}
            <div className="absolute -top-20 -left-20 w-80 h-80 bg-red-100/60 rounded-full blur-3xl pointer-events-none" />
            <div className="absolute -bottom-24 -right-24 w-96 h-96 bg-orange-100/50 rounded-full blur-3xl pointer-events-none" />

            <div className="relative max-w-4xl mx-auto">
                {/* ── هدر ── */}
                <div className="flex items-center gap-4 mb-10">
                    <div className="w-14 h-14 rounded-2xl bg-gradient-to-br from-red-500 to-rose-600 shadow-lg shadow-red-200 flex items-center justify-center">
                        <FiUser className="w-6 h-6 text-white" />
                    </div>
                    <div>
                        <h1 className="text-2xl md:text-3xl font-extrabold bg-gradient-to-r from-red-600 to-rose-600 bg-clip-text text-transparent">
                            تنظیمات پروفایل
                        </h1>
                        <p className="text-gray-500 text-sm mt-1">
                            اطلاعات شخصی و رمز عبور خود را مدیریت کنید
                        </p>
                    </div>
                </div>

                {/* ── پیام‌ها ── */}
                {success && (
                    <div className="mb-6 flex items-center gap-3 bg-green-50/90 backdrop-blur-sm border border-green-200 text-green-700 px-5 py-4 rounded-2xl shadow-sm animate-[fadeInUp_0.3s_ease-out]">
                        <FiCheckCircle className="w-5 h-5 shrink-0" />
                        <span className="font-medium">{success}</span>
                    </div>
                )}
                {error && (
                    <div className="mb-6 flex items-center gap-3 bg-red-50/90 backdrop-blur-sm border border-red-200 text-red-600 px-5 py-4 rounded-2xl shadow-sm animate-[fadeInUp_0.3s_ease-out]">
                        <FiAlertCircle className="w-5 h-5 shrink-0" />
                        <span className="font-medium">{error}</span>
                    </div>
                )}

                <form onSubmit={handleSubmit} className="space-y-6">
                    {/* ═══ کارت اطلاعات شخصی ═══ */}
                    <div className="relative bg-white/90 backdrop-blur-md rounded-3xl shadow-xl shadow-gray-200/50 ring-1 ring-black/5 overflow-hidden transition-all duration-300 hover:shadow-2xl hover:shadow-red-100/30">
                        <div className="h-1.5 bg-gradient-to-r from-red-500 via-rose-500 to-orange-400" />

                        <div className="p-6 md:p-8">
                            <div className="flex items-center gap-3 mb-6">
                                <div className="w-10 h-10 rounded-xl bg-red-50 flex items-center justify-center">
                                    <FiUser className="w-5 h-5 text-red-600" />
                                </div>
                                <h2 className="text-lg font-bold text-gray-900">اطلاعات شخصی</h2>
                            </div>

                            {/* آواتار */}
                            <div className="flex flex-col sm:flex-row items-center gap-5 mb-8">
                                <div className="relative group">
                                    <div className="w-24 h-24 rounded-full overflow-hidden bg-gradient-to-br from-red-100 to-orange-100 ring-4 ring-white shadow-lg flex items-center justify-center text-3xl font-black text-red-600">
                                        {avatar ? (
                                            <img src={avatar} alt="avatar" className="w-full h-full object-cover" />
                                        ) : (
                                            user.username?.charAt(0).toUpperCase()
                                        )}
                                    </div>

                                    {isUploading && (
                                        <div className="absolute inset-0 rounded-full bg-white/70 backdrop-blur-sm flex items-center justify-center">
                                            <span className="w-6 h-6 border-[3px] border-red-100 border-t-red-500 rounded-full animate-spin" />
                                        </div>
                                    )}

                                    <label className={`absolute -bottom-1 -right-1 w-9 h-9 bg-gradient-to-br from-red-500 to-rose-600 rounded-full flex items-center justify-center text-white cursor-pointer shadow-lg hover:scale-110 active:scale-95 transition-all duration-200 ${isUploading ? 'opacity-60 cursor-not-allowed' : ''}`}>
                                        {isUploading ? (
                                            <span className="w-4 h-4 border-2 border-white/40 border-t-white rounded-full animate-spin" />
                                        ) : (
                                            <FiCamera className="w-4 h-4" />
                                        )}
                                        <input
                                            type="file"
                                            accept="image/*"
                                            onChange={handleAvatarUpload}
                                            disabled={isUploading}
                                            className="hidden"
                                        />
                                    </label>
                                </div>
                                <div className="text-center sm:text-right">
                                    <p className="font-semibold text-gray-900">تصویر پروفایل</p>
                                    <p className="text-sm text-gray-500 mt-1">
                                        {isPreparing
                                            ? 'در حال آماده‌سازی تصویر...'
                                            : 'برای تغییر، روی دکمه‌ی دوربین کلیک کنید'}
                                    </p>
                                </div>
                            </div>

                            {/* فیلدهای فرم */}
                            <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
                                <div>
                                    <label className="block text-sm font-semibold text-gray-700 mb-2">نام کامل</label>
                                    <div className="relative group">
                                        <FiUser className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 w-4 h-4 transition-colors group-focus-within:text-red-500" />
                                        <input
                                            type="text"
                                            value={name}
                                            onChange={(e) => setName(e.target.value)}
                                            className="w-full border-2 md:placeholder:text-md placeholder:text-sm border-gray-200 rounded-xl pr-10 pl-4 py-3 text-gray-900 placeholder-gray-400 bg-white/80 focus:outline-none focus:border-red-400 focus:ring-4 focus:ring-red-100/50 transition-all duration-200"
                                        />
                                    </div>
                                </div>

                                <div>
                                    <label className="block text-sm font-semibold text-gray-700 mb-2">نام کاربری</label>
                                    <div className="relative group">
                                        <FiAtSign className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 w-4 h-4 transition-colors group-focus-within:text-red-500" />
                                        <input
                                            type="text"
                                            value={username}
                                            onChange={(e) => setUsername(e.target.value)}
                                            dir="ltr"
                                            className="w-full border-2 md:placeholder:text-md placeholder:text-sm border-gray-200 rounded-xl pr-10 pl-4 py-3 text-gray-900 placeholder-gray-400 bg-white/80 focus:outline-none focus:border-red-400 focus:ring-4 focus:ring-red-100/50 transition-all duration-200"
                                        />
                                    </div>
                                </div>

                                <div>
                                    <label className="block text-sm font-semibold text-gray-700 mb-2">ایمیل</label>
                                    <div className="relative group">
                                        <FiMail className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 w-4 h-4 transition-colors group-focus-within:text-red-500" />
                                        <input
                                            type="email"
                                            value={email}
                                            onChange={(e) => setEmail(e.target.value)}
                                            dir="ltr"
                                            className="w-full border-2 md:placeholder:text-md placeholder:text-sm border-gray-200 rounded-xl pr-10 pl-4 py-3 text-gray-900 placeholder-gray-400 bg-white/80 focus:outline-none focus:border-red-400 focus:ring-4 focus:ring-red-100/50 transition-all duration-200"
                                        />
                                    </div>
                                </div>

                                <div>
                                    <label className="block text-sm font-semibold text-gray-700 mb-2">بیوگرافی</label>
                                    <input
                                        type="text"
                                        value={bio}
                                        onChange={(e) => setBio(e.target.value)}
                                        placeholder="چند کلمه درباره شما"
                                        className="w-full border-2 md:placeholder:text-md placeholder:text-sm border-gray-200 rounded-xl px-4 py-3 text-gray-900 placeholder-gray-400 bg-white/80 focus:outline-none focus:border-red-400 focus:ring-4 focus:ring-red-100/50 transition-all duration-200"
                                    />
                                </div>
                            </div>
                        </div>
                    </div>

                    {/* ═══ کارت تغییر رمز ═══ */}
                    <div className="relative bg-white/90 backdrop-blur-md rounded-3xl shadow-xl shadow-gray-200/50 ring-1 ring-black/5 overflow-hidden transition-all duration-300 hover:shadow-2xl hover:shadow-blue-100/30">
                        <div className="h-1.5 bg-gradient-to-r from-blue-500 via-indigo-500 to-purple-500" />

                        <div className="p-6 md:p-8">
                            <div className="flex items-center gap-3 mb-6">
                                <div className="w-10 h-10 rounded-xl bg-blue-50 flex items-center justify-center">
                                    <FiShield className="w-5 h-5 text-blue-600" />
                                </div>
                                <h2 className="text-lg font-bold text-gray-900">تغییر رمز عبور</h2>
                            </div>

                            <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
                                <div>
                                    <label className="block text-sm font-semibold text-gray-700 mb-2">رمز عبور فعلی</label>
                                    <div className="relative group">
                                        <FiLock className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 w-4 h-4 transition-colors group-focus-within:text-blue-500" />
                                        <input
                                            type="password"
                                            value={oldPassword}
                                            onChange={(e) => setOldPassword(e.target.value)}
                                            dir="ltr"
                                            placeholder="••••••••"
                                            className="w-full border-2 md:placeholder:text-md placeholder:text-sm border-gray-200 rounded-xl pr-10 pl-4 py-3 text-gray-900 placeholder-gray-400 bg-white/80 focus:outline-none focus:border-blue-400 focus:ring-4 focus:ring-blue-100/50 transition-all duration-200"
                                        />
                                    </div>
                                </div>

                                <div>
                                    <label className="block text-sm font-semibold text-gray-700 mb-2">رمز عبور جدید</label>
                                    <div className="relative group">
                                        <FiLock className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 w-4 h-4 transition-colors group-focus-within:text-blue-500" />
                                        <input
                                            type="password"
                                            value={newPassword}
                                            onChange={(e) => setNewPassword(e.target.value)}
                                            dir="ltr"
                                            placeholder="••••••••"
                                            className="w-full border-2 md:placeholder:text-md placeholder:text-sm border-gray-200 rounded-xl pr-10 pl-4 py-3 text-gray-900 placeholder-gray-400 bg-white/80 focus:outline-none focus:border-blue-400 focus:ring-4 focus:ring-blue-100/50 transition-all duration-200"
                                        />
                                    </div>
                                </div>
                            </div>

                            <p className="text-xs text-gray-400 mt-4">
                                اگر نمی‌خواهید رمز را تغییر دهید، این دو فیلد را خالی بگذارید
                            </p>
                        </div>
                    </div>

                    {/* ═══ دکمه ذخیره ═══ */}
                    <button
                        type="submit"
                        disabled={isLoading}
                        className="w-full text-sm md:text-md bg-gradient-to-r from-red-600 to-rose-600 text-white font-bold py-4 rounded-2xl shadow-lg shadow-red-200 hover:shadow-xl hover:shadow-red-300/50 hover:-translate-y-0.5 active:translate-y-0 active:scale-[0.99] transition-all duration-200 disabled:opacity-60 disabled:cursor-not-allowed disabled:hover:translate-y-0 flex items-center justify-center gap-2"
                    >
                        {isLoading ? (
                            <>
                                <span className="w-5 h-5 border-2 border-white/40 border-t-white rounded-full animate-spin" />
                                در حال ذخیره...
                            </>
                        ) : (
                            <>
                                <FiSave className="w-5 h-5" />
                                ذخیره تغییرات
                            </>
                        )}
                    </button>

                    {/* ═══ بخش Danger Zone: حذف اکانت ═══ */}
                    <div className="relative bg-red-50/40 backdrop-blur-md rounded-3xl ring-1 ring-red-200/60 overflow-hidden mt-8">
                        <div className="h-1.5 bg-gradient-to-r from-red-600 via-red-500 to-orange-500" />

                        <div className="p-6 md:p-8">
                            <div className="flex items-center gap-3 mb-4">
                                <div className="w-10 h-10 rounded-xl bg-red-100 flex items-center justify-center">
                                    <FiAlertTriangle className="w-5 h-5 text-red-600" />
                                </div>
                                <h2 className="text-lg font-bold text-red-800">منطقه‌ی خطر</h2>
                            </div>

                            <p className="text-sm text-red-700/80 leading-relaxed mb-5">
                                با حذف حساب کاربری، تمام اطلاعات شما شامل پین‌ها، بردها، سیوها، لایک‌ها، کامنت‌ها،
                                فالوها و پیام‌ها <span className="font-bold">برای همیشه</span> حذف می‌شوند.
                                این عملیات قابل بازگشت نیست.
                            </p>

                            <button
                                type="button"
                                onClick={() => setIsDeleteModalOpen(true)}
                                className="inline-flex text-sm md:text-md items-center gap-2 bg-red-600 hover:bg-red-700 text-white font-bold px-6 py-3 rounded-xl shadow-lg shadow-red-200 hover:shadow-xl hover:shadow-red-300/50 transition-all duration-200 cursor-pointer active:scale-95"
                            >
                                <FiTrash2 className="w-4 h-4" />
                                حذف حساب کاربری
                            </button>
                        </div>
                    </div>
                </form>
            </div>

            {/* ═══ مودال تأیید حذف اکانت ═══ */}
            {isDeleteModalOpen && (
                <div className="fixed inset-0 z-[100] flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm animate-[fadeInUp_0.2s_ease-out]">
                    <div className="relative bg-white rounded-3xl shadow-2xl ring-1 ring-black/5 w-full max-w-md p-6 animate-[fadeInUp_0.3s_ease-out]">
                        <div className="w-16 h-16 mx-auto mb-4 bg-red-50 rounded-2xl flex items-center justify-center">
                            <FiAlertTriangle className="w-8 h-8 text-red-600" />
                        </div>

                        <h3 className="text-xl font-bold text-gray-900 text-center mb-2">
                            حذف حساب کاربری
                        </h3>

                        <p className="text-sm text-gray-500 text-center leading-relaxed mb-5">
                            این عملیات قابل بازگشت نیست. برای تأیید، کلمه‌ی
                            <span className="inline-block mx-1 px-2 py-0.5 bg-red-50 text-red-600 font-bold rounded-md">
                                حذف
                            </span>
                            را تایپ کنید.
                        </p>

                        <input
                            type="text"
                            value={deleteConfirmText}
                            onChange={(e) => setDeleteConfirmText(e.target.value)}
                            placeholder="حذف"
                            className="w-full border-2 md:placeholder:text-md placeholder:text-sm border-gray-200 rounded-xl px-4 py-3 text-center text-gray-900 placeholder-gray-300 focus:outline-none focus:border-red-400 focus:ring-4 focus:ring-red-100/50 transition-all mb-5"
                            dir="rtl"
                            autoFocus
                        />

                        <div className="flex gap-2.5">
                            <button
                                type="button"
                                onClick={() => {
                                    setIsDeleteModalOpen(false)
                                    setDeleteConfirmText('')
                                }}
                                className="flex-1 h-12 bg-gray-100 hover:bg-gray-200 text-gray-700 rounded-xl font-bold text-sm transition-colors cursor-pointer"
                            >
                                انصراف
                            </button>
                            <button
                                type="button"
                                onClick={handleDeleteAccount}
                                disabled={deleteConfirmText !== 'حذف' || deleteAccountMutation.isPending}
                                className="flex-1 h-12 bg-red-600 hover:bg-red-700 text-white rounded-xl font-bold text-sm transition-colors disabled:opacity-40 disabled:cursor-not-allowed cursor-pointer flex items-center justify-center gap-2"
                            >
                                {deleteAccountMutation.isPending ? (
                                    <>
                                        <span className="w-4 h-4 border-2 border-white/40 border-t-white rounded-full animate-spin" />
                                        در حال حذف...
                                    </>
                                ) : (
                                    <>
                                        <FiTrash2 className="w-4 h-4" />
                                        حذف کن
                                    </>
                                )}
                            </button>
                        </div>
                    </div>
                </div>
            )}

            <style>{`
                @keyframes fadeInUp {
                    from { opacity: 0; transform: translateY(10px); }
                    to   { opacity: 1; transform: translateY(0); }
                }
                @media (prefers-reduced-motion: reduce) {
                    * { animation: none !important; }
                }
            `}</style>
        </main>
    )
}