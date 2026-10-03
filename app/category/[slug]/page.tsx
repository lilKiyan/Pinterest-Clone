"use client"

import { useState } from 'react'
import Link from 'next/link'
import { useParams, useRouter } from 'next/navigation'
import { useInfiniteQuery } from '@tanstack/react-query'
import PinCard from '@/app/components/PinCard'
import Spinner from '@/app/components/Spinner'
import {
    FiArrowRight,
    FiAlertCircle,
    FiImage,
    FiCheckCircle,
    FiAlertTriangle,
    FiFlag,
} from 'react-icons/fi'
import { getCategoryBySlug, CATEGORIES, DEFAULT_CATEGORY } from '@/lib/categories'
import { getCategoryIcon } from '@/lib/categories'

const LIMIT = 12

export default function CategoryPage() {
    const { slug } = useParams<{ slug: string }>()
    const router = useRouter()
    const [reportedFilterLocal] = useState('') // (برای آینده — گزارش‌ها اینجا هم می‌توانند فیلتر شوند)

    // ── دسته معتبر؟ از لیست ثابت چک می‌کنیم (سریع، بدون fetch) ──
    const categoryMeta = getCategoryBySlug(slug ?? '')

    if (!categoryMeta) {
        return (
            <div className="min-h-[70vh] flex flex-col items-center justify-center px-4 text-center">
                <FiAlertTriangle className="w-8 h-8 text-gray-300 mb-4" />
                <p className="text-gray-900 font-bold text-lg">دسته‌بندی یافت نشد</p>
                <p className="text-gray-400 text-sm mt-1 mb-5">
                    دسته‌بندی «{slug}» وجود ندارد
                </p>
                <button
                    onClick={() => router.push('/')}
                    className="no-underline bg-gray-900 text-white px-6 py-2.5 rounded-full font-semibold text-sm transition-all active:scale-95"
                >
                    بازگشت به خانه
                </button>
            </div>
        )
    }

    const CategoryIcon = categoryMeta.iconComponent

    // ── Query: پین‌های این دسته ──
    const {
        data,
        fetchNextPage,
        hasNextPage,
        isFetchingNextPage,
        isLoading,
        isError,
        error,
    } = useInfiniteQuery({
        queryKey: ['category-pins', slug],
        queryFn: async ({ pageParam = 1 }) => {
            const url = new URL(`/api/pins`, window.location.origin)
            url.searchParams.set('page', String(pageParam))
            url.searchParams.set('limit', String(LIMIT))
            url.searchParams.set('category', slug ?? '')

            const res = await fetch(url.toString())
            if (!res.ok) throw new Error('خطا در دریافت پین‌ها')
            return res.json()
        },
        initialPageParam: 1,
        getNextPageParam: (lastPage, allPages) => {
            return lastPage.hasMore ? allPages.length + 1 : undefined
        },
        staleTime: 60 * 1000,
        enabled: !!slug,
    })

    const pins = data?.pages.flatMap((page) => page.pins) ?? []

    return (
        <div dir="rtl" className="min-h-screen bg-white">
            <div className="p-4 md:p-6 mx-auto">

                {/* ═══ هدر — مینیمال ═══ */}
                <div className="flex items-end gap-4 mb-8 sm:mb-12">
                    <Link
                        href="/"
                        aria-label="بازگشت به خانه"
                        className="group mb-1 shrink-0 w-9 h-9 sm:w-12 sm:h-12 rounded-xl
                            flex items-center justify-center
                            text-gray-400 hover:text-white
                            ring-1 ring-gray-200 hover:ring-gray-900
                            bg-white hover:bg-gray-900
                            transition-all duration-300
                            hover:shadow-lg hover:shadow-gray-900/20
                            active:scale-90 no-underline"
                    >
                        <FiArrowRight
                            className="w-4 h-4 transition-transform duration-300
                            "
                        />
                    </Link>
                    <div className="min-w-0">
                        {/* عنوان + آیکون — ریسپانسیو دقیق */}
                        <h1 className="text-xl sm:text-2xl md:text-4xl font-bold text-gray-900
                            tracking-tight flex items-center gap-2.5 sm:gap-3.5">
                            <span
                                className="w-9 h-9 sm:w-12 sm:h-12 md:w-14 md:h-14
                                    rounded-xl sm:rounded-2xl
                                    flex items-center justify-center shrink-0
                                    transition-transform duration-300
                                    hover:scale-110 hover:rotate-[-6deg]"
                                style={{ backgroundColor: `${categoryMeta.color}14` }}
                            >
                                <CategoryIcon
                                    className="w-4 h-4 sm:w-5 sm:h-5 md:w-7 md:h-7
                                        transition-transform duration-300"
                                    style={{ color: categoryMeta.color }}
                                />
                            </span>

                            <span className="truncate">{categoryMeta.name}</span>
                        </h1>
                    </div>
                </div>

                {/* ═══ محتوا ═══ */}
                {isLoading ? (
                    <div className="flex justify-center py-28">
                        <Spinner size="lg" />
                    </div>
                ) : isError ? (
                    <div className="py-20 text-center">
                        <FiAlertCircle className="w-7 h-7 text-gray-300 mx-auto mb-3" />
                        <p className="text-sm text-gray-400">
                            {(error as Error)?.message || 'خطا در دریافت پین‌ها'}
                        </p>
                    </div>
                ) : pins.length === 0 ? (
                    <div className="py-20 text-center">
                        <FiImage className="w-7 h-7 text-gray-200 mx-auto mb-3" />
                        <p className="text-sm text-gray-500 font-medium">
                            هنوز پینی در دسته «{categoryMeta.name}» منتشر نشده
                        </p>
                        <Link
                            href="/create"
                            className="mt-5 inline-block no-underline text-sm font-semibold text-red-600 hover:text-red-700 transition-colors"
                        >
                            اولین پین این دسته را منتشر کن ←
                        </Link>
                    </div>
                ) : (
                    <div className="columns-2 md:columns-3 lg:columns-4 xl:columns-5 gap-4 space-y-4">
                        {pins.map((pin, index) => (
                            <PinCard
                                key={pin.id}
                                pin={pin}
                                optionsRotationDefault={-80}
                                priority={index < 4}
                            />
                        ))}
                    </div>
                )}

                {/* ═══ infinite scroll ═══ */}
                {hasNextPage && (
                    <div ref={(el) => {
                        // (برای سادگی فعلاً دکمه؛ در آینده می‌توان observer اضافه کرد)
                    }} />
                )}

                {hasNextPage && (
                    <div className="flex justify-center py-10">
                        <button
                            onClick={() => fetchNextPage()}
                            disabled={isFetchingNextPage}
                            className="no-underline px-6 py-2.5 rounded-full bg-gray-900 text-white text-xs font-bold
                                hover:bg-gray-800 transition-all active:scale-95 disabled:opacity-50"
                        >
                            {isFetchingNextPage ? (
                                <Spinner size="xs" />
                            ) : (
                                'بارگذاری بیشتر'
                            )}
                        </button>
                    </div>
                )}
            </div>

            {/* ═══ دسته‌های دیگر — مینیمال پایین ═══ */}
            <div className="p-4 md:p-6 mx-auto mt-16 pt-4 border-t border-gray-100">
                <p className="text-xs font-semibold text-gray-400 mb-3 pt-2">دسته‌بندی‌های دیگر</p>
                <div className="flex items-center gap-2 flex-wrap">
                    {CATEGORIES.filter((c) => c.slug !== slug).map((c) => (
                        <Link
                            key={c.slug}
                            href={`/category/${c.slug}`}
                            className="no-underline inline-flex items-center gap-1.5 px-3 py-1.5 rounded-full
                                text-xs font-medium text-gray-500
                                ring-1 ring-gray-200 hover:ring-gray-400 hover:text-gray-900
                                transition-all"
                        >
                            {(() => {
                                const Icon = getCategoryIcon(c.icon)
                                return <Icon className="w-3.5 h-3.5" />
                            })()}
                            {c.name}
                        </Link>
                    ))}
                </div>
            </div>
        </div>
    )
}