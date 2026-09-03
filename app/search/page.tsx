"use client"

import { useEffect, useState } from 'react'
import { useSearchParams } from 'next/navigation'
import Link from 'next/link'
import PinCard from '../components/PinCard'
import { FiSearch, FiX, FiArrowRight, FiHome } from 'react-icons/fi'

// اسکلتون لودینگ با شکل‌های متنوع (شبیه‌سازی masonry واقعی)
const SkeletonCard = ({ tall }: { tall: boolean }) => (
    <div className="break-inside-avoid mb-4 animate-pulse">
        <div
            className={`rounded-[15px] bg-gray-200/70 ${tall ? 'h-72' : 'h-48'}`}
        />
        <div className="mt-2.5 px-1 flex items-center gap-2">
            <div className="h-3 w-20 rounded-full bg-gray-200/70" />
            <div className="mr-auto h-3 w-10 rounded-full bg-gray-200/70" />
        </div>
    </div>
)

export default function SearchPage() {
    const searchParams = useSearchParams()
    const q = searchParams.get('q') || ''

    const [pins, setPins] = useState<any[]>([])
    const [loading, setLoading] = useState(true)

    useEffect(() => {
        if (!q.trim()) {
            setPins([])
            setLoading(false)
            return
        }

        const fetchResults = async () => {
            setLoading(true)
            try {
                const res = await fetch(`/api/search?q=${encodeURIComponent(q)}`)
                if (!res.ok) throw new Error('خطا')
                const data = await res.json()
                setPins(data.pins || [])
            } catch (error) {
                console.error(error)
                setPins([])
            } finally {
                setLoading(false)
            }
        }

        fetchResults()
    }, [q])

    return (
        <main
            dir="rtl"
            className="relative min-h-screen overflow-hidden bg-gradient-to-br from-gray-50 via-white to-red-50/40 py-8 px-4"
        >
            {/* عناصر تزئینی پس‌زمینه */}
            <div className="absolute -top-24 -left-24 w-96 h-96 bg-red-100/50 rounded-full blur-3xl pointer-events-none" />
            <div className="absolute -bottom-32 -right-32 w-[28rem] h-[28rem] bg-orange-100/40 rounded-full blur-3xl pointer-events-none" />

            <div className="relative mx-auto px-3">
                {/* ═══ سربرگ ═══ */}
                <div className="flex flex-col md:flex-row md:items-center justify-between gap-5 mb-10">
                    <div className="min-w-0">
                        <p className="text-xs font-semibold text-gray-400 mb-2 flex items-center gap-1.5">
                            <FiSearch className="w-3.5 h-3.5" />
                            نتایج جستجو
                        </p>

                        {/* بج عبارت جستجو */}
                        {q ? (
                            <div className="flex items-center gap-3 flex-wrap">
                                <div className="inline-flex items-center gap-2.5 bg-white/90 backdrop-blur-md rounded-2xl pr-4 pl-2 py-2 shadow-lg shadow-gray-200/60 ring-1 ring-black/5 max-w-full">
                                    <FiSearch className="w-4.5 h-4.5 w-5 h-5 text-red-500 shrink-0" />
                                    <span className="font-extrabold text-gray-900 text-md truncate">
                                        {q}
                                    </span>
                                    <Link
                                        href="/"
                                        className="shrink-0 w-7 h-7 rounded-full bg-gray-100 hover:bg-red-100 hover:text-red-600 text-gray-400 flex items-center justify-center transition-all hover:rotate-90 duration-300 cursor-pointer no-underline"
                                        title="پاک کردن جستجو"
                                    >
                                        <FiX className="w-4 h-4" />
                                    </Link>
                                </div>

                                {!loading && pins.length > 0 && (
                                    <span className="text-sm text-gray-500 font-medium animate-[fadeInUp_0.3s_ease-out]">
                                        <span className="font-extrabold text-gray-900">{pins.length}</span> پین پیدا شد
                                    </span>
                                )}
                            </div>
                        ) : (
                            <h1 className="text-2xl md:text-3xl font-extrabold text-gray-900">
                                جستجو کنید
                            </h1>
                        )}
                    </div>

                    <Link
                        href="/"
                        className="shrink-0 self-start md:self-auto inline-flex items-center gap-2 text-gray-600 hover:text-red-600 transition-all bg-white/90 backdrop-blur-md px-5 py-2.5 rounded-full shadow-sm ring-1 ring-black/5 hover:ring-red-200 hover:shadow-lg hover:shadow-red-100/50 no-underline font-semibold text-sm group"
                    >
                        <FiArrowRight className="w-4 h-4 transition-transform group-hover:-translate-x-1" />
                        بازگشت به خانه
                    </Link>
                </div>

                {/* ═══ نتایج ═══ */}
                {loading ? (
                    // اسکلتون لودینگ: شبیه چیدمان واقعی masonry
                    <div className="columns-2 md:columns-3 lg:columns-4 xl:columns-5 gap-4 space-y-4">
                        <SkeletonCard tall={true} />
                        <SkeletonCard tall={false} />
                        <SkeletonCard tall={true} />
                        <SkeletonCard tall={false} />
                        <SkeletonCard tall={true} />
                        <SkeletonCard tall={false} />
                        <SkeletonCard tall={false} />
                        <SkeletonCard tall={true} />
                        <SkeletonCard tall={false} />
                        <SkeletonCard tall={true} />
                    </div>
                ) : pins.length === 0 ? (
                    // حالت خالی
                    <div className="flex flex-col items-center justify-center py-20 md:py-28 text-center">
                        <div className="relative mb-6">
                            <div className="absolute inset-0 bg-red-100/60 rounded-full blur-2xl scale-125 pointer-events-none" />
                            <div className="relative w-24 h-24 rounded-[1.75rem] bg-white shadow-xl shadow-gray-200/60 ring-1 ring-black/5 flex items-center justify-center rotate-3">
                                <FiSearch className="w-10 h-10 text-gray-300" />
                                <span className="absolute -bottom-2 -left-2 w-9 h-9 rounded-2xl bg-gradient-to-br from-red-500 to-rose-600 shadow-lg shadow-red-200/70 flex items-center justify-center -rotate-6">
                                    <FiX className="w-4.5 h-4.5 w-5 h-5 text-white" />
                                </span>
                            </div>
                        </div>

                        <h2 className="text-xl md:text-2xl font-extrabold text-gray-800 mb-2">
                            چیزی پیدا نشد
                        </h2>
                        <p className="text-gray-500 text-sm md:text-base leading-relaxed max-w-sm">
                            نتیجه‌ای برای{' '}
                            <span className="font-bold text-gray-700">«{q}»</span> پیدا نشد.
                            <br />
                            املای عبارت را بررسی کنید یا عبارت دیگری را امتحان کنید.
                        </p>

                        <Link
                            href="/"
                            className="mt-8 inline-flex items-center gap-2 bg-red-600 hover:bg-red-700 text-white font-bold text-sm px-6 py-3 rounded-full shadow-lg shadow-red-200/70 hover:shadow-xl hover:-translate-y-0.5 transition-all no-underline"
                        >
                            <FiHome className="w-4 h-4" />
                            کشف پین‌های جدید
                        </Link>
                    </div>
                ) : (
                    // گرید نتایج
                    <div className="columns-2 md:columns-3 lg:columns-4 xl:columns-5 gap-4 space-y-4">
                        {pins.map(pin => (
                            <PinCard key={pin.id} pin={pin} />
                        ))}
                    </div>
                )}
            </div>

            <style>{`
                @keyframes fadeInUp {
                    from { opacity: 0; transform: translateY(10px); }
                    to { opacity: 1; transform: translateY(0); }
                }
            `}</style>
        </main>
    )
}