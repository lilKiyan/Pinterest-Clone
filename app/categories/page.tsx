"use client"

import { useState, useMemo } from 'react'
import Link from 'next/link'
import { useQuery } from '@tanstack/react-query'
import Spinner from '@/app/components/Spinner'
import { FiArrowLeft, FiArrowRight, FiSearch, FiTag } from 'react-icons/fi'
import { getCategoryBySlug, getCategoryIcon } from '@/lib/categories'

// ═══════════ تایپ‌ها ═══════════

type CategoryRow = {
    id: string
    slug: string
    name: string
    icon: string
    color: string
    isActive: boolean
    _count: { pins: number }
}

export default function CategoriesPage() {
    const [search, setSearch] = useState('')

    // ── Query: همه‌ی دسته‌های فعال ──
    const {
        data: categoriesData,
        isLoading,
    } = useQuery<{ categories: CategoryRow[] }>({
        queryKey: ['categories-all'],
        queryFn: async () => {
            const res = await fetch('/api/categories')
            if (!res.ok) throw new Error('خطا در دریافت دسته‌بندی‌ها')
            return res.json()
        },
        staleTime: 5 * 60 * 1000,
    })

    const categories = categoriesData?.categories ?? []

    // ── جستجوی زنده ──
    const filteredCategories = useMemo(() => {
        const q = search.trim().toLowerCase()
        if (!q) return categories
        return categories.filter(
            (c) => c.name.toLowerCase().includes(q)
        )
    }, [categories, search])

    // ── مرتب‌سازی: پرپین‌ترها اول ──
    const sortedCategories = useMemo(() => {
        return [...filteredCategories].sort(
            (a, b) => b._count.pins - a._count.pins
        )
    }, [filteredCategories])

    const totalPins = categories.reduce((sum, c) => sum + c._count.pins, 0)

    return (
        <div className="min-h-screen bg-gradient-to-b from-gray-50 to-white px-4 sm:px-6 py-6 sm:py-10 mb-20">
            <div className="p-4 md:p-6 mx-auto">

                {/* ═══ هدر — بازگشت دقیقاً قبل از عنوان ═══ */}
                <div className="flex items-start justify-between gap-4 mb-8 sm:mb-12 animate-[fadeInUp_0.4s_ease-out_both]">
                    <div className="flex items-center gap-3.5">
                        {/* بازگشت — دایره‌ای، قبل از عنوان */}
                        <Link
                            href="/"
                            aria-label="بازگشت به خانه"
                            className="group w-10 h-10 sm:w-11 sm:h-11 shrink-0 rounded-full
                                flex items-center justify-center
                                text-gray-400 hover:text-white
                                ring-1 ring-gray-200 hover:ring-gray-900
                                bg-white hover:bg-gray-900
                                transition-all duration-300
                                hover:shadow-lg hover:shadow-gray-900/20
                                active:scale-90 no-underline"
                        >
                            <FiArrowRight
                                className="w-4 h-4 transition-transform duration-300"
                            />
                        </Link>

                        <div>
                            <h1 className="text-lg sm:text-3xl font-bold text-gray-900 tracking-tight">
                                دسته‌بندی‌ها
                            </h1>
                            <p className="text-xs md:text-[13px] text-gray-400 mt-0.5">
                                {categories.length.toLocaleString('fa-IR')} دسته ·{' '}
                                {totalPins.toLocaleString('fa-IR')} پین
                            </p>
                        </div>
                    </div>
                </div>

                {/* ═══ جستجو — pill مدرن ═══ */}
                <div className="relative mb-8 sm:mb-10">
                    <FiSearch className="absolute right-4 top-1/2 -translate-y-1/2
                        text-gray-300 w-4 h-4 pointer-events-none" />
                    <input
                        type="text"
                        value={search}
                        onChange={(e) => setSearch(e.target.value)}
                        placeholder="جستجوی دسته‌بندی..."
                        className="w-full bg-white ring-1 ring-gray-200/80 rounded-full
                            pr-11 pl-4 py-3 sm:py-3.5 text-sm sm:text-base text-gray-800 placeholder-gray-300
                            focus:outline-none focus:ring-2 focus:ring-red-300/60
                            transition-all md:placeholder:text-md placeholder:text-xs"
                    />
                </div>

                {/* ═══ محتوا ═══ */}
                {isLoading ? (
                    <div className="flex justify-center py-24">
                        <Spinner size="lg" />
                    </div>
                ) : sortedCategories.length === 0 ? (
                    <div className="py-20 text-center">
                        <FiTag className="w-7 h-7 text-gray-200 mx-auto mb-3" />
                        <p className="text-sm text-gray-400">
                            {search ? 'دسته‌بندی‌ای با این نام پیدا نشد' : 'هنوز دسته‌بندی‌ای وجود ندارد'}
                        </p>
                    </div>
                ) : (
                    <div className="grid grid-cols-2 md:grid-cols-4 lg:grid-cols-6 gap-3 sm:gap-4">
                        {sortedCategories.map((cat, index) => {
                            // ✨ آیکون و رنگ از منبع واحد (slug) — هر دسته متمایز حتی با DB قدیمی
                            const meta = getCategoryBySlug(cat.slug)
                            const Icon = meta?.iconComponent ?? getCategoryIcon(cat.icon)
                            const color = meta?.color ?? cat.color

                            return (
                                <Link
                                    key={cat.id}
                                    href={`/category/${cat.slug}`}
                                    style={{
                                        animationDelay: `${Math.min(index * 40, 400)}ms`,
                                        '--cat-color': color,
                                    } as React.CSSProperties}
                                    className="group no-underline
                                        relative overflow-hidden
                                        rounded-3xl p-5 sm:p-6
                                        ring-1 ring-gray-100
                                        hover:ring-[var(--cat-color)]
                                        bg-white
                                        transition-all duration-300
                                        hover:-translate-y-1 hover:shadow-lg hover:shadow-gray-200/70
                                        active:scale-[0.98]
                                        animate-[fadeInUp_0.4s_ease-out_backwards]"
                                >
                                    {/* آیکون — حباب رنگی بزرگ */}
                                    <span
                                        className="w-12 h-12 sm:w-14 sm:h-14 rounded-2xl
                                            flex items-center justify-center
                                            mb-4 transition-transform duration-300
                                            group-hover:scale-110 group-hover:rotate-[-8deg]"
                                        style={{ backgroundColor: `${color}14` }}
                                    >
                                        <Icon
                                            className="w-6 h-6 sm:w-7 sm:h-7"
                                            style={{ color }}
                                        />
                                    </span>

                                    {/* نام */}
                                    <p className="font-bold text-xs md:text-sm sm:text-base text-gray-900 truncate">
                                        {cat.name}
                                    </p>

                                    {/* تعداد پین */}
                                    <p className="text-xs text-gray-400 mt-1 tabular-nums">
                                        {cat._count.pins.toLocaleString('fa-IR')} پین
                                    </p>

                                    {/* فلش — ظاهر شدن هنگام hover */}
                                    <FiArrowLeft
                                        className="absolute bottom-6 left-5 w-4 h-4 text-gray-200
                                            transition-all duration-300
                                            group-hover:text-gray-900 group-hover:-translate-x-1"
                                    />
                                </Link>
                            )
                        })}
                    </div>
                )}
            </div>

            <style>{`
                @keyframes fadeInUp {
                    from { opacity: 0; transform: translateY(10px); }
                    to   { opacity: 1; transform: translateY(0); }
                }
                @media (prefers-reduced-motion: reduce) {
                    * { animation: none !important; }
                }
            `}</style>
        </div>
    )
}