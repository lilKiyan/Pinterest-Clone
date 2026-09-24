"use client"

import { useState } from 'react'
import { useParams, useRouter } from 'next/navigation'
import { useAuthStore } from '@/lib/authStore'
import Link from 'next/link'
import Image from 'next/image'
import dynamic from 'next/dynamic'
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import Spinner from '@/app/components/Spinner'

const PinCard = dynamic(() => import('@/app/components/PinCard'), {
    ssr: false,
    loading: () => (
        <div className="aspect-[4/5] bg-gray-100 rounded-[15px] animate-pulse" />
    )
})

const PinComments = dynamic(() => import('@/app/components/PinComments'), {
    ssr: false,
    loading: () => (
        <div className="px-6 py-4">
            <div className="flex items-center gap-2.5 mb-4">
                <div className="w-8 h-8 rounded-xl bg-gray-100 animate-pulse" />
                <div className="w-20 h-4 rounded bg-gray-100 animate-pulse" />
            </div>
            <div className="space-y-3">
                <div className="h-16 bg-gray-50 rounded-2xl animate-pulse" />
                <div className="h-16 bg-gray-50 rounded-2xl animate-pulse" />
            </div>
        </div>
    ),
})

import {
    FiArrowRight,
    FiCheck,
    FiChevronDown,
    FiFolder,
    FiHeart,
    FiShare2,
    FiBookmark,
    FiCalendar,
    FiUserPlus,
    FiCheckCircle,
    FiGrid,
    FiX,
    FiLogIn,
    FiMessageCircle,
    FiDownload,
    FiLoader,
} from 'react-icons/fi'

type SavedBoard = { boardId: string; boardName: string }
type LoginAction = 'like' | 'comment' | 'save' | 'follow' | null
type PinResponse = {
    pin: {
        id: string
        title: string
        description?: string
        imageUrl: string
        imageWidth?: number
        imageHeight?: number
        createdAt: string
        userId: string
        isOwner: boolean
        totalSaves: number
        totalLikes: number
        isLikedByMe: boolean
        savedBoards: SavedBoard[]
        owner: {
            id: string
            name: string
            username: string
            avatar: string | null
        }
    }
}

