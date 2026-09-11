"use client"

import { useState } from 'react'
import { useRouter } from 'next/navigation'

type Props = {
    pinId: string
    initialTitle: string
    initialDescription?: string
    onClose: () => void
}

export default function EditPinModal({
    pinId,
    initialTitle,
    initialDescription = '',
    onClose,
}: Props) {
    const router = useRouter()
    const [title, setTitle] = useState(initialTitle)
    const [description, setDescription] = useState(initialDescription)
    const [saving, setSaving] = useState(false)
    const [error, setError] = useState('')

    const handleSave = async () => {
        setSaving(true)
        setError('')
        try {
            const res = await fetch(`/api/pins/${pinId}`, {
                method: 'PATCH',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ title, description }),
            })
            if (!res.ok) throw new Error('خطا در ویرایش پین')
            router.refresh()
            onClose()
        } catch (err) {
            setError(err instanceof Error ? err.message : 'خطا')
        } finally {
            setSaving(false)
        }
    }

    return (
        <div className="fixed inset-0 z-[100] bg-black/50 backdrop-blur-[2px] flex items-center justify-center p-4 mb-0">
            <div className="bg-white rounded-3xl shadow-2xl p-6 w-full max-w-md">
                <h2 className="text-lg font-bold text-gray-900 mb-5">ویرایش پین</h2>

                {error && (
                    <div className="bg-red-50 border border-red-200 text-red-600 px-4 py-2.5 rounded-xl text-sm mb-4">
                        {error}
                    </div>
                )}

                <label className="block text-xs font-semibold text-gray-500 mb-1.5">عنوان</label>
                <input
                    type="text"
                    value={title}
                    onChange={(e) => setTitle(e.target.value)}
                    className="w-full border-2 border-gray-200 rounded-xl px-4 py-3 mb-4 text-gray-900 placeholder-gray-400 focus:outline-none focus:border-red-400 focus:ring-4 focus:ring-red-100 transition-all"
                    placeholder="عنوان"
                />

                <label className="block text-xs font-semibold text-gray-500 mb-1.5">توضیحات</label>
                <textarea
                    value={description}
                    onChange={(e) => setDescription(e.target.value)}
                    rows={4}
                    className="w-full border-2 border-gray-200 rounded-xl px-4 py-3 mb-6 text-gray-900 placeholder-gray-400 focus:outline-none focus:border-red-400 focus:ring-4 focus:ring-red-100 transition-all resize-none"
                    placeholder="توضیحات"
                />

                <div className="flex gap-2.5">
                    <button
                        onClick={handleSave}
                        disabled={saving}
                        className="flex-1 h-11 bg-red-600 hover:bg-red-700 text-white rounded-xl font-semibold text-sm transition-colors cursor-pointer disabled:opacity-60"
                    >
                        {saving ? 'در حال ذخیره...' : 'ذخیره'}
                    </button>
                    <button
                        onClick={onClose}
                        className="flex-1 h-11 bg-gray-100 hover:bg-gray-200 text-gray-700 rounded-xl font-semibold text-sm transition-colors cursor-pointer"
                    >
                        انصراف
                    </button>
                </div>
            </div>
        </div>
    )
}