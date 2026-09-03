"use client"

import { useEffect, useState } from 'react'
import { useParams } from 'next/navigation'
import PinCard from '../../components/PinCard'

export default function BoardPage() {
    const { id } = useParams<{ id: string }>()

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
        return <main className="text-center py-20 text-gray-500">برد یافت نشد.</main>
    }

    return (
        <main className="mx-auto px-4 py-8">
            <h1 className="text-3xl font-bold text-gray-900 mb-2">{board.name}</h1>
            <p className="text-gray-500 mb-8">{pins.length} پین</p>

            {pins.length > 0 ? (
                <div className="columns-2 md:columns-3 lg:columns-4 xl:columns-5 gap-4 space-y-4">
                    {pins.map((pin: any) => (
                        <PinCard
                            key={pin.id}
                            pin={pin}
                            onDeletePin={handleDeletePin}
                            onRemoveFromBoard={handleRemovePinFromBoard}
                        />
                    ))}
                </div>
            ) : (
                <p className="text-center text-gray-500 py-20">این برد خالی است.</p>
            )}
        </main>
    )
}