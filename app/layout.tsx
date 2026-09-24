import './globals.css'
import Sidebar from './components/Sidebar'
import Navbar from './components/Navbar'
import MobileNav from './components/MobileNav'
import Providers from './providers'

export const metadata = {
  title: 'Pinterest Clone',
  description: 'پلتفرم اشتراک‌گذاری تصویر',
}

export default function RootLayout({
  children,
}: {
  children: React.ReactNode
}) {
  return (
    <html lang="fa" dir="rtl">
      <body className="bg-white text-gray-900 selection:bg-rose-600 selection:text-white">
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