"use client"

import { useState } from 'react'
import { FiTrash2 } from 'react-icons/fi'

type Props = {
    pinId: string
    onClose: () => void
    onDeleteSuccess: (pinId: string) => void
}

export default function DeletePinModal({ pinId, onClose, onDeleteSuccess }: Props) {
    const [isDeleting, setIsDeleting] = useState(false)

    const handleDelete = async () => {
        setIsDeleting(true)
        try {
            const res = await fetch(`/api/pins/${pinId}`, { method: 'DELETE' })
            if (!res.ok) throw new Error('خطا در حذف پین')
            onDeleteSuccess(pinId)
            onClose()
        } catch (error) {
            console.error(error)
            setIsDeleting(false)
            onClose()
        }
    }

    return (
        <div className="fixed inset-0 z-[100] bg-black/50 backdrop-blur-[2px] flex items-center justify-center p-4 mb-0">
            <div className="bg-white rounded-3xl shadow-2xl p-6 w-full max-w-sm text-center">
                <div className="w-14 h-14 mx-auto mb-4 bg-red-50 rounded-2xl flex items-center justify-center">
                    <FiTrash2 className="text-red-600 text-xl" />
                </div>
                <h3 className="text-lg font-bold text-gray-900 mb-1.5">حذف پین</h3>
                <p className="text-gray-500 text-sm leading-relaxed mb-6">
                    آیا مطمئن هستید که می‌خواهید این پین را حذف کنید؟
                </p>
                <div className="flex gap-2.5">
                    <button
                        onClick={handleDelete}
                        disabled={isDeleting}
                        className="flex-1 h-11 bg-red-600 hover:bg-red-700 text-white rounded-xl font-semibold text-sm transition-colors disabled:opacity-50 disabled:cursor-not-allowed cursor-pointer"
                    >
                        {isDeleting ? 'در حال حذف...' : 'حذف'}
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