export default function PinDetailPage() {
    const { id } = useParams<{ id: string }>()
    const router = useRouter()
    const { user } = useAuthStore()
    const queryClient = useQueryClient()

    const [saveOpen, setSaveOpen] = useState(false)
    const [toast, setToast] = useState('')

    const [loginAction, setLoginAction] = useState<LoginAction>(null)
    const [isDownloading, setIsDownloading] = useState(false)

    const ACTION_CONFIG: Record<Exclude<LoginAction, null>, {
        icon: any
        iconBg: string
        iconColor: string
        title: string
        description: string
        gradient: string
    }> = {
        like: {
            icon: FiHeart,
            iconBg: 'bg-red-50',
            iconColor: 'text-red-500',
            title: 'برای لایک کردن وارد شوید',
            description: 'برای ذخیره علاقه‌مندی‌هات و لایک کردن پین‌ها، وارد حساب کاربری شو.',
            gradient: 'from-red-600 to-rose-600',
        },
        comment: {
            icon: FiMessageCircle,
            iconBg: 'bg-blue-50',
            iconColor: 'text-blue-500',
            title: 'برای ثبت نظر وارد شوید',
            description: 'برای ارسال دیدگاه و تعامل با دیگران، ابتدا باید وارد حساب کاربری خود شوید.',
            gradient: 'from-blue-600 to-indigo-600',
        },
        save: {
            icon: FiBookmark,
            iconBg: 'bg-orange-50',
            iconColor: 'text-orange-500',
            title: 'برای ذخیره پین وارد شوید',
            description: 'برای ذخیره پین‌ها در بردهای شخصی، وارد حساب کاربری خود شوید.',
            gradient: 'from-orange-500 to-amber-500',
        },
        follow: {
            icon: FiUserPlus,
            iconBg: 'bg-purple-50',
            iconColor: 'text-purple-500',
            title: 'برای دنبال کردن وارد شوید',
            description: 'برای دنبال کردن کاربران و دیدن پین‌های جدیدشون، وارد حساب کاربری خود شوید.',
            gradient: 'from-purple-600 to-fuchsia-600',
        },
    }

    // ═══════════════ QUERIES ═══════════════

    // ── Query ۱: اطلاعات پین ──
    const {
        data: pinData,
        isLoading: loading,
        isError,
        error,
    } = useQuery<PinResponse>({
        queryKey: ['pin', id],
        queryFn: async () => {
            const res = await fetch(`/api/pins/${id}`)
            if (!res.ok) throw new Error('پین یافت نشد')
            return res.json()
        },
        enabled: !!id,
        staleTime: 60 * 1000,
    })

    const pin = pinData?.pin
    const savedBoards = pin?.savedBoards ?? []
    const isLiked = pin?.isLikedByMe ?? false
    const totalLikes = pin?.totalLikes ?? 0

    // ── Query ۲: بردهای کاربر (فقط وقتی دراپ‌داون بازه) ──
    const { data: boardsRaw = [], isLoading: loadingBoards } = useQuery<any[]>({
        queryKey: ['boards'],
        queryFn: async () => {
            const res = await fetch('/api/boards')
            if (!res.ok) throw new Error('خطا')
            return res.json()
        },
        enabled: !!user && saveOpen,
        staleTime: 60 * 1000,
    })

    const boards = boardsRaw.map((b) => ({
        id: b.id,
        name: b.name,
        thumbnail: b.pins?.[0]?.imageUrl || '/placeholder.jpg',
    }))

    // ── Query ۳: پین‌های مرتبط ──
    const { data: relatedPins = [], isLoading: loadingRelated } = useQuery<any[]>({
        queryKey: ['related-pins', id],
        queryFn: async () => {
            const res = await fetch(`/api/pins/${id}/related`)
            if (!res.ok) throw new Error('خطا')
            const data = await res.json()
            return data.pins || []
        },
        enabled: !!id,
        staleTime: 5 * 60 * 1000,
    })

    // ── Query ۴: وضعیت فالو کاربر مقابل ──
    const { data: followData } = useQuery<{
        isFollowing: boolean
        followersCount: number
    }>({
        queryKey: ['follow-status', pin?.userId],
        queryFn: async () => {
            const res = await fetch(`/api/users/${pin!.userId}/follow`)
            if (!res.ok) throw new Error('خطا')
            return res.json()
        },
        enabled: !!pin?.userId && !!user,
        staleTime: 60 * 1000,
    })

    const isFollowed = followData?.isFollowing ?? false
    const followersCount = followData?.followersCount ?? 0

    // ═══════════════ MUTATIONS ═══════════════

    // ── Mutation: لایک (با Optimistic Update) ──
    const likeMutation = useMutation({
        mutationFn: async () => {
            const res = await fetch(`/api/pins/${pin!.id}/like`, { method: 'POST' })
            if (!res.ok) throw new Error('خطا در لایک')
            return res.json() as Promise<{ isLiked: boolean; totalLikes: number }>
        },
        onMutate: async () => {
            // جلوی fetch های در حال اجرا رو بگیر
            await queryClient.cancelQueries({ queryKey: ['pin', id] })

            // وضعیت فعلی cache رو نگه دار
            const previous = queryClient.getQueryData<PinResponse>(['pin', id])

            // UI رو فوری آپدیت کن (Optimistic)
            queryClient.setQueryData<PinResponse>(['pin', id], (old) => {
                if (!old) return old
                const wasLiked = old.pin.isLikedByMe
                return {
                    ...old,
                    pin: {
                        ...old.pin,
                        isLikedByMe: !wasLiked,
                        totalLikes: wasLiked ? old.pin.totalLikes - 1 : old.pin.totalLikes + 1,
                    },
                }
            })

            return { previous }
        },
        onError: (_err, _vars, context) => {
            // اگه خطا داد، UI رو برگردون به حالت قبل
            if (context?.previous) {
                queryClient.setQueryData(['pin', id], context.previous)
            }
        },
        onSettled: () => {
            // در هر صورت، با سرور همگام کن
            queryClient.invalidateQueries({ queryKey: ['pin', id] })
        },
    })

    // ── Mutation: فالو/آنفالو ──
    const followMutation = useMutation({
        mutationFn: async () => {
            const res = await fetch(`/api/users/${pin!.userId}/follow`, { method: 'POST' })
            if (!res.ok) throw new Error('خطا در فالو')
            return res.json() as Promise<{ isFollowing: boolean; followersCount: number }>
        },
        onSuccess: (data) => {
            queryClient.setQueryData(['follow-status', pin!.userId], data)
        },
    })

    // ── Mutation: ذخیره/حذف از برد (با Optimistic Update) ──
    const saveMutation = useMutation({
        mutationFn: async ({ boardId, isSaved }: { boardId: string; isSaved: boolean }) => {
            const res = await fetch('/api/saves', {
                method: isSaved ? 'DELETE' : 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ pinId: pin!.id, boardId }),
            })
            if (!res.ok) throw new Error('خطا در ذخیره')
            return { boardId, isSaved }
        },
        onMutate: async ({ boardId, isSaved }) => {
            await queryClient.cancelQueries({ queryKey: ['pin', id] })
            const previous = queryClient.getQueryData<PinResponse>(['pin', id])

            queryClient.setQueryData<PinResponse>(['pin', id], (old) => {
                if (!old) return old
                let newSavedBoards: SavedBoard[]
                if (isSaved) {
                    newSavedBoards = old.pin.savedBoards.filter((sb) => sb.boardId !== boardId)
                } else {
                    const board = boards.find((b) => b.id === boardId)
                    newSavedBoards = [
                        ...old.pin.savedBoards,
                        { boardId, boardName: board?.name || '' },
                    ]
                }
                return {
                    ...old,
                    pin: { ...old.pin, savedBoards: newSavedBoards },
                }
            })

            return { previous }
        },
        onError: (_err, _vars, context) => {
            if (context?.previous) {
                queryClient.setQueryData(['pin', id], context.previous)
            }
        },
        onSettled: () => {
            queryClient.invalidateQueries({ queryKey: ['pin', id] })
            queryClient.invalidateQueries({ queryKey: ['saved-pins'] })
            queryClient.invalidateQueries({ queryKey: ['boards'] })
        },
    })

    const handleDownload = async () => {
        if (!pin || isDownloading) return
        setIsDownloading(true)

        const rawName = (pin.title || 'pin').trim() || 'pin'
        const ext = pin.imageUrl.split('.').pop()?.split('?')[0] || 'jpg'
        const filename = `${rawName}.${ext}`

        try {
            const res = await fetch(pin.imageUrl)
            if (!res.ok) throw new Error('خطا در دریافت تصویر')

            const blob = await res.blob()
            const blobUrl = URL.createObjectURL(blob)

            const link = document.createElement('a')
            link.href = blobUrl
            link.download = filename
            document.body.appendChild(link)
            link.click()
            document.body.removeChild(link)

            URL.revokeObjectURL(blobUrl)
        } catch (error) {
            console.error('خطا در دانلود:', error)
            showToast('دانلود ناموفق بود')
        } finally {
            setIsDownloading(false)
        }
    }

    // ═══════════════ HANDLERS ═══════════════

    const toggleSave = () => {
        if (!user) {
            setLoginAction('save')
            return
        }
        setSaveOpen((prev) => !prev)
    }

    const handleToggleBoard = (boardId: string, boardName: string) => {
        const isSaved = savedBoards.some((sb) => sb.boardId === boardId)
        saveMutation.mutate({ boardId, isSaved })
    }

    const handleLike = () => {
        if (!user) {
            setLoginAction('like')
            return
        }
        likeMutation.mutate()
    }

    const handleFollow = () => {
        if (!user) {
            setLoginAction('follow')
            return
        }
        followMutation.mutate()
    }

    const showToast = (message: string) => {
        setToast(message)
        setTimeout(() => setToast(''), 2000)
    }

    const handleShare = async () => {
        const url = window.location.href
        const title = pin!.title

        if (navigator.share) {
            try {
                await navigator.share({ title, url })
                return
            } catch {
                return
            }
        }

        try {
            if (navigator.clipboard && window.isSecureContext) {
                await navigator.clipboard.writeText(url)
            } else {
                const textarea = document.createElement('textarea')
                textarea.value = url
                textarea.style.position = 'fixed'
                textarea.style.opacity = '0'
                document.body.appendChild(textarea)
                textarea.focus()
                textarea.select()
                document.execCommand('copy')
                document.body.removeChild(textarea)
            }
            showToast('لینک کپی شد !')
        } catch {
            showToast('کپی لینک ناموفق بود')
        }
    }

    // ═══════════════ RENDER ═══════════════

    if (loading) {
        return (
            <main dir="rtl" className="min-h-screen flex items-center justify-center bg-gradient-to-br from-red-50 via-white to-orange-50">
                <Spinner size="md" />
            </main>
        )
    }

    if (isError || !pin) {
        return (
            <main dir="rtl" className="min-h-screen flex flex-col items-center justify-center gap-5 px-4 bg-gradient-to-br from-red-50 via-white to-orange-50">
                <div className="w-20 h-20 rounded-3xl bg-white shadow-lg ring-1 ring-black/5 flex items-center justify-center">
                    <FiFolder className="w-9 h-9 text-red-300" />
                </div>
                <div className="text-center">
                    <p className="text-gray-800 font-bold text-xl mb-1">
                        {(error as Error)?.message || 'پین یافت نشد'}
                    </p>
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
        <main dir="rtl" className="relative min-h-screen overflow-hidden bg-gradient-to-br from-red-50/60 via-white to-orange-50/50 py-6 md:py-10 px-2">
            <div className="absolute -top-32 -left-32 w-96 h-96 bg-red-100/50 rounded-full blur-3xl pointer-events-none" />
            <div className="absolute -bottom-32 -right-32 w-[28rem] h-[28rem] bg-orange-100/40 rounded-full blur-3xl pointer-events-none" />

            <div className="relative max-w-[1400px] mx-auto">
                <button
                    onClick={() => router.back()}
                    className="inline-flex cursor-pointer items-center gap-2 text-gray-600 hover:text-gray-900 transition-all mb-6 group bg-white/80 backdrop-blur-md px-5 py-2.5 rounded-full shadow-sm ring-1 ring-black/5 hover:shadow-md"
                >
                    <FiArrowRight className="transition-transform group-hover:-translate-x-1" />
                    <span className="font-medium text-xs md:text-sm">بازگشت</span>
                </button>

                <div className="bg-white/90 backdrop-blur-xl rounded-[2rem] shadow-2xl ring-1 ring-black/5 overflow-hidden">
                    <div className="grid grid-cols-1 lg:grid-cols-2 items-stretch">
                        {/* ستون تصویر */}
                        <div className="relative bg-gray-50 p-4 sm:p-6 flex items-center justify-center lg:border-l lg:border-gray-100">
                            <div className="relative w-full group rounded-2xl overflow-hidden shadow-xl ring-1 ring-black/5">
                                <Image
                                    src={pin.imageUrl}
                                    alt={pin.title}
                                    width={pin.imageWidth || 800}
                                    height={pin.imageHeight || 1200}
                                    sizes="(max-width:1021px) 100vw, 50vw"
                                    priority
                                    style={{ width: '100%', height: 'auto' }}
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
                                                <Image src={pin.owner.avatar} alt={pin.owner.name} className="w-full h-full object-cover" width={56} height={56} />
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
                                        disabled={followMutation.isPending}
                                        className={`shrink-0 flex items-center gap-1.5 px-4 py-2.5 rounded-full font-semibold text-xs transition-all ${isFollowed
                                            ? 'bg-gray-100 text-gray-600 hover:bg-gray-200'
                                            : 'bg-red-600 text-white hover:bg-red-700 shadow-lg shadow-red-200/70'
                                            } ${followMutation.isPending ? 'opacity-60 cursor-not-allowed' : ''}`}
                                    >
                                        {followMutation.isPending ? (
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
                                <h1 className="text-xl md:text-3xl font-extrabold text-gray-900 leading-snug mb-2.5">
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
                                        className={`relative group flex items-center gap-2 px-4 py-2.5 rounded-full font-bold text-sm transition-all duration-300 cursor-pointer active:scale-95 ${isLiked
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
                                            className={`w-[18px] h-[18px] transition-colors ${isLiked
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
                                        onClick={handleShare}
                                        className="flex items-center gap-2 px-4 py-2.5 rounded-full font-bold text-sm bg-gray-50 text-gray-600 ring-1 ring-gray-200 hover:bg-blue-50 hover:text-blue-600 hover:ring-blue-200 transition-all duration-300 cursor-pointer active:scale-95"
                                    >
                                        <FiShare2 className="w-[18px] h-[18px] text-gray-400 group-hover:text-blue-500" />
                                        <span className="hidden sm:inline text-gray-500 text-xs font-semibold">اشتراک‌گذاری</span>
                                    </button>

                                    <button
                                        title="دانلود تصویر"
                                        onClick={handleDownload}
                                        disabled={isDownloading}
                                        className="flex items-center gap-2 px-4 py-2.5 rounded-full font-bold text-sm bg-gray-50 text-gray-600 ring-1 ring-gray-200 hover:bg-red-50 hover:text-red-600 hover:ring-red-200 transition-all duration-300 cursor-pointer active:scale-95 disabled:opacity-60 disabled:cursor-not-allowed"
                                    >
                                        {isDownloading ? (
                                            <FiLoader className="w-[18px] h-[18px] text-red-500 animate-spin" />
                                        ) : (
                                            <FiDownload className="w-[18px] h-[18px] text-gray-400 group-hover:text-red-500" />
                                        )}
                                        <span className="hidden sm:inline text-gray-500 text-xs font-semibold">
                                            {isDownloading ? 'در حال دانلود...' : 'دانلود'}
                                        </span>
                                    </button>

                                    <span className="mr-auto hidden md:flex items-center gap-1.5 text-xs text-gray-400 font-medium">
                                        <FiCalendar className="w-3.5 h-3.5" />
                                        {new Date(pin.createdAt).toLocaleDateString('fa-IR')}
                                    </span>
                                </div>
                            </div>

                            {/* بخش کامنت‌ها */}
                            <PinComments
                                pinId={pin.id}
                                onRequireLogin={() => setLoginAction('comment')}  // ✅
                            />

                            {/* دکمه ذخیره و منوی بردها */}
                            <div className="relative p-6 mt-auto bg-gradient-to-t from-gray-50/80 to-transparent">
                                <button
                                    onClick={toggleSave}
                                    className={`w-full text-sm md:text-lg flex items-center justify-between gap-2 px-4 py-4 rounded-2xl font-bold transition-all ${savedBoards.length > 0
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
                                                <Spinner size="md" />
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
                                                {boards.map((board) => {
                                                    const isSaved = savedBoards.some((sb) => sb.boardId === board.id)
                                                    return (
                                                        <button
                                                            key={board.id}
                                                            onClick={() => handleToggleBoard(board.id, board.name)}
                                                            className={`w-full cursor-pointer flex items-center gap-3 px-3 py-2.5 rounded-xl transition-all text-right ${isSaved ? 'bg-red-50/80 text-red-700' : 'hover:bg-gray-50'
                                                                }`}
                                                        >
                                                            <Image
                                                                src={board.thumbnail}
                                                                alt={board.name}
                                                                width={48}
                                                                height={48}
                                                                className="w-12 h-12 rounded-xl object-cover bg-gray-100 ring-1 ring-black/5"
                                                            />
                                                            <span className="flex-1 font-semibold text-sm truncate">{board.name}</span>
                                                            <span
                                                                className={`w-6 h-6 shrink-0 rounded-full flex items-center justify-center transition-all ${isSaved ? 'bg-red-600 scale-100' : 'bg-gray-200 scale-90 opacity-0 group-hover:opacity-100'
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
                <section className="mt-12 px-6  mb-15">
                    <div className="flex items-center gap-3 mb-6">
                        <div className="w-10 h-10 rounded-2xl bg-red-50 flex items-center justify-center">
                            <FiGrid className="w-5 h-5 text-red-600" />
                        </div>
                        <h2 className="text-md md:text-2xl font-extrabold text-gray-900">
                            پین‌های بیشتر !
                        </h2>
                    </div>

                    {loadingRelated ? (
                        <div className="flex justify-center py-12">
                            <Spinner size="md" />
                        </div>
                    ) : (
                        <div className="columns-2 md:columns-3 lg:columns-4 xl:columns-5 gap-4 space-y-4">
                            {relatedPins.map((p) => (
                                <PinCard key={p.id} pin={p} optionsRotationDefault={-60} />
                            ))}
                        </div>
                    )}
                </section>
            )}

            {/* ✅ مودال هوشمند برای اکشن‌های محافظت‌شده */}
            {loginAction && (() => {
                const config = ACTION_CONFIG[loginAction]
                const ActionIcon = config.icon
                return (
                    <div className="fixed inset-0 z-[500] flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm animate-[fadeIn_0.2s_ease-out]">
                        <div className="relative w-full max-w-sm bg-white rounded-3xl shadow-2xl overflow-hidden animate-[fadeInUp_0.3s_ease-out]">

                            {/* نوار رنگی بالای مودال (بر اساس اکشن) */}
                            <div className={`h-1.5 w-full bg-gradient-to-r ${config.gradient}`} />

                            {/* دکمه بستن */}
                            <button
                                onClick={() => setLoginAction(null)}
                                className="absolute top-5 right-4 w-8 h-8 rounded-full bg-gray-100 hover:bg-gray-200 flex items-center justify-center text-gray-500 transition-colors cursor-pointer"
                                aria-label="بستن"
                            >
                                <FiX className="w-4 h-4" />
                            </button>

                            <div className="p-6 text-center">
                                {/* آیکون داینامیک */}
                                <div className={`w-16 h-16 mx-auto mb-4 rounded-2xl ${config.iconBg} flex items-center justify-center rotate-3`}>
                                    <ActionIcon className={`w-8 h-8 ${config.iconColor}`} />
                                </div>

                                {/* متن داینامیک */}
                                <h3 className="text-lg font-extrabold text-gray-900 mb-2">
                                    {config.title}
                                </h3>
                                <p className="text-sm text-gray-500 leading-relaxed mb-6">
                                    {config.description}
                                </p>

                                {/* دکمه‌ها */}
                                <div className="flex gap-3">
                                    <button
                                        onClick={() => setLoginAction(null)}
                                        className="flex-1 py-3 rounded-xl font-bold text-sm bg-gray-100 text-gray-700 hover:bg-gray-200 transition-colors cursor-pointer"
                                    >
                                        انصراف
                                    </button>
                                    <Link
                                        href="/login"
                                        className={`flex-1 py-3 rounded-xl font-bold text-sm bg-gradient-to-r ${config.gradient} text-white shadow-lg hover:shadow-xl hover:-translate-y-0.5 transition-all no-underline flex items-center justify-center gap-2`}
                                    >
                                        <FiLogIn className="w-4 h-4" />
                                        ورود / ثبت‌نام
                                    </Link>
                                </div>
                            </div>
                        </div>
                    </div>
                )
            })()}

            {toast && (
                <div className="fixed bottom-24 left-1/2 -translate-x-1/2 z-[300] animate-[fadeInUp_0.3s_ease-out]">
                    <div className="flex items-center gap-2 bg-white-900/50 backdrop-blur-lg text-red-600 text-sm font-medium px-5 py-3 rounded-full shadow-2xl shadow-black/20 ring-1 ring-white/20">
                        <FiCheckCircle className="w-4 h-4 text-green-400" />
                        {toast}
                    </div>
                </div>
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
                @keyframes fadeIn {
                    from { opacity: 0; }
                    to { opacity: 1; }
                }
                @keyframes fadeOut {
                    from { opacity: 1; }
                    to { opacity: 0; }
                }
            `}</style>
        </main>
    )
}