"use client"

import { useEffect, useState } from 'react'
import Image from 'next/image'
import { useAuthStore } from '@/lib/authStore'
import Link from 'next/link'
import {
    FiMessageCircle,
    FiTrash2,
    FiSend,
    FiLogIn,
    FiX
} from 'react-icons/fi'

type PinCommentsProps = {
    pinId: string
}

export default function PinComments({ pinId }: PinCommentsProps) {
    const { user } = useAuthStore()
    const [showLoginModal, setShowLoginModal] = useState(false)
    const [comments, setComments] = useState<any[]>([])
    const [newComment, setNewComment] = useState('')
    const [loadingComments, setLoadingComments] = useState(true)
    const [commentError, setCommentError] = useState('')

    // مودال حذف
    const [commentToDelete, setCommentToDelete] = useState<any>(null)
    const [isModalClosing, setIsModalClosing] = useState(false)

    // fetch کامنت‌ها
    useEffect(() => {
        const fetchComments = async () => {
            try {
                const res = await fetch(`/api/pins/${pinId}/comments`)
                if (res.ok) {
                    const data = await res.json()
                    setComments(data.comments || [])
                }
            } catch (error) {
                console.error(error)
            } finally {
                setLoadingComments(false)
            }
        }
        if (pinId) fetchComments()
    }, [pinId])

    const handleAddComment = async (e: React.FormEvent) => {
        e.preventDefault()

        if (!user) {
            setShowLoginModal(true) // مودال رو باز کن
            return // و نذار ادامه بده
        }

        if (!newComment.trim()) return
        setCommentError('')
        try {
            const res = await fetch(`/api/pins/${pinId}/comments`, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ content: newComment }),
            })
            if (!res.ok) {
                const data = await res.json()
                throw new Error(data.error || 'خطا در ثبت کامنت')
            }
            const data = await res.json()
            setComments(prev => [data.comment, ...prev])
            setNewComment('')
        } catch (err) {
            setCommentError(err instanceof Error ? err.message : 'خطا')
        }
    }

    const handleDeleteComment = async (commentId: string) => {
        try {
            const res = await fetch(`/api/comments/${commentId}`, { method: 'DELETE' })
            if (res.ok) {
                setComments(prev => prev.filter(c => c.id !== commentId))
            }
        } catch (error) {
            console.error(error)
        }
    }

    const timeAgo = (date: string | Date) => {
        const seconds = Math.floor((Date.now() - new Date(date).getTime()) / 1000)
        if (seconds < 60) return 'همین حالا'
        const minutes = Math.floor(seconds / 60)
        if (minutes < 60) return `${minutes} دقیقه پیش`
        const hours = Math.floor(minutes / 60)
        if (hours < 24) return `${hours} ساعت پیش`
        const days = Math.floor(hours / 24)
        if (days < 7) return `${days} روز پیش`
        const weeks = Math.floor(days / 7)
        if (weeks < 5) return `${weeks} هفته پیش`
        return new Date(date).toLocaleDateString('fa-IR')
    }

    const openDeleteCommentModal = (comment: any) => {
        setCommentToDelete(comment)
        setIsModalClosing(false)
    }

    const closeDeleteCommentModal = () => {
        setIsModalClosing(true)
        setTimeout(() => {
            setCommentToDelete(null)
            setIsModalClosing(false)
        }, 200)
    }

    const confirmDeleteComment = async () => {
        if (!commentToDelete) return
        await handleDeleteComment(commentToDelete.id)
        closeDeleteCommentModal()
    }

    return (
        <div className="px-6 py-4 flex flex-col gap-4">
            {/* هدر */}
            <div className="flex items-center gap-2.5">
                <div className="w-8 h-8 rounded-xl bg-gray-50 ring-1 ring-gray-100 flex items-center justify-center shrink-0">
                    <FiMessageCircle className="w-4 h-4 text-gray-500" />
                </div>
                <h2 className="font-bold text-gray-900">دیدگاه‌ها</h2>
                <span className="text-xs font-extrabold bg-red-50 text-red-600 ring-1 ring-red-100 px-2 py-0.5 rounded-full tabular-nums">
                    {comments.length}
                </span>
                <div className="flex-1 h-px bg-gradient-to-l from-gray-100 to-transparent" />
            </div>

            {/* لیست کامنت‌ها */}
            {loadingComments ? (
                <div className="flex justify-center py-8">
                    <div className="w-7 h-7 border-2 border-gray-100 border-t-red-500 rounded-full animate-spin" />
                </div>
            ) : comments.length === 0 ? (
                <div className="text-center py-10">
                    <div className="w-16 h-16 mx-auto mb-4 rounded-3xl bg-gradient-to-br from-gray-50 to-gray-100 ring-1 ring-gray-100 flex items-center justify-center rotate-3">
                        <FiMessageCircle className="w-7 h-7 text-gray-300" />
                    </div>
                    <p className="text-sm text-gray-500 font-bold">اولین دیدگاه را شما بنویسید</p>
                    <p className="text-xs text-gray-400 mt-1">نظر شما به این پین جان می‌دهد !</p>
                </div>
            ) : (
                <div className="relative">
                    <div className="pointer-events-none absolute top-0 inset-x-0 h-8 bg-gradient-to-b from-white to-transparent z-10 rounded-t-2xl" />
                    <div className="pointer-events-none absolute bottom-0 inset-x-0 h-8 bg-gradient-to-b from-transparent to-white z-10 rounded-b-2xl" />

                    <div className="space-y-2 max-h-[40vh] md:max-h-[50vh] overflow-y-auto scroll-smooth px-1 py-2
                        [&::-webkit-scrollbar]:w-1.5
                        [&::-webkit-scrollbar-thumb]:bg-gray-200
                        [&::-webkit-scrollbar-thumb]:hover:bg-gray-300
                        [&::-webkit-scrollbar-thumb]:rounded-full
                        [&::-webkit-scrollbar-track]:bg-transparent">

                        {comments.map((comment: any, index: number) => {
                            const isMine = user && comment.userId === user.id
                            return (
                                <div
                                    key={comment.id}
                                    className="group/comment flex items-start gap-3 p-2 rounded-2xl hover:bg-gray-50/70 mt-2 transition-all duration-200 animate-[commentIn_0.35s_ease-out_backwards]"
                                    style={{ animationDelay: `${Math.min(index * 45, 400)}ms` }}
                                >
                                    <div className="w-9 h-9 shrink-0 rounded-full overflow-hidden bg-gradient-to-br from-gray-200 to-gray-300 flex items-center justify-center text-gray-600 text-sm font-bold ring-2 ring-white shadow-sm">
                                        {comment.user?.avatar ? (
                                            <Image
                                                src={comment.user.avatar}
                                                alt=""
                                                width={36}
                                                height={36}
                                                className="w-full h-full object-cover"
                                            />
                                        ) : (
                                            comment.user?.username?.charAt(0).toUpperCase() || '؟'
                                        )}
                                    </div>

                                    <div className="flex-1 min-w-0">
                                        <div
                                            className={`rounded-2xl px-4 py-3 ring-1 transition-all duration-200 ${isMine
                                                ? 'bg-gradient-to-br from-red-50/80 to-rose-50/50 ring-red-100/80'
                                                : 'bg-gray-50/80 ring-gray-100 group-hover/comment:bg-white group-hover/comment:ring-gray-200'
                                                }`}
                                        >
                                            <div className="flex items-center gap-2 mb-1">
                                                <span className={`text-[12px] font-extrabold truncate ${isMine ? 'text-red-700' : 'text-gray-900'}`}>
                                                    {comment.user?.name || comment.user?.username || 'کاربر'}
                                                </span>
                                                {isMine && (
                                                    <span className="shrink-0 text-[10px] font-bold bg-red-100 text-red-600 px-1.5 py-0.5 rounded-md">
                                                        شما
                                                    </span>
                                                )}
                                                <span className="ml-auto flex items-center gap-1.5 shrink-0">
                                                    <span className="text-[10px] text-gray-400">
                                                        {timeAgo(comment.createdAt)}
                                                    </span>
                                                    {isMine && (
                                                        <button
                                                            onClick={() => openDeleteCommentModal(comment)}
                                                            title="حذف کامنت"
                                                            aria-label="حذف کامنت"
                                                            className="w-6 h-6 rounded-md flex items-center justify-center text-gray-400 opacity-100 sm:opacity-0 sm:group-hover/comment:opacity-100 hover:text-red-600 hover:bg-red-50 transition-all duration-200 cursor-pointer active:scale-90"
                                                        >
                                                            <FiTrash2 className="w-3 h-3" />
                                                        </button>
                                                    )}
                                                </span>
                                            </div>

                                            <p className="text-sm text-gray-700 leading-relaxed break-words whitespace-pre-wrap">
                                                {comment.content}
                                            </p>
                                        </div>
                                    </div>
                                </div>
                            )
                        })}
                    </div>
                </div>
            )}

            {/* فرم افزودن دیدگاه */}
            <div className="flex items-start gap-3 mt-1">
                <div className="w-9 h-9 shrink-0 rounded-full overflow-hidden bg-gradient-to-br from-red-500 to-orange-500 flex items-center justify-center text-white text-sm font-bold ring-2 ring-white shadow-md shadow-red-100">
                    {user?.avatar ? (
                        <Image src={user.avatar} alt="" className="w-full h-full object-cover" width={36} height={36} />
                    ) : (
                        user?.username?.charAt(0).toUpperCase() || '؟'
                    )}
                </div>

                <div className="flex-1">
                    <div className="relative group/input">
                        <div className="absolute left-1.5 top-1/2 -translate-y-1/2 flex items-center gap-1.5">
                            {newComment.length > 0 && (
                                <span className="hidden sm:block text-[10px] font-bold text-gray-300 tabular-nums">
                                    {newComment.length}
                                </span>
                            )}
                            <button
                                onClick={handleAddComment}
                                disabled={!newComment.trim()}
                                aria-label="ارسال کامنت"
                                className={`h-8 px-3.5 rounded-full flex items-center gap-1.5 text-xs font-bold transition-all duration-200 cursor-pointer ${newComment.trim()
                                    ? 'bg-gradient-to-l from-red-500 to-rose-600 text-white shadow-md shadow-red-200 hover:shadow-lg hover:shadow-red-300/60 hover:brightness-105 active:scale-95'
                                    : 'bg-gray-200/80 text-gray-400 cursor-not-allowed'
                                    }`}
                            >
                                ارسال
                                <FiSend className="w-3 h-3 -scale-x-100" />
                            </button>
                        </div>
                        <input
                            type="text"
                            value={newComment}
                            onChange={(e) => setNewComment(e.target.value)}
                            onKeyDown={(e) => {
                                if (e.key === 'Enter' && newComment.trim()) {
                                    e.preventDefault()
                                    handleAddComment(e)
                                }
                            }}
                            placeholder="دیدگاه خود را بنویسید..."
                            className="w-full bg-gray-50 ring-1 ring-gray-200/70 rounded-full pr-4 pl-24 py-3 text-sm text-gray-800 placeholder-gray-400 focus:outline-none focus:bg-white focus:ring-2 focus:ring-red-300/60 focus:shadow-[0_0_0_4px_rgba(254,226,226,0.5)] transition-all duration-200"
                        />
                    </div>
                </div>
            </div>

            {/* مودال تأیید حذف */}
            {commentToDelete && (
                <div
                    className={`fixed inset-0 z-[150] flex items-center justify-center p-4 ${isModalClosing
                        ? 'animate-[fadeOut_0.2s_ease-in]'
                        : 'animate-[fadeIn_0.2s_ease-out]'
                        }`}
                >
                    <div
                        className="absolute inset-0 bg-black/50 backdrop-blur-[2px]"
                        onClick={closeDeleteCommentModal}
                    />

                    <div className="relative bg-white rounded-3xl shadow-2xl p-6 w-full max-w-[285px] md:max-w-sm text-center">
                        <div className="w-14 h-14 mx-auto mb-4 bg-red-50 rounded-2xl flex items-center justify-center">
                            <FiTrash2 className="text-red-600 text-xl" />
                        </div>
                        <h3 className="text-md md:text-lg font-bold text-gray-900 mb-1.5">حذف دیدگاه</h3>
                        <p className="text-gray-500 text-xs md:text-sm leading-relaxed mb-6">
                            آیا مطمئن هستید که می‌خواهید این دیدگاه را حذف کنید؟ این عمل قابل بازگشت نیست.
                        </p>
                        <div className="flex gap-2.5">
                            <button
                                onClick={closeDeleteCommentModal}
                                className="flex-1 h-11 bg-gray-100 hover:bg-gray-200 text-gray-700 rounded-xl font-semibold text-sm transition-colors cursor-pointer"
                            >
                                انصراف
                            </button>
                            <button
                                onClick={confirmDeleteComment}
                                className="flex-1 h-11 bg-red-600 hover:bg-red-700 text-white rounded-xl font-semibold text-sm transition-colors cursor-pointer"
                            >
                                حذف
                            </button>
                        </div>
                    </div>
                </div>
            )}

            {/* ✅ مودال هشدار برای کاربران مهمان */}
            {showLoginModal && (
                <div className="fixed inset-0 z-[500] flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm animate-[fadeIn_0.2s_ease-out]">
                    <div className="relative w-full max-w-sm bg-white rounded-3xl shadow-2xl overflow-hidden p-6 text-center animate-[fadeInUp_0.3s_ease-out]">

                        {/* دکمه بستن */}
                        <button
                            onClick={() => setShowLoginModal(false)}
                            className="absolute top-3 right-3 w-8 h-8 rounded-full bg-gray-100 hover:bg-gray-200 flex items-center justify-center text-gray-500 transition-colors cursor-pointer"
                        >
                            <FiX className="w-4 h-4" />
                        </button>

                        {/* آیکون */}
                        <div className="w-16 h-16 mx-auto mb-4 rounded-2xl bg-red-50 flex items-center justify-center rotate-3">
                            <FiMessageCircle className="w-8 h-8 text-red-500" />
                        </div>

                        {/* متن */}
                        <h3 className="text-lg font-extrabold text-gray-900 mb-2">
                            برای ثبت نظر وارد شوید
                        </h3>
                        <p className="text-sm text-gray-500 leading-relaxed mb-6">
                            برای ارسال دیدگاه و تعامل با دیگران، ابتدا باید وارد حساب کاربری خود شوید.
                        </p>

                        <div className="flex gap-3">
                            <button
                                onClick={() => setShowLoginModal(false)}
                                className="flex-1 py-3 rounded-xl font-bold text-sm bg-gray-100 text-gray-700 hover:bg-gray-200 transition-colors cursor-pointer"
                            >
                                انصراف
                            </button>
                            <Link
                                href="/login"
                                className="flex-1 py-3 rounded-xl font-bold text-sm bg-gradient-to-r from-red-600 to-rose-600 text-white shadow-lg shadow-red-200 hover:shadow-xl hover:-translate-y-0.5 transition-all no-underline flex items-center justify-center gap-2"
                            >
                                <FiLogIn className="w-4 h-4" />
                                ورود / ثبت‌نام
                            </Link>
                        </div>
                    </div>
                </div>
            )}


        </div>


    )
}