"use client"

import { useEffect, useState } from 'react'
import { useParams, useRouter } from 'next/navigation'
import PinCard from '../../components/PinCard'
import { FiArrowRight, FiGrid } from 'react-icons/fi'

export default function BoardPage() {
    const { id } = useParams<{ id: string }>()
    const router = useRouter()

    const [board, setBoard] = useState<any>(null)
    const [pins, setPins] = useState<any[]>([])
    const [loading, setLoading] = useState(true)

    const fetchBoard = async () => {
        try {
            const res = await fetch(`/api/boards/${id}`)
            if (!res.ok) throw new Error('خطا')
            const data = await res.json()
            setBoard(data)
            setPins(data.pins || [])
        } catch (error) {
            console.error(error)
        } finally {
            setLoading(false)
        }
    }

    useEffect(() => {
        if (id) fetchBoard()
    }, [id])

    // حذف پین (مالک پین)
    const handleDeletePin = (pinId: string) => {
        setPins((prev) => prev.filter((p) => p.id !== pinId))
    }

    // حذف ذخیره از این برد
    const handleRemovePinFromBoard = (pinId: string) => {
        setPins((prev) => prev.filter((p) => p.id !== pinId))
    }

    if (loading) {
        return (
            <main className="flex justify-center py-20">
                <div className="w-10 h-10 border-4 border-gray-200 border-t-red-500 rounded-full animate-spin" />
            </main>
        )
    }

    if (!board) {
        return (
            <main className="text-center py-20 text-gray-500">
                برد یافت نشد.
                <button
                    onClick={() => router.back()}
                    className="mt-4 inline-flex items-center gap-2 text-sm font-medium text-red-600 hover:text-red-700 transition-colors"
                >
                    <FiArrowRight className="w-4 h-4" />
                    بازگشت
                </button>
            </main>
        )
    }

    return (
        <main className="mx-auto px-4 py-8">
            <div className="flex items-center justify-between mb-8 gap-4">
                <div className="flex items-center gap-2">
                    <button
                        onClick={() => router.back()}
                        className="group relative inline-flex items-center justify-center w-10 h-8 rounded-xl bg-white/80 backdrop-blur-md shadow-lg shadow-gray-200/50 ring-1 ring-black/5 hover:ring-red-200 hover:shadow-red-100/50 transition-all duration-300 hover:scale-105 active:scale-95 cursor-pointer"
                    >
                        <FiArrowRight className="w-4 h-4 text-gray-600 group-hover:text-red-600 transition-colors" />
                    </button>
                    <div>
                        <h1 className="text-lg font-extrabold bg-gradient-to-r from-gray-900 to-gray-700 bg-clip-text text-transparent tracking-tight">
                            {board.name}
                        </h1>
                    </div>
                </div>
                <span className="flex items-center gap-1.5 px-4 py-2 rounded-full bg-white/80 backdrop-blur-md shadow-sm ring-1 ring-black/5 md:text-sm text-xs font-semibold text-gray-600">
                    <FiGrid className="w-4 h-4 text-red-500" />
                    {pins.length} پین
                </span>
            </div>

            {pins.length > 0 ? (
                <div className="columns-2 md:columns-3 lg:columns-4 xl:columns-5 gap-4 space-y-4 px-4">
                    {pins.map((pin: any) => (
                        <PinCard
                            key={pin.id}
                            pin={pin}
                            onDeletePin={handleDeletePin}
                            optionsRotationDefault={-125} 
                            onRemoveFromBoard={handleRemovePinFromBoard}
                        />
                    ))}
                </div>
            ) : (
                <div className="text-center py-20">
                    <p className="text-gray-500">این برد خالی است.</p>
                </div>
            )}
        </main>
    )
}