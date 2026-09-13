import { NextResponse } from 'next/server'
import { verifyToken, COOKIE_NAME } from '@/lib/jwt' 

// ✅ تابع رو async کن
export async function proxy(request: Request) {
    // ۱. استخراج توکن از Cookie
    const cookieHeader = request.headers.get('cookie') || ''
    const token = cookieHeader
        .split('; ')
        .find((c) => c.startsWith(`${COOKIE_NAME}=`))
        ?.split('=')[1]

    // ۲. بررسی معتبر بودن توکن (چون async شده، await لازمه)
    const isLoggedIn = token ? !!(await verifyToken(token)) : false // ✅ await

    // ۳. صفحاتی که نیاز به ورود دارن
    const url = new URL(request.url)
    const isProtected =
        url.pathname.startsWith('/myboards') ||
        url.pathname === '/create' ||
        url.pathname === '/profile'

    // ۴. اگر صفحه محافظت‌شده و کاربر لاگین نبود → برو به /login
    if (isProtected && !isLoggedIn) {
        return NextResponse.redirect(new URL('/login', request.url))
    }

    // ۵. در غیر این صورت، ادامه بده
    return NextResponse.next()
}

// ✅ /profile رو هم به matcher اضافه کن
export const config = {
    matcher: ['/myboards/:path*', '/create', '/profile'],
}