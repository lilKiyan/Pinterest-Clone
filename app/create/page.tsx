"use client"

import { useState } from 'react'
import Link from 'next/link'
import { useRouter } from 'next/navigation'
import { FiArrowRight, FiUpload, FiImage, FiType, FiAlignLeft, FiAlertCircle, FiX, FiFile, FiCheckCircle } from 'react-icons/fi'

export default function CreatePage() {
    const router = useRouter()
    const [title, setTitle] = useState('')
    const [description, setDescription] = useState('')
    const [selectedFile, setSelectedFile] = useState<File | null>(null)
    const [previewUrl, setPreviewUrl] = useState('')
    const [loading, setLoading] = useState(false)
    const [error, setError] = useState('')

    const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        const file = e.target.files?.[0]
        if (!file) return

        setSelectedFile(file)

        const reader = new FileReader()
        reader.onloadend = () => {
            setPreviewUrl(reader.result as string)
        }
        reader.readAsDataURL(file)
    }

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault()
        setError('')

        if (!title.trim() || !selectedFile) {
            setError('عنوان و انتخاب تصویر الزامی است')
            return
        }

        setLoading(true)
        try {
            const formData = new FormData()
            formData.append('file', selectedFile)

            const uploadRes = await fetch('/api/upload', {
                method: 'POST',
                body: formData,
            })

            if (!uploadRes.ok) {
                const uploadData = await uploadRes.json()
                throw new Error(uploadData.error || 'خطا در آپلود تصویر')
            }

            const { imageUrl } = await uploadRes.json()

            const pinRes = await fetch('/api/pins', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    title: title.trim(),
                    description: description.trim(),
                    imageUrl,
                }),
            })

            if (!pinRes.ok) {
                const pinData = await pinRes.json()
                throw new Error(pinData.error || 'خطا در ساخت پین')
            }

            window.location.href = '/'
        } catch (err) {
            setError(err instanceof Error ? err.message : 'خطا')
        } finally {
            setLoading(false)
        }
    }

    // نمایش حجم فایل به صورت خوانا (صرفاً نمایشی)
    const formatFileSize = (bytes: number) => {
        if (bytes < 1024) return `${bytes} بایت`
        if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(0)} کیلوبایت`
        return `${(bytes / (1024 * 1024)).toFixed(1)} مگابایت`
    }

    const isFormValid = title.trim() && selectedFile

    return (
        <main
            dir="rtl"
            className="relative min-h-screen overflow-hidden bg-gradient-to-br from-gray-50 via-white to-red-50/40 px-4 py-8"
        >
            {/* عناصر تزئینی پس‌زمینه */}
            <div className="absolute -top-24 -left-24 w-96 h-96 bg-red-100/50 rounded-full blur-3xl pointer-events-none" />
            <div className="absolute -bottom-32 -right-32 w-[28rem] h-[28rem] bg-orange-100/40 rounded-full blur-3xl pointer-events-none" />

            {/* ── هدر ── */}
            <div className="flex items-center gap-4 mb-12">
                <div className="w-14 h-14 rounded-2xl bg-gradient-to-br from-red-500 to-rose-600 shadow-lg shadow-red-200/60 flex items-center justify-center shrink-0">
                    <FiUpload className="w-6 h-6 text-white" />
                </div>
                <div>
                    <h1 className="text-2xl md:text-3xl font-extrabold bg-gradient-to-l from-red-600 to-rose-600 bg-clip-text text-transparent tracking-tight">
                        ساخت پین جدید
                    </h1>
                    <p className="text-sm text-gray-500 mt-1">
                        یه تصویر انتخاب کن و یه عنوان جذاب براش بذار تا منتشر بشه
                    </p>
                </div>
            </div>
            <div className="relative max-w-4xl mx-auto">

                <form onSubmit={handleSubmit} className="space-y-5">
                    {/* ── خطا ── */}
                    {error && (
                        <div className="flex items-center gap-3 bg-white/90 backdrop-blur-md border border-red-200/80 text-red-600 px-5 py-4 rounded-2xl shadow-lg shadow-red-100/50 animate-[fadeInUp_0.3s_ease-out]">
                            <div className="w-8 h-8 rounded-full bg-red-100 flex items-center justify-center shrink-0">
                                <FiAlertCircle className="w-4.5 h-4.5 w-5 h-5" />
                            </div>
                            <span className="font-semibold text-sm">{error}</span>
                        </div>
                    )}

                    {/* ── کارت اصلی ── */}
                    <div className="bg-white/90 backdrop-blur-xl rounded-[2rem] shadow-xl shadow-gray-200/50 ring-1 ring-black/5 overflow-hidden">
                        <div className="h-1.5 bg-gradient-to-r from-red-500 via-rose-500 to-orange-400" />

                        <div className="p-5 md:p-8">
                            <div className="grid grid-cols-1 lg:grid-cols-[1fr_1.15fr] gap-8">

                                {/* ═══ بخش آپلود تصویر ═══ */}
                                <div>
                                    <div className="flex items-center justify-between mb-2.5">
                                        <label className="flex items-center gap-1.5 text-sm font-semibold text-gray-700">
                                            <span className="w-6 h-6 rounded-lg bg-red-50 text-red-600 flex items-center justify-center text-[11px] font-extrabold">۱</span>
                                            <FiImage className="w-4 h-4 text-gray-400" />
                                            تصویر
                                        </label>
                                        {previewUrl && (
                                            <span className="flex items-center gap-1 text-xs font-bold text-green-600">
                                                <FiCheckCircle className="w-3.5 h-3.5" />
                                                انتخاب شد
                                            </span>
                                        )}
                                    </div>

                                    <label className="group relative flex flex-col items-center justify-center w-full aspect-[4/5] rounded-2xl cursor-pointer overflow-hidden bg-gray-50 border-2 border-dashed transition-all duration-300 border-gray-200 hover:border-red-300 hover:bg-red-50/30 hover:shadow-lg hover:shadow-red-100/40">
                                        {previewUrl ? (
                                            <>
                                                <img
                                                    src={previewUrl}
                                                    alt="پیش‌نمایش"
                                                    className="w-full h-full object-cover transition-transform duration-500 group-hover:scale-[1.03]"
                                                />
                                                <div className="absolute inset-0 bg-black/0 group-hover:bg-black/45 backdrop-blur-[1px] transition-all duration-300 flex items-center justify-center">
                                                    <span className="opacity-0 group-hover:opacity-100 scale-90 group-hover:scale-100 transition-all duration-300 text-white text-sm font-bold flex items-center gap-2 bg-white/15 ring-1 ring-white/30 backdrop-blur-md px-5 py-2.5 rounded-full">
                                                        <FiUpload className="w-4 h-4" />
                                                        تغییر تصویر
                                                    </span>
                                                </div>
                                            </>
                                        ) : (
                                            <div className="flex flex-col items-center px-6 text-center">
                                                <div className="relative mb-4">
                                                    <div className="absolute inset-0 bg-red-200/50 rounded-full blur-xl scale-125 opacity-0 group-hover:opacity-100 transition-opacity duration-300" />
                                                    <div className="relative w-16 h-16 rounded-2xl bg-white shadow-md ring-1 ring-black/5 flex items-center justify-center mb-1 group-hover:scale-110 group-hover:-rotate-6 group-hover:text-red-500 transition-all duration-300">
                                                        <FiUpload className="text-2xl" />
                                                    </div>
                                                </div>
                                                <span className="text-sm font-bold text-gray-700">
                                                    برای انتخاب تصویر کلیک کن
                                                </span>
                                                <span className="text-xs text-gray-400 mt-1.5 bg-white ring-1 ring-gray-100 px-2.5 py-1 rounded-full">
                                                    PNG، JPG یا GIF
                                                </span>
                                            </div>
                                        )}
                                        <input
                                            type="file"
                                            accept="image/*"
                                            onChange={handleFileChange}
                                            className="hidden"
                                        />
                                    </label>

                                    {/* چیپ اطلاعات فایل */}
                                    {selectedFile && (
                                        <div className="mt-3 flex items-center gap-2.5 bg-gray-50 ring-1 ring-gray-100 rounded-xl px-3 py-2.5 animate-[fadeInUp_0.25s_ease-out]">
                                            <div className="w-8 h-8 rounded-lg bg-white ring-1 ring-gray-200 flex items-center justify-center shrink-0">
                                                <FiFile className="w-4 h-4 text-red-500" />
                                            </div>
                                            <div className="min-w-0 flex-1">
                                                <p className="text-xs font-bold text-gray-700 truncate">
                                                    {selectedFile.name}
                                                </p>
                                                <p className="text-[11px] text-gray-400 tabular-nums">
                                                    {formatFileSize(selectedFile.size)}
                                                </p>
                                            </div>
                                            <button
                                                type="button"
                                                onClick={(e) => {
                                                    e.preventDefault()
                                                    setSelectedFile(null)
                                                    setPreviewUrl('')
                                                }}
                                                title="حذف تصویر"
                                                className="shrink-0 w-7 h-7 rounded-lg flex items-center justify-center text-gray-300 hover:text-red-600 hover:bg-red-50 transition-all cursor-pointer active:scale-90"
                                            >
                                                <FiX className="w-4 h-4" />
                                            </button>
                                        </div>
                                    )}
                                </div>

                                {/* ═══ بخش اطلاعات پین ═══ */}
                                <div className="flex flex-col gap-6">
                                    <div>
                                        <label className="flex items-center gap-1.5 text-sm font-semibold text-gray-700 mb-2.5">
                                            <span className="w-6 h-6 rounded-lg bg-red-50 text-red-600 flex items-center justify-center text-[11px] font-extrabold">۲</span>
                                            <FiType className="w-4 h-4 text-gray-400" />
                                            عنوان پین
                                        </label>
                                        <input
                                            type="text"
                                            value={title}
                                            onChange={(e) => setTitle(e.target.value)}
                                            placeholder="مثلاً ایده طراحی اتاق خواب"
                                            className="w-full bg-gray-50 border-2 border-transparent rounded-2xl px-4 py-3.5 text-gray-900 placeholder-gray-400 focus:outline-none focus:bg-white focus:border-red-300 focus:ring-4 focus:ring-red-50 transition-all duration-200"
                                        />
                                    </div>

                                    <div className="flex-1 flex flex-col">
                                        <div className="flex items-center justify-between mb-2.5">
                                            <label className="flex items-center gap-1.5 text-sm font-semibold text-gray-700">
                                                <span className="w-6 h-6 rounded-lg bg-red-50 text-red-600 flex items-center justify-center text-[11px] font-extrabold">۳</span>
                                                <FiAlignLeft className="w-4 h-4 text-gray-400" />
                                                توضیحات
                                                <span className="text-gray-400 font-normal">(اختیاری)</span>
                                            </label>
                                            <span className={`text-xs font-bold tabular-nums px-2 py-0.5 rounded-full transition-colors ${description.length > 0
                                                ? 'bg-red-50 text-red-500 ring-1 ring-red-100'
                                                : 'bg-gray-50 text-gray-300 ring-1 ring-gray-100'
                                                }`}>
                                                {description.length}
                                            </span>
                                        </div>
                                        <textarea
                                            value={description}
                                            onChange={(e) => setDescription(e.target.value)}
                                            rows={6}
                                            placeholder="درباره این پین بنویس..."
                                            className="w-full flex-1 bg-gray-50 border-2 border-transparent rounded-2xl px-4 py-3.5 text-gray-900 placeholder-gray-400 focus:outline-none focus:bg-white focus:border-red-300 focus:ring-4 focus:ring-red-50 transition-all duration-200 resize-none leading-relaxed"
                                        />
                                    </div>
                                </div>
                            </div>
                        </div>
                    </div>

                    {/* ── نوار دکمه‌ها (استیکی) ── */}
                    <div className="sticky bottom-4 z-30">
                        <div className="bg-white/80 backdrop-blur-xl rounded-2xl ring-1 ring-black/5 shadow-2xl shadow-gray-300/40 p-3 flex items-center gap-3">
                            <button
                                type="submit"
                                disabled={loading || !isFormValid}
                                className="flex-1 bg-gradient-to-r from-red-600 to-rose-600 text-white font-bold py-3.5 rounded-xl transition-all duration-200 shadow-lg shadow-red-200/70 hover:shadow-xl hover:shadow-red-300/60 hover:brightness-105 active:scale-[0.99] disabled:opacity-50 disabled:cursor-not-allowed disabled:shadow-none disabled:hover:brightness-100 cursor-pointer flex items-center justify-center gap-2"
                            >
                                {loading ? (
                                    <>
                                        <span className="w-4 h-4 border-2 border-white/40 border-t-white rounded-full animate-spin" />
                                        در حال ساخت...
                                    </>
                                ) : (
                                    <>
                                        <FiUpload className="w-4 h-4" />
                                        انتشار پین
                                    </>
                                )}
                            </button>

                            <Link
                                href="/"
                                className="shrink-0 px-5 py-3.5 bg-gray-100 hover:bg-gray-200 text-gray-700 rounded-xl font-bold text-sm transition-colors no-underline"
                            >
                                انصراف
                            </Link>
                        </div>
                    </div>
                </form>
            </div>

            <style>{`
                @keyframes fadeInUp {
                    from { opacity: 0; transform: translateY(10px); }
                    to   { opacity: 1; transform: translateY(0); }
                }
                @media (prefers-reduced-motion: reduce) {
                    * { animation: none !important; }
                }
            `}</style>
        </main>
    )
}