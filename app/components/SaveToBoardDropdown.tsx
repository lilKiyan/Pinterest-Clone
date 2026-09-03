'use client'

import { useEffect, useRef, useState } from 'react'
import { FiSearch, FiPlus, FiChevronDown, FiCheck, FiBookmark } from 'react-icons/fi'
import Link from 'next/link'

export type Board = {
    id: string
    name: string
    thumbnail: string
    isTopChoice?: boolean
}

type SaveToBoardDropdownProps = {
    boards: Board[]
    savedBoards: { boardId: string; boardName: string }[]
    onToggleSave: (board: Board) => void
    onCreateBoard: (name: string) => void
    isLoadingBoards: boolean
    onOpenChange?: (open: boolean) => void
}

const DROPDOWN_ANIMATION_MS = 220

const SaveToBoardDropdown = ({
    boards,
    savedBoards,
    onToggleSave,
    onCreateBoard,
    isLoadingBoards,
    onOpenChange,
}: SaveToBoardDropdownProps) => {
    const [isOpen, setIsOpen] = useState(false)
    const [isOpenVisible, setIsOpenVisible] = useState(false)
    const [query, setQuery] = useState('')
    const [align, setAlign] = useState<'left' | 'right'>('left')

    const containerRef = useRef<HTMLDivElement>(null)
    const pillWrapperRef = useRef<HTMLDivElement>(null)

    const POPUP_WIDTH = 360
    const VIEWPORT_MARGIN = 16

    // بستن با کلیک بیرون
    useEffect(() => {
        const handleClickOutside = (e: MouseEvent) => {
            if (containerRef.current && !containerRef.current.contains(e.target as Node)) {
                closeDropdown()
            }
        }
        document.addEventListener('mousedown', handleClickOutside)
        return () => document.removeEventListener('mousedown', handleClickOutside)
    }, [])

    // بستن با کلید Escape
    useEffect(() => {
        const handleEscape = (e: KeyboardEvent) => {
            if (e.key === 'Escape') closeDropdown()
        }
        document.addEventListener('keydown', handleEscape)
        return () => document.removeEventListener('keydown', handleEscape)
    }, [])

    // جهت باز شدن منو
    useEffect(() => {
        if (!isOpen || !pillWrapperRef.current) return
        const rect = pillWrapperRef.current.getBoundingClientRect()
        const spaceOnRight = window.innerWidth - rect.left
        const spaceOnLeft = rect.right
        if (spaceOnRight < POPUP_WIDTH + VIEWPORT_MARGIN && spaceOnLeft > POPUP_WIDTH + VIEWPORT_MARGIN) {
            setAlign('right')
        } else {
            setAlign('left')
        }
    }, [isOpen])

    const openDropdown = () => {
        setIsOpen(true)
        onOpenChange?.(true)
        requestAnimationFrame(() => {
            requestAnimationFrame(() => setIsOpenVisible(true))
        })
    }

    const closeDropdown = () => {
        if (!isOpen) return
        setIsOpenVisible(false)
        onOpenChange?.(false)
        setTimeout(() => setIsOpen(false), DROPDOWN_ANIMATION_MS)
    }

    const toggleDropdown = () => {
        if (isOpen) closeDropdown()
        else openDropdown()
    }

    // فیلتر بردها
    const filteredTopChoices = boards.filter(
        (b) => b.isTopChoice && b.name.toLowerCase().includes(query.toLowerCase())
    )
    const filteredAllBoards = boards.filter(
        (b) => !b.isTopChoice && b.name.toLowerCase().includes(query.toLowerCase())
    )

    const handleToggle = (board: Board) => {
        onToggleSave(board)
        // منو باز می‌ماند
    }

    const handleCreateBoard = () => {
        if (!query.trim()) return
        onCreateBoard(query.trim())
        setQuery('')
        closeDropdown()
    }

    const savedBoardIds = new Set(savedBoards.map((sb) => sb.boardId))

    return (
        // ریشه pointer-events-none: کلیک‌هایی که روی عناصر تعاملی نیستند
        // به لینکِ تصویر زیرش پاس می‌شوند و به صفحه جزئیات می‌روند
        <div
            className="absolute top-3 left-3 right-3 flex items-center justify-between gap-2 pointer-events-none"
            ref={containerRef}
        >
            {/* دکمه باز کردن دراپ‌داون — فقط این بخش کلیک‌پذیر است */}
            <div className="relative pointer-events-auto" ref={pillWrapperRef}>
                <button
                    onClick={(e) => {
                        e.preventDefault()
                        e.stopPropagation()
                        toggleDropdown()
                    }}
                    className="group flex items-center gap-1.5 h-[38px] pl-3 pr-2.5 rounded-xl bg-black/55 hover:bg-black/70 backdrop-blur-md text-white text-sm font-semibold shadow-lg shadow-black/20 hover:shadow-black/30 transition-all duration-200 cursor-pointer"
                >
                    <FiBookmark className="w-4 h-4 shrink-0 text-white/80 group-hover:scale-110 transition-transform" />
                    <span className="truncate max-w-[120px]">
                        {savedBoards.length === 0
                            ? 'ذخیره'
                            : savedBoards.length === 1
                                ? savedBoards[0].boardName
                                : `${savedBoards.length} برد`}
                    </span>
                    <FiChevronDown
                        className={`shrink-0 w-3.5 h-3.5 transition-transform duration-200 ${
                            isOpenVisible ? 'rotate-180' : ''
                        }`}
                    />
                </button>

                {/* منوی دراپ‌داون */}
                {isOpen && (
                    <div
                        className={`absolute top-[calc(100%+8px)] ${
                            align === 'left' ? 'left-0' : 'right-0'
                        } w-[360px] max-w-[calc(100vw-32px)] max-h-[420px] bg-white/95 backdrop-blur-xl rounded-2xl shadow-2xl shadow-black/10 ring-1 ring-black/5 flex flex-col overflow-hidden z-50 transition-all duration-200 ease-out origin-top ${
                            isOpenVisible
                                ? 'opacity-100 scale-100 translate-y-0'
                                : 'opacity-0 scale-95 -translate-y-2'
                        }`}
                    >
                        {/* جستجو */}
                        <div className="px-4 pt-4 pb-3">
                            <h3 className="text-center font-bold text-gray-900 text-base mb-3">
                                ذخیره در برد
                            </h3>
                            <div className="relative">
                                <FiSearch className="absolute right-3.5 top-1/2 -translate-y-1/2 text-gray-400 w-4 h-4" />
                                <input
                                    autoFocus
                                    value={query}
                                    onChange={(e) => setQuery(e.target.value)}
                                    onKeyDown={(e) => {
                                        if (e.key === 'Enter') handleCreateBoard()
                                    }}
                                    placeholder="جستجو یا ساخت برد جدید..."
                                    className="w-full h-11 pr-10 pl-3 rounded-xl border-2 border-gray-200 focus:border-red-400 focus:ring-4 focus:ring-red-100/70 outline-none text-sm text-right transition-all bg-gray-50/50"
                                />
                            </div>
                        </div>

                        {/* لیست بردها */}
                        <div className="flex-1 overflow-y-auto px-2 pb-2">
                            {isLoadingBoards ? (
                                <div className="flex justify-center py-8">
                                    <div className="w-6 h-6 border-[3px] border-gray-200 border-t-red-500 rounded-full animate-spin" />
                                </div>
                            ) : (
                                <>
                                    {filteredTopChoices.length > 0 && (
                                        <div className="mb-1">
                                            <p className="px-2.5 py-1.5 text-xs font-semibold text-gray-400">
                                                پیشنهادها
                                            </p>
                                            {filteredTopChoices.map((board) => (
                                                <BoardRow
                                                    key={board.id}
                                                    board={board}
                                                    isSaved={savedBoardIds.has(board.id)}
                                                    onClick={() => handleToggle(board)}
                                                />
                                            ))}
                                        </div>
                                    )}

                                    {filteredAllBoards.length > 0 && (
                                        <div>
                                            {filteredTopChoices.length > 0 && (
                                                <p className="px-2.5 py-1.5 text-xs font-semibold text-gray-400">
                                                    همه بردها
                                                </p>
                                            )}
                                            {filteredAllBoards.map((board) => (
                                                <BoardRow
                                                    key={board.id}
                                                    board={board}
                                                    isSaved={savedBoardIds.has(board.id)}
                                                    onClick={() => handleToggle(board)}
                                                />
                                            ))}
                                        </div>
                                    )}

                                    {filteredTopChoices.length === 0 && filteredAllBoards.length === 0 && (
                                        <p className="px-2 py-8 text-center text-sm text-gray-400">
                                            بردی پیدا نشد
                                        </p>
                                    )}
                                </>
                            )}
                        </div>

                        {/* ساخت برد جدید */}
                        <button
                            onClick={handleCreateBoard}
                            className="group flex items-center gap-3 px-4 py-3 border-t border-gray-100 hover:bg-gradient-to-l hover:from-red-50 hover:to-transparent cursor-pointer transition-all text-right"
                        >
                            <span className="w-10 h-10 rounded-full bg-gray-100 group-hover:bg-red-100 flex items-center justify-center shrink-0 transition-colors">
                                <FiPlus className="text-gray-700 group-hover:text-red-600 transition-colors" />
                            </span>
                            <Link href="/myboards" className="font-semibold text-gray-900 text-sm group-hover:text-red-700 transition-colors">
                                ساخت برد جدید
                            </Link>
                        </button>
                    </div>
                )}
            </div>
        </div>
    )
}

