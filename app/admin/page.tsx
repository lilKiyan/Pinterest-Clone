"use client"

import { useState, useMemo } from 'react'
import Link from 'next/link'
import Image from 'next/image'
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import Spinner from '@/app/components/Spinner'
import dynamic from 'next/dynamic'
import AdminCategoryModal from '../components/AdminCategoryModal'
import { getCategoryIcon } from '@/lib/categories'   // ✅ جدید
import {
    FiShield, FiArrowRight, FiUsers, FiFlag, FiTrash2, FiCheckCircle,
    FiSearch, FiLock, FiX, FiTag, FiImage, FiHeart, FiMessageCircle,
    FiUserX, FiEdit2, FiPlus,
} from 'react-icons/fi'

const EditUserModal = dynamic(() => import('@/app/components/EditUserModal'), { ssr: false })
const DeleteUserModal = dynamic(() => import('@/app/components/DeleteUserModal'), { ssr: false })

// ═══════════ تایپ‌ها ═══════════

type Stats = {
    totalUsers: number
    totalPins: number
    totalReports: number
    pendingReports: number
    totalLikes: number
    totalMessages: number
}

type AdminReport = {
    id: string
    reason: string
    description: string | null
    createdAt: string
    pin: {
        id: string
        title: string
        imageUrl: string
        user: { id: string; username: string; name: string }
    }
    reporter: { id: string; username: string; name: string }
}

type AdminUserRow = {
    id: string
    name: string
    username: string
    avatar: string | null
    email: string
    banned: boolean
    createdAt: string
    _count: { pins: number; followers: number }
}

type CategoryRow = {
    id: string
    slug: string
    name: string
    icon: string
    color: string
    sortOrder: number
    isActive: boolean
    _count: { pins: number }
}

type Tab = 'reports' | 'users' | 'categories'

const REASON_LABELS: Record<string, string> = {
    spam: 'اسپم یا تبلیغات',
    inappropriate: 'محتوای نامناسب',
    violence: 'خشونت یا آزاردهنده',
    hate: 'نفرت‌پراکنی',
    misinformation: 'اطلاعات نادرست',
    other: 'سایر',
}

// ✅ SearchInput — ماژول‌لِوِل (خارج از کامپوننت)
function SearchInput({
    value,
    onChange,
    placeholder,
}: {
    value: string
    onChange: (v: string) => void
    placeholder: string
}) {
    return (
        <div className="relative mb-2">
            <FiSearch className="absolute right-0 top-1/2 -translate-y-1/2 text-gray-300 w-4 h-4 pointer-events-none" />
            <input
                type="text"
                value={value}
                onChange={(e) => onChange(e.target.value)}
                placeholder={placeholder}
                className="w-full bg-transparent pr-7 py-2.5 text-sm text-gray-800 placeholder-gray-300
                    focus:outline-none border-b border-gray-100 focus:border-red-300 transition-colors"
            />
            {value && (
                <button
                    onClick={() => onChange('')}
                    aria-label="پاک کردن"
                    className="absolute left-0 top-1/2 -translate-y-1/2 w-4 h-4 rounded-full bg-gray-200
                        hover:bg-gray-300 text-white flex items-center justify-center transition-colors cursor-pointer"
                >
                    <FiX className="w-2.5 h-2.5" />
                </button>
            )}
        </div>
    )
}

