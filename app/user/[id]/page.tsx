"use client"

import { useEffect, useState } from 'react'
import Link from 'next/link'
import { useParams, useRouter } from 'next/navigation'
import PinCard from '@/app/components/PinCard'
import { useAuthStore } from '@/lib/authStore'
import {
    FiArrowRight,
    FiAtSign,
    FiImage,
    FiGrid,
    FiUserPlus,
    FiCheck,
    FiSettings,
} from 'react-icons/fi'

export default function UserProfilePage() {
    const { id } = useParams<{ id: string }>()
    const router = useRouter()
    const { user: currentUser, setUser } = useAuthStore()

    const [profileUser, setProfileUser] = useState<any>(null)
    const [pins, setPins] = useState<any[]>([])
    const [loading, setLoading] = useState(true)
    const [error, setError] = useState('')
    const [isFollowed, setIsFollowed] = useState(false)
    const [followersCount, setFollowersCount] = useState(0)
    const [followLoading, setFollowLoading] = useState(false)

    useEffect(() => {
        const fetchProfile = async () => {
            setLoading(true)
            try {
                const res = await fetch(`/api/users/${id}`)
                if (!res.ok) throw new Error('کاربر یافت نشد')
                const data = await res.json()
                setProfileUser(data.user)
                setPins(data.pins)
                setIsFollowed(data.user.isFollowing)
                setFollowersCount(data.user.followersCount)
            } catch (err) {
                setError(err instanceof Error ? err.message : 'خطا')
            } finally {
                setLoading(false)
            }
        }
        if (id) fetchProfile()
    }, [id])

    const handleFollow = async () => {
        if (!currentUser) {
            router.push('/login')
            return
        }
        if (followLoading) return

        setFollowLoading(true)
        try {
            const res = await fetch(`/api/users/${id}/follow`, {
                method: 'POST',
            })
            if (res.ok) {
                const data = await res.json()
                setIsFollowed(data.isFollowing)
                setFollowersCount(data.followersCount)
            }
        } catch (error) {
            console.error(error)
        } finally {
            setFollowLoading(false)
        }
    }

    if (loading) {
        return (
            <main dir="rtl" className="min-h-screen flex items-center justify-center bg-gradient-to-br from-red-50 via-white to-orange-50">
                <div className="w-10 h-10 border-4 border-gray-200 border-t-red-500 rounded-full animate-spin" />
            </main>
        )
    }

    if (error || !profileUser) {
        return (
            <main dir="rtl" className="min-h-screen flex flex-col items-center justify-center gap-5 px-4 bg-gradient-to-br from-red-50 via-white to-orange-50">
                <div className="w-20 h-20 rounded-3xl bg-white shadow-lg ring-1 ring-black/5 flex items-center justify-center">
                    <FiAtSign className="w-9 h-9 text-red-300" />
                </div>
                <p className="text-gray-800 font-bold text-xl">{error || 'کاربر یافت نشد'}</p>
                <Link href="/" className="text-red-600 font-semibold hover:underline">
                    بازگشت به خانه
                </Link>
            </main>
        )
    }

    const isOwnProfile = currentUser?.id === profileUser.id

    return (
        <main dir="rtl" className="min-h-screen bg-gradient-to-b from-gray-50 to-white pb-16">

            {/* ═══════════ هیروی مینیمال روشن ═══════════ */}
            <div className="relative">
                {/* نوار کاور خیلی کوتاه و نرم — تنها تزئین صفحه */}
                <div className="h-28 sm:h-32 bg-gradient-to-l from-red-500/80 via-rose-500/70 to-orange-400/80 relative overflow-hidden">
                    <div className="absolute -top-10 left-1/4 w-48 h-48 bg-white/15 rounded-full blur-2xl" />
                    <div className="absolute -bottom-16 right-1/4 w-56 h-56 bg-white/10 rounded-full blur-3xl" />
                </div>

                {/* دکمه بازگشت روی کاور */}
                <button
                    onClick={() => router.back()}
                    className="absolute top-4 right-4 z-10 w-10 h-10 rounded-full bg-white/20 hover:bg-white/35 backdrop-blur-md ring-1 ring-white/30 flex items-center justify-center text-white transition-all cursor-pointer group"
                    title="بازگشت"
                >
                    <FiArrowRight className="w-4 h-4" />
                </button>

                <div className="max-w-2xl mx-auto px-4">
                    {/* آواتار شناور روی کاور */}
                    <div className="relative -mt-14 sm:-mt-16 w-fit mx-auto group">
                        {/* حلقه‌ی گرادیانتی دور آواتار */}
                        <div className="p-[3px] rounded-full bg-gradient-to-br from-red-500 via-rose-500 to-orange-400 shadow-xl shadow-red-200/50 transition-transform duration-300 group-hover:scale-[1.03]">
                            <div className="w-24 h-24 sm:w-28 sm:h-28 rounded-full overflow-hidden bg-white ring-4 ring-white flex items-center justify-center text-3xl sm:text-4xl font-black text-white bg-gradient-to-br from-red-500 to-orange-500">
                                {profileUser.avatar ? (
                                    <img
                                        src={profileUser.avatar}
                                        alt={profileUser.name}
                                        className="w-full h-full object-cover"
                                    />
                                ) : (
                                    <span className="leading-none">
                                        {profileUser.username?.charAt(0).toUpperCase() || '؟'}
                                    </span>
                                )}
                            </div>
                        </div>
                    </div>

                    {/* نام و کاربری */}
                    <div className="text-center mt-4">
                        <h1 className="text-2xl sm:text-3xl font-extrabold text-gray-900 tracking-tight">
                            {profileUser.name}
                        </h1>
                        <p className="flex items-center justify-center gap-1 text-sm text-gray-400 font-medium mt-1.5">
                            <FiAtSign className="w-3.5 h-3.5" />
                            {profileUser.username}
                        </p>

                        {profileUser.bio && (
                            <p className="text-[15px] text-gray-600 leading-relaxed mt-3 max-w-md mx-auto">
                                {profileUser.bio}
                            </p>
                        )}
                    </div>

                    {/* آمار: مینیمال، با لهجه‌ی گرادیانت و خط زیرین hover */}
                    <div className="mt-6 flex items-center justify-center gap-5 sm:gap-7">
                        {/* پین‌ها */}
                        <div className="group/stat flex flex-col items-center gap-1 cursor-default">
                            <div className="flex items-center gap-1.5">
                                <FiGrid className="w-3.5 h-3.5 text-red-400/50 transition-all duration-300 group-hover/stat:text-red-500 group-hover/stat:scale-110" />
                                <span className="text-lg sm:text-xl font-black tabular-nums leading-none bg-gradient-to-br from-red-500 to-orange-400 bg-clip-text text-transparent">
                                    {pins.length}
                                </span>
                            </div>
                            <span className="text-[11px] text-gray-400 font-semibold">پین</span>
                            <span className="h-0.5 w-0 rounded-full bg-gradient-to-l from-red-500 to-orange-400 opacity-0 group-hover/stat:opacity-100 group-hover/stat:w-full transition-all duration-300" />
                        </div>

                        <span className="w-1 h-1 rounded-full bg-gray-200" />

                        {/* دنبال‌کننده */}
                        <div className="group/stat flex flex-col items-center gap-1 cursor-default">
                            <span className="text-lg sm:text-xl font-black tabular-nums leading-none bg-gradient-to-br from-fuchsia-500 to-purple-400 bg-clip-text text-transparent">
                                {followersCount}
                            </span>
                            <span className="text-[11px] text-gray-400 font-semibold">دنبال‌کننده</span>
                            <span className="h-0.5 w-0 rounded-full bg-gradient-to-l from-fuchsia-500 to-purple-400 opacity-0 group-hover/stat:opacity-100 group-hover/stat:w-full transition-all duration-300" />
                        </div>

                        <span className="w-1 h-1 rounded-full bg-gray-200" />

                        {/* دنبال‌شونده */}
                        <div className="group/stat flex flex-col items-center gap-1 cursor-default">
                            <span className="text-lg sm:text-xl font-black tabular-nums leading-none bg-gradient-to-br from-blue-500 to-cyan-400 bg-clip-text text-transparent">
                                {profileUser.followingCount}
                            </span>
                            <span className="text-[11px] text-gray-400 font-semibold">دنبال‌شونده</span>
                            <span className="h-0.5 w-0 rounded-full bg-gradient-to-l from-blue-500 to-cyan-400 opacity-0 group-hover/stat:opacity-100 group-hover/stat:w-full transition-all duration-300" />
                        </div>
                    </div>

                    {/* دکمه اکشن */}
                    <div className="mt-6 flex justify-center">
                        {isOwnProfile ? (
                            <Link
                                href="/settings"
                                className="inline-flex items-center gap-2 text-sm font-bold text-gray-700 bg-white ring-1 ring-gray-200 hover:ring-gray-300 hover:bg-gray-50 px-6 py-2.5 rounded-full transition-all no-underline shadow-sm"
                            >
                                <FiSettings className="w-4 h-4 text-gray-400" />
                                ویرایش پروفایل
                            </Link>
                        ) : (
                            <button
                                onClick={handleFollow}
                                disabled={followLoading}
                                className={`inline-flex items-center gap-2 text-sm font-bold px-7 py-2.5 rounded-full transition-all cursor-pointer active:scale-95 ${
                                    isFollowed
                                        ? 'text-gray-700 bg-white ring-1 ring-gray-300 hover:ring-gray-400 shadow-sm'
                                        : 'text-white bg-gray-900 hover:bg-black shadow-lg shadow-gray-300/60 hover:-translate-y-0.5'
                                } ${followLoading ? 'opacity-60 cursor-not-allowed' : ''}`}
                            >
                                {followLoading ? (
                                    <span className="w-4 h-4 border-2 border-current border-t-transparent rounded-full animate-spin opacity-70" />
                                ) : isFollowed ? (
                                    <FiCheck className="w-4 h-4" />
                                ) : (
                                    <FiUserPlus className="w-4 h-4" />
                                )}
                                {isFollowed ? 'دنبال می‌کنید' : 'دنبال کردن'}
                            </button>
                        )}
                    </div>
                </div>
            </div>

            {/* ═══════════ پین‌های کاربر — بدون کارت سنگین ═══════════ */}
            <div className="max-w-[1400px] mx-auto px-4 sm:px-8 mt-12">
                <div className="flex items-center gap-3 mb-6">
                    <h2 className="flex items-center gap-2 font-bold text-gray-900 text-sm shrink-0">
                        <span className="w-7 h-7 rounded-lg bg-red-50 flex items-center justify-center">
                            <FiImage className="w-3.5 h-3.5 text-red-500" />
                        </span>
                        پین‌های {profileUser.name}
                    </h2>
                    <div className="flex-1 h-px bg-gray-100" />
                </div>

                {pins.length === 0 ? (
                    <div className="flex flex-col items-center justify-center py-16 text-center">
                        <div className="w-16 h-16 rounded-3xl bg-gradient-to-br from-gray-50 to-gray-100 ring-1 ring-gray-100 flex items-center justify-center mb-4 rotate-3">
                            <FiImage className="w-7 h-7 text-gray-300" />
                        </div>
                        <p className="text-gray-600 text-sm font-bold">این کاربر هنوز پینی نساخته است</p>
                        <p className="text-gray-400 text-xs mt-1">به‌زودی شاید ایده‌های جدیدی اضافه کنه ✨</p>
                    </div>
                ) : (
                    <div className="columns-2 md:columns-3 lg:columns-4 xl:columns-5 gap-4 space-y-4">
                        {pins.map(pin => (
                            <PinCard
                                key={pin.id}
                                pin={pin}
                            />
                        ))}
                    </div>
                )}
            </div>
        </main>
    )
}