// ردیف برد
const BoardRow = ({
    board,
    isSaved,
    onClick,
}: {
    board: Board
    isSaved: boolean
    onClick: () => void
}) => (
    <button
        onClick={(e) => {
            e.preventDefault()
            e.stopPropagation()
            onClick()
        }}
        className={`group/board w-full flex items-center gap-3 px-2 py-2 rounded-xl transition-all duration-200 cursor-pointer text-right ${
            isSaved
                ? 'bg-red-50/60 hover:bg-red-50 shadow-inner'
                : 'hover:bg-gray-50 hover:shadow-md hover:-translate-y-0.5'
        }`}
    >
        <div className="relative w-12 h-12 rounded-xl overflow-hidden shrink-0 bg-gray-100 ring-1 ring-black/5 group-hover/board:ring-red-200 transition-all">
            <img
                src={board.thumbnail}
                alt={board.name}
                className="w-full h-full object-cover"
            />
        </div>
        <span className="font-semibold text-gray-900 text-sm truncate flex-1">
            {board.name}
        </span>
        {isSaved && (
            <span className="w-6 h-6 rounded-full bg-red-600 flex items-center justify-center shrink-0 scale-100 opacity-100 transition-all duration-200">
                <FiCheck className="w-3.5 h-3.5 text-white" />
            </span>
        )}
    </button>
)

export default SaveToBoardDropdown