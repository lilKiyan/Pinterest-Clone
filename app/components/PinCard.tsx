"use client"

import { useState, useEffect } from 'react'
import Link from 'next/link'
import { useRouter } from 'next/navigation'
import { FiUpload, FiTrash2, FiCheckCircle, FiFolder } from 'react-icons/fi'
import SaveToBoardDropdown, { Board } from './SaveToBoardDropdown'
import PinOptionsMenu from './PinOptionsMenu'

type PinCardProps = {
    pin: {
        id: string
        title: string
        description?: string
        imageUrl: string
        isOwner?: boolean
        savedBoards?: { boardId: string; boardName: string }[]
    }
    onDeletePin?: (pinId: string) => void
    onRemoveFromBoard?: (pinId: string) => void
}

const PinCard = ({ pin, onDeletePin, onRemoveFromBoard }: PinCardProps) => {
    const router = useRouter()
    const [boards, setBoards] = useState<Board[]>([])
    const [isLoadingBoards, setIsLoadingBoards] = useState(true)
    const [savedBoards, setSavedBoards] = useState<{ boardId: string; boardName: string }[]>(
        pin.savedBoards || []
    )

    const [isEditModalOpen, setIsEditModalOpen] = useState(false)
    const [isDeleteModalOpen, setIsDeleteModalOpen] = useState(false)
    const [showDeletedToast, setShowDeletedToast] = useState(false)
    const [isDeleting, setIsDeleting] = useState(false)

    // وضعیت باز بودن منوی ذخیره (برای اینکه لایه hover موقع باز بودن منو محو نشه)
    const [isSaveMenuOpen, setIsSaveMenuOpen] = useState(false)

    const [editTitle, setEditTitle] = useState(pin.title)
    const [editDescription, setEditDescription] = useState(pin.description || '')

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

    // ذخیره یا حذف پین از برد
    const handleToggleSave = async (board: Board) => {
        const isCurrentlySaved = savedBoards.some((sb) => sb.boardId === board.id)

        try {
            if (isCurrentlySaved) {
                // حذف ذخیره
                const res = await fetch('/api/saves', {
                    method: 'DELETE',
                    headers: { 'Content-Type': 'application/json' },
                    body: JSON.stringify({ pinId: pin.id, boardId: board.id }),
                })
                if (!res.ok) {
                    const data = await res.json()
                    throw new Error(data.error || 'خطا در حذف ذخیره')
                }
                setSavedBoards((prev) => prev.filter((sb) => sb.boardId !== board.id))
                // اگر در صفحه برد هستیم، والد را مطلع کن
                if (onRemoveFromBoard) {
                    onRemoveFromBoard(pin.id)
                }
            } else {
                // ذخیره جدید
                const res = await fetch('/api/saves', {
                    method: 'POST',
                    headers: { 'Content-Type': 'application/json' },
                    body: JSON.stringify({ pinId: pin.id, boardId: board.id }),
                })
                if (!res.ok) {
                    const data = await res.json()
                    throw new Error(data.error || 'خطا در ذخیره پین')
                }
                setSavedBoards((prev) => [...prev, { boardId: board.id, boardName: board.name }])
            }
        } catch (error) {
            console.error('❌ خطا:', error)
        }
    }

    // ویرایش پین
    const handleEdit = async () => {
        try {
            const res = await fetch(`/api/pins/${pin.id}`, {
                method: 'PATCH',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ title: editTitle, description: editDescription }),
            })
            if (!res.ok) throw new Error('خطا در ویرایش پین')
            setIsEditModalOpen(false)
            router.refresh()
        } catch (error) {
            console.error(error)
        }
    }

    // حذف پین
    const handleDelete = async () => {
        setIsDeleting(true)
        try {
            const res = await fetch(`/api/pins/${pin.id}`, { method: 'DELETE' })
            if (!res.ok) throw new Error('خطا در حذف پین')
            setIsDeleteModalOpen(false)
            setShowDeletedToast(true)

            // اعلام به والد برای حذف از state
            if (onDeletePin) {
                onDeletePin(pin.id)
            }
        } catch (error) {
            console.error(error)
            setIsDeleting(false)
            setIsDeleteModalOpen(false)
        }
    }

    return (
        <>
            <div className="group relative break-inside-avoid mb-4">
                {/* ── تصویر لینک‌دار به صفحه جزئیات ──
                    overflow-hidden فقط روی همین کانتینر است،
                    بنابراین دراپ‌داون (که بیرون این است) clip نمی‌شود */}
                <Link href={`/pin/${pin.id}`} className="block no-underline">
                    <div className="relative rounded-[15px] overflow-hidden bg-gray-100 ring-1 ring-black/5 group-hover:ring-black/10 transition-all">
                        <img
                            src={pin.imageUrl}
                            alt={pin.title}
                            className="w-full h-auto object-cover group-hover:brightness-75 transition-all duration-300"
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
                        <span className="truncate">
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
                        isOwner={pin.isOwner ?? false}
                    />
                </div>
            </div>

            {/* مودال ویرایش پین */}
            {isEditModalOpen && (
                <div className="fixed inset-0 z-[100] bg-black/50 backdrop-blur-[2px] flex items-center justify-center p-4">
                    <div className="bg-white rounded-3xl shadow-2xl p-6 w-full max-w-md">
                        <h2 className="text-lg font-bold text-gray-900 mb-5">ویرایش پین</h2>

                        <label className="block text-xs font-semibold text-gray-500 mb-1.5">عنوان</label>
                        <input
                            type="text"
                            value={editTitle}
                            onChange={(e) => setEditTitle(e.target.value)}
                            className="w-full border-2 border-gray-200 rounded-xl px-4 py-3 mb-4 text-gray-900 placeholder-gray-400 focus:outline-none focus:border-red-400 focus:ring-4 focus:ring-red-100 transition-all"
                            placeholder="عنوان"
                        />

                        <label className="block text-xs font-semibold text-gray-500 mb-1.5">توضیحات</label>
                        <textarea
                            value={editDescription}
                            onChange={(e) => setEditDescription(e.target.value)}
                            rows={4}
                            className="w-full border-2 border-gray-200 rounded-xl px-4 py-3 mb-6 text-gray-900 placeholder-gray-400 focus:outline-none focus:border-red-400 focus:ring-4 focus:ring-red-100 transition-all resize-none"
                            placeholder="توضیحات"
                        />

                        <div className="flex gap-2.5">
                            <button
                                onClick={handleEdit}
                                className="flex-1 h-11 bg-red-600 hover:bg-red-700 text-white rounded-xl font-semibold text-sm transition-colors cursor-pointer"
                            >
                                ذخیره
                            </button>
                            <button
                                onClick={() => setIsEditModalOpen(false)}
                                className="flex-1 h-11 bg-gray-100 hover:bg-gray-200 text-gray-700 rounded-xl font-semibold text-sm transition-colors cursor-pointer"
                            >
                                انصراف
                            </button>
                        </div>
                    </div>
                </div>
            )}

            {/* مودال تأیید حذف پین */}
            {isDeleteModalOpen && (
                <div className="fixed inset-0 z-[100] bg-black/50 backdrop-blur-[2px] flex items-center justify-center p-4">
                    <div className="bg-white rounded-3xl shadow-2xl p-6 w-full max-w-sm text-center">
                        <div className="w-14 h-14 mx-auto mb-4 bg-red-50 rounded-2xl flex items-center justify-center">
                            <FiTrash2 className="text-red-600 text-xl" />
                        </div>
                        <h3 className="text-lg font-bold text-gray-900 mb-1.5">حذف پین</h3>
                        <p className="text-gray-500 text-sm leading-relaxed mb-6">آیا مطمئن هستید که می‌خواهید این پین را حذف کنید؟</p>
                        <div className="flex gap-2.5">
                            <button
                                onClick={handleDelete}
                                disabled={isDeleting}
                                className="flex-1 h-11 bg-red-600 hover:bg-red-700 text-white rounded-xl font-semibold text-sm transition-colors disabled:opacity-50 disabled:cursor-not-allowed cursor-pointer"
                            >
                                {isDeleting ? 'در حال حذف...' : 'حذف'}
                            </button>
                            <button
                                onClick={() => setIsDeleteModalOpen(false)}
                                className="flex-1 h-11 bg-gray-100 hover:bg-gray-200 text-gray-700 rounded-xl font-semibold text-sm transition-colors cursor-pointer"
                            >
                                انصراف
                            </button>
                        </div>
                    </div>
                </div>
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