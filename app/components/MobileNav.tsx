"use client"

import Link from 'next/link'
import { usePathname } from 'next/navigation'
import { useAuthStore } from '@/lib/authStore'
import { useState, useEffect } from 'react'
import {
    FiHome,
    FiPlus,
    FiGrid,
    FiUser,
    FiSearch,
    FiMessageCircle,
} from 'react-icons/fi'

const MobileNav = () => {
    const pathname = usePathname()
    const [unreadCount, setUnreadCount] = useState(0)
    const { user } = useAuthStore()

    // ✅ فقط یک useEffect برای دریافت تعداد پیام‌های نخوانده
    useEffect(() => {
        if (!user) return

        const fetchUnreadCount = async () => {
            try {
                const res = await fetch('/api/conversations')
                if (res.ok) {
                    const data = await res.json()
                    const total = (data.conversations || []).reduce(
                        (sum: number, conv: any) => sum + (conv.unreadCount || 0),
                        0
                    )
                    setUnreadCount(total)
                }
            } catch (err) {
                console.error(err)
            }
        }

        fetchUnreadCount()
        const interval = setInterval(fetchUnreadCount, 10000)
        return () => clearInterval(interval)
    }, [user])

    // ✅ شرط مخفی‌سازی بعد از Hook ها
    if (pathname.startsWith('/messages/')) {
        return null
    }

    const navItems = [
        { href: '/', icon: FiHome, label: 'خانه' },
        { href: '/search', icon: FiSearch, label: 'جستجو' },
        { href: '/create', icon: FiPlus, label: 'ساخت پین' },
        { href: '/myboards', icon: FiGrid, label: 'بردها' },
        { href: '/messages', icon: FiMessageCircle, label: 'پیام‌ها' },
    ]

    const activeIndex = navItems.findIndex((item) =>
        item.href === '/' ? pathname === '/' : pathname.startsWith(item.href)
    )

    const isCreateActive = activeIndex === 2

    return (
        <nav
            className="lg:hidden fixed bottom-0 left-0 right-0 z-50 px-3 pb-[calc(env(safe-area-inset-bottom,0px)+10px)] pt-1.5 pointer-events-none"
        >
            {/* ═══ داک شیشه‌ای باریک ═══ */}
            <div className="relative pointer-events-auto">
                {/* رینگ گرادیانتی لبه‌ی داک */}
                <div className="absolute -inset-px rounded-[22px] bg-gradient-to-t from-red-200/30 via-transparent to-white/40 pointer-events-none" />

                {/* بدنه‌ی شیشه‌ای */}
                <div className="relative h-[50px] rounded-[21px] bg-white/80 backdrop-blur-2xl
                    shadow-[0_8px_30px_-8px_rgba(0,0,0,0.22),0_2px_6px_rgba(0,0,0,0.05)]
                    ring-1 ring-white/60
                    flex items-stretch px-1"
                >
                    {/* هایلایت نور بالای شیشه */}
                    <div className="absolute top-0 inset-x-8 h-px bg-gradient-to-r from-transparent via-white/90 to-transparent" />

                    {/* ═══ آیتم‌ها ═══ */}
                    {navItems.map((item, index) => {
                        const Icon = item.icon
                        const active = index === activeIndex
                        const isCenter = index === 2

                        // ── دکمه‌ی مرکزی: FAB برجسته ──
                        if (isCenter) {
                            return (
                                <Link
                                    key={item.href}
                                    href={item.href}
                                    aria-label={item.label}
                                    className="relative flex-1 flex items-center justify-center no-underline group"
                                >
                                    {/* پالس رادار — فقط وقتی فعال نیست */}
                                    {!isCreateActive && (
                                        <>
                                            <span className="absolute w-10 h-10 rounded-xl bg-red-500/15 blur-md animate-[radarPulse_2.2s_ease-out_infinite] pointer-events-none" />
                                            <span className="absolute w-10 h-10 rounded-xl bg-red-500/10 blur-md animate-[radarPulse_2.2s_ease-out_0.7s_infinite] pointer-events-none" />
                                        </>
                                    )}

                                    {/* هاله‌ی گرادیانتی زیر دکمه */}
                                    <span className="absolute w-11 h-11 rounded-xl bg-gradient-to-br from-red-500 to-orange-500 blur-lg opacity-40 group-hover:opacity-60 transition-opacity pointer-events-none" />

                                    {/* حلقه‌ی گرادیانتی چرخان دور دکمه */}
                                    <span
                                        className="absolute w-[49px] h-[49px] -mt-5 rounded-[18px] animate-[spinSlow_5s_linear_infinite] opacity-80 pointer-events-none"
                                        style={{
                                            background: 'conic-gradient(from 0deg, #ef4444, #fb923c, #f43f5e, #ef4444)',
                                        }}
                                    />

                                    {/* خود دکمه — بیرون‌زده از داک */}
                                    <span
                                        className={`relative w-[47px] h-[47px] -mt-6 rounded-[16px] flex items-center justify-center shadow-lg transition-all duration-300 active:scale-90 ${
                                            isCreateActive
                                                ? 'bg-gradient-to-br from-red-600 to-rose-600 shadow-red-400/40 scale-105'
                                                : 'bg-gradient-to-br from-red-500 via-rose-500 to-orange-500 shadow-red-300/50 group-hover:-translate-y-0.5'
                                        }`}
                                    >
                                        {/* هایلایت شیشه‌ای داخل دکمه */}
                                        <span className="absolute top-1 inset-x-2.5 h-1/3 rounded-t-[14px] bg-white/20 pointer-events-none" />

                                        <FiPlus
                                            className={`relative w-5 h-5 text-white drop-shadow transition-transform duration-500 ${
                                                isCreateActive ? 'rotate-45' : 'group-hover:rotate-90'
                                            }`}
                                        />
                                    </span>
                                </Link>
                            )
                        }

                        // ── آیتم‌های معمولی ──
                        return (
                            <Link
                                key={item.href}
                                href={item.href}
                                aria-label={item.label}
                                className={`relative flex-1 flex flex-col items-center justify-center no-underline group transition-transform duration-300 ${
                                    active ? '-translate-y-0.5' : ''
                                }`}
                            >
                                {/* هاله‌ی درخشش پشت آیکون فعال */}
                                {active && (
                                    <span className="absolute top-1/2 -translate-y-1/2 w-8 h-8 rounded-full bg-red-400/25 blur-md pointer-events-none" />
                                )}

                                {/* آیکون با badge */}
                                <span className="relative">
                                    <Icon
                                        className={`relative w-[18px] h-[18px] transition-all duration-500 ${
                                            active
                                                ? 'text-red-600 scale-110 drop-shadow-[0_1px_5px_rgba(239,68,68,0.4)] animate-[iconPop_0.5s_cubic-bezier(0.34,1.56,0.64,1)]'
                                                : 'text-gray-400 group-hover:text-gray-600 group-hover:scale-105 group-active:scale-90'
                                        }`}
                                    />

                                    {/* badge برای پیام‌های نخوانده */}
                                    {item.href === '/messages' && unreadCount > 0 && (
                                        <span className="absolute top-[1px] -left-1 flex">
                                            <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-red-400 opacity-75"></span>
                                            <span className="relative inline-flex rounded-full h-2 w-2 bg-gradient-to-br from-red-500 to-rose-600 ring-2 ring-white shadow-sm"></span>
                                        </span>
                                    )}
                                </span>

                                {/* نقطه‌ی نورانی زیر آیتم فعال */}
                                <span
                                    className={`absolute bottom-1.5 w-[3px] h-[3px] rounded-full bg-gradient-to-l from-red-500 to-orange-400 shadow-[0_0_5px_rgba(239,68,68,0.7)] transition-all duration-300 ${
                                        active ? 'opacity-100 scale-100' : 'opacity-0 scale-0'
                                    }`}
                                />
                            </Link>
                        )
                    })}
                </div>
            </div>

            <style>{`
                @keyframes iconPop {
                    0%   { transform: scale(0.6) translateY(3px); }
                    60%  { transform: scale(1.25) translateY(-2px); }
                    100% { transform: scale(1.1) translateY(0); }
                }
                @keyframes radarPulse {
                    0%   { transform: scale(0.85); opacity: 0.7; }
                    100% { transform: scale(1.45); opacity: 0; }
                }
                @keyframes spinSlow {
                    from { transform: rotate(0deg); }
                    to   { transform: rotate(360deg); }
                }
                @media (prefers-reduced-motion: reduce) {
                    * { animation: none !important; }
                }
            `}</style>
        </nav>
    )
}

export default MobileNav