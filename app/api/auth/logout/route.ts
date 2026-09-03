import { NextResponse } from 'next/server'
import { cookies } from 'next/headers'
import { COOKIE_NAME } from '@/lib/auth'

export async function POST() {
    // پاک کردن کوکی توکن
    const cookieStore = await cookies()
    cookieStore.delete(COOKIE_NAME)

    return NextResponse.json({ success: true })
}