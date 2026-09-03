import './globals.css'
import Sidebar from './components/Sidebar'
import Navbar from './components/Navbar'

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
            <main>{children}</main>
          </div>
        </div>
      </body>
    </html>
  )
}