"use client"

import { useEffect, useRef, useState } from 'react'
import { createPortal } from 'react-dom'
import {
    FiMoreHorizontal,
    FiDownload,
    FiShare2,
    FiEyeOff,
    FiFlag,
    FiEdit2,
    FiTrash2,
} from 'react-icons/fi'

const RADIUS = 70
const ROTATION_DEFAULT = -75
const ROTATION_RIGHT_EDGE = -270
const EDGE_THRESHOLD = 220

const PUBLIC_OPTIONS = [
    { icon: FiDownload, label: 'دانلود', angle: 15 },
    { icon: FiShare2, label: 'اشتراک‌گذاری', angle: 55 },
    { icon: FiEyeOff, label: 'مخفی کردن', angle: 100 },
    { icon: FiFlag, label: 'گزارش', angle: 145 },
]

const OWNER_OPTIONS = [
    { icon: FiEdit2, label: 'ویرایش', angle: 190 },
    { icon: FiTrash2, label: 'حذف', angle: 235 },
]

const STAGGER_MS = 55
const BUTTON_SIZE = 36

// استایل‌های هاور زیباتر برای هر نوع گزینه
const getIconStyles = (label: string) => {
    if (label === 'حذف') {
        return 'text-red-600 hover:bg-gradient-to-br hover:from-red-100 hover:to-red-200 hover:shadow-[0_8px_25px_rgba(239,68,68,0.4)] hover:ring-2 hover:ring-red-300'
    }
    if (label === 'ویرایش') {
        return 'text-blue-600 hover:bg-gradient-to-br hover:from-blue-100 hover:to-blue-200 hover:shadow-[0_8px_25px_rgba(59,130,246,0.4)] hover:ring-2 hover:ring-blue-300'
    }
    return 'text-gray-700 hover:bg-gradient-to-br hover:from-gray-100 hover:to-gray-200 hover:shadow-[0_8px_25px_rgba(0,0,0,0.2)] hover:ring-2 hover:ring-gray-300'
}

type PinOptionsMenuProps = {
    onEdit?: () => void
    onDelete?: () => void
    isOwner?: boolean
}

const PinOptionsMenu = ({ onEdit, onDelete, isOwner = false }: PinOptionsMenuProps) => {
    const [isOpen, setIsOpen] = useState(false)
    const [visibleOpen, setVisibleOpen] = useState(false)
    const [anchor, setAnchor] = useState<{ top: number; left: number; rotation: number } | null>(null)
    const [mounted, setMounted] = useState(false)

    const triggerRef = useRef<HTMLButtonElement>(null)
    const menuRef = useRef<HTMLDivElement>(null)

    const allOptions = isOwner ? [...PUBLIC_OPTIONS, ...OWNER_OPTIONS] : PUBLIC_OPTIONS

    useEffect(() => setMounted(true), [])

    const updateAnchor = () => {
        if (!triggerRef.current) return
        const rect = triggerRef.current.getBoundingClientRect()
        const spaceRight = window.innerWidth - rect.right
        const rotation = spaceRight < EDGE_THRESHOLD ? ROTATION_RIGHT_EDGE : ROTATION_DEFAULT

        setAnchor({
            top: rect.top + rect.height / 2,
            left: rect.left + rect.width / 2,
            rotation,
        })
    }

    const closeMenu = () => {
        setVisibleOpen(false)
        setTimeout(() => setIsOpen(false), 300)
    }

    const handleToggle = () => {
        if (!isOpen) {
            updateAnchor()
            setIsOpen(true)
            requestAnimationFrame(() => {
                requestAnimationFrame(() => setVisibleOpen(true))
            })
        } else {
            closeMenu()
        }
    }

    useEffect(() => {
        const handleClickOutside = (e: MouseEvent) => {
            const target = e.target as Node
            if (triggerRef.current?.contains(target) || menuRef.current?.contains(target)) return
            closeMenu()
        }
        document.addEventListener('mousedown', handleClickOutside)
        return () => document.removeEventListener('mousedown', handleClickOutside)
    }, [])

    useEffect(() => {
        if (!isOpen) return
        window.addEventListener('scroll', closeMenu, true)
        window.addEventListener('resize', closeMenu)
        return () => {
            window.removeEventListener('scroll', closeMenu, true)
            window.removeEventListener('resize', closeMenu)
        }
    }, [isOpen])

    // ساخت رشته transition کامل
    const getTransitionStyle = (index: number, isOpen: boolean, isVisible: boolean) => {
        const delay = isVisible ? index * STAGGER_MS : (allOptions.length - 1 - index) * STAGGER_MS
        const easing = isOpen ? 'cubic-bezier(0.34, 1.56, 0.64, 1)' : 'cubic-bezier(0.4, 0, 1, 1)'
        return `transform 300ms ${easing} ${delay}ms, opacity 300ms ${easing} ${delay}ms, background-color 200ms ease 0ms, box-shadow 200ms ease 0ms, ring 200ms ease 0ms`
    }

    return (
        <>
            <button
                ref={triggerRef}
                onClick={handleToggle}
                className="group/three-dot relative z-20 px-1.5 py-1.5 rounded-full hover:bg-gray-100 transition-all duration-200 cursor-pointer"
            >
                <FiMoreHorizontal
                    className={`w-5 h-5 text-gray-800 transition-transform duration-300 ${isOpen ? 'rotate-90' : 'group-hover/three-dot:scale-110'
                        }`}
                />
            </button>

            {mounted && anchor && createPortal(
                <div
                    ref={menuRef}
                    style={{ position: 'fixed', top: anchor.top, left: anchor.left }}
                    className="z-[9999] pointer-events-none"
                >
                    {allOptions.map((option, index) => {
                        const angleRad = ((option.angle + anchor.rotation) * Math.PI) / 180
                        const dx = Math.cos(angleRad) * RADIUS
                        const dy = -Math.sin(angleRad) * RADIUS
                        const Icon = option.icon
                        const half = BUTTON_SIZE / 2

                        return (
                            <button
                                key={option.label}
                                title={option.label}
                                onClick={() => {
                                    if (option.label === 'ویرایش' && onEdit) onEdit()
                                    if (option.label === 'حذف' && onDelete) onDelete()
                                    setIsOpen(false)
                                }}
                                style={{
                                    position: 'absolute',
                                    top: 0,
                                    left: 0,
                                    width: BUTTON_SIZE,
                                    height: BUTTON_SIZE,
                                    transform: visibleOpen
                                        ? `translate(${dx - half}px, ${dy - half}px) scale(1)`
                                        : `translate(${-half}px, ${-half}px) scale(0.35)`,
                                    opacity: visibleOpen ? 1 : 0,
                                    transition: getTransitionStyle(index, isOpen, visibleOpen),
                                    pointerEvents: isOpen ? 'auto' : 'none',
                                }}
                                className={`rounded-full bg-white shadow-[0_4px_14px_rgba(0,0,0,0.15)] flex items-center justify-center active:scale-95 cursor-pointer ${getIconStyles(option.label)}`}
                            >
                                <Icon className="w-4 h-4 transition-transform duration-200 group-hover:scale-110" />
                            </button>
                        )
                    })}
                </div>,
                document.body
            )}
        </>
    )
}

export default PinOptionsMenu