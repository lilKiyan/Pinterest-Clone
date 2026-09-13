"use client"

import Link from 'next/link'
import Image from 'next/image'
import dynamic from 'next/dynamic'
import { useState, useEffect } from 'react'
import { useMutation, useQueryClient } from '@tanstack/react-query'
import { FiUpload, FiCheckCircle, FiFolder } from 'react-icons/fi'
import type { Board } from './SaveToBoardDropdown'

const SaveToBoardDropdown = dynamic(() => import('./SaveToBoardDropdown'), {
    ssr: false,
    loading: () => (
        <div className="absolute top-3 left-3 right-3">
            <div className="w-32 h-9 bg-gray-200/60 backdrop-blur-sm rounded-xl animate-pulse" />
        </div>
    ),
})

const PinOptionsMenu = dynamic(() => import('./PinOptionsMenu'), {
    ssr: false,
    loading: () => (
        <button
            disabled
            aria-label="گزینه‌های پین"
            className="w-8 h-8 rounded-full bg-gray-100 animate-pulse"
        />
    )
})

const DeletePinModal = dynamic(() => import('./DeletePinModal'), { ssr: false })
const EditPinModal = dynamic(() => import('./EditPinModal'), { ssr: false })

type PinCardProps = {
    pin: {
        id: string
        title: string
        description?: string
        imageUrl: string
        isOwner?: boolean
        imageWidth?: number | null   // ✅ اضافه شد
        imageHeight?: number | null
        savedBoards?: { boardId: string; boardName: string }[]
    }
    onDeletePin?: (pinId: string) => void
    onRemoveFromBoard?: (pinId: string) => void
    optionsRotationDefault?: number
    menuExcluded?: string[]
    priority?: boolean
}



type SaveMutationVariables = {
    pinId: string
    boardId: string
    action: 'save' | 'unsave'
    boardName?: string   // ✅ اضافه شد
}

