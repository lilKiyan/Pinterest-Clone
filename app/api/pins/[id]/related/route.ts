import { NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'
import { getCurrentUser } from '@/lib/auth'

export async function GET(request: Request, { params }: { params: Promise<{ id: string }> }) {
    try {
        const { id } = await params
        const user = await getCurrentUser()

        const pin = await prisma.pin.findUnique({
            where: { id },
            select: { userId: true },
        })

        if (!pin) {
            return NextResponse.json(
                { error: 'پین یافت نشد' },
                { status: 404 }
            )
        }

        const relatedPins = await prisma.pin.findMany({
            where: {
                userId: pin.userId,
                NOT: { id },
            },
            orderBy: { createdAt: 'desc' },
            take: 12,
            include: {
                saves: {
                    include: { board: true },
                },
            },
        })

        // تبدیل به ساختار مشابه PinCard
        const pinsWithMeta = relatedPins.map((p) => {
            const userSaves = user
                ? p.saves.filter((s) => s.userId === user.id)
                : []
            return {
                id: p.id,
                title: p.title,
                description: p.description,
                imageUrl: p.imageUrl,
                createdAt: p.createdAt,
                updatedAt: p.updatedAt,
                userId: p.userId,
                isOwner: user ? p.userId === user.id : false,
                isSavedByMe: userSaves.length > 0,
                savedBoards: userSaves.map((s) => ({
                    boardId: s.boardId,
                    boardName: s.board?.name || null,
                })),
            }
        })

        return NextResponse.json({ pins: pinsWithMeta })
    } catch (error) {
        console.error('GET /api/pins/[id]/related error:', error)
        return NextResponse.json(
            { error: 'خطا در دریافت پین‌های مرتبط' },
            { status: 500 }
        )
    }
}