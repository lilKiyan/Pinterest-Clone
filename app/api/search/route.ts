import { NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'
import { getCurrentUser } from '@/lib/auth'

export async function GET(request: Request) {
    try {
        const user = await getCurrentUser()
        const { searchParams } = new URL(request.url)
        const q = searchParams.get('q')?.trim() || ''

        if (!q) {
            return NextResponse.json({ pins: [] })
        }

        const pins = await prisma.pin.findMany({
            where: {
                OR: [
                    { title: { contains: q } },
                    { description: { contains: q } },
                ],
            },
            orderBy: { createdAt: 'desc' },
            take: 50,
            include: {
                saves: {
                    include: { board: true },
                },
            },
        })

        const pinsWithMeta = pins.map((pin) => {
            const userSaves = user
                ? pin.saves.filter((s) => s.userId === user.id)
                : []

            return {
                id: pin.id,
                title: pin.title,
                description: pin.description,
                imageUrl: pin.imageUrl,
                createdAt: pin.createdAt,
                updatedAt: pin.updatedAt,
                userId: pin.userId,
                isOwner: user ? pin.userId === user.id : false,
                isSavedByMe: userSaves.length > 0,
                savedBoards: userSaves.map((s) => ({
                    boardId: s.boardId,
                    boardName: s.board?.name || null,
                })),
            }
        })

        return NextResponse.json({ pins: pinsWithMeta })
    } catch (error) {
        console.error('GET /api/search error:', error)
        return NextResponse.json(
            { error: 'خطا در جستجو' },
            { status: 500 }
        )
    }
}