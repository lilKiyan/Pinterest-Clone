import { NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'
import { getCurrentUser } from '@/lib/auth'

export async function GET() {
    try {
        const user = await getCurrentUser()

        if (!user) {
            return NextResponse.json({ count: 0 }, { status: 401 })
        }

        const data = await prisma.user.findUnique({
            where: { id: user.id },
            select: { unreadNotifications: true },
        })

        return NextResponse.json({ count: data?.unreadNotifications ?? 0 })
    } catch (error) {
        console.error('GET /api/notifications/count error:', error)
        return NextResponse.json({ count: 0 }, { status: 500 })
    }
}