"use client"

import { useEffect, useState } from 'react'
import { useParams, useRouter } from 'next/navigation'
import Link from 'next/link'
import PinCard from '@/app/components/PinCard'
import { useAuthStore } from '@/lib/authStore'
import {
    FiArrowRight,
    FiCheck,
    FiChevronDown,
    FiMessageCircle,
    FiFolder,
    FiHeart,
    FiShare2,
    FiBookmark,
    FiCalendar,
    FiTrash2,
    FiSend,
    FiLink2,
    FiUserPlus,
    FiGrid,
} from 'react-icons/fi'

export default function PinDetailPage() {
    const { id } = useParams<{ id: string }>()
    const router = useRouter()
    const { user } = useAuthStore()

    const [pin, setPin] = useState<any>(null)
    const [loading, setLoading] = useState(true)
    const [error, setError] = useState('')

    const [saveOpen, setSaveOpen] = useState(false)
    const [boards, setBoards] = useState<any[]>([])
    const [savedBoards, setSavedBoards] = useState<{ boardId: string; boardName: string }[]>([])
    const [loadingBoards, setLoadingBoards] = useState(false)
    const [isFollowed, setIsFollowed] = useState(false)
    const [followersCount, setFollowersCount] = useState(0)
    const [followLoading, setFollowLoading] = useState(false)

    // state های لایک
    const [isLiked, setIsLiked] = useState(false)
    const [totalLikes, setTotalLikes] = useState(0)

    const [relatedPins, setRelatedPins] = useState<any[]>([])
    const [loadingRelated, setLoadingRelated] = useState(true)

    useEffect(() => {
        const fetchPin = async () => {
            try {
                const res = await fetch(`/api/pins/${id}`)
                if (!res.ok) throw new Error('پین یافت نشد')
                const data = await res.json()
                setPin(data.pin)
                setSavedBoards(data.pin.savedBoards || [])
                setIsLiked(data.pin.isLikedByMe || false)
                setTotalLikes(data.pin.totalLikes || 0)
            } catch (err) {
                setError(err instanceof Error ? err.message : 'خطا')
            } finally {
                setLoading(false)
            }
        }
        if (id) fetchPin()
    }, [id])

    const fetchBoards = async () => {
        if (!user) return
        setLoadingBoards(true)
        try {
            const res = await fetch('/api/boards')
            if (res.ok) {
                const data = await res.json()
                setBoards(data.map((b: any) => ({
                    id: b.id,
                    name: b.name,
                    thumbnail: b.pins?.[0]?.imageUrl || '/placeholder.jpg',
                })))
            }
        } catch (error) {
            console.error(error)
        } finally {
            setLoadingBoards(false)
        }
    }

    const toggleSave = async () => {
        if (!user) {
            router.push('/login')
            return
        }
        if (!saveOpen) {
            await fetchBoards()
        }
        setSaveOpen(prev => !prev)
    }

    const handleToggleBoard = async (boardId: string, boardName: string) => {
        const isSaved = savedBoards.some(sb => sb.boardId === boardId)
        try {
            if (isSaved) {
                const res = await fetch('/api/saves', {
                    method: 'DELETE',
                    headers: { 'Content-Type': 'application/json' },
                    body: JSON.stringify({ pinId: pin.id, boardId }),
                })
                if (res.ok) {
                    setSavedBoards(prev => prev.filter(sb => sb.boardId !== boardId))
                }
            } else {
                const res = await fetch('/api/saves', {
                    method: 'POST',
                    headers: { 'Content-Type': 'application/json' },
                    body: JSON.stringify({ pinId: pin.id, boardId }),
                })
                if (res.ok) {
                    setSavedBoards(prev => [...prev, { boardId, boardName }])
                }
            }
        } catch (error) {
            console.error(error)
        }
    }

    // تابع لایک
    const handleLike = async () => {
        if (!user) {
            router.push('/login')
            return
        }
        try {
            const res = await fetch(`/api/pins/${pin.id}/like`, {
                method: 'POST',
            })
            if (!res.ok) throw new Error('خطا')
            const data = await res.json()
            setIsLiked(data.isLiked)
            setTotalLikes(data.totalLikes)
        } catch (error) {
            console.error(error)
        }
    }

    useEffect(() => {
        if (pin) {
            fetchRelatedPins(pin.userId)
        }
    }, [pin])

    const fetchRelatedPins = async (userId: string) => {
        setLoadingRelated(true)
        try {
            const res = await fetch(`/api/pins/${id}/related`)
            if (res.ok) {
                const data = await res.json()
                setRelatedPins(data.pins || [])
            }
        } catch (error) {
            console.error(error)
        } finally {
            setLoadingRelated(false)
        }
    }

    const [comments, setComments] = useState<any[]>([])
    const [newComment, setNewComment] = useState('')
    const [loadingComments, setLoadingComments] = useState(true)
    const [commentError, setCommentError] = useState('')

    useEffect(() => {
        const fetchComments = async () => {
            try {
                const res = await fetch(`/api/pins/${id}/comments`)
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
        if (id) fetchComments()
    }, [id])

    const handleAddComment = async (e: React.FormEvent) => {
        e.preventDefault()
        if (!newComment.trim()) return
        setCommentError('')
        try {
            const res = await fetch(`/api/pins/${pin.id}/comments`, {
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

    useEffect(() => {
        if (pin && user) {
            fetchFollowStatus(pin.userId)
        }
    }, [pin, user])

    const fetchFollowStatus = async (userId: string) => {
        try {
            const res = await fetch(`/api/users/${userId}/follow`)
            if (res.ok) {
                const data = await res.json()
                setIsFollowed(data.isFollowing)
                setFollowersCount(data.followersCount)
            }
        } catch (error) {
            console.error(error)
        }
    }

    const handleFollow = async () => {
        if (!user) {
            router.push('/login')
            return
        }
        if (followLoading) return

        setFollowLoading(true)
        try {
            const res = await fetch(`/api/users/${pin.userId}/follow`, {
                method: 'POST',
            })
            if (res.ok) {
                const data = await res.json()
                setIsFollowed(data.isFollowing)
                setFollowersCount(data.followersCount)
            }
        } catch (error) {
            console.error(error)
        } finally {
            setFollowLoading(false)
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

    if (loading) {
        return (
            <main dir="rtl" className="min-h-screen flex items-center justify-center bg-gradient-to-br from-red-50 via-white to-orange-50">
                <div className="flex flex-col items-center gap-4">
                    <div className="w-14 h-14 border-4 border-red-100 border-t-red-500 rounded-full animate-spin" />
                    <p className="text-sm text-gray-400 font-medium">در حال بارگذاری...</p>
                </div>
            </main>
        )
    }

    if (error || !pin) {
        return (
            <main dir="rtl" className="min-h-screen flex flex-col items-center justify-center gap-5 px-4 bg-gradient-to-br from-red-50 via-white to-orange-50">
                <div className="w-20 h-20 rounded-3xl bg-white shadow-lg ring-1 ring-black/5 flex items-center justify-center">
                    <FiFolder className="w-9 h-9 text-red-300" />
                </div>
                <div className="text-center">
                    <p className="text-gray-800 font-bold text-xl mb-1">{error || 'پین یافت نشد'}</p>
                    <p className="text-gray-400 text-sm">ممکن است این پین حذف شده یا آدرس اشتباه باشد</p>
                </div>
                <Link
                    href="/"
                    className="bg-red-600 text-white px-6 py-2.5 rounded-full font-semibold text-sm shadow-lg shadow-red-200 hover:bg-red-700 transition-all no-underline"
                >
                    بازگشت به خانه
                </Link>
            </main>
        )
    }

    return (
        <main dir="rtl" className="relative min-h-screen overflow-hidden bg-gradient-to-br from-red-50/60 via-white to-orange-50/50 py-6 md:py-10 px-4">
            <div className="absolute -top-32 -left-32 w-96 h-96 bg-red-100/50 rounded-full blur-3xl pointer-events-none" />
            <div className="absolute -bottom-32 -right-32 w-[28rem] h-[28rem] bg-orange-100/40 rounded-full blur-3xl pointer-events-none" />

            <div className="relative max-w-6xl mx-auto">
                <button
                    onClick={() => router.back()}
                    className="inline-flex cursor-pointer items-center gap-2 text-gray-600 hover:text-gray-900 transition-all mb-6 group bg-white/80 backdrop-blur-md px-5 py-2.5 rounded-full shadow-sm ring-1 ring-black/5 hover:shadow-md"
                >
                    <FiArrowRight className="transition-transform group-hover:-translate-x-1" />
                    <span className="font-medium text-sm">بازگشت</span>
                </button>

                <div className="bg-white/90 backdrop-blur-xl rounded-[2rem] shadow-2xl ring-1 ring-black/5 overflow-hidden">
                    <div className="grid grid-cols-1 lg:grid-cols-2 items-stretch">
                        {/* ستون تصویر */}
                        <div className="relative bg-gray-50 p-4 sm:p-6 flex items-center justify-center lg:border-l lg:border-gray-100">
                            <div className="relative w-full group rounded-2xl overflow-hidden shadow-xl ring-1 ring-black/5">
                                <img
                                    src={pin.imageUrl}
                                    alt={pin.title}
                                    className="w-full max-h-[85vh] object-cover transition-transform duration-700 ease-out group-hover:scale-[1.03]"
                                />
                                <div className="absolute inset-x-0 bottom-0 bg-gradient-to-t from-black/70 via-black/20 to-transparent p-6 pb-1 pt-16 opacity-0 group-hover:opacity-100 transition-opacity duration-300">
                                    <p className="text-white font-bold text-lg truncate">{pin.title}</p>
                                </div>
                            </div>
                        </div>

                        {/* ستون اطلاعات */}
                        <div className="flex flex-col divide-y divide-gray-100">
                            {/* مالک پین */}
                            <div className="flex items-center justify-between gap-3 p-6">
                                <Link href={`/user/${pin.owner.id}`} className="flex items-center gap-3.5 no-underline group min-w-0">
                                    <div className="relative shrink-0">
                                        <div className="w-13 h-13 md:w-14 md:h-14 rounded-full bg-gradient-to-br from-red-500 to-orange-500 flex items-center justify-center text-white font-bold text-xl shadow-lg shadow-red-200/60 ring-2 ring-white overflow-hidden">
                                            {pin.owner?.avatar ? (
                                                <img src={pin.owner.avatar} alt={pin.owner.name} className="w-full h-full object-cover" />
                                            ) : (
                                                pin.owner?.username?.charAt(0).toUpperCase()
                                            )}
                                        </div>
                                        <div className="absolute -bottom-0.5 -right-0.5 w-4 h-4 bg-green-500 rounded-full border-2 border-white" />
                                    </div>
                                    <div className="min-w-0">
                                        <p className="font-bold text-gray-900 truncate group-hover:text-red-600 transition-colors">
                                            {pin.owner?.name}
                                        </p>
                                        <p className="text-sm text-gray-400 truncate text-right" dir='ltr'>
                                            @{pin.owner?.username}
                                        </p>
                                        {/* ✅ تعداد دنبال‌کننده */}
                                        <p className="text-xs text-gray-400 mt-0.5 flex items-center gap-1">
                                            <FiUserPlus className="w-3 h-3" />
                                            {followersCount} دنبال‌کننده
                                        </p>
                                    </div>
                                </Link>

                                {pin.isOwner ? (
                                    <Link
                                        href={`/settings`}
                                        className="shrink-0 text-xs bg-gray-100 hover:bg-gray-200 px-4 py-2.5 rounded-full font-semibold transition-all no-underline flex items-center gap-1.5 text-gray-700"
                                    >
                                        <FiGrid className="w-3.5 h-3.5" />
                                        ویرایش
                                    </Link>
                                ) : (
                                    <button
                                        onClick={handleFollow}
                                        disabled={followLoading}
                                        className={`shrink-0 flex items-center gap-1.5 px-4 py-2.5 rounded-full font-semibold text-xs transition-all ${
                                            isFollowed
                                                ? 'bg-gray-100 text-gray-600 hover:bg-gray-200'
                                                : 'bg-red-600 text-white hover:bg-red-700 shadow-lg shadow-red-200/70'
                                        } ${followLoading ? 'opacity-60 cursor-not-allowed' : ''}`}
                                    >
                                        {followLoading ? (
                                            <span className="w-3.5 h-3.5 border-2 border-white/40 border-t-white rounded-full animate-spin" />
                                        ) : isFollowed ? (
                                            <FiCheck className="w-3.5 h-3.5" />
                                        ) : (
                                            <FiUserPlus className="w-3.5 h-3.5" />
                                        )}
                                        {isFollowed ? 'دنبال شده' : 'دنبال کردن'}
                                    </button>
                                )}
                            </div>

                            {/* عنوان و توضیحات */}
                            <div className="px-6 py-5">
                                <h1 className="text-2xl md:text-3xl font-extrabold text-gray-900 leading-snug mb-2.5">
                                    {pin.title}
                                </h1>
                                {pin.description && (
                                    <p className="text-gray-500 leading-relaxed text-[15px]">
                                        {pin.description}
                                    </p>
                                )}
                            </div>

                            {/* آمار و دکمه لایک */}
                            <div className="px-6 py-5">
                                <div className="flex items-center gap-2.5 flex-wrap">
                                    <button
                                        onClick={handleLike}
                                        title={isLiked ? 'حذف لایک' : 'لایک'}
                                        className={`relative group flex items-center gap-2 px-4 py-2.5 rounded-full font-bold text-sm transition-all duration-300 cursor-pointer active:scale-95 ${
                                            isLiked
                                                ? 'bg-red-50 text-red-600 ring-1 ring-red-200'
                                                : 'bg-gray-50 text-gray-600 ring-1 ring-gray-200 hover:bg-red-50 hover:text-red-600 hover:ring-red-200'
                                        }`}
                                    >
                                        {isLiked && (
                                            <span key="burst" className="pointer-events-none absolute inset-0 flex items-center justify-center">
                                                {[...Array(6)].map((_, i) => (
                                                    <span
                                                        key={i}
                                                        className="absolute w-1.5 h-1.5 rounded-full bg-red-500 animate-[particle_0.6s_ease-out_forwards]"
                                                        style={{
                                                            '--tx': `${Math.cos((i * 60 * Math.PI) / 180) * 28}px`,
                                                            '--ty': `${Math.sin((i * 60 * Math.PI) / 180) * 28}px`,
                                                        } as React.CSSProperties}
                                                    />
                                                ))}
                                            </span>
                                        )}
                                        <FiHeart
                                            key={isLiked ? 'liked' : 'unliked'}
                                            className={`w-[18px] h-[18px] transition-colors ${
                                                isLiked
                                                    ? 'text-red-600 fill-red-600 animate-[likePop_0.45s_ease-out]'
                                                    : 'text-gray-400 group-hover:text-red-500'
                                            }`}
                                        />
                                        <span className="tabular-nums">{totalLikes}</span>
                                    </button>

                                    <div
                                        title="تعداد ذخیره"
                                        className="flex items-center gap-2 px-4 py-2.5 rounded-full font-bold text-sm bg-gray-50 text-gray-600 ring-1 ring-gray-200"
                                    >
                                        <FiBookmark className="w-[18px] h-[18px] text-gray-400" />
                                        <span className="tabular-nums">{pin.totalSaves}</span>
                                    </div>

                                    <button
                                        title="اشتراک‌گذاری"
                                        onClick={() => {
                                            const url = window.location.href
                                            if (navigator.share) {
                                                navigator.share({ title: pin.title, url }).catch(() => {})
                                            } else {
                                                navigator.clipboard?.writeText(url)
                                            }
                                        }}
                                        className="flex items-center gap-2 px-4 py-2.5 rounded-full font-bold text-sm bg-gray-50 text-gray-600 ring-1 ring-gray-200 hover:bg-blue-50 hover:text-blue-600 hover:ring-blue-200 transition-all duration-300 cursor-pointer active:scale-95"
                                    >
                                        <FiShare2 className="w-[18px] h-[18px] text-gray-400 group-hover:text-blue-500" />
                                        <span className="hidden sm:inline text-gray-500 text-xs font-semibold">اشتراک‌گذاری</span>
                                    </button>

                                    <span className="mr-auto hidden md:flex items-center gap-1.5 text-xs text-gray-400 font-medium">
                                        <FiCalendar className="w-3.5 h-3.5" />
                                        {new Date(pin.createdAt).toLocaleDateString('fa-IR')}
                                    </span>
                                </div>
                            </div>

                            {/* ═══ بخش کامنت‌ها ═══ */}
                            <div className="px-6 py-2 flex flex-col">
                                <div className="flex items-center gap-2.5 mb-4">
                                    <div className="w-8 h-8 rounded-xl bg-gray-50 ring-1 ring-gray-100 flex items-center justify-center shrink-0">
                                        <FiMessageCircle className="w-4 h-4 text-gray-500" />
                                    </div>
                                    <h2 className="font-bold text-gray-900">دیدگاه‌ها</h2>
                                    <span className="text-xs font-extrabold bg-red-50 text-red-600 ring-1 ring-red-100 px-2 py-0.5 rounded-full tabular-nums">
                                        {comments.length}
                                    </span>
                                    <div className="flex-1 h-px bg-gradient-to-l from-gray-100 to-transparent" />
                                </div>

                                {comments.length === 0 ? (
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

                                        <div className="space-y-2 max-h-[45vh] min-h-[120px] overflow-y-auto scroll-smooth px-1 py-2
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
                                                                <img src={comment.user.avatar} alt="" className="w-full h-full object-cover" />
                                                            ) : (
                                                                comment.user?.username?.charAt(0).toUpperCase() || '؟'
                                                            )}
                                                        </div>

                                                        <div className="flex-1 min-w-0">
                                                            <div
                                                                className={`rounded-2xl px-4 py-3 ring-1 transition-all duration-200 group-hover/comment:-translate-y-0.5 group-hover/comment:shadow-md group-hover/comment:shadow-gray-200/50 ${
                                                                    isMine
                                                                        ? 'bg-gradient-to-br from-red-50/80 to-rose-50/50 ring-red-100/80 group-hover/comment:ring-red-200/70'
                                                                        : 'bg-gray-50/80 ring-gray-100 group-hover/comment:bg-white group-hover/comment:ring-gray-200'
                                                                }`}
                                                            >
                                                                <div className="flex items-center gap-2 mb-1">
                                                                    <span className={`text-[13px] font-extrabold truncate ${isMine ? 'text-red-700' : 'text-gray-900'}`}>
                                                                        {comment.user?.name || comment.user?.username || 'کاربر'}
                                                                    </span>
                                                                    {isMine && (
                                                                        <span className="shrink-0 text-[10px] font-bold bg-red-100 text-red-600 px-1.5 py-0.5 rounded-md">
                                                                            شما
                                                                        </span>
                                                                    )}
                                                                    <span className="text-[11px] text-gray-400 shrink-0 ml-auto">
                                                                        {timeAgo(comment.createdAt)}
                                                                    </span>
                                                                </div>
                                                                <p className="text-sm text-gray-700 leading-relaxed break-words whitespace-pre-wrap">
                                                                    {comment.content}
                                                                </p>
                                                            </div>

                                                            {isMine && (
                                                                <div className="flex items-center gap-1 mt-1 pr-2 opacity-0 group-hover/comment:opacity-100 translate-y-0.5 group-hover/comment:translate-y-0 transition-all duration-200">
                                                                    <button
                                                                        onClick={() => handleDeleteComment(comment.id)}
                                                                        aria-label="حذف کامنت"
                                                                        className="flex items-center gap-1.5 text-[11px] font-bold text-gray-400 hover:text-red-600 px-2 py-1 rounded-lg hover:bg-red-50 transition-all duration-200 cursor-pointer active:scale-90"
                                                                    >
                                                                        <FiTrash2 className="w-3 h-3" />
                                                                        حذف
                                                                    </button>
                                                                </div>
                                                            )}
                                                        </div>
                                                    </div>
                                                )
                                            })}
                                        </div>
                                    </div>
                                )}

                                <div className="flex items-start gap-3 mb-2">
                                    <div className="w-9 h-9 shrink-0 rounded-full overflow-hidden bg-gradient-to-br from-red-500 to-orange-500 flex items-center justify-center text-white text-sm font-bold ring-2 ring-white shadow-md shadow-red-100">
                                        {user?.avatar ? (
                                            <img src={user.avatar} alt="" className="w-full h-full object-cover" />
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
                                                    className={`h-8 px-3.5 rounded-full flex items-center gap-1.5 text-xs font-bold transition-all duration-200 cursor-pointer ${
                                                        newComment.trim()
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
                            </div>

                            {/* دکمه ذخیره و منوی بردها */}
                            <div className="relative p-6 mt-auto bg-gradient-to-t from-gray-50/80 to-transparent">
                                <button
                                    onClick={toggleSave}
                                    className={`w-full flex items-center justify-between gap-2 px-4 py-4 rounded-2xl font-bold transition-all ${
                                        savedBoards.length > 0
                                            ? 'bg-gradient-to-r from-red-600 to-rose-600 text-white shadow-lg shadow-red-300/50 hover:shadow-xl hover:shadow-red-300/60 hover:brightness-105'
                                            : 'bg-gray-900 text-white shadow-lg shadow-gray-300/50 hover:bg-black hover:shadow-xl'
                                    }`}
                                >
                                    <span className="flex items-center gap-2.5">
                                        <FiBookmark className="w-5 h-5" />
                                        {savedBoards.length > 0 ? (
                                            savedBoards.length === 1
                                                ? savedBoards[0].boardName
                                                : `ذخیره شده در ${savedBoards.length} برد`
                                        ) : (
                                            'ذخیره در برد'
                                        )}
                                    </span>
                                    <FiChevronDown className={`w-4 h-4 transition-transform duration-300 ${saveOpen ? 'rotate-180' : ''}`} />
                                </button>

                                {saveOpen && (
                                    <div className="absolute bottom-full right-6 left-6 mb-3 bg-white rounded-2xl shadow-2xl shadow-gray-400/20 ring-1 ring-black/5 p-2 z-20 max-h-72 overflow-y-auto animate-[fadeInUp_0.25s_ease-out]">
                                        <div className="flex justify-center pt-1 pb-1.5">
                                            <div className="w-10 h-1 rounded-full bg-gray-200" />
                                        </div>
                                        {loadingBoards ? (
                                            <div className="flex justify-center py-6">
                                                <div className="w-7 h-7 border-2 border-gray-100 border-t-red-500 rounded-full animate-spin" />
                                            </div>
                                        ) : boards.length === 0 ? (
                                            <div className="text-center py-6">
                                                <div className="w-12 h-12 mx-auto mb-3 rounded-2xl bg-red-50 flex items-center justify-center">
                                                    <FiFolder className="w-6 h-6 text-red-300" />
                                                </div>
                                                <p className="text-sm text-gray-500 mb-3 font-medium">بردی ندارید. ابتدا یک برد بسازید.</p>
                                                <Link
                                                    href="/myboards?tab=boards"
                                                    className="inline-block bg-red-600 text-white px-5 py-2 rounded-full text-sm font-semibold hover:bg-red-700 transition-all no-underline"
                                                >
                                                    ساخت برد
                                                </Link>
                                            </div>
                                        ) : (
                                            <div className="space-y-0.5">
                                                {boards.map(board => {
                                                    const isSaved = savedBoards.some(sb => sb.boardId === board.id)
                                                    return (
                                                        <button
                                                            key={board.id}
                                                            onClick={() => handleToggleBoard(board.id, board.name)}
                                                            className={`w-full cursor-pointer flex items-center gap-3 px-3 py-2.5 rounded-xl transition-all text-right ${
                                                                isSaved
                                                                    ? 'bg-red-50/80 text-red-700'
                                                                    : 'hover:bg-gray-50'
                                                            }`}
                                                        >
                                                            <img
                                                                src={board.thumbnail}
                                                                alt={board.name}
                                                                className="w-12 h-12 rounded-xl object-cover bg-gray-100 ring-1 ring-black/5"
                                                            />
                                                            <span className="flex-1 font-semibold text-sm truncate">{board.name}</span>
                                                            <span
                                                                className={`w-6 h-6 shrink-0 rounded-full flex items-center justify-center transition-all ${
                                                                    isSaved
                                                                        ? 'bg-red-600 scale-100'
                                                                        : 'bg-gray-200 scale-90 opacity-0 group-hover:opacity-100'
                                                                }`}
                                                            >
                                                                {isSaved && <FiCheck className="w-3.5 h-3.5 text-white" />}
                                                            </span>
                                                        </button>
                                                    )
                                                })}
                                            </div>
                                        )}
                                    </div>
                                )}
                            </div>
                        </div>
                    </div>
                </div>
            </div>

            {relatedPins.length > 0 && (
                <section className="mt-12">
                    <div className="flex items-center gap-3 mb-6">
                        <div className="w-10 h-10 rounded-2xl bg-red-50 flex items-center justify-center">
                            <FiGrid className="w-5 h-5 text-red-600" />
                        </div>
                        <h2 className="text-xl md:text-2xl font-extrabold text-gray-900">
                            پین‌های بیشتر !
                        </h2>
                    </div>

                    {loadingRelated ? (
                        <div className="flex justify-center py-12">
                            <div className="w-8 h-8 border-4 border-gray-200 border-t-red-500 rounded-full animate-spin" />
                        </div>
                    ) : (
                        <div className="columns-2 md:columns-3 lg:columns-4 xl:columns-5 gap-4 space-y-4">
                            {relatedPins.map(p => (
                                <PinCard key={p.id} pin={p} />
                            ))}
                        </div>
                    )}
                </section>
            )}

            <style>{`
                @keyframes fadeInUp {
                    from { opacity: 0; transform: translateY(12px) scale(0.98); }
                    to { opacity: 1; transform: translateY(0) scale(1); }
                }
                @keyframes likePop {
                    0%   { transform: scale(1); }
                    30%  { transform: scale(1.45) rotate(-8deg); }
                    55%  { transform: scale(0.85); }
                    75%  { transform: scale(1.12); }
                    100% { transform: scale(1); }
                }
                @keyframes particle {
                    0%   { opacity: 1; transform: translate(0, 0) scale(1); }
                    100% { opacity: 0; transform: translate(var(--tx), var(--ty)) scale(0.3); }
                }
                @keyframes commentIn {
                    from { opacity: 0; transform: translateY(8px); }
                    to   { opacity: 1; transform: translateY(0); }
                }
                @media (prefers-reduced-motion: reduce) {
                    * { animation: none !important; }
                }
            `}</style>
        </main>
    )
}