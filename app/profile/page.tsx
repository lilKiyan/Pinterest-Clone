"use client"

import { useEffect, useState } from 'react'
import Link from 'next/link'
import PinCard from '../components/PinCard'
import { useAuthStore } from '@/lib/authStore'
import { FiAtSign, FiMail, FiImage, FiMapPin, FiGrid, FiPlus, FiUserPlus } from 'react-icons/fi'

export default function ProfilePage() {
    const { user, setUser } = useAuthStore()
    const [pins, setPins] = useState<any[]>([])
    const [loadingPins, setLoadingPins] = useState(true)
    const [loadingUser, setLoadingUser] = useState(!user)
    const [followersCount, setFollowersCount] = useState(0)

    // دریافت اولیه کاربر اگر store خالی باشد
    useEffect(() => {
        if (!user) {
            fetch('/api/auth/me')
                .then(res => res.ok ? res.json() : null)
                .then(data => {
                    if (data?.user) setUser(data.user)
                })
                .catch(console.error)
                .finally(() => setLoadingUser(false))
        } else {
            setLoadingUser(false)
        }
    }, [user, setUser])

    // دریافت پین‌های کاربر
    useEffect(() => {
        const fetchPins = async () => {
            if (!user) return
            try {
                const res = await fetch('/api/pins/mine')
                if (!res.ok) throw new Error('خطا')
                const data = await res.json()
                setPins(data)
            } catch (error) {
                console.error(error)
            } finally {
                setLoadingPins(false)
            }
        }
        fetchPins()
    }, [user])

    // دریافت تعداد دنبال‌کننده‌ها
    useEffect(() => {
        const fetchFollowersCount = async () => {
            if (!user) return
            try {
                const res = await fetch(`/api/users/${user.id}/follow`)
                if (res.ok) {
                    const data = await res.json()
                    setFollowersCount(data.followersCount)
                }
            } catch (error) {
                console.error(error)
            }
        }
        fetchFollowersCount()
    }, [user])

    const handlePinDeleted = (pinId: string) => {
        setPins(prev => prev.filter(p => p.id !== pinId))
    }

    if (loadingUser) {
        return (
            <main className="min-h-[60vh] flex justify-center items-center">
                <div className="w-9 h-9 border-[3px] border-gray-200 border-t-red-500 rounded-full animate-spin" />
            </main>
        )
    }

    if (!user) {
        return (
            <main className="min-h-[60vh] flex flex-col items-center justify-center text-center px-4">
                <div className="w-16 h-16 rounded-2xl bg-gray-50 ring-1 ring-black/5 flex items-center justify-center mb-4">
                    <FiAtSign className="w-6 h-6 text-gray-300" />
                </div>
                <p className="text-gray-500 text-sm">برای مشاهده پروفایل وارد شوید.</p>
            </main>
        )
    }

    return (
        <main className="pb-8">
            {/* هیرو رنگی */}
            <div className="relative overflow-hidden bg-[#150a08] px-4 sm:px-8 pt-14 pb-20 sm:pb-24">
                <div className="absolute -top-24 -right-16 w-72 h-72 bg-red-600/40 rounded-full blur-[100px] animate-pulse" />
                <div className="absolute -bottom-24 -left-16 w-80 h-80 bg-orange-500/30 rounded-full blur-[100px] animate-pulse" />
                <div className="absolute top-1/3 left-1/2 w-64 h-64 bg-fuchsia-600/15 rounded-full blur-[90px]" />

                <FiMapPin className="hero-float hero-float-1 absolute top-[20%] left-[10%] w-6 h-6 text-white/15" />
                <FiMapPin className="hero-float hero-float-2 absolute top-[15%] right-[14%] w-8 h-8 text-white/10" />
                <FiMapPin className="hero-float hero-float-3 absolute bottom-[18%] left-[20%] w-5 h-5 text-white/15" />

                <div className="relative z-10 max-w-6xl mx-auto flex flex-col items-center text-center">
                    <div className="relative group">
                        <div className="absolute inset-0 rounded-full bg-gradient-to-br from-red-500 to-orange-500 opacity-0 group-hover:opacity-30 blur-lg transition-opacity duration-500" />
                        <div className="w-28 h-28 sm:w-32 sm:h-32 rounded-full bg-gradient-to-br from-red-500 via-red-600 to-orange-500 ring-4 ring-white/20 shadow-2xl flex items-center justify-center text-4xl sm:text-5xl font-black text-white transition-all duration-300 group-hover:scale-105 group-hover:ring-white/40 group-hover:shadow-2xl">
                            <span className='h-[33px]'>{user.username?.charAt(0).toUpperCase() || '؟'}</span>
                        </div>
                        <div className="absolute -bottom-1.5 -left-1.5 w-8 h-8 rounded-full bg-white flex items-center justify-center shadow-lg transition-transform duration-300 group-hover:rotate-12">
                            <FiGrid className="w-3.5 h-3.5 text-red-600" />
                        </div>
                    </div>

                    <h1 className="text-white text-2xl sm:text-3xl font-extrabold tracking-tight mt-5 transition-transform duration-300 hover:scale-[1.02]">
                        {user.name}
                    </h1>

                    <div className="flex flex-wrap items-center justify-center gap-2.5 mt-3">
                        <span className="flex items-center gap-1.5 bg-white/10 backdrop-blur-sm text-white/80 text-xs font-medium px-3 py-1.5 rounded-full ring-1 ring-white/10 transition-all duration-200 hover:bg-white/20 hover:scale-105 hover:ring-white/30 cursor-default">
                            <FiAtSign className="w-3 h-3" /> {user.username}
                        </span>
                        <span className="flex items-center gap-1.5 bg-white/10 backdrop-blur-sm text-white/80 text-xs font-medium px-3 py-1.5 rounded-full ring-1 ring-white/10 transition-all duration-200 hover:bg-white/20 hover:scale-105 hover:ring-white/30 cursor-default">
                            <FiMail className="w-3 h-3" /> {user.email}
                        </span>
                    </div>

                    {/* آمار: مینیمال با لهجه‌ی رنگی */}
                    <div className="mt-6 flex items-center gap-5 sm:gap-7">

                        {/* پین‌ها */}
                        <div className="group/stat flex flex-col items-center gap-1.5 cursor-default">
                            <div className="flex items-center gap-1.5">
                                <FiGrid className="w-5 h-5 text-red-400/60 transition-all duration-300 group-hover/stat:text-red-400 group-hover/stat:scale-110" />
                                <span className="text-xl sm:text-2xl font-black tabular-nums leading-none bg-gradient-to-br from-red-400 to-orange-400 bg-clip-text text-transparent">
                                    {pins.length}
                                </span>
                            </div>
                            <span className="text-[11px] text-white/50 font-semibold">پین</span>
                            {/* خط نورانی زیر — با hover روشن میشه */}
                            <span className="h-0.5 w-0 rounded-full bg-gradient-to-l from-red-500 to-orange-400 opacity-0 group-hover/stat:opacity-100 group-hover/stat:w-full transition-all duration-400 ease-out" />
                        </div>

                        {/* جداکننده نقطه‌ای */}
                        <span className="w-1 h-1 rounded-full bg-white/20" />

                        {/* دنبال‌کننده‌ها */}
                        <div className="group/stat flex flex-col items-center gap-1.5 cursor-default">
                            <div className="flex items-center gap-1.5">
                                <FiUserPlus className="w-5 h-5 text-fuchsia-400/60 transition-all duration-300 group-hover/stat:text-fuchsia-400 group-hover/stat:scale-110" />
                                <span className="text-xl sm:text-2xl font-black tabular-nums leading-none bg-gradient-to-br from-fuchsia-400 to-purple-400 bg-clip-text text-transparent">
                                    {followersCount}
                                </span>
                            </div>
                            <span className="text-[11px] text-white/50 font-semibold">دنبال‌کننده</span>
                            <span className="h-0.5 w-0 rounded-full bg-gradient-to-l from-fuchsia-500 to-purple-400 opacity-0 group-hover/stat:opacity-100 group-hover/stat:w-full transition-all duration-400 ease-out" />
                        </div>
                    </div>
                </div>
            </div>

            {/* پین‌های کاربر */}
            <div className="max-w-[1400px] mx-auto px-4 sm:px-8 -mt-8 relative z-10">
                <div className="bg-white rounded-3xl overflow-hidden shadow-[0_10px_40px_-15px_rgba(0,0,0,0.15)] ring-1 ring-black/5 transition-all duration-300 hover:shadow-[0_20px_50px_-12px_rgba(0,0,0,0.2)] hover:ring-black/10">
                    <div className="h-1.5 bg-gradient-to-r from-red-700 to-orange-600" />

                    {/* محتوای باکس */}
                    <div className="p-5 sm:p-7">
                        <div className="flex items-center gap-2.5 mb-6">
                            <div className="w-9 h-9 rounded-xl bg-red-50 flex items-center justify-center transition-transform duration-300 hover:rotate-6">
                                <FiImage className="w-4 h-4 text-red-600" />
                            </div>
                            <h2 className="text-lg font-bold text-gray-900">پین‌های شما</h2>
                        </div>

                        {loadingPins ? (
                            <div className="flex justify-center py-20">
                                <div className="w-9 h-9 border-[3px] border-gray-200 border-t-red-500 rounded-full animate-spin" />
                            </div>
                        ) : pins.length === 0 ? (
                            <div className="flex flex-col items-center justify-center py-20 text-center">
                                <div className="w-16 h-16 rounded-2xl bg-gray-50 ring-1 ring-black/5 flex items-center justify-center mb-4">
                                    <FiImage className="w-6 h-6 text-gray-300" />
                                </div>
                                <p className="text-gray-500 text-sm mb-5">هنوز پینی نساخته‌اید.</p>
                                <Link
                                    href="/create"
                                    className="inline-flex items-center gap-2 bg-red-600 hover:bg-red-700 text-white font-bold px-5 py-2.5 rounded-xl shadow-lg shadow-red-100 transition-all hover:scale-105 active:scale-95 no-underline"
                                >
                                    <FiPlus className="w-4 h-4" />
                                    ساخت اولین پین
                                </Link>
                            </div>
                        ) : (
                            <div className="columns-2 md:columns-3 lg:columns-4 xl:columns-5 gap-4 space-y-4">
                                {pins.map(pin => (
                                    <PinCard
                                        key={pin.id}
                                        pin={pin}
                                        onDeletePin={handlePinDeleted}
                                    />
                                ))}
                            </div>
                        )}
                    </div>
                </div>
            </div>

            <style>{`
                @keyframes heroFloat1 {
                    0%, 100% { transform: translateY(0) rotate(-6deg); }
                    50% { transform: translateY(-14px) rotate(-2deg); }
                }
                @keyframes heroFloat2 {
                    0%, 100% { transform: translateY(0) rotate(8deg); }
                    50% { transform: translateY(-18px) rotate(4deg); }
                }
                @keyframes heroFloat3 {
                    0%, 100% { transform: translateY(0) rotate(-4deg); }
                    50% { transform: translateY(-10px) rotate(2deg); }
                }
                .hero-float-1 { animation: heroFloat1 4.5s ease-in-out infinite; }
                .hero-float-2 { animation: heroFloat2 5.5s ease-in-out infinite; }
                .hero-float-3 { animation: heroFloat3 5s ease-in-out infinite; }
                @media (prefers-reduced-motion: reduce) {
                    .hero-float-1, .hero-float-2, .hero-float-3 { animation: none; }
                }
            `}</style>
        </main>
    )
}