import { NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'
import { getCurrentUser } from '@/lib/auth'

export async function GET(
    request: Request,
    { params }: { params: Promise<{ id: string }> }
) {
    try {
        const { id } = await params
        const user = await getCurrentUser()
        const cacheControl = user
            ? 'private, no-store'
            : 'public, max-age=60, stale-while-revalidate=120'

        const currentPin = await prisma.pin.findUnique({
            where: { id },
            select: { title: true, userId: true },
        })

        if (!currentPin) {
            return NextResponse.json(
                { error: 'پین یافت نشد' },
                { status: 404 }
            )
        }

        const keywords = currentPin.title
            .split(/[\s،,._\-()!؟?]+/)
            .filter((w) => w.length >= 3)
            .slice(0, 3)

        const pins = await prisma.pin.findMany({
            where: {
                id: { not: id },
                OR: [
                    ...keywords.map((k) => ({
                        title: { contains: k },
                    })),
                    { userId: currentPin.userId },
                ],
            },
            orderBy: { createdAt: 'desc' },
            take: 20,
            include: {
                saves: { include: { board: true } },
                // 🔄 جدید
                reports: { select: { reporterId: true } },
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
                imageWidth: pin.imageWidth,
                imageHeight: pin.imageHeight,
                createdAt: pin.createdAt,
                updatedAt: pin.updatedAt,
                userId: pin.userId,
                isOwner: false,
                isSavedByMe: userSaves.length > 0,
                isReportedByMe: user
                    ? pin.reports.some((r) => r.reporterId === user.id)
                    : false,
                savedBoards: userSaves.map((s) => ({
                    boardId: s.boardId,
                    boardName: s.board?.name || null,
                })),
            }
        })

        return NextResponse.json(
            { pins: pinsWithMeta },
            {
                headers: {
                    'Cache-Control': cacheControl,
                },
            }
        )
    } catch (error) {
        console.error('GET /api/pins/[id]/related error:', error)
        return NextResponse.json(
            { error: 'خطا در دریافت پین‌های مرتبط' },
            { status: 500 }
        )
    }
}