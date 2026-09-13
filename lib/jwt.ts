import { SignJWT, jwtVerify } from 'jose'

export const COOKIE_NAME = 'auth_token'

function getJwtSecret(): Uint8Array {
    const secret = process.env.JWT_SECRET
    if (!secret) throw new Error('JWT_SECRET is not defined')
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