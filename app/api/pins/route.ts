import { NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'
import { getCurrentUser } from '@/lib/auth'

export async function GET(request: Request) {
    try {
        const user = await getCurrentUser()

        const { searchParams } = new URL(request.url)
        const page = Number(searchParams.get('page') || '1')
        const limit = Number(searchParams.get('limit') || '12')
        const skip = (page - 1) * limit

        const [pins, totalCount] = await Promise.all([
            prisma.pin.findMany({
                orderBy: { createdAt: 'desc' },
                skip,
                take: limit,
                include: {
                    saves: {
                        include: { board: true },
                    },
                },
            }),
            prisma.pin.count(),
        ])

        const pinsWithMeta = pins.map((pin) => {
            // همه‌ی ذخیره‌های این کاربر روی این پین
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
                isOwner: false,
                isSavedByMe: userSaves.length > 0,
                savedBoards: userSaves.map((s) => ({
                    boardId: s.boardId,
                    boardName: s.board?.name || null,
                })),
            }
        })

        const hasMore = skip + pins.length < totalCount

        return NextResponse.json({ pins: pinsWithMeta, hasMore })
    } catch (error) {
        console.error('GET /api/pins error:', error)
        return NextResponse.json(
            { error: 'خطا در دریافت پین‌ها' },
            { status: 500 }
        )
    }
}

export async function POST(request: Request) {
    try {
        const user = await getCurrentUser()

        if (!user) {
            return NextResponse.json(
                { error: 'برای ساخت پین باید وارد شوید' },
                { status: 401 }
            )
        }

        const body = await request.json()
        const { title, description, imageUrl, boardId } = body

        if (!title || !imageUrl) {
            return NextResponse.json(
                { error: 'عنوان و تصویر الزامی است' },
                { status: 400 }
            )
        }

        const newPin = await prisma.pin.create({
            data: {
                title: title.trim(),
                description: description?.trim() || '',
                imageUrl,
                userId: user.id,
                boardId: boardId || null,
            },
        })

        return NextResponse.json(newPin, { status: 201 })
    } catch (error) {
        console.error('POST /api/pins error:', error)
        return NextResponse.json(
            { error: 'خطا در ساخت پین' },
            { status: 500 }
        )
    }
}