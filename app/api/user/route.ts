import { NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'
import { getCurrentUser, hashPassword, comparePassword } from '@/lib/auth'

export async function PATCH(request: Request) {
    try {
        const authUser = await getCurrentUser()

        if (!authUser) {
            return NextResponse.json(
                { error: 'برای ویرایش پروفایل وارد شوید' },
                { status: 401 }
            )
        }

        // دریافت کاربر کامل همراه با password
        const user = await prisma.user.findUnique({
            where: { id: authUser.id },
        })

        if (!user) {
            return NextResponse.json(
                { error: 'کاربر یافت نشد' },
                { status: 404 }
            )
        }

        const body = await request.json()
        const {
            name,
            username,
            email,
            bio,
            avatar,
            oldPassword,
            newPassword,
        } = body

        // بررسی یکتایی ایمیل و نام کاربری
        if (email && email !== user.email) {
            const existingEmail = await prisma.user.findUnique({ where: { email } })
            if (existingEmail) {
                return NextResponse.json(
                    { error: 'این ایمیل قبلاً استفاده شده است' },
                    { status: 409 }
                )
            }
        }

        if (username && username !== user.username) {
            const existingUsername = await prisma.user.findUnique({ where: { username } })
            if (existingUsername) {
                return NextResponse.json(
                    { error: 'این نام کاربری قبلاً استفاده شده است' },
                    { status: 409 }
                )
            }
        }

        // بررسی و تغییر رمز عبور
        let newPasswordHash: string | undefined
        if (oldPassword || newPassword) {
            if (!oldPassword || !newPassword) {
                return NextResponse.json(
                    { error: 'برای تغییر رمز عبور، رمز فعلی و رمز جدید را وارد کنید' },
                    { status: 400 }
                )
            }

            const isPasswordValid = await comparePassword(oldPassword, user.password)
            if (!isPasswordValid) {
                return NextResponse.json(
                    { error: 'رمز عبور فعلی اشتباه است' },
                    { status: 400 }
                )
            }

            newPasswordHash = await hashPassword(newPassword)
        }

        // به‌روزرسانی کاربر
        const updatedUser = await prisma.user.update({
            where: { id: user.id },
            data: {
                name: name ?? user.name,
                username: username ?? user.username,
                email: email ?? user.email,
                bio: bio !== undefined ? bio : user.bio,
                avatar: avatar !== undefined ? avatar : user.avatar,
                ...(newPasswordHash ? { password: newPasswordHash } : {}),
            },
            select: {
                id: true,
                email: true,
                username: true,
                name: true,
                avatar: true,
                bio: true,
            },
        })

        return NextResponse.json({ user: updatedUser })
    } catch (error) {
        console.error('PATCH /api/user error:', error)
        return NextResponse.json(
            { error: 'خطا در ویرایش پروفایل' },
            { status: 500 }
        )
    }
}