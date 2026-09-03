"use client"

import Link from 'next/link'
import { FiEdit2, FiTrash2 } from 'react-icons/fi'

export default function BoardCard({
    board,
    onEdit,
    onDelete,
}: {
    board: any
    onEdit?: () => void
    onDelete?: () => void
}) {
    const coverPins = board.pins || []

    return (
        <div className="group relative">
            <Link
                href={`/board/${board.id}`}
                className="block no-underline"
            >
                <div
                    className={`relative rounded-2xl overflow-hidden bg-gray-100 ring-1 ring-black/5 shadow-sm transition-all duration-300 group-hover:shadow-xl group-hover:ring-black/10 ${coverPins.length === 0 ? 'aspect-square flex items-center justify-center' : ''
                        }`}
                >
                    {coverPins.length > 0 ? (
                        <div className="grid grid-cols-2 gap-0.5 aspect-square">
                            {coverPins.map((pin: any) => (
                                <img
                                    key={pin.id}
                                    src={pin.imageUrl}
                                    alt={pin.title}
                                    className={`w-full h-full object-cover transition-transform duration-500 ease-out group-hover:scale-[1.06] ${coverPins.length === 1 ? 'col-span-2 row-span-2' : ''
                                        }`}
                                />
                            ))}
                        </div>
                    ) : (
                        <div className="flex flex-col items-center justify-center gap-2 w-full h-full bg-gradient-to-br from-gray-50 to-gray-100 border-2 border-dashed border-gray-200">
                            <span className="text-4xl opacity-70">📌</span>
                            <span className="text-xs font-medium text-gray-400">برد خالی</span>
                        </div>
                    )}

                    {/* گرادیانت ملایم پایین کاور برای خوانایی بهتر و عمق بصری موقع هاور */}
                    <div className="absolute inset-x-0 bottom-0 h-16 bg-gradient-to-t from-black/25 to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-300 pointer-events-none" />
                </div>

                <div className="mt-2.5 px-1">
                    <h3 className="font-bold text-gray-900 text-[15px] truncate group-hover:text-red-600 transition-colors duration-200">
                        {board.name}
                    </h3>
                    <p className="text-xs text-gray-500 mt-0.5">
                        {coverPins.length} پین
                    </p>
                </div>
            </Link>

            {/* دکمه‌های ویرایش و حذف */}
            <div className="absolute top-2.5 left-2.5 flex gap-1.5 opacity-0 group-hover:opacity-100 translate-y-1 group-hover:translate-y-0 transition-all duration-300">
                <button
                    onClick={(e) => {
                        e.preventDefault()
                        onEdit?.()
                    }}
                    aria-label="ویرایش برد"
                    className="w-8 h-8 bg-white/95 backdrop-blur-sm rounded-full flex items-center justify-center text-gray-700 shadow-md hover:shadow-lg hover:bg-white hover:scale-110 active:scale-95 transition-all duration-200 cursor-pointer"
                >
                    <FiEdit2 className="w-3.5 h-3.5" />
                </button>
                <button
                    onClick={(e) => {
                        e.preventDefault()
                        onDelete?.()
                    }}
                    aria-label="حذف برد"
                    className="w-8 h-8 bg-white/95 backdrop-blur-sm rounded-full flex items-center justify-center text-gray-700 shadow-md hover:shadow-lg hover:bg-red-50 hover:text-red-600 hover:scale-110 active:scale-95 transition-all duration-200 cursor-pointer"
                >
                    <FiTrash2 className="w-3.5 h-3.5" />
                </button>
            </div>
        </div>
    )
}