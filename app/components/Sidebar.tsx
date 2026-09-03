"use client"

import Link from "next/link";
import { usePathname } from "next/navigation";
import { Home, Plus, Bell, MessageCircle, Settings } from 'lucide-react'
import { FiGrid } from 'react-icons/fi'

type Board = {
    id: string,
    name: string
}

const boards: Board[] = [
    { id: '1', name: 'MEME' },
    { id: '2', name: 'UI Design' },
    { id: '3', name: 'Nature' },
    { id: '4', name: 'Food' },
]

// آیتم‌های ناوبری به یه آرایه منتقل شدن تا هم تکرار کد کمتر بشه هم تشخیص لینک فعال ساده‌تر باشه
const navItems = [
    { href: '/', icon: Home, label: 'خانه' },
    { href: '/myboards', icon: FiGrid, label: 'بردهای من' },
    { href: '/create', icon: Plus, label: 'ساخت پین' },
    { href: '/updates', icon: Bell, label: 'اعلان‌ها' },
    { href: '/messages', icon: MessageCircle, label: 'پیام‌ها' },
]

const ITEM_HEIGHT = 48
const ITEM_GAP = 8

// چون '/' زیرمجموعه‌ی همه‌چیزه، باید دقیق چک بشه؛ بقیه‌ی مسیرها با startsWith هم زیرصفحه‌هاشون رو فعال نشون میدن
const isPathActive = (pathname: string, href: string) => {
    if (href === '/') return pathname === '/'
    return pathname === href || pathname.startsWith(`${href}/`)
}

const Sidebar = () => {
    const pathname = usePathname()
    const activeIndex = navItems.findIndex((item) => isPathActive(pathname, item.href))
    const isSettingsActive = isPathActive(pathname, '/settings')

    return (
        <aside className="sticky top-0 h-screen shrink-0 w-20 bg-white shadow-[0_0_0_1px_rgba(0,0,0,0.05)] flex flex-col items-center py-4 z-50">
            <Link href="/">
                <div className="w-12 h-12 rounded-full bg-red-600 flex items-center justify-center text-white text-2xl font-bold mb-6 shadow-lg shadow-red-100 hover:scale-105 active:scale-95 transition-transform cursor-pointer">
                    <span className="h-[25px]">P</span>
                </div>
            </Link>

            <nav className="relative flex-1 flex flex-col items-center gap-2 w-full px-2">
                {/* اندیکاتور متحرک پشت آیتم فعال؛ فقط با تغییر top سُر می‌خوره */}
                {activeIndex !== -1 && (
                    <div
                        className="absolute right-2 left-2 rounded-xl bg-red-50 transition-all duration-300 ease-out pointer-events-none"
                        style={{
                            height: ITEM_HEIGHT,
                            top: activeIndex * (ITEM_HEIGHT + ITEM_GAP),
                        }}
                    />
                )}

                {navItems.map((item) => {
                    const active = isPathActive(pathname, item.href)
                    const Icon = item.icon
                    return (
                        <Link
                            key={item.href}
                            href={item.href}
                            className="group relative z-10 flex items-center justify-center w-12 h-12 rounded-xl transition-colors hover:bg-gray-100"
                        >
                            <Icon
                                className={`w-6 h-6 transition-all duration-200 ${active ? 'text-red-600 scale-105' : 'text-gray-700'
                                    }`}
                            />

                            {/* تولتیپ موقع هاور */}
                            <span className="pointer-events-none absolute left-full ml-3 whitespace-nowrap bg-gray-900 text-white text-xs font-medium px-2.5 py-1.5 rounded-lg opacity-0 translate-x-1 group-hover:opacity-100 group-hover:translate-x-0 transition-all duration-200">
                                {item.label}
                            </span>
                        </Link>
                    )
                })}
            </nav>

            <Link
                href="/settings"
                className="group relative flex items-center justify-center w-12 h-12 rounded-xl transition-colors hover:bg-gray-100"
            >
                {isSettingsActive && (
                    <span className="absolute inset-0 rounded-xl bg-red-50" />
                )}
                <Settings
                    className={`relative w-6 h-6 transition-all duration-200 ${isSettingsActive ? 'text-red-600 scale-105' : 'text-gray-700'
                        }`}
                />
                <span className="pointer-events-none absolute left-full ml-3 whitespace-nowrap bg-gray-900 text-white text-xs font-medium px-2.5 py-1.5 rounded-lg opacity-0 translate-x-1 group-hover:opacity-100 group-hover:translate-x-0 transition-all duration-200">
                    تنظیمات
                </span>
            </Link>
        </aside>
    )
}

export default Sidebar