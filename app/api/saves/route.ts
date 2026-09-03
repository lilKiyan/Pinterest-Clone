import { NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'
import { getCurrentUser } from '@/lib/auth'

export async function POST(request: Request) {
    try {
        const user = await getCurrentUser()

        if (!user) {
            return NextResponse.json(
                { error: 'برای ذخیره پین وارد شوید' },
                { status: 401 }
            )
        }

        const body = await request.json()
        const { pinId, boardId } = body

        if (!pinId || !boardId) {
            return NextResponse.json(
                { error: 'شناسه پین و برد الزامی است' },
                { status: 400 }
            )
        }

        const board = await prisma.board.findUnique({
            where: { id: boardId },
        })


        if (!board) {
            return NextResponse.json(
                { error: 'برد یافت نشد' },
                { status: 404 }
            )
        }

        if (board.userId !== user.id) {
            return NextResponse.json(
                { error: 'شما مالک این برد نیستید' },
                { status: 403 }
            )
        }
        
        // بررسی اینکه قبلاً این پین در این برد ذخیره نشده باشد
        const existingSave = await prisma.save.findFirst({
            where: {
                userId: user.id,
                pinId,
                boardId,
            },
        })

        if (existingSave) {
            return NextResponse.json(
                { error: 'این پین قبلاً در این برد ذخیره شده است' },
                { status: 409 }
            )
        }

        const newSave = await prisma.save.create({
            data: {
                userId: user.id,
                pinId,
                boardId,
            },
        })

        return NextResponse.json(newSave, { status: 201 })
    } catch (error) {
        console.error('POST /api/saves error:', error)
        return NextResponse.json(
            { error: 'خطا در ذخیره پین' },
            { status: 500 }
        )
    }
}

export async function GET() {
    try {
        const user = await getCurrentUser()

        if (!user) {
            return NextResponse.json(
                { error: 'برای مشاهده پین‌های ذخیره‌شده وارد شوید' },
                { status: 401 }
            )
        }

        const saves = await prisma.save.findMany({
            where: { userId: user.id },
            include: {
                pin: true,
                board: true,
            },
            orderBy: { createdAt: 'desc' },
        })

        // گروه‌بندی بر اساس pinId
        const pinMap = new Map<string, any>()

        saves.forEach((save) => {
            const pinId = save.pinId
            if (!pinMap.has(pinId)) {
                pinMap.set(pinId, {
                    id: save.pin.id,
                    title: save.pin.title,
                    description: save.pin.description,
                    imageUrl: save.pin.imageUrl,
                    createdAt: save.pin.createdAt,
                    updatedAt: save.pin.updatedAt,
                    userId: save.pin.userId,
                    isOwner: save.pin.userId === user.id,
                    isSavedByMe: true,
                    savedBoards: [],
                })
            }
            pinMap.get(pinId).savedBoards.push({
                boardId: save.boardId,
                boardName: save.board?.name || null,
            })
        })

        const pins = Array.from(pinMap.values())

        return NextResponse.json(pins)
    } catch (error) {
        console.error('GET /api/saves error:', error)
        return NextResponse.json(
            { error: 'خطا در دریافت پین‌های ذخیره‌شده' },
            { status: 500 }
        )
    }
}


export async function DELETE(request: Request) {
    try {
        const user = await getCurrentUser()

        if (!user) {
            return NextResponse.json(
                { error: 'برای ذخیره وارد شوید' },
                { status: 401 },
            )
        }

        const body = await request.json()
        const { pinId, boardId } = body

        if (!pinId || !boardId) {
            return NextResponse.json(
                { error: 'شناسه پین و برد الزامی است' },
                { status: 400 }
            )
        }

        const existingSave = await prisma.save.findFirst({
            where: {
                userId: user.id,
                pinId,
                boardId,
            },
        })

        if (!existingSave) {
            return NextResponse.json(
                { error: 'این پین در این برد ذخیره نشده است' },
                { status: 404 }
            )
        }

        await prisma.save.delete({
            where: { id: existingSave.id },
        })

        return NextResponse.json({ success: true, message: 'ذخیره حذف شد' })
    } catch (error) {
        console.error('DELETE /api/saves error:', error)
        return NextResponse.json(
            { error: 'خطا در حذف ذخیره' },
            { status: 500 }
        )
    }
}