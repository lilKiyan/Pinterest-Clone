"use client"

import { useState } from 'react'
import dynamic from 'next/dynamic'
import { useQuery, useQueryClient } from '@tanstack/react-query'
import PinCard from '../components/PinCard'
import BoardCard from '../components/BoardCard'
import { FiPlus, FiGrid, FiBookmark, FiFolder, FiImage } from 'react-icons/fi'
import type { PinDTO } from '../types/pin'
import type { Board as BoardDTO } from '../types/board'
import Spinner from '@/app/components/Spinner'

const CreateEditBoardModal = dynamic(() => import('../components/CreateEditBoardModal'), { ssr: false })
const DeleteBoardModal = dynamic(() => import('../components/DeleteBoardModal'), { ssr: false })

type Tab = 'my-pins' | 'saved-pins' | 'boards'

export default function MyBoardsPage() {
    const [activeTab, setActiveTab] = useState<Tab>('my-pins')
    const [isBoardModalOpen, setIsBoardModalOpen] = useState(false)
    const [editingBoard, setEditingBoard] = useState<BoardDTO | null>(null)
    const [boardToDelete, setBoardToDelete] = useState<BoardDTO | null>(null)

    const queryClient = useQueryClient()

    const { data: myPins = [], isLoading: loadingMyPins } = useQuery<PinDTO[]>({
        queryKey: ['my-pins'],
        queryFn: async () => {
            const res = await fetch('/api/pins/mine')
            if (!res.ok) throw new Error('خطا در دریافت پین‌های من')
            const data = await res.json()
            return data
        },
        staleTime: 60 * 1000,
    })

    const { data: savedPins = [], isLoading: loadingSavedPins } = useQuery<PinDTO[]>({
        queryKey: ['saved-pins'],
        queryFn: async () => {
            const res = await fetch('/api/saves')
            if (!res.ok) throw new Error('خطا در دریافت پین‌های ذخیره‌شده')
            const data = await res.json()
            return data
        },
        staleTime: 60 * 1000,
    })

    const {
        data: boards = [],
        isLoading: loadingBoards,
    } = useQuery<BoardDTO[]>({
        queryKey: ['boards'],
        queryFn: async () => {
            const res = await fetch('/api/boards')
            if (!res.ok) throw new Error('خطا در دریافت بردها')
            return res.json()
        },
        staleTime: 60 * 1000,
    })


    // فقط UI مودال رو باز می‌کنیم، منطق ذخیره توی خود مودال انجام می‌شه
    const openCreateBoardModal = () => {
        setEditingBoard(null)
        setIsBoardModalOpen(true)
    }

    const openEditBoardModal = (board: BoardDTO) => {
        setEditingBoard(board)
        setIsBoardModalOpen(true)
    }

    const closeBoardModal = () => {
        setIsBoardModalOpen(false)
        setEditingBoard(null)
    }

    const handleBoardSaved = () => {
        queryClient.invalidateQueries({ queryKey: ['boards'] })
    }

    // ── callback بعد از حذف برد ──
    const handleBoardDeleted = (boardId: string) => {
        // آپدیت فوری cache (Optimistic)
        queryClient.setQueryData<BoardDTO[]>(['boards'], (old) => {
            if (!old) return old
            return old.filter((b) => b.id !== boardId)
        })
        // invalidate برای همگام‌سازی با سرور (دفعه بعد که کاربر برگرده)
        queryClient.invalidateQueries({ queryKey: ['boards'] })
    }

    // ── callback بعد از حذف پین (برای آپدیت فوری UI) ──
    const handlePinDeleted = (pinId: string) => {
        // ۱. آپدیت فوری کش "پین‌های من" (Optimistic)
        queryClient.setQueryData<PinDTO[]>(['my-pins'], (old) => {
            if (!old) return old
            return old.filter((p) => p.id !== pinId)   
        })

        // ۲. آپدیت فوری کش "پین‌های ذخیره‌شده" (چون ممکنه کاربر از اونجا هم حذف کرده باشه)
        queryClient.setQueryData<PinDTO[]>(['saved-pins'], (old) => {
            if (!old) return old
            return old.filter((p) => p.id !== pinId)
        })

        // ۳. invalidate برای همگام‌سازی با سرور (دفعه بعد که کاربر برگرده)
        queryClient.invalidateQueries({ queryKey: ['my-pins'] })
        queryClient.invalidateQueries({ queryKey: ['saved-pins'] })
    }

    const renderPins = (pins: PinDTO[], loading: boolean, emptyMessage: string) => (
        <div>
            {loading ? (
                <div className="flex justify-center py-24">
                    <Spinner size="md" className='mt-15'/>
                </div>
            ) : pins.length === 0 ? (
                <div className="flex flex-col items-center justify-center py-24 text-center">
                    <div className="w-16 h-16 rounded-2xl bg-gray-50 ring-1 ring-black/5 flex items-center justify-center mb-4">
                        <FiImage className="w-6 h-6 text-gray-300" />
                    </div>
                    <p className="text-gray-500 text-sm">{emptyMessage}</p>
                </div>
            ) : (
                <div className="columns-2 md:columns-3 lg:columns-4 xl:columns-5 gap-4 space-y-4">
                    {pins.map((pin) => (
                        <PinCard
                            key={pin.id}
                            pin={pin}
                            optionsRotationDefault={-100}
                            onDeletePin={handlePinDeleted}       // ✅ برای وقتی که کل پین حذف میشه
                            onRemoveFromBoard={handlePinDeleted} // ✅ برای وقتی که پین از برد خارج میشه (توی تب ذخیره‌شده‌ها)
                        />
                    ))}
                </div>
            )}
        </div>
    )

    const renderBoards = () => (
        <div>
            <div className="flex justify-end mb-6">
                <button
                    onClick={openCreateBoardModal}
                    className="flex items-center gap-2 bg-red-600 hover:bg-red-700 text-white px-5 py-2.5 rounded-full font-bold text-xs md:text-sm shadow-lg shadow-red-100 hover:shadow-red-200 active:scale-95 transition-all cursor-pointer"
                >
                    <FiPlus className="text-lg" />
                    ساخت برد
                </button>
            </div>

            {loadingBoards ? (
                <div className="flex justify-center py-24">
                    <div className="w-9 h-9 border-[3px] border-gray-200 border-t-red-500 rounded-full animate-spin" />
                </div>
            ) : boards.length === 0 ? (
                <div className="flex flex-col items-center justify-center py-24 text-center">
                    <div className="w-16 h-16 rounded-2xl bg-gray-50 ring-1 ring-black/5 flex items-center justify-center mb-4">
                        <FiFolder className="w-6 h-6 text-gray-300" />
                    </div>
                    <p className="text-gray-500 text-sm">هنوز بردی نساختی.</p>
                </div>
            ) : (
                <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 gap-6">
                    {boards.map((board) => (
                        <BoardCard
                            key={board.id}
                            board={board}
                            onEdit={() => openEditBoardModal(board)}
                            onDelete={() => setBoardToDelete(board)}
                        />
                    ))}
                </div>
            )}
        </div>
    )

    const tabTitles: Record<Tab, string> = {
        'my-pins': 'پین‌های من',
        'saved-pins': 'پین‌های ذخیره‌شده',
        'boards': 'بردهای من',
    }

    return (
        <main className="min-h-screen bg-gradient-to-b mb-12 from-gray-50 to-white px-7 py-8 md:py-10">
            <div className="mx-auto">
                <h1 key={activeTab}
                    className="text-2xl md:text-3xl font-extrabold text-gray-900 tracking-tight mb-8 animate-[fadeIn_0.3s_ease-out]">
                    {tabTitles[activeTab]}
                </h1>

                {/* تب‌ها */}
                <div className="inline-flex items-center gap-3 bg-gray-100 rounded-full p-1 mb-8">
                    <button
                        onClick={() => setActiveTab('my-pins')}
                        className={`flex items-center gap-2 px-4 sm:px-5 py-2 font-semibold text-sm rounded-full transition-all cursor-pointer ${activeTab === 'my-pins'
                            ? 'bg-white text-gray-900 shadow-sm'
                            : 'text-gray-500 hover:text-gray-800'
                            }`}
                    >
                        <FiGrid className="w-4 h-4" />
                        <span className="hidden sm:inline">پین‌های من</span>
                    </button>
                    <button
                        onClick={() => setActiveTab('saved-pins')}
                        className={`flex items-center gap-2 px-4 sm:px-5 py-2 font-semibold text-sm rounded-full transition-all cursor-pointer ${activeTab === 'saved-pins'
                            ? 'bg-white text-gray-900 shadow-sm'
                            : 'text-gray-500 hover:text-gray-800'
                            }`}
                    >
                        <FiBookmark className="w-4 h-4" />
                        <span className="hidden sm:inline">پین‌های ذخیره‌شده</span>
                    </button>
                    <button
                        onClick={() => setActiveTab('boards')}
                        className={`flex items-center gap-2 px-4 sm:px-5 py-2 font-semibold text-sm rounded-full transition-all cursor-pointer ${activeTab === 'boards'
                            ? 'bg-white text-gray-900 shadow-sm'
                            : 'text-gray-500 hover:text-gray-800'
                            }`}
                    >
                        <FiFolder className="w-4 h-4" />
                        <span className="hidden sm:inline">بردهای من</span>
                    </button>
                </div>

                {/* محتوا */}
                {activeTab === 'my-pins' && renderPins(myPins, loadingMyPins, 'هنوز پینی نساختی.')}
                {activeTab === 'saved-pins' && renderPins(savedPins, loadingSavedPins, 'هنوز پینی ذخیره نکردی.')}
                {activeTab === 'boards' && renderBoards()}

                {/* مودال ساخت/ویرایش برد */}
                {isBoardModalOpen && (
                    <CreateEditBoardModal
                        editingBoard={editingBoard}
                        onClose={closeBoardModal}
                        onSave={handleBoardSaved}
                    />
                )}

                {/* مودال حذف برد */}
                {boardToDelete && (
                    <DeleteBoardModal
                        board={boardToDelete}
                        onClose={() => setBoardToDelete(null)}
                        onDeleted={handleBoardDeleted}
                    />
                )}
            </div>
        </main>
    )
}