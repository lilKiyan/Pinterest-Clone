import { NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'
import { hashPassword, signToken, COOKIE_NAME } from '@/lib/auth'
import { cookies } from 'next/headers'

export async function POST(request: Request) {
    try {
        // ۱. گرفتن داده‌های ارسال‌شده از فرم
        const body = await request.json()
        const { email, username, name, password } = body

        // ۲. اعتبارسنجی ساده
        if (!email || !username || !name || !password) {
            return NextResponse.json(
                { error: 'همه فیلد ها الزامی است' },
                { status: 400 }
            )
        }
        // ۳. بررسی اینکه کاربر با این ایمیل یا نام کاربری وجود نداشته باشه
        const existingUser = await prisma.user.findFirst({
            where: { OR: [{ email }, { username }] }
        })

        if (existingUser) {
            return NextResponse.json(
                { error: 'کاربری با این ایمیل یا نام کاربری وجود دارد' },
                { status: 409 }
            )
        }
        // ۴. هش کردن رمز عبور
        const hashedPassword = await hashPassword(password)
        // ۵. ساخت کاربر جدید در دیتابیس
        const newUser = await prisma.user.create({
            data: {
                email,
                username,
                name,
                password: hashedPassword,
            }
        })

        // ۶. ساخت توکن JWT
        const token = signToken(newUser.id)
        // ۷. ذخیره توکن در کوکی httpOnly
        const cookieStore = await cookies()
        cookieStore.set(COOKIE_NAME, token, {
            httpOnly: true,
            path: '/',
            maxAge: 60 * 60 * 24 * 7, // یک هفته
            sameSite: 'lax',
        })

        // ۸. برگرداندن اطلاعات کاربر (بدون رمز)
        return NextResponse.json(
            {
                user: {
                    id: newUser.id,
                    email: newUser.email,
                    username: newUser.username,
                    name: newUser.name,
                },
            },
            { status: 201 }
        )
    } catch (error) {
        console.error('POST /api/auth/register error:', error)
        return NextResponse.json(
            { error: 'خطا در ثبت‌نام' },
            { status: 500 }
        )
    }
}