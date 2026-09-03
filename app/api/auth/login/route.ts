import { NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'
import { comparePassword, signToken, COOKIE_NAME } from '@/lib/auth'
import { cookies } from 'next/headers'

export async function POST(request: Request) {
    try {
        // ۱. دریافت اطلاعات ورود از فرم
        const body = await request.json()
        const { email, password } = body

        if (!email || !password) {
            return NextResponse.json(
                { error: 'ایمیل و رمز عبور الزامی است' },
                { status: 400 }
            )
        }

        // ۳. پیدا کردن کاربر با ایمیل
        const user = await prisma.user.findFirst({
            where: { email },
        })

        if (!user) {
            return NextResponse.json(
                { error: 'ایمیل یا رمز عبور اشتباه است' },
                { status: 401 }
            )
        }

        // ۵. مقایسه رمز واردشده با هش ذخیره‌شده
        const isPasswordValid = await comparePassword(password, user.password)
        if (!isPasswordValid) {
            return NextResponse.json(
                { error: 'ایمیل یا رمز عبور اشتباه است' },
                { status: 401 }
            )
        }

        // ۶. ساخت توکن JWT
        const token = signToken(user.id)

        // ۷. ذخیره توکن در کوکی
        const cookieStore = await cookies()
        cookieStore.set(COOKIE_NAME, token, {
            httpOnly: true,
            path: '/',
            maxAge: 60 * 60 * 24 * 7, // 7 روز
            sameSite: 'lax',
        })

        // ۸. برگرداندن اطلاعات کاربر
        return NextResponse.json({
            user: {
                id: user.id,
                email: user.email,
                username: user.username,
                name: user.name,
            },
        })

    } catch (error) {
        console.error('POST /api/auth/login error:', error)
        return NextResponse.json(
            { error: 'خطا در ورود' },
            { status: 500 }
        )
    }
}