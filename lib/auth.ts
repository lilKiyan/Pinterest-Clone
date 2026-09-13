import { SignJWT, jwtVerify } from 'jose'
import { cookies } from 'next/headers'
import { prisma } from './prisma'
import bcrypt from 'bcryptjs'

const getJwtSecret = () => {
    const secret = process.env.JWT_SECRET
    if (!secret) {
        throw new Error('JWT_SECRET is not defined in environment variables')
    }
    return new TextEncoder().encode(secret)
}

export const COOKIE_NAME = 'auth_token'

export async function hashPassword(password: string) {
    const salt = await bcrypt.genSalt(10)
    return bcrypt.hash(password, salt)
}

export async function comparePassword(password: string, hashedPassword: string) {
    return bcrypt.compare(password, hashedPassword)
}

// ✅ تابع ساخت توکن (حالا async شده)
export async function signToken(userId: string): Promise<string> {
    return new SignJWT({ userId })
        .setProtectedHeader({ alg: 'HS256' })
        .setExpirationTime('7d')
        .sign(getJwtSecret())
}

// ✅ تابع بررسی توکن (حالا async شده و از jose استفاده می‌کنه)
export async function verifyToken(token: string): Promise<{ userId: string } | null> {
    try {
        const { payload } = await jwtVerify(token, getJwtSecret())
        return payload as { userId: string }
    } catch {
        return null
    }
}

export async function getCurrentUser() {
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
        },
    })

    return user
}