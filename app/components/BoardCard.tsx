"use client"

import Link from 'next/link'
import Image from 'next/image'
import { useEffect, useRef, useState } from 'react'
import { FiEdit2, FiTrash2, FiMoreVertical, FiBookmark } from 'react-icons/fi'
import type { Board, BoardPinPreview } from '../types/board'

type BoardCardProps = {
    board: Board
    onEdit?: () => void
    onDelete?: () => void
}

export default function BoardCard({
    board,
    onEdit,
    onDelete,
}: BoardCardProps) {
    const coverPins: BoardPinPreview[] = board.pins || []

    // ── منوی موبایل ──
    const [menuOpen, setMenuOpen] = useState(false)
    const menuRef = useRef<HTMLDivElement>(null)

    useEffect(() => {
        if (!menuOpen) return

        const handleOutside = (e: MouseEvent | TouchEvent) => {
            const target = e.target as Node
            if (menuRef.current && !menuRef.current.contains(target)) {
                setMenuOpen(false)
            }
        }

        document.addEventListener('mousedown', handleOutside)
        document.addEventListener('touchstart', handleOutside)
        return () => {
            document.removeEventListener('mousedown', handleOutside)
            document.removeEventListener('touchstart', handleOutside)
        }
    }, [menuOpen])

    const handleMenuAction = (action: 'edit' | 'delete') => {
        setMenuOpen(false)
        if (action === 'edit') onEdit?.()
        else onDelete?.()
    }

    // پین‌های کاور + شمارنده اضافه‌ها (بیشتر از ۴ تا)
    const visiblePins = coverPins.slice(0, 4)
    const extraCount = coverPins.length - visiblePins.length

    return (
        <div className="group relative" ref={menuRef}>
            <Link href={`/board/${board.id}`} className="block no-underline">
                <div
                    className={`relative rounded-2xl overflow-hidden bg-gray-100 ring-1 ring-black/5 shadow-sm transition-all duration-300 group-hover:shadow-xl group-hover:ring-black/10 group-hover:-translate-y-1 ${coverPins.length === 0 ? 'aspect-square' : ''
                        }`}
                >
                    {/* ═══ کاورها ═══ */}
                    {coverPins.length > 0 ? (
                        <div className="grid grid-cols-2 gap-0.5 aspect-square">
                            {visiblePins.map((pin, idx) => (
                                <div
                                    key={pin.id}
                                    className={`relative overflow-hidden transition-transform duration-500 ease-out group-hover:scale-[1.03] ${coverPins.length === 1
                                        ? 'col-span-2 row-span-2'
                                        : idx === 0 && coverPins.length > 2
                                            ? 'row-span-2'
                                            : ''
                                        }`}
                                >
                                    <Image
                                        src={pin.imageUrl}
                                        alt={pin.title}
                                        fill
                                        sizes="(max-width: 640px) 50vw, 25vw"
                                        className="object-cover"
                                    />

                                    {/* پوشش پین‌های اضافه — آخرین خانه */}
                                    {idx === 3 && extraCount > 0 && (
                                        <div className="absolute inset-0 bg-black/60 backdrop-blur-sm
                                            flex items-center justify-center">
                                            <span className="text-white font-extrabold text-xl">
                                                +{extraCount.toLocaleString('fa-IR')}
                                            </span>
                                        </div>
                                    )}
                                </div>
                            ))}
                        </div>
                    ) : (
                        /* ═══ برد خالی — مینیمال با پالس ═══ */
                        <div className="aspect-square flex flex-col items-center justify-center gap-3
                            bg-gradient-to-br from-gray-50 to-gray-100
                            border-2 border-dashed border-gray-200
                            group-hover:border-red-200 group-hover:from-red-50/30 transition-all duration-500">
                            <div className="relative">
                                <FiBookmark className="w-8 h-8 text-gray-300
                                    group-hover:text-red-300 transition-colors duration-500
                                    animate-[gentleFloat_3s_ease-in-out_infinite]" />
                            </div>
                            <span className="text-xs font-medium text-gray-400">برد خالی</span>
                        </div>
                    )}

                    {/* ═══ گرادیانت + نام برد روی کاور — فقط دسکتاپ hover ═══ */}
                    <div className="hidden md:block absolute inset-x-0 bottom-0
                        bg-gradient-to-t from-black/70 via-black/25 to-transparent
                        p-4 pt-10
                        opacity-0 translate-y-2 group-hover:opacity-100 group-hover:translate-y-0
                        transition-all duration-300 pointer-events-none">
                        <p className="text-white font-bold text-sm truncate">{board.name}</p>
                        <p className="text-white/70 text-[11px] mt-0.5">
                            {coverPins.length.toLocaleString('fa-IR')} پین
                        </p>
                    </div>

                    {/* ═══ badge شیشه‌ای تعداد — موبایل همیشه ═══ */}
                    {coverPins.length > 0 && (
                        <span className="md:hidden absolute bottom-2 right-2
                            inline-flex items-center gap-1
                            bg-black/50 backdrop-blur-md text-white
                            text-[10px] font-bold px-2.5 py-1 rounded-full
                            ring-1 ring-white/20">
                            📌 {coverPins.length.toLocaleString('fa-IR')}
                        </span>
                    )}
                </div>

                {/* ═══ زیرنویس ═══ */}
                <div className="mt-3 px-1">
                    <h3 className="font-bold text-gray-900 text-[15px] truncate
                        group-hover:text-red-600 transition-colors duration-200">
                        {board.name}
                    </h3>
                    <p className="text-xs text-gray-400 mt-0.5 tabular-nums">
                        {coverPins.length.toLocaleString('fa-IR')} پین
                    </p>
                </div>
            </Link>

            {/* ═══ دسکتاپ: دکمه‌های hover ═══ */}
            <div
                className="hidden md:flex absolute top-3 left-3 flex-col gap-1.5
                    opacity-0 translate-y-1 group-hover:opacity-100 group-hover:translate-y-0
                    transition-all duration-300"
            >
                <button
                    onClick={(e) => {
                        e.preventDefault()
                        onEdit?.()
                    }}
                    aria-label="ویرایش برد"
                    className="w-9 h-9 bg-white/95 backdrop-blur-sm rounded-full flex items-center justify-center
                        text-gray-600 shadow-lg hover:text-blue-600 hover:scale-110 active:scale-95
                        transition-all duration-200 cursor-pointer"
                >
                    <FiEdit2 className="w-4 h-4" />
                </button>
                <button
                    onClick={(e) => {
                        e.preventDefault()
                        onDelete?.()
                    }}
                    aria-label="حذف برد"
                    className="w-9 h-9 bg-white/95 backdrop-blur-sm rounded-full flex items-center justify-center
                        text-gray-600 shadow-lg hover:text-red-600 hover:scale-110 active:scale-95
                        transition-all duration-200 cursor-pointer"
                >
                    <FiTrash2 className="w-4 h-4" />
                </button>
            </div>

            {/* ═══ موبایل: دکمه ⋮ ═══ */}
            <button
                onClick={(e) => {
                    e.preventDefault()
                    setMenuOpen((prev) => !prev)
                }}
                aria-label="گزینه‌های برد"
                className="md:hidden absolute top-2 left-2 w-9 h-9 z-10
                    bg-black/45 hover:bg-black/60 backdrop-blur-md
                    rounded-full flex items-center justify-center
                    text-white shadow-lg transition-all duration-200
                    active:scale-90 cursor-pointer"
            >
                <FiMoreVertical className="w-4 h-4" />
            </button>

            {/* ═══ منوی موبایل — با stagger ═══ */}
            {menuOpen && (
                <div
                    className="md:hidden absolute top-12 left-2 z-20 w-44
                        bg-white/95 backdrop-blur-xl rounded-2xl shadow-2xl shadow-black/20
                        ring-1 ring-black/5 overflow-hidden
                        animate-[menuIn_0.2s_ease-out]"
                >
                    <button
                        onClick={() => handleMenuAction('edit')}
                        style={{ animationDelay: '0ms' }}
                        className="w-full flex items-center gap-3 px-4 py-3 text-sm font-semibold text-gray-700
                            hover:bg-gray-50 transition-colors cursor-pointer text-right
                            animate-[menuItem_0.25s_ease-out_both]"
                    >
                        <span className="w-7 h-7 rounded-lg bg-gray-100 flex items-center justify-center">
                            <FiEdit2 className="w-3.5 h-3.5 text-gray-500" />
                        </span>
                        ویرایش برد
                    </button>
                    <button
                        onClick={() => handleMenuAction('delete')}
                        style={{ animationDelay: '60ms' }}
                        className="w-full flex items-center gap-3 px-4 py-3 text-sm font-semibold text-red-600
                            hover:bg-red-50 transition-colors cursor-pointer text-right border-t border-gray-50
                            animate-[menuItem_0.25s_ease-out_both]"
                    >
                        <span className="w-7 h-7 rounded-lg bg-red-50 flex items-center justify-center">
                            <FiTrash2 className="w-3.5 h-3.5" />
                        </span>
                        حذف برد
                    </button>
                </div>
            )}

            <style>{`
                @keyframes menuIn {
                    from { opacity: 0; transform: translateY(-6px) scale(0.95); }
                    to   { opacity: 1; transform: translateY(0) scale(1); }
                }
                @keyframes menuItem {
                    from { opacity: 0; transform: translateX(12px); }
                    to   { opacity: 1; transform: translateX(0); }
                }
                @keyframes gentleFloat {
                    0%, 100% { transform: translateY(0) rotate(-4deg); }
                    50%      { transform: translateY(-5px) rotate(2deg); }
                }
            `}</style>
        </div>
    )
}