import './globals.css'
import Sidebar from './components/Sidebar'
import Navbar from './components/Navbar'
import MobileNav from './components/MobileNav'

export default function RootLayout({
  children,
}: {
  children: React.ReactNode
}) {
  return (
    <html lang="fa" dir="rtl">
      <body className="bg-white text-gray-900 min-h-screen">
        <div className="flex">
          <Sidebar />
          <div className="flex-1 min-w-0">
            <Navbar />
            <main className="pb-10 lg:pb-0">{children}</main>
          </div>
        </div>
        <MobileNav />
      </body>
    </html>
  )
}