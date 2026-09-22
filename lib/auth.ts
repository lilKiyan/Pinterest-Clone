// lib/auth.ts
import { cookies } from 'next/headers'
import { prisma } from './prisma'
import bcrypt from 'bcryptjs'
import { verifyToken, COOKIE_NAME } from './jwt'

// ✅ دوباره صادر کردن برای اینکه فایل‌های دیگه‌ای که از auth.ts ایمپورت می‌کنن، به مشکل نخورن
export { signToken, verifyToken, COOKIE_NAME } from './jwt'

export async function hashPassword(password: string) {
    const salt = await bcrypt.genSalt(10)
    return bcrypt.hash(password, salt)
}

export async function comparePassword(password: string, hashedPassword: string) {
    return bcrypt.compare(password, hashedPassword)
}

export async function getCurrentUser() {
    try {
        const cookieStore = await cookies()
        const token = cookieStore.get(COOKIE_NAME)?.value
        if (!token) return null

        const payload = await verifyToken(token)
        if (!payload) return null

        const user = await prisma.user.findUnique({
            where: { id: payload.userId },
            select: {
                id: true,
                email: true,
                username: true,
                name: true,
                avatar: true,
                bio: true,
                unreadNotifications: true,
            },
        })

        return user
    } catch (error) {
        console.error('getCurrentUser error:', error)
        return null  // ✅ به جای کرش، null برگردون
    }
}