"use client"

import { useEffect, useState } from 'react'
import PinCard from '../components/PinCard'
import BoardCard from '../components/BoardCard'
import { FiPlus, FiX, FiTrash2, FiGrid, FiBookmark, FiFolder, FiImage, FiLock } from 'react-icons/fi'

type Tab = 'my-pins' | 'saved-pins' | 'boards'

export default function MyBoardsPage() {
    const [activeTab, setActiveTab] = useState<Tab>('my-pins')
    const [myPins, setMyPins] = useState<any[]>([])
    const [savedPins, setSavedPins] = useState<any[]>([])
    const [boards, setBoards] = useState<any[]>([])

    const [loadingMyPins, setLoadingMyPins] = useState(true)
    const [loadingSavedPins, setLoadingSavedPins] = useState(true)
    const [loadingBoards, setLoadingBoards] = useState(true)

    // state برای مودال ساخت/ویرایش برد
    const [isBoardModalOpen, setIsBoardModalOpen] = useState(false)
    const [editingBoard, setEditingBoard] = useState<any>(null)
    const [boardName, setBoardName] = useState('')
    const [boardIsPrivate, setBoardIsPrivate] = useState(false)
    const [boardSaving, setBoardSaving] = useState(false)

    // state برای مودال حذف برد
    const [boardToDelete, setBoardToDelete] = useState<any>(null)
    const [isDeletingBoard, setIsDeletingBoard] = useState(false)

    const fetchMyPins = async () => {
        setLoadingMyPins(true)
        try {
            const res = await fetch('/api/pins/mine')
            if (!res.ok) throw new Error('خطا در دریافت پین‌های من')
            const data = await res.json()
            setMyPins(data)
        } catch (error) {
            console.error(error)
        } finally {
            setLoadingMyPins(false)
        }
    }

    const fetchSavedPins = async () => {
        setLoadingSavedPins(true)
        try {
            const res = await fetch('/api/saves')
            if (!res.ok) throw new Error('خطا در دریافت پین‌های ذخیره‌شده')
            const data = await res.json()
            setSavedPins(data)
        } catch (error) {
            console.error(error)
        } finally {
            setLoadingSavedPins(false)
        }
    }

    const fetchBoards = async () => {
        setLoadingBoards(true)
        try {
            const res = await fetch('/api/boards')
            if (!res.ok) throw new Error('خطا در دریافت بردها')
            const data = await res.json()
            setBoards(data)
        } catch (error) {
            console.error(error)
        } finally {
            setLoadingBoards(false)
        }
    }

    useEffect(() => {
        fetchMyPins()
        fetchSavedPins()
        fetchBoards()
    }, [])

    const openCreateBoardModal = () => {
        setEditingBoard(null)
        setBoardName('')
        setBoardIsPrivate(false)
        setIsBoardModalOpen(true)
    }

    const openEditBoardModal = (board: any) => {
        setEditingBoard(board)
        setBoardName(board.name)
        setBoardIsPrivate(board.isPrivate || false)
        setIsBoardModalOpen(true)
    }

    const closeBoardModal = () => {
        setIsBoardModalOpen(false)
        setBoardName('')
        setBoardIsPrivate(false)
        setEditingBoard(null)
    }

    const handleSaveBoard = async () => {
        if (!boardName.trim()) return
        setBoardSaving(true)
        try {
            if (editingBoard) {
                const res = await fetch(`/api/boards/${editingBoard.id}`, {
                    method: 'PATCH',
                    headers: { 'Content-Type': 'application/json' },
                    body: JSON.stringify({ name: boardName, isPrivate: boardIsPrivate }),
                })
                if (!res.ok) throw new Error('خطا در ویرایش برد')
            } else {
                const res = await fetch('/api/boards', {
                    method: 'POST',
                    headers: { 'Content-Type': 'application/json' },
                    body: JSON.stringify({ name: boardName, isPrivate: boardIsPrivate }),
                })
                if (!res.ok) throw new Error('خطا در ساخت برد')
            }
            closeBoardModal()
            fetchBoards()
        } catch (error) {
            console.error(error)
        } finally {
            setBoardSaving(false)
        }
    }

    const openDeleteBoardModal = (board: any) => {
        setBoardToDelete(board)
    }

    const closeDeleteBoardModal = () => {
        setBoardToDelete(null)
    }

    const handleDeleteBoard = async () => {
        if (!boardToDelete) return
        setIsDeletingBoard(true)
        try {
            const res = await fetch(`/api/boards/${boardToDelete.id}`, { method: 'DELETE' })
            if (!res.ok) throw new Error('خطا در حذف برد')
            setBoards((prev) => prev.filter((b) => b.id !== boardToDelete.id))
            closeDeleteBoardModal()
        } catch (error) {
            console.error(error)
        } finally {
            setIsDeletingBoard(false)
        }
    }

    const renderPins = (pins: any[], loading: boolean, emptyMessage: string) => (
        <div>
            {loading ? (
                <div className="flex justify-center py-24">
                    <div className="w-9 h-9 border-[3px] border-gray-200 border-t-red-500 rounded-full animate-spin" />
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
                        <PinCard key={pin.id} pin={pin} />
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
                    className="flex items-center gap-2 bg-red-600 hover:bg-red-700 text-white px-5 py-2.5 rounded-full font-bold text-sm shadow-lg shadow-red-100 hover:shadow-red-200 active:scale-95 transition-all cursor-pointer"
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
                            onDelete={() => openDeleteBoardModal(board)}
                        />
                    ))}
                </div>
            )}
        </div>
    )

    return (
        <main className="min-h-screen bg-gradient-to-b from-gray-50 to-white px-4 md:px-5 py-8 md:py-10">
            <div className="mx-auto">
                <h1 className="text-2xl md:text-3xl font-extrabold text-gray-900 tracking-tight mb-8">
                    ذخیره شده ها !
                </h1>

                {/* تب‌ها */}
                <div className="inline-flex items-center gap-1 bg-gray-100 rounded-full p-1 mb-8">
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
                        <span className="hidden sm:inline">ذخیره شده‌ها</span>
                    </button>
                </div>

                {/* محتوا */}
                {activeTab === 'my-pins' && renderPins(myPins, loadingMyPins, 'هنوز پینی نساختی.')}
                {activeTab === 'saved-pins' && renderPins(savedPins, loadingSavedPins, 'هنوز پینی ذخیره نکردی.')}
                {activeTab === 'boards' && renderBoards()}

                {/* مودال ساخت/ویرایش برد */}
                {isBoardModalOpen && (
                    <div className="fixed mb-0 inset-0 z-[100] bg-black/50 backdrop-blur-[2px] flex items-center justify-center p-4">
                        <div className="bg-white mb-0 rounded-3xl shadow-2xl p-6 w-full max-w-md">
                            <div className="flex items-center justify-between mb-5">
                                <h2 className="text-lg font-bold text-gray-900">
                                    {editingBoard ? 'ویرایش برد' : 'ساخت برد جدید'}
                                </h2>
                                <button
                                    onClick={closeBoardModal}
                                    aria-label="بستن"
                                    className="w-8 h-8 rounded-full flex items-center justify-center text-gray-400 hover:bg-gray-100 hover:text-gray-700 transition-colors cursor-pointer"
                                >
                                    <FiX className="w-4 h-4" />
                                </button>
                            </div>

                            <label className="block text-xs font-semibold text-gray-500 mb-1.5">نام برد</label>
                            <input
                                type="text"
                                value={boardName}
                                onChange={(e) => setBoardName(e.target.value)}
                                placeholder="مثلاً ایده‌های سفر"
                                className="w-full border-2 border-gray-200 rounded-xl px-4 py-3 mb-4 text-gray-900 placeholder-gray-400 focus:outline-none focus:border-red-400 focus:ring-4 focus:ring-red-100 transition-all"
                                autoFocus
                            />

                            <label className="flex items-center gap-2.5 mb-6 px-3.5 py-3 rounded-xl bg-gray-50 cursor-pointer hover:bg-gray-100 transition-colors">
                                <input
                                    type="checkbox"
                                    checked={boardIsPrivate}
                                    onChange={(e) => setBoardIsPrivate(e.target.checked)}
                                    className="w-4 h-4 accent-red-600"
                                />
                                <FiLock className="w-3.5 h-3.5 text-gray-400" />
                                <span className="text-sm text-gray-700 font-medium">برد خصوصی</span>
                            </label>

                            <div className="flex gap-2.5">
                                <button
                                    onClick={closeBoardModal}
                                    className="flex-1 h-11 bg-gray-100 hover:bg-gray-200 text-gray-700 rounded-xl font-semibold text-sm transition-colors cursor-pointer"
                                >
                                    انصراف
                                </button>
                                <button
                                    onClick={handleSaveBoard}
                                    disabled={boardSaving}
                                    className="flex-1 h-11 bg-red-600 hover:bg-red-700 text-white rounded-xl font-semibold text-sm transition-colors disabled:opacity-50 disabled:cursor-not-allowed cursor-pointer"
                                >
                                    {boardSaving ? 'در حال ذخیره...' : 'ذخیره'}
                                </button>
                            </div>
                        </div>
                    </div>
                )}

                {/* مودال تأیید حذف برد */}
                {boardToDelete && (
                    <div className="fixed inset-0 z-[100] mb-0 bg-black/50 backdrop-blur-[2px] flex items-center justify-center p-4">
                        <div className="bg-white mb-0 rounded-3xl shadow-2xl p-6 w-full max-w-sm text-center">
                            <div className="w-14 h-14 mx-auto mb-4 bg-red-50 rounded-2xl flex items-center justify-center">
                                <FiTrash2 className="text-red-600 text-xl" />
                            </div>
                            <h3 className="text-lg font-bold text-gray-900 mb-1.5">حذف برد</h3>
                            <p className="text-gray-500 text-sm leading-relaxed mb-6">
                                آیا مطمئنی می‌خوای برد «{boardToDelete.name}» رو حذف کنی؟ این عمل قابل بازگشت نیست.
                            </p>
                            <div className="flex gap-2.5">
                                <button
                                    onClick={closeDeleteBoardModal}
                                    className="flex-1 h-11 bg-gray-100 hover:bg-gray-200 text-gray-700 rounded-xl font-semibold text-sm transition-colors cursor-pointer"
                                >
                                    انصراف
                                </button>
                                <button
                                    onClick={handleDeleteBoard}
                                    disabled={isDeletingBoard}
                                    className="flex-1 h-11 bg-red-600 hover:bg-red-700 text-white rounded-xl font-semibold text-sm transition-colors disabled:opacity-50 disabled:cursor-not-allowed cursor-pointer"
                                >
                                    {isDeletingBoard ? 'در حال حذف...' : 'حذف'}
                                </button>
                            </div>
                        </div>
                    </div>
                )}
            </div>
        </main>
    )
}