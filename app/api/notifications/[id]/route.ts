import { NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'
import { getCurrentUser } from '@/lib/auth'

export async function DELETE(
    request: Request,
    { params }: { params: Promise<{ id: string }> }
) {
    try {
        const { id } = await params
        const user = await getCurrentUser()

        if (!user) {
            return NextResponse.json(
                { error: 'برای حذف اعلان وارد شوید' },
                { status: 401 }
            )
        }

        // ✅ دو هدف در یک query: پیدا کردن + چک مالکیت
        const notification = await prisma.notification.findFirst({
            where: {
                id,
                userId: user.id,   // ضد-IDOR
            },
            select: { isRead: true },
        })

        if (!notification) {
            return NextResponse.json(
                { error: 'اعلان یافت نشد' },
                { status: 404 }
            )
        }

        // ✅ حذف + اصلاح شمارنده در یک تراکنش — فقط اگر نخوانده بود
        // ✅ حذف + اصلاح شمارنده در یک تراکنش — فقط اگر نخوانده بود
        await prisma.$transaction(async (tx) => {
            await tx.notification.delete({
                where: { id },
            })

            // فقط اگر نخوانده بود → شمارنده کم می‌شود
            if (!notification.isRead) {
                await tx.user.update({
                    where: { id: user.id },
                    data: { unreadNotifications: { decrement: 1 } },
                })
            }
        })

        return NextResponse.json({ message: 'اعلان حذف شد' })
    } catch (error) {
        console.error('DELETE /api/notifications/[id] error:', error)
        return NextResponse.json(
            { error: 'خطا در حذف اعلان' },
            { status: 500 }
        )
    }
}