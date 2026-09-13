// lib/jwt.ts
// ⚠️ این فایل فقط برای Edge Runtime طراحی شده
// پس نباید هیچ کتابخانه‌ی Node.js مثل prisma یا bcryptjs رو ایمپورت کنه

import { SignJWT, jwtVerify } from 'jose'

export const COOKIE_NAME = 'auth_token'

function getJwtSecret(): Uint8Array {
    const secret = process.env.JWT_SECRET
    if (!secret) {
        throw new Error('JWT_SECRET is not defined in environment variables')
    }
    return new TextEncoder().encode(secret)
}

export async function signToken(userId: string): Promise<string> {
    return new SignJWT({ userId })
        .setProtectedHeader({ alg: 'HS256' })
        .setExpirationTime('7d')
        .sign(getJwtSecret())
}

export async function verifyToken(token: string): Promise<{ userId: string } | null> {
    try {
        const { payload } = await jwtVerify(token, getJwtSecret())
        return payload as { userId: string }
    } catch {
        return null
    }
}