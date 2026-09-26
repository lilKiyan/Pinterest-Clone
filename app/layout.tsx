import './globals.css'
import Sidebar from './components/Sidebar'
import Navbar from './components/Navbar'
import MobileNav from './components/MobileNav'
import Providers from './providers'
import type { Metadata, Viewport } from 'next'                                    // ✨ ۱
import ServiceWorkerRegister from './components/ServiceWorkerRegister'           // ✨ ۲

export const metadata: Metadata = {
    title: 'Pinverse — پلتفرم اشتراک‌گذاری تصویر',                                // ✨ اسم برند
    description: 'کلون کامل Pinterest — پین، برد، چت و اعلان زنده',
    appleWebApp: {                                                                 // ✨ ۳ — iOS
        capable: true,
        title: 'Pinverse',
        statusBarStyle: 'default',
    },
    icons: {
        icon: '/icons/icon-192.png',                                               // ✨ فاوآیکون واقعی!
    },
}

export const viewport: Viewport = {
    themeColor: '#ffffff',
}

export default function RootLayout({
    children,
}: {
    children: React.ReactNode
}) {
    return (
        <html lang="fa" dir="rtl">
            <body className="bg-white selection:bg-rose-600 selection:text-white text-gray-900">
                <ServiceWorkerRegister />    
                <Providers>
                    <div className="flex h-dvh overflow-hidden">
                        <Sidebar />
                        <div className="flex-1 min-w-0 flex flex-col h-full">
                            <Navbar />
                            <main className="flex-1 min-h-0 overflow-y-auto">{children}</main>
                        </div>
                    </div>
                    <MobileNav />
                </Providers>
            </body>
        </html>
    )
}