export default function AdminPage() {
    const queryClient = useQueryClient()
    const [tab, setTab] = useState<Tab>('reports')
    const [toast, setToast] = useState('')
    const [actionLoading, setActionLoading] = useState<string | null>(null)
    const [editingUser, setEditingUser] = useState<AdminUserRow | null>(null)
    const [deletingUser, setDeletingUser] = useState<AdminUserRow | null>(null)
    const [reportSearch, setReportSearch] = useState('')
    const [userSearch, setUserSearch] = useState('')
    const [editingCategory, setEditingCategory] = useState<CategoryRow | null>(null)
    const [creatingCategory, setCreatingCategory] = useState(false)
    const [categorySearch, setCategorySearch] = useState<string>('')

    const showToast = (msg: string) => {
        setToast(msg)
        setTimeout(() => setToast(''), 2500)
    }

    // ── Query: آمار (+ گارد دسترسی) ──
    const {
        data: statsData,
        isLoading: loadingStats,
        isError: statsError,
    } = useQuery<{ stats: Stats }>({
        queryKey: ['admin-stats'],
        queryFn: async () => {
            const res = await fetch('/api/admin/stats')
            if (!res.ok) throw new Error(res.status === 403 ? 'دسترسی ندارید' : 'خطا')
            return res.json()
        },
        staleTime: 30 * 1000,
    })

    // ── Query: گزارش‌های pending ──
    const {
        data: reportsData,
        isLoading: loadingReports,
    } = useQuery<{ reports: AdminReport[] }>({
        queryKey: ['admin-reports'],
        queryFn: async () => {
            const res = await fetch('/api/admin/reports')
            if (!res.ok) throw new Error('خطا')
            return res.json()
        },
        enabled: !!statsData && tab === 'reports',
    })

    // ── Query: کاربران ──
    const {
        data: usersData,
        isLoading: loadingUsers,
    } = useQuery<{ users: AdminUserRow[] }>({
        queryKey: ['admin-users'],
        queryFn: async () => {
            const res = await fetch('/api/admin/users')
            if (!res.ok) throw new Error('خطا')
            return res.json()
        },
        enabled: !!statsData && tab === 'users',
    })

    // ✅ Query: دسته‌ها — قبل از useMemo ای که ازش استفاده می‌کند!
    const {
        data: categoriesData,
        isLoading: loadingCategories,
    } = useQuery<{ categories: CategoryRow[] }>({
        queryKey: ['admin-categories'],
        queryFn: async () => {
            const res = await fetch('/api/admin/categories')
            if (!res.ok) throw new Error('خطا')
            return res.json()
        },
        enabled: !!statsData && tab === 'categories',
    })

    // ── Mutation: رسیدگی به گزارش ──
    const reportActionMutation = useMutation({
        mutationFn: async ({ reportId, action }: { reportId: string; action: 'delete-pin' | 'dismiss' }) => {
            const res = await fetch('/api/admin/reports', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ reportId, action }),
            })
            if (!res.ok) {
                const data = await res.json()
                throw new Error(data.error || 'خطا')
            }
            return res.json()
        },
        onSuccess: (data) => {
            queryClient.invalidateQueries({ queryKey: ['admin-reports'] })
            queryClient.invalidateQueries({ queryKey: ['admin-stats'] })
            queryClient.invalidateQueries({ queryKey: ['pins'] })
            showToast(data.message)
        },
        onError: (err: Error) => showToast(err.message),
    })

    // ── Mutation: ban/unban ──
    const banMutation = useMutation({
        mutationFn: async ({ userId, banned }: { userId: string; banned: boolean }) => {
            const res = await fetch('/api/admin/users', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ userId, banned }),
            })
            if (!res.ok) {
                const data = await res.json()
                throw new Error(data.error || 'خطا')
            }
            return res.json()
        },
        onSuccess: (data) => {
            queryClient.invalidateQueries({ queryKey: ['admin-users'] })
            showToast(data.message)
        },
        onError: (err: Error) => showToast(err.message),
    })

    // ── Mutation: ذخیره دسته (ساخت/ویرایش) ──
    const saveCategoryMutation = useMutation({
        mutationFn: async (body: Record<string, unknown>) => {
            const isEdit = !!body.id
            const res = await fetch(
                isEdit ? `/api/admin/categories/${body.id}` : '/api/admin/categories',
                {
                    method: isEdit ? 'PATCH' : 'POST',
                    headers: { 'Content-Type': 'application/json' },
                    body: JSON.stringify(body),
                }
            )
            if (!res.ok) {
                const data = await res.json()
                throw new Error(data.error || 'خطا')
            }
            return res.json()
        },
        onSuccess: (data) => {
            queryClient.invalidateQueries({ queryKey: ['admin-categories'] })
            queryClient.invalidateQueries({ queryKey: ['admin-stats'] })
            showToast(data.message)
        },
        onError: (err: Error) => showToast(err.message),
    })

    // ── Mutation: حذف دسته ──
    const deleteCategoryMutation = useMutation({
        mutationFn: async (id: string) => {
            const res = await fetch(`/api/admin/categories/${id}`, { method: 'DELETE' })
            if (!res.ok) {
                const data = await res.json()
                throw new Error(data.error || 'خطا')
            }
            return res.json()
        },
        onSuccess: (data) => {
            queryClient.invalidateQueries({ queryKey: ['admin-categories'] })
            showToast(data.message)
        },
        onError: (err: Error) => showToast(err.message),
    })

    const handleReportAction = (reportId: string, action: 'delete-pin' | 'dismiss') => {
        setActionLoading(reportId)
        reportActionMutation.mutate(
            { reportId, action },
            { onSettled: () => setActionLoading(null) }
        )
    }

    const handleBan = (userId: string, banned: boolean) => {
        setActionLoading(userId)
        banMutation.mutate(
            { userId, banned },
            { onSettled: () => setActionLoading(null) }
        )
    }

    // ✅ فیلترها — بعد از کوئری‌ها (رفع ارور used before declaration)
    const filteredReports = useMemo(() => {
        const reports = reportsData?.reports ?? []
        const q = reportSearch.trim().toLowerCase()
        if (!q) return reports

        return reports.filter(
            (r) =>
                r.pin.title.toLowerCase().includes(q) ||
                r.pin.user.name.toLowerCase().includes(q) ||
                r.pin.user.username.toLowerCase().includes(q) ||
                (REASON_LABELS[r.reason] || r.reason).toLowerCase().includes(q) ||
                r.reporter.name.toLowerCase().includes(q)
        )
    }, [reportsData, reportSearch])

    const filteredUsers = useMemo(() => {
        const users = usersData?.users ?? []
        const q = userSearch.trim().toLowerCase()
        if (!q) return users

        return users.filter(
            (u) =>
                u.name.toLowerCase().includes(q) ||
                u.username.toLowerCase().includes(q) ||
                u.email.toLowerCase().includes(q)
        )
    }, [usersData, userSearch])

    const filteredCategories = useMemo(() => {
        const cats = categoriesData?.categories ?? []
        const q = categorySearch.trim().toLowerCase()
        if (!q) return cats
        return cats.filter(
            (c) =>
                c.name.toLowerCase().includes(q) ||
                c.slug.toLowerCase().includes(q)
        )
    }, [categoriesData, categorySearch])

    // ✅ تفکیک «جستجوی بی‌نتیجه» از «واقعاً خالی»
    const reportsSearchEmpty =
        !!reportsData && reportSearch.trim() !== '' && filteredReports.length === 0

    const stats = statsData?.stats

    return (
        <div dir="rtl" className="relative min-h-screen bg-gradient-to-b from-gray-50 to-white px-4 py-8 pb-24">
            <div className="absolute -top-24 -right-24 w-80 h-80 bg-red-100/50 rounded-full blur-3xl pointer-events-none" />

            <div className="relative max-w-6xl mx-auto mb-20">

                {/* ═══ هدر ═══ */}
                <div className="flex items-center justify-between mb-10 animate-[fadeSlide_0.4s_ease-out_both]">
                    <div className="flex items-center gap-2">
                        <Link
                            href="/"
                            aria-label="بازگشت به خانه"
                            className="group w-10 h-10 shrink-0 rounded-xl
                                flex items-center justify-center
                                text-gray-400 hover:text-white
                                ring-1 ring-gray-200 hover:ring-gray-900
                                bg-white hover:bg-gray-900
                                transition-all duration-300
                                hover:shadow-lg hover:shadow-gray-900/20
                                active:scale-90"
                        >
                            <FiArrowRight className="w-4 h-4 transition-transform duration-300" />
                        </Link>
                        <div className="relative">
                            <div className="w-11 h-11 rounded-2xl bg-gray-900 flex items-center justify-center">
                                <FiShield className="w-5 h-5 text-white" />
                            </div>
                            <span className="absolute -top-0.5 -left-0.5 flex">
                                <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-green-400 opacity-60" />
                                <span className="relative inline-flex w-3 h-3 rounded-full bg-green-500 ring-2 ring-white" />
                            </span>
                        </div>

                        <div>
                            <h1 className="text-sm sm:text-xl font-bold text-gray-900 tracking-tight flex items-center gap-2">
                                پنل مدیریت
                            </h1>
                            <p className="text-xs md:text-[13px] text-gray-400">
                                {stats ? 'همه‌چیز تحت نظارت است' : 'در حال بررسی...'}
                            </p>
                        </div>
                    </div>
                </div>

                {/* ═══ دسترسی ندارید ═══ */}
                {statsError && (
                    <div className="flex flex-col items-center justify-center py-28 text-center">
                        <div className="relative mb-6 animate-[lockIn_0.5s_cubic-bezier(0.34,1.56,0.64,1)_both]">
                            <span className="absolute inset-0 rounded-full bg-red-500/10
                                animate-[dangerBreathe_2.5s_ease-in-out_infinite] pointer-events-none" />

                            <div className="relative w-20 h-20 rounded-full bg-white
                                shadow-[0_8px_30px_rgba(0,0,0,0.08)] ring-1 ring-red-100
                                flex items-center justify-center
                                animate-[lockShake_0.6s_ease-in-out_0.6s]">
                                <FiLock className="w-8 h-8 text-red-500" />
                            </div>
                        </div>

                        <div className="w-16 h-0.5 bg-gradient-to-l from-red-400 via-red-200 to-red-400 rounded-full mb-6
                            animate-[seamOpen_0.6s_ease-out_0.9s_both]" />

                        <p className="text-lg font-bold text-gray-900
                            animate-[fadeSlide_0.4s_ease-out_1.1s_both]">
                            دسترسی محدود
                        </p>
                        <p className="text-sm text-gray-400 mt-1.5
                            animate-[fadeSlide_0.4s_ease-out_1.25s_both]">
                            این بخش فقط برای مدیران سیستم است
                        </p>

                        <Link
                            href="/"
                            className="mt-7 no-underline inline-flex items-center gap-2 text-sm font-semibold text-gray-500
                                hover:text-red-600 transition-colors
                                animate-[fadeSlide_0.4s_ease-out_1.4s_both]"
                        >
                            <FiArrowRight className="w-4 h-4" />
                            بازگشت به خانه
                        </Link>
                    </div>
                )}

                {/* ═══ لودینگ اولیه ═══ */}
                {loadingStats && !statsError && (
                    <div className="flex justify-center py-24">
                        <Spinner size="lg" />
                    </div>
                )}

                {/* ═══ پنل ═══ */}
                {stats && (
                    <>
                        {/* ── کارت‌های آمار ── */}
                        <div className="grid grid-cols-2 md:grid-cols-3 gap-3 mb-8">
                            {[
                                { icon: FiImage, label: 'پین‌ها', value: stats.totalPins },
                                { icon: FiUsers, label: 'کاربران', value: stats.totalUsers },
                                { icon: FiFlag, label: 'گزارش باز', value: stats.pendingReports, danger: true },
                                { icon: FiHeart, label: 'لایک‌ها', value: stats.totalLikes },
                                { icon: FiMessageCircle, label: 'پیام‌ها', value: stats.totalMessages },
                                { icon: FiFlag, label: 'کل گزارش‌ها', value: stats.totalReports },
                            ].map((s) => (
                                <div
                                    key={s.label}
                                    className={`rounded-2xl ring-1 p-4 flex items-center gap-3 transition-all duration-300 ${s.danger && s.value > 0
                                        ? 'bg-red-50/60 ring-red-200'
                                        : 'bg-white ring-gray-100'
                                        }`}
                                >
                                    <div className={`w-10 h-10 rounded-xl flex items-center justify-center shrink-0 ${s.danger && s.value > 0 ? 'bg-red-100' : 'bg-red-50'}`}>
                                        <s.icon className={`w-4 h-4 ${s.danger && s.value > 0 ? 'text-red-600' : 'text-red-500'}`} />
                                    </div>
                                    <div>
                                        <p className="text-lg font-extrabold text-gray-900 tabular-nums leading-none">
                                            {s.value.toLocaleString('fa-IR')}
                                        </p>
                                        <p className="text-[11px] text-gray-400 font-semibold mt-0.5">{s.label}</p>
                                    </div>
                                </div>
                            ))}
                        </div>

                        {/* ── تب‌ها ── */}
                        <div className="inline-flex items-center gap-1 bg-gray-100 rounded-full p-1 mb-6">
                            <button
                                onClick={() => setTab('reports')}
                                className={`flex items-center gap-2 px-5 py-2 rounded-full text-xs font-bold transition-all cursor-pointer ${tab === 'reports'
                                    ? 'bg-white shadow-sm text-red-600'
                                    : 'text-gray-500 hover:text-gray-800'
                                    }`}
                            >
                                <FiFlag className="w-3.5 h-3.5" />
                                گزارش‌ها
                                {(stats.pendingReports ?? 0) > 0 && (
                                    <span className="bg-red-600 text-white text-[10px] rounded-full px-1.5 min-w-[18px] h-[18px] flex items-center justify-center tabular-nums">
                                        {stats.pendingReports}
                                    </span>
                                )}
                            </button>
                            <button
                                onClick={() => setTab('users')}
                                className={`flex items-center gap-2 px-5 py-2 rounded-full text-xs font-bold transition-all cursor-pointer ${tab === 'users'
                                    ? 'bg-white shadow-sm text-red-600'
                                    : 'text-gray-500 hover:text-gray-800'
                                    }`}
                            >
                                <FiUsers className="w-3.5 h-3.5" />
                                کاربران
                            </button>
                            <button
                                onClick={() => setTab('categories')}
                                className={`flex items-center gap-2 px-5 py-2 rounded-full text-xs font-bold transition-all cursor-pointer ${tab === 'categories'
                                    ? 'bg-white shadow-sm text-red-600'
                                    : 'text-gray-500 hover:text-gray-800'
                                    }`}
                            >
                                <FiTag className="w-3.5 h-3.5" />
                                دسته‌ها
                            </button>
                        </div>

                        {/* ═══ تب گزارش‌ها ═══ */}
                        {tab === 'reports' && (
                            <div className="space-y-2.5">
                                <SearchInput
                                    value={reportSearch}
                                    onChange={setReportSearch}
                                    placeholder="جستجو در گزارش‌ها (عنوان، کاربر، دلیل)..."
                                />
                                {loadingReports ? (
                                    <div className="flex justify-center py-16">
                                        <Spinner size="md" />
                                    </div>
                                ) : filteredReports.length === 0 ? (
                                    reportsSearchEmpty ? (
                                        <div className="py-16 text-center">
                                            <FiSearch className="w-7 h-7 text-gray-200 mx-auto mb-3" />
                                            <p className="text-sm text-gray-400">
                                                گزارشی با «{reportSearch}» پیدا نشد
                                            </p>
                                        </div>
                                    ) : (
                                        <div className="py-20 text-center">
                                            <div className="relative w-20 h-20 mx-auto mb-5">
                                                <span className="absolute inset-0 rounded-full border border-green-200
                                                    animate-[breatheOut_2.4s_ease-out_infinite]" />
                                                <span className="absolute inset-0 rounded-full border border-green-200
                                                    animate-[breatheOut_2.4s_ease-out_1.2s_infinite]" />

                                                <div className="relative w-20 h-20 rounded-full bg-green-50
                                                    flex items-center justify-center">
                                                    <FiCheckCircle className="w-9 h-9 text-green-500" />
                                                </div>
                                            </div>

                                            <p className="text-sm font-semibold text-gray-700">همه‌چیز تحت کنترل است</p>
                                            <p className="text-xs text-gray-300 mt-1.5">گزارش بازی ندارید</p>
                                        </div>
                                    )
                                ) : (
                                    filteredReports.map((report) => {
                                        const isLoading = actionLoading === report.id
                                        return (
                                            <div
                                                key={report.id}
                                                className="bg-white rounded-2xl ring-1 ring-gray-100 hover:ring-red-200/60 p-4 transition-all duration-300"
                                            >
                                                <div className="flex items-center gap-3">
                                                    <div className="relative w-12 h-12 rounded-xl overflow-hidden shrink-0 bg-gray-100 ring-1 ring-black/5">
                                                        <Image
                                                            src={report.pin.imageUrl}
                                                            alt={report.pin.title}
                                                            fill
                                                            sizes="48px"
                                                            className="object-cover"
                                                        />
                                                    </div>
                                                    <div className="flex-1 min-w-0">
                                                        <Link
                                                            href={`/pin/${report.pin.id}`}
                                                            className="no-underline font-bold text-sm text-gray-900 truncate block hover:text-red-600 transition-colors"
                                                        >
                                                            {report.pin.title}
                                                        </Link>
                                                        <p className="text-xs text-gray-400 truncate">
                                                            سازنده: {report.pin.user.name}{' '}
                                                            <span dir="ltr">@{report.pin.user.username}</span>
                                                        </p>
                                                    </div>
                                                    <span className={`shrink-0 inline-flex items-center gap-1 text-[10px] font-bold px-2 py-1 rounded-full ring-1 ${REASON_LABELS[report.reason]
                                                        ? 'bg-red-50 text-red-600 ring-red-100'
                                                        : 'bg-gray-50 text-gray-500 ring-gray-100'
                                                        }`}>
                                                        <FiFlag className="w-3 h-3" />
                                                        {REASON_LABELS[report.reason] || report.reason}
                                                    </span>
                                                </div>

                                                {report.description && (
                                                    <p className="mt-2.5 mr-[60px] text-xs text-gray-600 bg-gray-50 rounded-xl px-3 py-2 leading-relaxed">
                                                        «{report.description}»
                                                    </p>
                                                )}

                                                <div className="mt-3 mr-[60px] flex items-center justify-between gap-2 flex-wrap">
                                                    <p className="text-[11px] text-gray-400">
                                                        گزارش از: <span className="font-semibold text-gray-500">{report.reporter.name}</span>
                                                        {' · '}
                                                        {new Date(report.createdAt).toLocaleDateString('fa-IR')}
                                                    </p>

                                                    <div className="flex items-center gap-2">
                                                        <button
                                                            onClick={() => handleReportAction(report.id, 'dismiss')}
                                                            disabled={isLoading}
                                                            className="inline-flex items-center gap-1.5 px-4 py-2 rounded-full text-xs font-bold
                                                                bg-gray-100 text-gray-600 hover:bg-gray-200
                                                                transition-all cursor-pointer active:scale-95 disabled:opacity-50"
                                                        >
                                                            <FiCheckCircle className="w-3.5 h-3.5" />
                                                            رد گزارش
                                                        </button>
                                                        <button
                                                            onClick={() => handleReportAction(report.id, 'delete-pin')}
                                                            disabled={isLoading}
                                                            className="inline-flex items-center gap-1.5 px-4 py-2 rounded-full text-xs font-bold
                                                                bg-red-600 text-white hover:bg-red-700 shadow-md shadow-red-200/60
                                                                transition-all cursor-pointer active:scale-95 disabled:opacity-50"
                                                        >
                                                            {isLoading ? (
                                                                <span className="w-3.5 h-3.5 border-2 border-white/40 border-t-white rounded-full animate-spin" />
                                                            ) : (
                                                                <FiTrash2 className="w-3.5 h-3.5" />
                                                            )}
                                                            حذف پین
                                                        </button>
                                                    </div>
                                                </div>
                                            </div>
                                        )
                                    })
                                )}
                            </div>
                        )}

                        {/* ═══ تب کاربران ═══ */}
                        {tab === 'users' && (
                            <div className="space-y-2.5">
                                <SearchInput
                                    value={userSearch}
                                    onChange={setUserSearch}
                                    placeholder="جستجوی کاربر (نام، یوزرنیم، ایمیل)..."
                                />
                                {loadingUsers ? (
                                    <div className="flex justify-center py-16">
                                        <Spinner size="md" />
                                    </div>
                                ) : filteredUsers.length === 0 ? (
                                    <div className="py-16 text-center">
                                        <p className="text-sm text-gray-400">
                                            {userSearch
                                                ? `کاربری با «${userSearch}» پیدا نشد`
                                                : 'کاربری ثبت‌نام نکرده'}
                                        </p>
                                    </div>
                                ) : (
                                    filteredUsers.map((user) => {
                                        const isLoading = actionLoading === user.id
                                        return (
                                            <div
                                                key={user.id}
                                                className={`bg-white rounded-2xl ring-1 p-4 flex items-center gap-3.5 transition-all duration-300 ${user.banned
                                                    ? 'ring-red-200 bg-red-50/30 opacity-75'
                                                    : 'ring-gray-100 hover:ring-gray-200'
                                                    }`}
                                            >
                                                <div className="relative w-11 h-11 rounded-full overflow-hidden shrink-0 bg-gradient-to-br from-red-500 to-orange-500 flex items-center justify-center text-white font-bold ring-2 ring-white shadow-md">
                                                    {user.avatar ? (
                                                        <Image
                                                            src={user.avatar}
                                                            alt={user.name}
                                                            width={44}
                                                            height={44}
                                                            className="w-full h-full object-cover"
                                                        />
                                                    ) : (
                                                        user.username?.charAt(0).toUpperCase()
                                                    )}
                                                </div>

                                                <div className="flex-1 min-w-0">
                                                    <div className="flex items-center gap-2">
                                                        <p className={`font-bold text-sm truncate ${user.banned ? 'text-gray-400 line-through' : 'text-gray-900'}`}>
                                                            {user.name}
                                                        </p>
                                                        {user.banned && (
                                                            <span className="shrink-0 text-[9px] font-bold bg-red-100 text-red-600 px-1.5 py-0.5 rounded-md">
                                                                مسدود
                                                            </span>
                                                        )}
                                                    </div>
                                                    <p className="text-xs text-gray-400 truncate" dir="ltr">
                                                        @{user.username} · <span dir="ltr">{user.email}</span>
                                                    </p>
                                                    <p className="text-[11px] text-gray-400 mt-0.5">
                                                        {user._count.pins.toLocaleString('fa-IR')} پین ·{' '}
                                                        {user._count.followers.toLocaleString('fa-IR')} دنبال‌کننده
                                                    </p>
                                                </div>

                                                <div className="shrink-0 flex items-center gap-1.5">
                                                    <button
                                                        onClick={() => setEditingUser(user)}
                                                        disabled={isLoading}
                                                        title="ویرایش کاربر"
                                                        className="w-9 h-9 rounded-full bg-gray-100 text-gray-500 hover:bg-blue-50 hover:text-blue-600 flex items-center justify-center transition-all cursor-pointer active:scale-90 disabled:opacity-50"
                                                    >
                                                        <FiEdit2 className="w-4 h-4" />
                                                    </button>

                                                    <button
                                                        onClick={() => setDeletingUser(user)}
                                                        disabled={isLoading}
                                                        title="حذف کاربر"
                                                        className="w-9 h-9 rounded-full bg-gray-100 text-gray-500 hover:bg-red-50 hover:text-red-600 flex items-center justify-center transition-all cursor-pointer active:scale-90 disabled:opacity-50"
                                                    >
                                                        <FiTrash2 className="w-4 h-4" />
                                                    </button>

                                                    <button
                                                        onClick={() => handleBan(user.id, !user.banned)}
                                                        disabled={isLoading}
                                                        title={user.banned ? 'آزادسازی کاربر' : 'مسدودسازی کاربر'}
                                                        className={`shrink-0 inline-flex items-center gap-1.5 px-4 py-2 rounded-full text-xs font-bold transition-all cursor-pointer active:scale-95 disabled:opacity-50 ${user.banned
                                                            ? 'bg-green-50 text-green-600 ring-1 ring-green-200 hover:bg-green-100'
                                                            : 'bg-gray-100 text-gray-600 ring-1 ring-gray-200 hover:bg-red-50 hover:text-red-600 hover:ring-red-200'
                                                            }`}
                                                    >
                                                        {isLoading ? (
                                                            <span className="w-3.5 h-3.5 border-2 border-current border-t-transparent rounded-full animate-spin" />
                                                        ) : user.banned ? (
                                                            <FiCheckCircle className="w-3.5 h-3.5" />
                                                        ) : (
                                                            <FiUserX className="w-3.5 h-3.5" />
                                                        )}
                                                        <span className="hidden sm:inline">
                                                            {user.banned ? 'آزادسازی' : 'مسدودسازی'}
                                                        </span>
                                                    </button>
                                                </div>
                                            </div>
                                        )
                                    })
                                )}
                            </div>
                        )}

                        {/* ═══ تب دسته‌بندی‌ها ═══ */}
                        {tab === 'categories' && (
                            <div>
                                {/* نوار بالایی: جستجو + دکمه ساخت */}
                                <div className="flex items-center gap-2.5 mb-4">
                                    <div className="relative flex-1 min-w-0">
                                        <FiSearch className="absolute right-3.5 top-1/2 -translate-y-1/2
                                            text-gray-300 w-4 h-4 pointer-events-none" />
                                        <input
                                            type="text"
                                            value={categorySearch}
                                            onChange={(e) => setCategorySearch(e.target.value)}
                                            placeholder="جستجوی دسته‌بندی..."
                                            className="w-full bg-white ring-1 ring-gray-200/80 rounded-full
                                                pr-10 pl-4 py-2.5 text-sm text-gray-800 placeholder-gray-300
                                                focus:outline-none focus:ring-2 focus:ring-red-300/60
                                                transition-all"
                                        />
                                    </div>

                                    <button
                                        onClick={() => setCreatingCategory(true)}
                                        aria-label="دسته‌بندی جدید"
                                        className="shrink-0 w-10 h-10 rounded-full
                                            bg-gray-900 text-white flex items-center justify-center
                                            shadow-md hover:bg-black hover:shadow-lg hover:-translate-y-0.5
                                            active:scale-90 transition-all cursor-pointer"
                                    >
                                        <FiPlus className="w-4 h-4" />
                                    </button>
                                </div>

                                {/* گرید دسته‌ها */}
                                {loadingCategories ? (
                                    <div className="flex justify-center py-16">
                                        <Spinner size="md" />
                                    </div>
                                ) : filteredCategories.length === 0 ? (
                                    <div className="py-16 text-center">
                                        <FiTag className="w-7 h-7 text-gray-200 mx-auto mb-3" />
                                        <p className="text-sm text-gray-400">
                                            {categorySearch
                                                ? 'دسته‌بندی‌ای پیدا نشد'
                                                : 'هنوز دسته‌بندی‌ای ساخته نشده'}
                                        </p>
                                    </div>
                                ) : (
                                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5">
                                        {filteredCategories.map((cat) => {
                                            const isBusy = actionLoading === cat.id
                                            const Icon = getCategoryIcon(cat.icon)
                                            const isProtected = cat.slug === 'other'

                                            return (
                                                <div
                                                    key={cat.id}
                                                    className={`group/cat rounded-2xl p-4 transition-all duration-300
                                                        ${!cat.isActive
                                                            ? 'bg-gray-50 ring-1 ring-gray-100 opacity-70'
                                                            : 'bg-white ring-1 ring-gray-100 hover:ring-gray-200 hover:shadow-sm'
                                                        }`}
                                                >
                                                    <div className="flex items-center gap-3.5">
                                                        <span
                                                            className="w-12 h-12 rounded-2xl flex items-center justify-center shrink-0
                                                                transition-all duration-300 group-hover/cat:scale-110"
                                                            style={{ backgroundColor: `${cat.color}18` }}
                                                        >
                                                            <Icon
                                                                className="w-5 h-5"
                                                                style={{ color: cat.color }}
                                                            />
                                                        </span>

                                                        <div className="flex-1 min-w-0">
                                                            <div className="flex items-center gap-2 flex-wrap">
                                                                <p className="font-bold text-xs md:text-sm text-gray-900 truncate">
                                                                    {cat.name}
                                                                </p>
                                                                {!cat.isActive && (
                                                                    <span className="text-[9px] font-bold bg-gray-100 text-gray-400 px-1.5 py-0.5 rounded-md">
                                                                        غیرفعال
                                                                    </span>
                                                                )}
                                                                {isProtected && (
                                                                    <span className="shrink-0 text-[9px] font-bold bg-blue-50 text-blue-500 px-1.5 py-0.5 rounded-md">
                                                                        پایه
                                                                    </span>
                                                                )}
                                                            </div>
                                                            <p className="text-[11px] text-gray-400 truncate mt-0.5 text-right" dir="ltr">
                                                                /{cat.slug}
                                                            </p>
                                                            <p className="text-[11px] text-gray-400 mt-0.5">
                                                                <span className="font-semibold text-gray-500 tabular-nums">
                                                                    {cat._count.pins.toLocaleString('fa-IR')}
                                                                </span>{' '}
                                                                پین
                                                            </p>
                                                        </div>

                                                        <div className="shrink-0 flex items-center gap-0.5">
                                                            <button
                                                                onClick={() => setEditingCategory(cat)}
                                                                disabled={isBusy}
                                                                title="ویرایش"
                                                                className="w-8 h-8 rounded-lg flex items-center justify-center
                                                                    text-gray-300 hover:text-gray-900 hover:bg-gray-100
                                                                    transition-all cursor-pointer active:scale-90 disabled:opacity-40"
                                                            >
                                                                <FiEdit2 className="w-4 h-4" />
                                                            </button>
                                                            <button
                                                                onClick={() => deleteCategoryMutation.mutate(cat.id)}
                                                                disabled={isBusy || isProtected}
                                                                title={isProtected ? 'دسته پایه قابل حذف نیست' : 'حذف'}
                                                                className="w-8 h-8 rounded-lg flex items-center justify-center
                                                                    text-gray-300 hover:text-red-600 hover:bg-red-50
                                                                    transition-all cursor-pointer active:scale-90
                                                                    disabled:opacity-30 disabled:cursor-not-allowed"
                                                            >
                                                                <FiTrash2 className="w-4 h-4" />
                                                            </button>
                                                        </div>
                                                    </div>
                                                </div>
                                            )
                                        })}
                                    </div>
                                )}
                            </div>
                        )}
                    </>
                )}
            </div>

            {/* ═══ توست ═══ */}
            {toast && (
                <div className="fixed bottom-6 left-1/2 -translate-x-1/2 z-[200] bg-gray-900 text-white text-sm font-medium px-5 py-3 rounded-full shadow-2xl flex items-center gap-2.5 animate-[fadeInUp_0.3s_ease-out]">
                    <FiCheckCircle className="w-4 h-4 text-green-400" />
                    {toast}
                </div>
            )}

            {/* ═══ مودال‌ها ═══ */}
            {editingUser && (
                <EditUserModal
                    userId={editingUser.id}
                    initialName={editingUser.name}
                    initialUsername={editingUser.username}
                    initialBio={null}
                    onClose={() => setEditingUser(null)}
                    onSaved={(message) => {
                        showToast(message)
                        queryClient.invalidateQueries({ queryKey: ['admin-users'] })
                    }}
                />
            )}

            {deletingUser && (
                <DeleteUserModal
                    userId={deletingUser.id}
                    username={deletingUser.username}
                    pinCount={deletingUser._count.pins}
                    onClose={() => setDeletingUser(null)}
                    onDeleted={(message) => {
                        showToast(message)
                        queryClient.invalidateQueries({ queryKey: ['admin-users'] })
                        queryClient.invalidateQueries({ queryKey: ['admin-stats'] })
                    }}
                />
            )}

            {creatingCategory && (
                <AdminCategoryModal
                    category={null}
                    onClose={() => setCreatingCategory(false)}
                    onSaved={(message) => {
                        showToast(message)
                        queryClient.invalidateQueries({ queryKey: ['admin-categories'] })
                    }}
                />
            )}

            {editingCategory && (
                <AdminCategoryModal
                    category={editingCategory}
                    onClose={() => setEditingCategory(null)}
                    onSaved={(message) => {
                        showToast(message)
                        queryClient.invalidateQueries({ queryKey: ['admin-categories'] })
                    }}
                />
            )}

            <style>{`
                @keyframes fadeInUp {
                    from { opacity: 0; transform: translateY(10px); }
                    to   { opacity: 1; transform: translateY(0); }
                }
                @keyframes breatheOut {
                    0%   { transform: scale(0.9); opacity: 0.6; }
                    100% { transform: scale(1.5); opacity: 0; }
                }
                @keyframes lockIn {
                    from { opacity: 0; transform: translateY(20px) scale(0.8); }
                    to   { opacity: 1; transform: translateY(0) scale(1); }
                }
                @keyframes lockShake {
                    0%, 100% { transform: rotate(0deg) translateX(0); }
                    15% { transform: rotate(-6deg) translateX(-4px); }
                    30% { transform: rotate(5deg) translateX(4px); }
                    45% { transform: rotate(-4deg) translateX(-3px); }
                    60% { transform: rotate(3deg) translateX(2px); }
                    75% { transform: rotate(-1deg); }
                }
                @keyframes dangerBreathe {
                    0%, 100% { transform: scale(1); opacity: 0.6; }
                    50%      { transform: scale(1.25); opacity: 0.2; }
                }
                @keyframes seamOpen {
                    from { width: 0; opacity: 0; }
                    to   { width: 64px; opacity: 1; }
                }
                @keyframes fadeSlide {
                    from { opacity: 0; transform: translateY(8px); }
                    to   { opacity: 1; transform: translateY(0); }
                }
                @media (prefers-reduced-motion: reduce) {
                    * { animation: none !important; }
                }
            `}</style>
        </div>
    )
}