import { NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'
import { getCurrentUser } from '@/lib/auth'

// دریافت کامنت‌های یک پین
export async function GET(
    request: Request,
    { params }: { params: Promise<{ id: string }> }
) {
    try {
        const { id } = await params
        const comments = await prisma.comment.findMany({
            where: { pinId: id },
            orderBy: { createdAt: 'desc' },
            include: {
                user: {
                    select: {
                        id: true,
                        name: true,
                        username: true,
                        avatar: true,
                    },
                },
            },
        })

        return NextResponse.json({ comments })
    } catch (error) {
        console.error('GET /api/pins/[id]/comments error:', error)
        return NextResponse.json(
            { error: 'خطا در دریافت کامنت‌ها' },
            { status: 500 }
        )
    }
}

// افزودن کامنت جدید
export async function POST(
    request: Request,
    { params }: { params: Promise<{ id: string }> }
) {
    try {
        const user = await getCurrentUser()

        if (!user) {
            return NextResponse.json(
                { error: 'برای ثبت کامنت وارد شوید' },
                { status: 401 }
            )
        }

        const { id } = await params
        const body = await request.json()
        const { content } = body

        if (!content || !content.trim()) {
            return NextResponse.json(
                { error: 'متن کامنت نمی‌تواند خالی باشد' },
                { status: 400 }
            )
        }

        const pin = await prisma.pin.findUnique({ where: { id } })
        if (!pin) {
            return NextResponse.json(
                { error: 'پین یافت نشد' },
                { status: 404 }
            )
        }

        const newComment = await prisma.comment.create({
            data: {
                content: content.trim(),
                userId: user.id,
                pinId: id,
            },
            include: {
                user: {
                    select: {
                        id: true,
                        name: true,
                        username: true,
                        avatar: true,
                    },
                },
            },
        })

        return NextResponse.json({ comment: newComment }, { status: 201 })
    } catch (error) {
        console.error('POST /api/pins/[id]/comments error:', error)
        return NextResponse.json(
            { error: 'خطا در ثبت کامنت' },
            { status: 500 }
        )
    }
}