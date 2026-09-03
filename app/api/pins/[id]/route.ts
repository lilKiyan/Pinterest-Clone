import { NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'
import { getCurrentUser } from '@/lib/auth'
import { includes } from 'zod'

export async function PATCH(
    request: Request,
    { params }: { params: Promise<{ id: string }> }
) {
    try {
        const { id } = await params
        const user = await getCurrentUser()

        if (!user) {
            return NextResponse.json(
                { error: 'برای ویرایش پین وارد شوید' },
                { status: 401 }
            )
        }

        const pin = await prisma.pin.findUnique({ where: { id } })

        if (!pin) {
            return NextResponse.json(
                { error: 'پین یافت نشد' },
                { status: 404 }
            )
        }

        if (pin.userId !== user.id) {
            return NextResponse.json(
                { error: 'شما مالک این پین نیستید' },
                { status: 403 }
            )
        }

        const body = await request.json()
        const updatedPin = await prisma.pin.update({
            where: { id },
            data: {
                title: body.title ?? pin.title,
                description: body.description ?? pin.description,
            },
        })

        return NextResponse.json(updatedPin)
    } catch (error) {
        console.error('PATCH /api/pins/[id] error:', error)
        return NextResponse.json(
            { error: 'خطا در ویرایش پین' },
            { status: 500 }
        )
    }
}

export async function DELETE(
    request: Request,
    { params }: { params: Promise<{ id: string }> }
) {
    try {
        const { id } = await params
        const user = await getCurrentUser()

        if (!user) {
            return NextResponse.json(
                { error: 'برای حذف پین وارد شوید' },
                { status: 401 }
            )
        }

        const pin = await prisma.pin.findUnique({ where: { id } })

        if (!pin) {
            return NextResponse.json(
                { error: 'پین یافت نشد' },
                { status: 404 }
            )
        }

        if (pin.userId !== user.id) {
            return NextResponse.json(
                { error: 'شما مالک این پین نیستید' },
                { status: 403 }
            )
        }

        // حذف وابستگی‌ها
        await prisma.save.deleteMany({ where: { pinId: id } })
        await prisma.like.deleteMany({ where: { pinId: id } })
        await prisma.comment.deleteMany({ where: { pinId: id } })

        // حذف خود پین
        await prisma.pin.delete({ where: { id } })

        return NextResponse.json({ message: 'پین حذف شد' })
    } catch (error) {
        console.error('DELETE /api/pins/[id] error:', error)
        return NextResponse.json(
            { error: 'خطا در حذف پین' },
            { status: 500 }
        )
    }
}

export async function GET(
    request: Request,
    { params }: { params: Promise<{ id: string }> }
) {
    try {
        const { id } = await params
        const user = await getCurrentUser()

        const pin = await prisma.pin.findUnique({
            where: { id },
            include: {
                user: {
                    select: {
                        id: true,
                        username: true,
                        name: true,
                        avatar: true,
                    },
                },
                saves: {
                    include: {
                        board: true,
                    },
                },
                likes: true,
                comments: true,
            },
        })

        if (!pin) {
            return NextResponse.json(
                { error: 'پین یافت نشد' },
                { status: 404 }
            )
        }

        const userSaves = user ? pin.saves.filter((s) => s.userId === user.id) : []

        const pinData = {
            id: pin.id,
            title: pin.title,
            description: pin.description,
            imageUrl: pin.imageUrl,
            link: pin.link,
            createdAt: pin.createdAt,
            updatedAt: pin.updatedAt,
            userId: pin.userId,
            owner: {
                id: pin.user.id,
                username: pin.user.username,
                name: pin.user.name,
                avatar: pin.user.avatar,
            },
            isOwner: user ? pin.userId === user.id : false,
            isSavedByMe: userSaves.length > 0,
            savedBoards: userSaves.map((s) => ({
                boardId: s.boardId,
                boardName: s.board?.name || null,
            })),
            totalSaves: pin.saves.length,
            totalLikes: pin.likes.length,
            totalComments: pin.comments.length,
            isLikedByMe: user ? pin.likes.some((l) => l.userId === user.id) : false,
        }

        return NextResponse.json({ pin: pinData })
    } catch (error) {
        console.error('GET /api/pins/[id] error:', error)
        return NextResponse.json(
            { error: 'خطا در دریافت پین' },
            { status: 500 }
        )
    }
}