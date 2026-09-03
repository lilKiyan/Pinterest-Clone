import { NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'
import { getCurrentUser } from '@/lib/auth'

export async function POST(
    request: Request,
    { params }: { params: Promise<{ id: string }> }
) {
    try {
        const user = await getCurrentUser()

        if (!user) {
            return NextResponse.json(
                { error: 'برای لایک وارد شوید' },
                { status: 401 }
            )
        }

        const { id } = await params

        // بررسی وجود پین
        const pin = await prisma.pin.findUnique({ where: { id } })
        if (!pin) {
            return NextResponse.json(
                { error: 'پین یافت نشد' },
                { status: 404 }
            )
        }

        // پیدا کردن لایک قبلی کاربر
        const existingLike = await prisma.like.findFirst({
            where: {
                userId: user.id,
                pinId: id,
            },
        })

        let isLiked: boolean

        if (existingLike) {
            // حذف لایک
            await prisma.like.delete({
                where: { id: existingLike.id },
            })
            isLiked = false
        } else {
            // ثبت لایک
            await prisma.like.create({
                data: {
                    userId: user.id,
                    pinId: id,
                },
            })
            isLiked = true
        }

        const totalLikes = await prisma.like.count({
            where: { pinId: id },
        })

        return NextResponse.json({ isLiked, totalLikes })
    } catch (error) {
        console.error('POST /api/pins/[id]/like error:', error)
        return NextResponse.json(
            { error: 'خطا در لایک' },
            { status: 500 }
        )
    }
}