const PinCard = ({ pin, onDeletePin, onRemoveFromBoard, optionsRotationDefault = -90, menuExcluded, priority = false }: PinCardProps) => {
    const [boards, setBoards] = useState<Board[]>([])
    const [isLoadingBoards, setIsLoadingBoards] = useState(true)
    const [savedBoards, setSavedBoards] = useState<{ boardId: string; boardName: string }[]>(
        pin.savedBoards || []
    )
    const queryClient = useQueryClient()

    const saveMutation = useMutation({
        mutationFn: async ({ pinId, boardId, action }: SaveMutationVariables) => {
            const res = await fetch('/api/saves', {
                method: action === 'save' ? 'POST' : 'DELETE',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ pinId, boardId }),
            })
            if (!res.ok) {
                const data = await res.json()
                throw new Error(data.error || 'خطا در عملیات')
            }
            return res.json()
        },
        onSuccess: (_, variables: SaveMutationVariables) => {
            if (variables.action === 'save') {
                setSavedBoards((prev) => [
                    ...prev,
                    { boardId: variables.boardId, boardName: variables.boardName || '' },
                ])
            } else {
                setSavedBoards((prev) => prev.filter((sb) => sb.boardId !== variables.boardId))
                if (onRemoveFromBoard) {
                    onRemoveFromBoard(variables.pinId)
                }
            }
            queryClient.invalidateQueries({ queryKey: ['pins'] })
            queryClient.invalidateQueries({ queryKey: ['saved-pins'] })
            queryClient.invalidateQueries({ queryKey: ['boards'] })
        },
    })

    const [isEditModalOpen, setIsEditModalOpen] = useState(false)
    const [isDeleteModalOpen, setIsDeleteModalOpen] = useState(false)
    const [showDeletedToast, setShowDeletedToast] = useState(false)

    // وضعیت باز بودن منوی ذخیره (برای اینکه لایه hover موقع باز بودن منو محو نشه)
    const [isSaveMenuOpen, setIsSaveMenuOpen] = useState(false)


    // بارگذاری بردهای کاربر
    useEffect(() => {
        const fetchBoards = async () => {
            try {
                const res = await fetch('/api/boards')
                if (!res.ok) throw new Error('خطا در دریافت بردها')
                const data = await res.json()
                const mappedBoards = data.map((b: any) => ({
                    id: b.id,
                    name: b.name,
                    thumbnail: b.pins?.[0]?.imageUrl || '/placeholder.jpg',
                    isTopChoice: false,
                }))
                setBoards(mappedBoards)
            } catch (error) {
                console.error(error)
            } finally {
                setIsLoadingBoards(false)
            }
        }
        fetchBoards()
    }, [])

    // ساخت برد جدید از داخل دراپ‌داون
    const handleCreateBoard = async (name: string) => {
        try {
            const res = await fetch('/api/boards', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ name }),
            })
            if (!res.ok) throw new Error('خطا در ساخت برد')
            const newBoard = await res.json()
            setBoards((prev) => [
                { id: newBoard.id, name: newBoard.name, thumbnail: '/placeholder.jpg', isTopChoice: false },
                ...prev,
            ])
        } catch (error) {
            console.error(error)
        }
    }

    const handleDownload = () => {
        const link = document.createElement('a')
        link.href = pin.imageUrl
        link.download = pin.title || 'pin' // نام فایل دانلودی
        document.body.appendChild(link)
        link.click()
        document.body.removeChild(link)
    }

    // ذخیره یا حذف پین از برد
    const handleToggleSave = (board: Board) => {
        const isCurrentlySaved = savedBoards.some((sb) => sb.boardId === board.id)
        const action = isCurrentlySaved ? 'unsave' : 'save'

        // صدا زدن mutation
        saveMutation.mutate({
            pinId: pin.id,
            boardId: board.id,
            action,
            boardName: board.name, // فقط برای save لازم است
        })
    }

    return (
        <>
            <div className="group relative break-inside-avoid mb-4">
                {/* ── تصویر لینک‌دار به صفحه جزئیات ──
                    overflow-hidden فقط روی همین کانتینر است،
                    بنابراین دراپ‌داون (که بیرون این است) clip نمی‌شود */}
                <Link href={`/pin/${pin.id}`} className="block no-underline">
                    <div
                        className="relative overflow-hidden rounded-[15px] bg-gray-100 ring-1 ring-black/5 group-hover:ring-black/10 transition-all"
                        style={{ aspectRatio: `${pin.imageWidth || 500} / ${pin.imageHeight || 750}` }}
                    >
                        <Image
                            src={pin.imageUrl}
                            alt={pin.title}
                            fill
                            sizes="(max-width: 640px) 50vw, (max-width: 1024px) 33vw, (max-width: 1280px) 25vw, 20vw"
                            className="object-cover group-hover:brightness-75 transition-all duration-300"
                            priority={priority}
                        />
                    </div>
                </Link>

                {/* ── لایه hover: برادرِ Link (نه فرزندش) ──
                    pointer-events-none روی خود لایه: کلیک روی جای خالی به
                    لینکِ زیرش پاس می‌دهد و به صفحه جزئیات می‌رود */}
                <div
                    className={`absolute inset-0 z-20 transition-opacity duration-200 pointer-events-none ${isSaveMenuOpen
                        ? 'opacity-100'
                        : 'opacity-0 group-hover:opacity-100'
                        }`}
                >
                    <SaveToBoardDropdown
                        boards={boards}
                        savedBoards={savedBoards}
                        onToggleSave={handleToggleSave}
                        onCreateBoard={handleCreateBoard}
                        isLoadingBoards={isLoadingBoards}
                        onOpenChange={setIsSaveMenuOpen}
                    />
                    <button
                        aria-label="اشتراک‌گذاری پین"
                        onClick={() => {
                            const url = window.location.href
                            if (navigator.share) {
                                navigator.share({ title: pin.title, url }).catch(() => { })
                            } else {
                                navigator.clipboard?.writeText(url)
                            }
                        }}
                        className="pointer-events-auto absolute bottom-12 right-3 w-10 h-10 bg-white/90 rounded-2xl cursor-pointer flex items-center justify-center text-lg shadow-lg hover:bg-white hover:scale-105 active:scale-95 transition-all duration-200"
                    >
                        <FiUpload />
                    </button>
                </div>

                {/* زیر تصویر: وضعیت ذخیره و منوی سه‌نقطه */}
                <div className="mt-1.5 px-1 flex items-center justify-between gap-2">
                    <p className="flex items-center gap-1.5 text-xs text-gray-500 truncate min-w-0">
                        <FiFolder className="w-3 h-3 shrink-0 text-gray-400" />
                        <span className="truncate text-[10px] md:text-sm">
                            {savedBoards.length === 0
                                ? 'بدون برد'
                                : savedBoards.length === 1
                                    ? savedBoards[0].boardName
                                    : `${savedBoards.length} برد`}
                        </span>
                    </p>
                    <PinOptionsMenu
                        onEdit={() => setIsEditModalOpen(true)}
                        onDelete={() => setIsDeleteModalOpen(true)}
                        onDownload={handleDownload}
                        isOwner={pin.isOwner ?? false}
                        rotationDefault={optionsRotationDefault}
                        excludedOptions={menuExcluded}
                    />
                </div>
            </div>

            {/* مودال ویرایش پین (dynamic) */}
            {isEditModalOpen && (
                <EditPinModal
                    pinId={pin.id}
                    initialTitle={pin.title}
                    initialDescription={pin.description}
                    onClose={() => setIsEditModalOpen(false)}
                />
            )}

            {/* مودال حذف پین (dynamic) */}
            {isDeleteModalOpen && (
                <DeletePinModal
                    pinId={pin.id}
                    onClose={() => setIsDeleteModalOpen(false)}
                    onDeleteSuccess={(id) => {
                        setShowDeletedToast(true)
                        if (onDeletePin) onDeletePin(id)
                        setTimeout(() => setShowDeletedToast(false), 2000)
                    }}
                />
            )}

            {/* توست حذف موفق */}
            {showDeletedToast && (
                <div className="fixed bottom-6 left-1/2 -translate-x-1/2 z-[200] bg-white shadow-2xl border border-gray-100 rounded-2xl px-6 py-4 flex items-center gap-3 animate-[fadeInUp_0.3s_ease-out]">
                    <FiCheckCircle className="text-green-500 text-xl" />
                    <span className="text-gray-800 font-medium">پین با موفقیت حذف شد</span>
                </div>
            )}
        </>
    )
}

export default PinCard