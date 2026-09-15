import { NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'
import { getCurrentUser } from '@/lib/auth'

export async function GET() {
    try {
        const user = await getCurrentUser()
        if (!user) {
            return NextResponse.json({ count: 0 }, { status: 401 })
        }

        const count = await prisma.message.count({
            where: {
                isRead: false,
                senderId: { not: user.id },
                conversation: {
                    participants: { some: { userId: user.id } },
                },
            },
        })

        return NextResponse.json({ count })
    } catch (error) {
        console.error('GET /api/notifications/unread-count error:', error)
        return NextResponse.json({ count: 0 }, { status: 500 })
    }
}