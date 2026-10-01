"use client"

import { useState } from 'react'
import { FiX, FiSave, FiAlertCircle } from 'react-icons/fi'

type EditUserModalProps = {
    userId: string
    initialName: string
    initialUsername: string
    initialBio: string | null
    onClose: () => void
    onSaved: (message: string) => void
}

export default function EditUserModal({
    userId,
    initialName,
    initialUsername,
    initialBio,
    onClose,
    onSaved,
}: EditUserModalProps) {
    const [name, setName] = useState(initialName)
    const [username, setUsername] = useState(initialUsername)
    const [bio, setBio] = useState(initialBio || '')
    const [newPassword, setNewPassword] = useState('')
    const [saving, setSaving] = useState(false)
    const [error, setError] = useState('')

    const handleSave = async () => {
        setSaving(true)
        setError('')

        try {
            // فقط فیلدهای تغییر یافته را بفرست — PATCH پارسیل است
            const body: Record<string, string> = {}

            if (name.trim() !== initialName) body.name = name.trim()
            if (username.trim() !== initialUsername) body.username = username.trim()
            if (bio.trim() !== (initialBio || '')) body.bio = bio
            if (newPassword) body.newPassword = newPassword

            if (Object.keys(body).length === 0) {
                onClose()
                return
            }

            const res = await fetch(`/api/admin/users/${userId}`, {
                method: 'PATCH',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify(body),
            })

            if (!res.ok) {
                const data = await res.json()
                throw new Error(data.error || 'خطا در ذخیره')
            }

            const data = await res.json()
            onSaved(data.message || 'کاربر به‌روزرسانی شد')
            onClose()
        } catch (err) {
            setError(err instanceof Error ? err.message : 'خطا')
        } finally {
            setSaving(false)
        }
    }

    return (
        <div className="fixed inset-0 z-[100] bg-black/50 backdrop-blur-[2px] flex items-center justify-center p-4">
            <div className="bg-white rounded-3xl shadow-2xl p-6 w-full max-w-md">
                <div className="flex items-center justify-between mb-5">
                    <h2 className="text-lg font-bold text-gray-900">ویرایش کاربر</h2>
                    <button
                        onClick={onClose}
                        aria-label="بستن"
                        className="w-8 h-8 rounded-full flex items-center justify-center text-gray-400 hover:bg-gray-100 hover:text-gray-700 transition-colors cursor-pointer"
                    >
                        <FiX className="w-4 h-4" />
                    </button>
                </div>

                {error && (
                    <div className="flex items-center gap-2.5 bg-red-50 border border-red-200 text-red-600 px-4 py-2.5 rounded-xl text-sm mb-4">
                        <FiAlertCircle className="w-4 h-4 shrink-0" />
                        {error}
                    </div>
                )}

                <div className="space-y-4">
                    {/* نام */}
                    <div>
                        <label className="block text-xs font-semibold text-gray-500 mb-1.5">
                            نام کامل
                        </label>
                        <input
                            type="text"
                            value={name}
                            onChange={(e) => setName(e.target.value)}
                            className="w-full border-2 border-gray-200 rounded-xl px-4 py-3 text-sm text-gray-900 focus:outline-none focus:border-red-400 focus:ring-4 focus:ring-red-100/50 transition-all"
                        />
                    </div>

                    {/* یوزرنیم */}
                    <div>
                        <label className="block text-xs font-semibold text-gray-500 mb-1.5">
                            نام کاربری
                        </label>
                        <input
                            type="text"
                            value={username}
                            onChange={(e) => setUsername(e.target.value)}
                            dir="ltr"
                            className="w-full border-2 border-gray-200 rounded-xl px-4 py-3 text-sm text-gray-900 focus:outline-none focus:border-red-400 focus:ring-4 focus:ring-red-100/50 transition-all text-right"
                        />
                    </div>

                    {/* بیو */}
                    <div>
                        <label className="block text-xs font-semibold text-gray-500 mb-1.5">
                            بیوگرافی
                        </label>
                        <textarea
                            value={bio}
                            onChange={(e) => setBio(e.target.value)}
                            rows={3}
                            className="w-full border-2 border-gray-200 rounded-xl px-4 py-3 text-sm text-gray-900 focus:outline-none focus:border-red-400 focus:ring-4 focus:ring-red-100/50 transition-all resize-none"
                        />
                    </div>

                    {/* پسورد موقت */}
                    <div>
                        <label className="block text-xs font-semibold text-gray-500 mb-1.5">
                            پسورد جدید <span className="text-gray-400 font-normal">(اختیاری — موقت برای کاربر)</span>
                        </label>
                        <input
                            type="text"
                            value={newPassword}
                            onChange={(e) => setNewPassword(e.target.value)}
                            dir="ltr"
                            placeholder="خالی = بدون تغییر"
                            className="w-full border-2 border-gray-200 rounded-xl px-4 py-3 text-sm text-gray-900 placeholder-gray-400 focus:outline-none focus:border-red-400 focus:ring-4 focus:ring-red-100/50 transition-all text-left"
                        />
                        <p className="text-[11px] text-gray-400 mt-1.5">
                            پسورد جدید را به کاربر اطلاع دهید تا از تنظیمات عوضش کند
                        </p>
                    </div>
                </div>

                <div className="flex gap-2.5 mt-6">
                    <button
                        onClick={onClose}
                        className="flex-1 h-11 bg-gray-100 hover:bg-gray-200 text-gray-700 rounded-xl font-semibold text-sm transition-colors cursor-pointer"
                    >
                        انصراف
                    </button>
                    <button
                        onClick={handleSave}
                        disabled={saving}
                        className="flex-1 h-11 bg-red-600 hover:bg-red-700 text-white rounded-xl font-semibold text-sm transition-colors disabled:opacity-50 disabled:cursor-not-allowed cursor-pointer flex items-center justify-center gap-2"
                    >
                        {saving ? (
                            <span className="w-4 h-4 border-2 border-white/40 border-t-white rounded-full animate-spin" />
                        ) : (
                            <FiSave className="w-4 h-4" />
                        )}
                        ذخیره
                    </button>
                </div>
            </div>
        </div>
    )
}