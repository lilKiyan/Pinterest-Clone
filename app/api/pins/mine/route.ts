import { NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'
import { getCurrentUser } from '@/lib/auth'   // ← اضافه شود

export async function GET() {
    try {
        const user = await getCurrentUser()

        if (!user) {
            return NextResponse.json(
                { error: 'برای مشاهده پین‌های خود وارد شوید' },
                { status: 401 }
            )
        }

        const pins = await prisma.pin.findMany({
            where: { userId: user.id },
            orderBy: { createdAt: 'desc' },
            include: {
                saves: {
                    where: { userId: user.id },
                    include: { board: true },
                },
            },
        })

        const myPins = pins.map((pin) => {
            const userSaves = pin.saves
            return {
                id: pin.id,
                title: pin.title,
                description: pin.description,
                imageUrl: pin.imageUrl,
                createdAt: pin.createdAt,
                updatedAt: pin.updatedAt,
                userId: pin.userId,
                isOwner: true,
                isSavedByMe: userSaves.length > 0,
                savedBoards: userSaves.map((s) => ({
                    boardId: s.boardId,
                    boardName: s.board?.name || null,
                })),
            }
        })

        return NextResponse.json(myPins)
    } catch (error) {
        console.error('GET /api/pins/mine error:', error)
        return NextResponse.json(
            { error: 'خطا در دریافت پین‌های من' },
            { status: 500 }
        )
    }
}